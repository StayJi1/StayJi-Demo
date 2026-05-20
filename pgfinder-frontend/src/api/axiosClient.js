import axios from 'axios'

const isLocalHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
const baseURL = import.meta.env.VITE_API_BASE_URL || (isLocalHost ? 'http://localhost:3000' : 'https://stayji.onrender.com')

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject({
        message: `Backend is not reachable at ${baseURL}. Start the Node server on port 3000 and check CORS/API URL settings.`,
      })
    }
    return Promise.reject(error)
  },
)

export default axiosClient
export { baseURL }
