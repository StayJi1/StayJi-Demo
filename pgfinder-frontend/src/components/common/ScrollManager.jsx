import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const storageKey = 'stayji-scroll-positions'

const readPositions = () => {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey) || '{}')
  } catch {
    return {}
  }
}

const writePosition = (key, value) => {
  if (!key) return
  const positions = readPositions()
  positions[key] = value
  sessionStorage.setItem(storageKey, JSON.stringify(positions))
}

function ScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const locationKey = location.key || `${location.pathname}${location.search}`

  useEffect(() => {
    const positions = readPositions()
    const savedTop = Number(positions[locationKey] || 0)

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: navigationType === 'POP' ? savedTop : 0,
        left: 0,
        behavior: 'auto',
      })
    })

    return () => {
      writePosition(locationKey, window.scrollY || 0)
    }
  }, [locationKey, navigationType])

  return null
}

export default ScrollManager
