import { useState } from 'react'
import { MessageCircle, Check, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { notifyApi } from '../api/notify'
import { useWhatsAppAuto, apiError } from '../hooks/useWhatsAppUpdates'

const WA_GREEN = '#25D366'

export default function WhatsAppSettings() {
  const { user, refreshUser } = useAuth()
  const saved = user?.phone_number ? user.phone_number.replace(/^91/, '') : ''
  const [phone, setPhone]   = useState(saved)
  const [auto, setAuto]     = useWhatsAppAuto()
  const [busy, setBusy]     = useState('')
  const [status, setStatus] = useState(null)

  const save = async () => {
    setBusy('save'); setStatus(null)
    try {
      await notifyApi.saveNumber(phone)
      await refreshUser()
      setStatus({ ok: true, msg: 'Number saved.' })
    } catch (err) {
      setStatus({ ok: false, msg: apiError(err, 'Could not save number.') })
    } finally { setBusy('') }
  }

  const test = async () => {
    setBusy('test'); setStatus(null)
    try {
      if (phone !== saved) { await notifyApi.saveNumber(phone); await refreshUser() }
      await notifyApi.sendTest()
      setStatus({ ok: true, msg: 'Test message sent — check WhatsApp.' })
    } catch (err) {
      setStatus({ ok: false, msg: apiError(err, 'Could not send the test message.') })
    } finally { setBusy('') }
  }

  const valid = phone.length === 10

  return (
    <div className="card mb-2 p-4">
      <div className="flex items-center gap-3 mb-3">
        <MessageCircle size={18} style={{ color: WA_GREEN }} className="shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold t-primary">WhatsApp updates</p>
          <p className="text-xs t-secondary">Get each fare comparison on WhatsApp.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <span className="flex items-center px-3 rounded-xl text-sm t-secondary shrink-0" style={{ background: 'var(--tint)' }}>+91</span>
        <input type="tel" inputMode="numeric" className="input flex-1" placeholder="98765 43210"
          value={phone} maxLength={10}
          onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
      </div>

      <div className="flex gap-2 mb-3">
        <button onClick={save} disabled={!valid || busy || phone === saved}
          className="flex-1 py-2 rounded-xl text-[13px] font-semibold disabled:opacity-40"
          style={{ background: 'var(--tint)', color: 'var(--text-primary)' }}>
          {busy === 'save' ? 'Saving…' : 'Save number'}
        </button>
        <button onClick={test} disabled={!valid || busy}
          className="flex-1 py-2 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-40"
          style={{ background: WA_GREEN }}>
          <Send size={13} /> {busy === 'test' ? 'Sending…' : 'Send test'}
        </button>
      </div>

      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-[13px] t-primary">Send after every search</span>
        <input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)}
          className="w-5 h-5" style={{ accentColor: WA_GREEN }} />
      </label>

      {status && (
        <p className="text-[12px] mt-3 flex items-start gap-1.5" style={{ color: status.ok ? WA_GREEN : '#EF4444' }}>
          {status.ok && <Check size={13} className="mt-0.5 shrink-0" />} {status.msg}
        </p>
      )}
    </div>
  )
}
