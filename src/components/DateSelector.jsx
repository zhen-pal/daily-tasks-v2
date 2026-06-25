export default function DateSelector({ selectedDate, onDateChange }) {
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
    </div>
  )
}