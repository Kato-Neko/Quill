import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import { Archive, Trash2, Star, StarOff, Pin, RotateCcw } from "lucide-react"

export default function NoteCard({
  note,
  onDelete,
  onPinToggle,
  onStarToggle,
  onArchive,
  onUnarchive,
  onRestore,
  showStar = true,
}) {
  const navigate = useNavigate()

  const openNote = () => navigate(`/note/${note.id}`)

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-md border-border bg-card relative h-full"
      onClick={openNote}
    >
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-card-foreground line-clamp-1">{note.title}</h3>
          <div className="absolute top-2 right-2 flex items-center gap-2">
            {note.category && (
              <Badge variant="secondary" className="text-xs" onClick={(e) => e.stopPropagation()}>
                {note.category}
              </Badge>
            )}
          </div>
        </div>

        {note.content && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-4 whitespace-pre-line">
            {note.content}
          </p>
        )}
        {note.todos && note.todos.length > 0 && (
          <div className="text-sm text-muted-foreground mb-3 space-y-1">
            {note.todos.slice(0, 2).map((t, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className={`inline-block h-3 w-3 rounded-sm border ${t.completed ? 'bg-green-500 border-green-500' : 'border-muted-foreground'}`}></span>
                <span className={`line-clamp-1 ${t.completed ? 'line-through' : ''}`}>{t.text}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-top border-t border-border/60">
          <span className="text-xs text-muted-foreground">{note.createdAt}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onPinToggle?.(note.id) }}
              title={note.isPinned ? "Unpin" : "Pin"}
            >
              <Pin className={`h-4 w-4 ${note.isPinned ? 'fill-current' : ''}`} />
            </Button>
            {showStar && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onStarToggle?.(note.id) }}
                title={note.isStarred ? "Unstar" : "Star"}
              >
                {note.isStarred ? (
                  <Star className="h-4 w-4 fill-current text-yellow-500" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
              </Button>
            )}
            {onArchive && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onArchive(note.id) }}
                title="Archive"
              >
                <Archive className="h-4 w-4" />
              </Button>
            )}
            {onUnarchive && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onUnarchive(note.id) }}
                title="Unarchive"
              >
                <Archive className="h-4 w-4" />
              </Button>
            )}
            {onRestore && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onRestore(note.id) }}
                title="Restore"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete?.(note.id) }}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


