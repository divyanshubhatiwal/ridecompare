import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, Bell, ChevronRight, Zap, Clock, BarChart2,
  Calculator, Navigation, Map, Star, History, AlertCircle, BookmarkPlus,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ridesApi } from '../api/rides'
import { analyticsApi } from '../api/analytics'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayStr() {
  return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const QUICK_SERVICES = [
  { icon: '⚡', label: 'Compare\nRides',   route: '/compare'    },
  { icon: '🏍', label: 'Rapido\nBike',     route: '/compare'    },
  { icon: '🚗', label: 'Ola\nCabs',        route: '/compare'    },
  { icon: '🚙', label: 'Uber\nGo',         route: '/compare'    },
  { icon: '🚐', label: 'InDrive',          route: '/compare'    },
  { icon: '🗺️', label: 'Map\nRoute',       route: '/map-route'  },
]

const MORE_SERVICES = [
  { icon: Zap,          label: 'Price\nCompare',   route: '/compare',    bg: '#0B8A82' },
  { icon: Clock,        label: 'Ride\nHistory',    route: '/history',    bg: '#0B8A82' },
  { icon: Bell,         label: 'Price\nAlerts',    route: '/alerts',     bg: '#0B8A82' },
  { icon: BookmarkPlus, label: 'Saved\nPlaces',    route: '/places',     bg: '#0B8A82' },
  { icon: Map,          label: 'Map\nRoute',       route: '/map-route',  bg: '#0B8A82' },
  { icon: BarChart2,    label: 'Analytics',        route: '/analytics',  bg: '#0B8A82' },
  { icon: Navigation,   label: 'Live\nNavigate',   route: '/map-route',  bg: '#0B8A82' },
  { icon: Calculator,   label: 'Fare\nCalculator', route: '/calculator', bg: '#0B8A82' },
]

export default function HomePage() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [history, setHistory]     = useState([])
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    ridesApi.getHistory(5).then(setHistory).catch(() => {})
    analyticsApi.getSummary().then(setAnalytics).catch(() => {})
  }, [])

  const firstName = user?.full_name?.split(' ')[0] || 'there'
  const initial   = firstName[0]?.toUpperCase()

  return (
    <div className="bg-bg min-h-screen pb-6">

      {/* ── Top bar ── */}
      <div className="bg-surface px-4 pt-4 pb-3 border-b border-border shadow-sm sticky top-0 z-20">
        <p className="text-[11px] text-muted mb-1">Your nearest location</p>
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/map-route')}
            className="flex items-center gap-1.5 font-semibold text-[15px] text-[#1A1A2E]"
            style={{ color: 'var(--primary)' }}
          >
            <MapPin size={16} style={{ color: 'var(--primary)' }} />
            Select Location
            <span className="text-muted font-normal text-xs ml-1">▾</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/alerts')}
              className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Bell size={17} style={{ color: 'var(--primary)' }} />
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm"
            >
              {initial}
            </button>
          </div>
        </div>
      </div>

      {/* ── Welcome banner ── */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0B8A82 0%, #0A6B65 100%)' }}>
        <div className="px-5 py-4">
          <p className="text-white/80 text-xs mb-0.5">{greeting()}, {firstName}!</p>
          <p className="text-white font-bold text-lg leading-tight">Welcome to RideCompare</p>
          <div className="flex items-center gap-1.5 mt-2">
            <Zap size={13} className="text-white/70" />
            <p className="text-white/80 text-[11px]">
              {todayStr()} · Compare all rides instantly
            </p>
          </div>
        </div>

        {/* Savings strip inside banner */}
        {analytics?.total_savings > 0 && (
          <div className="bg-white/15 px-5 py-2.5 flex items-center gap-2">
            <Star size={13} className="text-yellow-300" />
            <p className="text-white text-xs font-medium">
              You've saved ₹{analytics.total_savings.toLocaleString('en-IN')} across {analytics.total_searches} rides
            </p>
          </div>
        )}
      </div>

      {/* ── Plan Your Journey ── */}
      <div className="mt-5 px-4">
        <p className="text-[13px] font-bold text-[#1A1A2E] mb-3" style={{ color: 'inherit' }}>
          Plan Your Journey
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {QUICK_SERVICES.map(({ icon, label, route }) => (
            <button
              key={label}
              onClick={() => navigate(route)}
              className="flex flex-col items-center gap-2 shrink-0 active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-sm"
                style={{ background: 'linear-gradient(135deg, #0B8A82, #0A6B65)' }}>
                <span>{icon}</span>
              </div>
              <span className="text-[10px] font-medium text-center text-muted leading-tight whitespace-pre-line">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Promo banner ── */}
      <div
        className="mx-4 mt-4 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
        style={{ background: 'linear-gradient(90deg, #E8F5E9, #E0F2F1)' }}
        onClick={() => navigate('/alerts')}
      >
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
          <AlertCircle size={18} style={{ color: 'var(--primary)' }} />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-bold" style={{ color: '#0B8A82' }}>BEST FARE ALERT</p>
          <p className="text-[11px] text-muted">Get notified when prices drop!</p>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--primary)' }} />
      </div>

      {/* ── Frequent Travels ── */}
      {history.length > 0 && (
        <div className="mt-5 px-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold">Your Frequent Travels</p>
            <button onClick={() => navigate('/history')} className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
              See all
            </button>
          </div>
          <p className="text-[11px] text-muted mb-3">Curated travel pick, specially clubbed for you</p>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {history.filter(h => h.pickup_lat && h.destination_lat).slice(0, 4).map(item => (
              <button
                key={item.id}
                onClick={() => navigate('/compare', { state: { route: {
                  pickupAddress: item.pickup_address,
                  pickupLat: item.pickup_lat, pickupLng: item.pickup_lng,
                  destinationAddress: item.destination_address,
                  destinationLat: item.destination_lat, destinationLng: item.destination_lng,
                }}})}
                className="shrink-0 w-44 rounded-2xl overflow-hidden shadow-sm border border-border bg-surface text-left active:scale-95 transition-transform"
              >
                <div className="h-24 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #0B8A82 0%, #0A6B65 100%)' }}>
                  <div className="text-center">
                    <p className="text-white text-xs font-medium px-3 truncate">{item.pickup_address?.split(',')[0]}</p>
                    <div className="w-6 border-t border-white/40 mx-auto my-1" />
                    <p className="text-white text-xs font-medium px-3 truncate">{item.destination_address?.split(',')[0]}</p>
                  </div>
                  {item.cheapest_fare && (
                    <div className="absolute top-2 right-2 bg-white/90 rounded-lg px-2 py-0.5">
                      <span className="text-[11px] font-bold" style={{ color: '#0B8A82' }}>
                        ₹{Math.round(item.cheapest_fare)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="px-3 py-2">
                  <p className="text-[11px] font-semibold truncate">{item.destination_address?.split(',')[0]}</p>
                  <p className="text-[10px] text-muted truncate">{item.pickup_address?.split(',')[0]}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── More Services ── */}
      <div className="mt-5 px-4">
        <p className="text-[13px] font-bold mb-1">More Services For You</p>
        <p className="text-[11px] text-muted mb-4">Add on features to help you decide your travel</p>
        <div className="grid grid-cols-4 gap-x-2 gap-y-5">
          {MORE_SERVICES.map(({ icon: Icon, label, route }) => (
            <button
              key={label}
              onClick={() => navigate(route)}
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-sm"
                style={{ background: 'linear-gradient(135deg, #0B8A82, #0A6B65)' }}>
                <Icon size={22} className="text-white" />
              </div>
              <span className="text-[10px] font-medium text-center text-muted leading-tight whitespace-pre-line">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-10 px-4 text-center">
        <p className="text-2xl font-bold text-muted/30 leading-tight">Loving</p>
        <p className="text-2xl font-bold text-muted/30 leading-tight">RideCompare</p>
        <p className="text-xs text-muted mt-2">Built with ❤️ for India</p>
        <button
          onClick={() => navigate('/profile')}
          className="text-xs font-semibold mt-1"
          style={{ color: 'var(--primary)' }}
        >
          Rate your experience
        </button>
      </div>
    </div>
  )
}
