import { useState, useEffect, useRef } from 'react'

export default function TaskForm({ task, currentDate, userId, onSave, onCancel }) {
  const [text, setText] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(currentDate)
  const [time, setTime] = useState('')
  const [priority, setPriority] = useState('medium')
  const [status, setStatus] = useState('new')
  const [isListening, setIsListening] = useState(false)
  const [isListeningDesc, setIsListeningDesc] = useState(false)
  const [originalDate, setOriginalDate] = useState(currentDate)
  const recognitionRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (task) {
      setText(task.text || '')
      setDescription(task.description || '')
      setDate(task.date || currentDate)
      setOriginalDate(task.date || currentDate)
      setTime(task.time || '')
      setPriority(task.priority || 'medium')
      setStatus(task.status || 'new')
    } else {
      setDate(currentDate)
      setOriginalDate(currentDate)
    }
  }, [task, currentDate])

  // Авто-ресайз textarea при изменении описания
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.max(textareaRef.current.scrollHeight, 44) + 'px'
    }
  }, [description])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  const startVoiceInput = (field) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Голосовой ввод не поддерживается в этом браузере. Используйте Chrome или Яндекс.Браузер.')
      return
    }

    // Если уже идет запись — останавливаем
    if ((field === 'text' && isListening) || (field === 'description' && isListeningDesc)) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    
    recognition.lang = 'ru-RU'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      if (field === 'description') {
        setIsListeningDesc(true)
      } else {
        setIsListening(true)
      }
    }
    
    recognition.onend = () => {
      setIsListening(false)
      setIsListeningDesc(false)
    }
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      if (field === 'description') {
        setDescription(prev => {
          const newValue = prev ? prev + ' ' + transcript : transcript
          return newValue
        })
      } else {
        setText(transcript)
      }
    }

    recognition.onerror = (event) => {
      console.log('Voice recognition event:', event)
      setIsListening(false)
      setIsListeningDesc(false)
      
      // Игнорируем "aborted" — это не ошибка, а штатная остановка
      if (event.error === 'aborted') {
        console.log('Voice recognition aborted (normal)')
        return
      }
      
      // Игнорируем "no-speech" — просто ничего не сказано
      if (event.error === 'no-speech') {
        console.log('No speech detected')
        return
      }
      
      // Показываем только реальные ошибки
      const errorMessages = {
        'audio-capture': 'Микрофон не найден. Проверьте настройки.',
        'not-allowed': 'Доступ к микрофону запрещён. Разрешите в настройках браузера.',
        'network': 'Ошибка сети. Проверьте подключение.',
        'service-not-allowed': 'Голосовой ввод заблокирован.',
        'bad-grammar': 'Ошибка распознавания.',
        'language-not-supported': 'Язык не поддерживается.'
      }
      
      const message = errorMessages[event.error] || `Ошибка: ${event.error}`
      console.error('Voice recognition error:', event.error)
      // Показываем alert только для реальных ошибок
      if (errorMessages[event.error]) {
        alert(message)
      }
    }

    try {
      recognition.start()
    } catch (error) {
      console.error('Error starting recognition:', error)
      setIsListening(false)
      setIsListeningDesc(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) {
      alert('Введите текст задачи')
      return
    }

    if (description.length > 500) {
      alert('Описание не может превышать 500 символов')
      return
    }

    const dateChanged = date !== originalDate

    onSave({
      id: task?.id,
      userId,
      text: text.trim(),
      description: description.trim(),
      date,
      time,
      priority,
      status,
      dateChanged,
      createdAt: task?.createdAt || new Date().toISOString()
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">
        {task ? '✏️ Редактировать задачу' : '➕ Новая задача'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Текст задачи */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Что нужно сделать?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Например: Купить молоко"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus
            />
            <button
              type="button"
              onClick={() => startVoiceInput('text')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center justify-center ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={isListening ? 'Остановить запись' : 'Голосовой ввод'}
              style={{ width: '44px', height: '44px' }}
            >
              {isListening ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" x2="12" y1="19" y2="22"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Дата */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📅 Дата
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Время */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🕐 Время (необязательно)
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Приоритет и Статус на одной строке */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Приоритет
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="high">🔴 Высокий</option>
              <option value="medium">🟡 Средний</option>
              <option value="low">🟢 Низкий</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Статус
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="new">🆕 Новое</option>
              <option value="in_progress">⚙️ В работе</option>
              <option value="paused">⏸️ На паузе</option>
              <option value="completed">✅ Выполнено</option>
            </select>
          </div>
        </div>

        {/* Описание с микрофоном на одной строке */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📝 Описание (необязательно)
          </label>
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
              }}
              placeholder="Добавьте детали задачи..."
              rows={1}
              maxLength={500}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none overflow-hidden"
              style={{ minHeight: '44px' }}
            />
            <button
              type="button"
              onClick={() => startVoiceInput('description')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center justify-center ${
                isListeningDesc 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={isListeningDesc ? 'Остановить запись' : 'Голосовой ввод описания'}
              style={{ width: '44px', height: '44px', flexShrink: 0 }}
            >
              {isListeningDesc ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" x2="12" y1="19" y2="22"/>
                </svg>
              )}
            </button>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className={`text-sm ${isListeningDesc ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              {isListeningDesc ? '✖️ Запись описания...' : '🎤 Голосовой ввод описания'}
            </span>
            <span className="text-xs text-gray-400">
              {description.length}/500
            </span>
          </div>
        </div>

        {/* Кнопки Сохранить и Отмена */}
        <div className="flex gap-2 pt-4 sticky bottom-0 bg-white pb-2">
          <button
            type="submit"
            className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            {task ? 'Сохранить' : 'Добавить'}
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
  )
}