import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Briefcase, PlaneTakeoff, MoreHorizontal, Map, Mic, MicOff, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import RouteSelector from '../components/RouteSelector'
import { ridesApi } from '../api/rides'
import { analyticsApi } from '../api/analytics'
import useRipple from '../hooks/useRipple'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning,'
  if (h < 17) return 'Good afternoon,'
  return 'Good evening,'
}

export default function HomePage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [history, setHistory]     = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [listening, setListening] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const recognitionRef = useRef(null)

  useEffect(() => {
    ridesApi.getHistory(5).then(setHistory).catch(() => {})
    analyticsApi.getSummary().then(setAnalytics).catch(() => {})
  }, [])

  const handleSearch = (route) => navigate('/compare', { state: { route } })
  const ripple = useRipple()

  const firstName = user?.full_name?.split(' ')[0] || 'there'
  const initial   = firstName[0]?.toUpperCase()

  // Voice search
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice search not supported on this browser'); return }
    const r = new SR()
    r.lang = 'en-IN'
    r.interimResults = false
    r.onresult = e => { setVoiceText(e.results[0][0].transcript); setListening(false) }
    r.onerror = () => setListening(false)
    r.onend   = () => setListening(false)
    recognitionRef.current = r
    r.start()
    setListening(true)
  }
  const stopVoice = () => { recognitionRef.current?.stop(); setListening(false) }

  // Quick routes: deduplicate recent history by destination
  const quickRoutes = history
    .filter(h => h.pickup_lat && h.destination_lat)
    .reduce((acc, h) => {
      const key = h.destination_address
      if (!acc.find(r => r.destination_address === key)) acc.push(h)
      return acc
    }, [])
    .slice(0, 3)

  return (
    <div className="p-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div>
          <p className="text-muted text-sm">{greeting()}</p>
          <h1 className="text-xl font-bold mt-0.5">{firstName}</h1>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg"
        >
          {initial}
        </button>
      </div>

      {/* Savings strip */}
      {analytics?.total_savings > 0 && (
        <div className="card savings-strip mb-4 bg-cheapest/5 border-cheapest/20 flex items-center gap-3 py-3">
          <span className="text-2xl">💰</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-cheapest">
              You've saved ₹{analytics.total_savings.toLocaleString('en-IN')} by comparing!
            </p>
            <p className="text-xs text-muted mt-0.5">{analytics.total_searches} rides compared</p>
          </div>
          <button onClick={() => navigate('/analytics')} className="text-xs text-primary font-medium shrink-0">
            See stats →
          </button>
        </div>
      )}

      {/* Search */}
      <RouteSelector onSearch={handleSearch} prefill={voiceText} />

      {/* Voice search */}
      <button
        onClick={listening ? stopVoice : startVoice}
        className={`ripple-btn w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm transition-all active:scale-98 ${
          listening
            ? 'border-surge/40 text-surge bg-surge/10 animate-pulse'
            : 'border-border text-muted hover:border-primary/40 hover:text-primary hover:bg-primary/5'
        }`}
      >
        {listening ? <><MicOff size={15} /> Listening… tap to stop</> : <><Mic size={15} /> Search by voice</>}
      </button>

      {/* Map option */}
      <button
        onClick={(e) => { ripple(e); navigate('/map-route') }}
        className="ripple-btn w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-muted text-sm hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all active:scale-98"
      >
        <Map size={15} /> Select on map instead
      </button>

      {/* Quick Routes (from history with real coords) */}
      {quickRoutes.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">⚡ Quick Compare</h2>
            <span className="text-xs text-muted">Tap to compare instantly</span>
          </div>
          <div className="space-y-2">
            {quickRoutes.map(item => (
              <button
                key={item.id}
                onClick={(e) => { ripple(e); handleSearch({
                  pickupAddress:      item.pickup_address,
                  pickupLat:          item.pickup_lat,
                  pickupLng:          item.pickup_lng,
                  destinationAddress: item.destination_address,
                  destinationLat:     item.destination_lat,
                  destinationLng:     item.destination_lng,
                }) }}
                className="ripple-btn w-full card flex items-center gap-3 py-3 hover:border-primary/40 hover:shadow-[0_4px_16px_rgba(99,102,241,0.12)] transition-all active:scale-[0.99] text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.destination_address}</p>
                  <p className="text-xs text-muted truncate mt-0.5">from {item.pickup_address}</p>
                </div>
                {item.cheapest_fare && (
                  <span className="text-xs font-bold text-cheapest shrink-0">
                    from ₹{Math.round(item.cheapest_fare)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Home,           label: 'Home',    color: 'text-primary bg-primary/10'  },
            { icon: Briefcase,      label: 'Work',    color: 'text-accent bg-accent/10'    },
            { icon: PlaneTakeoff,   label: 'Airport', color: 'text-warning bg-warning/10'  },
            { icon: MoreHorizontal, label: 'More',    color: 'text-muted bg-surface', onClick: () => navigate('/places') },
          ].map(({ icon: Icon, label, color, onClick }) => (
            <button
              key={label}
              onClick={(e) => { ripple(e); onClick?.() }}
              className={`ripple-btn flex flex-col items-center gap-2 py-4 rounded-xl border border-border ${color} transition-all hover:border-primary/30 hover:scale-105 active:scale-95`}
            >
              <Icon size={20} />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent rides */}
      {history.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Recent Rides</h2>
            <button onClick={() => navigate('/history')} className="text-primary text-xs font-medium">
              See all
            </button>
          </div>
          <div className="space-y-2">
            {history.slice(0, 3).map(item => (
              <button
                key={item.id}
                onClick={() => handleSearch({
                  pickupAddress:      item.pickup_address,
                  pickupLat:          item.pickup_lat    || 12.9716,
                  pickupLng:          item.pickup_lng    || 77.5946,
                  destinationAddress: item.destination_address,
                  destinationLat:     item.destination_lat || 12.9121,
                  destinationLng:     item.destination_lng || 77.6446,
                })}
                className="card flex items-center gap-3 w-full text-left hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">🚗</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.destination_address}</p>
                  <p className="text-xs text-muted truncate mt-0.5">{item.pickup_address}</p>
                </div>
                {item.cheapest_fare && (
                  <span className="font-bold text-sm shrink-0 text-cheapest">
                    ₹{Math.round(item.cheapest_fare)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Level badge */}
      {analytics && analytics.total_searches > 0 && (
        <div
          onClick={() => navigate('/analytics')}
          className="mt-6 card bg-primary/5 border-primary/20 flex items-center gap-3 cursor-pointer hover:border-primary/40 transition-colors"
        >
          <span className="text-2xl">
            {analytics.total_searches >= 100 ? '💎' : analytics.total_searches >= 50 ? '🏆' : analytics.total_searches >= 20 ? '⚡' : analytics.total_searches >= 5 ? '🚗' : '🌱'}
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-primary">
              {analytics.total_searches >= 100 ? 'Savings Hero' : analytics.total_searches >= 50 ? 'Power User' : analytics.total_searches >= 20 ? 'Regular' : analytics.total_searches >= 5 ? 'Explorer' : 'Newbie'}
            </p>
            <p className="text-xs text-muted">{analytics.total_searches} searches · tap to see full stats</p>
          </div>
          {analytics.streak_days > 0 && (
            <span className="text-xs font-bold text-warning">🔥 {analytics.streak_days}d</span>
          )}
        </div>
      )}
    </div>
  )
}
