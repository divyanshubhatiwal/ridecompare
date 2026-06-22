import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings, MapPin, Bell, LogOut, History,
  HelpCircle, ChevronRight, BarChart2, Calculator, ShieldCheck,
  MessageCircle, Check, ChevronDown, ChevronUp, Send, Loader,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useWhatsApp } from '../hooks/useWhatsApp'
import { notifyApi } from '../api/notify'

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

function WhatsAppPanel({ userPhone }) {
  const { phone, autoNotify, savePhone, toggleAutoNotify } = useWhatsApp()
  const [open, setOpen]         = useState(false)
  const [input, setInput]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [testing, setTesting]   = useState(false)
  const [testMsg, setTestMsg]   = useState('')
  const [twilioOk, setTwilioOk] = useState(null)

  // Pre-fill from backend user profile or localStorage
  useEffect(() => {
    const num = userPhone || phone
    if (num) setInput(num.replace(/^91/, ''))
  }, [userPhone, phone])

  // Check Twilio status once when panel opens
  useEffect(() => {
    if (!open || twilioOk !== null) return
    notifyApi.status().then(s => setTwilioOk(s.configured)).catch(() => setTwilioOk(false))
  }, [open])

  const handleSave = async () => {
    if (input.length !== 10) return
    setSaving(true)
    try {
      await notifyApi.saveNumber(input)   // save to backend DB
      savePhone(input)                     // save to localStorage for quick access
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      // still save locally even if backend fails
      savePhone(input)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true); setTestMsg('')
    try {
      await notifyApi.sendTest()
      setTestMsg('✅ Test message sent! Check your WhatsApp.')
    } catch (e) {
      const err = e.response?.data?.detail || 'Failed to send test'
      setTestMsg(`❌ ${err}`)
    } finally {
      setTesting(false)
    }
  }

  const activePhone = phone || (userPhone?.replace(/^91/, '') ? `91${userPhone.replace(/^91/, '')}` : '')
  const display = activePhone
    ? `+${activePhone.slice(0, 2)} ${activePhone.slice(2, 7)} ${activePhone.slice(7)}`
    : 'Add your number'

  return (
    <div className="mb-2 rounded-2xl border border-green-600/30 overflow-hidden"
         style={{ background: 'rgba(37,211,102,0.06)' }}>
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5"
      >
        <MessageCircle size={18} className="text-green-400 shrink-0" />
        <div className="flex-1 text-left">
          <p className="text-sm font-medium">WhatsApp Notifications</p>
          <p className="text-xs text-muted mt-0.5">{display}</p>
        </div>
        {activePhone && (
          <span className="text-[10px] font-bold bg-green-600/15 text-green-400 border border-green-600/25 px-1.5 py-0.5 rounded-full mr-1">
            ACTIVE
          </span>
        )}
        {open ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-green-600/15 pt-3 space-y-3">

          {/* Twilio status banner */}
          {twilioOk === false && (
            <div className="rounded-xl px-3 py-2 text-xs border"
                 style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)', color: '#F59E0B' }}>
              <p className="font-semibold mb-1">⚙️ Setup required (one-time)</p>
              <p>To receive real WhatsApp messages from RideCompare, add Twilio credentials in your <code className="bg-surface px-1 rounded">.env</code> file:</p>
              <code className="block mt-1 bg-surface p-1.5 rounded text-[10px] text-muted leading-relaxed">
                TWILIO_ACCOUNT_SID=ACxxxxxxx<br />
                TWILIO_AUTH_TOKEN=xxxxxxx<br />
                TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
              </code>
              <p className="mt-1">Then on WhatsApp send <strong>join &lt;your-sandbox-keyword&gt;</strong> to <strong>+1 415 523 8886</strong> to opt in.</p>
            </div>
          )}
          {twilioOk === true && (
            <div className="rounded-xl px-3 py-2 text-xs border"
                 style={{ background: 'rgba(37,211,102,0.08)', borderColor: 'rgba(37,211,102,0.2)', color: '#25D366' }}>
              ✅ Twilio connected — RideCompare can send messages to your WhatsApp.
            </div>
          )}

          {/* Phone input */}
          <div>
            <label className="text-xs text-muted font-medium block mb-1.5">Your WhatsApp number</label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 rounded-xl border border-border bg-surface text-sm text-muted shrink-0">
                🇮🇳 +91
              </div>
              <input
                type="tel"
                value={input}
                onChange={e => setInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210"
                className="input flex-1 py-2 text-sm"
                maxLength={10}
              />
              <button
                onClick={handleSave}
                disabled={input.length !== 10 || saving}
                className="px-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center gap-1"
                style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366' }}
              >
                {saving ? <Loader size={14} className="animate-spin" /> : saved ? <Check size={14} /> : 'Save'}
              </button>
            </div>
          </div>

          {/* Auto-notify toggle */}
          {activePhone && (
            <div className="flex items-center justify-between py-2 border-t border-green-600/15">
              <div>
                <p className="text-sm font-medium">Auto-send on compare</p>
                <p className="text-xs text-muted mt-0.5">Sends WhatsApp update automatically when results load</p>
              </div>
              <button
                onClick={toggleAutoNotify}
                className={`relative w-11 h-6 rounded-full transition-colors ${autoNotify ? 'bg-green-500' : 'bg-border'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoNotify ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          )}

          {/* Test button */}
          {activePhone && (
            <button
              onClick={handleTest}
              disabled={testing}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366' }}
            >
              {testing ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
              Send test message to my WhatsApp
            </button>
          )}
          {testMsg && <p className="text-xs text-center text-muted">{testMsg}</p>}

          {/* Info */}
          <div className="rounded-xl p-3 text-xs text-muted space-y-1"
               style={{ background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.12)' }}>
            <p className="font-semibold text-green-400">📲 You will receive:</p>
            <p>• Cheapest &amp; best value ride for your route</p>
            <p>• All providers ranked by price</p>
            <p>• Surge pricing alerts</p>
            <p>• Big savings / no-surge deal alerts</p>
          </div>
        </div>
      )}
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

  return (
    <div>
      <div className="sticky top-0 bg-bg/95 backdrop-blur border-b border-border z-10 px-5 py-4">
        <h1 className="text-lg font-bold">Profile</h1>
      </div>

      <div className="p-5">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-3xl font-bold text-primary mb-3">
            {initial}
          </div>
          <h2 className="text-xl font-semibold">{user?.full_name}</h2>
          <p className="text-muted text-sm mt-1">{user?.email}</p>
        </div>

        {/* Settings */}
        <p className="text-xs font-semibold text-muted tracking-widest mb-3">SETTINGS</p>
        <SettingRow icon={Settings} label="Ride Preferences" onClick={() => navigate('/preferences')} />
        <SettingRow icon={MapPin}   label="Saved Places"     onClick={() => navigate('/places')} />
        <SettingRow icon={Bell}     label="Price Alerts"     onClick={() => navigate('/alerts')} />
        <WhatsAppPanel userPhone={user?.phone_number} />

        {/* Tools */}
        <p className="text-xs font-semibold text-muted tracking-widest mb-3 mt-6">TOOLS</p>
        <SettingRow icon={BarChart2}   label="My Analytics"      onClick={() => navigate('/analytics')}  badge="New" />
        <SettingRow icon={Calculator}  label="Fare Calculator"   onClick={() => navigate('/calculator')} badge="New" />
        <SettingRow icon={ShieldCheck} label="Admin Dashboard"   onClick={() => navigate('/admin')}      badge="New" />

        {/* Account */}
        <p className="text-xs font-semibold text-muted tracking-widest mb-3 mt-6">ACCOUNT</p>
        <SettingRow icon={History}     label="Ride History"      onClick={() => navigate('/history')} />
        <SettingRow icon={HelpCircle}  label="Help & Support"    onClick={() => {}} />

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
