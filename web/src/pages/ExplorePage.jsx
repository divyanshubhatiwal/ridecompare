import { useNavigate } from 'react-router-dom'
import { ChevronRight, Zap, Clock, Bell, BookmarkPlus, Map, BarChart2, Navigation, Calculator, ShieldCheck, User } from 'lucide-react'

const EXPLORE_ITEMS = [
  {
    icon: Zap,
    label: 'Price Compare',
    desc: 'Compare fares across Uber, Ola, Rapido & InDrive',
    route: '/compare',
    live: false,
  },
  {
    icon: Clock,
    label: 'Ride History',
    desc: 'View all your past ride comparisons',
    route: '/history',
    live: false,
  },
  {
    icon: Bell,
    label: 'Price Alerts',
    desc: 'Get notified when ride prices drop',
    route: '/alerts',
    live: true,
  },
  {
    icon: BookmarkPlus,
    label: 'Saved Places',
    desc: 'Manage your home, work & frequent locations',
    route: '/places',
    live: false,
  },
  {
    icon: Map,
    label: 'Map Route',
    desc: 'Pick locations visually on the map',
    route: '/map-route',
    live: false,
  },
  {
    icon: Navigation,
    label: 'Live Navigate',
    desc: 'Get turn-by-turn directions to your ride',
    route: '/map-route',
    live: false,
  },
  {
    icon: BarChart2,
    label: 'Analytics',
    desc: 'See your ride spending & savings insights',
    route: '/analytics',
    live: false,
  },
  {
    icon: Calculator,
    label: 'Fare Calculator',
    desc: 'Estimate fares before you book a ride',
    route: '/calculator',
    live: false,
  },
  {
    icon: User,
    label: 'My Profile',
    desc: 'Manage your account and preferences',
    route: '/profile',
    live: false,
  },
  {
    icon: ShieldCheck,
    label: 'Admin Panel',
    desc: 'App analytics and management tools',
    route: '/admin',
    live: false,
  },
]

export default function ExplorePage() {
  const navigate = useNavigate()

  return (
    <div className="bg-bg min-h-screen">
      {/* Header */}
      <div className="bg-surface px-4 pt-5 pb-4 border-b border-border shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold" style={{ color: '#1A1A2E' }}>Explore RideCompare</h1>
      </div>

      {/* List */}
      <div className="divide-y divide-border bg-surface mt-3 mx-0">
        {EXPLORE_ITEMS.map(({ icon: Icon, label, desc, route, live }) => (
          <button
            key={label}
            onClick={() => navigate(route)}
            className="w-full flex items-center gap-4 px-4 py-4 bg-surface hover:bg-primary/5 active:bg-primary/10 transition-colors text-left"
          >
            {/* Teal circle icon */}
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #0B8A82, #0A6B65)' }}>
              <Icon size={22} className="text-white" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold" style={{ color: '#1A1A2E' }}>{label}</p>
                {live && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                    Live
                  </span>
                )}
              </div>
              <p className="text-[12px] text-muted mt-0.5 leading-snug">{desc}</p>
            </div>

            <ChevronRight size={18} className="text-muted shrink-0" />
          </button>
        ))}
      </div>

      <div className="h-6" />
    </div>
  )
}
