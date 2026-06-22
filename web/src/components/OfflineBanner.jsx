import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export default function OfflineBanner() {
  const [online, setOnline]     = useState(navigator.onLine)
  const [showBack, setShowBack] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      setShowBack(true)
      setTimeout(() => setShowBack(false), 3000)
    }
    const handleOffline = () => {
      setOnline(false)
      setShowBack(false)
    }
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (online && !showBack) return null

  return (
    <div className={`fixed top-0 inset-x-0 z-[100] py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-lg transition-all ${
      online
        ? 'bg-cheapest text-white'
        : 'bg-warning text-white'
    }`}>
      {online
        ? <><Wifi size={14} /> You're back online!</>
        : <><WifiOff size={14} /> You're offline — showing cached data</>
      }
    </div>
  )
}
