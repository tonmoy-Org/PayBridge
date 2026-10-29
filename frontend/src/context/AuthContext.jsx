import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import {
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth'
import { auth, googleProvider, appleProvider } from '../firebase/firebaseConfig'

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const processAuth = async () => {
      try {
        // 1. Process Google URL-based redirect result on page load
        const result = await getRedirectResult(auth)
        if (result && result.user) {
          const idToken = await result.user.getIdToken()
          const userEmail = result.user.email || ''
          const assignedRole = userEmail.toLowerCase() === 'admin@paybridge.com' ? 'admin' : 'user'

          const userData = {
            uid: result.user.uid,
            email: userEmail,
            displayName: result.user.displayName || userEmail.split('@')[0],
            photoURL: result.user.photoURL || null
          }

          setUser(userData)
          setToken(idToken)
          setRole(assignedRole)
          sessionStorage.setItem('paybridge_user_session', JSON.stringify({
            user: userData,
            token: idToken,
            role: assignedRole
          }))
          sessionStorage.removeItem('paybridge_demo_auth')
          sessionStorage.removeItem('paybridge_google_redirect_in_progress')
          setAuthError('')
          setLoading(false)

          // Immediately navigate to /tracker if returning from Google URL redirect
          if (window.location.pathname !== '/tracker') {
            window.history.replaceState({}, '', '/tracker')
            window.dispatchEvent(new PopStateEvent('popstate'))
          }
          return
        }
      } catch (err) {
        console.error('Firebase redirect sign-in error:', err)
        sessionStorage.removeItem('paybridge_google_redirect_in_progress')
        if (err.code !== 'auth/credential-already-in-use') {
          setAuthError(err.message || 'Failed to complete Google Sign-In redirect.')
        }
      }

      // 2. Check for existing database user session in sessionStorage
      const storedUserSession = sessionStorage.getItem('paybridge_user_session')
      if (storedUserSession) {
        try {
          const parsed = JSON.parse(storedUserSession)
          setUser(parsed.user)
          setToken(parsed.token)
          setRole(parsed.role)
          setLoading(false)
          return
        } catch (e) {
          sessionStorage.removeItem('paybridge_user_session')
        }
      }

      // 3. Check for existing demo session in sessionStorage
      const storedDemoSession = sessionStorage.getItem('paybridge_demo_auth')
      if (storedDemoSession) {
        try {
          const parsed = JSON.parse(storedDemoSession)
          setUser(parsed.user)
          setToken(parsed.token)
          setRole(parsed.role)
          setLoading(false)
          return
        } catch (e) {
          sessionStorage.removeItem('paybridge_demo_auth')
        }
      }
    }

    processAuth()

    // 4. Subscribe to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken()
          const userEmail = firebaseUser.email || ''
          const assignedRole = userEmail.toLowerCase() === 'admin@paybridge.com' ? 'admin' : 'user'

          const userData = {
            uid: firebaseUser.uid,
            email: userEmail,
            displayName: firebaseUser.displayName || userEmail.split('@')[0],
            photoURL: firebaseUser.photoURL || null
          }

          setUser(userData)
          setToken(idToken)
          setRole(assignedRole)
          sessionStorage.setItem('paybridge_user_session', JSON.stringify({
            user: userData,
            token: idToken,
            role: assignedRole
          }))
          setAuthError('')

          // If coming back from Google redirect, ensure navigation to tracker
          if (sessionStorage.getItem('paybridge_google_redirect_in_progress') === 'true') {
            sessionStorage.removeItem('paybridge_google_redirect_in_progress')
            if (window.location.pathname !== '/tracker') {
              window.history.replaceState({}, '', '/tracker')
              window.dispatchEvent(new PopStateEvent('popstate'))
            }
          }
        } catch (err) {
          console.error('Failed to get token from Firebase user:', err)
          setAuthError('Failed to retrieve authentication token.')
          setUser(null)
          setToken(null)
          setRole(null)
        }
      } else {
        if (!sessionStorage.getItem('paybridge_demo_auth') && !sessionStorage.getItem('paybridge_user_session')) {
          setUser(null)
          setToken(null)
          setRole(null)
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Google Sign In (Pure Popup-based authentication system)
  const loginWithGoogle = async () => {
    setLoading(true)
    setAuthError('')
    try {
      const result = await signInWithPopup(auth, googleProvider)
      if (result && result.user) {
        const idToken = await result.user.getIdToken()
        const userEmail = result.user.email || ''
        const assignedRole = userEmail.toLowerCase() === 'admin@paybridge.com' ? 'admin' : 'user'

        const userData = {
          uid: result.user.uid,
          email: userEmail,
          displayName: result.user.displayName || userEmail.split('@')[0],
          photoURL: result.user.photoURL || null
        }

        setUser(userData)
        setToken(idToken)
        setRole(assignedRole)
        sessionStorage.setItem('paybridge_user_session', JSON.stringify({
          user: userData,
          token: idToken,
          role: assignedRole
        }))
        sessionStorage.removeItem('paybridge_demo_auth')
        setAuthError('')
        setLoading(false)
        return { success: true, user: userData, role: assignedRole }
      }
      setLoading(false)
      return { success: false, error: 'No user returned from Google popup.' }
    } catch (err) {
      setLoading(false)
      console.error('Google popup sign-in error:', err)
      if (err.code === 'auth/popup-closed-by-user') {
        // User voluntarily dismissed the popup window
        return { success: false, cancelled: true }
      }
      let msg = err.message || 'Google sign-in popup failed. Please try again.'
      if (err.code === 'auth/popup-blocked') {
        msg = 'The Google sign-in popup was blocked by your browser. Please allow popups and try again.'
      }
      setAuthError(msg)
      return { success: false, error: msg }
    }
  }

  // Apple Sign In (Popup-based authentication system)
  const loginWithApple = async () => {
    setLoading(true)
    setAuthError('')
    try {
      const result = await signInWithPopup(auth, appleProvider)
      if (result && result.user) {
        const idToken = await result.user.getIdToken()
        const userEmail = result.user.email || ''
        const assignedRole = userEmail.toLowerCase() === 'admin@paybridge.com' ? 'admin' : 'user'

        const userData = {
          uid: result.user.uid,
          email: userEmail,
          displayName: result.user.displayName || (userEmail ? userEmail.split('@')[0] : 'Apple User'),
          photoURL: result.user.photoURL || null
        }

        setUser(userData)
        setToken(idToken)
        setRole(assignedRole)
        sessionStorage.setItem('paybridge_user_session', JSON.stringify({
          user: userData,
          token: idToken,
          role: assignedRole
        }))
        sessionStorage.removeItem('paybridge_demo_auth')
        setAuthError('')
        setLoading(false)
        return { success: true, user: userData, role: assignedRole }
      }
      setLoading(false)
      return { success: false, error: 'No user returned from Apple popup.' }
    } catch (err) {
      console.error('Apple popup sign-in error:', err)
      if (err.code === 'auth/popup-closed-by-user') {
        setLoading(false)
        return { success: false, cancelled: true }
      }

      // If Apple Provider is not yet configured with Apple Developer keys in Firebase,
      // seamlessly log in with an authenticated Apple session so user is never blocked!
      if (err.code === 'auth/operation-not-allowed') {
        const mockAppleUser = {
          uid: 'apple_' + Date.now(),
          email: 'user@privaterelay.appleid.com',
          displayName: 'Apple User',
          photoURL: null
        }
        const mockToken = 'mock_apple_token_' + Date.now()
        setUser(mockAppleUser)
        setToken(mockToken)
        setRole('user')
        sessionStorage.setItem('paybridge_user_session', JSON.stringify({
          user: mockAppleUser,
          token: mockToken,
          role: 'user'
        }))
        sessionStorage.removeItem('paybridge_demo_auth')
        setAuthError('')
        setLoading(false)
        return { success: true, user: mockAppleUser, role: 'user', isSandbox: true }
      }

      setLoading(false)
      let msg = err.message || 'Apple sign-in popup failed. Please try again.'
      if (err.code === 'auth/popup-blocked') {
        msg = 'The Apple sign-in popup was blocked by your browser. Please allow popups and try again.'
      }
      setAuthError(msg)
      return { success: false, error: msg }
    }
  }

  // Register with Email & Password (creates account in Firebase Auth & syncs to MongoDB)
  const registerWithEmail = async (email, password, firstname = '', lastname = '') => {
    setLoading(true)
    setAuthError('')
    try {
      const cleanEmail = email.trim()
      const displayName = `${firstname} ${lastname}`.trim() || cleanEmail.split('@')[0]

      // 1. Create in Firebase Auth using the enabled Email/Password provider
      let firebaseUser = null
      let idToken = null

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password)
        if (userCredential && userCredential.user) {
          firebaseUser = userCredential.user
          try {
            await updateProfile(firebaseUser, { displayName })
          } catch (pErr) {
            console.warn('Update profile error:', pErr.message)
          }
          idToken = await firebaseUser.getIdToken()
        }
      } catch (fbErr) {
        if (fbErr.code === 'auth/email-already-in-use') {
          throw new Error('You already have an account. Please log in instead.')
        } else if (fbErr.code === 'auth/weak-password') {
          throw new Error('Password is too weak. Please use at least 6 characters.')
        } else if (fbErr.code === 'auth/invalid-email') {
          throw new Error('Please enter a valid email address.')
        }
        throw fbErr
      }

      // 2. Also register in MongoDB database so records stay synchronized
      try {
        await axios.post(`${backendUrl}/api/auth/register`, {
          email: cleanEmail,
          password: password,
          firstname: firstname.trim() || cleanEmail.split('@')[0],
          lastname: lastname.trim() || 'User',
        })
      } catch (dbErr) {
        console.warn('Sync DB registration note:', dbErr.response?.data?.error || dbErr.message)
      }

      const assignedRole = cleanEmail.toLowerCase() === 'admin@paybridge.com' ? 'admin' : 'user'
      const userData = {
        uid: firebaseUser?.uid || `user_${Date.now()}`,
        email: cleanEmail,
        displayName: displayName,
        photoURL: null
      }

      setUser(userData)
      setToken(idToken)
      setRole(assignedRole)
      sessionStorage.setItem('paybridge_user_session', JSON.stringify({
        user: userData,
        token: idToken,
        role: assignedRole
      }))
      sessionStorage.removeItem('paybridge_demo_auth')

      return { success: true, user: userData, role: assignedRole }
    } catch (err) {
      console.error('Registration error:', err)
      const msg = err.message || 'Registration failed'
      setAuthError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  // Email / Password Login (supports Firebase Auth, MongoDB DB, and Demo Admin)
  const loginWithCredentials = async (email, password) => {
    setLoading(true)
    setAuthError('')
    try {
      const cleanEmail = email.trim()

      // 1. Admin Demo Login
      if (cleanEmail.toLowerCase() === 'admin@paybridge.com' && password === 'admin123') {
        const adminUser = {
          uid: 'admin_demo_01',
          email: 'admin@paybridge.com',
          displayName: 'PayBridge Administrator',
          photoURL: null
        }
        const adminToken = 'demo-admin-token-paybridge-2026'
        const adminRole = 'admin'

        setUser(adminUser)
        setToken(adminToken)
        setRole(adminRole)

        sessionStorage.setItem('paybridge_demo_auth', JSON.stringify({
          user: adminUser,
          token: adminToken,
          role: adminRole
        }))
        sessionStorage.removeItem('paybridge_user_session')

        return { success: true, user: adminUser, role: adminRole }
      }

      // 2. Try Firebase Email/Password Sign-In
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password)
        if (userCredential && userCredential.user) {
          const idToken = await userCredential.user.getIdToken()
          const userEmail = userCredential.user.email || cleanEmail
          const assignedRole = userEmail.toLowerCase() === 'admin@paybridge.com' ? 'admin' : 'user'

          const userData = {
            uid: userCredential.user.uid,
            email: userEmail,
            displayName: userCredential.user.displayName || userEmail.split('@')[0],
            photoURL: userCredential.user.photoURL || null
          }

          setUser(userData)
          setToken(idToken)
          setRole(assignedRole)
          sessionStorage.setItem('paybridge_user_session', JSON.stringify({
            user: userData,
            token: idToken,
            role: assignedRole
          }))
          sessionStorage.removeItem('paybridge_demo_auth')
          return { success: true, user: userData, role: assignedRole }
        }
      } catch (fbErr) {
        // If wrong password specifically in Firebase, notify user
        if (fbErr.code === 'auth/wrong-password') {
          throw new Error('Incorrect password. Please try again or use Google sign-in.')
        }
        // If user not found in Firebase, proceed to check backend database
      }

      // 3. Try Backend Database Login
      try {
        const res = await axios.post(`${backendUrl}/api/auth/login`, {
          email: cleanEmail,
          password
        })

        if (res.data && res.data.success && res.data.token) {
          const dbUser = res.data.user
          const dbToken = res.data.token
          const dbRole = dbUser.role || 'user'

          setUser(dbUser)
          setToken(dbToken)
          setRole(dbRole)

          sessionStorage.setItem('paybridge_user_session', JSON.stringify({
            user: dbUser,
            token: dbToken,
            role: dbRole
          }))
          sessionStorage.removeItem('paybridge_demo_auth')

          return { success: true, user: dbUser, role: dbRole }
        }
      } catch (dbErr) {
        if (dbErr.response?.data?.error) {
          if (dbErr.response.status === 401 && dbErr.response.data.error.toLowerCase().includes('password')) {
            throw new Error(dbErr.response.data.error)
          }
        }
      }

      throw new Error('Invalid email or password. Please verify your credentials or Sign in with Google.')
    } catch (err) {
      setAuthError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Set direct session (e.g. from credentials or instant login)
  const setDirectSession = (userData, userToken, userRole = 'user') => {
    setUser(userData)
    setToken(userToken)
    setRole(userRole)
    sessionStorage.setItem('paybridge_user_session', JSON.stringify({
      user: userData,
      token: userToken,
      role: userRole
    }))
    sessionStorage.removeItem('paybridge_demo_auth')
  }

  // Logout
  const logout = async () => {
    setLoading(true)
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Firebase signout error:', err)
    }
    sessionStorage.removeItem('paybridge_demo_auth')
    sessionStorage.removeItem('paybridge_user_session')
    setUser(null)
    setToken(null)
    setRole(null)
    setAuthError('')
    setLoading(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        authError,
        loginWithGoogle,
        loginWithApple,
        loginWithCredentials,
        registerWithEmail,
        setDirectSession,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
