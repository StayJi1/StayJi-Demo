import { useEffect, useState } from 'react'

function useGoogleMaps() {
  const [position, setPosition] = useState({ lat: 19.07598, lng: 72.87766 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (location) => {
        setPosition({ lat: location.coords.latitude, lng: location.coords.longitude })
        setLoading(false)
      },
      () => {
        setError('Unable to retrieve current location.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  return { position, loading, error }
}

export default useGoogleMaps
