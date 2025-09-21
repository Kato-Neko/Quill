import { useState, useEffect } from "react"
import { ArrowLeft, Save, MoreVertical, Archive, Trash2 } from "lucide-react"
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
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch note')
      }
      const note = await response.json()
      setTitle(note.title || "")
      setContent(note.content || "")
      setCategory(note.category || "")
    } catch (err) {
      setError(err.message)
      console.error('Error fetching note:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content cannot be empty")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const noteData = {
        title: title.trim(),
        content: content.trim(),
        category: category || null
      }

      const url = noteId 
        ? `${API_BASE_URL}/notes/${noteId}` 
        : `${API_BASE_URL}/notes`
      
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

  const handleDelete = async () => {
    if (!noteId) return

    if (!window.confirm('Are you sure you want to delete this note?')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
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
                <DropdownMenuItem onClick={() => console.log("Archive note:", noteId)} disabled={loading}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                {noteId && (
                  <DropdownMenuItem 
                    onClick={handleDelete}
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
              disabled={loading || !title.trim() || !content.trim()}
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
            <div className="mb-4">
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
            </div>

            {/* Content Textarea */}
            <Textarea
              placeholder="Start writing your note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] border-none bg-transparent p-0 resize-none placeholder:text-muted-foreground focus-visible:ring-0 text-base leading-relaxed disabled:bg-muted"
              disabled={loading}
            />

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

          {/* Quick Actions */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button variant="outline" size="sm" disabled={loading}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
            {noteId && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive bg-transparent"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}