import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FiMapPin, FiSearch } from 'react-icons/fi'
import SectionHeading from '../components/common/SectionHeading'
import Button from '../components/common/Button'
import Loader from '../components/common/Loader'
import PropertyCard from '../components/property/PropertyCard'
import PropertyMap from '../components/map/PropertyMap'
import propertyService from '../services/propertyService'
import useCurrentLocation from '../hooks/useCurrentLocation'
import { getDistanceKm } from '../utils/distance'

const filterOptions = [
  'PG',
  'Flat',
  'Hotel',
  'Hostel',
  'Boys',
  'Girls',
  'Co-ed',
  'Per-day check-in',
  'AC',
  'Non-AC',
  'Food included',
  'Attached bathroom',
]

const nearbyRadiusKm = 25
const ignoredSearchWords = new Set(['near', 'nearby', 'me', 'my', 'location', 'around'])
const normalizeSearchToken = (token) => {
  const singularMap = {
    pgs: 'pg',
    flats: 'flat',
    hotels: 'hotel',
    hostels: 'hostel',
    rooms: 'room',
  }
  return singularMap[token] || token
}

function PropertiesPage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState([])
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [sortBy, setSortBy] = useState('recommended')
  const [nearbyMode, setNearbyMode] = useState(false)
  const [mapSearchQuery, setMapSearchQuery] = useState('')
  const [mapSearchLoading, setMapSearchLoading] = useState(false)
  const [mapSearchError, setMapSearchError] = useState('')
  const [mapSearchMessage, setMapSearchMessage] = useState('')
  const {
    position,
    loading: locationLoading,
    error: locationError,
    hasUserLocation,
    requestLocation,
    setManualLocation,
  } = useCurrentLocation()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await propertyService.fetchProperties({ q: searchQuery })
        setProperties(data || [])
      } catch {
        setProperties([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [searchQuery])

  useEffect(() => {
    if (hasUserLocation && nearbyMode) {
      setSortBy('nearest')
    }
  }, [hasUserLocation, nearbyMode])

  const handleUseLocation = () => {
    setNearbyMode(true)
    requestLocation()
  }

  const handleSearchLocation = async () => {
    setMapSearchError('')
    setMapSearchMessage('')

    const query = mapSearchQuery.trim()
    if (!query) {
      setMapSearchError('Enter a location to search on the map.')
      return
    }

    setMapSearchLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      )
      const results = await response.json()

      if (!results.length) {
        throw new Error('No location found. Try a nearby address or city.')
      }

      const { lat, lon, display_name } = results[0]
      setManualLocation({ lat: Number(lat), lng: Number(lon) })
      setNearbyMode(true)
      setSortBy('nearest')
      setMapSearchMessage(`Showing results near ${display_name}`)
    } catch (err) {
      setMapSearchError(err?.message || 'Unable to find that location.')
    } finally {
      setMapSearchLoading(false)
    }
  }

  const filteredProperties = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    const searchTokens = normalizedSearch
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token && !ignoredSearchWords.has(token))
      .map(normalizeSearchToken)

    const matchingProperties = properties.map((item) => ({
      ...item,
      distanceKm: hasUserLocation ? getDistanceKm(position, item.location) : undefined,
    })).filter((item) => {
      const haystack = [
        item.name,
        item.description,
        item.address,
        item.city,
        item.locationLabel,
        item.type,
        item.category,
        item.gender,
        ...(item.amenities || []),
      ].filter(Boolean).join(' ').toLowerCase()

      if (searchTokens.length && !searchTokens.every((token) => haystack.includes(token))) {
        return false
      }

      return activeFilters.every((filter) => {
        if (['PG', 'Flat', 'Hotel', 'Hostel'].includes(filter)) return item.category === filter || item.type === filter
        if (filter === 'Per-day check-in') return item.perDayCheckIn
        if (filter === 'Food included') return item.foodIncluded
        if (filter === 'AC') return item.amenities?.some((amenity) => /ac|air conditioning/i.test(amenity))
        if (filter === 'Non-AC') return !item.amenities?.some((amenity) => /ac|air conditioning/i.test(amenity))
        if (filter === 'Attached bathroom') return item.amenities?.some((amenity) => /bathroom/i.test(amenity))
        return item.gender === filter
      })
    })
      .filter((item) => {
        const price = Number(item.rent) || 0
        const min = Number(priceRange.min) || 0
        const max = Number(priceRange.max) || Infinity
        return price >= min && price <= max
      })

    const nearbyMatches = matchingProperties.filter((item) => item.distanceKm !== null && item.distanceKm !== undefined && item.distanceKm <= nearbyRadiusKm)
    const propertiesToShow = hasUserLocation && nearbyMode && nearbyMatches.length ? nearbyMatches : matchingProperties

    return propertiesToShow
      .sort((a, b) => {
        if (sortBy === 'price-low') return (Number(a.rent) || 0) - (Number(b.rent) || 0)
        if (sortBy === 'price-high') return (Number(b.rent) || 0) - (Number(a.rent) || 0)
        if (sortBy === 'deposit-low') return (Number(a.depositAmount) || 0) - (Number(b.depositAmount) || 0)
        if (sortBy === 'nearest' || (nearbyMode && hasUserLocation)) return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
        return 0
      })
  }, [properties, activeFilters, searchQuery, priceRange, sortBy, hasUserLocation, nearbyMode, position])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.95fr_0.45fr]">
        <section>
          <SectionHeading title="Search stays" description="Explore PGs, flats, hostels, and hotels with price filters and daily check-in options." />
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mt-8 rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-3 rounded-3xl border border-slate-700/80 bg-slate-950/80 px-4 py-3">
                <FiSearch className="text-accent-400" />
                <input
                  type="search"
                  placeholder="Search city, locality or college"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                />
              </div>
              <Button variant="secondary" className="w-full sm:w-auto" onClick={handleUseLocation} disabled={locationLoading}>
                <span className="inline-flex items-center gap-2">
                  <FiMapPin /> {locationLoading ? 'Finding nearby...' : hasUserLocation && nearbyMode ? 'Showing nearby' : 'Use my location'}
                </span>
              </Button>
            </div>
            {locationError ? <p className="mt-3 text-sm text-rose-300">{locationError}</p> : null}
            <div className="mt-4 grid gap-4 md:grid-cols-[1.8fr_0.9fr]">
              <input
                type="search"
                value={mapSearchQuery}
                onChange={(event) => setMapSearchQuery(event.target.value)}
                placeholder="Search location on map (e.g. Bangalore, Koramangala)"
                className="w-full rounded-3xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              />
              <Button variant="secondary" className="w-full" onClick={handleSearchLocation} disabled={mapSearchLoading}>
                {mapSearchLoading ? 'Searching location…' : 'Search on map'}
              </Button>
            </div>
            {mapSearchError ? <p className="mt-3 text-sm text-rose-300">{mapSearchError}</p> : null}
            {mapSearchMessage ? <p className="mt-3 text-sm text-emerald-300">{mapSearchMessage}</p> : null}
            {hasUserLocation && nearbyMode ? (
              <p className="mt-3 text-sm text-emerald-300">
                Showing nearby stays within {nearbyRadiusKm} km first. Search for PG, hotel, flat, hostel, or an area to narrow it down.
              </p>
            ) : null}
            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_1.2fr]">
              <input
                type="number"
                value={priceRange.min}
                onChange={(event) => setPriceRange((current) => ({ ...current, min: event.target.value }))}
                placeholder="Min monthly price"
                className="w-full rounded-3xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              />
              <input
                type="number"
                value={priceRange.max}
                onChange={(event) => setPriceRange((current) => ({ ...current, max: event.target.value }))}
                placeholder="Max monthly price"
                className="w-full rounded-3xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full rounded-3xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="deposit-low">Deposit: low to high</option>
                <option value="nearest">Nearest first</option>
              </select>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {filterOptions.map((option) => {
                const active = activeFilters.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setActiveFilters((current) =>
                        current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
                      )
                    }}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      active
                        ? 'border-accent-400 bg-accent-500/10 text-accent-200'
                        : 'border-slate-700/80 text-slate-300 hover:border-accent-500 hover:text-white'
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </motion.div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {loading ? (
              <Loader message="Fetching properties…" />
            ) : filteredProperties.length ? (
              filteredProperties.map((property) => <PropertyCard key={property.id || property._id} property={property} />)
            ) : (
              <div className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-10 text-center text-slate-300">
                No properties found. Adjust the filters or search query.
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-500">Map view</p>
            <div className="mt-5 h-80 overflow-hidden rounded-[1.75rem] border border-slate-700/80 bg-slate-950/80">
              <PropertyMap
                properties={filteredProperties}
                userLocation={hasUserLocation ? position : null}
                center={hasUserLocation ? position : filteredProperties[0]?.location}
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-500">Quick stats</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Results for your search</h2>
            <div className="mt-6 grid gap-4">
              <div className="rounded-3xl bg-slate-950/80 p-4 text-slate-300">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total listings</p>
                <p className="mt-2 text-3xl font-semibold text-white">{filteredProperties.length}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-4 text-slate-300">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Available now</p>
                <p className="mt-2 text-3xl font-semibold text-white">{filteredProperties.filter((item) => item.status === 'Available').length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-500">Featured area</p>
            <h3 className="mt-3 text-xl font-semibold text-white">Koregaon Park</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Explore premium student-friendly PGs near cafes, co-working spaces, and top colleges.
            </p>
            <div className="mt-6 gap-2 text-sm text-slate-300">
              <p>• High-speed WiFi</p>
              <p>• Food options</p>
              <p>• Shared and private rooms</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default PropertiesPage
