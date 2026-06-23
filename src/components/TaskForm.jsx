import { useState, useEffect } from 'react'

const STATUS_OPTIONS = [
  { value: 'new', label: '🆕 Новое' },
  { value: 'in-progress', label: '⚙️ В работе' },
  { value: 'paused', label: '⏸️ На паузе' },
  { value: 'completed', label: '✅ Выполнено' }
]

const PRIORITY_OPTIONS = [
  { value: 'high', label: '🔴 Высокий' },
  { value: 'medium', label: '🟡 Средний' },
  { value: 'low', label: '🟢 Низкий' }
]

export default function TaskForm({ task, currentDate, userId, onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(currentDate)
  const [time, setTime] = useState('')
  const [status, setStatus] = useState('new')
  const [priority, setPriority] = useState('medium')
  const [titleError, setTitleError] = useState('')
  const [isListeningTitle, setIsListeningTitle] = useState(false)
  const [isListeningDesc, setIsListeningDesc] = useState(false)

  // Поддержка Web Speech API для голосового ввода
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const recognition = SpeechRecognition ? new SpeechRecognition() : null

  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setDescription(task.description || '')
      setDate(task.date || currentDate)
      setTime(task.time || '')
      setStatus(task.status || 'new')
      setPriority(task.priority || 'medium')
    }
  }, [task, currentDate])

  useEffect(() => {
    if (!recognition) return
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'ru-RU'

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      
      if (isListeningTitle) {
        setTitle(prev => prev ? prev + ' ' + transcript : transcript)
        setIsListeningTitle(false)
      } else if (isListeningDesc) {
        setDescription(prev => prev ? prev + ' ' + transcript : transcript)
        setIsListeningDesc(false)
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListeningTitle(false)
      setIsListeningDesc(false)
      if (event.error === 'not-allowed') {
        alert('Доступ к микрофону запрещён. Разрешите доступ в настройках браузера.')
      }
    }

    recognition.onend = () => {
      setIsListeningTitle(false)
      setIsListeningDesc(false)
    }
  }, [recognition, isListeningTitle, isListeningDesc])

  const startListening = (field) => {
    if (!recognition) {
      alert('Голосовой ввод не поддерживается вашим браузером')
      return
    }

    if (field === 'title') {
      setIsListeningTitle(true)
      setIsListeningDesc(false)
    } else {
      setIsListeningDesc(true)
      setIsListeningTitle(false)
    }
    
    recognition.start()
  }

  const stopListening = () => {
    if (recognition) {
      recognition.stop()
    }
    setIsListeningTitle(false)
    setIsListeningDesc(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setTitleError('')

    if (!title.trim()) {
      setTitleError('Введите название задачи')
      return
    }

    const taskData = {
      id: task?.id,
      title: title.trim(),
      description: description.trim(),
      date,
      time: time || null,
      status,
      priority,
      userId
    }

    if (task && date !== task.date) {
      taskData.dateChanged = true
    }

    onSave(taskData)
  }

  // Маска для ввода времени в формате HH:MM
  const handleTimeChange = (e) => {
    let value = e.target.value.replace(/\D/g, '') // убираем всё кроме цифр
    
    // Ограничиваем 4 цифрами (HHMM)
    if (value.length > 4) {
      value = value.slice(0, 4)
    }
    
    // Вставляем двоеточие после 2 цифр
    if (value.length >= 2) {
      let hours = value.slice(0, 2)
      let minutes = value.slice(2, 4)
      
      // Валидация часов
      if (parseInt(hours) > 23) hours = '23'
      
      // Валидация минут
      if (minutes.length === 2 && parseInt(minutes) > 59) minutes = '59'
      
      value = hours + (minutes ? ':' + minutes : '')
    }
    
    setTime(value)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-md mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        {task ? '✏️ Редактировать задачу' : '➕ Новая задача'}
      </h2>

      {/* Название задачи с голосовым вводом */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Что нужно сделать? *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Купить продукты"
            className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              titleError ? 'border-red-300' : 'border-gray-300'
            }`}
            autoFocus
          />
          {recognition && (
            <button
              type="button"
              onClick={() => isListeningTitle ? stopListening() : startListening('title')}
              className={`px-4 py-3 rounded-lg transition-colors ${
                isListeningTitle 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isListeningTitle ? 'Остановить запись' : 'Голосовой ввод'}
            >
              🎤
            </button>
          )}
        </div>
        {titleError && (
          <p className="text-red-500 text-sm mt-1">{titleError}</p>
        )}
      </div>

      {/* Описание с голосовым вводом */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Описание (необязательно)
        </label>
        <div className="flex gap-2">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Подробности задачи..."
            maxLength={500}
            rows={3}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
          {recognition && (
            <button
              type="button"
              onClick={() => isListeningDesc ? stopListening() : startListening('desc')}
              className={`px-4 py-3 rounded-lg transition-colors self-start ${
                isListeningDesc 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isListeningDesc ? 'Остановить запись' : 'Голосовой ввод'}
            >
              🎤
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {description.length}/500 символов
        </p>
      </div>

      {/* Дата и время в одной строке */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📅 Дата
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🕐 Время (необязательно)
          </label>
          <input
            type="text"
            value={time}
            onChange={handleTimeChange}
            placeholder="ЧЧ:ММ"
            inputMode="numeric"
            maxLength={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-lg"
          />
          <p className="text-xs text-gray-500 mt-1">
            Пример: 14:30
          </p>
        </div>
      </div>

      {/* Статус */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📊 Статус
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Приоритет */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🎯 Приоритет
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {PRIORITY_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Кнопки */}
      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          💾 Сохранить
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Отмена
        </button>
      </div>
    </form>
  )
}