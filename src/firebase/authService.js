import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  updatePassword,
  updateEmail,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider
} from 'firebase/auth'
import { auth, googleProvider } from './config'

// Регистрация email + пароль
export const signUp = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName })
    }
    return { success: true, user: userCredential.user }
  } catch (error) {
    console.error('Sign up error:', error)
    return { success: false, error: error.code }
  }
}

// Проверка, существует ли email
export const checkEmailExists = async (email) => {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email)
    return methods && methods.length > 0
  } catch (error) {
    console.error('Check email error:', error)
    return true
  }
}

// Вход email + пароль
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { success: true, user: userCredential.user }
  } catch (error) {
    console.error('Sign in error:', error)
    
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      const emailExists = await checkEmailExists(email)
      if (!emailExists) {
        return { success: false, error: 'auth/user-not-found' }
      } else {
        return { success: false, error: 'auth/wrong-password' }
      }
    }
    
    return { success: false, error: error.code }
  }
}

// Вход через Google
export const signInWithGoogle = async () => {
  try {
    // На мобильных устройствах используем redirect
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobile) {
      console.log('Mobile detected, using redirect')
      await signInWithRedirect(auth, googleProvider)
      // После редиректа страница перезагрузится, onAuthChange отследит результат
      return { success: true, redirect: true }
    } else {
      console.log('Desktop detected, using popup')
      const result = await signInWithPopup(auth, googleProvider)
      return { success: true, user: result.user, redirect: false }
    }
  } catch (error) {
    console.error('Google sign in error:', error)
    return { success: false, error: error.code }
  }
}

// Проверка результата редиректа (для мобильных)
export const checkGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth)
    if (result) {
      return { success: true, user: result.user }
    }
    return { success: false }
  } catch (error) {
    console.error('Redirect result error:', error)
    return { success: false, error: error.code }
  }
}

// Выход
export const logOut = async () => {
  await signOut(auth)
}

// Восстановление пароля
export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email)
}

// Подписка на изменения состояния аутентификации
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

// Получение понятного сообщения об ошибке
export const getAuthErrorMessage = (errorCode) => {
  console.log('Error code:', errorCode)
  const errors = {
    'auth/wrong-password': 'Неверный пароль',
    'auth/user-not-found': 'Аккаунт не найден. Необходимо зарегистрироваться',
    'auth/invalid-credential': 'Неверный email или пароль',
    'auth/email-already-in-use': 'Этот email уже зарегистрирован',
    'auth/invalid-email': 'Неверный формат email',
    'auth/weak-password': 'Пароль должен содержать не менее 6 символов',
    'auth/popup-closed-by-user': 'Окно авторизации закрыто',
    'auth/network-request-failed': 'Ошибка сети. Проверьте подключение',
    'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
    'auth/user-disabled': 'Аккаунт заблокирован',
    'auth/popup-blocked': 'Всплывающее окно заблокировано браузером',
    'auth/cancelled-popup-request': 'Предыдущий запрос ещё не завершён',
    'auth/unauthorized-domain': 'Домен не авторизован в Firebase',
    'auth/api-key-not-valid': 'Неверный API ключ Firebase',
    'auth/operation-not-allowed': 'Операция не разрешена'
  }
  return errors[errorCode] || 'Произошла ошибка. Попробуйте ещё раз'
}