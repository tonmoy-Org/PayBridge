import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import {
  ChevronDown,
  Loader2,
  Search,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  KeyRound,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import { COUNTRIES, CountryFlag } from '../utils/countries'

const UNIVERSITIES = [
  { value: "1", name: "American International University Bangladesh (AIUB)" },
  { value: "2", name: "Asian University of Bangladesh" },
  { value: "3", name: "BRAC University" },
  { value: "4", name: "North South University" },
  { value: "5", name: "Independent University, Bangladesh" },
  { value: "6", name: "East West University" },
  { value: "7", name: "United International University" },
  { value: "8", name: "University of Liberal Arts Bangladesh" },
  { value: "9", name: "Daffodil International University" },
  { value: "10", name: "Stamford University Bangladesh" },
  { value: "51", name: "Other" }
]

const QUICK_AMOUNTS = {
  BDT: [100, 250, 299, 500, 1000],
  USD: [5, 10, 25, 50, 100],
}

export default function PaymentForm() {
  const { user, isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    workemail: '',
    phone: '',
    department: '',
    universitieslist: '',
    other_university: '',
    amount: '299',
  })
  const [currency, setCurrency] = useState('BDT')
  const [paymentGateway, setPaymentGateway] = useState('bkash')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  // Prefill email and name if user is already logged in
  useEffect(() => {
    if (user && user.email) {
      setFormData((prev) => ({
        ...prev,
        workemail: prev.workemail || user.email,
        firstname: prev.firstname || (user.displayName ? user.displayName.split(' ')[0] : ''),
        lastname: prev.lastname || (user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '')
      }))
    }
  }, [user])

  // Account creation & duplicate detection state
  const [existingAccountMessage, setExistingAccountMessage] = useState('')
  const [isCheckingAccount, setIsCheckingAccount] = useState(false)

  // Country Code Dropdown State
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]) // Default BD (+880)
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const countryDropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) {
        setCountryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dial.includes(countrySearch) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  )

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

  const checkExistingAccount = async (emailToCheck) => {
    const cleanEmail = (emailToCheck || '').trim()
    if (!cleanEmail || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(cleanEmail)) {
      setExistingAccountMessage('')
      return false
    }

    // If user is already logged in with this account, do not warn or block!
    if (isAuthenticated && user?.email?.toLowerCase() === cleanEmail.toLowerCase()) {
      setExistingAccountMessage('')
      return false
    }

    setIsCheckingAccount(true)
    try {
      const res = await axios.get(`${backendUrl}/api/auth/check-user?email=${encodeURIComponent(cleanEmail)}`)
      if (res.data && res.data.exists) {
        if (!isAuthenticated) {
          setExistingAccountMessage('An account with this email already exists.')
        } else {
          setExistingAccountMessage('')
        }
        return true
      } else {
        setExistingAccountMessage('')
        return false
      }
    } catch (err) {
      console.error('Account check error:', err)
      return false
    } finally {
      setIsCheckingAccount(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (name === 'workemail' && existingAccountMessage) {
      setExistingAccountMessage('')
    }
  }

  const handleCurrencyChange = (newCurrency) => {
    if (newCurrency === currency) return
    setCurrency(newCurrency)
    const defaultAmt = newCurrency === 'USD' ? '10' : '299'
    setFormData((prev) => ({ ...prev, amount: defaultAmt }))
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: '' }))
    }

    if (newCurrency === 'USD') {
      // Auto select Stripe when USD is selected
      setPaymentGateway('stripe')
      // Auto select USA country code when USD is selected
      const usCountry = COUNTRIES.find((c) => c.code === 'US') || COUNTRIES[1]
      setSelectedCountry(usCountry)
    } else if (newCurrency === 'BDT') {
      // Prevent Stripe on BDT; fallback to bKash
      if (paymentGateway === 'stripe') {
        setPaymentGateway('bkash')
      }
      // Auto select Bangladesh country code when BDT is selected
      const bdCountry = COUNTRIES.find((c) => c.code === 'BD') || COUNTRIES[0]
      setSelectedCountry(bdCountry)
    }
  }

  const handleAmountChip = (amt) => {
    setFormData((prev) => ({ ...prev, amount: String(amt) }))
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    // First and Last Name
    if (!formData.firstname.trim()) newErrors.firstname = 'First name is required'
    if (!formData.lastname.trim()) newErrors.lastname = 'Last name is required'

    // Email Address
    if (!formData.workemail.trim()) {
      newErrors.workemail = 'Email address is required'
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.workemail)) {
      newErrors.workemail = 'Please enter a valid email address'
    }


    // Phone Number
    const cleanPhone = formData.phone.replace(/[^0-9]/g, '')
    if (!cleanPhone) {
      newErrors.phone = 'Phone number is required'
    } else if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      newErrors.phone = `Please enter a valid phone number (${selectedCountry.name})`
    }

    // Department
    if (!formData.department.trim()) newErrors.department = 'Department is required'

    // University
    if (!formData.universitieslist) newErrors.universitieslist = 'Please select a university'
    if (formData.universitieslist === '51' && !formData.other_university.trim()) {
      newErrors.other_university = 'University name is required'
    }

    // Custom Amount Validation with dynamic limits based on Currency
    const rawAmount = String(formData.amount).trim()
    const numAmount = Number(rawAmount)
    const minAmount = currency === 'USD' ? 1 : 10
    const maxAmount = currency === 'USD' ? 5000 : 500000
    const currencySymbol = currency === 'USD' ? '$' : '৳'

    if (!rawAmount) {
      newErrors.amount = 'Please enter a payment amount'
    } else if (isNaN(numAmount)) {
      newErrors.amount = 'Payment amount must be a valid number'
    } else if (numAmount <= 0) {
      newErrors.amount = 'Payment amount must be greater than 0'
    } else if (numAmount < minAmount) {
      newErrors.amount = `Minimum payable amount is ${currencySymbol}${minAmount} ${currency}`
    } else if (numAmount > maxAmount) {
      newErrors.amount = `Maximum payable amount is ${currencySymbol}${maxAmount.toLocaleString()} ${currency}`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // 1. Validate form inputs
    if (!validate()) {
      toast.warning('Please complete all required fields correctly.')
      return
    }

    setIsSubmitting(true)
    setApiError('')

    const paymentAmount = Number(formData.amount)
    const fullPhoneNumber = `${selectedCountry.dial}${formData.phone.replace(/[^0-9]/g, '')}`

    const selectedUni = UNIVERSITIES.find((u) => u.value === formData.universitieslist)
    const universityName =
      formData.universitieslist === '51' ? formData.other_university : selectedUni?.name || formData.universitieslist

    const registrationPayload = {
      firstname: formData.firstname.trim(),
      lastname: formData.lastname.trim(),
      email: formData.workemail.trim(),
      phone: fullPhoneNumber,
      department: formData.department.trim(),
      university: universityName,
    }

    const resolvedPaymentUserId = (user && user.uid) ? user.uid : Date.now()

    try {
      if (paymentGateway === 'bkash') {
        // bKash operates natively in BDT; convert USD to BDT if USD was selected
        const bkashAmount = currency === 'USD' ? Math.round(paymentAmount * 122) : paymentAmount

        const response = await axios.post(
          `${backendUrl}/api/bkash/payment/create`,
          {
            amount: bkashAmount,
            userId: resolvedPaymentUserId,
            ...registrationPayload,
          },
          { withCredentials: true }
        )

        if (response.data && response.data.bkashURL) {
          window.location.href = response.data.bkashURL
        } else {
          const err = response.data?.error || 'Failed to retrieve payment redirect URL from bKash.'
          setApiError(err)
          toast.error(err)
        }
      } else if (paymentGateway === 'sslcommerz') {
        const response = await axios.post(
          `${backendUrl}/api/sslcommerz/payment/init`,
          {
            amount: paymentAmount,
            currency: currency,
            userId: resolvedPaymentUserId,
            ...registrationPayload,
          },
          { withCredentials: true }
        )

        if (response.data && response.data.GatewayPageURL) {
          window.location.href = response.data.GatewayPageURL
        } else {
          const err = response.data?.error || 'Failed to retrieve payment URL from SSLCommerz.'
          setApiError(err)
          toast.error(err)
        }
      } else if (paymentGateway === 'stripe') {
        const response = await axios.post(
          `${backendUrl}/api/stripe/payment/create-checkout-session`,
          {
            amount: paymentAmount,
            currency: currency,
            userId: resolvedPaymentUserId,
            ...registrationPayload,
          },
          { withCredentials: true }
        )

        if (response.data && response.data.url) {
          window.location.href = response.data.url
        } else {
          const err = response.data?.error || 'Failed to retrieve payment URL from Stripe.'
          setApiError(err)
          toast.error(err)
        }
      }
    } catch (err) {
      console.error(`${paymentGateway} payment error:`, err)
      const errResponse = err.response?.data
      const msg = errResponse?.error || err.message || 'Payment initiation failed. Please try again.'
      setApiError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayAmount = formData.amount && !isNaN(formData.amount) && Number(formData.amount) > 0
    ? Number(formData.amount).toLocaleString('en-US')
    : '0'

  return (
    <div className="bg-white p-6 sm:p-8 rounded-[5px] shadow-md border border-gray-100">
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Registration Details</h2>
        <p className="text-xs text-gray-500 mt-1">
          Complete the form and select payment method.
        </p>
      </div>

      {apiError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-[5px]">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
              placeholder="First Name"
              className={`w-full px-3.5 py-2.5 bg-white border rounded-[5px] text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black hover:border-gray-400 shadow-2xs ${errors.firstname ? 'border-red-400 bg-red-50/10' : 'border-gray-300'
                }`}
            />
            {errors.firstname && <p className="text-red-500 text-xs mt-1">{errors.firstname}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              placeholder="Last Name"
              className={`w-full px-3.5 py-2.5 bg-white border rounded-[5px] text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black hover:border-gray-400 shadow-2xs ${errors.lastname ? 'border-red-400 bg-red-50/10' : 'border-gray-300'
                }`}
            />
            {errors.lastname && <p className="text-red-500 text-xs mt-1">{errors.lastname}</p>}
          </div>
        </div>

        {/* Email Address */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-600">
              Email Address <span className="text-red-500">*</span>
            </label>
            {isCheckingAccount && (
              <span className="flex items-center text-[11px] text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin mr-1 text-gray-400" />
                Checking account...
              </span>
            )}
          </div>
          <input
            type="email"
            name="workemail"
            value={formData.workemail}
            onChange={handleChange}
            onBlur={() => checkExistingAccount(formData.workemail)}
            placeholder="example@domain.com"
            className={`w-full px-3.5 py-2.5 bg-white border rounded-[5px] text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black hover:border-gray-400 shadow-2xs ${errors.workemail || existingAccountMessage ? 'border-amber-500 bg-amber-50/10' : 'border-gray-300'
              }`}
          />
          {errors.workemail && !existingAccountMessage && (
            <p className="text-red-500 text-xs mt-1">{errors.workemail}</p>
          )}

          {/* Existing Account Detected Alert (only shown when not logged in) */}
          {!isAuthenticated && existingAccountMessage && (
            <div className="mt-2.5 p-3 rounded-[5px] bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5 shadow-2xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-950 text-xs">
                  An account with this email exists. You can log in or continue payment to link with your account.
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <a
                    href={`/login?email=${encodeURIComponent(formData.workemail)}`}
                    className="inline-flex items-center px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-[4px] font-semibold text-xs shadow-2xs transition-colors"
                  >
                    <span>Log In</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setExistingAccountMessage('')
                      setFormData((p) => ({ ...p, workemail: '' }))
                    }}
                    className="text-xs text-amber-700 hover:text-amber-900 underline px-1"
                  >
                    Change email
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Phone Number with Country Code Dropdown */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div
            className={`flex relative items-stretch bg-white border rounded-[5px] shadow-2xs transition-all duration-200 ${
              errors.phone
                ? 'border-red-400 bg-red-50/10'
                : 'border-gray-300 focus-within:border-black focus-within:ring-2 focus-within:ring-black/10 hover:border-gray-400'
            }`}
            ref={countryDropdownRef}
          >
            {/* Country Selector Button */}
            <button
              type="button"
              onClick={() => setCountryDropdownOpen((prev) => !prev)}
              className="inline-flex items-center space-x-1.5 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors cursor-pointer select-none shrink-0 border-r border-gray-300 rounded-l-[4px] focus:outline-none"
              title={`${selectedCountry.name} (${selectedCountry.dial})`}
            >
              <CountryFlag code={selectedCountry.code} />
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
                  countryDropdownOpen ? 'rotate-180' : ''
                }`}
              />
              <span className="text-xs font-semibold text-gray-800">{selectedCountry.dial}</span>
            </button>

            {/* Phone Input */}
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={selectedCountry.placeholder}
              className="w-full px-3.5 py-2.5 bg-transparent border-0 rounded-r-[4px] text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0"
            />

            {/* Country Dropdown Menu */}
            {countryDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-[5px] shadow-lg border border-gray-200 z-50 py-2">
                {/* Search Country Input */}
                <div className="px-2.5 pb-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Search country..."
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-[4px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black/20 focus:bg-white"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Country List */}
                <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
                  {filteredCountries.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c)
                        setCountryDropdownOpen(false)
                        setCountrySearch('')
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors text-xs cursor-pointer ${selectedCountry.code === c.code ? 'bg-gray-50 font-semibold' : ''
                        }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <CountryFlag code={c.code} />
                        <span className="text-gray-800 truncate">{c.name}</span>
                      </div>
                      <span className="font-mono text-gray-500 text-xs ml-2 shrink-0">{c.dial}</span>
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <div className="px-3 py-3 text-center text-xs text-gray-400">
                      No country found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>


        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Department / Major <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="e.g. Computer Science & Engineering"
            className={`w-full px-3.5 py-2.5 bg-white border rounded-[5px] text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black hover:border-gray-400 shadow-2xs ${errors.department ? 'border-red-400 bg-red-50/10' : 'border-gray-300'
              }`}
          />
          {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
        </div>

        {/* University List */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            University / Institution <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="universitieslist"
              value={formData.universitieslist}
              onChange={handleChange}
              className={`w-full appearance-none bg-white pl-3.5 pr-10 py-2.5 border rounded-[5px] text-sm text-gray-800 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black hover:border-gray-400 shadow-2xs ${errors.universitieslist ? 'border-red-400 bg-red-50/10' : 'border-gray-300'
                }`}
            >
              <option value="">Select University</option>
              {UNIVERSITIES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
          </div>
          {errors.universitieslist && (
            <p className="text-red-500 text-xs mt-1">{errors.universitieslist}</p>
          )}
        </div>

        {/* Other University Input */}
        {formData.universitieslist === '51' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Specify University Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="other_university"
              value={formData.other_university}
              onChange={handleChange}
              placeholder="Enter your institution's name"
              className={`w-full px-3.5 py-2.5 bg-white border rounded-[5px] text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black hover:border-gray-400 shadow-2xs ${errors.other_university ? 'border-red-400 bg-red-50/10' : 'border-gray-300'
                }`}
            />
            {errors.other_university && (
              <p className="text-red-500 text-xs mt-1">{errors.other_university}</p>
            )}
          </div>
        )}

        {/* Currency Selection Field */}
        <div>
          <label htmlFor="currency-select" className="block text-xs font-medium text-gray-600 mb-1">
            Currency <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="currency-select"
              name="currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full appearance-none bg-white px-3.5 py-2.5 border border-gray-300 rounded-[5px] text-sm text-gray-800 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black hover:border-gray-400 shadow-2xs pr-10"
            >
              <option value="BDT">BDT</option>
              <option value="USD">USD</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Custom Amount Field */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Enter Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              {currency === 'BDT' ? (
                <span className="taka-symbol text-base font-bold text-gray-700">৳</span>
              ) : (
                <span className="text-base font-bold text-gray-700">$</span>
              )}
            </div>
            <input
              type="number"
              name="amount"
              min={currency === 'USD' ? '1' : '10'}
              max={currency === 'USD' ? '5000' : '500000'}
              step="any"
              value={formData.amount}
              onChange={handleChange}
              placeholder={`Enter amount in ${currency}`}
              className={`w-full pl-9 pr-14 py-2.5 bg-white border rounded-[5px] text-sm text-gray-900 font-semibold placeholder-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black shadow-2xs ${errors.amount ? 'border-red-400 bg-red-50/10' : 'border-gray-300'
                }`}
            />
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-gray-500">
              {currency}
            </div>
          </div>
          {errors.amount && (
            <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
          )}

          {/* Quick Select Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] text-gray-400 mr-1">Quick select:</span>
            {QUICK_AMOUNTS[currency].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleAmountChip(amt)}
                className={`px-2.5 py-1 text-xs rounded-[5px] border transition-colors cursor-pointer ${String(formData.amount) === String(amt)
                  ? 'border-black bg-black text-white font-semibold'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                  }`}
              >
                {currency === 'BDT' ? `৳${amt}` : `$${amt}`}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Section */}
        <div className="pt-4 border-t border-gray-100">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Select Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* bKash Gateway */}
            <div
              onClick={() => {
                if (currency !== 'BDT') {
                  handleCurrencyChange('BDT')
                }
                setPaymentGateway('bkash')
              }}
              title="Pay via bKash (BDT)"
              className={`relative flex items-center px-2.5 sm:px-3 py-2.5 border rounded-[5px] transition-all cursor-pointer ${paymentGateway === 'bkash'
                ? 'border-pink-500 bg-pink-50/50 shadow-2xs'
                : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
              <input
                type="radio"
                name="payment_method"
                value="bkash"
                checked={paymentGateway === 'bkash'}
                onChange={() => {
                  if (currency !== 'BDT') {
                    handleCurrencyChange('BDT')
                  }
                  setPaymentGateway('bkash')
                }}
                className="h-4 w-4 text-pink-600 accent-pink-600 focus:ring-pink-500 shrink-0 cursor-pointer"
              />
              <div className="flex-1 flex justify-center items-center pl-1 sm:pl-2">
                <img
                  src="/bkash-logo.svg"
                  alt="bKash"
                  className="h-6 sm:h-7 max-h-7 w-auto object-contain"
                />
              </div>
            </div>

            {/* SSLCommerz Gateway */}
            <div
              onClick={() => {
                if (currency !== 'BDT') {
                  handleCurrencyChange('BDT')
                }
                setPaymentGateway('sslcommerz')
              }}
              title="Pay via SSLCommerz (BDT)"
              className={`relative flex items-center px-2.5 sm:px-3 py-2.5 border rounded-[5px] transition-all cursor-pointer ${paymentGateway === 'sslcommerz'
                ? 'border-[#2A5DAB] bg-[#2A5DAB]/5 shadow-2xs'
                : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
              <input
                type="radio"
                name="payment_method"
                value="sslcommerz"
                checked={paymentGateway === 'sslcommerz'}
                onChange={() => {
                  if (currency !== 'BDT') {
                    handleCurrencyChange('BDT')
                  }
                  setPaymentGateway('sslcommerz')
                }}
                className="h-4 w-4 text-[#2A5DAB] accent-[#2A5DAB] focus:ring-[#2A5DAB] shrink-0 cursor-pointer"
              />
              <div className="flex-1 flex justify-center items-center pl-1 sm:pl-2">
                <img
                  src="/SSLCOMMERZ.png"
                  alt="SSLCommerz"
                  className="h-5 sm:h-6 max-h-6 w-auto object-contain"
                />
              </div>
            </div>

            {/* Stripe Gateway */}
            <div
              onClick={() => {
                if (currency !== 'USD') {
                  handleCurrencyChange('USD')
                }
                setPaymentGateway('stripe')
              }}
              title="Pay via Stripe (USD)"
              className={`relative flex items-center px-2.5 sm:px-3 py-2.5 border rounded-[5px] transition-all cursor-pointer ${paymentGateway === 'stripe'
                ? 'border-[#635BFF] bg-[#635BFF]/5 shadow-2xs'
                : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
              <input
                type="radio"
                name="payment_method"
                value="stripe"
                checked={paymentGateway === 'stripe'}
                onChange={() => {
                  if (currency !== 'USD') {
                    handleCurrencyChange('USD')
                  }
                  setPaymentGateway('stripe')
                }}
                className="h-4 w-4 text-[#635BFF] accent-[#635BFF] focus:ring-[#635BFF] shrink-0 cursor-pointer"
              />
              <div className="flex-1 flex justify-center items-center pl-1 sm:pl-2">
                <svg
                  viewBox="0 0 512 214"
                  className="h-5 sm:h-6 max-h-6 w-auto fill-[#635BFF]"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="Stripe"
                >
                  <path d="M512 110.08c0-36.409-17.636-65.138-51.342-65.138c-33.85 0-54.33 28.73-54.33 64.854c0 42.808 24.179 64.426 58.88 64.426c16.925 0 29.725-3.84 39.396-9.244v-28.445c-9.67 4.836-20.764 7.823-34.844 7.823c-13.796 0-26.027-4.836-27.591-21.618h69.547c0-1.85.284-9.245.284-12.658m-70.258-13.511c0-16.071 9.814-22.756 18.774-22.756c8.675 0 17.92 6.685 17.92 22.756zm-90.31-51.627c-13.939 0-22.899 6.542-27.876 11.094l-1.85-8.818h-31.288v165.83l35.555-7.537l.143-40.249c5.12 3.698 12.657 8.96 25.173 8.96c25.458 0 48.64-20.48 48.64-65.564c-.142-41.245-23.609-63.716-48.498-63.716m-8.534 97.991c-8.391 0-13.37-2.986-16.782-6.684l-.143-52.765c3.698-4.124 8.818-6.968 16.925-6.968c12.942 0 21.902 14.506 21.902 33.137c0 19.058-8.818 33.28-21.902 33.28M241.493 36.551l35.698-7.68V0l-35.698 7.538zm0 10.809h35.698v124.444h-35.698zm-38.257 10.524L200.96 47.36h-30.72v124.444h35.556V87.467c8.39-10.951 22.613-8.96 27.022-7.396V47.36c-4.551-1.707-21.191-4.836-29.582 10.524m-71.112-41.386l-34.702 7.395l-.142 113.92c0 21.05 15.787 36.551 36.836 36.551c11.662 0 20.195-2.133 24.888-4.693V140.8c-4.55 1.849-27.022 8.391-27.022-12.658V77.653h27.022V47.36h-27.022zM35.982 83.484c0-5.546 4.551-7.68 12.09-7.68c10.808 0 24.461 3.272 35.27 9.103V51.484c-11.804-4.693-23.466-6.542-35.27-6.542C19.2 44.942 0 60.018 0 85.192c0 39.252 54.044 32.995 54.044 49.92c0 6.541-5.688 8.675-13.653 8.675c-11.804 0-26.88-4.836-38.827-11.378v33.849c13.227 5.689 26.596 8.106 38.827 8.106c29.582 0 49.92-14.648 49.92-40.106c-.142-42.382-54.329-34.845-54.329-50.774" />
                </svg>
              </div>
            </div>
          </div>

          {/* Amount Summary */}
          <div className="mt-3 flex items-center justify-between bg-gray-50 px-3.5 py-2.5 rounded-[5px] border border-gray-100">
            <span className="text-xs font-medium text-gray-500">Payable Amount:</span>
            <div className="flex items-center">
              {currency === 'BDT' ? (
                <span className="taka-symbol text-lg font-bold text-gray-900 leading-none mr-1">৳</span>
              ) : (
                <span className="text-lg font-bold text-gray-900 leading-none mr-1">$</span>
              )}
              <span className="text-base font-bold text-gray-900">{displayAmount}</span>
              <span className="text-xs font-semibold text-gray-500 ml-1.5">{currency}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center py-2.5 px-4 font-semibold text-xs tracking-wide rounded-[5px] shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 text-white cursor-pointer ${paymentGateway === 'bkash'
              ? 'bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 focus:ring-pink-500'
              : paymentGateway === 'sslcommerz'
                ? 'bg-[#2A5DAB] hover:bg-[#224b8a] disabled:bg-[#2A5DAB]/60 focus:ring-[#2A5DAB]'
                : 'bg-black hover:bg-neutral-800 disabled:bg-black/60 focus:ring-black'
              }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting to {paymentGateway === 'bkash' ? 'bKash' : paymentGateway === 'sslcommerz' ? 'SSLCommerz' : 'Stripe'}...
              </>
            ) : paymentGateway === 'bkash' ? (
              'Proceed to bKash Payment'
            ) : paymentGateway === 'sslcommerz' ? (
              'Proceed to SSLCommerz Payment'
            ) : (
              'Proceed to Stripe Payment'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
