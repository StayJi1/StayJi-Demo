import { useCallback, useState } from 'react'

const defaultPosition = { lat: 12.9716, lng: 77.5946 }

function useCurrentLocation() {
  const [position, setPosition] = useState(defaultPosition)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasUserLocation, setHasUserLocation] = useState(false)

  const requestLocation = useCallback(() => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setError('Live location needs localhost or HTTPS. Open http://localhost:5173 instead of the network IP, or deploy over HTTPS.')
      return
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.')
      return
    }

    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (location) => {
        setPosition({ lat: location.coords.latitude, lng: location.coords.longitude })
        setHasUserLocation(true)
        setLoading(false)
      },
      (locationError) => {
        const errorMessages = {
          1: 'Location permission was denied. Allow location access in your browser and try again.',
          2: 'Your device could not determine its location. Check GPS/Wi-Fi and try again.',
          3: 'Location request timed out. Move near a window or try again.',
        }
        setError(errorMessages[locationError.code] || 'Unable to retrieve current location.')
        setLoading(false)
      },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 20000 },
    )
  }, [])

  const setManualLocation = useCallback((nextPosition) => {
    if (!nextPosition?.lat || !nextPosition?.lng) return
    setPosition(nextPosition)
    setHasUserLocation(true)
    setError(null)
  }, [])

  return { position, loading, error, hasUserLocation, requestLocation, setManualLocation }
}

export default useCurrentLocation
