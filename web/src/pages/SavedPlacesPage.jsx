import { useState, useEffect } from 'react'
import { Plus, Home, Briefcase, Star } from 'lucide-react'
import { placesApi } from '../api/places'
import { PageSpinner } from '../components/Spinner'

const ICONS = { home: Home, work: Briefcase, star: Star }
const COLORS = {
  home: 'text-primary bg-primary/10',
  work: 'text-accent bg-accent/10',
  star: 'text-warning bg-warning/10',
}

function AddPlaceModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ label: '', address: '', latitude: 12.9716, longitude: 77.5946, icon: 'star', is_favorite: false })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await placesApi.savePlace(form)
      onAdded()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center">
      <div className="bg-surface w-full max-w-md rounded-t-3xl p-6 border-t border-border">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Add Place</h2>
          <button onClick={onClose} className="text-muted hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Label</label>
            <input className="input" placeholder="Home, Office..." value={form.label}
              onChange={e => setForm(p => ({ ...p, label: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Address</label>
            <input className="input" placeholder="Full address" value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Icon</label>
            <div className="flex gap-3">
              {['home', 'work', 'star'].map(i => {
                const Icon = ICONS[i]
                const active = form.icon === i
                return (
                  <button key={i} type="button" onClick={() => setForm(p => ({ ...p, icon: i }))}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-colors ${
                      active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted'
                    }`}>
                    <Icon size={18} />
                    <span className="text-xs capitalize">{i}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Place'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function SavedPlacesPage() {
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const load = () => { placesApi.getSaved().then(setPlaces).finally(() => setLoading(false)) }
  useEffect(load, [])

  return (
    <div>
      <div className="sticky top-0 bg-bg/95 backdrop-blur border-b border-border z-10 px-5 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Saved Places</h1>
        <button onClick={() => setShowAdd(true)}
          className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/20">
          <Plus size={18} />
        </button>
      </div>

      <div className="p-4">
        {loading ? <PageSpinner /> : places.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📍</p>
            <p className="font-semibold text-lg">No saved places</p>
            <p className="text-muted text-sm mt-2 mb-6">Save home, work, or favourite spots</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary max-w-xs mx-auto">
              <Plus size={16} /> Add Place
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {places.map(p => {
              const Icon = ICONS[p.icon] || Star
              const color = COLORS[p.icon] || COLORS.star
              return (
                <div key={p.id} className="card flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{p.label}</p>
                    <p className="text-xs text-muted truncate mt-0.5">{p.address}</p>
                  </div>
                  {p.is_favorite && <span className="text-surge text-sm">♥</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAdd && <AddPlaceModal onClose={() => setShowAdd(false)} onAdded={load} />}
    </div>
  )
}
