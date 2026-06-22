import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) { setLoading(false); return }
    try {
      const u = await authApi.getMe()
      setUser(u)
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email, password) => {
    const tokens = await authApi.login(email, password)
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    const u = await authApi.getMe()
    setUser(u)
    return u
  }

  // Step 1 of registration — returns { email, requires_verification: true }
  const register = async (email, fullName, password) => {
    return await authApi.register(email, fullName, password)
  }

  // Step 2 — verifies OTP, sets tokens, loads user
  const verifyEmail = async (email, otp) => {
    const tokens = await authApi.verifyEmail(email, otp)
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    const u = await authApi.getMe()
    setUser(u)
    return u
  }

  const logout = async () => {
    const rt = localStorage.getItem('refresh_token')
    await authApi.logout(rt)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
