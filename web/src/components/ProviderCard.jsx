import { Clock, TrendingUp, ExternalLink, Check, Leaf, Zap, Smartphone, Monitor } from 'lucide-react'
import { useState } from 'react'
import ProviderIcon from './ProviderIcon'
import useRipple from '../hooks/useRipple'
import { openRideApp } from '../utils/openRideApp'

const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent || '')

export default function ProviderCard({ estimate, onClick, co2g, dealPct, route }) {
  const [booked, setBooked] = useState(false)
  const ripple = useRipple()

  const handleBook = (e) => {
    e.stopPropagation()
    ripple(e)
    setBooked(true)
    setTimeout(() => setBooked(false), 3000)
    openRideApp(estimate.provider, estimate.category, route)
  }

  const handleCardClick = (e) => {
    ripple(e)
    onClick?.()
  }

  return (
    <div
      onClick={handleCardClick}
      className="ripple-btn mb-3 cursor-pointer rounded-2xl border border-border bg-card p-4"
      style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease' }}
      onMouseEnter={e => {
        e.currentTarget.style.transform   = 'translateY(-2px)'
        e.currentTarget.style.boxShadow   = '0 8px 28px rgba(0,0,0,0.12), 0 0 0 1px rgba(15,118,110,0.2)'
        e.currentTarget.style.borderColor = 'rgba(15,118,110,0.35)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform   = 'translateY(0)'
        e.currentTarget.style.boxShadow   = 'none'
        e.currentTarget.style.borderColor = ''
      }}
    >
      <div className="flex items-start gap-3">
        {/* Provider icon */}
        <div style={{ transition: 'transform 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.07)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <ProviderIcon provider={estimate.provider} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-sm leading-tight">{estimate.category_display}</p>
              <p className="text-muted text-xs mt-0.5">{estimate.provider_display_name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-base">{estimate.fare_display}</p>
              <p className="text-muted text-xs">{estimate.eta_minutes} min</p>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <div className="flex items-center gap-1 text-muted text-xs">
              <Clock size={12} />
              <span>{estimate.eta_minutes} min ETA</span>
            </div>

            {estimate.is_surging && (
              <div className="flex items-center gap-1 text-surge text-xs">
                <TrendingUp size={12} />
                <span>{estimate.surge_multiplier}x surge</span>
              </div>
            )}

            {dealPct >= 25 && (
              <span className="badge-deal flex items-center gap-0.5">
                <Zap size={9} /> {dealPct}% cheaper
              </span>
            )}

            <div className="ml-auto flex items-center gap-1.5">
              {estimate.badges?.map(badge => (
                <span
                  key={badge}
                  className={
                    badge === 'cheapest' ? 'badge-cheapest' :
                    badge === 'fastest'  ? 'badge-fastest'  :
                    'badge-bestvalue'
                  }
                >
                  {badge === 'cheapest' ? '💸 CHEAPEST' : badge === 'fastest' ? '⚡ FASTEST' : '⭐ BEST VALUE'}
                </span>
              ))}
            </div>
          </div>

          {/* CO₂ row */}
          {co2g != null && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-cheapest/80">
              <Leaf size={11} />
              <span>~{co2g < 1000 ? `${co2g}g` : `${(co2g / 1000).toFixed(1)}kg`} CO₂ for this trip</span>
            </div>
          )}
        </div>
      </div>

      {/* Book button */}
      <button
        onClick={handleBook}
        className="ripple-btn mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold"
        style={{
          background:  booked ? 'rgba(16,185,129,0.08)' : 'rgba(15,118,110,0.08)',
          borderColor: booked ? 'rgba(16,185,129,0.3)'  : 'rgba(15,118,110,0.25)',
          color:       booked ? '#10B981'               : '#0F766E',
          transition:  'background 0.2s, border-color 0.2s, color 0.2s, transform 0.15s',
          overflow:    'hidden',
          position:    'relative',
        }}
        onMouseEnter={e => {
          if (!booked) {
            e.currentTarget.style.background = 'rgba(15,118,110,0.15)'
            e.currentTarget.style.transform  = 'translateY(-1px)'
            e.currentTarget.style.boxShadow  = '0 4px 12px rgba(15,118,110,0.2)'
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = booked ? 'rgba(16,185,129,0.08)' : 'rgba(15,118,110,0.08)'
          e.currentTarget.style.transform  = 'translateY(0)'
          e.currentTarget.style.boxShadow  = 'none'
        }}
      >
        {booked ? (
          <><Check size={14} /> Opening {estimate.provider_display_name}…</>
        ) : (
          <>
            {isMobile ? <Smartphone size={14} /> : <Monitor size={14} />}
            Book on {estimate.provider_display_name}
            <ExternalLink size={13} />
          </>
        )}
      </button>
    </div>
  )
}
