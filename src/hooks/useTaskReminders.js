import { useEffect, useRef } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/authService'

export function useTaskReminders(user) {
  const checkedRemindersRef = useRef(new Set())
  const notificationPermissionRef = useRef('default')

  useEffect(() => {
    if (!user) return

    // Запрос разрешения на уведомления
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        notificationPermissionRef.current = permission
        console.log('[Reminders] Permission:', permission)
      })
    }

    // Подписка на все задачи пользователя
    const tasksRef = collection(db, 'tasks')
    const q = query(tasksRef, where('userId', '==', user.uid))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date()
      const currentTime = now.toTimeString().slice(0, 5) // "HH:MM"
      const currentDate = now.toISOString().split('T')[0] // "YYYY-MM-DD"

      snapshot.forEach(doc => {
        const task = { id: doc.id, ...doc.data() }
        
        // Проверяем напоминания
        if (task.reminders && task.reminders.length > 0) {
          task.reminders.forEach(reminderTime => {
            const reminderKey = `${task.id}-${reminderTime}`
            
            // Проверяем: сегодня ли задача и пришло ли время
            if (task.date === currentDate && reminderTime === currentTime) {
              // Проверяем, не показывали ли уже это напоминание
              if (!checkedRemindersRef.current.has(reminderKey)) {
                showNotification(task, reminderTime)
                checkedRemindersRef.current.add(reminderKey)
                
                // Очищаем через час, чтобы можно было показать снова завтра
                setTimeout(() => {
                  checkedRemindersRef.current.delete(reminderKey)
                }, 3600000)
              }
            }
          })
        }
      })
    })

    return () => unsubscribe()
  }, [user])

  const showNotification = (task, reminderTime) => {
    if (!('Notification' in window)) {
      console.log('[Reminders] Notifications not supported')
      return
    }

    if (Notification.permission === 'granted') {
      new Notification('🔔 Напоминание о задаче', {
        body: `${task.title}\n⏰ Время: ${reminderTime}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: task.id,
        requireInteraction: false
      })

      // Звуковой сигнал (опционально)
      playNotificationSound()
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showNotification(task, reminderTime)
        }
      })
    }
  }

  const playNotificationSound = () => {
    // Простой beep через Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.log('[Reminders] Sound error:', error)
    }
  }

  return {
    requestPermission: () => Notification.requestPermission()
  }
}