import React, { useState } from 'react'
  import { DndProvider } from 'react-dnd'
  import { HTML5Backend } from 'react-dnd-html5-backend'
  import TodoItem from './TodoItem'
  import { useDrop } from 'react-dnd'

  const SECTIONS = [
    { id: 'inbox', name: 'Inbox', icon: '📥' },
    { id: 'today', name: 'Today', icon: '📅' },
    { id: 'later', name: 'Later', icon: '📊' }
  ]

  function Section({ section, todos, onToggleComplete, onRemove, onMove, onUpdate, onNest }) {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: 'TODO',
      drop: (item, monitor) => {
        if (!monitor.didDrop()) {
          onMove(item.id, section.id)
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver({ shallow: true })
      })
    }))

    const renderTodos = (parentId = null) => {
      return todos
        .filter(todo => todo.section === section.id && todo.parentId === parentId)
        .map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggleComplete={onToggleComplete}
            onRemove={onRemove}
            onMove={onMove}
            onUpdate={onUpdate}
            onNest={onNest}
            hasChildren={todos.some(t => t.parentId === todo.id)}
          >
            {renderTodos(todo.id)}
          </TodoItem>
        ))
    }

    return (
      <div
        ref={drop}
        className={`
          section-card p-4
          transform transition-all duration-200 ease-in-out
          ${isOver ? 'ring-2 ring-blue-300 scale-[1.02] shadow-lg' : ''}
        `}
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>{section.icon}</span>
          {section.name}
        </h2>
        <div className="space-y-3">
          {renderTodos(null)}
        </div>
      </div>
    )
  }

  export default function App() {
    const [todos, setTodos] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [activeSection, setActiveSection] = useState('inbox')

    const addTodo = (e) => {
      e.preventDefault()
      if (inputValue.trim()) {
        const newTodo = {
          id: Date.now(),
          text: inputValue.trim(),
          completed: false,
          section: activeSection,
          parentId: null,
          dueDate: null,
          priority: null,
          notes: ''
        }
        setTodos(prev => [...prev, newTodo])
        setInputValue('')
      }
    }

    const toggleComplete = (id) => {
      setTodos(prev =>
        prev.map(todo =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        )
      )
    }

    const removeTodo = (id) => {
      setTodos(prev => {
        const removeIds = new Set([id])
        const getAllChildrenIds = (todoId) => {
          prev.forEach(todo => {
            if (todo.parentId === todoId) {
              removeIds.add(todo.id)
              getAllChildrenIds(todo.id)
            }
          })
        }
        getAllChildrenIds(id)
        return prev.filter(todo => !removeIds.has(todo.id))
      })
    }

    const moveTodoToSection = (id, newSection, newParentId = null, siblingId = null, position = null) => {
      setTodos(prev => {
        const updatedTodos = prev.map(todo => {
          if (todo.id === id) {
            return {
              ...todo,
              section: newSection,
              parentId: newParentId
            }
          }
          return todo
        })

        if (siblingId && position) {
          const movedTodo = updatedTodos.find(t => t.id === id)
          const filteredTodos = updatedTodos.filter(t => t.id !== id)
          const siblingIndex = filteredTodos.findIndex(t => t.id === siblingId)
          
          return [
            ...filteredTodos.slice(0, position === 'before' ? siblingIndex : siblingIndex + 1),
            movedTodo,
            ...filteredTodos.slice(position === 'before' ? siblingIndex : siblingIndex + 1)
          ]
        }

        return updatedTodos
      })
    }

    const nestTodo = (parentId, childId) => {
      if (parentId === childId) return

      setTodos(prev => {
        const wouldCreateCircular = (todoId, targetParentId) => {
          let currentId = targetParentId
          while (currentId) {
            if (currentId === todoId) return true
            const parent = prev.find(t => t.id === currentId)
            currentId = parent?.parentId
          }
          return false
        }

        if (wouldCreateCircular(parentId, childId)) return prev

        const parentTodo = prev.find(t => t.id === parentId)
        if (!parentTodo) return prev

        return prev.map(todo =>
          todo.id === childId
            ? { ...todo, parentId, section: parentTodo.section }
            : todo
        )
      })
    }

    const updateTodo = (id, updatedTodo) => {
      setTodos(prev =>
        prev.map(todo =>
          todo.id === id ? { ...todo, ...updatedTodo } : todo
        )
      )
    }

    return (
      <DndProvider backend={HTML5Backend}>
        <div className="min-h-screen p-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">
              Todo App
            </h1>

            <form onSubmit={addTodo} className="mb-8 max-w-xl mx-auto">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Add a new todo..."
                  className="flex-1 p-2 border rounded-lg focus:ring-2 
                    focus:ring-blue-300 focus:border-blue-300 outline-none"
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg 
                    hover:bg-blue-600 transition-colors"
                >
                  Add
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SECTIONS.map(section => (
                <Section
                  key={section.id}
                  section={section}
                  todos={todos}
                  onToggleComplete={toggleComplete}
                  onRemove={removeTodo}
                  onMove={moveTodoToSection}
                  onUpdate={updateTodo}
                  onNest={nestTodo}
                />
              ))}
            </div>
          </div>
        </div>
      </DndProvider>
    )
  }
