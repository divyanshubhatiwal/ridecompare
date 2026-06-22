import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const CITY_RATES = {
  bengaluru:  { base: 30, perKm: 15,   waiting: 2, name: 'Bengaluru' },
  delhi:      { base: 25, perKm: 14,   waiting: 2, name: 'Delhi NCR' },
  mumbai:     { base: 21, perKm: 14.5, waiting: 1, name: 'Mumbai' },
  hyderabad:  { base: 25, perKm: 13,   waiting: 1.5, name: 'Hyderabad' },
  chennai:    { base: 25, perKm: 12,   waiting: 1.5, name: 'Chennai' },
  kolkata:    { base: 25, perKm: 12,   waiting: 1,   name: 'Kolkata' },
  pune:       { base: 22, perKm: 13,   waiting: 1.5, name: 'Pune' },
  ahmedabad:  { base: 20, perKm: 11,   waiting: 1,   name: 'Ahmedabad' },
}

export default function CalculatorPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('auto')

  // Auto-rickshaw
  const [city, setCity]       = useState('bengaluru')
  const [distance, setDist]   = useState('')
  const [waitMin, setWait]    = useState('0')
  const [nightFare, setNight] = useState(false)

  // Split fare
  const [fare, setFare]       = useState('')
  const [people, setPeople]   = useState('2')
  const [tip, setTip]         = useState('0')

  const rate = CITY_RATES[city]

  const autoFare = (() => {
    const d = parseFloat(distance)
    if (!d || d <= 0) return null
    const w = parseFloat(waitMin) || 0
    const base = rate.base + d * rate.perKm + w * rate.waiting
    return Math.round(nightFare ? base * 1.25 : base)
  })()

  const splitTotal = (() => {
    const f = parseFloat(fare) || 0
    const t = parseFloat(tip) || 0
    return f + t
  })()
  const perPerson = people ? Math.ceil(splitTotal / parseInt(people)) : null

  return (
    <div>
      <div className="sticky top-0 bg-bg/95 backdrop-blur border-b border-border z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-surface">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold">Fare Calculator</h1>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border sticky top-[57px] bg-bg z-10">
        {[
          { key: 'auto',  label: '🛺 Auto Meter' },
          { key: 'split', label: '👥 Split Fare' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === t.key ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === 'auto' ? (
          <div className="space-y-4">
            <div className="card bg-primary/5 border-primary/20 text-xs text-muted">
              Calculate the official auto-rickshaw meter fare for your city before boarding.
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">City</label>
              <select className="input" value={city} onChange={e => setCity(e.target.value)}>
                {Object.entries(CITY_RATES).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* Distance */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Distance (km)</label>
              <input
                className="input" type="number" min="0" step="0.1" placeholder="e.g. 5.5"
                value={distance} onChange={e => setDist(e.target.value)}
              />
            </div>

            {/* Wait time */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Waiting time — {waitMin} min
              </label>
              <input
                type="range" min="0" max="30" step="1" value={waitMin}
                onChange={e => setWait(e.target.value)}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>0 min</span><span>30 min</span>
              </div>
            </div>

            {/* Night toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Night charges (10 PM – 5 AM)</p>
                <p className="text-xs text-muted">+25% on meter</p>
              </div>
              <button
                onClick={() => setNight(n => !n)}
                className={`relative w-12 h-6 rounded-full transition-colors ${nightFare ? 'bg-primary' : 'bg-border'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${nightFare ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            {/* Result */}
            <div className="card bg-gradient-to-br from-primary/10 to-card border-primary/20 text-center py-6">
              <p className="text-xs text-muted mb-2">Estimated Meter Fare</p>
              <p className="text-5xl font-extrabold text-primary">
                {autoFare != null ? `₹${autoFare}` : '—'}
              </p>
              {autoFare != null && (
                <div className="mt-4 space-y-1.5 text-xs text-left max-w-xs mx-auto">
                  <div className="flex justify-between border-b border-border pb-1">
                    <span className="text-muted">Base fare</span>
                    <span>₹{rate.base}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-1">
                    <span className="text-muted">{distance} km × ₹{rate.perKm}</span>
                    <span>₹{Math.round(parseFloat(distance) * rate.perKm)}</span>
                  </div>
                  {parseFloat(waitMin) > 0 && (
                    <div className="flex justify-between border-b border-border pb-1">
                      <span className="text-muted">{waitMin} min wait × ₹{rate.waiting}</span>
                      <span>₹{Math.round(parseFloat(waitMin) * rate.waiting)}</span>
                    </div>
                  )}
                  {nightFare && (
                    <div className="flex justify-between border-b border-border pb-1">
                      <span className="text-muted">Night surcharge (+25%)</span>
                      <span className="text-surge">+₹{Math.round(autoFare * 0.2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">₹{autoFare}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Rate card */}
            <div className="card">
              <p className="text-xs font-semibold text-muted tracking-widest mb-3">
                OFFICIAL RATES — {rate.name.toUpperCase()}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Base fare (first 1.5 km)</span>
                  <span>₹{rate.base}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Per km thereafter</span>
                  <span>₹{rate.perKm}/km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Waiting charges</span>
                  <span>₹{rate.waiting}/min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Night charges</span>
                  <span>+25%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card bg-primary/5 border-primary/20 text-xs text-muted">
              Split any cab fare equally — round up so no one pays extra.
            </div>

            {/* Fare input */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Total Fare (₹)</label>
              <input
                className="input text-lg font-bold" type="number" min="0" placeholder="e.g. 350"
                value={fare} onChange={e => setFare(e.target.value)}
              />
            </div>

            {/* Tip */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Tip (₹) — optional</label>
              <div className="flex gap-2">
                {[0, 10, 20, 50].map(n => (
                  <button key={n} onClick={() => setTip(String(n))}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      tip === String(n) ? 'bg-primary/15 border-primary text-primary' : 'border-border text-muted'
                    }`}>
                    {n === 0 ? 'None' : `₹${n}`}
                  </button>
                ))}
              </div>
            </div>

            {/* People */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Number of People</label>
              <div className="flex gap-2">
                {[2, 3, 4, 5, 6].map(n => (
                  <button key={n} onClick={() => setPeople(String(n))}
                    className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-colors ${
                      people === String(n)
                        ? 'bg-primary/15 border-primary text-primary'
                        : 'border-border text-muted hover:border-primary/30'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Result */}
            <div className="card bg-gradient-to-br from-cheapest/10 to-card border-cheapest/20 text-center py-6">
              <p className="text-xs text-muted mb-2">Each person pays</p>
              <p className="text-5xl font-extrabold text-cheapest">
                {perPerson != null && fare ? `₹${perPerson}` : '—'}
              </p>
              {perPerson && fare && (
                <p className="text-xs text-muted mt-3">
                  (₹{fare}{parseFloat(tip) > 0 ? ` + ₹${tip} tip` : ''}) ÷ {people} people
                  {parseFloat(splitTotal) % parseInt(people) !== 0 ? ' (rounded up)' : ''}
                </p>
              )}
            </div>

            {perPerson && fare && (
              <button
                onClick={() => {
                  const msg = `Hey! Your share for the cab fare is ₹${perPerson} (Total: ₹${splitTotal} split ${people} ways) 🚕\nSplit calculated by RideCompare`
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`)
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                           bg-green-600/15 border border-green-600/30 text-green-400
                           font-semibold text-sm hover:bg-green-600/25 transition-colors"
              >
                💬 Request via WhatsApp
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
