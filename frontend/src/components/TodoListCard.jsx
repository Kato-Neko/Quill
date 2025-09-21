import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Star, 
  Pin, 
  Archive, 
  Trash2, 
  MoreVertical,
  CheckSquare,
  Square
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TodoListCard({ 
  todoList, 
  onDelete, 
  onPinToggle, 
  onStarToggle, 
  onArchive 
}) {
  const [showActions, setShowActions] = useState(false)
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/note/${todoList.id}`)
  }

  const handleActionClick = (e) => {
    e.stopPropagation()
    setShowActions(!showActions)
  }

  const handleAction = (action, e) => {
    e.stopPropagation()
    setShowActions(false)
    action(todoList.id)
  }

  const completedTodos = todoList.todos.filter(todo => todo.completed).length
  const totalTodos = todoList.todos.length
  const completionPercentage = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0

  return (
    <div 
      className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer relative"
      onClick={handleClick}
    >
      {/* Action Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-8 w-8 p-0"
        onClick={handleActionClick}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {/* Action Menu */}
      {showActions && (
        <div className="absolute top-10 right-2 bg-card border border-border rounded-md shadow-lg z-10 min-w-[160px]">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={(e) => handleAction(onPinToggle, e)}
          >
            <Pin className="h-4 w-4 mr-2" />
            {todoList.isPinned ? "Unpin" : "Pin"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={(e) => handleAction(onStarToggle, e)}
          >
            <Star className="h-4 w-4 mr-2" />
            {todoList.isStarred ? "Unstar" : "Star"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={(e) => handleAction(onArchive, e)}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={(e) => handleAction(onDelete, e)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      )}

      {/* Status Icons */}
      <div className="flex items-center gap-1 mb-2">
        {todoList.isPinned && (
          <Pin className="h-4 w-4 text-primary fill-primary" />
        )}
        {todoList.isStarred && (
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{todoList.title}</h3>

      {/* Category */}
      {todoList.category && (
        <div className="mb-3">
          <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
            {todoList.category}
          </span>
        </div>
      )}

      {/* Todo Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{completedTodos}/{totalTodos}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Todo Items Preview */}
      {todoList.todos && todoList.todos.length > 0 && (
        <div className="space-y-1 mb-3">
          {todoList.todos.slice(0, 3).map((todo, index) => (
            <div key={todo.id || index} className="flex items-center gap-2 text-sm">
              {todo.completed ? (
                <CheckSquare className="h-4 w-4 text-green-500" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={`line-clamp-1 ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                {todo.text}
              </span>
            </div>
          ))}
          {todoList.todos.length > 3 && (
            <div className="text-xs text-muted-foreground">
              +{todoList.todos.length - 3} more items
            </div>
          )}
        </div>
      )}

      {/* Date */}
      <div className="text-xs text-muted-foreground">
        Created {todoList.createdAt}
      </div>
    </div>
  )
}
