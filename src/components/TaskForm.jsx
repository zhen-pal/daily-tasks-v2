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
  const [interimText, setInterimText] = useState('')
  const [recognitionReady, setRecognitionReady] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const listeningFieldRef = useRef(null)
  const isListeningRef = useRef(false)
  const recognitionRef = useRef(null)
  const lastAddedTextRef = useRef('')
  const processedResultsRef = useRef(new Set())
  const isProcessingRef = useRef(false)

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
    recog.interimResults = true
    recog.lang = 'ru-RU'
    recog.maxAlternatives = 1

    recog.onresult = (event) => {
      const field = listeningFieldRef.current
      if (!field) return

      let interim = ''
      let finalTranscript = ''
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        const resultKey = `${event.timeStamp}-${i}-${transcript}`
        
        if (processedResultsRef.current.has(resultKey)) continue
        
        if (result.isFinal) {
          finalTranscript += transcript
          processedResultsRef.current.add(resultKey)
        } else {
          interim += transcript
        }
      }
      
      if (finalTranscript) {
        const trimmedText = finalTranscript.trim()
        const currentText = field === 'title' ? title : description
        
        if (currentText && currentText.trim().endsWith(trimmedText)) {
          setInterimText('')
          return
        }
        
        if (lastAddedTextRef.current === trimmedText) {
          setInterimText('')
          return
        }
        
        if (field === 'title') {
          setTitle(prev => prev ? prev + ' ' + trimmedText : trimmedText)
        } else if (field === 'description') {
          setDescription(prev => prev ? prev + ' ' + trimmedText : trimmedText)
        }
        
        lastAddedTextRef.current = trimmedText
        setInterimText('')
        processedResultsRef.current.clear()
        
        if (isListeningRef.current) {
          setTimeout(() => {
            try { recog.start() } catch (e) {}
          }, 100)
        }
      } else {
        setInterimText(interim)
      }
    }

    recog.onerror = (event) => {
      console.error('🎤 Error:', event.error)
      if (event.error === 'not-allowed') {
        alert('Доступ к микрофону запрещён. Разрешите доступ в настройках браузера.')
      }
    }

    recog.onend = () => {
      processedResultsRef.current.clear()
      lastAddedTextRef.current = ''
      
      if (isListeningRef.current) {
        setIsListening(false)
        setListeningField(null)
        setInterimText('')
        isListeningRef.current = false
        listeningFieldRef.current = null
      }
    }

    recog.onstart = () => {
      processedResultsRef.current.clear()
      lastAddedTextRef.current = ''
    }

    recognitionRef.current = recog
    setRecognitionReady(true)

    return () => {
      try { recog.stop() } catch (e) {}
    }
  }, [])

  // ОДНА УНИВЕРСАЛЬНАЯ ПРОЦЕДУРА ДЛЯ ВСЕХ ПОЛЕЙ
  const handleMicClick = (field) => {
    // Защита от двойного нажатия
    if (isProcessingRef.current) {
      console.log('⏳ Обработка, игнорируем')
      return
    }

    isProcessingRef.current = true
    setTimeout(() => {
      isProcessingRef.current = false
    }, 300)

    const recog = recognitionRef.current
    if (!recog) {
      alert('Голосовой ввод не поддерживается')
      return
    }

    console.log('🎤 Клик для:', field)

    // Если это то же поле и запись идёт - останавливаем
    if (isListeningRef.current && listeningFieldRef.current === field) {
      console.log('⏹️ Остановка')
      try {
        recog.stop()
      } catch (e) {
        console.error('Ошибка stop:', e)
      }
      return
    }

    // Если запись идёт в другом поле - сначала останавливаем
    if (isListeningRef.current) {
      console.log('🔄 Переключение с', listeningFieldRef.current, 'на', field)
      try { recog.stop() } catch (e) {}
      
      // Небольшая задержка перед запуском нового
      setTimeout(() => {
        startRecording(field)
      }, 300)
    } else {
      // Просто начинаем запись
      startRecording(field)
    }
  }

  const startRecording = (field) => {
    const recog = recognitionRef.current
    if (!recog) return

    console.log('🎤 Запуск для:', field)
    
    listeningFieldRef.current = field
    isListeningRef.current = true
    setListeningField(field)
    setIsListening(true)
    setInterimText('')
    processedResultsRef.current.clear()
    lastAddedTextRef.current = ''
    
    // Небольшая задержка перед стартом
    setTimeout(() => {
      try {
        recog.start()
        console.log('✅ Запущено')
      } catch (error) {
        console.error('🎤 Ошибка start:', error)
        // Пробуем ещё раз
        setTimeout(() => {
          try {
            recog.start()
            console.log('✅ Запущено со второй попытки')
          } catch (e) {
            console.error('❌ Не удалось:', e)
            setIsListening(false)
            setListeningField(null)
            isListeningRef.current = false
            listeningFieldRef.current = null
          }
        }, 300)
      }
    }, 100)
  }

  const stopRecordingIfNeeded = () => {
    return new Promise((resolve) => {
      if (isListeningRef.current) {
        console.log('⏹️ Остановка перед сохранением')
        try {
          recognitionRef.current.stop()
          setTimeout(() => resolve(), 500)
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
      console.error('❌ Ошибка при сохранении:', error)
      alert('Ошибка при сохранении задачи.')
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

  const isListeningTitle = isListening && listeningField === 'title'
  const isListeningDesc = isListening && listeningField === 'description'

  // КОМПОНЕНТ КНОПКИ МИКРОФОНА (одинаковый для всех полей)
  const MicButton = ({ field, isListeningField }) => {
    if (!recognitionReady) return null

    const handleClick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      handleMicClick(field)
    }

    return (
      <button
        type="button"
        onPointerDown={handleClick}
        onTouchStart={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onTouchEnd={handleClick}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        disabled={isSaving}
        className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all select-none touch-manipulation ${
          isListeningField 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
        } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
        {isListeningTitle && (
          <p className="text-red-500 text-sm mt-1">
            Запись... {interimText && `"${interimText}"`}
          </p>
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
          <MicButton field="description" isListeningField={isListeningDesc} />
        </div>
        <div className="flex justify-between items-start mt-1">
          {isListeningDesc ? (
            <p className="text-red-500 text-sm">
              Запись... {interimText && `"${interimText}"`}
            </p>
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