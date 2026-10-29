export default function PayBridgeLogo({ className = "w-7 h-7" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PayBridge Logo"
    >
      {/* Top Layer */}
      <path
        d="M16 3L28 9.5L16 16L4 9.5L16 3Z"
        fill="#000000"
        stroke="#000000"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Middle Connecting Layer */}
      <path
        d="M4 14.5L16 21L28 14.5"
        stroke="#000000"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom Layer */}
      <path
        d="M4 20.5L16 27L28 20.5"
        stroke="#000000"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
