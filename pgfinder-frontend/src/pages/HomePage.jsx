import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiMapPin, FiSearch, FiStar } from 'react-icons/fi'
import SectionHeading from '../components/common/SectionHeading'
import Button from '../components/common/Button'
import Loader from '../components/common/Loader'
import PropertyCard from '../components/property/PropertyCard'
import propertyService from '../services/propertyService'
import useGoogleMaps from '../hooks/useGoogleMaps'
import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api'

const topCities = [
  { name: 'Mumbai', count: '128 PGs' },
  { name: 'Bangalore', count: '95 PGs' },
  { name: 'Pune', count: '76 PGs' },
]

const testimonials = [
  {
    name: 'Aditi Sharma',
    role: 'Student, Mumbai',
    quote: 'PG Finder made it effortless to compare verified rooms near my college and book a visit instantly.',
  },
  {
    name: 'Rahul Mehta',
    role: 'Young Professional',
    quote: 'Modern UX, transparent listings, and easy communication with owners made my move smooth.',
  },
]

function HomePage() {
  const { position, loading: locationLoading, error: locationError } = useGoogleMaps()
  const { isLoaded } = useLoadScript({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '' })
  const [popular, setPopular] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await propertyService.fetchPopularProperties()
        setPopular(data || [])
      } catch {
        setPopular([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex rounded-full bg-accent-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.28em] text-accent-200">
            Startup-grade rentals
          </span>
          <h1 className="mt-6 max-w-2xl text-4xl font-semibold text-white sm:text-5xl">
            Premium student and professional PGs with trusted host owners.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Discover verified properties, filter by preferences, explore nearby locations with maps, and manage your bookings from a modern dashboard.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link to="/properties">
              <Button>Browse properties</Button>
            </Link>
            <Link to="/signup?role=vendor">
              <Button variant="secondary">List your PG</Button>
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.75rem] bg-surface-800/80 p-5 text-slate-200 shadow-soft">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Verified stays</p>
              <p className="mt-4 text-3xl font-semibold text-white">250+</p>
            </div>
            <div className="rounded-[1.75rem] bg-surface-800/80 p-5 text-slate-200 shadow-soft">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Happy tenants</p>
              <p className="mt-4 text-3xl font-semibold text-white">4.8/5</p>
            </div>
            <div className="rounded-[1.75rem] bg-surface-800/80 p-5 text-slate-200 shadow-soft">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Hosts onboarded</p>
              <p className="mt-4 text-3xl font-semibold text-white">120+</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="rounded-[2rem] border border-slate-800/80 bg-surface-800/80 p-6 shadow-card">
          <div className="rounded-[1.75rem] border border-slate-700/60 bg-slate-950/80 p-6">
            <div className="flex items-center gap-4 text-slate-200">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-brand-500 text-xl text-slate-950">🏠</span>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Featured search</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Search with modern filters</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              <div className="rounded-3xl bg-slate-950/80 p-4 text-slate-300">
                <p className="font-semibold text-white">Campus-focused areas</p>
                <p className="mt-2 text-sm text-slate-400">Search by city, locality, college, or nearby location.</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-4 text-slate-300">
                <p className="font-semibold text-white">Smart filters</p>
                <p className="mt-2 text-sm text-slate-400">Gender, rent range, food plan, sharing type, and amenities.</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-4 text-slate-300">
                <p className="font-semibold text-white">Instant shortlist</p>
                <p className="mt-2 text-sm text-slate-400">Save favorite PGs and contact owners quickly.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mt-16">
        <SectionHeading title="Featured listings" description="Hand-picked PGs for students and young professionals." />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {loading ? (
            <Loader />
          ) : popular.length ? (
            popular.slice(0, 3).map((item) => <PropertyCard key={item.id || item._id} property={item} />)
          ) : (
            <div className="rounded-[2rem] border border-slate-800/70 bg-surface-800/90 p-10 text-center text-slate-300">
              No featured properties available yet.
            </div>
          )}
        </div>
      </section>

      <section className="mt-16 grid gap-10 lg:grid-cols-[0.9fr_0.7fr]">
        <div className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
          <div className="flex items-center gap-4 text-accent-200">
            <FiSearch size={24} />
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-accent-400">Nearby search</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Find PGs close to your current location</h2>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            {topCities.map((city) => (
              <span key={city.name} className="rounded-full bg-slate-950/80 px-4 py-3 text-sm text-slate-200">
                {city.name} · {city.count}
              </span>
            ))}
          </div>
          <div className="mt-8 space-y-4 rounded-[1.75rem] border border-slate-700/50 bg-slate-950/80 p-6">
            <div className="flex items-center gap-3 text-slate-300">
              <FiMapPin />
              <span>Use live maps to explore properties nearby and filter by commute.</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <FiStar />
              <span>Premium listings with reviews, vacancy status, and owner response data.</span>
            </div>
          </div>
        </div>
        <div className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-6 shadow-card">
          <div className="flex h-96 items-center justify-center rounded-[1.75rem] bg-slate-950/80">
            {isLoaded && !locationLoading && !locationError ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={position}
                zoom={12}
              >
                <MarkerF position={position} />
              </GoogleMap>
            ) : (
              <div className="text-center text-slate-400">
                <p className="text-lg font-semibold text-white">Map preview</p>
                <p className="mt-2 text-sm">Enable location or add a Google Maps API key in .env.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-16">
        <SectionHeading title="Student stories" description="Real reviews from students who moved with confidence." />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {testimonials.map((item) => (
            <motion.article
              key={item.name}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card"
            >
              <p className="text-lg leading-8 text-slate-300">“{item.quote}”</p>
              <div className="mt-6">
                <p className="font-semibold text-white">{item.name}</p>
                <p className="text-sm text-slate-400">{item.role}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage
