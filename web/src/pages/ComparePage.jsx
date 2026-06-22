import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Share2, Bell, BellOff, Zap, RefreshCw, MessageCircle, X } from 'lucide-react'
import { ridesApi } from '../api/rides'
import ProviderCard from '../components/ProviderCard'
import ShareSheet from '../components/ShareSheet'
import { PageSpinner } from '../components/Spinner'
import useRipple from '../hooks/useRipple'
import { useWhatsApp } from '../hooks/useWhatsApp'
import { notifyApi } from '../api/notify'

function buildWhatsAppMessage(route, sorted) {
  const cheapest  = sorted[0]
  const bestValue = sorted.find(r => r.badges?.includes('best_value')) || sorted[Math.floor(sorted.length / 2)]
  return [
    '🚕 *RideCompare Update*',
    `📍 ${route?.pickupAddress || 'Pickup'} → ${route?.destinationAddress || 'Destination'}`,
    '',
    cheapest  ? `💸 *Cheapest:* ${cheapest.provider_display_name} — *${cheapest.fare_display}* (${cheapest.eta_minutes} min ETA)` : '',
    bestValue && bestValue !== cheapest
      ? `⭐ *Best Value:* ${bestValue.provider_display_name} — *${bestValue.fare_display}* (${bestValue.eta_minutes} min ETA)`
      : '',
    '',
    '*All options:*',
    ...sorted.map((r, i) => `  ${i + 1}. ${r.provider_display_name}: ${r.fare_display} (${r.eta_minutes} min)`),
    '',
    `🔁 Auto-refreshed • ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
    '_via RideCompare_',
  ].filter(Boolean).join('\n')
}

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

function SkeletonCard() {
  return (
    <div className="card mb-3">
      <div className="flex gap-3">
        <div className="skeleton w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-3 w-1/3" />
        </div>
        <div className="space-y-1">
          <div className="skeleton h-5 w-16" />
          <div className="skeleton h-3 w-10" />
        </div>
      </div>
      <div className="skeleton h-9 rounded-xl mt-3" />
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
  const [showShare, setShare]     = useState(false)
  const [reminded, setReminded]   = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [lastRefresh, setLastRefresh] = useState(null)
  const countdownRef = useRef(60)

  const prediction = useFarePrediction()
  const ripple     = useRipple()
  const { phone, autoNotify, openWhatsApp } = useWhatsApp()
  const [waBannerDismissed, setWaBannerDismissed] = useState(false)
  const [waSending, setWaSending]   = useState(false)
  const [waSentMsg, setWaSentMsg]   = useState('')

  const sendViaBackend = async (resultsArr) => {
    setWaSending(true); setWaSentMsg('')
    try {
      await notifyApi.sendRideUpdate(
        route?.pickupAddress || '',
        route?.destinationAddress || '',
        resultsArr,
        route,
      )
      setWaSentMsg('✅ Sent to your WhatsApp!')
    } catch (e) {
      const err = e.response?.data?.detail || 'Send failed'
      // fall back to deep-link if backend fails
      openWhatsApp(buildWhatsAppMessage(route, resultsArr))
      setWaSentMsg(`⚠️ ${err} — opened WhatsApp instead`)
    } finally {
      setWaSending(false)
      setTimeout(() => setWaSentMsg(''), 4000)
    }
  }

  const fetchRides = () => {
    setLoading(true); setError('')
    ridesApi.compare(route)
      .then(d => { setData(d); setLastRefresh(new Date()) })
      .catch(err => setError(err.response?.data?.detail || 'Failed to fetch rides'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!route) { navigate('/home'); return }
    fetchRides()
  }, [])

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
        fetchRides()
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [!!data])

  const sorted = data
    ? [...data.results].sort((a, b) =>
        sort === 'fastest' ? a.eta_minutes - b.eta_minutes : a.fare_min - b.fare_min
      )
    : []

  // Auto-send WhatsApp when results first load and auto-notify is on
  const autoSentRef = useRef(false)
  useEffect(() => {
    if (!data || !phone || !autoNotify || autoSentRef.current || sorted.length === 0) return
    autoSentRef.current = true
    sendViaBackend(sorted)
  }, [data, phone, autoNotify])

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

        {/* Results */}
        {loading ? (
          <>{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</>
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

        {/* WhatsApp send button */}
        {sorted.length > 0 && !loading && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={(e) => { ripple(e); phone ? sendViaBackend(sorted) : openWhatsApp(buildWhatsAppMessage(route, sorted)) }}
                disabled={waSending}
                className="ripple-btn flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, rgba(37,211,102,0.15) 0%, rgba(18,140,67,0.08) 100%)',
                  borderColor: 'rgba(37,211,102,0.4)',
                  color: '#25D366',
                }}
                onMouseEnter={e => { if (!waSending) { e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,211,102,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {waSending
                  ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 60" /></svg> Sending…</>
                  : <><MessageCircle size={17} /> {phone ? 'Send to my WhatsApp' : 'Share on WhatsApp'}</>
                }
              </button>
              {/* Always-available deep-link fallback */}
              <button
                onClick={(e) => { ripple(e); openWhatsApp(buildWhatsAppMessage(route, sorted)) }}
                className="ripple-btn px-3.5 rounded-2xl border text-sm transition-all active:scale-95"
                style={{ borderColor: 'rgba(37,211,102,0.3)', color: '#25D366', background: 'rgba(37,211,102,0.06)' }}
                title="Open in WhatsApp"
              >
                <Share2 size={16} />
              </button>
            </div>

            {/* Status message */}
            {waSentMsg && (
              <p className="text-center text-xs font-medium" style={{ color: waSentMsg.startsWith('✅') ? '#25D366' : '#F59E0B' }}>
                {waSentMsg}
              </p>
            )}

            {/* Nudge to save number */}
            {!phone && (
              <p className="text-center text-xs text-muted">
                💡 <button onClick={() => navigate('/profile')} className="text-green-400 underline underline-offset-2">Add your number in Profile</button> to receive messages directly on WhatsApp
              </p>
            )}
          </div>
        )}
      </div>

      {showShare && (
        <ShareSheet route={route} results={sorted} onClose={() => setShare(false)} />
      )}
    </div>
  )
}
