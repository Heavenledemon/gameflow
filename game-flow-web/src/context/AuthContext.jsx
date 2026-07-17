import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AUTH_EXPIRED_EVENT } from '../lib/api.js'
import { clearStoredSession, fetchCurrentUser, getStoredToken, getStoredUser, persistAuthSession, signIn as signInRequest, signUp as signUpRequest } from '../lib/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken)
  const [user, setUser] = useState(getStoredUser)
  const [isLoading, setIsLoading] = useState(() => Boolean(getStoredToken()))

  const logout = useCallback(() => {
    clearStoredSession()
    setToken('')
    setUser(null)
    setIsLoading(false)
  }, [])

  const refreshCurrentUser = useCallback(async (activeToken = token) => {
    if (!activeToken) return null
    const data = await fetchCurrentUser(activeToken)
    persistAuthSession({ token: activeToken, user: data.user })
    setUser(data.user)
    return data.user
  }, [token])

  useEffect(() => {
    let active = true
    if (token) {
      void Promise.resolve().then(async () => {
        try { await refreshCurrentUser(token) } catch { if (active) logout() } finally { if (active) setIsLoading(false) }
      })
    }
    return () => { active = false }
  }, [token, refreshCurrentUser, logout])

  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, logout)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, logout)
  }, [logout])

  const establishSession = useCallback((data) => {
    persistAuthSession(data)
    setToken(data.token)
    setUser(data.user)
    setIsLoading(false)
    return data.user
  }, [])

  const signIn = useCallback(async (credentials) => establishSession(await signInRequest(credentials)), [establishSession])
  const signUp = useCallback(async (input) => establishSession(await signUpRequest(input)), [establishSession])

  return <AuthContext.Provider value={{ token, user, isLoading, isAuthenticated: Boolean(token), signIn, signUp, logout, refreshCurrentUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
