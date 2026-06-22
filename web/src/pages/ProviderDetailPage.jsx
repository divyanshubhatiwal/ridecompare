import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, ExternalLink, Check, Clock, Armchair, Car, Zap } from 'lucide-react'

export default function ProviderDetailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const estimate = location.state?.estimate
  const [copied, setCopied] = useState(false)

  const handleBook = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
    // Intent URL opens app by package; fallback to Play Store is built into the URL.
    window.location.href = estimate.deeplink_url
  }

  if (!estimate) {
    navigate(-1)
    return null
  }

  const rows = [
    { icon: '🚕', label: 'Provider', value: estimate.provider_display_name },
    { icon: '🪑', label: 'Comfort', value: estimate.comfort_level?.toUpperCase() },
    { icon: '🚗', label: 'Vehicle', value: estimate.vehicle_type?.toUpperCase() },
    { icon: '⏱️', label: 'ETA', value: `${estimate.eta_minutes} minutes` },
    { icon: '💰', label: 'Estimated Fare', value: estimate.fare_display, bold: true },
    ...(estimate.is_surging ? [{ icon: '🔥', label: 'Surge', value: `${estimate.surge_multiplier}x active`, red: true }] : []),
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 bg-bg/95 backdrop-blur border-b border-border z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-surface">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold">{estimate.category_display}</h1>
      </div>

      <div className="p-5">
        {/* Hero */}
        <div className="card mb-6 bg-gradient-to-br from-primary/20 to-card border-primary/30">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary border border-primary/30">
              {estimate.provider_display_name?.[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{estimate.category_display}</h2>
              <p className="text-muted text-sm">{estimate.provider_display_name}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold">{estimate.fare_display}</p>
              <p className="text-muted text-sm">{estimate.eta_minutes} min</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <h3 className="font-semibold mb-3">Ride Details</h3>
        <div className="card mb-6">
          {rows.map(({ icon, label, value, bold, red }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3 text-muted text-sm">
                <span>{icon}</span>
                <span>{label}</span>
              </div>
              <span className={`text-sm ${bold ? 'font-bold text-white' : red ? 'text-surge font-semibold' : 'text-white'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Badges */}
        {estimate.badges?.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Recognition</h3>
            <div className="flex flex-wrap gap-2">
              {estimate.badges.map(b => (
                <span key={b} className={`badge-${b} text-sm px-3 py-1.5`}>
                  {b === 'cheapest' ? '🏷️ Cheapest Option' : b === 'fastest' ? '⚡ Fastest Option' : '⭐ Best Value'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Book */}
        <button
          onClick={handleBook}
          className={`btn-primary mb-3 ${copied ? 'bg-green-600 border-green-500' : ''}`}
        >
          {copied ? (
            <><Check size={16} /> Opening app…</>
          ) : (
            <>Book on {estimate.provider_display_name} <ExternalLink size={16} /></>
          )}
        </button>
        <button onClick={() => navigate(-1)} className="btn-outline">
          Back to Results
        </button>
      </div>
    </div>
  )
}
