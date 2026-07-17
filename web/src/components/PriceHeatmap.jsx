import { useState } from 'react'

const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

// Rule-based multiplier → simulates real price patterns
function multiplier(day, hour) {
  const isWeekend = day >= 5
  const isMorningPeak = hour >= 8  && hour <= 10
  const isEvenPeak    = hour >= 17 && hour <= 20
  const isLateNight   = hour >= 23 || hour <= 4
  const isMidDay      = hour >= 11 && hour <= 15
  let m = 1.0
  if (isMorningPeak && !isWeekend) m += 0.55
  if (isEvenPeak    && !isWeekend) m += 0.65
  if (isEvenPeak    &&  isWeekend) m += 0.30
  if (isLateNight)  m += 0.45
  if (isMidDay)     m -= 0.15
  if (isWeekend && hour >= 10 && hour <= 22) m += 0.10
  // add small noise per cell
  m += ((day * 7 + hour) % 11 - 5) * 0.015
  return Math.max(0.6, Math.min(1.8, m))
}

// map multiplier → green/yellow/red colour
function cellColor(m) {
  if (m < 0.85) return { bg: '#EDFBF2', text: '#1A7A44' }
  if (m < 1.05) return { bg: '#F0FFF4', text: '#276749' }
  if (m < 1.20) return { bg: '#FFF8EB', text: '#92400E' }
  if (m < 1.40) return { bg: '#FFEDD5', text: '#9A3412' }
  return              { bg: '#FFF0F3', text: '#9B1239' }
}

function fmtHour(h) {
  if (h === 0)  return '12a'
  if (h === 12) return '12p'
  return h < 12 ? `${h}a` : `${h - 12}p`
}

export default function PriceHeatmap({ basefare = 180 }) {
  const [tooltip, setTooltip] = useState(null) // { day, hour, fare }

  const now = new Date()
  const curDay  = (now.getDay() + 6) % 7  // Mon=0
  const curHour = now.getHours()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F', margin: 0 }}>Best time to ride</p>
        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#6E6E73' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: '#EDFBF2', display: 'inline-block' }} />
          Cheap
          <span style={{ width: 10, height: 10, borderRadius: 3, background: '#FFEDD5', display: 'inline-block', marginLeft: 4 }} />
          Surge
        </div>
      </div>

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 520 }}>
          {/* Hour headers — show every 2h */}
          <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(24, 1fr)', gap: 2, marginBottom: 2 }}>
            <div />
            {HOURS.map(h => (
              <div key={h} style={{
                fontSize: 8, color: '#6E6E73', textAlign: 'center',
                visibility: h % 3 === 0 ? 'visible' : 'hidden',
              }}>
                {fmtHour(h)}
              </div>
            ))}
          </div>

          {/* Rows */}
          {DAYS.map((day, di) => (
            <div key={day} style={{ display: 'grid', gridTemplateColumns: '28px repeat(24, 1fr)', gap: 2, marginBottom: 2 }}>
              <div style={{ fontSize: 9, color: '#6E6E73', display: 'flex', alignItems: 'center', fontWeight: di === curDay ? 700 : 400 }}>
                {day}
              </div>
              {HOURS.map(h => {
                const m    = multiplier(di, h)
                const col  = cellColor(m)
                const fare = Math.round(basefare * m)
                const isCur = di === curDay && h === curHour
                return (
                  <div
                    key={h}
                    onMouseEnter={() => setTooltip({ day, hour: h, fare, m })}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      height: 22,
                      borderRadius: 4,
                      background: col.bg,
                      cursor: 'default',
                      outline: isCur ? `2px solid #0071E3` : 'none',
                      outlineOffset: 1,
                      transition: 'transform 0.1s',
                      position: 'relative',
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.3)'}
                    onMouseOut={e  => e.currentTarget.style.transform = 'scale(1)'}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          marginTop: 8,
          background: '#1D1D1F',
          color: '#fff',
          borderRadius: 10,
          padding: '8px 12px',
          fontSize: 12,
          display: 'inline-flex', gap: 12, alignItems: 'center',
        }}>
          <span style={{ fontWeight: 600 }}>{tooltip.day} {fmtHour(tooltip.hour)}</span>
          <span>~₹{tooltip.fare}</span>
          <span style={{ color: tooltip.m < 1.05 ? '#30D158' : tooltip.m < 1.3 ? '#FF9F0A' : '#FF3B30' }}>
            {tooltip.m < 0.9 ? '✓ Cheapest window' : tooltip.m < 1.1 ? 'Normal price' : tooltip.m < 1.3 ? 'Slightly higher' : '⚠ Surge zone'}
          </span>
        </div>
      )}

      <p style={{ fontSize: 10, color: '#86868B', marginTop: 8 }}>
        Blue outline = now · Hover a cell to see estimated fare
      </p>
    </div>
  )
}
