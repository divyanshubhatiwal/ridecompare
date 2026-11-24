import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, TrendingDown, Bell, Shield, ChevronRight, BarChart2, BookmarkPlus, Calculator, Map, Clock, ArrowRight, MapPin } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import RouteSelector from '../components/RouteSelector'
import AnimatedCounter from '../components/AnimatedCounter'
import { ridesApi } from '../api/rides'
import { analyticsApi } from '../api/analytics'
import { useSavingsStreak } from '../hooks/useSavingsStreak'

const PROVIDERS = [
  { name: 'Uber',    color: '#111' },
  { name: 'Ola',     color: '#23AA4E' },
  { name: 'Rapido',  color: '#F5B700' },
  { name: 'InDrive', color: '#00C853' },
]

const QUICK_ACTIONS = [
  { icon: BarChart2,    label: 'Analytics',  route: '/analytics',  color: '#0A84FF' },
  { icon: Bell,         label: 'Alerts',     route: '/alerts',     color: '#FF9F0A' },
  { icon: BookmarkPlus, label: 'Saved',      route: '/places',     color: '#30D158' },
  { icon: Calculator,   label: 'Calculator', route: '/calculator', color: '#BF5AF2' },
  { icon: Map,          label: 'Map',        route: '/map-route',  color: '#32ADE6' },
  { icon: Clock,        label: 'History',    route: '/history',    color: '#FF375F' },
]

const DEMO_BARS = [
  { label: 'Rapido', w: 34, color: '#F5B700' },
  { label: 'InDrive', w: 46, color: '#00C853' },
  { label: 'Ola', w: 62, color: '#23AA4E' },
  { label: 'Uber', w: 81, color: '#8E8E93' },
]

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function IconTile({ icon: Icon, color, size = 40 }) {
  return (
    <div className="rounded-2xl flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: `${color}1F` }}>
      <Icon size={size * 0.48} style={{ color }} />
    </div>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [history,   setHistory]   = useState([])
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    ridesApi.getHistory(6).then(setHistory).catch(() => {})
    analyticsApi.getSummary().then(setAnalytics).catch(() => {})
  }, [])

  const { streak, best } = useSavingsStreak()
  const firstName = user?.full_name?.split(' ')[0] || 'there'
  const handleSearch = route => navigate('/compare', { state: { route } })
  const recent = history.filter(h => h.pickup_lat).slice(0, 4)

  const stats = [
    { value: analytics?.total_searches || 0, prefix: '', label: 'Rides compared', color: '#0A84FF' },
    { value: Math.round(analytics?.total_savings || 0), prefix: '₹', label: 'You saved', color: '#10B981' },
    { value: PROVIDERS.length, prefix: '', label: 'Providers', color: '#8B5CF6' },
  ]

  return (
    <div className="min-h-screen bg-bg">

      {/* ══ HERO ══ */}
      <section className="mesh" style={{ background: 'var(--hero-bg)' }}>
        <div className="mesh-layer" />
        <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-10 pb-12">
          <div className="fade-up">
            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 mb-5">
              <span className="live-dot" />
              <span className="text-[12px] font-semibold t-primary">Live fares from {PROVIDERS.length} providers</span>
            </div>
            <p className="text-[14px] font-medium t-secondary mb-1">{greeting()}, {firstName}</p>
            <h1 className="font-bold t-primary"
              style={{ fontSize: 'clamp(2.1rem, 6vw, 3.4rem)', letterSpacing: '-0.045em', lineHeight: 1.02 }}>
              Every ride.<br />
              <span style={{
                background: 'linear-gradient(100deg, #0A84FF 10%, #8B5CF6 55%, #10B981 95%)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>One best price.</span>
            </h1>
            <p className="text-[15px] t-secondary mt-3 max-w-md">
              Compare Uber, Ola, Rapido and InDrive side by side — then book the winner in one tap.
            </p>
          </div>

          {streak > 0 && (
            <div className="inline-flex items-center gap-1.5 mt-5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
              style={{ background: 'rgba(255,159,10,.12)', color: '#FF9F0A' }}>
              🔥 {streak}-day saving streak{best > streak && <span className="font-normal opacity-80">· best {best}</span>}
            </div>
          )}

          {/* Search card */}
          <div className="glass rounded-3xl p-5 mt-7 t-primary fade-up" style={{ animationDelay: '.1s', boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] t-secondary">Where to?</p>
              <div className="flex -space-x-1.5">
                {PROVIDERS.map(p => (
                  <span key={p.name} title={p.name}
                    className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                    style={{ background: p.color, border: '2px solid rgb(var(--c-card))' }}>
                    {p.name[0]}
                  </span>
                ))}
              </div>
            </div>
            <RouteSelector onSearch={handleSearch} />
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8 space-y-10">

        {/* ══ STATS ══ */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} className="card text-center py-5">
              <p className="font-bold tabular-nums" style={{ fontSize: 'clamp(1.3rem,3.5vw,1.8rem)', letterSpacing: '-0.04em', color: s.color }}>
                <AnimatedCounter value={s.value} prefix={s.prefix} />
              </p>
              <p className="text-[12px] mt-1 t-secondary">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ══ RECENT ══ */}
        {recent.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[18px] t-primary">Jump back in</h2>
              <button onClick={() => navigate('/history')}
                className="flex items-center gap-0.5 text-[13px] font-medium" style={{ color: 'var(--primary)' }}>
                View all <ChevronRight size={14} />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {recent.map(item => (
                <button key={item.id}
                  onClick={() => handleSearch({
                    pickupAddress: item.pickup_address,
                    pickupLat: item.pickup_lat, pickupLng: item.pickup_lng,
                    destinationAddress: item.destination_address,
                    destinationLat: item.destination_lat, destinationLng: item.destination_lng,
                  })}
                  className="card-lift group flex items-center gap-3 text-left w-full p-4">
                  <IconTile icon={MapPin} color="#F43F5E" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold truncate t-primary">{item.destination_address?.split(',')[0]}</p>
                    <p className="text-[12px] truncate mt-0.5 t-secondary">from {item.pickup_address?.split(',')[0]}</p>
                  </div>
                  {item.cheapest_fare ? (
                    <div className="text-right shrink-0">
                      <p className="text-[11px] t-secondary">from</p>
                      <p className="text-[15px] font-bold tabular-nums" style={{ color: 'var(--primary)' }}>₹{Math.round(item.cheapest_fare)}</p>
                    </div>
                  ) : (
                    <ChevronRight size={16} className="t-secondary transition-transform group-hover:translate-x-0.5" />
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ══ BENTO ══ */}
        <section>
          <h2 className="font-bold text-[18px] mb-4 t-primary">Why RideCompare</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="card col-span-2 sm:row-span-2 p-6 flex flex-col justify-between overflow-hidden relative">
              <div>
                <IconTile icon={Zap} color="#0A84FF" />
                <p className="text-[17px] font-bold t-primary mt-4">Instant side-by-side</p>
                <p className="text-[13px] t-secondary mt-1 max-w-xs">All fares, ETAs and surge in one view — sorted the way you want.</p>
              </div>
              <div className="space-y-2 mt-6">
                {DEMO_BARS.map((b, i) => (
                  <div key={b.label} className="flex items-center gap-3">
                    <span className="text-[11px] w-14 t-secondary">{b.label}</span>
                    <span className="flex-1 h-2 rounded-full" style={{ background: 'var(--tint)' }}>
                      <span className="block h-full rounded-full origin-left"
                        style={{ width: `${b.w}%`, background: b.color, animation: `bar-grow .9s ${0.2 + i * 0.1}s cubic-bezier(.2,.8,.2,1) both` }} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {[
              { icon: TrendingDown, color: '#10B981', title: 'Lowest price', desc: 'Cheapest and best value, highlighted.' },
              { icon: Bell,         color: '#FF9F0A', title: 'Price alerts', desc: 'Get pinged when your route drops.' },
              { icon: Shield,       color: '#8B5CF6', title: 'Surge upfront', desc: 'No surprise multipliers.' },
              { icon: Clock,        color: '#F43F5E', title: 'Best time', desc: 'Know when fares are lowest.' },
            ].map(f => (
              <div key={f.title} className="card p-5">
                <IconTile icon={f.icon} color={f.color} size={36} />
                <p className="text-[14px] font-semibold t-primary mt-3">{f.title}</p>
                <p className="text-[12px] t-secondary mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ QUICK ACTIONS ══ */}
        <section>
          <h2 className="font-bold text-[18px] mb-4 t-primary">Quick access</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {QUICK_ACTIONS.map(({ icon, label, route, color }) => (
              <button key={label} onClick={() => navigate(route)}
                className="card-lift flex flex-col items-center gap-2 py-5 px-2 active:scale-95">
                <IconTile icon={icon} color={color} size={44} />
                <span className="text-[12px] font-medium t-primary">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ══ CTA ══ */}
        <section className="mesh rounded-3xl p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
          style={{ background: '#0B0B0F' }}>
          <div className="mesh-layer no-grid" />
          <div>
            <p className="font-bold text-white text-[19px]" style={{ letterSpacing: '-0.02em' }}>
              Never overpay for a ride again
            </p>
            <p className="text-[14px] mt-1" style={{ color: '#A1A1AA' }}>
              Set a price alert and we'll tell you the moment your route gets cheaper.
            </p>
          </div>
          <button onClick={() => navigate('/alerts')}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-[14px] rounded-full transition-transform hover:scale-[1.03]"
            style={{ background: '#fff', color: '#0B0B0F' }}>
            Set alert <ArrowRight size={14} />
          </button>
        </section>

        <footer className="text-center pb-4">
          <p className="text-[12px] t-secondary">Built for India · Uber, Ola, Rapido & InDrive</p>
        </footer>
      </div>
    </div>
  )
}
