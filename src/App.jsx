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
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    const unsubscribe = subscribeToTasks(user.uid, selectedDate, (tasksData) => {
      setTasks(tasksData)
    })
    return () => unsubscribe()
  }, [user, selectedDate])

  const handleSaveTask = async (taskData) => {
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
        await updateTask(editingTask.id, task)
      } else {
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
    try {
      await deleteTask(taskId)
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Ошибка при удалении задачи')
    }
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleCopyTask = async (task) => {
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

  // Возврат к сегодняшней дате
  const handleGoToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0])
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

  const today = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === today

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Верхняя панель пользователя */}
        <div className="bg-white shadow-sm sticky top-0 z-30">
          <div className="container mx-auto px-3 py-2 max-w-2xl flex justify-between items-center">
            <div className="flex items-center gap-2 min-w-0">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                  {user.email?.[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{user.displayName || user.email}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHelp(true)}
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Помощь"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Выйти"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-3 py-3 max-w-2xl">
          {/* Заголовок — компактный */}
          <div className="text-center mb-3">
            <h1 className="text-lg md:text-xl font-bold text-gray-800 whitespace-nowrap">
              еЖЕдневНЯ - Мои задачи
            </h1>
            <p className="text-xs text-gray-600">Организуйте свой день эффективно</p>
          </div>

          {/* Дата (2/3) + кнопки Добавить/Экспорт (1/3) */}
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <DateSelector 
                selectedDate={selectedDate} 
                onDateChange={setSelectedDate} 
              />
              {/* Ссылка "Вернуться к сегодня" */}
              {!isToday && (
                <button
                  onClick={handleGoToToday}
                  className="text-xs text-indigo-600 hover:text-indigo-800 mt-1 flex items-center gap-1"
                >
                  ← Вернуться к сегодня
                </button>
              )}
            </div>
            <div className="w-1/3 flex flex-col gap-2">
              <button
                onClick={() => {
                  setEditingTask(null)
                  setShowForm(true)
                }}
                className="bg-indigo-300 text-white px-2 py-2 rounded-lg shadow-sm hover:bg-indigo-400 transition-all font-medium text-xs md:text-sm flex items-center justify-center gap-1"
              >
                <span>➕</span>
                <span>Добавить</span>
              </button>
              <button
                onClick={handleExport}
                disabled={tasks.length === 0}
                className="bg-white text-gray-600 px-2 py-2 rounded-lg shadow-sm hover:shadow-md transition-all font-medium text-xs md:text-sm flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                title="Экспорт в CSV"
              >
                <span>📥</span>
                <span>Экспорт</span>
              </button>
            </div>
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