import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyC1zJgsiJRTZ-FVNr6TS4VTLoLCXcsvy3M",
  authDomain: "paybridge-org.firebaseapp.com",
  projectId: "paybridge-org",
  storageBucket: "paybridge-org.firebasestorage.app",
  messagingSenderId: "252819159292",
  appId: "1:252819159292:web:c6630ba41c118b3fabbf79"
}

// Prevent duplicate initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

export const appleProvider = new OAuthProvider('apple.com')
appleProvider.addScope('email')
appleProvider.addScope('name')

export default app
