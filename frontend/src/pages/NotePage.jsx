import { useState, useEffect } from "react"
import { ArrowLeft, Save, MoreVertical, Pin, Archive, Trash2, Palette } from "lucide-react"
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
const colors = [
  { name: "Default", value: "default", bg: "bg-card" },
  { name: "Yellow", value: "yellow", bg: "bg-yellow-100 dark:bg-yellow-900/20" },
  { name: "Green", value: "green", bg: "bg-green-100 dark:bg-green-900/20" },
  { name: "Blue", value: "blue", bg: "bg-blue-100 dark:bg-blue-900/20" },
  { name: "Pink", value: "pink", bg: "bg-pink-100 dark:bg-pink-900/20" },
  { name: "Purple", value: "purple", bg: "bg-purple-100 dark:bg-purple-900/20" },
]

// Sample note data - in a real app, this would come from your backend
const sampleNotes = [
  {
    id: "1",
    title: "Project Ideas",
    content: "Build a notes app with React\nAdd search functionality\nImplement categories\nDark mode support",
    category: "Work",
    isPinned: true,
    color: "default",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Shopping List",
    content: "• Milk\n• Bread\n• Eggs\n• Coffee beans\n• Apples",
    category: "Personal",
    isPinned: false,
    color: "yellow",
    createdAt: "2024-01-14",
  },
]

export default function NotePage() {
  const params = useParams()
  const navigate = useNavigate()
  const noteId = params.id

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [selectedColor, setSelectedColor] = useState("default")
  const [isPinned, setIsPinned] = useState(false)
  useEffect(() => {
    if (noteId) {
      // Edit existing note
      const note = sampleNotes.find((n) => n.id === noteId)
      if (note) {
        setTitle(note.title)
        setContent(note.content)
        setCategory(note.category)
        setSelectedColor(note.color)
        setIsPinned(note.isPinned)
      }
    }
  }, [noteId])

  const selectedColorBg = colors.find((color) => color.value === selectedColor)?.bg || "bg-card"

  const handleSave = () => {
    console.log("Saving note:", { id: noteId, title, content, category, selectedColor, isPinned })
    navigate("/")
  }

  const handleDelete = () => {
    console.log("Deleting note:", noteId)
    navigate("/")
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPinned(!isPinned)}
              className={isPinned ? "text-primary" : ""}
            >
              <Pin className={`h-5 w-5 ${isPinned ? "fill-current" : ""}`} />
            </Button>

            <Button variant="ghost" size="icon" onClick={() => setSelectedColor("default")}>
              <Palette className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => console.log("Pin note:", noteId)}>
                  <Pin className="h-4 w-4 mr-2" />
                  {isPinned ? "Unpin" : "Pin"} Note
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => console.log("Archive note:", noteId)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                {noteId && (
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={handleSave} className="ml-2">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className={`${selectedColorBg} rounded-lg border border-border p-6 shadow-sm`}>
            {/* Title Input */}
            <Input
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold border-none bg-transparent p-0 mb-4 placeholder:text-muted-foreground focus-visible:ring-0"
            />

            {/* Category Selection */}
            <div className="mb-4">
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-48 bg-transparent border border-border rounded px-3 py-2"
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
              className="min-h-[400px] border-none bg-transparent p-0 resize-none placeholder:text-muted-foreground focus-visible:ring-0 text-base leading-relaxed"
            />

            {/* Footer Info */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                {category && (
                  <Badge variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                )}
                {isPinned && (
                  <Badge variant="outline" className="text-xs">
                    Pinned
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">Last edited: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button variant="outline" size="sm">
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
            {noteId && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive bg-transparent"
                onClick={handleDelete}
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
  