/**
 * Provider icons styled to match the real app icons.
 * Uses inline SVG so no external requests needed.
 */

// Uber — black bg, white wordmark
const UberIcon = () => (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <rect width="48" height="48" rx="12" fill="#000"/>
    <text x="24" y="29" textAnchor="middle" fontFamily="'Arial Black',Arial,sans-serif"
      fontWeight="900" fontSize="13" fill="#fff" letterSpacing="-0.5">Uber</text>
  </svg>
)

// Ola — green bg, white OLA
const OlaIcon = () => (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <rect width="48" height="48" rx="12" fill="#23AA4E"/>
    <text x="24" y="31" textAnchor="middle" fontFamily="'Arial Black',Arial,sans-serif"
      fontWeight="900" fontSize="16" fill="#fff" letterSpacing="1">OLA</text>
  </svg>
)

// Rapido — yellow bg, black lightning bolt
const RapidoIcon = () => (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <rect width="48" height="48" rx="12" fill="#FFD000"/>
    <path d="M27 8 L18 26 L23 26 L21 40 L30 22 L25 22 Z" fill="#1A1A1A"/>
  </svg>
)

// InDrive — dark bg, green "in" + white "Drive"
const InDriveIcon = () => (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <rect width="48" height="48" rx="12" fill="#0A0A0A"/>
    <text x="24" y="22" textAnchor="middle" fontFamily="'Arial Black',Arial,sans-serif"
      fontWeight="900" fontSize="7" fill="#00C853" letterSpacing="0.5">in</text>
    <text x="24" y="32" textAnchor="middle" fontFamily="'Arial Black',Arial,sans-serif"
      fontWeight="900" fontSize="8.5" fill="#fff" letterSpacing="-0.3">Drive</text>
  </svg>
)

const ICONS = {
  uber:    UberIcon,
  ola:     OlaIcon,
  rapido:  RapidoIcon,
  indrive: InDriveIcon,
}

export default function ProviderIcon({ provider }) {
  const Icon = ICONS[provider]
  if (Icon) return (
    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
      <Icon />
    </div>
  )
  // Generic fallback
  return (
    <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
      <span className="font-bold text-sm">{provider[0].toUpperCase()}</span>
    </div>
  )
}
