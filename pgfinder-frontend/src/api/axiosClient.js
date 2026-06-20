import axios from 'axios'

const isLocalHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
const baseURL = import.meta.env.VITE_API_BASE_URL || (isLocalHost ? 'http://localhost:3000' : 'https://stayji.onrender.com')

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosClient.interceptors.request.use((config) => {
  if (!config.headers?.Authorization && typeof window !== 'undefined') {
    try {
      const saved = JSON.parse(sessionStorage.getItem('stayji-auth') || localStorage.getItem('stayji-auth') || '{}')
      if (saved?.token) {
        config.headers.Authorization = `Bearer ${saved.token}`
      }
    } catch {
      // Keep the request unchanged when auth storage is unavailable.
    }
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
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
