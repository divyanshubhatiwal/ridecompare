import { useState, useCallback } from 'react'

const PHONE_KEY  = 'rc_wa_phone'
const NOTIFY_KEY = 'rc_wa_auto_notify'

export function useWhatsApp() {
  const [phone, setPhoneState] = useState(() => localStorage.getItem(PHONE_KEY) || '')
  const [autoNotify, setAutoNotifyState] = useState(() => localStorage.getItem(NOTIFY_KEY) === 'true')

  const savePhone = useCallback((num) => {
    // Strip non-digits, ensure India prefix
    const digits = num.replace(/\D/g, '')
    const intl = digits.startsWith('91') ? digits : digits.length === 10 ? `91${digits}` : digits
    localStorage.setItem(PHONE_KEY, intl)
    setPhoneState(intl)
    return intl
  }, [])

  const toggleAutoNotify = useCallback(() => {
    setAutoNotifyState(prev => {
      const next = !prev
      localStorage.setItem(NOTIFY_KEY, String(next))
      return next
    })
  }, [])

  const openWhatsApp = useCallback((message, targetPhone) => {
    const num = targetPhone || phone
    const url = num
      ? `https://wa.me/${num}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }, [phone])

  return { phone, autoNotify, savePhone, toggleAutoNotify, openWhatsApp }
}
