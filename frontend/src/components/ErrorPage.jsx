import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function ErrorPage() {
  const queryParams = new URLSearchParams(window.location.search)
  const message = queryParams.get('message') || 'The payment was cancelled or failed during processing.'
  const gateway = queryParams.get('gateway') ? queryParams.get('gateway').toUpperCase() : null

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full bg-white rounded-[5px] shadow-lg border border-gray-100 p-8 text-center">
        <div className="flex justify-center mb-5">
          <div className="p-3 bg-rose-50 rounded-full">
            <AlertCircle className="w-16 h-16 text-rose-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          We were unable to complete your transaction{gateway ? ` via ${gateway}` : ''}.
        </p>

        <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-[5px] p-3.5 mb-6 text-left break-words">
          <strong>Reason:</strong> {message}
        </div>

        <a
          href="/"
          className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-black hover:bg-neutral-800 text-white font-medium rounded-[5px] transition-colors text-xs shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Try Again</span>
        </a>
      </div>
    </div>
  )
}
