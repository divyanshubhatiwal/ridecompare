import { useState } from 'react'

const AUTO_KEY = 'rc_wa_auto'

function readAuto() {
  try { return localStorage.getItem(AUTO_KEY) !== 'off' } catch { return true }
}

export function useWhatsAppAuto() {
  const [auto, setAutoState] = useState(readAuto)
  const setAuto = (on) => {
    setAutoState(on)
    try { localStorage.setItem(AUTO_KEY, on ? 'on' : 'off') } catch { /* private mode */ }
  }
  return [auto, setAuto]
}

export function apiError(err, fallback) {
  const d = err?.response?.data?.detail
  return typeof d === 'string' ? d : fallback
}
