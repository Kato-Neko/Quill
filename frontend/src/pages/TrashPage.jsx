"use client"

import { useState, useEffect } from "react"
import { Search, ArrowLeft, Trash2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link, useNavigate } from "react-router-dom"
import NoteCard from "@/components/NoteCard"
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

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
const categories = ["Personal", "Work", "Shopping", "Ideas"]

export default function TrashPage() {
  const [notes, setNotes] = useState([])
  // Removed separate todo lists
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [activeTab, setActiveTab] = useState("notes")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState(null)
  const navigate = useNavigate()

  // Debounce search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTrashedNotes()
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, activeTab])

  const fetchTrashedNotes = async () => {
    setLoading(true)
    setError(null)

    try {
      let url = `${API_BASE_URL}/notes?size=100&deleted=true`
      
      // If there's a search query, use the /search endpoint
      if (searchQuery.trim()) {
        url = `${API_BASE_URL}/notes/search?query=${encodeURIComponent(searchQuery.trim())}&size=100&deleted=true`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trashed notes: ${response.status}`)
      }
      
      const data = await response.json()
      const transformedNotes = (data.content || []).map(note => ({
        id: note.id.toString(),
        title: note.title,
        content: note.content,
        category: note.category || "Personal",
        isPinned: note.isPinned || false,
        isStarred: note.starred || false,
        isDeleted: true,
        createdAt: note.createdAt ? new Date(note.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }) : 'Unknown date'
      }))
      
      setNotes(transformedNotes)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching trashed notes:', err)
      setNotes([])
    } finally {
      setLoading(false)
    }
  }

  // Removed fetchTrashedTodoLists

  const handleDeleteClick = (noteId) => {
    setNoteToDelete(noteId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return

    try {
      const response = await fetch(`${API_BASE_URL}/notes/${noteToDelete}/permanent`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to permanently delete item')
      }

      // Refresh the appropriate list
      fetchTrashedNotes()
      setDeleteDialogOpen(false)
      setNoteToDelete(null)
    } catch (err) {
      setError(err.message)
      console.error('Error permanently deleting item:', err)
    }
  }

  const handleRestore = async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${itemId}/restore`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to restore item')
      }

      // Remove the item from the current list
      const updatedNotes = notes.filter(note => note.id !== itemId)
      setNotes(updatedNotes)
    } catch (err) {
      setError(err.message)
      console.error('Error restoring item:', err)
    }
  }

  const handlePinToggle = async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${itemId}/pin`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to toggle pin status')
      }

      // Update the item's pinned status
      const updatedNotes = notes.map(note => 
        note.id === itemId 
          ? { ...note, isPinned: !note.isPinned }
          : note
      )
      setNotes(updatedNotes)
      console.log("Pin toggle implemented:", itemId)
    } catch (err) {
      setError(err.message)
      console.error('Error toggling pin:', err)
    }
  }

  const handleStarToggle = async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${itemId}/star`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to toggle star status')
      }

      // Update the item's starred status
      const updatedNotes = notes.map(note => 
        note.id === itemId 
          ? { ...note, isStarred: !note.isStarred }
          : note
      )
      setNotes(updatedNotes)
      console.log("Star toggle implemented:", itemId)
    } catch (err) {
      setError(err.message)
      console.error('Error toggling star:', err)
    }
  }

  const filteredNotes = searchQuery.trim() 
    ? notes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes

  // Removed filteredTodoLists

  const pinnedNotes = filteredNotes.filter((note) => note.isPinned)
  const regularNotes = filteredNotes.filter((note) => !note.isPinned)
  // Removed todo list sections

  // Loading state
  if (loading && ((activeTab === "notes" && notes.length === 0) || (activeTab === "todos" && todoLists.length === 0))) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading trashed {activeTab}...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Trash2 className="h-6 w-6 text-red-500" />
              <h1 className="text-2xl font-bold">Trash</h1>
            </div>
          </div>

          <div className="max-w-md w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search trashed notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input border-border"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("notes")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "notes"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </div>
            </button>
            {/* Todo Lists tab removed in hybrid setup */}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border-b border-destructive/30 text-destructive text-sm">
          {error}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setError(null)
              fetchTrashedNotes()
            }}
            className="ml-2 h-6 px-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Search Info */}
      {searchQuery && (
        <div className="p-3 bg-accent/50 border-b border-accent text-sm text-accent-foreground">
          <span className="mr-2">Searching for "{searchQuery}"</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="h-6 px-2 ml-2"
          >
            Clear Search
          </Button>
        </div>
      )}

      {/* Content Grid */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Only notes grid remains */}
            <>
              {/* Pinned Notes */}
              {pinnedNotes.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">Pinned</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pinnedNotes.map((note) => (
                      <NoteCard key={note.id} note={note} onDelete={handleDeleteClick} onPinToggle={handlePinToggle} onStarToggle={handleStarToggle} onRestore={handleRestore} />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Notes */}
              {regularNotes.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                    {searchQuery ? "Search Results" : "Others"}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {regularNotes.map((note) => (
                      <NoteCard key={note.id} note={note} onDelete={handleDeleteClick} onPinToggle={handlePinToggle} onStarToggle={handleStarToggle} onRestore={handleRestore} />
                    ))}
                  </div>
                </div>
              )}
            </>

          {loading && notes.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading trashed notes...</p>
            </div>
          ) : (filteredNotes.length === 0) && !loading ? (
            <div className="text-center py-12">
              <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 text-foreground">
                {searchQuery ? `No trashed notes found` : "Trash is empty"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? `No trashed notes match "${searchQuery}". Try different keywords.` : `Notes you delete will appear here.`}
              </p>
            </div>
          ) : null}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this note? This action cannot be undone and the note will be lost forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// unified NoteCard used above
