export default function DateChangeModal({ task, oldDate, newDate, onMove, onCopy, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          📅 Дата изменена
        </h2>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Задача:</p>
          <p className="font-medium text-gray-800 mb-4">{task.title}</p>
          
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <p className="text-sm">
              <span className="text-gray-500">Было:</span> <span className="font-medium">{oldDate}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Стало:</span> <span className="font-medium">{newDate}</span>
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">Что сделать с задачей?</p>

        <div className="flex gap-3">
          <button
            onClick={onMove}
            className="flex-1 bg-primary text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Перенести
          </button>
          <button
            onClick={onCopy}
            className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Скопировать
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}