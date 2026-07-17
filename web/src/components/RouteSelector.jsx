import { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, ArrowDown, LocateFixed, Loader } from 'lucide-react'
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
          className="flex-1 bg-transparent text-sm placeholder-muted outline-none"
          style={{ color: 'inherit' }}
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
              <p className="text-sm font-medium" style={{ color: 'inherit' }}>{s.main_text}</p>
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
  const [locating, setLocating] = useState(false)

  // When voice search result comes in, use as destination prefill
  useEffect(() => {
    if (prefill) setDestination({ address: prefill, lat: null, lng: null })
  }, [prefill])
  const [loading, setLoading] = useState(false)

  const useMyLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords
        try {
          const r = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${import.meta.env.VITE_OPENCAGE_KEY}&language=en&no_annotations=1&limit=1`
          )
          const d = await r.json()
          const result = d.results?.[0]
          let address
          if (result) {
            const c = result.components || {}
            const rawRoad = c.road || c.path || c.footway || c.pedestrian || c.croft
            const road    = rawRoad && !/^unnamed/i.test(rawRoad) ? rawRoad : null
            const street  = [c.house_number, road].filter(Boolean).join(' ')
            const village = c.village || c.hamlet
            const area    = c.neighbourhood || c.suburb || c.quarter || c.city_district
            const city    = c.city || c.town || c.municipality || c.county
            const parts   = []
            if (street)                             parts.push(street)
            else if (village)                       parts.push(village)
            if (area && area !== village)           parts.push(area)
            if (city && !parts.includes(city))      parts.push(city)
            address = parts.length >= 2
              ? parts.join(', ')
              : result.formatted?.split(',').slice(0, 4).join(',').trim()
          }
          setPickup({ address: address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng })
        } catch {
          setPickup({ address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng })
        } finally {
          setLocating(false)
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

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
    <div className="divide-y divide-border">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <LocationInput
            icon={Navigation}
            iconColor="text-primary"
            placeholder="Where are you?"
            value={pickup.address}
            onChange={setPickup}
            onSelect={setPickup}
          />
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          title="Use my current location"
          style={{
            flexShrink: 0, width: 36, height: 36,
            borderRadius: 10, border: '1px solid rgba(0,113,227,0.25)',
            background: 'rgba(0,113,227,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)', cursor: locating ? 'wait' : 'pointer',
          }}
        >
          {locating ? <Loader size={15} style={{ animation: 'spin-full 0.8s linear infinite' }} /> : <LocateFixed size={15} />}
        </button>
      </div>
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
