import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Search,
  Filter,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
  Receipt
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'

export default function TrackerHistory() {
  const { user, token, role } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({
    totalTransactions: 0,
    completedTransactions: 0,
    totalVolumeBDT: 0,
    totalVolumeUSD: 0
  })
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  })

  const [search, setSearch] = useState('')
  const [gateway, setGateway] = useState('all')
  const [status, setStatus] = useState('all')
  const [currency, setCurrency] = useState('all')
  const [page, setPage] = useState(1)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [selectedReceipt, setSelectedReceipt] = useState(null)

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

  const fetchHistory = async () => {
    if (!token) return
    setIsLoading(true)
    setError('')
    try {
      const response = await axios.get(`${backendUrl}/api/tracker/history`, {
        params: {
          search,
          gateway,
          status,
          currency,
          page,
          limit: 10
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.data && response.data.success) {
        setTransactions(response.data.transactions || [])
        setStats(response.data.stats || {})
        setPagination(response.data.pagination || { totalRecords: 0, totalPages: 1, currentPage: 1 })
      } else {
        setError(response.data?.error || 'Failed to load transaction history.')
      }
    } catch (err) {
      console.error('Fetch tracker history error:', err)
      const msg = err.response?.data?.error || err.message || 'Unable to connect to tracker history service.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [token, gateway, status, currency, page])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchHistory()
  }

  const handleCopy = (text, id) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getGatewayBadge = (gw) => {
    switch (gw?.toLowerCase()) {
      case 'bkash':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-semibold bg-pink-50 text-[#D12053] border border-pink-200">
            bKash
          </span>
        )
      case 'sslcommerz':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-semibold bg-blue-50 text-[#2A5DAB] border border-blue-200">
            SSLCommerz
          </span>
        )
      case 'stripe':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-semibold bg-purple-50 text-[#635BFF] border border-purple-200">
            Stripe
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-semibold bg-gray-100 text-gray-700">
            {gw || 'Direct'}
          </span>
        )
    }
  }

  const getStatusBadge = (st) => {
    switch (st?.toLowerCase()) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
            Completed
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
            Pending
          </span>
        )
      case 'failed':
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
            {st}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium bg-gray-100 text-gray-600">
            {st || 'Unknown'}
          </span>
        )
    }
  }

  return (
    <div className="flex-1 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Clean Page Title Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Tracker History
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time payment history for {user?.email}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchHistory}
          disabled={isLoading}
          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-[5px] border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 transition-colors cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-[5px] border border-gray-200 shadow-2xs">
          <p className="text-xs font-medium text-gray-500">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTransactions || 0}</p>
          <p className="text-[11px] text-gray-400 mt-1">Logged across all gateways</p>
        </div>

        <div className="bg-white p-4 rounded-[5px] border border-gray-200 shadow-2xs">
          <p className="text-xs font-medium text-gray-500">Completed Payments</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completedTransactions || 0}</p>
          <p className="text-[11px] text-gray-400 mt-1">Verified & settled</p>
        </div>

        <div className="bg-white p-4 rounded-[5px] border border-gray-200 shadow-2xs">
          <p className="text-xs font-medium text-gray-500">Total BDT Volume</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">৳{(stats.totalVolumeBDT || 0).toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-1">bKash & SSLCommerz</p>
        </div>

        <div className="bg-white p-4 rounded-[5px] border border-gray-200 shadow-2xs">
          <p className="text-xs font-medium text-gray-500">Total USD Volume</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${(stats.totalVolumeUSD || 0).toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-1">Stripe Card Payments</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-[5px] border border-gray-200 shadow-2xs mb-6">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Keyword Search */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by TrxID, Payment ID, or Phone..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-[5px] text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
            />
          </div>

          {/* Gateway Filter */}
          <div className="lg:col-span-2">
            <select
              value={gateway}
              onChange={(e) => {
                setGateway(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-[5px] text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black cursor-pointer"
            >
              <option value="all">All Gateways</option>
              <option value="bkash">bKash</option>
              <option value="sslcommerz">SSLCommerz</option>
              <option value="stripe">Stripe</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-[5px] text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Currency Filter */}
          <div className="lg:col-span-2">
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-[5px] text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black cursor-pointer"
            >
              <option value="all">All Currencies</option>
              <option value="BDT">BDT (৳)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="lg:col-span-1">
            <button
              type="submit"
              className="w-full py-2 px-3 bg-black hover:bg-neutral-800 text-white rounded-[5px] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[5px]">
          {error}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white border border-gray-200 rounded-[5px] shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-medium">Loading tracker history records...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-gray-800">No Transactions Found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {search || gateway !== 'all' || status !== 'all'
                ? 'No transactions matched your search or filter criteria. Try resetting filters.'
                : 'No transaction history found for your account yet. Payments initiated with your email will automatically appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="px-4 py-3">Date & Time</th>
                  <th scope="col" className="px-4 py-3">Transaction / Ref</th>
                  <th scope="col" className="px-4 py-3">Gateway</th>
                  <th scope="col" className="px-4 py-3">Amount</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {transactions.map((tx) => {
                  const refId = tx.trxID || tx.paymentID || tx._id
                  const formattedDate = tx.createdAt
                    ? new Date(tx.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : tx.date || 'Recent'

                  return (
                    <tr key={tx._id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-gray-900 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="truncate max-w-[160px] sm:max-w-[220px]" title={refId}>
                            {refId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(refId, tx._id)}
                            title="Copy Transaction ID"
                            className="p-1 text-gray-400 hover:text-black rounded cursor-pointer"
                          >
                            {copiedId === tx._id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {getGatewayBadge(tx.gateway)}
                      </td>

                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                        {tx.currency === 'USD' ? `$${tx.amount}` : `৳${tx.amount}`}
                        <span className="text-[10px] text-gray-400 font-normal ml-1">
                          {tx.currency || 'BDT'}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(tx.status)}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(tx)}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-[4px] border border-gray-200 bg-white hover:bg-black hover:text-white hover:border-black text-gray-700 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Receipt className="w-3.5 h-3.5 mr-1" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Showing page <span className="font-semibold">{pagination.currentPage}</span> of{' '}
              <span className="font-semibold">{pagination.totalPages}</span> ({pagination.totalRecords} total records)
            </span>
            <div className="inline-flex items-center space-x-1">
              <button
                type="button"
                disabled={pagination.currentPage <= 1 || isLoading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="px-2.5 py-1 text-xs font-semibold rounded-[4px] border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 inline mr-0.5" />
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.currentPage >= pagination.totalPages || isLoading}
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                className="px-2.5 py-1 text-xs font-semibold rounded-[4px] border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 inline ml-0.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Receipt / Details Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-[5px] shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900">Payment Receipt Details</h3>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-600 border border-transparent hover:border-red-300 hover:bg-red-50 rounded-[4px] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Status Header */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-[5px] flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-[11px]">Payment Status</p>
                  <p className={`font-bold text-sm mt-0.5 ${
                    selectedReceipt.status === 'Completed'
                      ? 'text-emerald-600'
                      : selectedReceipt.status === 'Pending'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}>
                    {selectedReceipt.status || 'Completed'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-[11px]">Amount Paid</p>
                  <p className="font-bold text-base text-gray-900">
                    {selectedReceipt.currency === 'USD' ? `$${selectedReceipt.amount}` : `৳${selectedReceipt.amount}`} {selectedReceipt.currency || 'BDT'}
                  </p>
                </div>
              </div>

              {/* Transaction Key Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500 block text-[11px]">Gateway Provider</span>
                  <span className="font-semibold text-gray-800 uppercase">{selectedReceipt.gateway}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Currency</span>
                  <span className="font-semibold text-gray-800">{selectedReceipt.currency || 'BDT'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block text-[11px]">Transaction ID (TrxID)</span>
                  <span className="font-mono text-gray-800 break-all select-all font-semibold">
                    {selectedReceipt.trxID || 'N/A'}
                  </span>
                </div>
                {selectedReceipt.paymentID && (
                  <div className="col-span-2">
                    <span className="text-gray-500 block text-[11px]">Gateway Payment ID</span>
                    <span className="font-mono text-gray-800 break-all select-all">
                      {selectedReceipt.paymentID}
                    </span>
                  </div>
                )}
                {selectedReceipt.val_id && (
                  <div className="col-span-2">
                    <span className="text-gray-500 block text-[11px]">Validation ID (val_id)</span>
                    <span className="font-mono text-gray-800 break-all">
                      {selectedReceipt.val_id}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 block text-[11px]">Customer Email</span>
                  <span className="text-gray-800 truncate block">{selectedReceipt.customerEmail || user?.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Customer Phone</span>
                  <span className="text-gray-800">{selectedReceipt.customerPhone || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block text-[11px]">Timestamp</span>
                  <span className="text-gray-800">
                    {selectedReceipt.createdAt ? new Date(selectedReceipt.createdAt).toLocaleString() : selectedReceipt.date}
                  </span>
                </div>
              </div>

              {/* Raw Response snippet if available */}
              {selectedReceipt.rawResponse && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-500 block text-[11px] mb-1">Gateway Settlement Metadata</span>
                  <div className="bg-gray-50 p-2.5 rounded-[4px] border border-gray-200 text-[10px] font-mono text-gray-700 space-y-1">
                    {selectedReceipt.rawResponse.bank_tran_id && (
                      <p><span className="text-gray-400">Bank Tran ID:</span> {selectedReceipt.rawResponse.bank_tran_id}</p>
                    )}
                    {selectedReceipt.rawResponse.card_issuer && (
                      <p><span className="text-gray-400">Issuer:</span> {selectedReceipt.rawResponse.card_issuer}</p>
                    )}
                    {selectedReceipt.rawResponse.card_brand && (
                      <p><span className="text-gray-400">Brand:</span> {selectedReceipt.rawResponse.card_brand}</p>
                    )}
                    {selectedReceipt.rawResponse.risk_title && (
                      <p><span className="text-gray-400">Risk Assessment:</span> {selectedReceipt.rawResponse.risk_title}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-white border border-red-500 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-[5px] text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
