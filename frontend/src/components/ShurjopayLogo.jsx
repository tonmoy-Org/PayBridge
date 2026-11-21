export default function ShurjopayLogo({ className = "" }) {
  return (
    <div className={`shurjopay-logo-wrap ${className}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <svg
        viewBox="0 0 320 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shurjopay-svg"
        style={{ width: '100%', height: '100%' }}
        aria-label="shurjoPay Logo"
      >
        {/* "shurjo" in dark navy */}
        <text
          x="10"
          y="56"
          fill="#1c355e"
          fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
          fontWeight="800"
          fontSize="48"
          letterSpacing="-1.5px"
        >
          shurjo
        </text>

        {/* "Pay" in vibrant green */}
        <text
          x="166"
          y="56"
          fill="#22a048"
          fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
          fontWeight="800"
          fontSize="48"
          letterSpacing="-1.5px"
        >
          Pay
        </text>

        {/* Hand holding credit card illustration in green */}
        <g stroke="#22a048" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Card outline */}
          <rect x="252" y="8" width="46" height="28" rx="4.5" transform="rotate(-8 252 8)" stroke="#22a048" />
          <line x1="250" y1="18" x2="296" y2="12" stroke="#22a048" strokeWidth="2.2" />
          {/* Hand contour grasping card */}
          <path d="M 242 32 C 244 22, 250 16, 258 16 C 264 16, 268 22, 272 28" />
          <path d="M 237 44 C 244 38, 254 36, 266 40 C 276 44, 280 52, 270 60 C 260 66, 248 62, 240 52 Z" />
          <path d="M 240 52 C 232 50, 226 46, 220 48" />
        </g>
      </svg>
    </div>
  )
}
