import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  Eye,
  EyeOff,
  Lock,
  User,
  AlertCircle,
  LogIn,
  Loader2
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'

export default function SuccessPage() {
  const queryParams = new URLSearchParams(window.location.search)
  const amount = queryParams.get('amount') || '299'
  const gateway = (queryParams.get('gateway') || 'Payment Gateway').toUpperCase()
  const trxID = queryParams.get('trxID') || queryParams.get('tran_id') || queryParams.get('session_id') || 'Verified'
  const currency = (queryParams.get('currency') || (gateway === 'STRIPE' ? 'USD' : 'BDT')).toUpperCase()
  const isUSD = currency === 'USD'

  const { loginWithCredentials, isAuthenticated } = useAuth()

  const [loadingCreds, setLoadingCreds] = useState(true)
  const [accountInfo, setAccountInfo] = useState(null)
  const [copiedField, setCopiedField] = useState('')
  const [showPassword, setShowPassword] = useState(true)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

  useEffect(() => {
    toast.success(`Payment of ${amount} ${currency} completed successfully!`, {
      toastId: 'payment-success-toast',
    })
  }, [amount, currency])

  useEffect(() => {
    const fetchCredentials = async () => {
      if (!trxID || trxID === 'Verified') {
        setLoadingCreds(false)
        return
      }

      try {
        const res = await axios.get(`${backendUrl}/api/payment/credentials/${encodeURIComponent(trxID)}`)
        if (res.data && res.data.success) {
          setAccountInfo(res.data)
        }
      } catch (err) {
        console.error('Failed to retrieve payment credentials:', err)
      } finally {
        setLoadingCreds(false)
      }
    }

    fetchCredentials()
  }, [trxID, backendUrl])

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success(`Copied ${fieldName} to clipboard!`)
    setTimeout(() => setCopiedField(''), 2500)
  }

  const handleInstantLogin = async () => {
    if (!accountInfo?.credentials) return
    setIsLoggingIn(true)
    try {
      const res = await loginWithCredentials(
        accountInfo.credentials.email,
        accountInfo.credentials.password
      )
      if (res && res.success) {
        window.history.pushState({}, '', '/tracker')
        window.dispatchEvent(new PopStateEvent('popstate'))
      } else {
        toast.error(res?.error || 'Login failed. Please navigate to the login page.')
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please use the login page.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-lg w-full bg-white rounded-[5px] shadow-lg border border-gray-100 p-6 sm:p-8 text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-emerald-50 rounded-full">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 animate-pulse" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1.5">Payment Successful!</h2>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          Your payment of{' '}
          <strong className="text-gray-900">
            {!isUSD && <span className="taka-symbol font-bold mr-0.5">৳</span>}
            {isUSD ? `$${Number(amount).toLocaleString('en-US')}` : Number(amount).toLocaleString('en-US')}{' '}
            {currency}
          </strong>{' '}
          via <span className="font-semibold text-gray-800">{gateway}</span> has been successfully executed and verified.
        </p>

        {/* Existing Account Detected Notice */}
        {accountInfo?.accountExists && (
          <div className="mb-6 p-3.5 rounded-[5px] bg-amber-50 border border-amber-200 text-left text-xs sm:text-sm text-amber-900 shadow-2xs">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-950 text-xs sm:text-sm">
                  You already have an account. Please log in instead.
                </p>
                <div className="mt-2.5">
                  <a
                    href={`/login?email=${encodeURIComponent(accountInfo.email || '')}`}
                    className="inline-flex items-center px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-[4px] font-semibold text-xs shadow-2xs transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5 mr-1.5" />
                    <span>Log In to View Tracker</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Account Credentials Display Card */}
        {accountInfo?.accountCreated && accountInfo?.credentials && (
          <div className="mb-6 p-4 sm:p-5 rounded-[5px] bg-white text-gray-900 text-left shadow-md border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 tracking-wide">
                    Account Credentials
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Use these credentials to log in.
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                Created
              </span>
            </div>

            {/* Email Field */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="block text-[11px] font-medium text-gray-600 mb-1">Account Email / Username:</span>
                <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border border-gray-200 hover:border-gray-300 transition-colors">
                  <span className="font-mono text-gray-900 font-semibold select-all text-xs break-all">
                    {accountInfo.credentials.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(accountInfo.credentials.email, 'Email')}
                    className="ml-2 text-gray-400 hover:text-gray-700 p-1 transition-colors cursor-pointer shrink-0"
                    title="Copy Email"
                  >
                    {copiedField === 'Email' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <span className="block text-[11px] font-medium text-gray-600 mb-1">Account Password:</span>
                <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border border-gray-200 hover:border-gray-300 transition-colors">
                  <span className="font-mono text-emerald-700 font-bold select-all text-xs break-all tracking-wider">
                    {showPassword ? accountInfo.credentials.password : '••••••••••••'}
                  </span>
                  <div className="flex items-center space-x-1.5 ml-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="text-gray-400 hover:text-gray-700 p-1 transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(accountInfo.credentials.password, 'Password')}
                      className="text-gray-400 hover:text-gray-700 p-1 transition-colors cursor-pointer"
                      title="Copy Password"
                    >
                      {copiedField === 'Password' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Instant Login Button */}
            {!isAuthenticated && (
              <div className="mt-4 pt-3.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleInstantLogin}
                  disabled={isLoggingIn}
                  className="w-full inline-flex items-center justify-center py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      <span>Logging you in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5 mr-1.5" />
                      <span>Log In Immediately with these Credentials</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading state for credentials */}
        {loadingCreds && (
          <div className="mb-6 p-4 rounded-[5px] bg-gray-50 border border-gray-100 flex items-center justify-center space-x-2 text-xs text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            <span>Verifying and finalizing account credentials...</span>
          </div>
        )}

        {/* Transaction Summary Box */}
        <div className="bg-gray-50 rounded-[5px] p-4 mb-6 text-left text-xs text-gray-600 space-y-2 border border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Transaction ID:</span>
            <span className="font-mono font-medium text-gray-800 break-all">{trxID}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Payment Gateway:</span>
            <span className="font-medium text-gray-800">{gateway}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Amount Paid:</span>
            <span className="font-bold text-emerald-700">
              {isUSD ? `$${Number(amount).toLocaleString('en-US')}` : `৳${Number(amount).toLocaleString('en-US')}`}{' '}
              {currency}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Status:</span>
            <span className="inline-flex items-center text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
              Completed / Verified
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {!isAuthenticated && (
            <a
              href="/login"
              className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-black hover:bg-neutral-800 text-white font-medium rounded-[5px] transition-colors text-xs shadow-2xs"
            >
              <span>Go to Login Page</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </a>
          )}

          <a
            href="/"
            className={`inline-flex items-center justify-center w-full py-2.5 px-4 ${
              isAuthenticated
                ? 'bg-black hover:bg-neutral-800 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } font-medium rounded-[5px] transition-colors text-xs shadow-2xs`}
          >
            <span>Return to Payment Portal</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
