import { useState, useEffect } from 'react'
import { onAuthChange, logOut } from './firebase/authService'
import { subscribeToTasks, addTask, updateTask, deleteTask, exportToCSV } from './services/taskService'
import Auth from './components/Auth'
import TaskList from './components/TaskList'
import TaskForm from './components/TaskForm'
import DateSelector from './components/DateSelector'
import DateChangeModal from './components/DateChangeModal'
import HelpModal from './components/HelpModal'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [tasks, setTasks] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [pendingTask, setPendingTask] = useState(null)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      console.log('Auth state changed:', currentUser?.email)
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return

    console.log('Subscribing to tasks for user:', user.uid, 'date:', selectedDate)
    const unsubscribe = subscribeToTasks(user.uid, selectedDate, (tasksData) => {
      console.log('Tasks updated:', tasksData.length)
      setTasks(tasksData)
    })

    return () => unsubscribe()
  }, [user, selectedDate])

  const handleSaveTask = async (taskData) => {
    console.log('Saving task:', taskData)
    const { dateChanged, id, ...task } = taskData
    const taskDate = task.date || selectedDate
    
    if (editingTask && dateChanged) {
      const oldDate = editingTask.date || selectedDate
      setPendingTask({ task: { ...task, id: editingTask.id }, oldDate, newDate: taskDate })
      setShowForm(false)
      return
    }
    
    try {
      if (editingTask) {
        console.log('Updating task:', editingTask.id)
        await updateTask(editingTask.id, task)
      } else {
        console.log('Adding new task')
        const newTask = { ...task }
        delete newTask.id
        delete newTask.dateChanged
        await addTask(newTask)
      }
      setShowForm(false)
      setEditingTask(null)
    } catch (error) {
      console.error('Error saving task:', error)
      alert('Ошибка при сохранении задачи')
    }
  }

  const handleMove = async () => {
    if (!pendingTask) return
    
    try {
      const { task, oldDate, newDate } = pendingTask
      console.log('Moving task from', oldDate, 'to', newDate)
      await updateTask(task.id, { ...task, date: newDate })
      setPendingTask(null)
      setEditingTask(null)
    } catch (error) {
      console.error('Error moving task:', error)
      alert('Ошибка при переносе задачи')
    }
  }

  const handleCopy = async () => {
    if (!pendingTask) return
    
    try {
      const { task, newDate } = pendingTask
      const copiedTask = { 
        ...task, 
        date: newDate,
        createdAt: new Date().toISOString()
      }
      delete copiedTask.id
      
      console.log('Copying task to', newDate)
      await addTask(copiedTask)
      setPendingTask(null)
      setEditingTask(null)
    } catch (error) {
      console.error('Error copying task:', error)
      alert('Ошибка при копировании задачи')
    }
  }

  const handleCancelMove = () => {
    setPendingTask(null)
    setEditingTask(null)
  }

  const handleToggleStatus = async (taskId) => {
    console.log('Toggling status for task:', taskId)
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const newStatus = task.status === 'completed' ? 'new' : 'completed'
    try {
      await updateTask(taskId, { status: newStatus })
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Удалить задачу?')) return
    console.log('Deleting task:', taskId)
    try {
      await deleteTask(taskId)
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Ошибка при удалении задачи')
    }
  }

  const handleEditTask = (task) => {
    console.log('Editing task:', task.id)
    setEditingTask(task)
    setShowForm(true)
  }

  const handleCopyTask = async (task) => {
    console.log('Copying task:', task.id)
    const newTask = { 
      ...task,
      date: selectedDate,
      createdAt: new Date().toISOString()
    }
    delete newTask.id
    try {
      await addTask(newTask)
    } catch (error) {
      console.error('Error copying task:', error)
    }
  }

  const handleUpdateField = async (taskId, field, value) => {
    console.log(`Updating field ${field} to ${value} for task:`, taskId)
    try {
      await updateTask(taskId, { [field]: value })
    } catch (error) {
      console.error('Error updating field:', error)
    }
  }

  const handleExport = () => {
    exportToCSV(tasks, selectedDate)
  }

  const handleLogout = async () => {
    if (window.confirm('Выйти из аккаунта?')) {
      await logOut()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Auth onAuth={setUser} />
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-3 max-w-2xl flex justify-between items-center">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {user.email?.[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-800">{user.displayName || user.email}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHelp(true)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2"
                title="Помощь"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Помощь
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                🚪 Выйти
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              еЖЕдневНЯ - Мои задачи
            </h1>
            <p className="text-lg text-gray-600">Организуйте свой день эффективно</p>
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
              ➕ Добавить задачу
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
              userId={user.uid}
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
            onCopy={handleCopyTask}
            onToggleStatus={handleToggleStatus}
            onUpdateField={handleUpdateField}
          />
        </div>

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

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  )
}

export default App