import { useState } from 'react'

export default function MoveTaskModal({ task, currentDate, onConfirm, onCancel }) {
  const [targetDate, setTargetDate] = useState(currentDate)
  const [mode, setMode] = useState('move') // 'move' или 'copy'

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!targetDate) {
      alert('Выберите дату')
      return
    }

    onConfirm(task, targetDate, mode)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">📅 Перенести задачу</h2>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Задача:</p>
          <p className="font-medium">{task.text}</p>
          {task.time && (
            <p className="text-sm text-gray-500 mt-1">🕐 {task.time}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Выбор даты */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Новая дата
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={currentDate}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Режим переноса */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Режим
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="move"
                  checked={mode === 'move'}
                  onChange={(e) => setMode(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">
                  <strong>Перенести</strong> — удалить из текущей даты и добавить в новую
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="copy"
                  checked={mode === 'copy'}
                  onChange={(e) => setMode(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">
                  <strong>Скопировать</strong> — оставить в обеих датах
                </span>
              </label>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              {mode === 'move' ? 'Перенести' : 'Скопировать'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}