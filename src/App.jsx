import { useState, useEffect } from 'react'
import TaskList from './components/TaskList'
import TaskForm from './components/TaskForm'
import DateSelector from './components/DateSelector'
import DateChangeModal from './components/DateChangeModal'
import { getTasks, saveTasks, exportToCSV, getLocalDate } from './services/taskService'

function App() {
  const [selectedDate, setSelectedDate] = useState(getLocalDate())
  const [tasks, setTasks] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [pendingTask, setPendingTask] = useState(null) // Задача, ждущая выбора move/copy

  useEffect(() => {
    const loadedTasks = getTasks(selectedDate)
    setTasks(loadedTasks)
  }, [selectedDate])

  const handleSaveTask = (taskData) => {
    const { dateChanged, ...task } = taskData
    const taskDate = task.date || selectedDate
    
    if (editingTask && dateChanged) {
      // Дата изменилась — спрашиваем что делать
      const oldDate = editingTask.date || selectedDate
      setPendingTask({ task, oldDate, newDate: taskDate })
      setShowForm(false)
      return
    }
    
    if (editingTask) {
      // Редактирование без изменения даты
      const currentTasks = getTasks(taskDate)
      const updatedTasks = currentTasks.map(t => t.id === task.id ? task : t)
      saveTasks(taskDate, updatedTasks)
    } else {
      // Новая задача
      const currentTasks = getTasks(taskDate)
      const newTask = { ...task, id: generateId() }
      currentTasks.push(newTask)
      saveTasks(taskDate, currentTasks)
    }
    
    setTasks(getTasks(selectedDate))
    setShowForm(false)
    setEditingTask(null)
  }

  // Обработчики для модального окна выбора
  const handleMove = () => {
    if (!pendingTask) return
    
    const { task, oldDate, newDate } = pendingTask
    
    // Удаляем со старой даты
    const oldTasks = getTasks(oldDate)
    const filteredOldTasks = oldTasks.filter(t => t.id !== task.id)
    saveTasks(oldDate, filteredOldTasks)
    
    // Добавляем на новую дату
    const newTasks = getTasks(newDate)
    newTasks.push(task)
    saveTasks(newDate, newTasks)
    
    setTasks(getTasks(selectedDate))
    setPendingTask(null)
    setEditingTask(null)
  }

  const handleCopy = () => {
    if (!pendingTask) return
    
    const { task, newDate } = pendingTask
    
    // Создаём копию с новым ID
    const copiedTask = { ...task, id: generateId() }
    
    // Добавляем на новую дату
    const newTasks = getTasks(newDate)
    newTasks.push(copiedTask)
    saveTasks(newDate, newTasks)
    
    setTasks(getTasks(selectedDate))
    setPendingTask(null)
    setEditingTask(null)
  }

  const handleCancelMove = () => {
    setPendingTask(null)
    setEditingTask(null)
  }

  const handleToggleStatus = (taskId) => {
    const currentTasks = getTasks(selectedDate)
    const updatedTasks = currentTasks.map(t => {
      if (t.id === taskId) {
        return { 
          ...t, 
          status: t.status === 'completed' ? 'new' : 'completed' 
        }
      }
      return t
    })
    saveTasks(selectedDate, updatedTasks)
    setTasks(updatedTasks)
  }

  const handleDeleteTask = (taskId) => {
    if (!confirm('Удалить задачу?')) return
    
    const currentTasks = getTasks(selectedDate)
    const filteredTasks = currentTasks.filter(t => t.id !== taskId)
    saveTasks(selectedDate, filteredTasks)
    setTasks(filteredTasks)
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleExport = () => {
    exportToCSV(tasks, selectedDate)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📋 Мои задачи
          </h1>
          <p className="text-gray-600">Организуйте свой день эффективно</p>
        </div>

        <DateSelector 
          selectedDate={selectedDate} 
          onDateChange={setSelectedDate} 
        />

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setEditingTask(null)
              setShowForm(true)
            }}
            className="flex-1 bg-primary text-white px-4 py-3 rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
          >
             Добавить задачу
          </button>
          <button
            onClick={handleExport}
            disabled={tasks.length === 0}
            className="bg-white text-gray-700 px-4 py-3 rounded-lg shadow-md hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📥 Экспорт
          </button>
        </div>

        {showForm && (
          <TaskForm
            task={editingTask}
            currentDate={selectedDate}
            onSave={handleSaveTask}
            onCancel={() => {
              setShowForm(false)
              setEditingTask(null)
            }}
          />
        )}

        <TaskList
          tasks={tasks}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      {/* Модальное окно выбора при изменении даты */}
      {pendingTask && (
        <DateChangeModal
          task={pendingTask.task}
          oldDate={pendingTask.oldDate}
          newDate={pendingTask.newDate}
          onMove={handleMove}
          onCopy={handleCopy}
          onCancel={handleCancelMove}
        />
      )}
    </div>
  )
}

function generateId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export default App