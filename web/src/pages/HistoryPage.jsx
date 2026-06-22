import { useState, useEffect } from 'react'
import { RefreshCw, Download, BarChart2 } from 'lucide-react'
import { ridesApi } from '../api/rides'
import { PageSpinner } from '../components/Spinner'

async function exportPDF(history) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.setTextColor(99, 102, 241)
  doc.text('RideCompare', 14, 18)
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text('Ride History / Expense Report', 14, 26)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 32)

  // Table
  autoTable(doc, {
    startY: 40,
    head: [['Date', 'From', 'To', 'Provider', 'Fare (₹)', 'Options']],
    body: history.map(r => [
      new Date(r.searched_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      (r.pickup_address || '').slice(0, 30),
      (r.destination_address || '').slice(0, 30),
      (r.cheapest_provider || '—').toUpperCase(),
      r.cheapest_fare ? Math.round(r.cheapest_fare) : '—',
      r.result_count,
    ]),
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 250] },
  })

  // Total
  const total = history.filter(r => r.cheapest_fare).reduce((s, r) => s + r.cheapest_fare, 0)
  const finalY = doc.lastAutoTable.finalY + 8
  doc.setFontSize(10)
  doc.setTextColor(50)
  doc.text(`Total estimated spend: ₹${Math.round(total).toLocaleString('en-IN')}`, 14, finalY)
  doc.text(`Total rides compared: ${history.length}`, 14, finalY + 6)

  doc.save(`ridecompare-history-${new Date().toISOString().slice(0, 10)}.pdf`)
}

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [showChart, setShowChart] = useState(false)

  const load = () => {
    setLoading(true)
    ridesApi.getHistory(50).then(setHistory).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleExport = async () => {
    setExporting(true)
    try { await exportPDF(history) } finally { setExporting(false) }
  }

  // Mini sparkline data — fare trend
  const fares = history.filter(r => r.cheapest_fare).slice(0, 14).reverse()
  const maxFare = Math.max(...fares.map(r => r.cheapest_fare), 1)

  return (
    <div>
      <div className="sticky top-0 bg-bg/95 backdrop-blur border-b border-border z-10 px-5 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Ride History</h1>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
            >
              {exporting
                ? <span className="h-3 w-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                : <Download size={13} />}
              Export PDF
            </button>
          )}
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-surface text-muted">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <PageSpinner />
        ) : history.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📋</p>
            <p className="font-semibold text-lg">No ride history yet</p>
            <p className="text-muted text-sm mt-2">Your compared rides will appear here</p>
          </div>
        ) : (
          <>
            {/* Sparkline trend */}
            {fares.length >= 3 && (
              <div className="card mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold">Fare Trend</p>
                    <p className="text-xs text-muted">Last {fares.length} searches</p>
                  </div>
                  <div className="text-right text-xs text-muted">
                    <p>Avg: ₹{Math.round(fares.reduce((s, r) => s + r.cheapest_fare, 0) / fares.length)}</p>
                    <p className="text-cheapest">Best: ₹{Math.round(Math.min(...fares.map(r => r.cheapest_fare)))}</p>
                  </div>
                </div>
                {/* Simple SVG sparkline */}
                <svg width="100%" height="48" viewBox={`0 0 ${fares.length * 20} 48`} preserveAspectRatio="none">
                  <polyline
                    points={fares.map((r, i) => `${i * 20 + 10},${48 - (r.cheapest_fare / maxFare) * 40}`).join(' ')}
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {fares.map((r, i) => (
                    <circle
                      key={i}
                      cx={i * 20 + 10}
                      cy={48 - (r.cheapest_fare / maxFare) * 40}
                      r="3"
                      fill="#6366F1"
                    />
                  ))}
                </svg>
              </div>
            )}

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Trips', value: history.length },
                { label: 'Best fare', value: `₹${Math.round(Math.min(...history.filter(r=>r.cheapest_fare).map(r=>r.cheapest_fare)))}`, color: 'text-cheapest' },
                { label: 'Total spend', value: `₹${Math.round(history.filter(r=>r.cheapest_fare).reduce((s,r)=>s+r.cheapest_fare,0)).toLocaleString('en-IN')}` },
              ].map(({ label, value, color }) => (
                <div key={label} className="card text-center py-3">
                  <p className={`font-bold text-base ${color || ''}`}>{value}</p>
                  <p className="text-xs text-muted mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {history.map(item => (
                <div key={item.id} className="card">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-lg">🚗</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.destination_address}</p>
                      <p className="text-xs text-muted mt-0.5 truncate">From: {item.pickup_address}</p>
                      <div className="flex items-center flex-wrap gap-2 mt-2">
                        <span className="text-xs text-muted">
                          {new Date(item.searched_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-xs text-muted">{item.result_count} options</span>
                        {item.cheapest_provider && (
                          <span className="badge-cheapest">{item.cheapest_provider.toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    {item.cheapest_fare && (
                      <span className="font-bold text-base shrink-0">₹{Math.round(item.cheapest_fare)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
