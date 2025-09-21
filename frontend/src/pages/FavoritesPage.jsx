"use client"

import { useState, useEffect } from "react"
import { Search, ArrowLeft, Star, StarOff, MoreVertical, Edit3, Pin, Archive, Trash2, FileText, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link, useNavigate } from "react-router-dom"
import TodoListCard from "@/components/TodoListCard"
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

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
const categories = ["Personal", "Work", "Shopping", "Ideas"]

export default function FavoritesPage() {
  const [notes, setNotes] = useState([])
  const [todoLists, setTodoLists] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [activeTab, setActiveTab] = useState("notes") // "notes" or "todos"
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState(null)
  const navigate = useNavigate()

  // Debounce search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === "notes") {
        fetchFavoriteNotes()
      } else {
        fetchFavoriteTodoLists()
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, activeTab])

  const fetchFavoriteNotes = async () => {
    setLoading(true)
    setError(null)

    try {
      let url = `${API_BASE_URL}/notes?size=100&starred=true`
      
      // If there's a search query, use the /search endpoint
      if (searchQuery.trim()) {
        url = `${API_BASE_URL}/notes/search?query=${encodeURIComponent(searchQuery.trim())}&size=100&starred=true`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch favorite notes: ${response.status}`)
      }
      
      const data = await response.json()
      const transformedNotes = (data.content || []).map(note => ({
        id: note.id.toString(),
        title: note.title,
        content: note.content,
        category: note.category || "Personal",
        isPinned: note.isPinned || false,
        isStarred: note.starred || false, // Use actual starred status from backend
        createdAt: note.createdAt ? new Date(note.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : 'Unknown date'
      }))
      
      setNotes(transformedNotes)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching favorite notes:', err)
      setNotes([])
    } finally {
      setLoading(false)
    }
  }

  const fetchFavoriteTodoLists = async () => {
    setLoading(true)
    setError(null)

    try {
      let url = `${API_BASE_URL}/todo-lists?starred=true&size=50&sort=updatedAt,desc`
      
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const todoLists = data.content.map(todoList => ({
        id: todoList.id,
        title: todoList.title,
        category: todoList.category,
        todos: todoList.todos || [],
        isStarred: todoList.starred || false,
        isPinned: todoList.isPinned || false,
        createdAt: todoList.createdAt ? new Date(todoList.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : 'Unknown date'
      }))

      setTodoLists(todoLists)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching favorite todo lists:', err)
      setTodoLists([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (noteId) => {
    setNoteToDelete(noteId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return

    try {
      const response = await fetch(`${API_BASE_URL}/${activeTab === "notes" ? "notes" : "todo-lists"}/${noteToDelete}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      // Refresh the appropriate list
      if (activeTab === "notes") {
        fetchFavoriteNotes()
      } else {
        fetchFavoriteTodoLists()
      }
      
      setDeleteDialogOpen(false)
      setNoteToDelete(null)
    } catch (err) {
      setError(err.message)
      console.error('Error deleting item:', err)
    }
  }

  const handleArchive = async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${activeTab === "notes" ? "notes" : "todo-lists"}/${itemId}/archive`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to archive item')
      }

      // Remove the item from the current list
      if (activeTab === "notes") {
        const updatedNotes = notes.filter(note => note.id !== itemId)
        setNotes(updatedNotes)
      } else {
        const updatedTodoLists = todoLists.filter(todoList => todoList.id !== itemId)
        setTodoLists(updatedTodoLists)
      }
      
      console.log("Item archived:", itemId)
    } catch (err) {
      setError(err.message)
      console.error('Error archiving item:', err)
    }
  }

  const handlePinToggle = async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${activeTab === "notes" ? "notes" : "todo-lists"}/${itemId}/pin`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to toggle pin status')
      }

      // Update the item's pinned status
      if (activeTab === "notes") {
        const updatedNotes = notes.map(note => 
          note.id === itemId 
            ? { ...note, isPinned: !note.isPinned }
            : note
        )
        setNotes(updatedNotes)
      } else {
        const updatedTodoLists = todoLists.map(todoList => 
          todoList.id === itemId 
            ? { ...todoList, isPinned: !todoList.isPinned }
            : todoList
        )
        setTodoLists(updatedTodoLists)
      }
    } catch (err) {
      setError(err.message)
      console.error('Error toggling pin:', err)
    }
  }

  const handleStarToggle = async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${activeTab === "notes" ? "notes" : "todo-lists"}/${itemId}/star`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to toggle star status')
      }

      // Remove the item from favorites list since it's no longer starred
      if (activeTab === "notes") {
        const updatedNotes = notes.filter(note => note.id !== itemId)
        setNotes(updatedNotes)
      } else {
        const updatedTodoLists = todoLists.filter(todoList => todoList.id !== itemId)
        setTodoLists(updatedTodoLists)
      }
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

  const filteredTodoLists = searchQuery.trim() 
    ? todoLists.filter(todoList => 
        todoList.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        todoList.todos.some(todo => todo.text.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : todoLists

  const pinnedNotes = filteredNotes.filter((note) => note.isPinned)
  const regularNotes = filteredNotes.filter((note) => !note.isPinned)
  const pinnedTodoLists = filteredTodoLists.filter(todoList => todoList.isPinned)
  const regularTodoLists = filteredTodoLists.filter(todoList => !todoList.isPinned)

  // Loading state
  if (loading && ((activeTab === "notes" && notes.length === 0) || (activeTab === "todos" && todoLists.length === 0))) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading favorite {activeTab}...</p>
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
              <Star className="h-6 w-6 text-yellow-500 fill-current" />
              <h1 className="text-2xl font-bold">Favorites</h1>
            </div>
          </div>

          <div className="max-w-md w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search favorite notes..."
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
            <button
              onClick={() => setActiveTab("todos")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "todos"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Todo Lists
              </div>
            </button>
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
              fetchFavoriteNotes()
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
          {activeTab === "notes" ? (
            <>
              {/* Pinned Notes */}
              {pinnedNotes.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">Pinned</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {pinnedNotes.map((note) => (
                      <NoteCard key={note.id} note={note} onDelete={handleDeleteClick} onPinToggle={handlePinToggle} onStarToggle={handleStarToggle} onArchive={handleArchive} />
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
                      <NoteCard key={note.id} note={note} onDelete={handleDeleteClick} onPinToggle={handlePinToggle} onStarToggle={handleStarToggle} onArchive={handleArchive} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Pinned Todo Lists */}
              {pinnedTodoLists.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">Pinned</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {pinnedTodoLists.map((todoList) => (
                      <TodoListCard key={todoList.id} todoList={todoList} onDelete={handleDeleteClick} onPinToggle={handlePinToggle} onStarToggle={handleStarToggle} onArchive={handleArchive} />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Todo Lists */}
              {regularTodoLists.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                    {searchQuery ? "Search Results" : "Others"}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {regularTodoLists.map((todoList) => (
                      <TodoListCard key={todoList.id} todoList={todoList} onDelete={handleDeleteClick} onPinToggle={handlePinToggle} onStarToggle={handleStarToggle} onArchive={handleArchive} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {loading && ((activeTab === "notes" && notes.length === 0) || (activeTab === "todos" && todoLists.length === 0)) ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading favorite {activeTab}...</p>
            </div>
          ) : ((activeTab === "notes" && filteredNotes.length === 0) || (activeTab === "todos" && filteredTodoLists.length === 0)) && !loading ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 text-foreground">
                {searchQuery ? `No favorite ${activeTab} found` : `No favorite ${activeTab} yet`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? `No favorite ${activeTab} match "${searchQuery}". Try different keywords.` 
                  : `${activeTab === "notes" ? "Notes" : "Todo lists"} you mark as favorites will appear here.`
                }
              </p>
            </div>
          ) : null}
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

function NoteCard({ note, onDelete, onPinToggle, onStarToggle, onArchive }) {
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
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onStarToggle(note.id)}
            >
              <Star className="h-4 w-4 fill-current text-yellow-500" />
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
                <DropdownMenuItem onClick={() => onStarToggle(note.id)}>
                  <StarOff className="h-4 w-4 mr-2" />
                  Remove from Favorites
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onArchive(note.id)}>
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
            <Pin className="h-4 w-4 text-primary fill-current" />
          </div>
        )}

        <div className="absolute top-2 right-8">
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
        </div>
      </CardContent>
    </Card>
  )
}
