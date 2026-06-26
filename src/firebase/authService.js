import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  getRedirectResult,
  signInWithRedirect,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

// Конфигурация Firebase (замените на ваши реальные значения!)
const firebaseConfig = {
  apiKey: "AIzaSyDbpF_zZHTe3vTJGqBqy-yGXtgAApa0ETs",
  authDomain: "zh-daily-tasks-app.firebaseapp.com",
  projectId: "zh-daily-tasks-app",
  storageBucket: "zh-daily-tasks-app.firebasestorage.app",
  messagingSenderId: "351199620796",
  appId: "1:351199620796:web:cba4517355d08b93692ab9",
  measurementId: "G-CEW9PBCF2G"
}

// Инициализация Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const googleProvider = new GoogleAuthProvider()

// Регистрация с сохранением имени в Authentication И Firestore
export const signUp = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // 1. Сохраняем имя в Authentication
    await updateProfile(user, {
      displayName: name
    })
    
    // 2. Сохраняем профиль пользователя в Firestore
    await setDoc(doc(db, 'users', user.uid), {
      displayName: name,
      email: email,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    })
    
    return { success: true, user }
  } catch (error) {
    console.error('signUp error:', error)
    return { success: false, error: error.code }
  }
}

// Вход по email/паролю
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Обновляем lastLogin в Firestore
    try {
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: new Date().toISOString()
      }, { merge: true }) // merge: true — не перезаписывает существующие поля
    } catch (firestoreError) {
      console.log('Firestore update skipped:', firestoreError)
    }
    
    return { success: true, user }
  } catch (error) {
    console.error('signIn error:', error)
    return { success: false, error: error.code }
  }
}

// Вход через Google
export const signInWithGoogle = async () => {
  try {
    if (window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      await signInWithRedirect(auth, googleProvider)
      return { success: false, redirect: true }
    }
    
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    
    // Сохраняем/обновляем профиль в Firestore
    try {
      await setDoc(doc(db, 'users', user.uid), {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        lastLogin: new Date().toISOString(),
        provider: 'google'
      }, { merge: true })
    } catch (firestoreError) {
      console.log('Firestore update skipped:', firestoreError)
    }
    
    return { success: true, user }
  } catch (error) {
    console.error('signInWithGoogle error:', error)
    return { success: false, error: error.code }
  }
}

// Проверка результата редиректа (для мобильных)
export const checkGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth)
    if (result && result.user) {
      // Сохраняем в Firestore
      try {
        await setDoc(doc(db, 'users', result.user.uid), {
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
          lastLogin: new Date().toISOString(),
          provider: 'google'
        }, { merge: true })
      } catch (firestoreError) {
        console.log('Firestore update skipped:', firestoreError)
      }
      
      return { success: true, user: result.user }
    }
    return { success: false }
  } catch (error) {
    console.error('checkGoogleRedirectResult error:', error)
    return { success: false, error: error.code }
  }
}

// Восстановление пароля
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email)
    return { success: true }
  } catch (error) {
    console.error('resetPassword error:', error)
    return { success: false, error: error.code }
  }
}

// Выход из аккаунта
export const logOut = async () => {
  try {
    await signOut(auth)
    return { success: true }
  } catch (error) {
    console.error('logOut error:', error)
    return { success: false, error: error.code }
  }
}

// Подписка на изменение состояния авторизации
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

// Сообщения об ошибках на русском
export const getAuthErrorMessage = (errorCode) => {
  const messages = {
    'auth/email-already-in-use': 'Этот email уже зарегистрирован. Войдите или используйте другой email.',
    'auth/invalid-email': 'Неверный формат email.',
    'auth/operation-not-allowed': 'Регистрация отключена. Обратитесь к администратору.',
    'auth/weak-password': 'Пароль должен содержать не менее 6 символов.',
    'auth/user-disabled': 'Аккаунт заблокирован.',
    'auth/user-not-found': 'Пользователь с таким email не найден. Проверьте адрес или зарегистрируйтесь.',
    'auth/wrong-password': 'Неверный пароль. Попробуйте ещё раз или восстановите пароль.',
    'auth/invalid-credential': 'Неверный email или пароль.',
    'auth/too-many-requests': 'Слишком много попыток входа. Попробуйте позже.',
    'auth/network-request-failed': 'Ошибка сети. Проверьте подключение к интернету.',
    'auth/popup-closed-by-user': 'Окно авторизации закрыто.',
    'auth/cancelled-popup-request': 'Запрос авторизации отменён.',
    'auth/popup-blocked': 'Всплывающее окно заблокировано браузером.',
    'auth/account-exists-with-different-credential': 'Этот email уже используется с другим способом входа.',
    'auth/requires-recent-login': 'Требуется повторный вход для выполнения операции.'
  }
  
  return messages[errorCode] || 'Произошла ошибка. Попробуйте ещё раз.'
}

export { auth, db }