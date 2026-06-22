import { useState, useCallback } from 'react'
import { CheckCircle, X } from 'lucide-react'

let _showToast = null

export function useToast() {
  return { showToast: (msg, type = 'success') => _showToast?.(msg, type) }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  _showToast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4">
      {toasts.map(t => (
        <div key={t.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 shadow-2xl animate-fade-in">
          <CheckCircle size={16} className="text-cheapest shrink-0" />
          <p className="text-sm flex-1">{t.msg}</p>
          <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
            <X size={14} className="text-muted" />
          </button>
        </div>
      ))}
    </div>
  )
}
