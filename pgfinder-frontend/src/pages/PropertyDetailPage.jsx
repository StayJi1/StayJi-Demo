import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiClock, FiPhone, FiShield, FiShuffle, FiWifi, FiCoffee, FiTruck, FiVideo, FiDroplet, FiZap, FiActivity, FiHome } from 'react-icons/fi'
import Loader from '../components/common/Loader'
import Button from '../components/common/Button'
import PropertyMap from '../components/map/PropertyMap'
import propertyService from '../services/propertyService'
import { useAuth } from '../context/AuthContext'
import useCurrentLocation from '../hooks/useCurrentLocation'
import { formatDistance, getDistanceKm } from '../utils/distance'

const getAmenityIcon = (amenity) => {
  const value = amenity.toLowerCase()
  if (/wifi|internet/.test(value)) return <FiWifi />
  if (/food|meal|breakfast|lunch|dinner|kitchen/.test(value)) return <FiCoffee />
  if (/parking|bike|car/.test(value)) return <FiTruck />
  if (/cctv|security|camera/.test(value)) return <FiVideo />
  if (/laundry|washing/.test(value)) return <FiDroplet />
  if (/power|backup|electric/.test(value)) return <FiZap />
  if (/gym|fitness/.test(value)) return <FiActivity />
  return <FiHome />
}

function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [leadPrefs, setLeadPrefs] = useState({ preferredVisitTime: '', moveInPreference: '' })
  const { position, loading: locationLoading, error: locationError, hasUserLocation, requestLocation } = useCurrentLocation()

  useEffect(() => {
    const loadProperty = async () => {
      try {
        const data = await propertyService.fetchPropertyById(id)
        setProperty(data)
        const viewed = JSON.parse(localStorage.getItem('stayjiViewed') || '[]')
        localStorage.setItem('stayjiViewed', JSON.stringify([id, ...viewed.filter((item) => item !== id)].slice(0, 20)))
      } catch {
        setError('Unable to load property details.')
      } finally {
        setLoading(false)
      }
    }
    loadProperty()
  }, [id])

  const { user, role } = useAuth()
  const isAdmin = role === 'admin'

  useEffect(() => {
    if (!property || role !== 'vendor') return
    const ownerId = property.ownerId?.toString()
    const userId = user?._id?.toString()
    if (ownerId && userId && ownerId !== userId) {
      navigate('/dashboard/vendor/properties', { replace: true })
    }
  }, [navigate, property, role, user?._id])

  const handleShortlist = async () => {
    if (!user || !user._id) {
      navigate('/login', { replace: true })
      return
    }
    try {
      await propertyService.shortlistProperty({ userIDFK: user._id, propertyIDFK: property._id })
      alert('Property saved to your shortlist.')
    } catch (err) {
      console.error(err)
      alert('Unable to save shortlist.')
    }
  }

  const handleExpressInterest = async () => {
    if (!user || !user._id) {
      navigate('/login', { replace: true })
      return
    }
    try {
      await propertyService.expressInterest({
        userIDFK: user._id,
        propertyIDFK: property._id,
        subject: 'Interested in this property',
        description: 'I am interested in this property and would like to know the next steps.',
        preferredVisitTime: leadPrefs.preferredVisitTime,
        moveInPreference: leadPrefs.moveInPreference,
      })
      alert('Your interest has been sent to the host.')
    } catch (err) {
      console.error(err)
      alert('Unable to send your interest.')
    }
  }

  const handleBookVisit = async () => {
    if (!user || !user._id) {
      navigate('/login', { replace: true })
      return
    }
    try {
      await propertyService.bookVisit({
        userIDFK: user._id,
        propertyIDFK: property._id,
        visitDate: leadPrefs.preferredVisitTime || new Date(),
        moveInPreference: leadPrefs.moveInPreference,
      })
      alert('Visit request submitted.')
    } catch (err) {
      console.error(err)
      alert('Unable to book visit.')
    }
  }

  const handleCompare = () => {
    const current = JSON.parse(localStorage.getItem('stayjiCompare') || '[]')
    const propertyId = property._id || property.id
    const next = [propertyId, ...current.filter((item) => item !== propertyId)].slice(0, 3)
    localStorage.setItem('stayjiCompare', JSON.stringify(next))
    alert('Added to comparison. You can compare up to 3 properties while browsing.')
  }

  const getMapsUrl = (provider = 'google') => {
    const lat = property.location?.lat || property.latitude || 19.07598
    const lng = property.location?.lng || property.longitude || 72.87766
    if (provider === 'apple') return `https://maps.apple.com/?daddr=${lat},${lng}`
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  }

  if (loading) {
    return <Loader />
  }

  if (error || !property) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-300 sm:px-6">
        <p className="text-lg font-semibold text-white">{error || 'Property not found'}</p>
        <button onClick={() => navigate('/properties')} className="mt-6 rounded-full border border-slate-700 px-6 py-3 text-sm text-slate-200 hover:border-accent-500">
          Back to listings
        </button>
      </div>
    )
  }

  const coordinates = {
    lat: property.location?.lat || 19.07598,
    lng: property.location?.lng || 72.87766,
  }
  const distanceKm = hasUserLocation ? getDistanceKm(position, coordinates) : null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent-500">
          <FiArrowLeft /> Back
        </button>
        <span className="rounded-full bg-slate-900/80 px-4 py-2 text-sm text-accent-400">Premium stay</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="space-y-8">
          <div className="overflow-hidden rounded-[2rem] bg-slate-950/90 shadow-card">
            <img
              src={property.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'}
              alt={property.name}
              className="h-96 w-full object-cover"
            />
            {(property.images || []).length > 1 ? (
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2 sm:grid-cols-4">
                {property.images.slice(1, 5).map((image) => (
                  <img key={image} src={image} alt={property.name} className="h-24 w-full rounded-2xl object-cover" />
                ))}
              </div>
            ) : null}
          </div>

          {property.videoUrl ? (
            <div className="overflow-hidden rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-4 shadow-card">
              <video src={property.videoUrl} controls className="max-h-[420px] w-full rounded-[1.5rem] bg-slate-950" />
            </div>
          ) : null}

          <div className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-accent-400">{property.category || property.type || 'PG'}</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">{property.name}</h1>
              </div>
              <p className="rounded-3xl bg-brand-500/10 px-5 py-3 text-2xl font-semibold text-brand-100">₹{property.rent || '8,500'}/mo</p>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-950/80 p-5 text-slate-300">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Gender type</p>
                <p className="mt-2 text-base text-white">{property.gender || 'Co-ed'}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-5 text-slate-300">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Food</p>
                <p className="mt-2 text-base text-white">{property.mealsAvailable?.length ? property.mealsAvailable.join(', ') : property.foodIncluded ? 'Included' : 'Optional'}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-5 text-slate-300">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Deposit</p>
                <p className="mt-2 text-base text-white">₹{property.depositAmount || '0'}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-5 text-slate-300">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Daily stay</p>
                <p className="mt-2 text-base text-white">
                  {property.perDayCheckIn ? `Available${property.dailyRate ? ` at ₹${property.dailyRate}/day` : ''}` : 'Not available'}
                </p>
              </div>
            </div>
            <div className="mt-8 space-y-4 text-slate-300">
              <p>{property.description || 'A thoughtfully curated PG with modern rooms, fast WiFi, and a friendly atmosphere near campuses.'}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-950/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Occupancy</p>
                  <p className="mt-2 text-sm text-white">{property.vacancyStatus || property.occupancy || 'Live availability'}</p>
                </div>
                <div className="rounded-3xl bg-slate-950/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Rating</p>
                  <p className="mt-2 text-sm text-white">{property.rating || '4.8/5'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
            <div className="flex items-center gap-4 text-slate-200">
              <FiShield className="text-accent-400" size={24} />
              <div>
                <p className="font-semibold text-white">Verified host details</p>
                <p className="text-sm text-slate-400">Connect with the owner, save the property, or book a visit directly.</p>
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-950/80 p-5">
                <FiPhone className="text-accent-400" />
                <p className="mt-3 text-sm text-slate-400">Owner contact</p>
                <p className="mt-2 text-white">{property.contact || '1234567899'}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-5">
                <FiClock className="text-accent-400" />
                <p className="mt-3 text-sm text-slate-400">Next available visit</p>
                <p className="mt-2 text-white">{property.nextVisit || 'Tomorrow 3:00 PM'}</p>
              </div>
            </div>
            {isAdmin ? (
              <div className="mt-6 rounded-3xl border border-accent-500/40 bg-accent-500/10 p-5 text-slate-200">
                <p className="font-semibold text-white">StayJi verification checklist</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {['Identity checked', 'Ownership checked', 'Photos match listing', 'Map location verified', 'Pricing verified', 'Safety basics checked'].map((item) => (
                    <label key={item} className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-accent-400" />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-slate-300">
                    Preferred visit date and time
                    <input
                      type="datetime-local"
                      value={leadPrefs.preferredVisitTime}
                      onChange={(event) => setLeadPrefs((current) => ({ ...current, preferredVisitTime: event.target.value }))}
                      className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none focus:border-accent-400"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    Move-in preference
                    <select
                      value={leadPrefs.moveInPreference}
                      onChange={(event) => setLeadPrefs((current) => ({ ...current, moveInPreference: event.target.value }))}
                      className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none focus:border-accent-400"
                    >
                      <option value="">Select move-in preference</option>
                      <option value="Immediately">Immediately</option>
                      <option value="This week">This week</option>
                      <option value="Next month">Next month</option>
                    </select>
                  </label>
                </div>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button onClick={handleShortlist} className="w-full sm:w-auto">Shortlist</Button>
                  <Button onClick={handleExpressInterest} className="w-full sm:w-auto">Request callback</Button>
                  <Button onClick={handleBookVisit} variant="secondary" className="w-full sm:w-auto">Book visit</Button>
                  <Button onClick={handleCompare} variant="secondary" className="w-full sm:w-auto"><FiShuffle className="mr-2" /> Compare</Button>
                  <a href="/compare" className="inline-flex w-full items-center justify-center rounded-3xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-white/15 sm:w-auto">Open comparison</a>
                </div>
              </>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-500">Live vacancy</p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-3xl bg-emerald-500/10 p-4 text-emerald-100">
                <p className="text-2xl font-semibold">{property.availableBeds || 0}</p>
                <p className="mt-1 text-sm">beds available</p>
              </div>
              <p className="rounded-3xl bg-slate-950/80 p-4 text-sm text-slate-300">{property.sharingAvailability || property.sharing || 'Sharing availability will be confirmed by owner.'}</p>
              {property.roomInventory?.length ? (
                <div className="space-y-2 rounded-3xl bg-slate-950/80 p-4 text-sm text-slate-300">
                  {property.roomInventory.map((row) => (
                    <p key={row.sharingType}>{row.sharingType}: {row.vacantRooms || 0} rooms · {row.vacantBeds || 0} beds vacant</p>
                  ))}
                </div>
              ) : null}
              <p className="rounded-3xl bg-slate-950/80 p-4 text-sm text-slate-300">Available from: {property.availableFrom || 'Immediately'}</p>
              {property.contact ? (
                <a
                  href={`https://wa.me/91${property.contact}?text=${encodeURIComponent(`Hi, I found ${property.name} on StayJi and want to know vacancy details.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-3xl bg-emerald-500 px-5 py-3 text-center text-sm font-semibold text-white"
                >
                  WhatsApp owner
                </a>
              ) : null}
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-500">Location</p>
            {distanceKm !== null ? <p className="mt-3 text-sm text-slate-300">{formatDistance(distanceKm)} from your current location</p> : null}
            <div className="mt-6 rounded-[1.75rem] overflow-hidden border border-slate-700/80 bg-slate-950/80">
              <div className="h-80 w-full">
                <PropertyMap
                  center={coordinates}
                  userLocation={hasUserLocation ? position : null}
                  properties={[{ ...property, location: coordinates, distanceKm }]}
                  showRouteTo={{ ...property, location: coordinates }}
                />
              </div>
            </div>
            <Button onClick={requestLocation} disabled={locationLoading} variant="secondary" className="mt-5 w-full">
              {locationLoading ? 'Fetching location...' : hasUserLocation ? 'Refresh my location' : 'Use my location'}
            </Button>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <a href={getMapsUrl('google')} target="_blank" rel="noreferrer" className="rounded-3xl bg-brand-500 px-5 py-3 text-center text-sm font-semibold text-slate-950">Google Maps</a>
              <a href={getMapsUrl('apple')} target="_blank" rel="noreferrer" className="rounded-3xl border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-200">Apple Maps</a>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Estimated travel time: {distanceKm ? `${Math.max(6, Math.round(distanceKm * 4))}-${Math.max(10, Math.round(distanceKm * 6))} min by road` : 'use location to estimate'}.
            </p>
            <p className="mt-2 text-sm text-slate-400">Nearby landmark: {property.areaName || property.locationLabel || property.city || 'central locality'}</p>
            {locationError ? <p className="mt-3 text-sm text-rose-300">{locationError}</p> : null}
          </div>
          <div className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-500">Amenities</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 text-slate-300">
              {(property.amenities || ['WiFi', '24/7 Security', 'Kitchen access']).map((item) => (
                <li key={item} className="flex items-center gap-3 rounded-3xl bg-slate-950/80 p-4">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-300">{getAmenityIcon(item)}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {property.menuPhoto ? (
            <div className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-6 shadow-card">
              <p className="text-sm uppercase tracking-[0.28em] text-accent-500">Menu</p>
              <img src={property.menuPhoto} alt={`${property.name} menu`} className="mt-5 max-h-80 w-full rounded-[1.5rem] object-cover" />
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

export default PropertyDetailPage
