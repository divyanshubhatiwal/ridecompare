import { useState, useEffect } from 'react'
import { Plus, Trash2, Bell } from 'lucide-react'
import { alertsApi } from '../api/alerts'
import { PageSpinner } from '../components/Spinner'

function CreateAlertModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    alert_type: 'price_below',
    pickup_address: 'My Location',
    pickup_lat: 12.9716,
    pickup_lng: 77.5946,
    destination_address: '',
    destination_lat: 12.9121,
    destination_lng: 77.6446,
    threshold_amount: 200,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await alertsApi.create(form)
      onCreated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create alert')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-0">
      <div className="bg-surface w-full max-w-md rounded-t-3xl p-6 border-t border-border">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Create Alert</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-card text-muted">✕</button>
        </div>

        {error && <div className="bg-error/10 border border-error/20 text-error text-sm px-3 py-2 rounded-xl mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Alert Type</label>
            <div className="flex gap-3">
              {['price_below', 'surge_ended'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, alert_type: t }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    form.alert_type === t
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted hover:border-primary/30'
                  }`}
                >
                  {t === 'price_below' ? '⬇️ Price Below' : '🔥 Surge Ended'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Destination</label>
            <input
              className="input"
              placeholder="e.g. Airport, Mall..."
              value={form.destination_address}
              onChange={e => setForm(p => ({ ...p, destination_address: e.target.value }))}
              required
            />
          </div>

          {form.alert_type === 'price_below' && (
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Threshold: ₹{form.threshold_amount}
              </label>
              <input
                type="range" min="50" max="1000" step="50"
                value={form.threshold_amount}
                onChange={e => setForm(p => ({ ...p, threshold_amount: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>₹50</span><span>₹1000</span>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Set Alert'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = () => {
    alertsApi.list().then(setAlerts).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDelete = async (id) => {
    await alertsApi.delete(id)
    setAlerts(a => a.filter(x => x.id !== id))
  }

  return (
    <div>
      <div className="sticky top-0 bg-bg/95 backdrop-blur border-b border-border z-10 px-5 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Price Alerts</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/20"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <PageSpinner />
        ) : alerts.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={64} className="text-muted mx-auto mb-4" />
            <p className="font-semibold text-lg">No active alerts</p>
            <p className="text-muted text-sm mt-2 mb-6">Tap + to create a price or surge alert</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary max-w-xs mx-auto">
              <Plus size={16} /> Create Alert
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className="card flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {alert.alert_type === 'price_below' ? '⬇️' : '🔥'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    {alert.alert_type === 'price_below' ? `Price below ₹${alert.threshold_amount}` : 'Surge ended'}
                  </p>
                  <p className="text-xs text-muted mt-0.5 truncate">To: {alert.destination_address}</p>
                  <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
                    alert.is_active ? 'bg-cheapest/10 text-cheapest' : 'bg-muted/10 text-muted'
                  }`}>
                    {alert.is_active ? '● Active' : '● Inactive'}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(alert.id)}
                  className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-error/10 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateAlertModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  )
}
