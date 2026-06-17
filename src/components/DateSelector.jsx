import { useState } from 'react'

export default function DateSelector({ selectedDate, onDateChange }) {
  const today = new Date().toISOString().split('T')[0]
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        📅 Выберите дату
      </label>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
      />
      {selectedDate !== today && (
        <button
          onClick={() => onDateChange(today)}
          className="mt-2 text-sm text-primary hover:underline"
        >
          ← Вернуться к сегодня
        </button>
      )}
    </div>
  )
}