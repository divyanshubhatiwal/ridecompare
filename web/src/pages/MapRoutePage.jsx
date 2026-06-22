import { useState, useCallback, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Navigation, MapPin, Search } from 'lucide-react'
import { placesApi } from '../api/places'

const MapPicker = lazy(() => import('../components/MapPicker'))

function LocationBar({ icon: Icon, color, label, value, onClear }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 ${value ? 'opacity-100' : 'opacity-50'}`}>
      <Icon size={16} className={color} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium truncate">{value || 'Not set — tap map'}</p>
      </div>
      {value && (
        <button onClick={onClear} className="text-muted text-xs hover:text-white px-1">✕</button>
      )}
    </div>
  )
}

export default function MapRoutePage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('pickup')
  const [pickup, setPickup] = useState(null)
  const [destination, setDestination] = useState(null)
  const [searchQ, setSearchQ] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searchTimer, setSearchTimer] = useState(null)

  const handleSearch = (q) => {
    setSearchQ(q)
    clearTimeout(searchTimer)
    if (q.length < 3) { setSuggestions([]); return }
    setSearchTimer(setTimeout(async () => {
      try {
        const results = await placesApi.autocomplete(q)
        setSuggestions(results)
      } catch { setSuggestions([]) }
    }, 350))
  }

  const selectSuggestion = (s) => {
    if (!s.latitude || !s.longitude) return
    const address = s.main_text + (s.secondary_text ? `, ${s.secondary_text}` : '')
    const loc = { lat: s.latitude, lng: s.longitude, address }
    if (mode === 'pickup') setPickup(loc)
    else setDestination(loc)
    setSuggestions([])
    setSearchQ('')
    if (mode === 'pickup' && !destination) setMode('destination')
  }

  const handlePickupChange = useCallback((loc) => {
    setPickup(loc)
    if (!destination) setMode('destination')
  }, [destination])

  const handleDestChange = useCallback((loc) => {
    setDestination(loc)
  }, [])

  const canSearch = pickup && destination

  const handleFindRides = () => {
    if (!canSearch) return
    navigate('/compare', {
      state: {
        route: {
          pickupLat: pickup.lat, pickupLng: pickup.lng, pickupAddress: pickup.address,
          destinationLat: destination.lat, destinationLng: destination.lng, destinationAddress: destination.address,
        }
      }
    })
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto">
      {/* Header */}
      <div className="bg-bg border-b border-border z-20 shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-surface">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-semibold flex-1">Select Route</h1>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 px-4 pb-3">
          <button
            onClick={() => setMode('pickup')}
            className={`flex-1 flex items-center gap-2 py-2 px-3 rounded-xl text-sm font-medium border transition-colors ${
              mode === 'pickup' ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-surface border-border text-muted'
            }`}
          >
            <Navigation size={14} /> Set Pickup
          </button>
          <button
            onClick={() => setMode('destination')}
            className={`flex-1 flex items-center gap-2 py-2 px-3 rounded-xl text-sm font-medium border transition-colors ${
              mode === 'destination' ? 'bg-surge/15 border-surge/40 text-surge' : 'bg-surface border-border text-muted'
            }`}
          >
            <MapPin size={14} /> Set Destination
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3 relative">
          <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2.5">
            <Search size={16} className="text-muted shrink-0" />
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder-muted"
              placeholder={`Search ${mode === 'pickup' ? 'pickup' : 'destination'} location…`}
              value={searchQ}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
          {suggestions.length > 0 && (
            <div className="absolute left-4 right-4 top-full bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onMouseDown={() => selectSuggestion(s)}
                  className="w-full text-left px-4 py-3 hover:bg-surface border-b border-border last:border-0"
                >
                  <p className="text-sm font-medium">{s.main_text}</p>
                  <p className="text-xs text-muted">{s.secondary_text}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-muted text-sm">Loading map…</div>}>
          <MapPicker
            pickup={pickup}
            destination={destination}
            onPickupChange={handlePickupChange}
            onDestChange={handleDestChange}
            mode={mode}
            onModeChange={setMode}
          />
        </Suspense>

        {/* Tap hint */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur px-3 py-1.5 rounded-full text-xs text-white/80 pointer-events-none">
          Tap the map to set {mode === 'pickup' ? 'pickup' : 'destination'}
        </div>
      </div>

      {/* Bottom panel */}
      <div className="bg-surface border-t border-border shrink-0 z-20">
        <LocationBar
          icon={Navigation} color="text-primary" label="Pickup"
          value={pickup?.address}
          onClear={() => setPickup(null)}
        />
        <div className="w-px h-4 bg-border ml-[28px]" />
        <LocationBar
          icon={MapPin} color="text-surge" label="Destination"
          value={destination?.address}
          onClear={() => setDestination(null)}
        />
        <div className="px-4 py-3">
          <button
            onClick={handleFindRides}
            disabled={!canSearch}
            className="btn-primary"
          >
            {canSearch ? 'Find Rides' : 'Set both locations to continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
