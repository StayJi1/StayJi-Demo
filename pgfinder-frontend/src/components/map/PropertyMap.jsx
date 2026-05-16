import L from 'leaflet'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet'
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

function PropertyMap({ properties = [], center, userLocation, showRouteTo }) {
  const mapCenter = center || userLocation || properties.find((property) => property.location)?.location || { lat: 19.07598, lng: 72.87766 }
  const visibleProperties = properties.filter((property) => property.location?.lat && property.location?.lng)
  const routeTarget = showRouteTo?.location

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

      {visibleProperties.map((property) => (
        <Marker key={property.id || property._id} position={[property.location.lat, property.location.lng]} icon={defaultIcon}>
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold">{property.name}</p>
              <p>{property.locationLabel || property.city}</p>
              {property.distanceKm !== undefined ? <p>{formatDistance(property.distanceKm)}</p> : null}
              <Link to={`/properties/${property.id || property._id}`}>View details</Link>
            </div>
          </Popup>
        </Marker>
      ))}

      {userLocation && routeTarget ? (
        <Polyline positions={[[userLocation.lat, userLocation.lng], [routeTarget.lat, routeTarget.lng]]} pathOptions={{ color: '#22d3ee', weight: 4 }} />
      ) : null}
    </MapContainer>
  )
}

export default PropertyMap
