export default function DateSelector({ selectedDate, onDateChange }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-2 md:p-3">
      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
        📅 Дата
      </label>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        className="w-full px-2 md:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
      />
      <p className="text-xs text-gray-500 mt-1">{formatDate(selectedDate)}</p>
    </div>
  )
}