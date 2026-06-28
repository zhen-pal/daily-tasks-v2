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
  const [isSaving, setIsSaving] = useState(false)
  const [recState, setRecState] = useState('idle')
  const [listeningField, setListeningField] = useState(null)
  
  // 🔔 НАПОМИНАНИЯ (максимум 2)
  const [reminders, setReminders] = useState([])
  const [newReminderTime, setNewReminderTime] = useState('')
  
  const listeningFieldRef = useRef(null)
  const recognitionRef = useRef(null)
  const pendingFieldRef = useRef(null)

  // Загрузка данных задачи
  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setDescription(task.description || '')
      setDate(task.date || currentDate)
      setTime(task.time || '')
      setStatus(task.status || 'new')
      setPriority(task.priority || 'medium')
      
      // 🔔 ЗАГРУЖАЕМ НАПОМИНАНИЯ ИЗ ЗАДАЧИ
      const taskReminders = task.reminders || []
      setReminders(taskReminders)
      
      console.log('[TaskForm] Загружена задача:', {
        id: task.id,
        time: task.time,
        reminders: taskReminders
      })
    } else {
      setDate(currentDate)
      setReminders([])
    }
  }, [task, currentDate])

  // Если время очищено — очищаем напоминания
  useEffect(() => {
    if (!time) {
      setReminders([])
      setNewReminderTime('')
    }
  }, [time])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  // === ГОЛОСОВОЙ ВВОД ===
  const startVoiceInput = (field) => {
    if (recState === 'listening' && listeningFieldRef.current === field) {
      setRecState('stopping')
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      return
    }
    
    if (recState === 'listening' && listeningFieldRef.current !== field) {
      setRecState('stopping')
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      pendingFieldRef.current = field
      return
    }

    if (recState === 'stopping' || recState === 'starting') {
      return
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Голосовой ввод не поддерживается в этом браузере.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.lang = 'ru-RU'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setRecState('listening')
      listeningFieldRef.current = field
      setListeningField(field)
    }

    recognition.onend = () => {
      setRecState('idle')
      setListeningField(null)
      if (pendingFieldRef.current) {
        const next = pendingFieldRef.current
        pendingFieldRef.current = null
        setTimeout(() => {
          startVoiceInput(next)
        }, 100)
      }
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      if (field === 'title') {
        setTitle(prev => prev ? prev + ' ' + transcript : transcript)
      } else if (field === 'description') {
        setDescription(prev => prev ? prev + ' ' + transcript : transcript)
      }
    }

    recognition.onerror = (event) => {
      console.error('Ошибка распознавания:', event.error)
      setRecState('idle')
      setListeningField(null)
      
      const errorMessages = {
        'no-speech': 'Речь не обнаружена. Попробуйте ещё раз.',
        'audio-capture': 'Микрофон не найден. Проверьте настройки.',
        'not-allowed': 'Доступ к микрофону запрещён. Разрешите в настройках браузера.'
      }
      
      alert(errorMessages[event.error] || 'Ошибка распознавания голоса.')
    }

    try {
      recognition.start()
    } catch (error) {
      console.error('Ошибка запуска:', error)
      setRecState('idle')
      setListeningField(null)
    }
  }

  // === НАПОМИНАНИЯ ===
  const addReminder = () => {
    if (newReminderTime && reminders.length < 2 && !reminders.includes(newReminderTime)) {
      setReminders([...reminders, newReminderTime].sort())
      setNewReminderTime('')
    }
  }

  const removeReminder = (timeToRemove) => {
    setReminders(reminders.filter(t => t !== timeToRemove))
  }

  // === СОХРАНЕНИЕ ===
  const stopRecordingIfNeeded = () => {
    return new Promise((resolve) => {
      if (recState === 'listening' || recState === 'starting') {
        try {
          recognitionRef.current?.stop()
          setTimeout(() => resolve(), 300)
        } catch (e) {
          resolve()
        }
      } else {
        resolve()
      }
    })
  }

  const validateTime = (timeValue) => {
    if (!timeValue) return true
    const match = timeValue.match(/^(\d{2}):(\d{2})$/)
    if (!match) return false
    const hours = parseInt(match[1])
    const minutes = parseInt(match[2])
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTitleError('')
    setTimeError('')
    
    if (isSaving) {
      console.log('[TaskForm] Уже идёт сохранение, пропускаем')
      return
    }

    console.log('[TaskForm] Начинаем сохранение...')
    await stopRecordingIfNeeded()

    if (!title.trim()) {
      setTitleError('Введите название задачи')
      return
    }

    if (time && !validateTime(time)) {
      setTimeError('Введите время в формате ЧЧ:ММ')
      return
    }

    setIsSaving(true)

    const taskData = {
      id: task?.id,
      title: title.trim(),
      description: description.trim(),
      date,
      time: time || null,
      status,
      priority,
      // 🔔 СОХРАНЯЕМ НАПОМИНАНИЯ
      reminders: reminders.length > 0 ? reminders : null,
      userId
    }

    if (task && date !== task.date) {
      taskData.dateChanged = true
    }

    console.log('[TaskForm] Сохраняем задачу:', taskData)

    try {
      await onSave(taskData)
      console.log('[TaskForm] Задача успешно сохранена')
    } catch (error) {
      console.error('[TaskForm] Ошибка сохранения:', error)
      alert('Ошибка при сохранении: ' + error.message)
    } finally {
      setIsSaving(false)
      console.log('[TaskForm] Сохранение завершено')
    }
  }

  const handleTimeChange = (e) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 4) value = value.slice(0, 4)
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

  const isListeningTitle = recState === 'listening' && listeningField === 'title'
  const isListeningDesc = recState === 'listening' && listeningField === 'description'

  const MicButton = ({ field, isListeningField }) => {
    const handleClick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      startVoiceInput(field)
    }

    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isSaving}
        className={`w-11 h-11 flex items-center justify-center rounded-lg transition-all select-none touch-manipulation flex-shrink-0 ${
          isListeningField 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
        } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={isListeningField ? 'Остановить запись' : 'Голосовой ввод'}
      >
        {isListeningField ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        )}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 md:p-6 shadow-md mb-4">
      <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3">
        {task ? '✏️ Редактировать задачу' : '➕ Новая задача'}
      </h2>

      {/* Название */}
      <div className="mb-3">
        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
          Что нужно сделать? *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Купить продукты"
            className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base ${
              titleError ? 'border-red-300' : 'border-gray-300'
            }`}
            autoFocus
          />
          <MicButton field="title" isListeningField={isListeningTitle} />
        </div>
        {titleError && (
          <p className="text-red-500 text-xs mt-1">{titleError}</p>
        )}
      </div>

      {/* Описание */}
      <div className="mb-3">
        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
          Описание
        </label>
        <div className="flex gap-2">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Подробности задачи..."
            maxLength={500}
            rows={3}
            className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm md:text-base ${
              isListeningDesc ? 'pointer-events-none opacity-90' : ''
            }`}
          />
          <MicButton field="description" isListeningField={isListeningDesc} />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {description.length}/500 символов
        </p>
      </div>

      {/* Дата, Время и Напоминания */}
      <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
            📅 Дата
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
            required
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
            🕐 Время
          </label>
          <input
            type="text"
            value={time}
            onChange={handleTimeChange}
            placeholder="ЧЧ:ММ"
            inputMode="numeric"
            maxLength={5}
            className={`w-full px-2 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm md:text-base ${
              timeError ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {timeError && (
            <p className="text-red-500 text-xs mt-1">{timeError}</p>
          )}
        </div>

        {/* Напоминание — только если есть время */}
        {time && (
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              🔔 Напомнить
            </label>
            <div className="flex gap-1">
              <input
                type="time"
                value={newReminderTime}
                onChange={(e) => setNewReminderTime(e.target.value)}
                className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                disabled={reminders.length >= 2}
              />
              <button
                type="button"
                onClick={addReminder}
                disabled={!newReminderTime || reminders.length >= 2}
                className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 disabled:opacity-50 font-medium text-sm"
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Список напоминаний — ПОКАЗЫВАЕМ ВСЕГДА ЕСЛИ ЕСТЬ */}
      {reminders.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {reminders.map((reminderTime, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
            >
              🔔 {reminderTime}
              <button
                type="button"
                onClick={() => removeReminder(reminderTime)}
                className="text-blue-500 hover:text-red-500 ml-1"
                disabled={isSaving}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Статус и Приоритет */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
            📊 Статус
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
            🎯 Приоритет
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
          >
            {PRIORITY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Кнопки */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 bg-primary text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          title="Сохранить"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
          title="Отмена"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </form>
  )
}