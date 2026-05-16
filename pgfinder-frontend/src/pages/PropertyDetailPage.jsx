import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiClock, FiMapPin, FiPhone, FiShield } from 'react-icons/fi'
import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api'
import Loader from '../components/common/Loader'
import Button from '../components/common/Button'
import propertyService from '../services/propertyService'
import { useAuth } from '../context/AuthContext'

function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isLoaded } = useLoadScript({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '' })

  useEffect(() => {
    const loadProperty = async () => {
      try {
        const data = await propertyService.fetchPropertyById(id)
        setProperty(data)
      } catch (err) {
        setError('Unable to load property details.')
      } finally {
        setLoading(false)
      }
    }
    loadProperty()
  }, [id])

  const { user } = useAuth()

  const handleShortlist = async () => {
    if (!user || !user._id) {
      return alert('Please login to shortlist properties.')
    }
    try {
      await propertyService.shortlistProperty({ userIDFK: user._id, propertyIDFK: property._id })
      alert('Property saved to your shortlist.')
    } catch (err) {
      console.error(err)
      alert('Unable to save shortlist.')
    }
  }

  const handleBookVisit = async () => {
    if (!user || !user._id) {
      return alert('Please login to book a visit.')
    }
    try {
      await propertyService.bookVisit({ userIDFK: user._id, propertyIDFK: property._id, visitDate: new Date() })
      alert('Visit request submitted.')
    } catch (err) {
      console.error(err)
      alert('Unable to book visit.')
    }
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
          </div>

          <div className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-accent-400">{property.type || 'PG / Hostel'}</p>
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
                <p className="mt-2 text-base text-white">{property.foodIncluded ? 'Included' : 'Optional'}</p>
              </div>
            </div>
            <div className="mt-8 space-y-4 text-slate-300">
              <p>{property.description || 'A thoughtfully curated PG with modern rooms, fast WiFi, and a friendly atmosphere near campuses.'}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-950/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Occupancy</p>
                  <p className="mt-2 text-sm text-white">{property.occupancy || '80% full'}</p>
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
                <p className="mt-2 text-white">{property.contact || '+91 98765 43210'}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-5">
                <FiClock className="text-accent-400" />
                <p className="mt-3 text-sm text-slate-400">Next available visit</p>
                <p className="mt-2 text-white">{property.nextVisit || 'Tomorrow 3:00 PM'}</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button onClick={handleShortlist} className="w-full sm:w-auto">Shortlist</Button>
              <Button onClick={handleBookVisit} variant="secondary" className="w-full sm:w-auto">Book visit</Button>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-500">Location</p>
            <div className="mt-6 rounded-[1.75rem] overflow-hidden border border-slate-700/80 bg-slate-950/80">
              {isLoaded ? (
                <div className="h-80 w-full">
                  <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={coordinates} zoom={13}>
                    <MarkerF position={coordinates} />
                  </GoogleMap>
                </div>
              ) : (
                <div className="flex h-80 items-center justify-center bg-slate-950 text-slate-400">
                  Google Maps loading…
                </div>
              )}
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-500">Amenities</p>
            <ul className="mt-6 space-y-3 text-slate-300">
              {(property.amenities || ['WiFi', '24/7 Security', 'Kitchen access']).map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-900 text-accent-400">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default PropertyDetailPage
