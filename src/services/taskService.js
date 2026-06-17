// Ключ для хранения в LocalStorage
const STORAGE_KEY = 'daily_tasks'

// Получить текущую дату в локальном часовом поясе (формат YYYY-MM-DD)
export function getLocalDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Получить задачи на дату
export function getTasks(date) {
  try {
    const allTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return allTasks[date] || []
  } catch (error) {
    console.error('Ошибка чтения из localStorage:', error)
    return []
  }
}

// Сохранить задачи на дату
export function saveTasks(date, tasks) {
  try {
    const allTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    allTasks[date] = tasks
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allTasks))
  } catch (error) {
    console.error('Ошибка записи в localStorage:', error)
    alert('Не удалось сохранить данные. Возможно, хранилище переполнено.')
  }
}

// Сортировка задач
export function sortTasks(tasks) {
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  
  return [...tasks].sort((a, b) => {
    // Сначала задачи со временем
    if (a.time && !b.time) return -1
    if (!a.time && b.time) return 1
    
    // Если обе со временем - по времени
    if (a.time && b.time) {
      if (a.time !== b.time) {
        return a.time.localeCompare(b.time)
      }
      // Если время одинаковое - по приоритету
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    
    // Если обе без времени - по приоритету
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

// Экспорт в CSV (с правильным экранированием)
export function exportToCSV(tasks, date) {
  const headers = ['Задача', 'Время', 'Приоритет', 'Статус']
  const rows = tasks.map(task => [
    task.text,
    task.time || '—',
    getPriorityLabel(task.priority),
    getStatusLabel(task.status)
  ])
  
  // Функция экранирования для CSV
  const escapeCSV = (value) => {
    const str = String(value)
    // Если есть кавычки, запятые или переносы строк - оборачиваем в кавычки
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n')
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `задачи_${date}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Вспомогательные функции для отображения
export function getPriorityLabel(priority) {
  const labels = { high: 'Высокий', medium: 'Средний', low: 'Низкий' }
  return labels[priority] || priority
}

export function getStatusLabel(status) {
  const labels = { 
    new: 'Новое', 
    in_progress: 'В работе', 
    paused: 'На паузе', 
    completed: 'Выполнено' 
  }
  return labels[status] || status
}

export function getPriorityColor(priority) {
  const colors = {
    high: 'border-danger',
    medium: 'border-warning',
    low: 'border-success'
  }
  return colors[priority] || 'border-gray-400'
}
// Перенос или копирование задачи на другую дату
export function moveOrCopyTask(task, fromDate, toDate, mode) {
  // mode: 'move' (перенести) или 'copy' (скопировать)
  
  // Получаем задачи на новую дату
  const targetTasks = getTasks(toDate)
  
  // Создаем новую задачу (с новым ID если копируем)
  const newTask = {
    ...task,
    id: mode === 'copy' ? generateNewId() : task.id
  }
  
  // Добавляем задачу на новую дату
  targetTasks.push(newTask)
  saveTasks(toDate, targetTasks)
  
  // Если переносим - удаляем со старой даты
  if (mode === 'move' && fromDate !== toDate) {
    const sourceTasks = getTasks(fromDate)
    const filteredTasks = sourceTasks.filter(t => t.id !== task.id)
    saveTasks(fromDate, filteredTasks)
  }
}

// Генератор нового ID
function generateNewId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}