import { useState, useEffect, useRef } from 'react'

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
  const [timeError, setTimeError] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [listeningField, setListeningField] = useState(null)
  const [recognition, setRecognition] = useState(null)
  
  const activeFieldRef = useRef(null)

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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.log('SpeechRecognition не поддерживается')
      return
    }

    const recog = new SpeechRecognition()
    recog.continuous = false
    recog.interimResults = false
    recog.lang = 'ru-RU'

    recog.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      // Пробуем получить поле из ref ИЛИ из state
      const field = activeFieldRef.current || listeningField
      
      console.log('🎤 Transcript:', transcript, 'field:', field, 'from ref:', activeFieldRef.current, 'from state:', listeningField)
      
      if (field === 'title') {
        setTitle(prev => {
          const newValue = prev ? prev + ' ' + transcript : transcript
          console.log('📝 New title:', newValue)
          return newValue
        })
      } else if (field === 'description') {
        setDescription(prev => {
          const newValue = prev ? prev + ' ' + transcript : transcript
          console.log('📝 New description:', newValue)
          return newValue
        })
      }
      
      // Сбрасываем ТОЛЬКО здесь, после успешной записи
      setTimeout(() => {
        setIsListening(false)
        setListeningField(null)
        activeFieldRef.current = null
      }, 100)
    }

    recog.onerror = (event) => {
      console.error('🎤 Error:', event.error)
      // НЕ сбрасываем ref при ошибке!
      setIsListening(false)
      setListeningField(null)
      if (event.error === 'not-allowed') {
        alert('Доступ к микрофону запрещён. Разрешите доступ в настройках браузера.')
      }
    }

    recog.onend = () => {
      console.log('🎤 Recording ended, но ждём result...')
      // НЕ сбрасываем ref! onresult может прийти ПОСЛЕ onend
      // Сбрасываем только UI
      setIsListening(false)
      setListeningField(null)
    }

    setRecognition(recog)
    console.log('🎤 Recognition создан')

    return () => {
      try { recog.stop() } catch (e) {}
    }
  }, [])  // Пустой массив - создаётся один раз

  const startListening = (field) => {
    if (!recognition) {
      alert('Голосовой ввод не поддерживается вашим браузером')
      return
    }

    console.log('🎤 Старт записи для:', field)
    
    // Сначала сохраняем в ref
    activeFieldRef.current = field
    // Потом в state
    setListeningField(field)
    setIsListening(true)
    
    try {
      recognition.start()
    } catch (error) {
      console.error('🎤 Ошибка start:', error)
      // Если уже идёт запись, останавливаем и начинаем заново
      try {
        recognition.stop()
        setTimeout(() => {
          activeFieldRef.current = field
          setListeningField(field)
          setIsListening(true)
          recognition.start()
        }, 100)
      } catch (e) {
        setIsListening(false)
        setListeningField(null)
        activeFieldRef.current = null
      }
    }
  }

  const stopListening = () => {
    console.log('🎤 Остановка записи')
    if (recognition) {
      try { recognition.stop() } catch (e) {}
    }
    setIsListening(false)
    setListeningField(null)
    activeFieldRef.current = null
  }

  const validateTime = (timeValue) => {
    if (!timeValue) return true
    const match = timeValue.match(/^(\d{2}):(\d{2})$/)
    if (!match) return false
    const hours = parseInt(match[1])
    const minutes = parseInt(match[2])
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setTitleError('')
    setTimeError('')

    if (!title.trim()) {
      setTitleError('Введите название задачи')
      return
    }

    if (time && !validateTime(time)) {
      setTimeError('Введите время в формате ЧЧ:ММ (например, 14:30)')
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

  const handleTimeChange = (e) => {
    let value = e.target.value.replace(/\D/g, '')
    
    if (value.length > 4) {
      value = value.slice(0, 4)
    }
    
    if (value.length >= 2) {
      let hours = value.slice(0, 2)
      let minutes = value.slice(2, 4)
      
      if (parseInt(hours) > 23) hours = '23'
      if (minutes.length === 2 && parseInt(minutes) > 59) minutes = '59'
      
      value = hours + (minutes ? ':' + minutes : '')
    }
    
    setTime(value)
    setTimeError('')
  }

  const isListeningTitle = isListening && listeningField === 'title'
  const isListeningDesc = isListening && listeningField === 'description'

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-md mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        {task ? '✏️ Редактировать задачу' : '➕ Новая задача'}
      </h2>

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
        {isListeningTitle && (
          <p className="text-red-500 text-sm mt-1">Запись сообщения...</p>
        )}
        {titleError && !isListeningTitle && (
          <p className="text-red-500 text-sm mt-1">{titleError}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Описание
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
              onClick={() => isListeningDesc ? stopListening() : startListening('description')}
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
        <div className="flex justify-between items-start mt-1">
          {isListeningDesc ? (
            <p className="text-red-500 text-sm">Запись сообщения...</p>
          ) : (
            <p className="text-xs text-gray-500">
              {description.length}/500 символов
            </p>
          )}
        </div>
      </div>

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
            🕐 Время
          </label>
          <input
            type="text"
            value={time}
            onChange={handleTimeChange}
            placeholder="ЧЧ:ММ"
            inputMode="numeric"
            maxLength={5}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-lg ${
              timeError ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Пример: 14:30
          </p>
          {timeError && (
            <p className="text-red-500 text-sm mt-1">{timeError}</p>
          )}
        </div>
      </div>

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