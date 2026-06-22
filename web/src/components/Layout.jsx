import { NavLink, Outlet } from 'react-router-dom'
import { Home, History, Bell, MapPin, User, Zap, BarChart2, Calculator, ShieldCheck } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const NAV = [
  { to: '/home',      icon: Home,       label: 'Home'    },
  { to: '/history',   icon: History,    label: 'History' },
  { to: '/alerts',    icon: Bell,       label: 'Alerts'  },
  { to: '/places',    icon: MapPin,     label: 'Places'  },
  { to: '/profile',   icon: User,       label: 'Profile' },
]

const SIDEBAR_EXTRA = [
  { to: '/analytics',  icon: BarChart2,   label: 'Analytics'  },
  { to: '/calculator', icon: Calculator,  label: 'Calculator' },
  { to: '/admin',      icon: ShieldCheck, label: 'Admin'      },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-bg">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-surface sticky top-0 h-screen">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold">RideCompare</span>
          <ThemeToggle className="ml-auto" />
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary/15 text-primary' : 'text-muted hover:bg-white/5 hover:text-white'
                }`}
            >
              <Icon size={18} />{label}
            </NavLink>
          ))}

          <div className="pt-4 pb-1">
            <p className="text-[10px] font-semibold tracking-widest text-muted/60 px-4 mb-2">TOOLS</p>
            {SIDEBAR_EXTRA.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary/15 text-primary' : 'text-muted hover:bg-white/5 hover:text-white'
                  }`}
              >
                <Icon size={18} />{label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border text-xs text-muted">
          Compare rides across India
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Desktop top bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-border bg-surface/50 backdrop-blur sticky top-0 z-30">
          <h1 className="text-base font-semibold text-white/80">
            Compare Uber, Ola, Rapido &amp; InDrive
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full font-medium">
              Live prices
            </span>
          </div>
        </header>

        {/* Mobile top bar with theme toggle */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm">RideCompare</span>
          </div>
          <ThemeToggle />
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <div className="max-w-xl mx-auto md:py-4">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border z-50">
        <div className="flex max-w-md mx-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted hover:text-white'
                }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
