import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Home, History, Bell, MapPin, User, Grid,
  BarChart2, Calculator, ShieldCheck, Zap, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { to: '/home',      label: 'Home'       },
  { to: '/compare',   label: 'Compare'    },
  { to: '/history',   label: 'History'    },
  { to: '/alerts',    label: 'Alerts'     },
  { to: '/analytics', label: 'Analytics'  },
]

const BOTTOM_NAV = [
  { to: '/home',    icon: Home,    label: 'Home'     },
  { to: '/history', icon: History, label: 'History'  },
  null,
  { to: '/explore', icon: Grid,    label: 'Explore'  },
  { to: '/profile', icon: User,    label: 'Account'  },
]

export default function Layout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const initial = user?.full_name?.[0]?.toUpperCase() || 'U'

  return (
    <div className="flex flex-col min-h-screen bg-bg">

      {/* ══ TOP NAV BAR (desktop + mobile header) ══ */}
      <header className="sticky top-0 z-40 bg-surface border-b border-border"
        style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <button onClick={() => navigate('/home')}
              className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#0F766E,#0D9488)' }}>
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-bold text-[15px] tracking-tight" style={{ color: '#0F172A' }}>
                Ride<span style={{ color: 'var(--primary)' }}>Compare</span>
              </span>
            </button>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'text-white font-semibold'
                        : 'text-muted hover:text-[#0F172A]'
                    }`}
                  style={({ isActive }) => isActive
                    ? { background: 'var(--primary)', color: '#fff' }
                    : {}}
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {/* Desktop: profile + CTA */}
              <button
                onClick={() => navigate('/compare')}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'var(--primary)', boxShadow: '0 2px 8px rgba(15,118,110,.35)' }}
              >
                <Zap size={14} /> Compare Now
              </button>

              <button onClick={() => navigate('/profile')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: 'var(--primary)' }}>
                {initial}
              </button>

              {/* Mobile hamburger */}
              <button onClick={() => setMobileMenuOpen(o => !o)}
                className="md:hidden p-2 rounded-lg text-muted hover:text-[#0F172A] transition-colors">
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-surface border-t border-border px-4 py-3 space-y-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-muted'
                  }`}
                style={({ isActive }) => isActive ? { background: 'var(--primary)' } : {}}
              >
                {label}
              </NavLink>
            ))}
            <button
              onClick={() => { navigate('/places'); setMobileMenuOpen(false) }}
              className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-muted"
            >
              Saved Places
            </button>
          </div>
        )}
      </header>

      {/* ══ PAGE CONTENT ══ */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto w-full md:py-6 md:px-6">
          <Outlet />
        </div>
      </main>

      {/* ══ MOBILE BOTTOM NAV ══ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border"
        style={{ boxShadow: '0 -2px 16px rgba(0,0,0,0.07)' }}>
        <div className="flex items-end max-w-md mx-auto px-2">
          {BOTTOM_NAV.map((item, i) => {
            if (!item) return (
              <div key="cta" className="flex-1 flex justify-center">
                <button
                  onClick={() => navigate('/compare')}
                  className="w-13 h-13 rounded-full flex items-center justify-center -mt-5 active:scale-95 transition-transform text-white"
                  style={{
                    width: 52, height: 52,
                    background: 'linear-gradient(135deg,#0F766E,#0D9488)',
                    boxShadow: '0 4px 16px rgba(15,118,110,.45)',
                  }}
                >
                  <Zap size={24} className="text-white" />
                </button>
              </div>
            )
            const { to, icon: Icon, label } = item
            return (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors text-[10px] font-medium ${
                    isActive ? '' : 'text-muted'
                  }`}
                style={({ isActive }) => isActive ? { color: 'var(--primary)' } : {}}
              >
                <Icon size={20} />
                <span>{label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
