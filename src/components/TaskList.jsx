import { useState } from 'react'

const STATUS_OPTIONS = [
  { value: 'new', label: '🆕 Новое' },
  { value: 'in-progress', label: '⚙️ В работе' },
  { value: 'paused', label: '⏸️ На паузе' },
  { value: 'completed', label: '✅ Выполнено' }
]

const PRIORITY_OPTIONS = [
  { value: 'high', label: '🔴 Высокий', color: 'bg-priority-high text-red-800' },
  { value: 'medium', label: '🟡 Средний', color: 'bg-priority-medium text-yellow-800' },
  { value: 'low', label: '🟢 Низкий', color: 'bg-priority-low text-green-800' }
]

export default function TaskList({ tasks, onEdit, onDelete, onCopy, onToggleStatus, onUpdateField }) {
  const [openStatusMenu, setOpenStatusMenu] = useState(null)
  const [openPriorityMenu, setOpenPriorityMenu] = useState(null)

  const getStatus = (status) => STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]
  const getPriority = (priority) => PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[1]

  const sortedTasks = [...tasks].sort((a, b) => {
    const aHasTime = a.time ? 1 : 0
    const bHasTime = b.time ? 1 : 0
    if (aHasTime !== bHasTime) return bHasTime - aHasTime
    if (a.time && b.time) return a.time.localeCompare(b.time)
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1)
  })

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm">
        <p className="text-6xl mb-4">📝</p>
        <p className="text-gray-500 text-lg">Задач на этот день нет</p>
        <p className="text-gray-400 text-sm mt-2">Нажмите "Добавить задачу" чтобы начать</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedTasks.map(task => {
        const status = getStatus(task.status)
        const priority = getPriority(task.priority)
        const isCompleted = task.status === 'completed'

        return (
          <div
            key={task.id}
            className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all ${
              isCompleted ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => onToggleStatus(task.id)}
                className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-300 hover:border-primary'
                }`}
              >
                {isCompleted && (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className={`font-medium text-gray-800 break-words ${isCompleted ? 'line-through' : ''}`}>
                    {task.title}
                  </h3>
                  {task.time && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex-shrink-0">
                      🕐 {task.time}
                    </span>
                  )}
                </div>

                {task.description && (
                  <p className={`text-sm text-gray-600 mb-2 break-words ${isCompleted ? 'line-through' : ''}`}>
                    {task.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 items-center">
                  <div className="relative">
                    <button
                      onClick={() => {
                        setOpenStatusMenu(openStatusMenu === task.id ? null : task.id)
                        setOpenPriorityMenu(null)
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity bg-gray-100 text-gray-700`}
                    >
                      {status.label}
                    </button>
                    {openStatusMenu === task.id && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-max">
                        {STATUS_OPTIONS.map(option => (
                          <button
                            key={option.value}
                            onClick={() => {
                              onUpdateField(task.id, 'status', option.value)
                              setOpenStatusMenu(null)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                              task.status === option.value ? 'bg-gray-100 font-medium' : ''
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => {
                        setOpenPriorityMenu(openPriorityMenu === task.id ? null : task.id)
                        setOpenStatusMenu(null)
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${priority.color}`}
                    >
                      {priority.label}
                    </button>
                    {openPriorityMenu === task.id && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-max">
                        {PRIORITY_OPTIONS.map(option => (
                          <button
                            key={option.value}
                            onClick={() => {
                              onUpdateField(task.id, 'priority', option.value)
                              setOpenPriorityMenu(null)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                              task.priority === option.value ? 'bg-gray-100 font-medium' : ''
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => onCopy(task)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Копировать на сегодня"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => onEdit(task)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Удалить"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}