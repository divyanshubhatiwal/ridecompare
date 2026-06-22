import { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, ArrowDown } from 'lucide-react'
import { placesApi } from '../api/places'

function LocationInput({ icon: Icon, iconColor, placeholder, value, onChange, onSelect }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => { setQuery(value || '') }, [value])

  const handleChange = (e) => {
    const q = e.target.value
    setQuery(q)
    onChange({ address: q, lat: null, lng: null })
    clearTimeout(timerRef.current)
    if (q.length < 3) { setSuggestions([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      try {
        const results = await placesApi.autocomplete(q)
        setSuggestions(results)
        setOpen(true)
      } catch { setSuggestions([]) }
    }, 400)
  }

  const select = (s) => {
    const address = s.main_text + (s.secondary_text ? `, ${s.secondary_text}` : '')
    setQuery(address)
    setSuggestions([])
    setOpen(false)
    onSelect({ address, lat: s.latitude, lng: s.longitude })
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-3 py-3">
        <Icon size={18} className={iconColor} />
        <input
          className="flex-1 bg-transparent text-sm text-white placeholder-muted outline-none"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onMouseDown={() => select(s)}
              className="w-full text-left px-4 py-3 hover:bg-surface transition-colors border-b border-border last:border-0"
            >
              <p className="text-sm font-medium text-white">{s.main_text}</p>
              <p className="text-xs text-muted mt-0.5">{s.secondary_text}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RouteSelector({ onSearch, prefill }) {
  const [pickup, setPickup] = useState({ address: '', lat: null, lng: null })
  const [destination, setDestination] = useState({ address: '', lat: null, lng: null })

  // When voice search result comes in, use as destination prefill
  useEffect(() => {
    if (prefill) setDestination({ address: prefill, lat: null, lng: null })
  }, [prefill])
  const [loading, setLoading] = useState(false)

  const canSearch = pickup.address.length > 2 && destination.address.length > 2

  const handleSearch = async () => {
    if (!canSearch) return
    setLoading(true)
    try {
      await onSearch({
        pickupLat: pickup.lat || 12.9716,
        pickupLng: pickup.lng || 77.5946,
        pickupAddress: pickup.address,
        destinationLat: destination.lat || 12.9121,
        destinationLng: destination.lng || 77.6446,
        destinationAddress: destination.address,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <LocationInput
        icon={Navigation}
        iconColor="text-primary"
        placeholder="Where are you?"
        value={pickup.address}
        onChange={setPickup}
        onSelect={setPickup}
      />
      <div className="flex items-center gap-3 py-0.5">
        <div className="w-[18px] flex justify-center">
          <div className="w-0.5 h-5 bg-border rounded" />
        </div>
        <ArrowDown size={12} className="text-muted" />
      </div>
      <LocationInput
        icon={MapPin}
        iconColor="text-surge"
        placeholder="Where to?"
        value={destination.address}
        onChange={setDestination}
        onSelect={setDestination}
      />
      <button
        onClick={handleSearch}
        disabled={!canSearch || loading}
        className="btn-primary mt-4"
      >
        {loading ? (
          <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          'Find Rides'
        )}
      </button>
    </div>
  )
}
