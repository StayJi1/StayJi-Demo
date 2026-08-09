import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import authService from '../services/authService'
import userService from '../services/userService'
import axiosClient from '../api/axiosClient'

const AuthContext = createContext(null)

const storageKey = 'stayji-auth'
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000
const inactivityTimeoutMs = 30 * 60 * 1000

const readStoredAuth = () => {
  // Prefer sessionStorage (normal app flow), but allow localStorage fallback
  // because some deployments/refresh flows may store there.
  try {
    const savedRaw = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey)
    if (!savedRaw) return null

    const parsed = JSON.parse(savedRaw)
    // Never restore a user without the JWT required by protected API routes.
    if (!parsed?.token) {
      sessionStorage.removeItem(storageKey)
      localStorage.removeItem(storageKey)
      return null
    }
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(storageKey)
      localStorage.removeItem(storageKey)
      return null
    }

    return parsed
  } catch {
    sessionStorage.removeItem(storageKey)
    localStorage.removeItem(storageKey)
    return null
  }
}

const normalizeRole = (rawRole) => {
  if (!rawRole) return 'user'
  const normalized = rawRole.toString().trim().toLowerCase()
  const roleMap = {
    personal: 'user',
    student: 'user',
    user: 'user',
    owner: 'owner',
    host: 'owner',
    hostel: 'owner',
    vendor: 'owner',
    admin: 'admin',
  }
  return roleMap[normalized] || normalized
}

const normalizeUser = (user) => {
  if (!user) return user
  const firstName = user.firstName || user.userFname || user.userName || ''
  const lastName = user.lastName || user.userLname || ''
  const name = user.name || [firstName, lastName].filter(Boolean).join(' ') || user.userEmail || ''
  const rawRole = (user.role || user.userType || '').toString().toLowerCase()
  const role = normalizeRole(rawRole)
  return { ...user, firstName, lastName, name, role }
}

const persistAuthSession = (user, token, role) => {
  const serialized = JSON.stringify({
    user,
    token,
    role,
    expiresAt: Date.now() + Math.min(sessionDurationMs, inactivityTimeoutMs),
  })
  sessionStorage.setItem(storageKey, serialized)
  localStorage.setItem(storageKey, serialized)
  axiosClient.defaults.headers.common.Authorization = `Bearer ${token}`
}

export const AuthProvider = ({ children }) => {
  const [storedAuth] = useState(readStoredAuth)
  const storedUser = storedAuth?.user ? normalizeUser(storedAuth.user) : null
  const [user, setUser] = useState(() => storedUser)
  const [token, setToken] = useState(() => storedAuth?.token || null)
  const [role, setRole] = useState(() => normalizeRole(storedAuth?.role || storedUser?.role || 'user'))
  const [authReady] = useState(() => {
    if (storedAuth?.token) {
      axiosClient.defaults.headers.common.Authorization = `Bearer ${storedAuth.token}`
    }
    return true
  })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const lastActivityRef = useRef(0)

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setRole(null)
    setStatus('idle')
    setError(null)
    sessionStorage.removeItem(storageKey)
    localStorage.removeItem(storageKey)
    delete axiosClient.defaults.headers.common.Authorization
  }, [])

  useEffect(() => {
    const handleAuthExpired = () => logout()
    window.addEventListener('stayji-auth-expired', handleAuthExpired)
    return () => window.removeEventListener('stayji-auth-expired', handleAuthExpired)
  }, [logout])

  useEffect(() => {
    if (token) {
      axiosClient.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
      delete axiosClient.defaults.headers.common.Authorization
    }
  }, [token])

  useEffect(() => {
    if (user && role && token) {
      persistAuthSession(user, token, role)
    } else {
      sessionStorage.removeItem(storageKey)
      localStorage.removeItem(storageKey)
    }
  }, [user, token, role])

  useEffect(() => {
    if (!user) return undefined
    lastActivityRef.current = Date.now()

    const refreshActivity = () => {
      lastActivityRef.current = Date.now()
      const saved = readStoredAuth()
      if (saved?.user) {
        const serialized = JSON.stringify({
          ...saved,
          expiresAt: Date.now() + Math.min(sessionDurationMs, inactivityTimeoutMs),
        })
        sessionStorage.setItem(storageKey, serialized)
        localStorage.setItem(storageKey, serialized)
      }
    }

    const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']
    activityEvents.forEach((eventName) => window.addEventListener(eventName, refreshActivity, { passive: true }))

    const timer = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current > inactivityTimeoutMs) {
        logout()
      }
    }, 60 * 1000)

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, refreshActivity))
      window.clearInterval(timer)
    }
  }, [logout, user])

  useEffect(() => {
    if (!user?._id) return undefined

    const verifyAccount = async () => {
      try {
        await userService.authStatus(user._id)
      } catch {
        logout()
      }
    }

    verifyAccount()
    const timer = window.setInterval(verifyAccount, 30 * 1000)
    return () => window.clearInterval(timer)
  }, [logout, user?._id])

  const login = async ({ email, password, role: userRole }) => {
    setStatus('loading')
    setError(null)
    try {
      // backend expects { userEmail, userPassword }
      const requestedRole = normalizeRole(userRole)
      const payload = { userEmail: email, userPassword: password, accountType: requestedRole, authPortal: requestedRole === 'admin' ? 'admin' : 'public' }
      const response = await authService.login(payload)
      const normalizedUser = normalizeUser(response.user)
      const nextRole = normalizeRole(response.role || normalizedUser.role || userRole || 'user')
      if (requestedRole && requestedRole !== nextRole) {
        throw new Error('Account type mismatch. Select the correct account type to continue.')
      }
      persistAuthSession(normalizedUser, response.token, nextRole)
      setUser(normalizedUser)
      setToken(response.token)
      setRole(nextRole)
      setStatus('success')
      return { ...response, user: { ...normalizedUser, role: nextRole } }
    } catch (err) {
      setError(err?.response?.data?.msg || err?.response?.data?.message || err.message || 'Login failed')
      setStatus('error')
      throw err
    }
  }

  const signup = async (payload) => {
    setStatus('loading')
    setError(null)
    try {
      // map common frontend signup fields to backend expected fields
      const mapped = {
        userFname: payload.firstName || payload.userFname || payload.name || '',
        userLname: payload.lastName || payload.userLname || '',
        userEmail: payload.email || payload.userEmail,
        userPassword: payload.password || payload.userPassword,
        gender: payload.gender || 'Male',
        contact: payload.contact || '',
        acceptTerms: payload.acceptTerms,
        acceptPrivacy: payload.acceptPrivacy,
        city: payload.city || payload.cityName || '',
        cityName: payload.city || payload.cityName || '',
        state: payload.state || payload.stateName || '',
        stateName: payload.state || payload.stateName || '',
        userType: payload.role === 'owner' ? 'Owner' : 'User',
      }
      const response = await authService.signup(mapped)
      const normalizedUser = normalizeUser(response.user)
      const nextRole = normalizedUser.role || payload.role || 'user'
      persistAuthSession(normalizedUser, response.token, nextRole)
      setUser(normalizedUser)
      setToken(response.token)
      setRole(nextRole)
      setStatus('success')
      return { ...response, user: { ...normalizedUser, role: nextRole } }
    } catch (err) {
      setError(err?.response?.data?.msg || err?.response?.data?.message || err.message || 'Signup failed')
      setStatus('error')
      throw err
    }
  }

  const googleSignup = async (payload) => {
    setStatus('loading')
    setError(null)
    try {
      const response = await authService.googleSignup({
        credential: payload.credential,
        contact: payload.contact,
        gender: payload.gender || '',
        acceptTerms: payload.acceptTerms,
        acceptPrivacy: payload.acceptPrivacy,
        city: payload.city || payload.cityName || '',
        cityName: payload.city || payload.cityName || '',
        state: payload.state || payload.stateName || '',
        stateName: payload.state || payload.stateName || '',
        userType: payload.role === 'owner' ? 'Owner' : 'User',
      })
      const normalizedUser = normalizeUser(response.user)
      const nextRole = normalizedUser.role || payload.role || 'user'
      persistAuthSession(normalizedUser, response.token, nextRole)
      setUser(normalizedUser)
      setToken(response.token)
      setRole(nextRole)
      setStatus('success')
      return { ...response, user: { ...normalizedUser, role: nextRole } }
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || 'Google signup failed')
      setStatus('error')
      throw err
    }
  }

  const updateProfile = useCallback(async (updates) => {
    if (!user?._id) {
      throw new Error('No authenticated user to update')
    }
    setStatus('loading')
    setError(null)
    try {
      const updatedUser = await userService.updateUser({ _id: user._id, ...updates })
      const normalizedUser = normalizeUser(updatedUser)
      setUser(normalizedUser)
      setRole(normalizedUser.role || role || 'user')
      setStatus('success')
      return normalizedUser
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Update failed')
      setStatus('error')
      throw err
    }
  }, [role, user])

  const value = useMemo(
    () => ({ user, token, role, authReady, isAuthenticated: Boolean(user && token), status, error, login, signup, googleSignup, updateProfile, logout }),
    [user, token, role, authReady, status, error, logout, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
