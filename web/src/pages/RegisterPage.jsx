import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/auth'
import { Eye, EyeOff, ArrowRight, Mail, RefreshCw } from 'lucide-react'

// ── OTP input — 6 auto-advancing boxes ──────────────────────────────────────
function OtpInput({ value, onChange }) {
  const refsArr = useRef([])
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6)

  const focus = (i) => refsArr.current[i]?.focus()
  const setRef = (i) => (el) => { refsArr.current[i] = el }

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = digits.map((d, idx) => idx === i ? '' : d)
      onChange(next.join(''))
      if (i > 0) focus(i - 1)
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focus(i - 1)
    } else if (e.key === 'ArrowRight' && i < 5) {
      focus(i + 1)
    }
  }

  const handleChange = (i, e) => {
    const ch = e.target.value.replace(/\D/g, '').slice(-1)
    if (!ch) return
    const next = digits.map((d, idx) => idx === i ? ch : d)
    onChange(next.join(''))
    if (i < 5) focus(i + 1)
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted.padEnd(6, '').slice(0, 6))
    focus(Math.min(pasted.length, 5))
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={setRef(i)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onClick={() => focus(i)}
          style={{
            width: 48,
            height: 56,
            textAlign: 'center',
            fontSize: 24,
            fontWeight: 700,
            borderRadius: 12,
            border: d ? '2px solid rgba(99,102,241,0.7)' : '2px solid rgba(255,255,255,0.12)',
            background: d ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
            color: 'var(--color-text)',
            outline: 'none',
            transition: 'border-color 0.15s, background 0.15s',
            caretColor: 'transparent',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'rgba(99,102,241,0.9)'
            e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)'
          }}
          onBlur={e => {
            e.target.style.borderColor = d ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.12)'
            e.target.style.boxShadow = 'none'
          }}
        />
      ))}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const { register, verifyEmail } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Support deep-link from LoginPage (email not verified)
  const locationState = location.state || {}

  // Step 1 state
  const [form, setForm] = useState({ email: '', fullName: '', password: '' })
  const [show, setShow] = useState(false)

  // Step 2 state
  const [step, setStep] = useState(locationState.step || 1)
  const [pendingEmail, setPendingEmail] = useState(locationState.pendingEmail || '')
  const [otp, setOtp] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── Step 1: submit registration ──────────────────────────────────────────
  const handleRegister = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await register(form.email, form.fullName, form.password)
      if (res.requires_verification) {
        setPendingEmail(res.email)
        setStep(2)
        startResendCooldown()
      } else {
        navigate('/home')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: verify OTP ───────────────────────────────────────────────────
  const handleVerify = async e => {
    e.preventDefault()
    if (otp.replace(/\s/g, '').length < 6) {
      setError('Enter all 6 digits'); return
    }
    setLoading(true); setError('')
    try {
      await verifyEmail(pendingEmail, otp.trim())
      navigate('/home')
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed')
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  // ── Resend OTP ───────────────────────────────────────────────────────────
  const startResendCooldown = useCallback(() => {
    setResendCooldown(60)
    const id = setInterval(() => {
      setResendCooldown(c => {
        if (c <= 1) { clearInterval(id); return 0 }
        return c - 1
      })
    }, 1000)
  }, [])

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setError('')
    try {
      await authApi.resendOtp(pendingEmail)
      setOtp('')
      startResendCooldown()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not resend OTP')
    }
  }

  // ── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-6 max-w-md mx-auto">
      <div className="w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-xl">🚗</span>
          </div>
          <span className="text-xl font-bold">RideCompare</span>
        </div>

        {step === 1 ? (
          <>
            <h1 className="text-2xl font-bold mb-1">Create account</h1>
            <p className="text-muted text-sm mb-8">Start comparing rides for free</p>

            {error && (
              <div className="bg-error/10 border border-error/20 text-error text-sm px-4 py-3 rounded-xl mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Full Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Priya Nair"
                  value={form.fullName}
                  onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    className="input pr-12"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary mt-2">
                {loading ? (
                  <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Create Account <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-muted mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
            </p>
          </>
        ) : (
          <>
            {/* OTP Step */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-muted text-sm">
                We sent a 6-digit code to<br />
                <span className="text-white font-medium">{pendingEmail}</span>
              </p>
            </div>

            {error && (
              <div className="bg-error/10 border border-error/20 text-error text-sm px-4 py-3 rounded-xl mb-5 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              <OtpInput value={otp} onChange={setOtp} />

              <button
                type="submit"
                disabled={loading || otp.replace(/\D/g, '').length < 6}
                className="btn-primary"
              >
                {loading ? (
                  <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Verify Email <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <div className="text-center mt-5">
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw size={13} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Didn't get it? Resend"}
              </button>
            </div>

            <p className="text-center text-sm text-muted mt-4">
              <button
                onClick={() => { setStep(1); setError(''); setOtp('') }}
                className="text-primary font-semibold hover:underline"
              >
                ← Back to sign up
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
