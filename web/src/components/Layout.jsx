import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, BookOpen, Grid, User, Zap, BarChart2, Calculator, ShieldCheck, Bell, MapPin, History } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const BOTTOM_NAV = [
  { to: '/home',    icon: Home,    label: 'Home'    },
  { to: '/history', icon: History, label: 'Bookings'},
  null, // center CTA slot
  { to: '/explore', icon: Grid,    label: 'Explore' },
  { to: '/profile', icon: User,    label: 'Account' },
]

const SIDEBAR_NAV = [
  { to: '/home',      icon: Home,       label: 'Home'       },
  { to: '/history',   icon: History,    label: 'Bookings'   },
  { to: '/alerts',    icon: Bell,       label: 'Alerts'     },
  { to: '/places',    icon: MapPin,     label: 'Places'     },
  { to: '/profile',   icon: User,       label: 'Account'    },
  { to: '/analytics', icon: BarChart2,  label: 'Analytics'  },
  { to: '/calculator',icon: Calculator, label: 'Calculator' },
  { to: '/admin',     icon: ShieldCheck,label: 'Admin'      },
]

export default function Layout() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-bg">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-surface sticky top-0 h-screen shadow-sm">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-[#1A1A2E] dark:text-white">RideCompare</span>
          <ThemeToggle className="ml-auto" />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {SIDEBAR_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted hover:bg-primary/5 hover:text-primary'
                }`}
            >
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-border text-xs text-muted">
          Compare rides across India
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Desktop top bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-border bg-surface sticky top-0 z-30 shadow-sm">
          <h1 className="text-base font-semibold text-[#1A1A2E]">
            Compare Uber, Ola, Rapido &amp; InDrive
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium border border-primary/20">
              Live prices
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <div className="max-w-xl mx-auto md:py-4">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav (Namo Bharat style) ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border z-50 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-end max-w-md mx-auto px-2">
          {BOTTOM_NAV.map((item, i) => {
            if (!item) {
              // Centre red compare button
              return (
                <div key="cta" className="flex-1 flex justify-center">
                  <button
                    onClick={() => navigate('/compare')}
                    className="w-14 h-14 rounded-full bg-[#E53935] flex items-center justify-center shadow-lg -mt-5 active:scale-95 transition-transform"
                    style={{ boxShadow: '0 4px 16px rgba(229,57,53,0.4)' }}
                  >
                    <Zap size={26} className="text-white" />
                  </button>
                </div>
              )
            }
            const { to, icon: Icon, label } = item
            return (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted'
                  }`}
              >
                <Icon size={22} />
                <span className="text-[10px] font-medium">{label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
