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

  const listeningFieldRef = useRef(null)
  const recognitionRef = useRef(null)
  const lastFinalIndexRef = useRef(0)
  const lastInterimRef = useRef('')
  const pendingFieldRef = useRef(null)
  const baseTextRef = useRef('')

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
      console.log('[VoiceInput] SpeechRecognition не поддерживается')
      return
    }

    const recog = new SpeechRecognition()
    recog.continuous = true
    recog.interimResults = true
    recog.lang = 'ru-RU'
    recog.maxAlternatives = 1

    recog.onresult = (event) => {
      const field = listeningFieldRef.current
      if (!field) {
        console.log('[VoiceInput] onresult: field is null')
        return
      }

      let interim = ''
      let newFinal = ''

      // Обрабатываем ТОЛЬКО результаты от lastFinalIndex до конца
      for (let i = lastFinalIndexRef.current; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        
        if (result.isFinal) {
          // Финальный результат — добавляем и сдвигаем индекс
          newFinal += (newFinal ? ' ' : '') + transcript
          lastFinalIndexRef.current = i + 1
          console.log('[VoiceInput] Final result:', transcript, 'newIndex:', lastFinalIndexRef.current)
        } else {
          // Interim результат — только показываем
          interim += (interim ? ' ' : '') + transcript
        }
      }

      console.log('[VoiceInput] Total final:', newFinal, '| Interim:', interim)

      // Обновляем поле
      if (newFinal || interim) {
        const setter = field === 'title' ? setTitle : setDescription
        
        setter(prev => {
          // Сохраняем базовый текст (без interim)
          let baseText = baseTextRef.current || prev
          
          // Если есть новый финальный текст — добавляем его к базе
          if (newFinal) {
            baseText = baseText ? baseText + ' ' + newFinal : newFinal
            baseTextRef.current = baseText
          }
          
          // Добавляем interim (он будет заменён следующим interim или следующим final)
          const resultText = interim ? baseText + ' ' + interim : baseText
          console.log('[VoiceInput] Setting text:', resultText)
          
          return resultText.trim()
        })
      }

      lastInterimRef.current = interim
    }

    recog.onerror = (event) => {
      console.error('[VoiceInput] Error:', event.error)
      if (event.error === 'not-allowed') {
        alert('Доступ к микрофону запрещён.')
        setRecState('idle')
      }
    }

    recog.onstart = () => {
      console.log('[VoiceInput] onstart: field:', listeningFieldRef.current)
      setRecState('listening')
      lastFinalIndexRef.current = 0
      lastInterimRef.current = ''
      // Сохраняем текущий текст как базу
      const field = listeningFieldRef.current
      if (field === 'title') {
        baseTextRef.current = title
      } else if (field === 'description') {
        baseTextRef.current = description
      }
      console.log('[VoiceInput] Base text saved:', baseTextRef.current)
    }

    recog.onend = () => {
      console.log('[VoiceInput] onend, state:', recState)
      
      // Очищаем interim
      lastInterimRef.current = ''
      
      if (pendingFieldRef.current) {
        const next = pendingFieldRef.current
        pendingFieldRef.current = null
        console.log('[VoiceInput] Switching to field:', next)
        setTimeout(() => {
          handleMicClick(next)
        }, 50)
      } else {
        setRecState('idle')
        setListeningField(null)
        listeningFieldRef.current = null
        baseTextRef.current = ''
      }
    }

    recognitionRef.current = recog

    const handleVisibility = () => {
      if (document.hidden && recState === 'listening') {
        console.log('[VoiceInput] Tab hidden, stopping')
        recognitionRef.current?.stop()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      try { recog.stop() } catch (e) {}
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const handleMicClick = (field) => {
    const recog = recognitionRef.current
    if (!recog) {
      alert('Голосовой ввод не поддерживается')
      return
    }

    const oldState = recState

    // Тап по той же кнопке во время записи → СТОП
    if (recState === 'listening' && listeningFieldRef.current === field) {
      console.log('[VoiceInput] State:', oldState, '-> stopping, field:', field)
      setRecState('stopping')
      recog.stop()
      return
    }

    // Тап по другой кнопке во время записи → ПЕРЕКЛЮЧЕНИЕ
    if (recState === 'listening' && listeningFieldRef.current !== field) {
      console.log('[VoiceInput] State:', oldState, '-> stopping (switch), from:', listeningFieldRef.current, 'to:', field)
      setRecState('stopping')
      recog.stop()
      pendingFieldRef.current = field
      return
    }

    // В состояниях 'starting' и 'stopping' — игнорируем
    if (recState === 'starting' || recState === 'stopping') {
      console.log('[VoiceInput] Blocked: state is', recState)
      return
    }

    // Тап в idle → СТАРТ
    if (recState === 'idle') {
      console.log('[VoiceInput] State:', oldState, '-> starting, field:', field)
      setRecState('starting')
      listeningFieldRef.current = field
      setListeningField(field)
      lastFinalIndexRef.current = 0
      lastInterimRef.current = ''
      baseTextRef.current = ''
      
      try {
        recog.start()
      } catch (e) {
        console.error('[VoiceInput] start error:', e)
        setRecState('idle')
        setListeningField(null)
      }
    }
  }

  const stopRecordingIfNeeded = () => {
    return new Promise((resolve) => {
      if (recState === 'listening' || recState === 'starting') {
        console.log('[VoiceInput] Stopping before save')
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

    if (isSaving) return

    await stopRecordingIfNeeded()

    if (!title.trim()) {
      setTitleError('Введите название задачи')
      return
    }

    if (time && !validateTime(time)) {
      setTimeError('Введите время в формате ЧЧ:ММ (например, 14:30)')
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
      userId
    }

    if (task && date !== task.date) {
      taskData.dateChanged = true
    }

    try {
      await onSave(taskData)
    } catch (error) {
      console.error('[TaskForm] Save error:', error)
      alert('Ошибка при сохранении.')
    } finally {
      setIsSaving(false)
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
      handleMicClick(field)
    }

    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isSaving || (recState !== 'idle' && recState !== 'listening')}
        className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all select-none touch-manipulation ${
          isListeningField 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
        } ${(isSaving || recState === 'starting' || recState === 'stopping') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={isListeningField ? 'Остановить запись' : 'Голосовой ввод'}
      >
        {isListeningField ? '⏹️' : '🎤'}
      </button>
    )
  }

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
          <MicButton field="title" isListeningField={isListeningTitle} />
        </div>
        {titleError && (
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
            className={`flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${
              isListeningDesc ? 'pointer-events-none opacity-90' : ''
            }`}
          />
          <MicButton field="description" isListeningField={isListeningDesc} />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {description.length}/500 символов
        </p>
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
          disabled={isSaving}
          className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Сохранение...
            </>
          ) : (
            <>
              💾 Сохранить
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
        >
          Отмена
        </button>
      </div>
    </form>
  )
}