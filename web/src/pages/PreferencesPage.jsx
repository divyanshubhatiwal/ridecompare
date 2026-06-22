import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { prefsApi } from '../api/preferences'
import { PageSpinner } from '../components/Spinner'

export default function PreferencesPage() {
  const navigate = useNavigate()
  const [prefs, setPrefs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    prefsApi.get().then(setPrefs).finally(() => setLoading(false))
  }, [])

  const update = async (patch) => {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    setSaving(true)
    try {
      const updated = await prefsApi.update(patch)
      setPrefs(updated)
    } finally {
      setSaving(false)
    }
  }

  const SwitchRow = ({ label, subtitle, field, icon }) => (
    <div className="card flex items-center gap-3 mb-2">
      <span className="text-xl shrink-0">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted mt-0.5">{subtitle}</p>
      </div>
      <button
        onClick={() => update({ [field]: !prefs?.[field] })}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${prefs?.[field] ? 'bg-primary' : 'bg-border'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${prefs?.[field] ? 'translate-x-6' : ''}`} />
      </button>
    </div>
  )

  return (
    <div>
      <div className="sticky top-0 bg-bg/95 backdrop-blur border-b border-border z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-surface">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold flex-1">Ride Preferences</h1>
        {saving && <span className="text-xs text-muted">Saving...</span>}
      </div>

      <div className="p-4">
        {loading ? <PageSpinner /> : (
          <>
            <p className="text-xs font-semibold text-muted tracking-widest mb-3">SORT PREFERENCE</p>
            {['cheapest', 'fastest'].map(v => (
              <button
                key={v}
                onClick={() => update({ preferred_sort: v })}
                className={`card w-full text-left mb-2 border-2 transition-colors ${
                  prefs?.preferred_sort === v ? 'border-primary/50 bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    prefs?.preferred_sort === v ? 'border-primary' : 'border-muted'
                  }`}>
                    {prefs?.preferred_sort === v && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{v === 'cheapest' ? 'Cheapest First' : 'Fastest First'}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {v === 'cheapest' ? 'Show lowest-cost option first' : 'Show quickest pickup first'}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            <p className="text-xs font-semibold text-muted tracking-widest mb-3 mt-6">SURGE PRICING</p>
            <SwitchRow icon="🔥" label="Avoid Surge" subtitle="Hide providers with active surge pricing" field="avoid_surge" />

            <p className="text-xs font-semibold text-muted tracking-widest mb-3 mt-6">SPECIAL MODES</p>
            <SwitchRow icon="✈️" label="Airport Mode" subtitle="Optimise for airport routes (larger vehicles, fixed fares)" field="airport_mode" />

            <p className="text-xs font-semibold text-muted tracking-widest mb-3 mt-6">NOTIFICATIONS</p>
            <SwitchRow icon="🔔" label="Push Notifications" subtitle="Allow RideCompare to send alerts" field="notifications_enabled" />
            <SwitchRow icon="💰" label="Price Alerts" subtitle="Notify when fare drops below your threshold" field="price_alert_enabled" />
            <SwitchRow icon="📉" label="Surge End Alerts" subtitle="Notify when surge pricing ends" field="surge_alert_enabled" />
          </>
        )}
      </div>
    </div>
  )
}
