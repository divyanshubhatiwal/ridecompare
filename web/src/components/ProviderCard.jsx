import { Clock, TrendingUp, ExternalLink, Check, Leaf, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import ProviderIcon from './ProviderIcon'
import { openRideApp } from '../utils/openRideApp'

const BADGE = {
  cheapest:   { label: 'Cheapest',   color: '#10B981' },
  fastest:    { label: 'Fastest',    color: '#3B82F6' },
  best_value: { label: 'Best value', color: '#F59E0B' },
}

export default function ProviderCard({ estimate, onClick, co2g, dealPct, route, rank }) {
  const [booked, setBooked] = useState(false)

  const handleBook = (e) => {
    e.stopPropagation()
    setBooked(true)
    setTimeout(() => setBooked(false), 3000)
    openRideApp(estimate.provider, estimate.category, route)
  }

  return (
    <div onClick={onClick}
      className="card group mb-3 cursor-pointer p-4 transition-all duration-300 hover:-translate-y-0.5"      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '' }}>
      <div className="flex items-center gap-3">
        {rank != null && (
          <span className="w-5 text-[12px] font-bold t-secondary tabular-nums text-center shrink-0">{rank}</span>
        )}
        <ProviderIcon provider={estimate.provider} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-[15px] t-primary leading-tight">{estimate.category_display}</p>
            {estimate.badges?.map(b => {
              const meta = BADGE[b] || BADGE.best_value
              return (
                <span key={b} className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md"
                  style={{ color: meta.color, background: `${meta.color}1A` }}>
                  {meta.label}
                </span>
              )
            })}
          </div>
          <div className="flex items-center gap-x-3 gap-y-1 mt-1 flex-wrap text-[12px] t-secondary">
            <span>{estimate.provider_display_name}</span>
            <span className="flex items-center gap-1"><Clock size={11} /> {estimate.eta_minutes} min</span>
            {estimate.is_surging && (
              <span className="flex items-center gap-1" style={{ color: '#F43F5E' }}>
                <TrendingUp size={11} /> {estimate.surge_multiplier}x surge
              </span>
            )}
            {co2g != null && (
              <span className="flex items-center gap-1" style={{ color: '#10B981' }}>
                <Leaf size={11} /> {co2g < 1000 ? `${co2g}g` : `${(co2g / 1000).toFixed(1)}kg`} CO₂
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="font-bold text-[17px] t-primary tabular-nums" style={{ letterSpacing: '-0.02em' }}>
            {estimate.fare_display}
          </p>
          {dealPct >= 25 && (
            <p className="text-[11px] font-semibold" style={{ color: '#10B981' }}>{dealPct}% less</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgb(var(--c-border) / .7)' }}>
        <button onClick={handleBook}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-semibold transition-all active:scale-[.98]"
          style={{
            background: booked ? 'rgba(16,185,129,.12)' : 'rgb(var(--primary-rgb) / .1)',
            color: booked ? '#10B981' : 'var(--primary)',
          }}>
          {booked
            ? <><Check size={14} /> Opening {estimate.provider_display_name}…</>
            : <>Book on {estimate.provider_display_name} <ExternalLink size={13} /></>}
        </button>
        <span className="w-9 h-9 rounded-xl flex items-center justify-center t-secondary transition-transform group-hover:translate-x-0.5"
          style={{ background: 'var(--tint)' }} aria-hidden>
          <ChevronRight size={16} />
        </span>
      </div>
    </div>
  )
}
