import { useState, useEffect } from "react"
import { ArrowLeft, Save, MoreVertical, Archive, Trash2, List, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Link, useParams, useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

const categories = ["Work", "Personal", "Learning", "Ideas"]

export default function NotePage() {
  const params = useParams()
  const navigate = useNavigate()
  const noteId = params.id

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteType, setNoteType] = useState("text") // "text" or "todo"
  const [todos, setTodos] = useState([])

  // API base URL - adjust this to your backend URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

  useEffect(() => {
    if (noteId) {
      // Fetch existing note for editing
      fetchNote()
    }
  }, [noteId])

  const fetchNote = async () => {
    try {
      setLoading(true)
      
      // Try to fetch as a regular note first
      let response = await fetch(`${API_BASE_URL}/notes/${noteId}`)
      let note = null
      let isTodoList = false
      
      if (response.ok) {
        note = await response.json()
        // Check if it's a todo list by looking for todos array
        if (note.todos && Array.isArray(note.todos)) {
          isTodoList = true
        }
      } else {
        // If note not found, try as todo list
        response = await fetch(`${API_BASE_URL}/todo-lists/${noteId}`)
        if (response.ok) {
          note = await response.json()
          isTodoList = true
        } else {
          throw new Error('Failed to fetch note or todo list')
        }
      }
      
      setTitle(note.title || "")
      setCategory(note.category || "")
      
      if (isTodoList) {
        setNoteType("todo")
        setTodos(note.todos || [])
        setContent("") // Todo lists don't have content
      } else {
        setNoteType("text")
        setContent(note.content || "")
        setTodos([]) // Regular notes don't have todos
      }
    } catch (err) {
      setError(err.message)
      console.error('Error fetching note:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title cannot be empty")
      return
    }

    if (noteType === "text" && !content.trim()) {
      setError("Content cannot be empty")
      return
    }

    if (noteType === "todo" && todos.length === 0) {
      setError("Add at least one todo item")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Prepare data based on note type
      const noteData = noteType === "todo" 
        ? {
            title: title.trim(),
            category: category || null,
            todos: todos
          }
        : {
            title: title.trim(),
            content: content.trim(),
            category: category || null
          }

      // Use different endpoints based on note type
      const baseEndpoint = noteType === "todo" ? "todo-lists" : "notes"
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

      // Success - navigate back to notes list
      navigate("/")
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
      
      // Use correct endpoint based on note type
      const baseEndpoint = noteType === "todo" ? "todo-lists" : "notes"
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
      
      // Use correct endpoint based on note type
      const baseEndpoint = noteType === "todo" ? "todo-lists" : "notes"
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
            <h1 className="text-lg font-semibold">{noteId ? "Edit Note" : "New Note"}</h1>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={loading}>
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleArchive} disabled={loading}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                {noteId && (
                  <DropdownMenuItem 
                    onClick={handleDeleteClick}
                    className="text-destructive focus:text-destructive"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              onClick={handleSave} 
              className="ml-2"
              disabled={loading || !title.trim() || (noteType === "text" && !content.trim()) || (noteType === "todo" && todos.length === 0)}
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

            {/* Category Selection */}
            <div className="mb-4 flex gap-4 items-center justify-between">
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-48 bg-transparent border border-border rounded px-3 py-2 disabled:bg-muted"
                disabled={loading}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Note Type Toggle */}
              <div className="flex border border-border rounded-md">
                <Button
                  variant={noteType === "text" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setNoteType("text")}
                  disabled={loading}
                  className="rounded-r-none"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Text
                </Button>
                <Button
                  variant={noteType === "todo" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setNoteType("todo")}
                  disabled={loading}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4 mr-2" />
                  Todo
                </Button>
              </div>
            </div>

            {/* Content Area */}
            {noteType === "text" ? (
              <Textarea
                placeholder="Start writing your note..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[400px] border-none bg-transparent p-0 resize-none placeholder:text-muted-foreground focus-visible:ring-0 text-base leading-relaxed disabled:bg-muted"
                disabled={loading}
              />
            ) : (
              <div className="min-h-[400px]">
                <TodoList
                  todos={todos}
                  onTodosChange={setTodos}
                />
              </div>
            )}

            {/* Footer Info */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                {category && (
                  <Badge variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {noteId ? "Last edited: " : "Created: "}
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Quick Actions - Only show for existing notes */}
          {noteId && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button variant="outline" size="sm" disabled={loading} onClick={handleArchive}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive bg-transparent"
                onClick={handleDeleteClick}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
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