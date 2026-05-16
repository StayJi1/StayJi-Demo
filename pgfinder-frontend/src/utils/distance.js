export const getDistanceKm = (from, to) => {
  if (![from?.lat, from?.lng, to?.lat, to?.lng].every((value) => Number.isFinite(Number(value)))) return null

  const earthRadiusKm = 6371
  const latDistance = ((to.lat - from.lat) * Math.PI) / 180
  const lngDistance = ((to.lng - from.lng) * Math.PI) / 180
  const fromLat = (from.lat * Math.PI) / 180
  const toLat = (to.lat * Math.PI) / 180

  const a =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDistance / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const formatDistance = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined) return ''
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m away`
  return `${distanceKm.toFixed(1)} km away`
}
