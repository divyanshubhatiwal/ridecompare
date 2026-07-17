import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings, MapPin, Bell, LogOut, History,
  HelpCircle, ChevronRight, BarChart2, Calculator, ShieldCheck, Shield,
  Check, ChevronDown, ChevronUp, Mail, Phone, Linkedin, Camera,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function SettingRow({ icon: Icon, label, onClick, right, badge }) {
  return (
    <button
      onClick={onClick}
      className="card flex items-center gap-3 mb-2 hover:border-primary/30 transition-colors w-full text-left"
    >
      <Icon size={18} className="text-primary shrink-0" />
      <span className="text-sm font-medium flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {right || <ChevronRight size={16} className="text-muted" />}
    </button>
  )
}

const FAQS = [
  { q: 'How does RideCompare work?', a: 'We compare fares from Uber, Ola, Rapido and InDrive in real time and show you the cheapest and fastest options side by side.' },
  { q: 'Is my location data stored?', a: 'Route searches are saved to your history so you can re-compare anytime. Location data is never sold or shared with third parties.' },
  { q: 'Why are fares different from the app?', a: 'Fares are estimates based on current conditions. Actual fares in the provider app may vary slightly due to real-time surge or promotions.' },
  { q: 'How do I set a price alert?', a: 'Go to Alerts from the menu. Set your route and a target price — we\'ll notify you when fares drop to your target.' },
]

function FaqSection() {
  const [open, setOpen] = useState(null)
  return (
    <div className="mb-2 rounded-2xl border border-border overflow-hidden">
      {FAQS.map((item, i) => (
        <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? '1px solid rgba(128,128,128,0.12)' : 'none' }}>
          <button
            onClick={() => setOpen(o => o === i ? null : i)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-surface transition-colors"
          >
            <HelpCircle size={15} className="text-primary shrink-0" />
            <span className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{item.q}</span>
            {open === i ? <ChevronUp size={14} className="text-muted shrink-0" /> : <ChevronDown size={14} className="text-muted shrink-0" />}
          </button>
          {open === i && (
            <div className="px-4 pb-3.5 pt-0 text-sm text-muted leading-relaxed" style={{ paddingLeft: 43 }}>
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initial = user?.full_name?.[0]?.toUpperCase() || '?'
  const fileRef = useRef(null)
  const [avatar, setAvatar] = useState(() => localStorage.getItem('rc_avatar') || '')

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      setAvatar(dataUrl)
      localStorage.setItem('rc_avatar', dataUrl)
      window.dispatchEvent(new CustomEvent('rc-avatar-change', { detail: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <div className="sticky top-0 bg-bg/95 backdrop-blur border-b border-border z-10 px-5 py-4">
        <h1 className="text-lg font-bold">Profile</h1>
      </div>

      <div className="p-5">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-3">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-24 h-24 rounded-full border-2 border-primary/30 flex items-center justify-center text-3xl font-bold text-primary overflow-hidden cursor-pointer"
              style={{ background: avatar ? 'transparent' : 'var(--primary-bg, rgba(0,113,227,0.12))' }}
            >
              {avatar
                ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                : initial
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'var(--primary)', border: '2px solid var(--bg)' }}
            >
              <Camera size={13} className="text-white" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <h2 className="text-xl font-semibold">{user?.full_name}</h2>
          <p className="text-muted text-sm mt-1">{user?.email}</p>
        </div>

        {/* Settings */}
        <p className="text-xs font-semibold text-muted tracking-widest mb-3">SETTINGS</p>
        <SettingRow icon={Settings} label="Ride Preferences" onClick={() => navigate('/preferences')} />
        <SettingRow icon={MapPin}   label="Saved Places"     onClick={() => navigate('/places')} />
        <SettingRow icon={Bell}     label="Price Alerts"     onClick={() => navigate('/alerts')} />
        <SettingRow icon={Shield}   label="Safety"           onClick={() => navigate('/safety')}  badge="New" />

        {/* Tools */}
        <p className="text-xs font-semibold text-muted tracking-widest mb-3 mt-6">TOOLS</p>
        <SettingRow icon={BarChart2}   label="My Analytics"      onClick={() => navigate('/analytics')}  badge="New" />
        <SettingRow icon={Calculator}  label="Fare Calculator"   onClick={() => navigate('/calculator')} badge="New" />
        <SettingRow icon={ShieldCheck} label="Admin Dashboard"   onClick={() => navigate('/admin')}      badge="New" />

        {/* Account */}
        <p className="text-xs font-semibold text-muted tracking-widest mb-3 mt-6">ACCOUNT</p>
        <SettingRow icon={History}     label="Ride History"      onClick={() => navigate('/history')} />
        <SettingRow icon={HelpCircle}  label="Help & Support"    onClick={() => {}} />

        {/* FAQ + Contact Us */}
        <p className="text-xs font-semibold text-muted tracking-widest mb-3 mt-6">HELP & SUPPORT</p>

        <FaqSection />

        <a
          href="mailto:divyanshubhatiwal99@gmail.com"
          className="card flex items-center gap-3 mb-2 hover:border-primary/30 transition-colors w-full text-left"
          style={{ display: 'flex', textDecoration: 'none' }}
        >
          <Mail size={18} className="text-primary shrink-0" />
          <span className="text-sm font-medium flex-1">Email Us</span>
          <span className="text-xs text-muted">divyanshubhatiwal99@gmail.com</span>
        </a>
        <a
          href="https://www.linkedin.com/in/divyanshu-bhatiwal-0587b3288/"
          target="_blank"
          rel="noopener noreferrer"
          className="card flex items-center gap-3 mb-2 hover:border-primary/30 transition-colors w-full text-left"
          style={{ display: 'flex', textDecoration: 'none' }}
        >
          <Linkedin size={18} style={{ color: '#0A66C2' }} className="shrink-0" />
          <span className="text-sm font-medium flex-1">LinkedIn</span>
          <span className="text-xs text-muted">Divyanshu Bhatiwal</span>
        </a>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 mt-8 py-3.5 rounded-xl border border-error/30 text-error font-semibold hover:bg-error/10 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
