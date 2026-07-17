import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, TrendingDown, Bell, Shield, ChevronRight, BarChart2, BookmarkPlus, Calculator, Map, Clock, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import RouteSelector from '../components/RouteSelector'
import { ridesApi } from '../api/rides'
import { analyticsApi } from '../api/analytics'
import { useSavingsStreak } from '../hooks/useSavingsStreak'

const PROVIDERS = [
  { name: 'Uber',    color: '#000',     initials: 'Ub' },
  { name: 'Ola',     color: '#F7C31A',  initials: 'Ol' },
  { name: 'Rapido',  color: '#FF4D00',  initials: 'Ra' },
  { name: 'InDrive', color: '#1DC469',  initials: 'In' },
]

const FEATURES = [
  { icon: Zap,         color: '#0071E3', bg: '#EBF5FF', title: 'Instant Compare',   desc: 'All fares side-by-side in under 2 seconds.' },
  { icon: TrendingDown,color: '#30D158', bg: '#EDFBF2', title: 'Best Price Always', desc: 'We highlight the cheapest and best-value ride.' },
  { icon: Bell,        color: '#FF9F0A', bg: '#FFF8EB', title: 'Price Alerts',      desc: 'Get notified on WhatsApp when fares drop.' },
  { icon: Shield,      color: '#BF5AF2', bg: '#F9F0FF', title: 'No Hidden Fees',    desc: 'Transparent pricing with surge warnings upfront.' },
]

const QUICK_ACTIONS = [
  { icon: BarChart2,    label: 'Analytics',    route: '/analytics',  color: '#0071E3', bg: '#EBF5FF' },
  { icon: Bell,         label: 'Alerts',       route: '/alerts',     color: '#FF9F0A', bg: '#FFF8EB' },
  { icon: BookmarkPlus, label: 'Saved',        route: '/places',     color: '#30D158', bg: '#EDFBF2' },
  { icon: Calculator,   label: 'Calculator',   route: '/calculator', color: '#BF5AF2', bg: '#F9F0FF' },
  { icon: Map,          label: 'Map',          route: '/map-route',  color: '#32ADE6', bg: '#EBF8FF' },
  { icon: Clock,        label: 'History',      route: '/history',    color: '#FF375F', bg: '#FFF0F3' },
]

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [history,   setHistory]   = useState([])
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    ridesApi.getHistory(6).then(setHistory).catch(() => {})
    analyticsApi.getSummary().then(setAnalytics).catch(() => {})
  }, [])

  const { streak, best, justBumped } = useSavingsStreak()
  const firstName = user?.full_name?.split(' ')[0] || 'there'
  const handleSearch = route => navigate('/compare', { state: { route } })

  return (
    <div className="min-h-screen bg-bg">

      {/* ══ HERO ══ */}
      <section style={{ background: 'var(--hero-bg)', paddingBottom: 0 }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-10 pb-0">

          {/* Greeting + savings */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-[13px] font-medium mb-1" style={{ color: '#6E6E73' }}>
                Good to have you back, {firstName}
              </p>
              <h1 className="font-bold text-[#1D1D1F]"
                style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', letterSpacing: '-0.035em', lineHeight: 1.05 }}>
                Compare rides.<br />Save every trip.
              </h1>
              <p className="text-[15px] mt-2" style={{ color: '#6E6E73' }}>
                Cheapest fare across Uber, Ola, Rapido & more — instantly.
              </p>
            </div>
            {analytics?.total_savings > 0 && (
              <div className="shrink-0 text-right hidden sm:block">
                <p className="font-bold text-[#1D1D1F]"
                  style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', letterSpacing: '-0.04em' }}>
                  ₹{analytics.total_savings.toLocaleString('en-IN')}
                </p>
                <p className="text-[12px]" style={{ color: '#6E6E73' }}>saved so far</p>
              </div>
            )}
          </div>

          {/* Savings streak badge */}
          {streak > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: justBumped ? '#FFF3CD' : '#FFF8EB',
              border: `1px solid ${justBumped ? '#FF9F0A' : 'rgba(255,159,10,0.3)'}`,
              borderRadius: 980, padding: '5px 12px',
              fontSize: 12, fontWeight: 600,
              color: '#92400E', marginBottom: 14,
              animation: justBumped ? 'streak-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
            }}>
              🔥 {streak}-day saving streak
              {best > streak && (
                <span style={{ fontWeight: 400, color: '#B45309' }}>· best {best}</span>
              )}
            </div>
          )}
          <style>{`
            @keyframes streak-pop {
              from { transform: scale(0.8); opacity: 0; }
              to   { transform: scale(1);   opacity: 1; }
            }
          `}</style>

          {/* Provider chips */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {PROVIDERS.map(p => (
              <span key={p.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold"
                style={{
                  background: 'white',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '980px',
                  color: '#1D1D1F',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                <span className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: p.color }}>
                  {p.initials[0]}
                </span>
                {p.name}
              </span>
            ))}
          </div>

          {/* Search card */}
          <div className="rounded-t-3xl overflow-hidden"
            style={{ background: 'var(--frosted-menu)', boxShadow: '0 -2px 20px rgba(0,0,0,0.06)', padding: '20px 20px 0', color: 'var(--text-primary)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: 'var(--text-secondary)' }}>
              Where are you going?
            </p>
            <RouteSelector onSearch={handleSearch} />
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8 space-y-10">

        {/* ══ STATS STRIP ══ */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: analytics?.total_searches > 0 ? `${analytics.total_searches}+` : '10K+', label: 'Rides Compared',  color: '#0071E3' },
            { value: analytics?.total_savings  > 0 ? `₹${analytics.total_savings.toLocaleString('en-IN')}` : '₹2.5Cr+', label: 'Total Saved', color: '#30D158' },
            { value: '5',                                                                                                  label: 'Providers',  color: '#BF5AF2' },
          ].map(({ value, label, color }) => (
            <div key={label} className="card text-center py-5">
              <p className="font-bold" style={{ fontSize: 'clamp(1.2rem,3vw,1.7rem)', letterSpacing: '-0.04em', color }}>
                {value}
              </p>
              <p className="text-[12px] mt-1" style={{ color: '#6E6E73' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ══ RECENT SEARCHES ══ */}
        {history.filter(h => h.pickup_lat).length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[17px]" style={{ color: '#1D1D1F' }}>Recent Searches</h2>
              <button onClick={() => navigate('/history')}
                className="flex items-center gap-1 text-[13px] font-medium"
                style={{ color: 'var(--primary)' }}>
                View all <ChevronRight size={14} />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {history.filter(h => h.pickup_lat).slice(0, 4).map(item => (
                <button key={item.id}
                  onClick={() => handleSearch({
                    pickupAddress: item.pickup_address,
                    pickupLat: item.pickup_lat, pickupLng: item.pickup_lng,
                    destinationAddress: item.destination_address,
                    destinationLat: item.destination_lat, destinationLng: item.destination_lng,
                  })}
                  className="card-lift flex items-center gap-3 text-left w-full p-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: '#EBF5FF' }}>
                    <span className="text-xl">🚗</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold truncate" style={{ color: '#1D1D1F' }}>
                      {item.destination_address?.split(',')[0]}
                    </p>
                    <p className="text-[12px] truncate mt-0.5" style={{ color: '#6E6E73' }}>
                      from {item.pickup_address?.split(',')[0]}
                    </p>
                  </div>
                  {item.cheapest_fare && (
                    <span className="text-[14px] font-bold shrink-0" style={{ color: 'var(--primary)' }}>
                      ₹{Math.round(item.cheapest_fare)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ══ WHY RIDECOMPARE ══ */}
        <section>
          <h2 className="font-bold text-[17px] mb-4" style={{ color: '#1D1D1F' }}>Why RideCompare?</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="card flex gap-4 items-start p-5">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: bg }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{title}</p>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-primary)', opacity: 0.75 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ QUICK ACTIONS ══ */}
        <section>
          <h2 className="font-bold text-[17px] mb-4" style={{ color: '#1D1D1F' }}>Quick Access</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {QUICK_ACTIONS.map(({ icon: Icon, label, route, color, bg }) => (
              <button key={label} onClick={() => navigate(route)}
                className="card flex flex-col items-center gap-2 py-5 px-2 text-center active:scale-95 transition-transform">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: bg }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <span className="text-[12px] font-medium" style={{ color: '#1D1D1F' }}>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ══ CTA BANNER ══ */}
        <section className="rounded-3xl p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
          style={{ background: '#1D1D1F' }}>
          <div>
            <p className="font-bold text-white text-[18px]" style={{ letterSpacing: '-0.02em' }}>
              Get price drop alerts on WhatsApp
            </p>
            <p className="text-[14px] mt-1" style={{ color: '#86868B' }}>
              We'll message you the moment your route gets cheaper.
            </p>
          </div>
          <button onClick={() => navigate('/alerts')}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 font-medium text-[14px] text-white"
            style={{ background: 'var(--primary)', borderRadius: '980px', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}>
            Set Alert <Bell size={14} />
          </button>
        </section>

        {/* ══ FOOTER ══ */}
        <footer className="text-center pb-4 space-y-2">
          <p className="text-[12px]" style={{ color: '#86868B' }}>
            Built for India · Compare Uber, Ola, Rapido & InDrive
          </p>
          <button onClick={() => navigate('/profile')}
            className="text-[13px] font-medium inline-flex items-center gap-1"
            style={{ color: 'var(--primary)' }}>
            Rate your experience <ArrowRight size={13} />
          </button>
        </footer>
      </div>
    </div>
  )
}
