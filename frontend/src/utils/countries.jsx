export const COUNTRIES = [
  {
    code: 'BD',
    name: 'Bangladesh',
    dial: '+880',
    placeholder: '17XXXXXXXX',
    currency: 'BDT',
  },
  {
    code: 'US',
    name: 'United States',
    dial: '+1',
    placeholder: '(555) 000-0000',
    currency: 'USD',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dial: '+44',
    placeholder: '7911 123456',
    currency: 'GBP',
  },
  {
    code: 'CA',
    name: 'Canada',
    dial: '+1',
    placeholder: '(555) 000-0000',
    currency: 'CAD',
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    dial: '+971',
    placeholder: '50 123 4567',
    currency: 'AED',
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    dial: '+966',
    placeholder: '50 123 4567',
    currency: 'SAR',
  },
  {
    code: 'IN',
    name: 'India',
    dial: '+91',
    placeholder: '98765 43210',
    currency: 'INR',
  },
  {
    code: 'AU',
    name: 'Australia',
    dial: '+61',
    placeholder: '412 345 678',
    currency: 'AUD',
  },
]

export function CountryFlag({ code, className = "w-5 h-3.5" }) {
  if (code === 'BD') {
    return (
      <svg className={`${className} rounded-[2px] shadow-2xs border border-black/10 shrink-0 inline-block`} viewBox="0 0 20 12">
        <rect width="20" height="12" fill="#006a4e" />
        <circle cx="9" cy="6" r="4.2" fill="#f42a41" />
      </svg>
    )
  }
  if (code === 'US') {
    return (
      <svg className={`${className} rounded-[2px] shadow-2xs border border-black/10 shrink-0 inline-block`} viewBox="0 0 20 12">
        <rect width="20" height="12" fill="#b22234" />
        <rect y="0.92" width="20" height="0.92" fill="#fff" />
        <rect y="2.76" width="20" height="0.92" fill="#fff" />
        <rect y="4.6" width="20" height="0.92" fill="#fff" />
        <rect y="6.44" width="20" height="0.92" fill="#fff" />
        <rect y="8.28" width="20" height="0.92" fill="#fff" />
        <rect y="10.12" width="20" height="0.92" fill="#fff" />
        <rect width="8" height="6.4" fill="#3c3b6e" />
      </svg>
    )
  }
  if (code === 'GB') {
    return (
      <svg className={`${className} rounded-[2px] shadow-2xs border border-black/10 shrink-0 inline-block`} viewBox="0 0 60 30">
        <clipPath id="gb-s"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
        <clipPath id="gb-t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
        <g clipPath="url(#gb-s)">
          <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
          <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#gb-t)" stroke="#C8102E" strokeWidth="4"/>
          <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
          <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
        </g>
      </svg>
    )
  }
  if (code === 'CA') {
    return (
      <svg className={`${className} rounded-[2px] shadow-2xs border border-black/10 shrink-0 inline-block`} viewBox="0 0 20 10">
        <rect width="20" height="10" fill="#d80027"/>
        <rect x="5" width="10" height="10" fill="#fff"/>
        <polygon points="10,2 10.8,4.5 12.5,4 11.2,5.5 12.2,7.5 10.5,6.5 10,8 9.5,6.5 7.8,7.5 8.8,5.5 7.5,4 9.2,4.5" fill="#d80027"/>
      </svg>
    )
  }
  if (code === 'IN') {
    return (
      <svg className={`${className} rounded-[2px] shadow-2xs border border-black/10 shrink-0 inline-block`} viewBox="0 0 20 12">
        <rect width="20" height="4" fill="#FF9933" />
        <rect y="4" width="20" height="4" fill="#FFFFFF" />
        <rect y="8" width="20" height="4" fill="#138808" />
        <circle cx="10" cy="6" r="1.5" fill="none" stroke="#000080" strokeWidth="0.5" />
      </svg>
    )
  }
  if (code === 'AE') {
    return (
      <svg className={`${className} rounded-[2px] shadow-2xs border border-black/10 shrink-0 inline-block`} viewBox="0 0 20 10">
        <rect width="20" height="3.33" fill="#00732f"/>
        <rect y="3.33" width="20" height="3.33" fill="#ffffff"/>
        <rect y="6.66" width="20" height="3.34" fill="#000000"/>
        <rect width="5" height="10" fill="#ff0000"/>
      </svg>
    )
  }
  if (code === 'SA') {
    return (
      <svg className={`${className} rounded-[2px] shadow-2xs border border-black/10 shrink-0 inline-block`} viewBox="0 0 20 12">
        <rect width="20" height="12" fill="#006C35"/>
        <rect x="5" y="7" width="10" height="1" fill="#ffffff"/>
      </svg>
    )
  }
  if (code === 'AU') {
    return (
      <svg className={`${className} rounded-[2px] shadow-2xs border border-black/10 shrink-0 inline-block`} viewBox="0 0 20 10">
        <rect width="20" height="10" fill="#00008B"/>
        <rect width="8" height="5" fill="#C8102E"/>
        <circle cx="15" cy="3" r="1" fill="#ffffff"/>
        <circle cx="13" cy="7" r="1" fill="#ffffff"/>
      </svg>
    )
  }
  return <span className="text-xs shrink-0">🌐</span>
}
