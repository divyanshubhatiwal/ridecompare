import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, TrendingDown, Clock, Shield, ChevronRight, Star, MapPin, BarChart2, Bell, BookmarkPlus, Calculator, Map } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import RouteSelector from '../components/RouteSelector'
import { ridesApi } from '../api/rides'
import { analyticsApi } from '../api/analytics'

const PROVIDERS = [
  { name: 'Uber',         emoji: '🚗', color: '#000000' },
  { name: 'Ola',          emoji: '🟡', color: '#F7C31A' },
  { name: 'Rapido',       emoji: '🏍',  color: '#FF4D00' },
  { name: 'InDrive',      emoji: '🚙', color: '#1DC469' },
  { name: 'Namma Yatri',  emoji: '🛺', color: '#F97316' },
]

const FEATURES = [
  { icon: Zap,         title: 'Instant Compare',    desc: 'See all fares side-by-side in under 2 seconds.' },
  { icon: TrendingDown,title: 'Best Price Always',  desc: 'We highlight the cheapest and best-value ride for you.' },
  { icon: Bell,        title: 'Price Alerts',       desc: 'Get notified on WhatsApp when fares drop on your route.' },
  { icon: Shield,      title: 'No Hidden Fees',     desc: 'Transparent pricing with surge warnings upfront.' },
]

const QUICK_ACTIONS = [
  { icon: BarChart2,   label: 'Analytics',       route: '/analytics',  desc: 'Spending insights'    },
  { icon: Bell,        label: 'Price Alerts',    route: '/alerts',     desc: 'WhatsApp alerts'      },
  { icon: BookmarkPlus,label: 'Saved Places',    route: '/places',     desc: 'Home & work saved'    },
  { icon: Calculator,  label: 'Fare Calculator', route: '/calculator', desc: 'Estimate fares'       },
  { icon: Map,         label: 'Map Route',       route: '/map-route',  desc: 'Pick on map'          },
  { icon: Clock,       label: 'Ride History',    route: '/history',    desc: 'Past comparisons'     },
]

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory]     = useState([])
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    ridesApi.getHistory(6).then(setHistory).catch(() => {})
    analyticsApi.getSummary().then(setAnalytics).catch(() => {})
  }, [])

  const firstName = user?.full_name?.split(' ')[0] || 'there'

  const handleSearch = (route) => navigate('/compare', { state: { route } })

  return (
    <div className="min-h-screen">

      {/* ══ HERO ══ */}
      <section className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 50%, #0891B2 100%)',
          minHeight: 340,
        }}>
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'rgba(255,255,255,0.3)' }} />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'rgba(255,255,255,0.2)' }} />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-16">
          {/* Greeting */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/70 text-sm">Welcome back, {firstName} 👋</p>
              <h1 className="text-white font-extrabold text-2xl sm:text-3xl mt-1 leading-tight">
                Compare Rides.<br className="sm:hidden" /> Save Money.
              </h1>
              <p className="text-white/70 text-sm mt-1.5">
                Cheapest Uber, Ola, Rapido &amp; InDrive — instantly.
              </p>
            </div>
            {analytics?.total_savings > 0 && (
              <div className="hidden sm:flex flex-col items-center bg-white/15 rounded-2xl px-4 py-3 backdrop-blur-sm">
                <span className="text-white font-black text-xl">
                  ₹{analytics.total_savings.toLocaleString('en-IN')}
                </span>
                <span className="text-white/70 text-xs">saved so far</span>
              </div>
            )}
          </div>

          {/* Provider pills */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {PROVIDERS.map(p => (
              <span key={p.name}
                className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
                <span>{p.emoji}</span> {p.name}
              </span>
            ))}
          </div>

          {/* Search card — floats over hero */}
          <div className="bg-card rounded-2xl p-4 sm:p-5 relative z-10"
            style={{ boxShadow: '0 12px 48px rgba(0,0,0,0.20)' }}>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
              Where are you going?
            </p>
            <RouteSelector onSearch={handleSearch} />
          </div>
        </div>
      </section>

      {/* ══ STATS STRIP ══ */}
      <section className="bg-surface border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-3 divide-x divide-border text-center">
          {[
            { value: analytics?.total_searches > 0 ? `${analytics.total_searches}+` : '10K+', label: 'Rides Compared' },
            { value: analytics?.total_savings > 0 ? `₹${analytics.total_savings.toLocaleString('en-IN')}` : '₹2.5Cr+', label: 'Total Saved' },
            { value: '5', label: 'Providers' },
          ].map(({ value, label }) => (
            <div key={label} className="px-4 py-1">
              <p className="font-extrabold text-lg sm:text-xl" style={{ color: 'var(--primary)' }}>{value}</p>
              <p className="text-xs text-muted font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* ══ RECENT SEARCHES ══ */}
        {history.filter(h => h.pickup_lat && h.destination_lat).length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold" style={{ color: '#0F172A' }}>Recent Searches</h2>
              <button onClick={() => navigate('/history')}
                className="text-xs font-semibold flex items-center gap-0.5"
                style={{ color: 'var(--primary)' }}>
                View all <ChevronRight size={13} />
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
                  className="card-lift flex items-center gap-3 text-left w-full p-3.5 group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                    style={{ background: 'rgba(15,118,110,.1)' }}>
                    🚗
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#0F172A' }}>
                      {item.destination_address?.split(',')[0]}
                    </p>
                    <p className="text-xs text-muted truncate mt-0.5">
                      from {item.pickup_address?.split(',')[0]}
                    </p>
                  </div>
                  {item.cheapest_fare && (
                    <span className="text-sm font-bold shrink-0" style={{ color: 'var(--primary)' }}>
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
          <h2 className="text-base font-bold mb-4" style={{ color: '#0F172A' }}>Why RideCompare?</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(15,118,110,.1)' }}>
                  <Icon size={20} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{title}</p>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ QUICK ACTIONS ══ */}
        <section>
          <h2 className="text-base font-bold mb-4" style={{ color: '#0F172A' }}>Quick Access</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {QUICK_ACTIONS.map(({ icon: Icon, label, route, desc }) => (
              <button key={label} onClick={() => navigate(route)}
                className="card flex flex-col items-center gap-2 py-4 px-2 hover:border-primary group active:scale-95 transition-all text-center"
                style={{ '--tw-border-opacity': 1 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(15,118,110,.1)' }}>
                  <Icon size={20} style={{ color: 'var(--primary)' }} />
                </div>
                <span className="text-[11px] font-semibold leading-tight" style={{ color: '#0F172A' }}>{label}</span>
                <span className="text-[10px] text-muted hidden sm:block">{desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ══ CTA BANNER ══ */}
        <section
          className="rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: 'linear-gradient(135deg, #0F766E, #0891B2)' }}>
          <div>
            <p className="text-white font-bold text-lg">Get price drop alerts on WhatsApp</p>
            <p className="text-white/70 text-sm mt-0.5">We'll message you when your route gets cheaper</p>
          </div>
          <button onClick={() => navigate('/alerts')}
            className="shrink-0 bg-white font-semibold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-white/90 transition-colors active:scale-95"
            style={{ color: 'var(--primary)' }}>
            Set Alert <Bell size={15} />
          </button>
        </section>

        {/* ══ FOOTER ══ */}
        <footer className="text-center pb-4">
          <p className="text-xs text-muted">
            Built with ❤️ for India · Compare Uber, Ola, Rapido &amp; InDrive
          </p>
          <button onClick={() => navigate('/profile')}
            className="text-xs font-semibold mt-1" style={{ color: 'var(--primary)' }}>
            Rate your experience →
          </button>
        </footer>
      </div>
    </div>
  )
}
