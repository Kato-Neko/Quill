"use client"

import { useState, useEffect } from "react"
import { Search, Plus, StickyNote, Archive, Trash2, Star, Pin, StarOff, Briefcase, User, BookOpen, Lightbulb, Home, CheckSquare, ShoppingCart, Wallet, Link2, ArrowUpRight, ArrowDownLeft, Calendar, Tag, ExternalLink, ChevronDown, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import NoteCard from "@/components/NoteCard"
import WalletConnect from "@/components/WalletConnect"
import TransactionLedger from "@/components/TransactionLedger"
import { useWallet } from "@/contexts/WalletContext"
import { Link, useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

const categories = ["All Notes", "Work", "Personal", "Learning", "Ideas", "Shopping"]

export default function NotesList() {
  const [notes, setNotes] = useState([])
  const [allNotes, setAllNotes] = useState([]) // Store all notes for category filtering
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Notes")
  const [walletView, setWalletView] = useState(null) // null, 'connect'
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState(null)
  const [walletDialogOpen, setWalletDialogOpen] = useState(false)
  const [isDeleteTransactionPending, setIsDeleteTransactionPending] = useState(false)
  const navigate = useNavigate()
  const { address, recordNoteDelete, disconnectWallet, isViewOnly, balance, connectWallet, getAvailableWallets, refreshBalance, network, setNetwork } = useWallet()

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
      const url = `${API_BASE_URL}/notes?size=100`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notes: ${response.status}`)
      }
      
      const data = await response.json()
      const transformedNotes = (data.content || []).map(note => ({
        id: note.id.toString(),
        title: note.title,
        content: note.content,
        todos: Array.isArray(note.todos) ? note.todos : [],
        category: note.category || "Personal",
        isPinned: note.isPinned || false,
        isStarred: note.starred || false,
        createdAt: note.createdAt ? new Date(note.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }) : 'Unknown date'
      }))
      
      // Store all notes for category filtering
      setAllNotes(transformedNotes)
      
      // Apply search locally across title, content, todos, then category
      const q = searchQuery.trim().toLowerCase()
      let filtered = transformedNotes
      if (q) {
        filtered = transformedNotes.filter(n => {
          const inTitle = (n.title || "").toLowerCase().includes(q)
          const inContent = (n.content || "").toLowerCase().includes(q)
          const inTodos = Array.isArray(n.todos) && n.todos.some(t => (t.text || "").toLowerCase().includes(q))
          return inTitle || inContent || inTodos
        })
      }
      if (selectedCategory !== "All Notes") {
        filtered = filtered.filter(n => n.category === selectedCategory)
      }
      setNotes(filtered)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching notes:', err)
      setNotes([])
      setAllNotes([])
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
      // Get note title before deleting for transaction record
      const note = allNotes.find(n => n.id === noteToDelete.toString())
      const noteTitle = note?.title || "Untitled Note"
      
      // Delete note first
      const response = await fetch(`${API_BASE_URL}/notes/${noteToDelete}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete note')
      }

      // Refresh the notes list immediately (note is already deleted from backend)
      fetchNotes()
      setDeleteDialogOpen(false)
      setNoteToDelete(null)

      // Send real blockchain transaction after successful deletion
      // Note: Transaction is sent asynchronously and won't block note deletion
      setIsDeleteTransactionPending(true);
      recordNoteDelete(noteToDelete, noteTitle)
        .then(() => {
          setIsDeleteTransactionPending(false);
        })
        .catch(err => {
          setIsDeleteTransactionPending(false);
          // Transaction failed, but note was deleted
          console.error('Note deleted but transaction failed:', err);
          // Show error to user
          setError(`Note deleted successfully, but blockchain transaction failed: ${err.message || err.toString()}. Please check your wallet connection and try again.`);
        });
    } catch (err) {
      setError(err.message)
      console.error('Error deleting note:', err)
    }
  }

  const handlePinToggle = async (noteId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}/pin`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to toggle pin status')
      }

      // Find the note and toggle its pinned status
      const updatedNotes = notes.map(note => 
        note.id === noteId 
          ? { ...note, isPinned: !note.isPinned }
          : note
      )
      setNotes(updatedNotes)
      
      // Also update allNotes for consistency
      const updatedAllNotes = allNotes.map(note => 
        note.id === noteId 
          ? { ...note, isPinned: !note.isPinned }
          : note
      )
      setAllNotes(updatedAllNotes)
      
      console.log("Pin toggle implemented:", noteId)
    } catch (err) {
      setError(err.message)
      console.error('Error toggling pin:', err)
    }
  }

  const handleStarToggle = async (noteId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}/star`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to toggle star status')
      }

      // Find the note and toggle its starred status
      const updatedNotes = notes.map(note => 
        note.id === noteId 
          ? { ...note, isStarred: !note.isStarred }
          : note
      )
      setNotes(updatedNotes)
      
      // Also update allNotes for consistency
      const updatedAllNotes = allNotes.map(note => 
        note.id === noteId 
          ? { ...note, isStarred: !note.isStarred }
          : note
      )
      setAllNotes(updatedAllNotes)
      
      console.log("Star toggle implemented:", noteId)
    } catch (err) {
      setError(err.message)
      console.error('Error toggling star:', err)
    }
  }

  const handleArchive = async (noteId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}/archive`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to archive note')
      }

      // Remove the note from the current list
      const updatedNotes = notes.filter(note => note.id !== noteId)
      setNotes(updatedNotes)
      
      const updatedAllNotes = allNotes.filter(note => note.id !== noteId)
      setAllNotes(updatedAllNotes)
      
      console.log("Note archived:", noteId)
    } catch (err) {
      setError(err.message)
      console.error('Error archiving note:', err)
    }
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
          {categories.map((category) => {
            const getCategoryIcon = (cat) => {
              const iconClass = sidebarOpen ? "h-4 w-4 mr-3" : "h-4 w-4";
              switch (cat) {
                case "All Notes":
                  return <Home className={iconClass} />
                case "Work":
                  return <Briefcase className={iconClass} />
                case "Personal":
                  return <User className={iconClass} />
                case "Learning":
                  return <BookOpen className={iconClass} />
                case "Ideas":
                  return <Lightbulb className={iconClass} />
                case "Shopping":
                  return <ShoppingCart className={iconClass} />
                default:
                  return <StickyNote className={iconClass} />
              }
            }

            return (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                className={`w-full ${sidebarOpen ? "justify-start" : "justify-center"} mb-1 ${
                  selectedCategory === category
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                } ${sidebarOpen && category !== "All Notes" ? "pl-10" : ""}`}
                onClick={() => {
                  setSelectedCategory(category)
                  setWalletView(null)
                }}
              >
                {getCategoryIcon(category)}
                {sidebarOpen && category}
              </Button>
            )
          })}

          <div className="mt-6">
            {/* Wallet section */}
            <Button
              variant={walletView !== null ? "default" : "ghost"}
              onClick={() => setWalletView(null)}
              className={`w-full ${sidebarOpen ? "justify-start" : "justify-center"} mb-1 ${
                walletView !== null
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Wallet className={`h-4 w-4 ${sidebarOpen ? "mr-3" : ""}`} />
              {sidebarOpen && "Wallet"}
            </Button>
            {sidebarOpen && (
              <>
                <Button
                  variant={walletView === "connect" ? "default" : "ghost"}
                  onClick={() => setWalletView("connect")}
                  className={`w-full justify-start mb-1 pl-10 ${
                    walletView === "connect"
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <Link2 className="h-4 w-4 mr-3" />
                  Connect
                </Button>
              </>
            )}

            {/* Quick links */}
            <Link to="/favorites">
              <Button
                variant="ghost"
                className={`w-full ${sidebarOpen ? "justify-start" : "justify-center"} mb-1 text-sidebar-foreground hover:bg-sidebar-accent`}
              >
                <Star className={`h-4 w-4 ${sidebarOpen ? "mr-3" : ""} text-yellow-500`} />
                {sidebarOpen && "Favorites"}
              </Button>
            </Link>
            <Link to="/archive">
              <Button
                variant="ghost"
                className={`w-full ${sidebarOpen ? "justify-start" : "justify-center"} mb-1 text-sidebar-foreground hover:bg-sidebar-accent`}
              >
                <Archive className={`h-4 w-4 ${sidebarOpen ? "mr-3" : ""} text-blue-500`} />
                {sidebarOpen && "Archive"}
              </Button>
            </Link>
            <Link to="/trash">
              <Button
                variant="ghost"
                className={`w-full ${sidebarOpen ? "justify-start" : "justify-center"} mb-1 text-sidebar-foreground hover:bg-sidebar-accent`}
              >
                <Trash2 className={`h-4 w-4 ${sidebarOpen ? "mr-3" : ""} text-red-500`} />
                {sidebarOpen && "Trash"}
              </Button>
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border p-4">
          <div className="max-w-6xl mx-auto flex items-center gap-6">
            <div className="flex-1 max-w-2xl">
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
            {address ? (
              <div className="flex-shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-accent/50 hover:bg-accent transition-colors">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-mono text-foreground">{address.slice(0, 8)}...{address.slice(-8)}</span>
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm">
                      <div className="font-medium">{address.slice(0, 8)}...{address.slice(-8)}</div>
                      <div className="text-xs text-muted-foreground">
                        {isViewOnly && balance === '0' ? 'View-only mode' : `${balance} ADA`}
                        {isViewOnly && balance !== '0' && (
                          <span className="ml-1 text-[10px] opacity-70">(view-only)</span>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setWalletDialogOpen(true)}
                      className="cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Change Wallet
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={disconnectWallet}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex-shrink-0">
                <WalletConnect />
              </div>
            )}
          </div>
        </header>

        {/* Transaction Pending Indicator */}
        {isDeleteTransactionPending && (
          <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/30 text-yellow-600 text-sm flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
            <span>Note deleted! Waiting for blockchain transaction to complete. Please approve in your wallet.</span>
          </div>
        )}

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

        {/* Notes Grid or Wallet View */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {walletView === "connect" ? (
              <div className="w-full space-y-6">
                {!address ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-full max-w-md space-y-4 text-center">
                      <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
                      <p className="text-sm text-muted-foreground">
                        Connect your wallet to start tracking transactions automatically when you create, update, or delete notes.
                      </p>
                      <div className="pt-4">
                        <WalletConnect />
                      </div>
                    </div>
                  </div>
                ) : (
                  <TransactionLedger />
                )}
              </div>
            ) : (
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
            )}

            {walletView === null && loading && notes.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your notes...</p>
              </div>
            ) : walletView === null && filteredNotes.length === 0 && !loading ? (
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

      {/* Change Wallet Dialog */}
      <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Wallet</DialogTitle>
            <DialogDescription>
              Select a different wallet to connect. The current wallet will be disconnected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {getAvailableWallets().map((wallet) => (
              <Button
                key={wallet.name}
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  disconnectWallet();
                  connectWallet(wallet.name);
                  setWalletDialogOpen(false);
                }}
              >
                <Wallet className="mr-2" size={18} />
                {wallet.name}
              </Button>
            ))}
            {getAvailableWallets().length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No wallets detected. Please install a Cardano wallet extension.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// unified NoteCard moved to components/NoteCard.jsx