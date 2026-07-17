import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ShieldCheck, MessageCircle,
  Share2, Check, AlertTriangle, Info, ChevronDown, ChevronUp, Loader,
} from 'lucide-react'
import { notifyApi } from '../api/notify'

const TIPS = [
  { icon: '🔍', title: 'Verify the vehicle', desc: 'Check the car number plate, model, and colour match the app details before getting in.' },
  { icon: '📸', title: 'Check driver photo', desc: "Confirm the driver's face matches the profile photo shown in the app." },
  { icon: '📍', title: 'Share your trip', desc: 'Use the Share Trip button below to send your route to a trusted contact before riding.' },
  { icon: '🚪', title: 'Sit in the back', desc: 'Prefer the back seat — it gives you more options if you need to exit quickly.' },
  { icon: '🔔', title: 'Trust your gut', desc: 'If something feels wrong, cancel the ride and request another one. Your safety comes first.' },
]

const CHECKLIST = [
  'Driver name matches',
  'Vehicle plate matches',
  'Car colour matches',
  'Driver photo matches',
  'Route looks correct',
]

function TipCard({ icon, title, desc }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className="w-full text-left card mb-2 transition-colors hover:border-primary/30"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl w-8 shrink-0">{icon}</span>
        <span className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{title}</span>
        {open ? <ChevronUp size={14} className="text-muted shrink-0" /> : <ChevronDown size={14} className="text-muted shrink-0" />}
      </div>
      {open && <p className="text-sm text-muted mt-2 leading-relaxed pl-11">{desc}</p>}
    </button>
  )
}

export default function SafetyPage() {
  const navigate = useNavigate()

  const [ecName]  = useState(() => localStorage.getItem('rc_ec_name')  || '')
  const [ecPhone] = useState(() => localStorage.getItem('rc_ec_phone') || '')

  const [checks,     setChecks]     = useState(Array(CHECKLIST.length).fill(false))
  const [sosSending, setSosSending] = useState(false)
  const [sosMsg,     setSosMsg]     = useState('')
  const allChecked = checks.every(Boolean)

  const handleSOS = async () => {
    if (!ecPhone) { setSosMsg('⚠️ Save an emergency contact first.'); return }
    setSosSending(true)
    setSosMsg('Sending…')
    try {
      await notifyApi.sendSOS(ecPhone, ecName)
      setSosMsg(`✅ WhatsApp alert sent to ${ecName || ecPhone}`)
    } catch (err) {
      const detail = err?.response?.data?.detail
      setSosMsg(detail ? `❌ ${detail}` : '❌ Failed — check your connection')
    } finally {
      setSosSending(false)
      setTimeout(() => setSosMsg(''), 6000)
    }
  }

const handleShareTrip = () => {
    const pickup = localStorage.getItem('rc_last_pickup') || 'my pickup location'
    const dest   = localStorage.getItem('rc_last_dest')   || 'my destination'
    const msg    = encodeURIComponent(`📍 I'm taking a ride from *${pickup}* to *${dest}*. Tracking my trip — will update when I arrive. 🚗`)
    const to     = ecPhone ? `https://wa.me/91${ecPhone}?text=${msg}` : `https://wa.me/?text=${msg}`
    window.open(to, '_blank')
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 px-5 py-4 flex items-center gap-3 border-b border-border"
           style={{ background: 'var(--frosted-nav)', backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate(-1)} className="text-muted hover:text-primary transition-colors">
          <ChevronLeft size={22} />
        </button>
        <ShieldCheck size={20} className="text-primary" />
        <h1 className="text-lg font-bold flex-1">Safety</h1>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-7">

        {/* SOS */}
        <section>
          <p className="text-xs font-semibold text-muted tracking-widest mb-3">EMERGENCY</p>
          <div className="rounded-2xl p-5 space-y-3"
               style={{ background: 'rgba(255,59,48,0.07)', border: '1px solid rgba(255,59,48,0.25)' }}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} style={{ color: '#FF3B30' }} />
              <p className="text-sm font-semibold" style={{ color: '#FF3B30' }}>SOS — Emergency Alert</p>
            </div>
            <p className="text-xs text-muted">Message is sent automatically — no need to open WhatsApp.</p>
            <button
              onClick={handleSOS}
              disabled={sosSending}
              className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
              style={{ background: '#FF3B30' }}
            >
              {sosSending
                ? <Loader size={16} className="animate-spin" />
                : <MessageCircle size={16} />}
              {sosSending ? 'Sending…' : 'Send WhatsApp SOS'}
            </button>
            {sosMsg && (
              <p className="text-xs font-medium text-center py-1.5 rounded-lg"
                 style={{
                   color:      sosMsg.startsWith('✅') ? '#30D158' : sosMsg.startsWith('Sending') || sosMsg.startsWith('Call') ? '#FF9F0A' : '#FF3B30',
                   background: sosMsg.startsWith('✅') ? 'rgba(48,209,88,0.1)' : sosMsg.startsWith('Sending') || sosMsg.startsWith('Call') ? 'rgba(255,159,10,0.1)' : 'rgba(255,59,48,0.1)',
                 }}>
                {sosMsg}
              </p>
            )}
          </div>
        </section>


        {/* Share Trip */}
        <section>
          <p className="text-xs font-semibold text-muted tracking-widest mb-3">TRIP SHARING</p>
          <button
            onClick={handleShareTrip}
            className="w-full card flex items-center gap-4 hover:border-green-500/30 transition-colors"
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                 style={{ background: 'rgba(37,211,102,0.12)' }}>
              <Share2 size={20} style={{ color: '#25D366' }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Share Trip on WhatsApp</p>
              <p className="text-xs text-muted mt-0.5">Sends your route to your emergency contact</p>
            </div>
          </button>
        </section>

        {/* Pre-ride Checklist */}
        <section>
          <p className="text-xs font-semibold text-muted tracking-widest mb-3">PRE-RIDE CHECKLIST</p>
          <div className="card space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Info size={14} className="text-primary shrink-0" />
              <p className="text-xs text-muted">Verify these before you get in the vehicle.</p>
            </div>
            {CHECKLIST.map((item, i) => (
              <button
                key={i}
                onClick={() => setChecks(c => c.map((v, j) => j === i ? !v : v))}
                className="w-full flex items-center gap-3 text-left"
              >
                <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors"
                     style={{
                       background:   checks[i] ? 'var(--primary)' : 'transparent',
                       borderColor:  checks[i] ? 'var(--primary)' : 'rgba(128,128,128,0.4)',
                     }}>
                  {checks[i] && <Check size={12} className="text-white" />}
                </div>
                <span className="text-sm" style={{
                  color: checks[i] ? 'var(--text-secondary)' : 'var(--text-primary)',
                  textDecoration: checks[i] ? 'line-through' : 'none',
                }}>{item}</span>
              </button>
            ))}
            {allChecked && (
              <div className="rounded-xl px-3 py-2 text-xs font-semibold text-center"
                   style={{ background: 'rgba(48,209,88,0.1)', color: '#30D158' }}>
                ✅ All checks passed — safe to ride!
              </div>
            )}
          </div>
        </section>

        {/* Safety Tips */}
        <section>
          <p className="text-xs font-semibold text-muted tracking-widest mb-3">SAFETY TIPS</p>
          {TIPS.map((t, i) => <TipCard key={i} {...t} />)}
        </section>

      </div>
    </div>
  )
}
