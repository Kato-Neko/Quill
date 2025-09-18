"use client"

import { useState } from "react"
import { Search, Plus, StickyNote, Archive, Trash2, Star, Menu, MoreVertical, Edit3, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Sample notes data
const sampleNotes = [
  {
    id: "1",
    title: "Project Ideas",
    content: "Build a notes app with React\nAdd search functionality\nImplement categories\nDark mode support",
    category: "Work",
    isPinned: true,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Shopping List",
    content: "• Milk\n• Bread\n• Eggs\n• Coffee beans\n• Apples",
    category: "Personal",
    isPinned: false,
    createdAt: "2024-01-14",
  },
  {
    id: "3",
    title: "Meeting Notes",
    content: "Discussed Q1 goals\nReview budget allocation\nSchedule follow-up meeting\nAction items for team",
    category: "Work",
    isPinned: false,
    createdAt: "2024-01-13",
  },
  {
    id: "4",
    title: "Book Recommendations",
    content: "The Design of Everyday Things\nAtomic Habits\nClean Code\nThe Pragmatic Programmer",
    category: "Learning",
    isPinned: true,
    createdAt: "2024-01-12",
  },
  {
    id: "5",
    title: "Travel Plans",
    content: "Visit Japan in spring\nBook flights early\nResearch accommodations\nLearn basic Japanese phrases",
    category: "Personal",
    isPinned: false,
    createdAt: "2024-01-11",
  },
  {
    id: "6",
    title: "Code Snippets",
    content: "React useEffect cleanup\nCSS Grid layouts\nJavaScript array methods\nTailwind responsive design",
    category: "Work",
    isPinned: false,
    createdAt: "2024-01-10",
  },
]

const categories = ["All Notes", "Work", "Personal", "Learning"]

export default function NotesList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Notes")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const filteredNotes = sampleNotes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All Notes" || note.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const pinnedNotes = filteredNotes.filter((note) => note.isPinned)
  const regularNotes = filteredNotes.filter((note) => !note.isPinned)

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
            </div>
          </div>
        </header>

        {/* Notes Grid */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">Pinned</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pinnedNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Notes */}
            {regularNotes.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">Others</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {regularNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </div>
            )}

            {filteredNotes.length === 0 && (
              <div className="text-center py-12">
                <StickyNote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notes found</p>
              </div>
            )}
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

function NoteCard({ note }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-md border-border bg-card relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-card-foreground line-clamp-1">{note.title}</h3>
          <div className={`flex gap-1 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}>
            <Link to={`/note/${note.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Edit3 className="h-4 w-4" />
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => console.log("Pin note:", note.id)}>
                  <Pin className="h-4 w-4 mr-2" />
                  {note.isPinned ? "Unpin" : "Pin"} Note
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log("Edit note:", note.id)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => console.log("Archive note:", note.id)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => console.log("Delete note:", note.id)}
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
  