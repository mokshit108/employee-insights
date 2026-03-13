import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AUTH_STORAGE_KEY, LOGIN_USERNAME, LOGIN_PASSWORD } from '../constants'

export const AuthContext = createContext(null)

function getInitialAuthState() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    return stored ? JSON.parse(stored) : { isAuthenticated: false, username: '' }
  } catch {
    return { isAuthenticated: false, username: '' }
  }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(getInitialAuthState)

  useEffect(() => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState))
  }, [authState])

  const login = useCallback((username, password) => {
    if (username === LOGIN_USERNAME && password === LOGIN_PASSWORD) {
      setAuthState({ isAuthenticated: true, username })
      return { ok: true }
    }
    return { ok: false, message: 'Use testuser / Test123 to sign in.' }
  }, [])

  const logout = useCallback(() => {
    setAuthState({ isAuthenticated: false, username: '' })
  }, [])

  const value = useMemo(
    () => ({ ...authState, login, logout }),
    [authState, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
