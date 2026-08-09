import axios from 'axios'

const isLocalHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
const configuredBaseURL = import.meta.env.VITE_API_BASE_URL?.trim()
const isConfiguredLocalURL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredBaseURL || '')
const baseURL = configuredBaseURL && (!import.meta.env.PROD || !isConfiguredLocalURL)
  ? configuredBaseURL
  : (isLocalHost ? 'http://localhost:3000' : 'https://stayji.onrender.com')

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosClient.interceptors.request.use((config) => {
  // Always prefer axios instance default Authorization (set by AuthContext when token changes)
  // Otherwise fall back to persisted token (legacy/refresh scenario)
  const defaultAuth = axiosClient.defaults?.headers?.common?.Authorization
  if (!config.headers) config.headers = {}

  if (!config.headers.Authorization && defaultAuth) {
    config.headers.Authorization = defaultAuth
    return config
  }

  if (!config.headers.Authorization && typeof window !== 'undefined') {
    try {
      const savedRaw = sessionStorage.getItem('stayji-auth') || localStorage.getItem('stayji-auth')
      const saved = savedRaw ? JSON.parse(savedRaw) : null
      if (saved?.token) config.headers.Authorization = `Bearer ${saved.token}`
    } catch {
      // keep request unchanged
    }
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestHeaders = error.config?.headers
    const sentAuthorization = typeof requestHeaders?.get === 'function'
      ? requestHeaders.get('Authorization')
      : requestHeaders?.Authorization || requestHeaders?.authorization

    if (error.response?.status === 401 && sentAuthorization && typeof window !== 'undefined') {
      sessionStorage.removeItem('stayji-auth')
      localStorage.removeItem('stayji-auth')
      delete axiosClient.defaults.headers.common.Authorization
      window.dispatchEvent(new Event('stayji-auth-expired'))
    }
    if (!error.response) {
      return Promise.reject({
        message: `Backend is not reachable at ${baseURL}. Start the Node server on port 3000 and check CORS/API URL settings.`,
      })
    }
    const serverMessage = error.response.data?.msg || error.response.data?.message
    if (serverMessage) {
      return Promise.reject({
        ...error,
        message: serverMessage,
      })
    }
    return Promise.reject(error)
  },
)

export default axiosClient
export { baseURL }
