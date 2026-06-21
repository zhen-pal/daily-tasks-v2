import { useState, useEffect } from 'react'
import { sortTasks, getPriorityLabel, getStatusLabel, getPriorityColor } from '../services/taskService'

export default function TaskList({ tasks, onEdit, onDelete, onCopy, onToggleStatus, onUpdateField }) {
  const sortedTasks = sortTasks(tasks)

  if (sortedTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
        <p className="text-lg">📝 Задач на этот день пока нет</p>
        <p className="text-sm mt-2">Нажмите "Добавить задачу", чтобы начать</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedTasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onCopy={onCopy}
          onToggleStatus={onToggleStatus}
          onUpdateField={onUpdateField}
        />
      ))}
    </div>
  )
}

function TaskCard({ task, onEdit, onDelete, onCopy, onToggleStatus, onUpdateField }) {
  const isCompleted = task.status === 'completed'
  const priorityColor = getPriorityColor(task.priority)
  const [showPriorityMenu, setShowPriorityMenu] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  // Закрытие меню при клике вне
  useEffect(() => {
    const handleClickOutside = () => {
      setShowPriorityMenu(false)
      setShowStatusMenu(false)
    }
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  const handlePriorityChange = (newPriority) => {
    console.log('Changing priority to:', newPriority, 'for task:', task.id)
    onUpdateField(task.id, 'priority', newPriority)
    setShowPriorityMenu(false)
  }

  const handleStatusChange = (newStatus) => {
    console.log('Changing status to:', newStatus, 'for task:', task.id)
    onUpdateField(task.id, 'status', newStatus)
    setShowStatusMenu(false)
  }

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${priorityColor} transition-all hover:shadow-lg ${
        isCompleted ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => {
            console.log('Toggle status for task:', task.id)
            onToggleStatus(task.id)
          }}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isCompleted 
              ? 'bg-success border-success text-white' 
              : 'border-gray-300 hover:border-primary'
          }`}
          title={isCompleted ? 'Отменить выполнение' : 'Отметить выполненным'}
        >
          {isCompleted && '✓'}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`font-medium text-gray-800 ${isCompleted ? 'line-through' : ''}`}>
            {task.text}
          </p>
          
          <div className="flex flex-wrap gap-2 mt-2 text-xs">
            {task.time && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                🕐 {task.time}
              </span>
            )}
            
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowStatusMenu(!showStatusMenu)
                  setShowPriorityMenu(false)
                }}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                title="Нажмите для изменения статуса"
              >
                {getStatusLabel(task.status)}
              </button>
              {showStatusMenu && (
                <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[120px]">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleStatusChange('new')
                    }}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    🆕 Новое
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleStatusChange('in_progress')
                    }}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    ⚙️ В работе
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleStatusChange('paused')
                    }}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    ⏸️ На паузе
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleStatusChange('completed')
                    }}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    ✅ Выполнено
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowPriorityMenu(!showPriorityMenu)
                  setShowStatusMenu(false)
                }}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                title="Нажмите для изменения приоритета"
              >
                {getPriorityLabel(task.priority)}
              </button>
              {showPriorityMenu && (
                <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[120px] left-0">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handlePriorityChange('high')
                    }}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    🔴 Высокий
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handlePriorityChange('medium')
                    }}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    🟡 Средний
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handlePriorityChange('low')
                    }}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    🟢 Низкий
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Copy task:', task.id)
              onCopy(task)
            }}
            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors"
            title="Копировать задачу"
          >
            📋
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Edit task:', task.id)
              onEdit(task)
            }}
            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors"
            title="Редактировать"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Delete task:', task.id)
              onDelete(task.id)
            }}
            className="p-2 text-gray-600 hover:text-danger hover:bg-gray-100 rounded transition-colors"
            title="Удалить"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}