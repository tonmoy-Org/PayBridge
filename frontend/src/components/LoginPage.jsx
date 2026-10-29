import { useState, useEffect } from 'react'
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User,
  UserPlus,
  LogIn
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'

export default function LoginPage({ onBackToHome = () => {}, onLoginSuccess = () => {} }) {
  const {
    loginWithGoogle,
    loginWithApple,
    loginWithCredentials,
    registerWithEmail,
    loading,
    authError
  } = useAuth()

  // Mode: 'signin' or 'signup'
  const [authMode, setAuthMode] = useState('signin')

  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Feedback & Submission State
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localSuccess, setLocalSuccess] = useState(false)
  const [localError, setLocalError] = useState('')

  // Read query params for prefilled email or mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    const modeParam = params.get('mode')
    if (emailParam) {
      setEmail(emailParam)
    }
    if (modeParam === 'signup') {
      setAuthMode('signup')
    }
  }, [])

  const validateForm = () => {
    const newErrors = {}

    // In signup mode, validate names
    if (authMode === 'signup') {
      if (!firstname.trim()) newErrors.firstname = 'First name is required'
      if (!lastname.trim()) newErrors.lastname = 'Last name is required'
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required'
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (authMode === 'signup') {
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Google SSO with Popup
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setLocalError('')
    setGoogleLoading(true)
    const result = await loginWithGoogle()
    setGoogleLoading(false)

    if (result && result.cancelled) {
      // User closed the popup window without signing in
      return
    }

    if (result && result.error) {
      setLocalError(result.error)
      toast.error(result.error)
    } else if (result && result.success) {
      setTimeout(() => {
        onLoginSuccess(result.role)
      }, 300)
    }
  }

  // Apple SSO with Popup
  const [appleLoading, setAppleLoading] = useState(false)

  const handleAppleSignIn = async () => {
    setLocalError('')
    setAppleLoading(true)
    const result = await loginWithApple()
    setAppleLoading(false)

    if (result && result.cancelled) {
      // User closed the popup window without signing in
      return
    }

    if (result && result.error) {
      setLocalError(result.error)
      toast.error(result.error)
    } else if (result && result.success) {
      setTimeout(() => {
        onLoginSuccess(result.role)
      }, 300)
    }
  }

  // Handle Submit (Sign In or Sign Up)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.warning('Please correct the errors in the form.')
      return
    }

    setIsSubmitting(true)
    setLocalError('')
    setLocalSuccess(false)

    try {
      if (authMode === 'signup') {
        const result = await registerWithEmail(email, password, firstname, lastname)
        setIsSubmitting(false)
        if (result && result.success) {
          setLocalSuccess(true)
          setTimeout(() => {
            onLoginSuccess(result.role)
          }, 400)
        } else if (result && result.error) {
          setLocalError(result.error)
          toast.error(result.error)
        }
      } else {
        const result = await loginWithCredentials(email, password)
        setIsSubmitting(false)
        if (result && result.success) {
          setLocalSuccess(true)
          setTimeout(() => {
            onLoginSuccess(result.role)
          }, 400)
        } else if (result && result.error) {
          setLocalError(result.error)
          toast.error(result.error)
        }
      }
    } catch (err) {
      setIsSubmitting(false)
      setLocalError(err.message)
      toast.error(err.message)
    }
  }

  const handleQuickFill = () => {
    setEmail('admin@paybridge.com')
    setPassword('admin123')
    setErrors({})
    setLocalError('')
    toast.info('Admin demo credentials populated.')
  }

  return (
    <div className="flex-1 flex items-center justify-center py-10 sm:py-14 px-4">
      <div className="w-full max-w-md bg-white rounded-[5px] shadow-md border border-gray-100 p-6 sm:p-8">
        {/* Brand Header */}
        <div className="text-left mb-5 pb-3.5 border-b border-gray-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {authMode === 'signup' ? 'Create an Account' : 'Sign In'}
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {authMode === 'signup'
              ? 'Create your account to continue'
              : 'Sign in to access your account'}
          </p>
        </div>

        {/* Global / Auth Error Feedback */}
        {(localError || authError) && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[5px] flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{localError || authError}</span>
          </div>
        )}

        {/* Success Feedback */}
        {localSuccess && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-[5px] flex items-start space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800">
              <p className="font-semibold">
                {authMode === 'signup' ? 'Account Created Successfully!' : 'Authentication Successful!'}
              </p>
              <p className="mt-0.5">Redirecting to Tracker Dashboard...</p>
            </div>
          </div>
        )}

        {/* 1. Social SSO Buttons (Google & Apple Popups) */}
        <div className="space-y-2.5 mb-5">
          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || appleLoading || loading || isSubmitting}
            className="w-full flex items-center justify-center py-2.5 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 rounded-[5px] text-xs font-semibold tracking-wide transition-all duration-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-60 cursor-pointer"
          >
            {googleLoading ? (
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-gray-400 border-t-black rounded-full animate-spin"></span>
                <span>Opening Google sign-in popup...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2.5">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {authMode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                </span>
              </div>
            )}
          </button>

          {/* Apple Button */}
          <button
            type="button"
            onClick={handleAppleSignIn}
            disabled={googleLoading || appleLoading || loading || isSubmitting}
            className="w-full flex items-center justify-center py-2.5 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 rounded-[5px] text-xs font-semibold tracking-wide transition-all duration-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-60 cursor-pointer"
          >
            {appleLoading ? (
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-gray-400 border-t-black rounded-full animate-spin"></span>
                <span>Opening Apple sign-in popup...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2.5">
                <svg className="w-4 h-4 shrink-0 fill-current text-black" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.86c.66-.82 1.11-1.96.99-3.1-.96.04-2.12.64-2.8 1.44-.6.7-.1 1.83-1.01 2.99 1.07.08 2.16-.54 2.82-1.33z" />
                </svg>
                <span>
                  {authMode === 'signup' ? 'Sign up with Apple' : 'Sign in with Apple'}
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-gray-400 bg-white px-2">
            or
          </div>
        </div>

        {/* 2. EMAIL & PASSWORD FORM */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* First & Last Name (Sign Up only) */}
          {authMode === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={firstname}
                    onChange={(e) => {
                      setFirstname(e.target.value)
                      if (errors.firstname) setErrors((p) => ({ ...p, firstname: '' }))
                    }}
                    placeholder="John"
                    className={`w-full pl-9 pr-3 py-2 bg-white border rounded-[5px] text-xs sm:text-sm text-gray-800 placeholder-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black ${
                      errors.firstname ? 'border-red-400 bg-red-50/10' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.firstname && <p className="text-red-500 text-[11px] mt-0.5">{errors.firstname}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastname}
                  onChange={(e) => {
                    setLastname(e.target.value)
                    if (errors.lastname) setErrors((p) => ({ ...p, lastname: '' }))
                  }}
                  placeholder="Doe"
                  className={`w-full px-3 py-2 bg-white border rounded-[5px] text-xs sm:text-sm text-gray-800 placeholder-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black ${
                    errors.lastname ? 'border-red-400 bg-red-50/10' : 'border-gray-300'
                  }`}
                />
                {errors.lastname && <p className="text-red-500 text-[11px] mt-0.5">{errors.lastname}</p>}
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
                }}
                placeholder="example@domain.com"
                className={`w-full pl-10 pr-3.5 py-2.5 bg-white border rounded-[5px] text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black hover:border-gray-400 shadow-2xs ${
                  errors.email ? 'border-red-400 bg-red-50/10' : 'border-gray-300'
                }`}
                autoFocus={authMode === 'signin'}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-600">
                Password <span className="text-red-500">*</span>
              </label>
              {authMode === 'signin' && (
                <button
                  type="button"
                  onClick={() =>
                    toast.info('Password reset instructions sent to your email address.')
                  }
                  className="text-xs text-gray-500 hover:text-black transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
                }}
                placeholder="••••••••"
                className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-[5px] text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black hover:border-gray-400 shadow-2xs ${
                  errors.password ? 'border-red-400 bg-red-50/10' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password (Sign Up only) */}
          {authMode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: '' }))
                  }}
                  placeholder="Re-enter password"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-white border rounded-[5px] text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black hover:border-gray-400 shadow-2xs ${
                    errors.confirmPassword ? 'border-red-400 bg-red-50/10' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Remember Me & Demo Quick Fill (Sign In only) */}
          {authMode === 'signin' && (
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 text-black accent-black rounded focus:ring-black border-gray-300 cursor-pointer"
                />
                <span className="ml-2">Remember me</span>
              </label>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline transition-colors cursor-pointer"
              >
                Fill Demo Login
              </button>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full flex items-center justify-center py-2.5 px-4 font-semibold text-xs tracking-wide rounded-[5px] shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-black/60 cursor-pointer text-white bg-black hover:bg-neutral-800 active:bg-neutral-900"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>
                    {authMode === 'signup' ? 'Creating your account...' : 'Authenticating...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5">
                  {authMode === 'signup' ? (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create Account & Sign In</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In with Email</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </>
                  )}
                </div>
              )}
            </button>
          </div>
        </form>

        {/* Toggle between Sign In and Sign Up */}
        <div className="mt-5 pt-3.5 border-t border-gray-100 text-center text-xs text-gray-600">
          {authMode === 'signin' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup')
                  setLocalError('')
                  setErrors({})
                }}
                className="font-bold text-black hover:underline ml-1 cursor-pointer"
              >
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin')
                  setLocalError('')
                  setErrors({})
                }}
                className="font-bold text-black hover:underline ml-1 cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        {/* Back to Home link */}
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={onBackToHome}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            ← Back to Payment Portal
          </button>
        </div>
      </div>
    </div>
  )
}
