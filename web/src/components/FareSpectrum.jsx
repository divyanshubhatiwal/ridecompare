import { useTheme } from '../context/ThemeContext'

export const PROVIDER_COLORS = {
  uber: '#111111',
  ola: '#23AA4E',
  rapido: '#F5B700',
  indrive: '#00C853',
  namma_yatri: '#7C3AED',
}

export function providerColor(provider, theme) {
  if (provider === 'uber' && theme === 'dark') return '#E5E5EA'
  return PROVIDER_COLORS[provider] || 'var(--primary)'
}

export default function FareSpectrum({ results, highlightKey, onSelect }) {
  const { theme } = useTheme()
  if (!results.length) return null

  const max = Math.max(...results.map(r => r.fare_max || r.fare_min))
  const min = Math.min(...results.map(r => r.fare_min))
  const rows = [...results].sort((a, b) => a.fare_min - b.fare_min)

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-[13px] font-semibold t-primary">Fare spectrum</p>
        <p className="text-[12px] t-secondary">₹{Math.round(min)} – ₹{Math.round(max)}</p>
      </div>
      <div className="space-y-2.5">
        {rows.map((r, i) => {
          const key = `${r.provider}-${r.category}`
          const lo = (r.fare_min / max) * 100
          const hi = ((r.fare_max || r.fare_min) / max) * 100
          const active = key === highlightKey
          const color = providerColor(r.provider, theme)
          return (
            <button key={key} onClick={() => onSelect?.(key)}
              className="w-full grid items-center gap-3 text-left group"
              style={{ gridTemplateColumns: '92px 1fr 56px' }}>
              <span className="text-[12px] truncate t-secondary group-hover:t-primary"
                style={{ fontWeight: active ? 700 : 500, color: active ? 'var(--text-primary)' : undefined }}>
                {r.category_display}
              </span>
              <span className="relative h-2.5 rounded-full" style={{ background: 'var(--tint)' }}>
                <span className="absolute inset-y-0 left-0 rounded-full origin-left"
                  style={{
                    width: `${lo}%`,
                    background: color,
                    opacity: active ? 1 : 0.85,
                    animation: `bar-grow .7s ${i * 0.06}s cubic-bezier(.2,.8,.2,1) both`,
                  }} />
                {hi > lo && (
                  <span className="absolute inset-y-0 rounded-r-full origin-left"
                    style={{
                      left: `${lo}%`, width: `${hi - lo}%`,
                      background: color, opacity: 0.25,
                      animation: `bar-grow .7s ${i * 0.06 + 0.2}s cubic-bezier(.2,.8,.2,1) both`,
                    }} />
                )}
                {active && (
                  <span className="absolute -inset-1 rounded-full pointer-events-none"
                    style={{ boxShadow: `0 0 0 2px rgb(var(--primary-rgb) / .35)` }} />
                )}
              </span>
              <span className="text-[12px] font-bold text-right t-primary tabular-nums">
                ₹{Math.round(r.fare_min)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
