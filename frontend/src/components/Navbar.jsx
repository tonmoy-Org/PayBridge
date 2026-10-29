import { useState, useRef, useEffect } from 'react'
import PayBridgeLogo from './PayBridgeLogo'
import { useAuth } from '../context/AuthContext'
import { History, LogOut, LogIn, ChevronDown, User, CreditCard } from 'lucide-react'
import { toast } from 'react-toastify'

export default function Navbar({ currentView = 'home', setCurrentView = () => {} }) {
  const { user, role, logout, isAuthenticated } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNavigate = (view) => {
    setDropdownOpen(false)
    setCurrentView(view)
    if (view === 'home') {
      window.history.pushState({}, '', '/')
    } else if (view === 'login') {
      window.history.pushState({}, '', '/login')
    } else if (view === 'tracker') {
      window.history.pushState({}, '', '/tracker')
    }
  }

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    toast.info('Logged out successfully.')
    setCurrentView('login')
    window.history.pushState({}, '', '/login')
  }

  const displayName = isAuthenticated
    ? (user?.displayName || user?.email?.split('@')[0] || 'User')
    : 'Account'

  return (
    <nav className="bg-white shadow-2xs border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left: PayBridge Logo and Brand Name */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleNavigate('home')}
              className="flex items-center space-x-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <PayBridgeLogo className="w-7 h-7 transform group-hover:scale-105 transition-transform" />
              <div className="flex flex-col">
                <span className="font-bold text-black text-lg tracking-tight leading-tight">
                  PayBridge
                </span>
                <span className="text-[10px] text-gray-500 font-medium tracking-wide leading-none">
                  Payment Gateway Portal
                </span>
              </div>
            </button>
          </div>

          {/* Right: Only Profile Name & Avatar with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-[5px] hover:bg-gray-100/80 active:bg-gray-200/70 border border-transparent hover:border-gray-200 transition-all cursor-pointer focus:outline-none select-none"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                {isAuthenticated && user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : isAuthenticated ? (
                  displayName.charAt(0).toUpperCase()
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Name */}
              <span className="text-xs sm:text-sm font-semibold text-gray-900 max-w-[130px] sm:max-w-[180px] truncate">
                {displayName}
              </span>

              {/* Chevron Arrow */}
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180 text-black' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-[5px] shadow-xl border border-gray-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                {isAuthenticated ? (
                  <>
                    {/* User Profile Card Header */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-black text-white text-sm font-bold flex items-center justify-center shrink-0 overflow-hidden">
                          {user?.photoURL ? (
                            <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{displayName}</p>
                          <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                          <span className={`inline-block mt-1 px-1.5 py-0.2 rounded-[3px] text-[9px] font-bold uppercase tracking-wider ${
                            role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {role === 'admin' ? 'Administrator' : 'Regular User'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      {/* Payment Checkout Option */}
                      <button
                        type="button"
                        onClick={() => handleNavigate('home')}
                        className={`w-full flex items-center px-4 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                          currentView === 'home'
                            ? 'bg-gray-100 text-black font-semibold'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-black font-medium'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 mr-2.5 text-gray-500" />
                        <span>Payment Checkout</span>
                      </button>

                      {/* Tracker History Option */}
                      <button
                        type="button"
                        onClick={() => handleNavigate('tracker')}
                        className={`w-full flex items-center px-4 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                          currentView === 'tracker'
                            ? 'bg-gray-100 text-black font-semibold'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-black font-medium'
                        }`}
                      >
                        <History className="w-4 h-4 mr-2.5 text-gray-500" />
                        <span>Tracker History</span>
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 my-1"></div>

                    {/* Sign Out Option */}
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-3 py-2 text-xs font-semibold text-red-600 border border-red-500 hover:bg-red-50 active:bg-red-100 rounded-[5px] transition-colors cursor-pointer shadow-2xs"
                      >
                        <LogOut className="w-4 h-4 mr-2 text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Guest Menu Options */}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => handleNavigate('login')}
                        className="w-full flex items-center px-4 py-2.5 text-xs font-semibold text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <LogIn className="w-4 h-4 mr-2.5 text-gray-500" />
                        <span>Sign In / Login</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNavigate('home')}
                        className="w-full flex items-center px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4 mr-2.5 text-gray-500" />
                        <span>Payment Checkout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
