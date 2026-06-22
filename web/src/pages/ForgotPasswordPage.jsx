import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { ArrowRight, Mail, Lock, RefreshCw, Eye, EyeOff } from 'lucide-react'

function OtpInput({ value, onChange }) {
  const refsArr = useRef([])
  const digits  = value.split('').concat(Array(6).fill('')).slice(0, 6)
  const focus    = i => refsArr.current[i]?.focus()
  const setRef   = i => el => { refsArr.current[i] = el }

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      onChange(digits.map((d, idx) => idx === i ? '' : d).join(''))
      if (i > 0) focus(i - 1)
    } else if (e.key === 'ArrowLeft'  && i > 0) focus(i - 1)
    else if (e.key === 'ArrowRight' && i < 5) focus(i + 1)
  }

  const handleChange = (i, e) => {
    const ch = e.target.value.replace(/\D/g, '').slice(-1)
    if (!ch) return
    onChange(digits.map((d, idx) => idx === i ? ch : d).join(''))
    if (i < 5) focus(i + 1)
  }

  const handlePaste = e => {
    e.preventDefault()
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(p.padEnd(6, '').slice(0, 6))
    focus(Math.min(p.length, 5))
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i} ref={setRef(i)}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onClick={() => focus(i)}
          style={{
            width: 48, height: 56, textAlign: 'center', fontSize: 24, fontWeight: 700,
            borderRadius: 12, caretColor: 'transparent',
            border: d ? '2px solid rgba(99,102,241,0.7)' : '2px solid rgba(255,255,255,0.12)',
            background: d ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
            color: 'var(--color-text)', outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.9)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)' }}
          onBlur={e  => { e.target.style.borderColor = d ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
        />
      ))}
    </div>
  )
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep]           = useState(1) // 1=email, 2=otp+newpass
  const [email, setEmail]         = useState('')
  const [otp, setOtp]             = useState('')
  const [newPass, setNewPass]     = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [cooldown, setCooldown]   = useState(0)

  const startCooldown = useCallback(() => {
    setCooldown(60)
    const id = setInterval(() => setCooldown(c => { if (c <= 1) { clearInterval(id); return 0 } return c - 1 }), 1000)
  }, [])

  // Step 1: send reset code
  const handleSendCode = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await authApi.forgotPassword(email)
      setStep(2)
      startCooldown()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: verify OTP + set new password
  const handleReset = async e => {
    e.preventDefault()
    if (otp.replace(/\D/g, '').length < 6) { setError('Enter all 6 digits'); return }
    if (newPass.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    try {
      await authApi.resetPassword(email, otp, newPass)
      setSuccess('Password reset! Redirecting to login…')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed')
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setError('')
    try {
      await authApi.forgotPassword(email)
      setOtp('')
      startCooldown()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not resend')
    }
  }

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
            <div className="mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mb-4">
                <Lock size={26} className="text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Forgot password?</h1>
              <p className="text-muted text-sm">Enter your email and we'll send a reset code</p>
            </div>

            {error && (
              <div className="bg-error/10 border border-error/20 text-error text-sm px-4 py-3 rounded-xl mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Email</label>
                <input
                  type="email" className="input" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading
                  ? <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Mail size={16} /> Send Reset Code</>
                }
              </button>
            </form>

            <p className="text-center text-sm text-muted mt-6">
              <Link to="/login" className="text-primary font-semibold hover:underline">← Back to login</Link>
            </p>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-muted text-sm">
                Reset code sent to<br />
                <span className="text-white font-medium">{email}</span>
              </p>
            </div>

            {error && (
              <div className="bg-error/10 border border-error/20 text-error text-sm px-4 py-3 rounded-xl mb-5 text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl mb-5 text-center">
                {success}
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-muted mb-3 text-center">Enter 6-digit code</label>
                <OtpInput value={otp} onChange={setOtp} />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input pr-12"
                    placeholder="Min. 8 characters"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    required minLength={8}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.replace(/\D/g, '').length < 6 || newPass.length < 8}
                className="btn-primary"
              >
                {loading
                  ? <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Lock size={15} /> Reset Password <ArrowRight size={15} /></>
                }
              </button>
            </form>

            <div className="text-center mt-5">
              <button onClick={handleResend} disabled={cooldown > 0}
                className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <RefreshCw size={13} />
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Didn't get it? Resend"}
              </button>
            </div>

            <p className="text-center text-sm text-muted mt-3">
              <button onClick={() => { setStep(1); setError(''); setOtp('') }}
                className="text-primary font-semibold hover:underline">
                ← Change email
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
