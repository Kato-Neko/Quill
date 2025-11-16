import { useState, useEffect } from "react"
import { ArrowLeft, Save, Archive, Trash2, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Link, useParams, useNavigate } from "react-router-dom"
import { useWallet } from "@/contexts/WalletContext"
// removed top dropdown menu
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import TodoList from "@/components/TodoList"

const categories = ["Work", "Personal", "Learning", "Ideas", "Shopping"]

export default function NotePage() {
  const params = useParams()
  const navigate = useNavigate()
  const noteId = params.id
  const { recordNoteCreate, recordNoteUpdate, recordNoteDelete } = useWallet()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("Personal")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteType, setNoteType] = useState("text") // legacy flag; both sections visible now
  const [todos, setTodos] = useState([])
  const [showChecklist, setShowChecklist] = useState(false)

  // API base URL - adjust this to your backend URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

  useEffect(() => {
    if (noteId) {
      // Fetch existing note for editing
      fetchNote()
    }
  }, [noteId])

// Auto-save after 5s of inactivity (new and existing notes)
useEffect(() => {
  const debounce = setTimeout(() => {
    if (!title.trim()) return
    const hasText = content && content.trim().length > 0
    const hasTodos = Array.isArray(todos) && todos.length > 0
    if (!hasText && !hasTodos) return
    handleSave({ silent: true })
  }, 5000)

  return () => clearTimeout(debounce)
}, [title, content, JSON.stringify(todos), category])

  const fetchNote = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}`)
      if (!response.ok) throw new Error('Failed to fetch note')
      const note = await response.json()

      setTitle(note.title || "")
      setCategory(note.category || "Personal")
      setContent(note.content || "")
      const incomingTodos = Array.isArray(note.todos) ? note.todos : []
      setTodos(incomingTodos)
      setShowChecklist(incomingTodos.length > 0)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching note:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (options = { silent: false }) => {
    if (!title.trim()) {
      setError("Title cannot be empty")
      return
    }

    // Allow save if either content or checklist has data
    const hasText = content && content.trim().length > 0
    const hasTodos = Array.isArray(todos) && todos.length > 0
    if (!hasText && !hasTodos) {
      setError("Add text or at least one checklist item")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Prepare payload: include both content and todos when present
      const noteData = {
        title: title.trim(),
        content: hasText ? content.trim() : null,
        category: category || null,
        todos: hasTodos ? todos : null
      }

      // Use single notes endpoint in hybrid model
      const baseEndpoint = "notes"
      const url = noteId 
        ? `${API_BASE_URL}/${baseEndpoint}/${noteId}` 
        : `${API_BASE_URL}/${baseEndpoint}`
      
      const method = noteId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const saved = await response.json().catch(() => null)
      const savedId = saved && (saved.id || saved.note?.id)
      const savedTitle = saved && (saved.title || saved.note?.title) || title.trim()

      // Record transaction for note operation
      if (!noteId) {
        // New note created
        if (savedId) {
          recordNoteCreate(savedId, savedTitle)
        }
      } else {
        // Existing note updated
        recordNoteUpdate(noteId, savedTitle)
      }

      // Success
      if (options.silent) {
        // If we created a new note silently, redirect to its edit page for subsequent auto-saves
        if (!noteId && savedId) {
          navigate(`/note/${savedId}`, { replace: true })
        }
      } else {
        navigate("/")
      }
    } catch (err) {
      setError(err.message)
      console.error('Error saving note:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = () => {
    if (!noteId) return
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!noteId) return

    try {
      setLoading(true)
      
      // Record transaction before deleting (we need the title)
      const noteTitle = title.trim() || "Untitled Note"
      recordNoteDelete(noteId, noteTitle)
      
      // Use single notes endpoint in hybrid model
      const baseEndpoint = "notes"
      const response = await fetch(`${API_BASE_URL}/${baseEndpoint}/${noteId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete note')
      }

      // Success - navigate back to notes list
      navigate("/")
    } catch (err) {
      setError(err.message)
      console.error('Error deleting note:', err)
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleArchive = async () => {
    if (!noteId) return

    try {
      setLoading(true)
      
      // Use single notes endpoint in hybrid model
      const baseEndpoint = "notes"
      const response = await fetch(`${API_BASE_URL}/${baseEndpoint}/${noteId}/archive`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to archive note')
      }

      // Success - navigate back to notes list
      navigate("/")
    } catch (err) {
      setError(err.message)
      console.error('Error archiving note:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !noteId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            {/* No mode title to avoid abrupt UI changes between new/edit */}
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={handleSave} 
              className="ml-2"
              disabled={
                loading ||
                !title.trim() ||
                (!content.trim() && (!Array.isArray(todos) || todos.length === 0))
              }
            >
              {loading ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="mx-auto max-w-4xl p-4">
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3">
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            {/* Title Input */}
            <Input
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold border-none bg-transparent p-0 mb-4 placeholder:text-muted-foreground focus-visible:ring-0"
              disabled={loading}
            />

            {/* Category Selection as Pills */}
            <div className="mb-4 flex gap-2 flex-wrap items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => {
                  const isSelected = category === cat
                  return (
                    <Button
                      key={cat}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      disabled={loading}
                      onClick={() => setCategory(cat)}
                      className={`rounded-full px-4 ${
                        isSelected
                          ? "saturate-100"
                          : "text-muted-foreground border-border/50 hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {cat}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Content Area */}
            {showChecklist ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Textarea
                  placeholder="Start writing your note..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[400px] border-none bg-transparent p-0 resize-none placeholder:text-muted-foreground focus-visible:ring-0 text-base leading-relaxed disabled:bg-muted"
                  disabled={loading}
                />
                <div className="min-h-[400px] border-l md:pl-6 border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground">To-do list</h3>
                    <Button size="sm" variant="ghost" onClick={() => setShowChecklist(false)} disabled={loading}>
                      Remove
                    </Button>
                  </div>
                  <TodoList
                    todos={todos}
                    onTodosChange={setTodos}
                  />
                </div>
              </div>
            ) : (
              <Textarea
                placeholder="Start writing your note..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[400px] border-none bg-transparent p-0 resize-none placeholder:text-muted-foreground focus-visible:ring-0 text-base leading-relaxed disabled:bg-muted"
                disabled={loading}
              />
            )}

            {/* Footer Info */}
            <div className="flex items-center justify-end mt-6 pt-4 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                {noteId ? "Last edited: " : "Created: "}
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-center gap-4 mt-6">
            {/* To-do toggle first */}
            <Button
              variant={showChecklist ? "default" : "outline"}
              size="sm"
              onClick={() => setShowChecklist((v) => !v)}
              disabled={loading}
              title={"Toggle to-do list section"}
            >
              <List className="h-4 w-4 mr-2" />
              {showChecklist ? "Remove To-do" : "Add To-do"}
            </Button>
            {/* Archive second: visible for new notes but disabled until saved */}
            <Button variant="outline" size="sm" disabled={loading || !noteId} onClick={handleArchive}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
            {/* Delete last: visible for new notes but disabled until saved */}
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive bg-transparent"
              onClick={handleDeleteClick}
              disabled={loading || !noteId}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}