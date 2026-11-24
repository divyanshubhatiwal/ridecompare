import { useState, useEffect, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Share2, Bell, BellOff, X, Search, Clock, TrendingDown, Sparkles, Route as RouteIcon, ExternalLink, BarChart3, MessageCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { notifyApi } from '../api/notify'
import { useWhatsAppAuto, apiError } from '../hooks/useWhatsAppUpdates'
import RouteSelector from '../components/RouteSelector'
import { ridesApi } from '../api/rides'
import ProviderCard from '../components/ProviderCard'
import ProviderIcon from '../components/ProviderIcon'
import ShareSheet from '../components/ShareSheet'
import PriceDropToast from '../components/PriceDropToast'
import SurgeRadar from '../components/SurgeRadar'
import PriceHeatmap from '../components/PriceHeatmap'
import FareSpectrum from '../components/FareSpectrum'
import AnimatedCounter from '../components/AnimatedCounter'
import { openRideApp } from '../utils/openRideApp'

const REFRESH_SECS = 60

const SORTS = [
  { value: 'cheapest', label: 'Cheapest' },
  { value: 'fastest',  label: 'Fastest'  },
  { value: 'value',    label: 'Best value' },
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

function farePrediction() {
  const h = new Date().getHours()
  const day = new Date().getDay()
  const isPeak      = (h >= 8 && h <= 10) || (h >= 17 && h <= 20)
  const isWeekend   = day === 0 || day === 6
  const isLateNight = h >= 23 || h < 5

  if (isLateNight)          return { tone: '#F59E0B', msg: 'Late-night fares run higher', tip: 'Booking a little earlier usually helps' }
  if (isPeak && !isWeekend) return { tone: '#F43F5E', msg: 'Peak hour — surge likely',   tip: 'Waiting 20–30 min often brings prices down' }
  if (isWeekend && h >= 10 && h <= 20) return { tone: '#8E8E93', msg: 'Weekend — moderate demand', tip: 'No major surge expected' }
  return                               { tone: '#10B981', msg: 'Good time to book',          tip: 'Prices are typically lower right now' }
}

const keyOf = r => `${r.provider}-${r.category}`

function CountdownRing({ value, total }) {
  const r = 9, c = 2 * Math.PI * r
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90">
      <circle cx="12" cy="12" r={r} fill="none" stroke="var(--tint)" strokeWidth="2.5" />
      <circle cx="12" cy="12" r={r} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / total)}
        style={{ transition: 'stroke-dashoffset 1s linear' }} />
    </svg>
  )
}

function IconButton({ onClick, title, active, children }) {
  return (
    <button onClick={onClick} title={title} aria-label={title}
      className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      style={{ background: active ? 'rgb(var(--primary-rgb) / .12)' : 'var(--tint)', color: active ? 'var(--primary)' : 'var(--text-primary)' }}>
      {children}
    </button>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      <div className="skeleton h-40 rounded-3xl" />
      <div className="skeleton h-10 rounded-2xl" />
      {[0, 1, 2].map(i => (
        <div key={i} className="card flex gap-3" style={{ animation: `fade-in .4s ${i * 0.1}s both` }}>
          <div className="skeleton w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2 py-1">
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-3 w-1/3" />
          </div>
          <div className="skeleton h-6 w-14" />
        </div>
      ))}
      <p className="text-center text-[12px] t-secondary pt-2">
        Fetching live fares… first search can take up to a minute while the server wakes up.
      </p>
    </div>
  )
}

function RouteHero({ route, distKm, optionCount, providerCount }) {
  return (
    <div className="mesh rounded-3xl p-5 mb-4" style={{ background: 'var(--hero-bg)' }}>
      <div className="mesh-layer" />
      <div className="flex gap-4">
        <svg width="16" height="72" viewBox="0 0 16 72" className="shrink-0 mt-1" aria-hidden>
          <circle cx="8" cy="6" r="5" fill="var(--primary)" />
          <line x1="8" y1="14" x2="8" y2="58" stroke="var(--text-secondary)" strokeWidth="2"
            strokeDasharray="4 4" style={{ animation: 'dash-flow 1.2s linear infinite' }} />
          <rect x="3" y="61" width="10" height="10" rx="2.5" fill="#F43F5E" />
        </svg>
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-5">
          <div>
            <p className="text-[11px] uppercase tracking-[.08em] t-secondary font-semibold">Pickup</p>
            <p className="text-[15px] font-semibold t-primary truncate">{route.pickupAddress}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[.08em] t-secondary font-semibold">Drop</p>
            <p className="text-[15px] font-semibold t-primary truncate">{route.destinationAddress}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-5">
        {distKm != null && (
          <span className="chip"><RouteIcon size={12} /> ~{distKm.toFixed(1)} km</span>
        )}
        {optionCount > 0 && <span className="chip">{optionCount} options</span>}
        {providerCount > 0 && <span className="chip">{providerCount} providers</span>}
      </div>
    </div>
  )
}

function BestPick({ pick, sort, savings, route }) {
  if (!pick) return null
  const label = sort === 'fastest' ? 'Fastest pickup' : sort === 'value' ? 'Best value' : 'Lowest fare'
  return (
    <div className="gradient-ring p-5 mb-4 fade-up" style={{ boxShadow: '0 20px 50px -20px rgb(var(--primary-rgb) / .45)' }}>
      <div className="flex items-center gap-1.5 mb-4">
        <Sparkles size={14} style={{ color: 'var(--primary)' }} />
        <span className="text-[12px] font-bold uppercase tracking-[.08em]" style={{ color: 'var(--primary)' }}>{label}</span>
      </div>
      <div className="flex items-center gap-4">
        <ProviderIcon provider={pick.provider} />
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-bold t-primary truncate">{pick.category_display}</p>
          <p className="text-[13px] t-secondary flex items-center gap-1.5">
            {pick.provider_display_name}
            <span aria-hidden>·</span>
            <Clock size={12} /> {pick.eta_minutes} min away
          </p>
        </div>
        <div className="text-right">
          <p className="font-extrabold t-primary tabular-nums" style={{ fontSize: 28, letterSpacing: '-0.04em', lineHeight: 1 }}>
            <AnimatedCounter value={Math.round(pick.fare_min)} prefix="₹" duration={700} />
          </p>
          {pick.fare_max > pick.fare_min && (
            <p className="text-[11px] t-secondary mt-1">up to ₹{Math.round(pick.fare_max)}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-5">
        {savings > 0 && (
          <div className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl"
            style={{ background: 'rgba(16,185,129,.1)', color: '#10B981' }}>
            <TrendingDown size={14} /> Save ₹{savings}
          </div>
        )}
        <button onClick={() => openRideApp(pick.provider, pick.category, route)}
          className="btn-primary flex-1" style={{ padding: '11px 18px' }}>
          Book on {pick.provider_display_name} <ExternalLink size={14} />
        </button>
      </div>
    </div>
  )
}

export default function ComparePage() {
  const location = useLocation()
  const navigate = useNavigate()

  const [activeRoute, setActiveRoute] = useState(location.state?.route || null)
  const [data, setData]               = useState(null)
  const [loading, setLoading]         = useState(!!activeRoute)
  const [error, setError]             = useState('')
  const [sort, setSort]               = useState('cheapest')
  const [providerFilter, setFilter]   = useState('all')
  const [showShare, setShare]         = useState(false)
  const [reminded, setReminded]       = useState(false)
  const [countdown, setCountdown]     = useState(REFRESH_SECS)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [dropToast, setDropToast]     = useState(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [focusKey, setFocusKey]       = useState(null)
  const prevFaresRef = useRef({})
  const cardRefs     = useRef({})
  const { user }     = useAuth()
  const [waAuto]     = useWhatsAppAuto()
  const [waStatus, setWaStatus] = useState(null) // { state: 'sending'|'sent'|'error', msg }

  const sendToWhatsApp = (d) => {
    if (!user?.phone_number || !d?.results?.length || !activeRoute) return
    setWaStatus({ state: 'sending' })
    const top = [...d.results].sort((a, b) => a.fare_min - b.fare_min).slice(0, 6)
    notifyApi.sendRideUpdate(activeRoute.pickupAddress, activeRoute.destinationAddress, top, activeRoute)
      .then(() => setWaStatus({ state: 'sent' }))
      .catch(err => setWaStatus({ state: 'error', msg: apiError(err, 'WhatsApp update failed') }))
  }

  const prediction = farePrediction()

  const fetchRides = (isRefresh = false) => {
    if (!activeRoute) return
    if (!isRefresh) setLoading(true)
    setError('')
    ridesApi.compare(activeRoute)
      .then(d => {
        setData(d)
        if (isRefresh) {
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
        if (!isRefresh && waAuto) sendToWhatsApp(d)
      })
      .catch(err => setError(err.response?.data?.detail || 'Could not fetch fares. Please try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (activeRoute) fetchRides() }, [activeRoute])

  useEffect(() => {
    if (!data) return
    setCountdown(REFRESH_SECS)
    const timer = setInterval(() => setCountdown(c => (c <= 1 ? 0 : c - 1)), 1000)
    return () => clearInterval(timer)
  }, [!!data])

  useEffect(() => {
    if (countdown !== 0) return
    setCountdown(REFRESH_SECS)
    fetchRides(true)
  }, [countdown])

  const results = data?.results || []
  const providers = useMemo(() => {
    const seen = new Map()
    results.forEach(r => seen.set(r.provider, r.provider_display_name))
    return [...seen.entries()]
  }, [results])

  const sorted = useMemo(() => {
    const list = providerFilter === 'all' ? results : results.filter(r => r.provider === providerFilter)
    if (!list.length) return []
    const fares = list.map(r => r.fare_min), etas = list.map(r => r.eta_minutes)
    const [fMin, fMax, eMin, eMax] = [Math.min(...fares), Math.max(...fares), Math.min(...etas), Math.max(...etas)]
    const norm = (v, lo, hi) => (hi === lo ? 0 : (v - lo) / (hi - lo))
    const score = r => norm(r.fare_min, fMin, fMax) * 0.65 + norm(r.eta_minutes, eMin, eMax) * 0.35
    return [...list].sort((a, b) =>
      sort === 'fastest' ? a.eta_minutes - b.eta_minutes || a.fare_min - b.fare_min
      : sort === 'value'  ? score(a) - score(b)
      : a.fare_min - b.fare_min
    )
  }, [results, sort, providerFilter])

  const maxFare  = sorted.length ? Math.max(...sorted.map(r => r.fare_min)) : 0
  const dealPct  = fareMin => (maxFare > 0 ? Math.round((1 - fareMin / maxFare) * 100) : 0)
  const pick     = sorted[0]
  const savings  = pick ? Math.round(maxFare - pick.fare_min) : 0

  const distKm = data?.distance_km
    ?? (activeRoute?.pickupLat && activeRoute?.destinationLat
      ? haversineKm(activeRoute.pickupLat, activeRoute.pickupLng, activeRoute.destinationLat, activeRoute.destinationLng)
      : null)
  const co2ForCategory = category => (distKm ? Math.round(distKm * (CO2_BY_CATEGORY[category] || 130)) : null)

  const offerMsg = (() => {
    if (sorted.length < 2) return null
    const pct = Math.round((1 - sorted[0].fare_min / maxFare) * 100)
    const noSurge = sorted.every(r => !r.is_surging)
    if (noSurge && pct >= 20) return `No surge anywhere right now — ${sorted[0].provider_display_name} saves you ${pct}%.`
    if (noSurge) return 'No surge pricing on any provider right now.'
    return null
  })()

  const scheduleReminder = () => {
    if (!('Notification' in window)) { alert('Notifications are not supported on this browser'); return }
    Notification.requestPermission().then(perm => {
      if (perm !== 'granted') { alert('Please allow notifications to set reminders'); return }
      setTimeout(() => {
        new Notification('RideCompare reminder', {
          body: `Time to book your ride to ${activeRoute?.destinationAddress}!`,
          icon: '/icon.svg',
        })
      }, 20 * 60 * 1000)
      setReminded(true)
    })
  }

  const focusResult = key => {
    setFocusKey(key)
    cardRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const sortIdx = SORTS.findIndex(s => s.value === sort)

  if (!activeRoute) {
    return (
      <div className="mesh min-h-screen flex flex-col page-enter" style={{ background: 'var(--hero-bg)' }}>
        <div className="mesh-layer" />
        <div className="px-4 py-3 flex items-center gap-2">
          <IconButton onClick={() => navigate(-1)} title="Back"><ArrowLeft size={18} /></IconButton>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-5 pb-16">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 glass">
            <Search size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 className="font-bold t-primary text-center" style={{ fontSize: 'clamp(1.6rem,5vw,2.2rem)', letterSpacing: '-0.035em' }}>
            Find the best fare
          </h1>
          <p className="text-[15px] t-secondary mt-2 mb-8 text-center">Every provider, one search.</p>
          <div className="w-full max-w-md glass rounded-3xl p-5 t-primary">
            <RouteSelector onSearch={r => setActiveRoute(r)} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg page-enter">
      {/* Header */}
      <header className="sticky top-0 z-30 glass" style={{ borderRadius: 0, borderInline: 0, borderTop: 0, boxShadow: 'none' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2">
          <IconButton onClick={() => navigate(-1)} title="Back"><ArrowLeft size={18} /></IconButton>
          <div className="flex-1 min-w-0 px-1">
            <p className="text-[15px] font-semibold t-primary leading-tight">Compare rides</p>
            {data && !loading && (
              <p className="text-[11px] t-secondary flex items-center gap-1.5">
                <span className="live-dot" style={{ width: 6, height: 6 }} /> Live · refreshes in {countdown}s
              </p>
            )}
          </div>
          {data && (
            <>
              <button onClick={() => { setCountdown(REFRESH_SECS); fetchRides() }} title="Refresh fares" aria-label="Refresh fares"
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:scale-105 transition-transform">
                <CountdownRing value={countdown} total={REFRESH_SECS} />
                <RotateCcw size={11} className="absolute t-primary" />
              </button>
              <IconButton onClick={reminded ? undefined : scheduleReminder} active={reminded}
                title={reminded ? 'Reminder set for 20 min' : 'Remind me in 20 min'}>
                {reminded ? <Bell size={16} /> : <BellOff size={16} />}
              </IconButton>
              {user?.phone_number && (
                <IconButton onClick={() => sendToWhatsApp(data)} title="Send to my WhatsApp" active={waStatus?.state === 'sent'}>
                  <MessageCircle size={16} />
                </IconButton>
              )}
              <IconButton onClick={() => setShare(true)} title="Share results"><Share2 size={16} /></IconButton>
            </>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-16">
        <RouteHero route={activeRoute} distKm={distKm}
          optionCount={results.length} providerCount={data?.available_providers || 0} />

        {/* Timing insight */}
        <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-2xl"
          style={{ background: `${prediction.tone}14`, border: `1px solid ${prediction.tone}33` }}>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: prediction.tone }} />
          <p className="text-[13px] t-primary flex-1">
            <span className="font-semibold">{prediction.msg}.</span>{' '}
            <span className="t-secondary">{prediction.tip}</span>
          </p>
        </div>

        {waStatus && (
          <div className="mb-4 px-4 py-3 rounded-2xl flex items-center gap-2 text-[13px]"
            style={{
              background: waStatus.state === 'error' ? 'rgba(239,68,68,.1)' : 'rgba(37,211,102,.1)',
              color: waStatus.state === 'error' ? '#EF4444' : '#1DA851',
            }}>
            <MessageCircle size={14} className="shrink-0" />
            <span className="flex-1">
              {waStatus.state === 'sending' ? 'Sending fares to your WhatsApp…'
                : waStatus.state === 'sent' ? `Fares sent to WhatsApp (+${user?.phone_number})`
                : `WhatsApp: ${waStatus.msg}`}
            </span>
            {waStatus.state !== 'sending' && (
              <button onClick={() => setWaStatus(null)} aria-label="Dismiss"><X size={14} /></button>
            )}
          </div>
        )}

        {reminded && (
          <div className="mb-4 px-4 py-3 rounded-2xl flex items-center gap-2 text-[13px]"
            style={{ background: 'rgba(16,185,129,.1)', color: '#10B981' }}>
            <Bell size={14} /> Reminder set — we'll notify you in 20 minutes.
          </div>
        )}

        {loading ? (
          <SkeletonList />
        ) : error ? (
          <div className="card text-center py-12 px-6">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(244,63,94,.1)' }}>
              <X size={22} style={{ color: '#F43F5E' }} />
            </div>
            <p className="font-semibold t-primary mb-1">Couldn't load fares</p>
            <p className="t-secondary text-[13px] mb-6">{error}</p>
            <div className="flex gap-2 max-w-xs mx-auto">
              <button onClick={() => navigate(-1)} className="btn-outline">Back</button>
              <button onClick={() => fetchRides()} className="btn-primary">Retry</button>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="card text-center py-12">
            <p className="font-semibold t-primary">No rides available</p>
            <p className="t-secondary text-[13px] mt-1">No providers are serving this route right now.</p>
          </div>
        ) : (
          <>
            <BestPick pick={pick} sort={sort} savings={savings} route={activeRoute} />

            {sorted.some(r => r.is_surging) && (
              <SurgeRadar providerName={[...new Set(sorted.filter(r => r.is_surging).map(r => r.provider_display_name))].join(', ')} />
            )}

            {/* Controls */}
            <div className="segmented mb-3" role="group" aria-label="Sort results">
              <span className="segmented-thumb"
                style={{ width: `calc((100% - 8px) / ${SORTS.length})`, transform: `translateX(${sortIdx * 100}%)` }} />
              {SORTS.map(s => (
                <button key={s.value} aria-pressed={sort === s.value} onClick={() => setSort(s.value)}>{s.label}</button>
              ))}
            </div>

            {providers.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
                <button className="chip" aria-pressed={providerFilter === 'all'} onClick={() => setFilter('all')}>
                  All providers
                </button>
                {providers.map(([id, name]) => (
                  <button key={id} className="chip" aria-pressed={providerFilter === id} onClick={() => setFilter(id)}>
                    {name}
                  </button>
                ))}
              </div>
            )}

            <div className="mb-4">
              <FareSpectrum results={sorted} highlightKey={focusKey || (pick && keyOf(pick))} onSelect={focusResult} />
            </div>

            <div className="flex items-center justify-between mb-3 mt-6">
              <h2 className="text-[15px] font-bold t-primary">All options</h2>
              <button onClick={() => setShowHeatmap(v => !v)} className="chip" aria-pressed={showHeatmap}>
                <BarChart3 size={12} /> {showHeatmap ? 'Hide best times' : 'Best time to ride'}
              </button>
            </div>

            {showHeatmap && (
              <div className="card p-4 mb-4 fade-up">
                <PriceHeatmap basefare={sorted[0]?.fare_min || 180} />
              </div>
            )}

            <div className="stagger">
              {sorted.map((e, i) => {
                const k = keyOf(e)
                return (
                  <div key={k} ref={el => { cardRefs.current[k] = el }}
                    className="rounded-2xl transition-shadow"
                    style={{ boxShadow: focusKey === k ? '0 0 0 2px rgb(var(--primary-rgb) / .5)' : 'none' }}>
                    <ProviderCard
                      rank={i + 1}
                      estimate={e}
                      route={activeRoute}
                      onClick={() => navigate('/provider-detail', { state: { estimate: e } })}
                      co2g={co2ForCategory(e.category)}
                      dealPct={dealPct(e.fare_min)}
                    />
                  </div>
                )
              })}
            </div>

            {offerMsg && !bannerDismissed && (
              <div className="mt-2 px-4 py-3 rounded-2xl flex items-start gap-3"
                style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)' }}>
                <Sparkles size={16} className="shrink-0 mt-0.5" style={{ color: '#10B981' }} />
                <p className="text-[13px] t-primary flex-1">{offerMsg}</p>
                <button onClick={() => setBannerDismissed(true)} className="t-secondary shrink-0" aria-label="Dismiss">
                  <X size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {showShare && <ShareSheet route={activeRoute} results={sorted} onClose={() => setShare(false)} />}

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
