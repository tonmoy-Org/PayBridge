import { useState, useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import PaymentForm from './components/PaymentForm'
import LoginPage from './components/LoginPage'
import SuccessPage from './components/SuccessPage'
import ErrorPage from './components/ErrorPage'
import TrackerHistory from './components/TrackerHistory'
import { AuthProvider, useAuth } from './context/AuthContext'

function AppContent() {
  const [currentView, setCurrentView] = useState('home')
  const { user, role, loading, logout, isAuthenticated } = useAuth()

  useEffect(() => {
    if (loading) return

    const handleRoute = () => {
      const path = window.location.pathname.toLowerCase()
      const params = new URLSearchParams(window.location.search)
      const status = params.get('status')

      // 1. Unauthenticated user trying to access /tracker -> redirect to login
      if (!isAuthenticated && path.includes('/tracker')) {
        setCurrentView('login')
        window.history.replaceState({}, '', '/login')
        return
      }

      // 2. Normal Route Resolution
      if (path.includes('/tracker')) {
        setCurrentView('tracker')
      } else if (path.includes('/login')) {
        if (isAuthenticated) {
          setCurrentView('tracker')
          window.history.replaceState({}, '', '/tracker')
        } else {
          setCurrentView('login')
        }
      } else if (path.includes('/success') || status === 'success') {
        setCurrentView('success')
      } else if (path.includes('/error') || status === 'cancel' || status === 'failure' || params.has('message')) {
        setCurrentView('error')
      } else {
        setCurrentView('home')
      }
    }

    handleRoute()
    window.addEventListener('popstate', handleRoute)
    return () => window.removeEventListener('popstate', handleRoute)
  }, [isAuthenticated, role, loading, currentView])

  const handleLoginSuccess = (assignedRole) => {
    setCurrentView('tracker')
    window.history.pushState({}, '', '/tracker')
  }

  const handleLogout = async () => {
    await logout()
    setCurrentView('login')
    window.history.pushState({}, '', '/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-gray-600">Initializing PayBridge Secure Session...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Tracker History View */}
      {currentView === 'tracker' && (
        <TrackerHistory />
      )}

      {/* Login Page */}
      {currentView === 'login' && (
        <LoginPage
          onBackToHome={() => {
            setCurrentView('home')
            window.history.pushState({}, '', '/')
          }}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Payment Success View */}
      {currentView === 'success' && <SuccessPage />}

      {/* Payment Error View */}
      {currentView === 'error' && <ErrorPage />}

      {/* Payment & Checkout Portal (Available for all users) */}
      {currentView === 'home' && (
        <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Hero Banner Image */}
              <div className="order-2 lg:order-1 lg:col-span-7">
                <div className="overflow-hidden rounded-[5px] shadow-xs border border-gray-100 bg-white p-2">
                  <img
                    src="/hero.webp"
                    alt="Hero Banner"
                    className="w-full h-auto object-cover rounded-[5px]"
                  />
                </div>
              </div>

              {/* Right Column: Payment Form */}
              <div className="order-1 lg:order-2 lg:col-span-5">
                <PaymentForm />
              </div>
            </div>
          </div>
        </main>
      )}

      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </AuthProvider>
  )
}
