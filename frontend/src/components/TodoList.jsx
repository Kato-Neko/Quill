import { useState } from "react"
import { Check, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function TodoList({ todos = [], onTodosChange }) {
  const [newTodo, setNewTodo] = useState("")

  const addTodo = () => {
    if (newTodo.trim()) {
      const updatedTodos = [...todos, { id: Date.now().toString(), text: newTodo.trim(), completed: false }]
      onTodosChange(updatedTodos)
      setNewTodo("")
    }
  }

  const toggleTodo = (id) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
    onTodosChange(updatedTodos)
  }

  const deleteTodo = (id) => {
    const updatedTodos = todos.filter(todo => todo.id !== id)
    onTodosChange(updatedTodos)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTodo()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Add a todo item..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button onClick={addTodo} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {todos.length > 0 && (
        <div className="space-y-2">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center gap-2 p-2 rounded-md border ${
                todo.completed 
                  ? 'bg-muted/50 border-muted text-muted-foreground' 
                  : 'bg-background border-border'
              }`}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleTodo(todo.id)}
                className="h-6 w-6 p-0"
              >
                {todo.completed ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 border border-muted-foreground rounded-sm" />
                )}
              </Button>
              
              <span
                className={`flex-1 ${
                  todo.completed ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {todo.text}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteTodo(todo.id)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {todos.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {todos.filter(todo => todo.completed).length} of {todos.length} completed
        </div>
      )}
    </div>
  )
}
