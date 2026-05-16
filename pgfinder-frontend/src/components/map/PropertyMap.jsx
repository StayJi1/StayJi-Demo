import { useEffect } from 'react'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { formatDistance } from '../../utils/distance'

const defaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const userIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:18px;height:18px;border-radius:999px;background:#22d3ee;border:3px solid white;box-shadow:0 0 0 6px rgba(34,211,238,.25)"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function FitBounds({ bounds }) {
  const map = useMap()

  useEffect(() => {
    if (bounds?.length) {
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [bounds, map])

  return null
}

function PropertyMap({ properties = [], center, userLocation, showRouteTo }) {
  const mapCenter = center || userLocation || properties.find((property) => property.location)?.location || { lat: 12.9716, lng: 77.5946 }
  const visibleProperties = properties.filter((property) => property.location?.lat && property.location?.lng)
  const groupedProperties = Object.values(
    visibleProperties.reduce((groups, property) => {
      const key = `${property.location.lat.toFixed(5)},${property.location.lng.toFixed(5)}`
      if (!groups[key]) groups[key] = []
      groups[key].push(property)
      return groups
    }, {}),
  )
  const routeTarget = showRouteTo?.location
  const bounds = groupedProperties.map((group) => [group[0].location.lat, group[0].location.lng])

  return (
    <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={13} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {userLocation ? (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>Your current location</Popup>
        </Marker>
      ) : null}

      {groupedProperties.map((group, index) => {
        const property = group[0]
        const position = [property.location.lat, property.location.lng]
        return (
          <Marker key={`${position[0]}-${position[1]}-${index}`} position={position} icon={defaultIcon}>
            <Popup>
              <div className="space-y-2">
                <p className="font-semibold">{group.length > 1 ? `${group.length} properties here` : property.name}</p>
                <p>{property.locationLabel || property.city}</p>
                {property.distanceKm !== undefined ? <p>{formatDistance(property.distanceKm)}</p> : null}
                {group.length > 1 ? (
                  <ul className="list-disc pl-5 text-sm text-slate-700">
                    {group.map((item) => (
                      <li key={item.id || item._id}>
                        <Link className="text-brand-600 hover:underline" to={`/properties/${item.id || item._id}`}>
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Link className="text-brand-600 hover:underline" to={`/properties/${property.id || property._id}`}>
                    View details
                  </Link>
                )}
              </div>
            </Popup>
          </Marker>
        )
      })}

      {userLocation && routeTarget ? (
        <Polyline positions={[[userLocation.lat, userLocation.lng], [routeTarget.lat, routeTarget.lng]]} pathOptions={{ color: '#22d3ee', weight: 4 }} />
      ) : null}
      {bounds.length > 1 ? <FitBounds bounds={bounds} /> : null}
    </MapContainer>
  )
}

export default PropertyMap
