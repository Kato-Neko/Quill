import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Plus, Search, Star, Pin, Archive, Trash2, List, CheckSquare, Home, Briefcase, User, BookOpen, Lightbulb, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import TodoListCard from "@/components/TodoListCard"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080"

const categories = ["All Todo Lists", "Work", "Personal", "Shopping", "Ideas"]

export default function TodoListPage() {
  const [todoLists, setTodoLists] = useState([])
  const [allTodoLists, setAllTodoLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Todo Lists")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [todoListToDelete, setTodoListToDelete] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchTodoLists()
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchTodoLists(searchTerm)
      } else {
        fetchTodoLists()
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  useEffect(() => {
    if (selectedCategory === "All Todo Lists") {
      setTodoLists(allTodoLists)
    } else {
      const filtered = allTodoLists.filter(todoList => 
        todoList.category === selectedCategory
      )
      setTodoLists(filtered)
    }
  }, [selectedCategory, allTodoLists])

  const fetchTodoLists = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/todo-lists`)
      if (!response.ok) {
        throw new Error('Failed to fetch todo lists')
      }
      const data = await response.json()
      
      const transformedTodoLists = (data.content || []).map(todoList => ({
        id: todoList.id.toString(),
        title: todoList.title,
        category: todoList.category || "Personal",
        isPinned: todoList.isPinned || false,
        isStarred: todoList.starred || false,
        todos: todoList.todos || [],
        createdAt: todoList.createdAt ? new Date(todoList.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }) : 'Unknown date'
      }))
      
      setTodoLists(transformedTodoLists)
      setAllTodoLists(transformedTodoLists)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching todo lists:', err)
    } finally {
      setLoading(false)
    }
  }

  const searchTodoLists = async (term) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/todo-lists?search=${encodeURIComponent(term)}`)
      if (!response.ok) {
        throw new Error('Failed to search todo lists')
      }
      const data = await response.json()
      
      const transformedTodoLists = (data.content || []).map(todoList => ({
        id: todoList.id.toString(),
        title: todoList.title,
        category: todoList.category || "Personal",
        isPinned: todoList.isPinned || false,
        isStarred: todoList.starred || false,
        todos: todoList.todos || [],
        createdAt: todoList.createdAt ? new Date(todoList.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }) : 'Unknown date'
      }))
      
      setTodoLists(transformedTodoLists)
    } catch (err) {
      setError(err.message)
      console.error('Error searching todo lists:', err)
    }
  }

  const handleDeleteClick = (todoListId) => {
    setTodoListToDelete(todoListId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!todoListToDelete) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/todo-lists/${todoListToDelete}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete todo list')
      }

      // Remove from local state
      setTodoLists(todoLists.filter(todoList => todoList.id !== todoListToDelete))
      setAllTodoLists(allTodoLists.filter(todoList => todoList.id !== todoListToDelete))
      setDeleteDialogOpen(false)
      setTodoListToDelete(null)
    } catch (err) {
      setError(err.message)
      console.error('Error deleting todo list:', err)
    }
  }

  const handlePinToggle = async (todoListId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/todo-lists/${todoListId}/pin`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to toggle pin status')
      }

      // Find the todo list and toggle its pinned status
      const updatedTodoLists = todoLists.map(todoList => 
        todoList.id === todoListId 
          ? { ...todoList, isPinned: !todoList.isPinned }
          : todoList
      )
      setTodoLists(updatedTodoLists)
      
      // Also update allTodoLists for consistency
      const updatedAllTodoLists = allTodoLists.map(todoList => 
        todoList.id === todoListId 
          ? { ...todoList, isPinned: !todoList.isPinned }
          : todoList
      )
      setAllTodoLists(updatedAllTodoLists)
      
      console.log("Pin toggle implemented:", todoListId)
    } catch (err) {
      setError(err.message)
      console.error('Error toggling pin:', err)
    }
  }

  const handleStarToggle = async (todoListId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/todo-lists/${todoListId}/star`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to toggle star status')
      }

      // Find the todo list and toggle its starred status
      const updatedTodoLists = todoLists.map(todoList => 
        todoList.id === todoListId 
          ? { ...todoList, isStarred: !todoList.isStarred }
          : todoList
      )
      setTodoLists(updatedTodoLists)
      
      // Also update allTodoLists for consistency
      const updatedAllTodoLists = allTodoLists.map(todoList => 
        todoList.id === todoListId 
          ? { ...todoList, isStarred: !todoList.isStarred }
          : todoList
      )
      setAllTodoLists(updatedAllTodoLists)
      
      console.log("Star toggle implemented:", todoListId)
    } catch (err) {
      setError(err.message)
      console.error('Error toggling star:', err)
    }
  }

  const handleArchive = async (todoListId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/todo-lists/${todoListId}/archive`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to archive todo list')
      }

      // Remove from local state
      setTodoLists(todoLists.filter(todoList => todoList.id !== todoListId))
      setAllTodoLists(allTodoLists.filter(todoList => todoList.id !== todoListId))
    } catch (err) {
      setError(err.message)
      console.error('Error archiving todo list:', err)
    }
  }

  const handleCreateNew = () => {
    navigate("/note")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading todo lists...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
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
          {categories.map((category) => {
            const getCategoryIcon = (cat) => {
              switch (cat) {
                case "All Todo Lists":
                  return <CheckSquare className="h-4 w-4 mr-3" />
                case "Work":
                  return <Briefcase className="h-4 w-4 mr-3" />
                case "Personal":
                  return <User className="h-4 w-4 mr-3" />
                case "Shopping":
                  return <List className="h-4 w-4 mr-3" />
                case "Ideas":
                  return <Lightbulb className="h-4 w-4 mr-3" />
                default:
                  return <CheckSquare className="h-4 w-4 mr-3" />
              }
            }

            return (
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
                {getCategoryIcon(category)}
                {sidebarOpen && category}
              </Button>
            )
          })}

          <div className="mt-6">
            <Link to="/">
              <Button
                variant="ghost"
                className="w-full justify-start mb-1 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Home className="h-4 w-4 mr-3 text-blue-500" />
                {sidebarOpen && "Notes"}
              </Button>
            </Link>
            <Link to="/favorites">
              <Button
                variant="ghost"
                className="w-full justify-start mb-1 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Star className="h-4 w-4 mr-3 text-yellow-500" />
                {sidebarOpen && "Favorites"}
              </Button>
            </Link>
            <Link to="/archive">
              <Button
                variant="ghost"
                className="w-full justify-start mb-1 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Archive className="h-4 w-4 mr-3 text-blue-500" />
                {sidebarOpen && "Archive"}
              </Button>
            </Link>
            <Link to="/trash">
              <Button
                variant="ghost"
                className="w-full justify-start mb-1 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Trash2 className="h-4 w-4 mr-3 text-red-500" />
                {sidebarOpen && "Trash"}
              </Button>
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search todo lists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Todo Lists Grid */}
        {todoLists.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No todo lists found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? "Try adjusting your search criteria" 
                : "Create your first todo list to get started"}
            </p>
            {!searchTerm && (
              <p className="text-sm text-muted-foreground">
                Use the + button in the bottom right to create your first todo list
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {todoLists.map((todoList) => (
              <TodoListCard
                key={todoList.id}
                todoList={todoList}
                onDelete={handleDeleteClick}
                onPinToggle={handlePinToggle}
                onStarToggle={handleStarToggle}
                onArchive={handleArchive}
              />
            ))}
          </div>
        )}

        {/* Floating Action Button */}
        <Button
          onClick={handleCreateNew}
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Delete Confirmation Dialog */}
        {deleteDialogOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-2">Delete Todo List</h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete this todo list? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false)
                    setTodoListToDelete(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
