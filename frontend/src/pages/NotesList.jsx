"use client"

import { useState, useEffect } from "react"
import { Search, Plus, StickyNote, Archive, Trash2, Star, Menu, MoreVertical, Edit3, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link, useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

const categories = ["All Notes", "Work", "Personal", "Learning"]

export default function NotesList() {
  const [notes, setNotes] = useState([])
  const [allNotes, setAllNotes] = useState([]) // Store all notes for category filtering
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Notes")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  // Debounce search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchNotes()
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedCategory])

  const fetchNotes = async () => {
    setLoading(true)
    setError(null)

    try {
      let url = `${API_BASE_URL}/notes?size=100`
      
      // If there's a search query, use the /search endpoint
      if (searchQuery.trim()) {
        url = `${API_BASE_URL}/notes/search?query=${encodeURIComponent(searchQuery.trim())}&size=100`
      }
      // If there's a category selected but no search, filter by category using main endpoint
      else if (selectedCategory !== "All Notes") {
        // For category filtering, we'll fetch all and filter client-side since your API doesn't have category endpoint
        url = `${API_BASE_URL}/notes?size=100`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notes: ${response.status}`)
      }
      
      const data = await response.json()
      const transformedNotes = (data.content || []).map(note => ({
        id: note.id.toString(),
        title: note.title,
        content: note.content,
        category: note.category || "Personal",
        isPinned: false,
        createdAt: new Date(note.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })
      }))
      
      // Store all notes for category filtering
      setAllNotes(transformedNotes)
      
      // Apply category filter if selected
      let filteredByCategory = transformedNotes
      if (selectedCategory !== "All Notes" && !searchQuery.trim()) {
        filteredByCategory = transformedNotes.filter(note => 
          note.category === selectedCategory
        )
      }
      
      setNotes(filteredByCategory)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching notes:', err)
      setNotes([])
      setAllNotes([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete note')
      }

      // Refresh the notes list
      fetchNotes()
    } catch (err) {
      setError(err.message)
      console.error('Error deleting note:', err)
    }
  }

  const handlePinToggle = async (noteId) => {
    // Since we removed pinning, just log for now
    console.log("Pin toggle not implemented:", noteId)
  }

  // Filter notes based on category when search is empty
  const getFilteredNotes = () => {
    if (searchQuery.trim()) {
      // If searching, use the API results directly
      return notes
    }
    
    // If not searching, filter all notes by category
    return allNotes.filter((note) => 
      selectedCategory === "All Notes" || note.category === selectedCategory
    )
  }

  const filteredNotes = getFilteredNotes()

  const pinnedNotes = filteredNotes.filter((note) => note.isPinned)
  const regularNotes = filteredNotes.filter((note) => !note.isPinned)

  // Loading state
  if (loading && notes.length === 0) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your notes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-16"} bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <img src="/Quill.svg" alt="Quill" className="h-5 w-5" />
            </Button>
            {sidebarOpen && <h1 className="text-xl font-bold text-sidebar-foreground">Quill</h1>}
          </div>
        </div>

        <nav className="flex-1 p-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "ghost"}
              className={`w-full justify-start mb-1 ${
                selectedCategory === category
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              <StickyNote className="h-4 w-4 mr-3" />
              {sidebarOpen && category}
            </Button>
          ))}

          <div className="mt-6">
            <Button
              variant="ghost"
              className="w-full justify-start mb-1 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Star className="h-4 w-4 mr-3" />
              {sidebarOpen && "Starred"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start mb-1 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Archive className="h-4 w-4 mr-3" />
              {sidebarOpen && "Archive"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start mb-1 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Trash2 className="h-4 w-4 mr-3" />
              {sidebarOpen && "Trash"}
            </Button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border p-4">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search notes..."
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
        </header>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-destructive/10 border-b border-destructive/30 text-destructive text-sm">
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setError(null)
                fetchNotes()
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
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("All Notes")
              }}
              className="h-6 px-2 ml-2"
            >
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Notes Grid */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">Pinned</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pinnedNotes.map((note) => (
                    <NoteCard key={note.id} note={note} onDelete={handleDelete} onPinToggle={handlePinToggle} />
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
                    <NoteCard key={note.id} note={note} onDelete={handleDelete} onPinToggle={handlePinToggle} />
                  ))}
                </div>
              </div>
            )}

            {loading && notes.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your notes...</p>
              </div>
            ) : filteredNotes.length === 0 && !loading ? (
              <div className="text-center py-12">
                <StickyNote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-foreground">
                  {searchQuery ? "No notes found" : "No notes yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? `No notes match "${searchQuery}". Try different keywords.` 
                    : selectedCategory !== "All Notes" 
                      ? `No notes in "${selectedCategory}" category yet.`
                      : "Create your first note to get started!"
                  }
                </p>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {/* Floating Action Button */}
      <Link to="/note">
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  )
}

function NoteCard({ note, onDelete, onPinToggle }) {
  const [isHovered, setIsHovered] = useState(false)
  const navigate = useNavigate()

  const handleEdit = () => {
    navigate(`/note/${note.id}`)
  }

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-md border-border bg-card relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 
            className="font-medium text-card-foreground line-clamp-1 cursor-pointer hover:underline"
            onClick={handleEdit}
          >
            {note.title}
          </h3>
          <div className={`flex gap-1 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleEdit}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPinToggle(note.id)}>
                  <Pin className="h-4 w-4 mr-2" />
                  {note.isPinned ? "Unpin" : "Pin"} Note
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => console.log("Archive note:", note.id)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(note.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-4 whitespace-pre-line">{note.content}</p>

        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {note.category}
          </Badge>
          <span className="text-xs text-muted-foreground">{note.createdAt}</span>
        </div>

        {note.isPinned && (
          <div className="absolute top-2 right-2">
            <Star className="h-4 w-4 text-primary fill-current" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}