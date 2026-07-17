import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Share2, Bell, BellOff, Zap, RefreshCw, X, Search } from 'lucide-react'
import RouteSelector from '../components/RouteSelector'
import { ridesApi } from '../api/rides'
import ProviderCard from '../components/ProviderCard'
import ShareSheet from '../components/ShareSheet'
import { PageSpinner } from '../components/Spinner'
import useRipple from '../hooks/useRipple'
import PriceDropToast from '../components/PriceDropToast'
import SurgeRadar from '../components/SurgeRadar'
import PriceHeatmap from '../components/PriceHeatmap'

const SORT_OPTIONS = [
  { value: 'cheapest', label: '💸 Cheapest' },
  { value: 'fastest',  label: '⚡ Fastest'  },
]

// CO₂ g/km by vehicle type (rough estimates)
const CO2_BY_CATEGORY = {
  bike: 65, bike_taxi: 65,
  auto: 85, UberAuto: 85,
  mini: 115, UberGo: 115, cab_economy: 115, economy: 115,
  UberX: 135, prime_sedan: 135, comfort: 135,
  UberXL: 175, prime_suv: 175,
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const d2r = Math.PI / 180
  const dlat = (lat2 - lat1) * d2r
  const dlon = (lon2 - lon1) * d2r
  const a = Math.sin(dlat / 2) ** 2
    + Math.cos(lat1 * d2r) * Math.cos(lat2 * d2r) * Math.sin(dlon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

// Rule-based fare prediction from current time
function useFarePrediction() {
  const h = new Date().getHours()
  const day = new Date().getDay()
  const isPeak     = (h >= 8 && h <= 10) || (h >= 17 && h <= 20)
  const isWeekend  = day === 0 || day === 6
  const isLateNight = h >= 23 || h < 5

  if (isLateNight)          return { level: 'high',  icon: '🌙', msg: 'Late-night fares are higher',      tip: 'Consider leaving earlier or booking in advance' }
  if (isPeak && !isWeekend) return { level: 'surge', icon: '🔥', msg: 'Peak hour — expect surge pricing', tip: 'Wait 20–30 mins for prices to drop' }
  if (isWeekend && h >= 10 && h <= 20) return { level: 'mid', icon: '📅', msg: 'Weekend — moderate demand', tip: 'Prices are average; no major surge expected' }
  return                               { level: 'low',  icon: '✅', msg: 'Good time to book!',              tip: 'Prices are typically lower right now' }
}

// Live-pulse skeleton — breathes while fares are loading
function PulseCard({ index }) {
  return (
    <div className="card mb-3" style={{
      animation: `fare-breathe 1.8s ${index * 0.18}s ease-in-out infinite`,
    }}>
      <div className="flex gap-3">
        <div className="skeleton w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-3 w-1/3" />
        </div>
        <div className="space-y-1 flex flex-col items-end">
          <div style={{
            width: 60, height: 22, borderRadius: 8,
            background: 'linear-gradient(90deg,rgba(0,113,227,0.12),rgba(0,113,227,0.22),rgba(0,113,227,0.12))',
            backgroundSize: '200% 100%',
            animation: 'fare-shimmer 1.4s ease-in-out infinite',
          }} />
          <div className="skeleton h-3 w-10" />
        </div>
      </div>
      <div className="skeleton h-9 rounded-xl mt-3" />
      <style>{`
        @keyframes fare-breathe {
          0%,100% { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
          50%      { box-shadow: 0 4px 20px rgba(0,113,227,0.12); }
        }
        @keyframes fare-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

export default function ComparePage() {
  const location = useLocation()
  const navigate  = useNavigate()
  const route     = location.state?.route

  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [sort, setSort]           = useState('cheapest')
  const [showShare, setShare]         = useState(false)
  const [reminded, setReminded]       = useState(false)
  const [countdown, setCountdown]     = useState(60)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [dropToast, setDropToast]     = useState(null) // { provider, oldFare, newFare }
  const prevFaresRef                  = useRef({})     // provider → fare_min
  const countdownRef = useRef(60)

  const prediction = useFarePrediction()
  const ripple     = useRipple()
  const fetchRides = (isRefresh = false) => {
    if (!activeRoute) return
    setLoading(true); setError('')
    ridesApi.compare(activeRoute)
      .then(d => {
        setData(d); setLastRefresh(new Date())
        if (isRefresh) {
          // detect price drops since last fetch
          d.results.forEach(r => {
            const prev = prevFaresRef.current[r.provider]
            if (prev && r.fare_min < prev * 0.92) {
              setDropToast({ provider: r.provider_display_name, oldFare: prev, newFare: r.fare_min })
            }
          })
        }
        const map = {}
        d.results.forEach(r => { map[r.provider] = r.fare_min })
        prevFaresRef.current = map
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to fetch rides'))
      .finally(() => setLoading(false))
  }

  const [activeRoute, setActiveRoute] = useState(route || null)

  useEffect(() => {
    if (!activeRoute) return
    fetchRides()
  }, [activeRoute])

  // Auto-refresh every 60 s
  useEffect(() => {
    if (!data) return
    countdownRef.current = 60
    setCountdown(60)
    const timer = setInterval(() => {
      countdownRef.current -= 1
      setCountdown(countdownRef.current)
      if (countdownRef.current <= 0) {
        countdownRef.current = 60
        setCountdown(60)
        fetchRides(true)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [!!data])

  const sorted = data
    ? [...data.results].sort((a, b) =>
        sort === 'fastest' ? a.eta_minutes - b.eta_minutes : a.fare_min - b.fare_min
      )
    : []


  // Offer detection: no surge + savings >= 20% vs most expensive = special deal
  const offerAlert = (() => {
    if (sorted.length < 2) return null
    const cheapest = sorted[0]
    const priciest = sorted[sorted.length - 1]
    const savingPct = Math.round((1 - cheapest.fare_min / priciest.fare_min) * 100)
    const noSurge = sorted.every(r => !r.is_surging)
    if (noSurge && savingPct >= 20)
      return { icon: '🎉', msg: `Great time to book! Save ${savingPct}% with ${cheapest.provider_display_name} — no surge right now.` }
    if (noSurge)
      return { icon: '✅', msg: `No surge pricing on any provider right now — good time to book!` }
    if (savingPct >= 30)
      return { icon: '💥', msg: `${cheapest.provider_display_name} is ${savingPct}% cheaper than the most expensive option!` }
    return null
  })()

  // Deal detector: % cheaper vs most expensive in list
  const maxFare = sorted.length ? Math.max(...sorted.map(r => r.fare_min)) : 0
  const dealPct = (fareMin) => maxFare > 0 ? Math.round((1 - fareMin / maxFare) * 100) : 0

  // CO₂ per result
  const distKm = route?.pickupLat && route?.destinationLat
    ? haversineKm(route.pickupLat, route.pickupLng, route.destinationLat, route.destinationLng)
    : null
  const co2ForCategory = (category) => {
    if (!distKm) return null
    const gPerKm = CO2_BY_CATEGORY[category] || 130
    return Math.round(distKm * gPerKm)
  }

  const scheduleReminder = () => {
    if (!('Notification' in window)) { alert('Notifications not supported on this browser'); return }
    Notification.requestPermission().then(perm => {
      if (perm !== 'granted') { alert('Please allow notifications to set reminders'); return }
      setTimeout(() => {
        new Notification('🚕 RideCompare Reminder', {
          body: `Time to book your ride to ${route?.destinationAddress}!`,
          icon: '/icon.svg',
        })
      }, 20 * 60 * 1000)
      setReminded(true)
    })
  }

  const manualRefresh = () => {
    countdownRef.current = 60
    setCountdown(60)
    fetchRides()
  }

  // Show search form when navigated directly (no route in state)
  if (!activeRoute) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="sticky top-0 bg-bg/95 backdrop-blur border-b border-border z-20 px-4 py-3 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-surface">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-semibold flex-1">Compare Rides</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
               style={{ background: 'rgba(0,113,227,0.1)' }}>
            <Search size={26} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Find the best fare</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Enter your pickup and destination to compare all providers</p>
          <div className="w-full max-w-md card">
            <RouteSelector onSearch={r => { setActiveRoute(r); setLoading(true) }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-bg/95 backdrop-blur border-b border-border z-20 px-4 py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-surface">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold flex-1">Compare Rides</h1>

        {/* Auto-refresh countdown */}
        {data && !loading && (
          <span className="text-xs text-muted flex items-center gap-1">
            <RefreshCw size={11} className={countdown <= 5 ? 'animate-spin' : ''} />
            {countdown}s
          </span>
        )}

        {data && (
          <>
            <button onClick={(e) => { ripple(e); setShare(true) }}
              className="ripple-btn p-1.5 rounded-lg hover:bg-surface text-muted hover:text-white transition-all hover:scale-110 active:scale-95" title="Share results">
              <Share2 size={18} />
            </button>
            <button
              onClick={reminded ? undefined : (e) => { ripple(e); scheduleReminder() }}
              className={`ripple-btn p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 ${reminded ? 'text-cheapest' : 'text-muted hover:text-white hover:bg-surface'}`}
              title={reminded ? 'Reminder set for 20 min' : 'Set reminder in 20 min'}
            >
              {reminded ? <Bell size={18} className="text-cheapest" /> : <BellOff size={18} />}
            </button>
            <button onClick={(e) => { ripple(e); manualRefresh() }}
              className="ripple-btn p-1.5 rounded-lg hover:bg-surface text-muted hover:text-white transition-all hover:scale-110 active:scale-95" title="Refresh fares">
              <RotateCcw size={18} />
            </button>
          </>
        )}
      </div>

      <div className="flex-1 p-4">
        {/* Prediction banner */}
        <div className={`mb-4 rounded-xl px-4 py-3 flex items-start gap-3 border text-sm ${
          prediction.level === 'surge' ? 'bg-surge/10 border-surge/20 text-surge'
          : prediction.level === 'high' ? 'bg-warning/10 border-warning/20 text-warning'
          : prediction.level === 'low'  ? 'bg-cheapest/10 border-cheapest/20 text-cheapest'
          : 'bg-surface border-border text-muted'
        }`}>
          <span className="text-xl shrink-0">{prediction.icon}</span>
          <div>
            <p className="font-semibold">{prediction.msg}</p>
            <p className="text-xs opacity-80 mt-0.5">{prediction.tip}</p>
          </div>
        </div>

        {/* Reminder badge */}
        {reminded && (
          <div className="mb-4 rounded-xl px-4 py-2.5 bg-cheapest/10 border border-cheapest/20 flex items-center gap-2 text-sm text-cheapest">
            <Bell size={14} />
            <span>Reminder set — we'll notify you in 20 minutes!</span>
          </div>
        )}

        {/* Last refreshed */}
        {lastRefresh && (
          <p className="text-xs text-muted mb-3 text-right">
            Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            {' · '}auto-refresh in {countdown}s
          </p>
        )}

        {/* Route summary */}
        {route && (
          <div className="card mb-4">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
              <p className="text-sm truncate">{route.pickupAddress}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-surge shrink-0" />
              <p className="text-sm truncate">{route.destinationAddress}</p>
            </div>
            {data && (
              <div className="flex gap-4 mt-3 pt-3 border-t border-border text-xs text-muted">
                <span>🚗 {data.available_providers} providers</span>
                <span>📋 {data.results.length} options</span>
                {distKm && <span>📍 ~{distKm.toFixed(1)} km</span>}
              </div>
            )}
          </div>
        )}

        {/* Sort chips */}
        {!loading && !error && (
          <div className="flex gap-2 mb-4">
            {SORT_OPTIONS.map(o => (
              <button key={o.value}
                onClick={(e) => { ripple(e); setSort(o.value) }}
                className={`ripple-btn px-4 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                  sort === o.value
                    ? 'bg-primary text-white border-primary shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                    : 'bg-surface text-muted border-border hover:border-primary/40 hover:text-primary'
                }`}
                style={{ transform: sort === o.value ? 'scale(1.05)' : 'scale(1)', transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {/* Surge radar */}
        {!loading && sorted.some(r => r.is_surging) && (
          <SurgeRadar providerName={sorted.filter(r => r.is_surging).map(r => r.provider_display_name).join(', ')} />
        )}

        {/* Price heatmap toggle */}
        {!loading && sorted.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <button
              onClick={() => setShowHeatmap(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: showHeatmap ? 'rgba(0,113,227,0.08)' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${showHeatmap ? 'rgba(0,113,227,0.25)' : 'rgba(0,0,0,0.08)'}`,
                borderRadius: 980, padding: '6px 14px',
                fontSize: 12, fontWeight: 600,
                color: showHeatmap ? '#0071E3' : '#6E6E73',
                cursor: 'pointer',
              }}
            >
              📊 {showHeatmap ? 'Hide heatmap' : 'Best time to ride'}
            </button>
            {showHeatmap && (
              <div style={{
                marginTop: 10, padding: 14,
                background: '#fff', borderRadius: 18,
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}>
                <PriceHeatmap basefare={sorted[0]?.fare_min || 180} />
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <>{[1, 2, 3, 4].map(i => <PulseCard key={i} index={i} />)}</>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">😕</p>
            <p className="font-semibold mb-2">Something went wrong</p>
            <p className="text-muted text-sm mb-6">{error}</p>
            <button onClick={() => navigate(-1)} className="btn-primary max-w-xs mx-auto">Go Back</button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-semibold">No rides available</p>
            <p className="text-muted text-sm mt-2">No providers serving this route right now</p>
          </div>
        ) : (
          <div className="stagger">
            {sorted.map(e => (
              <ProviderCard
                key={`${e.provider}-${e.category}`}
                estimate={e}
                route={route}
                onClick={() => navigate('/provider-detail', { state: { estimate: e } })}
                co2g={co2ForCategory(e.category)}
                dealPct={dealPct(e.fare_min)}
              />
            ))}
          </div>
        )}

        {/* Savings summary at bottom */}
        {sorted.length >= 2 && !loading && (
          <div className="card mt-2 bg-cheapest/5 border-cheapest/20 flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <p className="text-xs text-muted flex-1">
              Pick <span className="font-semibold text-cheapest">{sorted[0]?.provider_display_name}</span> to save{' '}
              <span className="font-semibold text-cheapest">
                ₹{Math.round(sorted[sorted.length - 1]?.fare_min - sorted[0]?.fare_min)}
              </span>{' '}
              vs most expensive option
            </p>
          </div>
        )}

        {/* Offer alert banner */}
        {offerAlert && !waBannerDismissed && (
          <div className="mt-3 rounded-2xl px-4 py-3 flex items-start gap-3 border"
               style={{ background: 'rgba(37,211,102,0.08)', borderColor: 'rgba(37,211,102,0.25)' }}>
            <span className="text-xl shrink-0">{offerAlert.icon}</span>
            <p className="text-xs text-green-400 flex-1 leading-relaxed">{offerAlert.msg}</p>
            <button onClick={() => setWaBannerDismissed(true)} className="text-muted shrink-0">
              <X size={14} />
            </button>
          </div>
        )}

      </div>

      {showShare && (
        <ShareSheet route={route} results={sorted} onClose={() => setShare(false)} />
      )}

      {dropToast && (
        <PriceDropToast
          provider={dropToast.provider}
          oldFare={dropToast.oldFare}
          newFare={dropToast.newFare}
          onDismiss={() => setDropToast(null)}
          onBook={() => setDropToast(null)}
        />
      )}
    </div>
  )
}
