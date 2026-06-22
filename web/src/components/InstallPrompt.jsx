import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      // Show banner after 10s on first visit
      const seen = sessionStorage.getItem('pwa-prompt-seen')
      if (!seen) setTimeout(() => setShow(true), 10000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setShow(false)
    sessionStorage.setItem('pwa-prompt-seen', '1')
  }

  const dismiss = () => {
    setShow(false)
    sessionStorage.setItem('pwa-prompt-seen', '1')
  }

  if (!show || installed) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50
                    bg-card border border-primary/30 rounded-2xl shadow-2xl p-4 animate-slide-up">
      <button onClick={dismiss} className="absolute top-3 right-3 text-muted hover:text-white">
        <X size={16} />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
          <Download size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Install RideCompare</p>
          <p className="text-xs text-muted mt-0.5">Add to your home screen for instant access</p>
          <button
            onClick={install}
            className="mt-3 w-full btn-primary py-2 text-sm"
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  )
}
