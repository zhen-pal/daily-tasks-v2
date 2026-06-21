import { 
  collection, 
  doc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocs
} from 'firebase/firestore'
import { db } from '../firebase/config'

// Ссылка на коллекцию задач
const tasksCollection = collection(db, 'tasks')

// Получить задачи на дату (с подпиской на изменения)
export function subscribeToTasks(userId, date, callback) {
  const q = query(
    tasksCollection,
    where('userId', '==', userId),
    where('date', '==', date),
    orderBy('time', 'asc')
  )

  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(sortTasks(tasks))
  })
}

// Получить все задачи пользователя
export async function getAllTasks(userId) {
  const q = query(
    tasksCollection,
    where('userId', '==', userId)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

// Добавить задачу
export async function addTask(task) {
  try {
    await addDoc(tasksCollection, task)
  } catch (error) {
    console.error('Error adding task:', error)
    throw error
  }
}

// Обновить задачу
export async function updateTask(taskId, updates) {
  try {
    const taskRef = doc(db, 'tasks', taskId)
    await updateDoc(taskRef, updates)
  } catch (error) {
    console.error('Error updating task:', error)
    throw error
  }
}

// Удалить задачу
export async function deleteTask(taskId) {
  try {
    const taskRef = doc(db, 'tasks', taskId)
    await deleteDoc(taskRef)
  } catch (error) {
    console.error('Error deleting task:', error)
    throw error
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

// Экспорт в CSV
export function exportToCSV(tasks, date) {
  const headers = ['Задача', 'Описание', 'Время', 'Приоритет', 'Статус']
  const rows = tasks.map(task => [
    task.text,
    task.description || '—',
    task.time || '—',
    getPriorityLabel(task.priority),
    getStatusLabel(task.status)
  ])
  
  const escapeCSV = (value) => {
    const str = String(value)
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