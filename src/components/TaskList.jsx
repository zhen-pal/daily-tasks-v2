import { sortTasks, getPriorityLabel, getStatusLabel, getPriorityColor } from '../services/taskService'

export default function TaskList({ tasks, onEdit, onDelete, onToggleStatus }) {
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
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  )
}

function TaskCard({ task, onEdit, onDelete, onToggleStatus }) {
  const isCompleted = task.status === 'completed'
  const priorityColor = getPriorityColor(task.priority)

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${priorityColor} transition-all hover:shadow-lg ${
        isCompleted ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Чекбокс выполнения */}
        <button
          onClick={() => onToggleStatus(task.id)}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isCompleted 
              ? 'bg-success border-success text-white' 
              : 'border-gray-300 hover:border-primary'
          }`}
          title={isCompleted ? 'Отменить выполнение' : 'Отметить выполненным'}
        >
          {isCompleted && '✓'}
        </button>

        {/* Содержимое задачи */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-gray-800 ${isCompleted ? 'line-through' : ''}`}>
            {task.text}
          </p>
          
          <div className="flex flex-wrap gap-2 mt-2 text-xs">
            {task.time && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                 {task.time}
              </span>
            )}
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {getStatusLabel(task.status)}
            </span>
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {getPriorityLabel(task.priority)}
            </span>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors"
            title="Редактировать"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(task.id)}
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