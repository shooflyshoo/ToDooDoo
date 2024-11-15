import React, { useState, useRef, useEffect } from 'react'
  import { useDrag, useDrop } from 'react-dnd'
  import DatePicker from 'react-datepicker'
  import { format, isToday, isPast } from 'date-fns'
  import "react-datepicker/dist/react-datepicker.css"

  const PRIORITIES = {
    high: { label: 'High', color: 'bg-red-500' },
    medium: { label: 'Medium', color: 'bg-yellow-500' },
    low: { label: 'Low', color: 'bg-blue-500' }
  }

  export default function TodoItem({ 
    todo, 
    onToggleComplete, 
    onRemove, 
    onNest,
    onMove,
    onUpdate,
    hasChildren,
    children 
  }) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(todo.text)
    const [showMetadata, setShowMetadata] = useState(false)
    const [tempMetadata, setTempMetadata] = useState({
      dueDate: todo.dueDate,
      priority: todo.priority,
      notes: todo.notes || ''
    })

    const ref = useRef(null)
    const metadataRef = useRef(null)

    // Reset temp metadata when todo changes
    useEffect(() => {
      setTempMetadata({
        dueDate: todo.dueDate,
        priority: todo.priority,
        notes: todo.notes || ''
      })
    }, [todo])

    // Handle click outside for metadata panel
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (metadataRef.current && !metadataRef.current.contains(event.target)) {
          const toggleButton = event.target.closest('[data-metadata-toggle]')
          if (!toggleButton) {
            setShowMetadata(false)
          }
        }
      }

      if (showMetadata) {
        document.addEventListener('mousedown', handleClickOutside)
      }
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [showMetadata])

    const [{ isDragging }, drag] = useDrag({
      type: 'TODO',
      item: { id: todo.id, section: todo.section },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      }),
      canDrag: !isEditing && !showMetadata
    })

    const [{ isOver }, drop] = useDrop({
      accept: 'TODO',
      drop: (item) => {
        if (item.id !== todo.id) {
          onNest(todo.id, item.id)
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver()
      }),
      canDrop: () => !isEditing && !showMetadata
    })

    const dragDropRef = (node) => {
      drag(drop(node))
      ref.current = node
    }

    const getDueDateColor = () => {
      if (!todo.dueDate) return 'text-gray-400'
      const date = new Date(todo.dueDate)
      if (isPast(date) && !isToday(date)) return 'text-red-500'
      if (isToday(date)) return 'text-orange-500'
      return 'text-green-500'
    }

    const handleSaveEdit = () => {
      const trimmedValue = editValue.trim()
      if (trimmedValue && trimmedValue !== todo.text) {
        onUpdate(todo.id, { ...todo, text: trimmedValue })
      }
      setIsEditing(false)
    }

    const handleSaveMetadata = () => {
      onUpdate(todo.id, { 
        ...todo, 
        dueDate: tempMetadata.dueDate,
        priority: tempMetadata.priority,
        notes: tempMetadata.notes.trim()
      })
      setShowMetadata(false)
    }

    const handleCancelMetadata = () => {
      setTempMetadata({
        dueDate: todo.dueDate,
        priority: todo.priority,
        notes: todo.notes || ''
      })
      setShowMetadata(false)
    }

    return (
      <div className="group relative">
        <div
          ref={dragDropRef}
          className={`
            todo-item p-3 bg-white rounded-lg border
            transform transition-all duration-200 ease-in-out
            ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
            ${isOver ? 'ring-2 ring-blue-300 shadow-lg scale-[1.02]' : ''}
            ${isEditing ? 'ring-2 ring-blue-200 shadow-md' : ''}
            ${todo.completed ? 'bg-gray-50' : ''}
            ${!isEditing && !showMetadata && 'cursor-move'}
            hover:shadow-md
          `}
        >
          <div className="flex items-center gap-3">
            {hasChildren && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-5 h-5 flex items-center justify-center text-gray-400 
                  hover:text-gray-600 transition-colors duration-200"
              >
                <span className={`
                  transform transition-transform duration-200
                  ${isExpanded ? 'rotate-90' : 'rotate-0'}
                `}>
                  ▶
                </span>
              </button>
            )}
            
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => onToggleComplete(todo.id)}
              className="h-4 w-4 rounded border-gray-300 text-blue-500 
                focus:ring-blue-400 transition-colors duration-200"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {todo.priority && (
                  <span className={`
                    w-2 h-2 rounded-full
                    ${PRIORITIES[todo.priority].color}
                  `} />
                )}

                {isEditing ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSaveEdit()
                      } else if (e.key === 'Escape') {
                        setIsEditing(false)
                        setEditValue(todo.text)
                      }
                    }}
                    className="w-full px-1 py-0.5 bg-transparent border-none 
                      focus:ring-0 outline-none text-gray-700"
                    autoFocus
                  />
                ) : (
                  <span 
                    onDoubleClick={() => setIsEditing(true)}
                    className={`
                      transition-all duration-200
                      ${todo.completed ? 'line-through text-gray-400' : ''}
                    `}
                  >
                    {todo.text}
                  </span>
                )}
              </div>

              {(todo.dueDate || todo.notes) && (
                <div className="flex items-center gap-2 mt-1 text-xs">
                  {todo.dueDate && (
                    <span className={todo.completed ? 'text-gray-400' : getDueDateColor()}>
                      {format(new Date(todo.dueDate), 'MMM d')}
                    </span>
                  )}
                  {todo.notes && (
                    <span className="text-gray-400">
                      📝
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="w-6 h-6 flex items-center justify-center
                      text-green-500 hover:text-green-600 
                      transition-colors duration-200"
                    title="Save changes (Enter)"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditValue(todo.text)
                    }}
                    className="w-6 h-6 flex items-center justify-center
                      text-gray-400 hover:text-gray-500
                      transition-colors duration-200"
                    title="Cancel editing (Esc)"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    data-metadata-toggle
                    onClick={() => setShowMetadata(!showMetadata)}
                    className="w-6 h-6 flex items-center justify-center
                      text-gray-400 hover:text-blue-500 
                      transition-colors duration-200"
                    title="Show options"
                  >
                    •••
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-6 h-6 flex items-center justify-center
                      text-gray-400 hover:text-blue-500 
                      transition-colors duration-200"
                    title="Edit task"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => onRemove(todo.id)}
                    className="w-6 h-6 flex items-center justify-center
                      text-gray-400 hover:text-red-500 
                      transition-colors duration-200"
                    title="Remove task"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {showMetadata && (
            <div 
              ref={metadataRef}
              className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border p-3 z-10"
            >
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Due Date</label>
                  <DatePicker
                    selected={tempMetadata.dueDate ? new Date(tempMetadata.dueDate) : null}
                    onChange={(date) => setTempMetadata(prev => ({ ...prev, dueDate: date }))}
                    showTimeSelect
                    dateFormat="MMM d, h:mm aa"
                    className="w-full p-1 text-sm border rounded"
                    placeholderText="Set due date"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Priority</label>
                  <select
                    value={tempMetadata.priority || ''}
                    onChange={(e) => setTempMetadata(prev => ({ 
                      ...prev, 
                      priority: e.target.value || null 
                    }))}
                    className="w-full p-1 text-sm border rounded"
                  >
                    <option value="">None</option>
                    {Object.entries(PRIORITIES).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Notes</label>
                  <textarea
                    value={tempMetadata.notes}
                    onChange={(e) => setTempMetadata(prev => ({ 
                      ...prev, 
                      notes: e.target.value 
                    }))}
                    placeholder="Add notes..."
                    className="w-full p-2 text-sm border rounded resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    onClick={handleCancelMetadata}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800
                      transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMetadata}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded
                      hover:bg-blue-600 transition-colors duration-200"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {hasChildren && (
          <div className={`
            ml-6 pl-4 mt-2 border-l-2 border-blue-100
            transition-all duration-200 ease-in-out
            ${isExpanded ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0 overflow-hidden'}
          `}>
            {children}
          </div>
        )}
      </div>
    )
  }
