import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
//import { getAnalytics } from 'firebase/analytics'

// ВАЖНО: Замените эти данные на ваши из Firebase Console
// Как получить: Firebase Console → Project Settings → General → Your apps → Web app → Config
const firebaseConfig = {
  apiKey: "AIzaSyDbpF_zZHTe3vTJGqBqy-yGXtgAApa0ETs",
  authDomain: "zh-daily-tasks-app.firebaseapp.com",
  projectId: "zh-daily-tasks-app",
  storageBucket: "zh-daily-tasks-app.firebasestorage.app",
  messagingSenderId: "351199620796",
  appId: "1:351199620796:web:cba4517355d08b93692ab9",
  measurementId: "G-CEW9PBCF2G"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig)
//const analytics = getAnalytics(app)

// Экспорт сервисов
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)

export default app