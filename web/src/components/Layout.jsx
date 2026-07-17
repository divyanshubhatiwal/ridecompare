import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, History, Bell, User, Grid, Zap, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { to: '/home',      label: 'Home'      },
  { to: '/compare',   label: 'Compare'   },
  { to: '/history',   label: 'History'   },
  { to: '/alerts',    label: 'Alerts'    },
  { to: '/analytics', label: 'Analytics' },
]

const BOTTOM_NAV = [
  { to: '/home',    icon: Home,    label: 'Home'    },
  { to: '/history', icon: History, label: 'History' },
  null,
  { to: '/explore', icon: Grid,    label: 'Explore' },
  { to: '/profile', icon: User,    label: 'Account' },
]

export default function Layout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [scrolled,  setScrolled]  = useState(false)
  const [avatar,    setAvatar]    = useState(() => localStorage.getItem('rc_avatar') || '')
  const initial = user?.full_name?.[0]?.toUpperCase() || 'U'

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const fn = (e) => setAvatar(e.detail || '')
    window.addEventListener('rc-avatar-change', fn)
    return () => window.removeEventListener('rc-avatar-change', fn)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-bg">

      {/* ── TOP NAV — Apple frosted glass ── */}
      <header
        className="sticky top-0 z-40 transition-all duration-300"
        style={{
          background:       scrolled ? 'var(--frosted-nav)' : 'transparent',
          backdropFilter:   scrolled ? 'saturate(180%) blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
          borderBottom:     scrolled ? '1px solid rgba(128,128,128,0.15)' : '1px solid transparent',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-14 gap-6">

            {/* Logo */}
            <button onClick={() => navigate('/home')} className="shrink-0 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--primary)' }}>
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-semibold text-[17px] tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Ride<span style={{ color: 'var(--primary)' }}>Compare</span>
              </span>
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
                      isActive ? 'bg-black/[0.06] dark:bg-white/[0.08]' : ''
                    }`}
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  })}
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              <button
                onClick={() => navigate('/compare')}
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 text-white text-[13px] font-medium transition-all"
                style={{ background: 'var(--primary)', borderRadius: '980px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
              >
                <Zap size={13} /> Compare
              </button>

              <button onClick={() => navigate('/profile')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
                style={{ background: avatar ? 'transparent' : 'var(--primary)', border: avatar ? '2px solid var(--primary)' : 'none' }}>
                {avatar
                  ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                  : initial}
              </button>

              <button onClick={() => setMenuOpen(o => !o)}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
                style={{ background: 'rgba(0,0,0,0.04)' }}>
                {menuOpen ? <X size={17} /> : <Menu size={17} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden px-5 py-3 space-y-1"
            style={{ background: 'var(--frosted-menu)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(128,128,128,0.12)' }}>
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 text-[15px] font-medium rounded-xl transition-colors ${
                    isActive ? 'bg-blue-50/80 dark:bg-blue-900/30' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                  }`}
                style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-primary)' })}
              >
                {label}
              </NavLink>
            ))}
            <div className="pt-2">
              <button onClick={() => { navigate('/compare'); setMenuOpen(false) }}
                className="btn-primary w-full">
                Compare Now
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── PAGE CONTENT ── */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* ── MOBILE BOTTOM NAV — Apple tab bar ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40"
        style={{
          background: 'var(--frosted-bar)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderTop: '1px solid rgba(128,128,128,0.15)',
        }}>
        <div className="flex items-end max-w-md mx-auto px-2 pb-safe">
          {BOTTOM_NAV.map((item, i) => {
            if (!item) return (
              <div key="cta" className="flex-1 flex justify-center items-center py-2">
                <button
                  onClick={() => navigate('/compare')}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
                  style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(0,113,227,0.4)' }}
                >
                  <Zap size={22} />
                </button>
              </div>
            )
            const { to, icon: Icon, label } = item
            return (
              <NavLink key={to} to={to}
                className="flex-1 flex flex-col items-center py-2.5 gap-0.5 text-[10px] font-medium transition-colors"
                style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : '#8E8E93' })}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
