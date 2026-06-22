import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, TrendingDown, Clock, Award, Search,
  Flame, Target, Trophy, Star, Leaf,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { analyticsApi } from '../api/analytics'
import { PageSpinner } from '../components/Spinner'
import AnimatedCounter from '../components/AnimatedCounter'
import useRipple from '../hooks/useRipple'

/* ── Gamification helpers ── */
function getLevel(searches) {
  if (searches >= 100) return { name: '💎 Savings Hero',   color: 'text-primary',  next: null,  icon: Trophy  }
  if (searches >= 50)  return { name: '🏆 Power User',     color: 'text-warning',  next: 100,   icon: Trophy  }
  if (searches >= 20)  return { name: '⚡ Regular',         color: 'text-fastest',  next: 50,    icon: Star    }
  if (searches >= 5)   return { name: '🚗 Explorer',        color: 'text-accent',   next: 20,    icon: Star    }
  return                      { name: '🌱 Newbie',          color: 'text-muted',    next: 5,     icon: Target  }
}

/* ── Budget helpers (localStorage) ── */
const BUDGET_KEY = 'rc_monthly_budget'
function loadBudget() {
  try { return JSON.parse(localStorage.getItem(BUDGET_KEY)) || { amount: 2000, enabled: false } }
  catch { return { amount: 2000, enabled: false } }
}
function saveBudget(b) { localStorage.setItem(BUDGET_KEY, JSON.stringify(b)) }

/* ── Recharts tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-primary">Avg fare: ₹{payload[0]?.value}</p>
      {payload[1] && <p className="text-muted">{payload[1]?.value} searches</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [budget, setBudget]   = useState(loadBudget)
  const [editBudget, setEditBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')

  useEffect(() => {
    analyticsApi.getSummary().then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const fmt = n => n != null ? `₹${n.toLocaleString('en-IN')}` : '—'

  const toggleBudget = () => {
    const next = { ...budget, enabled: !budget.enabled }
    setBudget(next); saveBudget(next)
  }
  const saveBudgetAmount = () => {
    const amt = parseInt(budgetInput)
    if (amt > 0) {
      const next = { amount: amt, enabled: true }
      setBudget(next); saveBudget(next)
    }
    setEditBudget(false)
  }

  const ripple = useRipple()

  if (loading) return <PageSpinner />
  if (!data)   return <div className="text-center py-16 text-muted">Failed to load analytics</div>

  const level = getLevel(data.total_searches)
  const levelProgress = level.next
    ? Math.min(100, Math.round((data.total_searches / level.next) * 100))
    : 100

  // Budget utilisation (this month)
  const budgetUsed    = data.monthly_spend || 0
  const budgetPct     = budget.amount > 0 ? Math.min(100, Math.round((budgetUsed / budget.amount) * 100)) : 0
  const budgetColor   = budgetPct >= 90 ? 'bg-surge' : budgetPct >= 70 ? 'bg-warning' : 'bg-cheapest'

  // Provider loyalty: combine wins + appearances
  const allProviders = new Set([
    ...Object.keys(data.provider_wins || {}),
    ...Object.keys(data.provider_appearances || {}),
  ])
  const providerRows = [...allProviders].map(p => ({
    name: p.replace(/_/g, ' '),
    wins: data.provider_wins?.[p] || 0,
    appearances: data.provider_appearances?.[p] || 0,
  })).sort((a, b) => b.wins - a.wins)
  const totalWins = providerRows.reduce((s, r) => s + r.wins, 0)

  return (
    <div>
      <div className="sticky top-0 bg-bg/95 backdrop-blur border-b border-border z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-surface">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold">My Analytics</h1>
        {data.streak_days > 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs font-bold text-warning bg-warning/10 border border-warning/20 px-2 py-1 rounded-full">
            <Flame size={12} /> {data.streak_days}d streak
          </span>
        )}
      </div>

      <div className="p-4 space-y-5">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-3 stagger">
          {[
            { label: 'Total Searches',    raw: data.total_searches,      prefix: '',  color: 'text-primary',  icon: Search      },
            { label: 'Avg Cheapest Fare', raw: data.avg_fare,            prefix: '₹', color: 'text-fastest',  icon: TrendingDown },
            { label: 'Best Fare Found',   raw: data.cheapest_fare_ever,  prefix: '₹', color: 'text-cheapest', icon: Award       },
            { label: 'Total Saved',       raw: data.total_savings,       prefix: '₹', color: 'text-warning',  icon: Leaf        },
          ].map(({ label, raw, prefix, color, icon: Icon }) => (
            <div key={label} className="card-lift text-center py-5 cursor-default">
              <Icon size={18} className={`${color} mx-auto mb-2`} />
              <p className={`text-2xl font-bold ${color}`}>
                <AnimatedCounter value={raw || 0} prefix={prefix} duration={900} />
              </p>
              <p className="text-xs text-muted mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Savings callout ── */}
        {data.total_savings > 0 && (
          <div className="card savings-strip bg-cheapest/5 border-cheapest/20 flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <div>
              <p className="font-semibold text-sm">You've saved {fmt(data.total_savings)}</p>
              <p className="text-xs text-muted mt-0.5">By picking cheapest option vs most expensive</p>
            </div>
          </div>
        )}

        {/* ── Gamification: Level card ── */}
        <div className="card-lift">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Trophy size={15} className="text-warning" /> Your Level
            </h2>
            <span className={`text-sm font-bold ${level.color}`}>{level.name}</span>
          </div>
          <div className="w-full h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-muted">
            <span>{data.total_searches} searches</span>
            {level.next
              ? <span>{data.total_searches} / {level.next} to next level</span>
              : <span>🎉 Max level reached!</span>
            }
          </div>
          {data.streak_days > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Flame size={15} className="text-warning" />
              <span>
                <span className="font-bold text-warning">{data.streak_days}-day</span> search streak — keep it up!
              </span>
            </div>
          )}
        </div>

        {/* ── Monthly Budget Tracker ── */}
        <div className="card-lift">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Target size={15} className="text-primary" /> Monthly Budget
            </h2>
            <button
              onClick={(e) => { ripple(e); toggleBudget() }}
              className={`ripple-btn text-xs font-semibold px-2.5 py-1 rounded-full border transition-all active:scale-95 ${
                budget.enabled
                  ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                  : 'bg-surface text-muted border-border hover:border-primary/30'
              }`}
            >
              {budget.enabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {budget.enabled && (
            <>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="text-2xl font-bold">
                    {fmt(budgetUsed)}
                    <span className="text-sm text-muted font-normal"> / {fmt(budget.amount)}</span>
                  </p>
                  <p className="text-xs text-muted mt-0.5">spent this month ({data.monthly_searches} rides)</p>
                </div>
                <button
                  onClick={() => { setBudgetInput(String(budget.amount)); setEditBudget(true) }}
                  className="text-xs text-primary font-medium"
                >
                  Edit
                </button>
              </div>
              <div className="w-full h-3 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${budgetColor}`}
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
              <p className="text-xs text-muted mt-1.5">
                {budgetPct >= 90
                  ? `⚠️ ${budgetPct}% used — almost at budget!`
                  : budgetPct >= 70
                  ? `⚡ ${budgetPct}% used — getting close`
                  : `✅ ${budgetPct}% of budget used — you're on track`
                }
              </p>
            </>
          )}

          {!budget.enabled && (
            <p className="text-sm text-muted">Turn on to track monthly ride spending against a goal.</p>
          )}

          {editBudget && (
            <div className="mt-3 flex gap-2">
              <input
                type="number"
                value={budgetInput}
                onChange={e => setBudgetInput(e.target.value)}
                className="input flex-1 py-2 text-sm"
                placeholder="₹2000"
                autoFocus
              />
              <button onClick={saveBudgetAmount} className="bg-primary text-white px-4 rounded-xl text-sm font-semibold">Save</button>
              <button onClick={() => setEditBudget(false)} className="text-muted px-2 text-sm">Cancel</button>
            </div>
          )}
        </div>

        {/* ── Fare trend chart ── */}
        {data.chart_data?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold mb-4 text-sm">Fare Trend — Last 7 Days</h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.chart_data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,30,46,1)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avg" fill="#6366F1" radius={[6, 6, 0, 0]} name="Avg Fare" maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Best time to book ── */}
        {data.best_hours?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <Clock size={15} className="text-primary" /> Best Time to Book
            </h2>
            <div className="space-y-1">
              {data.best_hours.map((h, i) => {
                const label12 = hr => `${hr % 12 || 12}:00 ${hr >= 12 ? 'PM' : 'AM'}`
                return (
                  <div key={h.hour} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        i === 0 ? 'bg-cheapest/20 text-cheapest' : i === 1 ? 'bg-fastest/20 text-fastest' : 'bg-muted/10 text-muted'
                      }`}>{i + 1}</span>
                      <span className="text-sm">{label12(h.hour)} – {label12(h.hour + 1)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-sm text-cheapest">Avg ₹{h.avg_fare}</span>
                      <span className="text-xs text-muted ml-2">({h.count} searches)</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted mt-3">Based on your personal search history</p>
          </div>
        )}

        {/* ── Provider Loyalty ── */}
        {providerRows.length > 0 && (
          <div className="card">
            <h2 className="font-semibold mb-1 text-sm flex items-center gap-2">
              <Award size={15} className="text-primary" /> Provider Loyalty
            </h2>
            <p className="text-xs text-muted mb-3">How often each provider was cheapest vs how often it appeared</p>
            <div className="space-y-3">
              {providerRows.map(({ name, wins, appearances }) => {
                const winPct = totalWins > 0 ? Math.round((wins / totalWins) * 100) : 0
                const appPct = appearances > 0 ? Math.min(100, Math.round((appearances / (data.total_searches * 2)) * 100)) : 0
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm capitalize font-medium">{name}</span>
                      <span className="text-xs text-muted">{wins} cheapest wins · {appearances} appearances</span>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      {/* Win rate bar */}
                      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-cheapest rounded-full" style={{ width: `${winPct}%` }} />
                      </div>
                      <span className="text-xs text-muted w-10 text-right">{winPct}% 🏆</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {data.total_searches === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📊</p>
            <p className="font-semibold">No data yet</p>
            <p className="text-muted text-sm mt-2">Search for rides to see your analytics</p>
          </div>
        )}

      </div>
    </div>
  )
}
