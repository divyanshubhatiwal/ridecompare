import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Search, TrendingUp, Zap, Route, RefreshCw } from 'lucide-react'
import { analyticsApi } from '../api/analytics'
import { PageSpinner } from '../components/Spinner'

export default function AdminPage() {
  const navigate = useNavigate()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const load = () => {
    setLoading(true)
    analyticsApi.getAdminStats()
      .then(setStats)
      .catch(err => setError(err.response?.data?.detail || 'Failed to load admin stats'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 bg-bg/95 backdrop-blur border-b border-border z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-surface">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold flex-1">Admin Dashboard</h1>
        <span className="text-xs bg-surge/10 text-surge border border-surge/20 px-2 py-0.5 rounded-full font-medium">
          Admin
        </span>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-surface text-muted">
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? <PageSpinner /> : error ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔒</p>
          <p className="font-semibold">{error}</p>
          <p className="text-muted text-sm mt-2">Admin access only</p>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Users',    value: stats.total_users,     icon: Users,      color: 'text-primary' },
              { label: 'Total Searches', value: stats.total_searches,  icon: Search,     color: 'text-fastest' },
              { label: 'Searches Today', value: stats.searches_today,  icon: TrendingUp, color: 'text-cheapest' },
              { label: 'Avg Results',    value: stats.avg_results,     icon: Zap,        color: 'text-warning' },
              { label: 'New Users (7d)', value: stats.new_users_week,  icon: Users,      color: 'text-accent' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card text-center py-5">
                <Icon size={18} className={`${color} mx-auto mb-2`} />
                <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
                <p className="text-xs text-muted mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Popular routes */}
          {stats.popular_routes?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <Route size={15} className="text-primary" /> Popular Routes
              </h2>
              {stats.popular_routes.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 font-bold">
                      {i + 1}
                    </span>
                    <span className="text-xs text-muted truncate">{r.route}</span>
                  </div>
                  <span className="text-xs text-muted ml-2 shrink-0">{r.count}×</span>
                </div>
              ))}
            </div>
          )}

          {/* Provider win rate */}
          {Object.keys(stats.provider_stats || {}).length > 0 && (
            <div className="card">
              <h2 className="font-semibold mb-3 text-sm">Provider — Times Cheapest</h2>
              {Object.entries(stats.provider_stats)
                .sort((a, b) => b[1].cheapest_wins - a[1].cheapest_wins)
                .map(([p, s]) => {
                  const total = Object.values(stats.provider_stats)
                    .reduce((a, b) => a + b.cheapest_wins, 0)
                  const pct = total ? Math.round((s.cheapest_wins / total) * 100) : 0
                  return (
                    <div key={p} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                      <span className="text-sm capitalize flex-1">{p.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-cheapest rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-cheapest w-8 text-right">{s.cheapest_wins}×</span>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
