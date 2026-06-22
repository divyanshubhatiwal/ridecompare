import { useState } from 'react'
import { Share2, MessageCircle, Copy, X, Check, Twitter, Upload } from 'lucide-react'

export default function ShareSheet({ route, results, onClose }) {
  const [copied, setCopied] = useState(false)

  const available = results?.filter(r => r.available) || []
  const cheapest  = available.reduce((m, r) => !m || r.fare_min < m.fare_min ? r : m, null)
  const fastest   = available.reduce((m, r) => !m || r.eta_minutes < m.eta_minutes ? r : m, null)

  const text = [
    `🚕 RideCompare Results`,
    `📍 ${route?.pickupAddress || 'Pickup'} → ${route?.destinationAddress || 'Destination'}`,
    ``,
    cheapest ? `💸 Cheapest: ${cheapest.provider_display_name} — ${cheapest.fare_display} (${cheapest.eta_minutes} min)` : '',
    fastest  ? `⚡ Fastest:  ${fastest.provider_display_name}  — ${fastest.fare_display} (${fastest.eta_minutes} min)` : '',
    ``,
    `Compare fares: ridecompare.app`,
  ].filter(Boolean).join('\n')

  const waText = text.replace(/Cheapest:/g, '*Cheapest:*').replace(/Fastest:/g, '*Fastest:*')
  const twitterText = `${cheapest ? `💸 ${cheapest.provider_display_name} is cheapest for ${route?.destinationAddress} at ${cheapest.fare_display}` : 'Compared ride fares'} via @RideCompare 🚕`

  const whatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank')

  const twitter = () => window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`,
    '_blank'
  )

  const nativeShare = async () => {
    if (!navigator.share) return
    try {
      await navigator.share({ title: 'RideCompare Results', text, url: 'https://ridecompare.app' })
    } catch (_) { /* user cancelled */ }
  }

  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-surface w-full max-w-md rounded-t-3xl p-6 border-t border-border animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Share2 size={18} /> Share Results
          </h2>
          <button onClick={onClose} className="text-muted hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Preview */}
        <div className="bg-card rounded-xl p-3 mb-5 text-xs text-muted whitespace-pre-line font-mono leading-relaxed border border-border">
          {text}
        </div>

        {/* Share buttons grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={whatsapp}
            className="flex items-center justify-center gap-2 py-3 rounded-xl
                       bg-green-600/15 border border-green-600/30 text-green-400
                       font-semibold text-sm hover:bg-green-600/25 transition-colors"
          >
            <MessageCircle size={16} /> WhatsApp
          </button>

          <button
            onClick={twitter}
            className="flex items-center justify-center gap-2 py-3 rounded-xl
                       bg-sky-500/15 border border-sky-500/30 text-sky-400
                       font-semibold text-sm hover:bg-sky-500/25 transition-colors"
          >
            <Twitter size={16} /> Twitter / X
          </button>

          {navigator.share && (
            <button
              onClick={nativeShare}
              className="flex items-center justify-center gap-2 py-3 rounded-xl
                         bg-accent/15 border border-accent/30 text-accent
                         font-semibold text-sm hover:bg-accent/25 transition-colors"
            >
              <Upload size={16} /> Share via…
            </button>
          )}

          <button
            onClick={copy}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${
              navigator.share ? '' : 'col-span-2'
            } bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20`}
          >
            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Text</>}
          </button>
        </div>
      </div>
    </div>
  )
}
