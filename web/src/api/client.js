import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

let inFlight = 0
const listeners = new Set()
const emit = () => listeners.forEach(fn => fn(inFlight))
export function onRequestsChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const done = () => { inFlight = Math.max(0, inFlight - 1); emit() }

client.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  inFlight += 1; emit()
  return config
})

client.interceptors.response.use(
  res => { done(); return res },
  async err => {
    done()
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return client(original)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default client
