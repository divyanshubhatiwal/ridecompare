import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import LoginSplash from '../components/LoginSplash'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [splashName, setSplashName] = useState(null) // null = hidden

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true); setError(''); setUnverifiedEmail('')
    try {
      const u = await login(form.email, form.password)
      setSplashName(u?.full_name?.split(' ')[0] || 'there')
    } catch (err) {
      const detail = err.response?.data?.detail || 'Login failed'
      if (detail === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(form.email)
        setError('Please verify your email first. A new code was sent.')
      } else {
        setError(detail)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    {splashName !== null && (
      <LoginSplash name={splashName} onDone={() => navigate('/home')} />
    )}
    <div className="min-h-screen flex items-center justify-center p-6 max-w-md mx-auto">
      <div className="w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-xl">🚗</span>
          </div>
          <span className="text-xl font-bold">RideCompare</span>
        </div>

        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-muted text-sm mb-8">Sign in to compare rides</p>

        {error && (
          <div className="bg-error/10 border border-error/20 text-error text-sm px-4 py-3 rounded-xl mb-5">
            {error}
            {unverifiedEmail && (
              <div className="mt-2">
                <Link
                  to="/register"
                  state={{ pendingEmail: unverifiedEmail, step: 2 }}
                  className="underline font-semibold"
                >
                  Enter verification code →
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-muted">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                className="input pr-12"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
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
              <>Sign In <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
    </>
  )
}
