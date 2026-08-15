import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiColumns, FiFilter, FiMap, FiMapPin, FiSearch, FiX } from 'react-icons/fi'
import SectionHeading from '../components/common/SectionHeading'
import Button from '../components/common/Button'
import Loader from '../components/common/Loader'
import PropertyCard from '../components/property/PropertyCard'
import PropertyMap from '../components/map/PropertyMap'
import AdSlot from '../components/ads/AdSlot'
import propertyService from '../services/propertyService'
import dashboardService from '../services/dashboardService'
import useCurrentLocation from '../hooks/useCurrentLocation'
import { useAuth } from '../context/AuthContext'
import { getDistanceKm } from '../utils/distance'
import SEO from '../components/SEO'
import { MVP_CITY } from '../config/mvp'
import { readCompareIds, writeCompareIds } from '../utils/compareStorage'

const filterOptions = [
  'PG',
  'Hostel',
  'Flat',
  'House',
  'Apartment',
  'Villa',
  'Co-living',
  'Boys',
  'Girls',
  'Co-ed',
  'Per-day check-in',
  'AC',
  'Non-AC',
  'Food included',
  'Parking',
  'Available now',
  'Rating 4+',
  'Single sharing',
  'Double sharing',
  'Triple sharing',
  'Four sharing',
  'Five sharing',
  'Dormitory',
  'Attached bathroom',
]

const defaultNearbyRadiusKm = 5
const expandedNearbyRadiusKm = 25
const propertyCategories = ['PG', 'Hostel', 'Flat', 'House', 'Apartment', 'Villa', 'Co-living']
const sharingFilters = ['Single sharing', 'Double sharing', 'Triple sharing', 'Four sharing', 'Five sharing', 'Dormitory']
const ignoredSearchWords = new Set(['near', 'nearby', 'me', 'my', 'location', 'around'])
const normalizeSearchToken = (token) => {
  const singularMap = {
    pgs: 'pg',
    hostels: 'hostel',
    rooms: 'room',
  }
  return singularMap[token] || token
}

const safeParseSavedSearchState = (value) => {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const getSavedSearchStateFromParams = (searchParams) => {
  const savedState = safeParseSavedSearchState(searchParams.get('state'))
  const filterState = safeParseSavedSearchState(searchParams.get('filters'))
  const activeFilters = savedState?.activeFilters || filterState?.activeFilters || searchParams.getAll('filter')

  return {
    searchQuery: savedState?.searchQuery ?? searchParams.get('search') ?? searchParams.get('city') ?? searchParams.get('area') ?? '',
    city: savedState?.city ?? searchParams.get('city') ?? '',
    mapSearchQuery: savedState?.mapSearchQuery ?? searchParams.get('area') ?? searchParams.get('locality') ?? '',
    activeFilters: Array.isArray(activeFilters) ? activeFilters : [],
    priceRange: {
      min: savedState?.priceRange?.min ?? filterState?.priceRange?.min ?? searchParams.get('minPrice') ?? '',
      max: savedState?.priceRange?.max ?? filterState?.priceRange?.max ?? searchParams.get('maxPrice') ?? '',
    },
    sortBy: savedState?.sortBy ?? filterState?.sortBy ?? searchParams.get('sort') ?? 'recommended',
    nearbyMode: Boolean(savedState?.nearbyMode ?? filterState?.nearbyMode ?? (searchParams.get('nearby') === 'true')),
    searchRadiusKm: Number(savedState?.searchRadiusKm ?? filterState?.searchRadiusKm ?? searchParams.get('radius')) || defaultNearbyRadiusKm,
    pagination: savedState?.pagination || {
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '',
    },
  }
}

const buildSavedSearchQueryString = (state) => {
  const params = new URLSearchParams()
  if (state.searchQuery) params.set('search', state.searchQuery)
  if (state.city) params.set('city', state.city)
  if (state.mapSearchQuery) params.set('area', state.mapSearchQuery)
  state.activeFilters.forEach((filter) => params.append('filter', filter))
  if (state.priceRange.min) params.set('minPrice', state.priceRange.min)
  if (state.priceRange.max) params.set('maxPrice', state.priceRange.max)
  if (state.sortBy) params.set('sort', state.sortBy)
  params.set('nearby', String(Boolean(state.nearbyMode)))
  params.set('radius', String(state.searchRadiusKm || defaultNearbyRadiusKm))
  if (state.pagination?.page) params.set('page', state.pagination.page)
  if (state.pagination?.pageSize) params.set('pageSize', state.pagination.pageSize)
  params.set('state', JSON.stringify(state))
  return params.toString()
}

const isSimilarToken = (token, value) => {
  if (!token || !value) return false
  if (value.includes(token) || token.includes(value)) return true
  if (Math.abs(token.length - value.length) > 2) return false

  let mismatches = 0
  const maxLength = Math.max(token.length, value.length)
  for (let index = 0; index < maxLength; index += 1) {
    if (token[index] !== value[index]) mismatches += 1
    if (mismatches > 2) return false
  }
  return true
}

function PropertiesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialSavedSearchState = getSavedSearchStateFromParams(searchParams)
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialSavedSearchState.searchQuery)
  const [activeFilters, setActiveFilters] = useState(initialSavedSearchState.activeFilters)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [priceRange, setPriceRange] = useState(initialSavedSearchState.priceRange)
  const [sortBy, setSortBy] = useState(initialSavedSearchState.sortBy)
  const [nearbyMode, setNearbyMode] = useState(initialSavedSearchState.nearbyMode)
  const [searchRadiusKm, setSearchRadiusKm] = useState(initialSavedSearchState.searchRadiusKm)
  const [page, setPage] = useState(Number(initialSavedSearchState.pagination?.page) || 1)
  const [pageSize, setPageSize] = useState(Number(initialSavedSearchState.pagination?.pageSize) || 24)
  const [paginationMeta, setPaginationMeta] = useState({ page: Number(initialSavedSearchState.pagination?.page) || 1, limit: 24, total: 0, pages: 1 })
  const [mapSearchQuery, setMapSearchQuery] = useState(initialSavedSearchState.mapSearchQuery)
  const [mapSearchLoading, setMapSearchLoading] = useState(false)
  const [mapSearchError, setMapSearchError] = useState('')
  const [mapSearchMessage, setMapSearchMessage] = useState('')
  const { user, isAuthenticated, role } = useAuth()
  const [savedPropertyIds, setSavedPropertyIds] = useState(new Set())
  const [compareIds, setCompareIds] = useState(() => new Set(readCompareIds(user)))
  const [compareMessage, setCompareMessage] = useState('')
  const [saveSearchMessage, setSaveSearchMessage] = useState('')
  const {
    position,
    loading: locationLoading,
    error: locationError,
    hasUserLocation,
    requestLocation,
    setManualLocation,
  } = useCurrentLocation()

  useEffect(() => {
    queueMicrotask(() => {
      setCompareIds(new Set(readCompareIds(user)))
      setCompareMessage('')
    })
  }, [isAuthenticated, user])

  useEffect(() => {
    const loadWishlist = async () => {
      if (!isAuthenticated || !user?._id) {
        setSavedPropertyIds(new Set())
        return
      }

      try {
        const shortlist = await propertyService.fetchShortlist(user._id)
        const savedIds = new Set(
          shortlist
            .map((item) => item.property?.id || item.property?._id || item.propertyIDFK?._id)
            .filter(Boolean),
        )
        setSavedPropertyIds(savedIds)
      } catch {
        setSavedPropertyIds(new Set())
      }
    }

    loadWishlist()
  }, [isAuthenticated, navigate, role, user?._id])

  useEffect(() => {
    window.setTimeout(() => {
      const nextState = getSavedSearchStateFromParams(searchParams)
      setSearchQuery(nextState.searchQuery)
      setActiveFilters(nextState.activeFilters)
      setPriceRange(nextState.priceRange)
      setSortBy(nextState.sortBy)
      setNearbyMode(nextState.nearbyMode)
      setSearchRadiusKm(nextState.searchRadiusKm)
      setMapSearchQuery(nextState.mapSearchQuery)
      setPage(Number(nextState.pagination?.page) || 1)
      setPageSize(Number(nextState.pagination?.pageSize) || 24)
    }, 0)
  }, [searchParams])

  const handleToggleSave = async (propertyIDFK, shouldSave) => {
    if (!isAuthenticated || !user?._id) {
      navigate('/login', { replace: true })
      return
    }

    try {
      if (shouldSave) {
        await propertyService.shortlistProperty({ userIDFK: user._id, propertyIDFK })
        setSavedPropertyIds((current) => new Set(current).add(propertyIDFK))
      } else {
        await propertyService.removeShortlistProperty({ userIDFK: user._id, propertyIDFK })
        setSavedPropertyIds((current) => {
          const next = new Set(current)
          next.delete(propertyIDFK)
          return next
        })
      }
    } catch {
      alert('Unable to update this PG in your wishlist.')
    }
  }

  const handleSaveSearch = async () => {
    if (!isAuthenticated || !user?._id) {
      navigate('/login', { replace: true })
      return
    }
    setSaveSearchMessage('')
    try {
      const savedSearchState = {
        searchQuery,
        city: searchParams.get('city') || searchQuery,
        mapSearchQuery,
        activeFilters,
        priceRange,
        sortBy,
        nearbyMode,
        searchRadiusKm,
        pagination: {
          page,
          pageSize,
        },
      }
      await dashboardService.saveSearch({
        userId: user._id,
        city: savedSearchState.city,
        locality: mapSearchQuery,
        budget: [priceRange.min, priceRange.max].filter(Boolean).join(' - '),
        sharingType: activeFilters.filter((item) => /sharing/i.test(item)).join(', '),
        nearbyPreferences: activeFilters,
        filters: savedSearchState,
        queryString: buildSavedSearchQueryString(savedSearchState),
      })
      setSaveSearchMessage('Search saved to your dashboard.')
    } catch (error) {
      setSaveSearchMessage(error?.message || 'Unable to save this search.')
    }
  }

  const toggleCompare = (property) => {
    if (!isAuthenticated || !user?._id) {
      navigate('/login', { replace: true })
      return
    }

    const propertyId = property.id || property._id
    if (!propertyId) return
    setCompareMessage('')
    setCompareIds((current) => {
      const next = new Set(current)
      if (next.has(propertyId)) {
        next.delete(propertyId)
        writeCompareIds(user, [...next])
        return next
      }
      if (next.size >= 3) {
        setCompareMessage('You can compare up to 3 properties at once.')
        return current
      }
      next.add(propertyId)
      writeCompareIds(user, [...next])
      return next
    })
  }

  const clearCompare = () => {
    writeCompareIds(user, [])
    setCompareIds(new Set())
    setCompareMessage('')
  }

  const backendFilterParams = useMemo(() => {
    const gender = activeFilters.filter((filter) => ['Boys', 'Girls', 'Co-ed'].includes(filter)).join(',')
    const categories = activeFilters.filter((filter) => propertyCategories.includes(filter)).join(',')
    const amenities = activeFilters.filter((filter) => ['AC', 'Parking', 'Attached bathroom'].includes(filter)).join(',')
    const sharingType = activeFilters
      .filter((filter) => sharingFilters.includes(filter))
      .map((filter) => filter.replace(' sharing', ''))
      .join(',')

    return {
      cityName: MVP_CITY,
      search: searchQuery,
      area: mapSearchQuery,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      gender,
      categories,
      sharingType,
      amenities,
      foodIncluded: activeFilters.includes('Food included'),
      ac: activeFilters.includes('AC'),
      parking: activeFilters.includes('Parking'),
      attachedBathroom: activeFilters.includes('Attached bathroom'),
      availableNow: activeFilters.includes('Available now'),
      rating: activeFilters.includes('Rating 4+') ? 4 : '',
      page,
      limit: pageSize,
    }
  }, [activeFilters, mapSearchQuery, page, pageSize, priceRange.max, priceRange.min, searchQuery])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await propertyService.fetchPropertyPage(backendFilterParams)
        setProperties(data.items || [])
        setPaginationMeta(data.meta || { page, limit: pageSize, total: data.items?.length || 0, pages: 1 })
      } catch {
        setProperties([])
        setPaginationMeta({ page, limit: pageSize, total: 0, pages: 1 })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [backendFilterParams, page, pageSize])

  useEffect(() => {
    if (searchParams.get('nearby') === 'true' && !hasUserLocation && !locationLoading) {
      requestLocation()
    }
  }, [hasUserLocation, locationLoading, requestLocation, searchParams])

  useEffect(() => {
    if (hasUserLocation && nearbyMode) {
      window.setTimeout(() => setSortBy('nearest'), 0)
    }
  }, [hasUserLocation, nearbyMode])

  const handleUseLocation = () => {
    setNearbyMode(true)
    setSearchRadiusKm(defaultNearbyRadiusKm)
    requestLocation()
  }

  const toggleFilter = (option) => {
    setActiveFilters((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
    )
    setPage(1)
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${query}, ${MVP_CITY}, Karnataka`)}&limit=1`,
      )
      const results = await response.json()

      if (!results.length) {
        throw new Error('No location found. Try a nearby address or city.')
      }

      const { lat, lon, display_name } = results[0]
      setManualLocation({ lat: Number(lat), lng: Number(lon) })
      setNearbyMode(true)
      setSearchRadiusKm(defaultNearbyRadiusKm)
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

    const categoryFilters = activeFilters.filter((filter) => propertyCategories.includes(filter))
    const genderFilters = activeFilters.filter((filter) => ['Boys', 'Girls', 'Co-ed'].includes(filter))
    const utilityFilters = activeFilters.filter((filter) => !categoryFilters.includes(filter) && !genderFilters.includes(filter))

    const matchingProperties = properties.map((item) => ({
      ...item,
      distanceKm: hasUserLocation ? getDistanceKm(position, item.location) : undefined,
    }))
      .filter((item) => {
        const haystack = [
          item.name,
          item.description,
          item.address,
          item.city,
          item.cityName,
          item.state,
          item.stateName,
          item.area,
          item.areaName,
          item.locationLabel,
          item.type,
          item.category,
          item.gender,
          ...(item.amenities || []),
        ].filter(Boolean).join(' ').toLowerCase()

        if (searchTokens.length && !searchTokens.every((token) => {
          if (haystack.includes(token)) return true
          return [item.name, item.city, item.state, item.stateName, item.area, item.locationLabel, item.category, item.type]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .split(/\W+/)
            .some((word) => isSimilarToken(token, word))
        })) {
          return false
        }

        return utilityFilters.every((filter) => {
          if (propertyCategories.includes(filter)) {
            if (filter === 'Co-living') {
              return ['Co-ed', 'Boys', 'Girls'].includes(item.gender) || /co.?living|co.?ed/i.test(`${item.category} ${item.type} ${item.description}`)
            }
            return item.category === filter || item.type === filter
          }
          if (['Boys', 'Girls', 'Co-ed'].includes(filter)) {
            const allowsCoLiving = categoryFilters.includes('Co-living') || filter === 'Co-ed'
            return allowsCoLiving || filter === item.gender
          }
          if (filter === 'Per-day check-in') return item.perDayCheckIn
          if (filter === 'Food included') return item.foodIncluded
          if (filter === 'AC') return item.acAvailable || item.amenities?.some((amenity) => /ac|air conditioning/i.test(amenity))
          if (filter === 'Non-AC') return !item.acAvailable && !item.amenities?.some((amenity) => /ac|air conditioning/i.test(amenity))
          if (filter === 'Attached bathroom') return item.amenities?.some((amenity) => /bathroom/i.test(amenity))
          if (filter === 'Parking') return item.parkingAvailable || item.amenities?.some((amenity) => /parking/i.test(amenity))
          if (filter === 'Available now') return item.status === 'Available' && item.vacancyStatus !== 'Fully occupied'
          if (filter === 'Rating 4+') return Number(item.rating) >= 4
          if (filter === 'Single sharing') return /single|1/i.test(item.sharingAvailability || item.sharing || '')
          if (filter === 'Double sharing') return /double|2/i.test(item.sharingAvailability || item.sharing || '')
          if (filter === 'Triple sharing') return /triple|3/i.test(item.sharingAvailability || item.sharing || '')
          return item.gender === filter
        })
      })
      .filter((item) => {
        const price = Number(item.rent) || 0
        const min = Number(priceRange.min) || 0
        const max = Number(priceRange.max) || Infinity
        return price >= min && price <= max
      })

    const nearbyMatches = matchingProperties.filter((item) => item.distanceKm !== null && item.distanceKm !== undefined && item.distanceKm <= searchRadiusKm)
    const propertiesToShow = matchingProperties

    return propertiesToShow
      .sort((a, b) => {
        if (Boolean(a.isPremium) !== Boolean(b.isPremium)) return a.isPremium ? -1 : 1
        if ((Number(a.priority) || 0) !== (Number(b.priority) || 0)) return (Number(b.priority) || 0) - (Number(a.priority) || 0)
        if (hasUserLocation && nearbyMode && nearbyMatches.length) {
          const aIsNearby = a.distanceKm !== null && a.distanceKm !== undefined && a.distanceKm <= searchRadiusKm ? 0 : 1
          const bIsNearby = b.distanceKm !== null && b.distanceKm !== undefined && b.distanceKm <= searchRadiusKm ? 0 : 1
          if (aIsNearby !== bIsNearby) return aIsNearby - bIsNearby
        }
        if (sortBy === 'price-low') return (Number(a.rent) || 0) - (Number(b.rent) || 0)
        if (sortBy === 'price-high') return (Number(b.rent) || 0) - (Number(a.rent) || 0)
        if (sortBy === 'deposit-low') return (Number(a.depositAmount) || 0) - (Number(b.depositAmount) || 0)
        if (sortBy === 'nearest' || (nearbyMode && hasUserLocation)) return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
        if (searchTokens.length) {
          const score = (item) => {
            const name = (item.name || '').toLowerCase()
            if (name === normalizedSearch) return 0
            if (name.startsWith(normalizedSearch)) return 1
            if (name.includes(normalizedSearch)) return 2
            return 3
          }
          return score(a) - score(b)
        }
        return 0
      })
  }, [properties, activeFilters, searchQuery, priceRange, sortBy, hasUserLocation, nearbyMode, position, searchRadiusKm])

  const nearbyCount = useMemo(
    () => properties.filter((item) => {
      const distance = hasUserLocation ? getDistanceKm(position, item.location) : null
      return distance !== null && distance !== undefined && distance <= searchRadiusKm
    }).length,
    [hasUserLocation, position, properties, searchRadiusKm],
  )

  const suggestedProperties = useMemo(() => {
    if (filteredProperties.length) return []
    const filteredIds = new Set(filteredProperties.map((item) => item.id || item._id))
    return [...properties]
      .filter((item) => !filteredIds.has(item.id || item._id))
      .sort((a, b) => Number(Boolean(a.isDummy)) - Number(Boolean(b.isDummy)))
      .slice(0, 5)
  }, [filteredProperties, properties])

  const quickMobileFilters = ['PG', 'Boys', 'Girls', 'Co-ed', 'Available now', 'Food included']
  const activeFilterCount = activeFilters.length + Number(Boolean(priceRange.min)) + Number(Boolean(priceRange.max)) + Number(nearbyMode)

  return (
    <div className="mx-auto max-w-7xl overflow-x-hidden px-3 pb-24 pt-5 sm:px-6 sm:py-8 lg:px-8">
      <SEO
        title="Search PG in Bangalore"
        description="Search verified PGs, boys PG, girls PG, hostels, and co-living rooms across Bangalore localities with filters, maps, wishlist, and visit booking."
        path="/properties"
        keywords={['PG in Bangalore', 'Affordable PG Bangalore', 'PG near Whitefield', 'PG near Electronic City']}
      />
      <div className="grid gap-10 lg:grid-cols-[0.95fr_0.45fr]">
        <section>
          <div className="sm:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-400">Explore stays</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Find PGs fast</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Search, filter, and compare Bangalore stays without long scrolling.</p>
          </div>
          <div className="hidden sm:block">
            <SectionHeading title="Search Bangalore PGs" description="Explore Bangalore PGs, hostels, and co-living rooms with price filters, maps, and visit requests." />
          </div>
          <div className="mt-5 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Live listings', value: filteredProperties.length },
              { label: 'Vacant now', value: filteredProperties.filter((item) => item.status === 'Available').length },
              { label: 'Avg. rating', value: filteredProperties.length ? (filteredProperties.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) / filteredProperties.length).toFixed(1) : '4.6' },
              { label: 'Nearby radius', value: `${searchRadiusKm} km` },
            ].map((item) => (
              <div key={item.label} className="min-w-0 rounded-2xl border border-slate-800/80 bg-surface-800/90 p-4 shadow-card sm:p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 sm:tracking-[0.22em]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="sticky top-2 z-30 mt-5 rounded-2xl border border-slate-800/80 bg-surface-800/95 p-3 shadow-card backdrop-blur-xl sm:static sm:mt-8 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 sm:rounded-3xl">
                <FiSearch className="text-accent-400" />
                <input
                  type="search"
                  placeholder="Search city, locality or college"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value)
                    setPage(1)
                  }}
                  className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={locationLoading}
                  className="inline-flex min-h-11 items-center justify-center gap-1 rounded-2xl border border-white/15 bg-white/10 px-3 text-xs font-semibold text-white disabled:opacity-60"
                >
                  <FiMapPin /> {hasUserLocation && nearbyMode ? 'Nearby' : 'Near me'}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-1 rounded-2xl bg-cyan-400 px-3 text-xs font-semibold text-slate-950"
                >
                  <FiFilter /> Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
                </button>
                <a
                  href="#map-view"
                  className="inline-flex min-h-11 items-center justify-center gap-1 rounded-2xl border border-white/15 bg-white/10 px-3 text-xs font-semibold text-white"
                >
                  <FiMap /> Map
                </a>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 sm:hidden">
                {quickMobileFilters.map((option) => {
                  const active = activeFilters.includes(option)
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleFilter(option)}
                      className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${
                        active
                          ? 'border-accent-400 bg-accent-500/10 text-accent-100'
                          : 'border-slate-700/80 text-slate-300'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
              <Button variant="secondary" className="hidden w-full sm:inline-flex sm:w-auto" onClick={handleUseLocation} disabled={locationLoading}>
                <span className="inline-flex items-center gap-2">
                  <FiMapPin /> {locationLoading ? 'Finding nearby...' : hasUserLocation && nearbyMode ? 'Showing nearby' : 'Use my location'}
                </span>
              </Button>
              <Button className="hidden w-full sm:inline-flex sm:w-auto" onClick={handleSaveSearch}>Save search</Button>
            </div>
            {saveSearchMessage ? <p className={`mt-3 text-sm ${saveSearchMessage.startsWith('Unable') ? 'text-rose-300' : 'text-emerald-300'}`}>{saveSearchMessage}</p> : null}
            {locationError ? <p className="mt-3 text-sm text-rose-300">{locationError}</p> : null}
            <div className={`${mobileFiltersOpen ? 'block' : 'hidden'} sm:block`}>
            <div className="mt-4 flex items-center justify-between gap-3 sm:hidden">
              <p className="text-sm font-semibold text-white">Advanced filters</p>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white"
                aria-label="Close filters"
              >
                <FiX />
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[1.8fr_0.9fr]">
              <input
                type="search"
                value={mapSearchQuery}
                onChange={(event) => {
                  setMapSearchQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="Search location on map (e.g. Bangalore, Koramangala)"
                className="w-full rounded-3xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              />
              <Button variant="secondary" className="w-full" onClick={handleSearchLocation} disabled={mapSearchLoading}>
                {mapSearchLoading ? 'Searching location...' : 'Search on map'}
              </Button>
            </div>
            {mapSearchError ? <p className="mt-3 text-sm text-rose-300">{mapSearchError}</p> : null}
            {mapSearchMessage ? <p className="mt-3 text-sm text-emerald-300">{mapSearchMessage}</p> : null}
            {hasUserLocation && nearbyMode ? (
              <>
                <p className="mt-3 text-sm text-emerald-300">
                  Searching within {searchRadiusKm} km first. Search for PG name, hostel, co-living, or a Bangalore area to narrow it down.
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Nearby listings are shown first, followed by matching Bangalore properties outside the radius.
                </p>
              </>
            ) : null}
            {hasUserLocation && nearbyMode ? (
              <label className="mt-4 block text-sm text-slate-300">
                Result range
                <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={searchRadiusKm}
                    onChange={(event) => setSearchRadiusKm(Number(event.target.value))}
                    className="w-full accent-cyan-400"
                  />
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={searchRadiusKm}
                    onChange={(event) => setSearchRadiusKm(Math.max(1, Number(event.target.value) || 1))}
                    className="w-full rounded-3xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400 sm:w-32"
                  />
                </div>
              </label>
            ) : null}
            {hasUserLocation && nearbyMode && nearbyCount === 0 && searchRadiusKm === defaultNearbyRadiusKm ? (
              <div className="mt-4 rounded-3xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                No stays found within 5 km. Increase range to 25 km for wider discovery.
                <button type="button" onClick={() => setSearchRadiusKm(expandedNearbyRadiusKm)} className="mt-3 rounded-full bg-amber-400 px-3 py-1 font-semibold text-slate-950 sm:ml-3 sm:mt-0">
                  Increase range
                </button>
              </div>
            ) : null}
            {hasUserLocation && nearbyMode && nearbyCount === 0 && searchRadiusKm === expandedNearbyRadiusKm ? (
              <p className="mt-4 rounded-3xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-300">
                Sorry, we currently do not have PGs in this range. Showing all available Bangalore PGs{searchQuery ? ` for ${searchQuery}` : ''}.
              </p>
            ) : null}
            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_1.2fr]">
              <input
                type="number"
                value={priceRange.min}
                onChange={(event) => {
                  setPriceRange((current) => ({ ...current, min: event.target.value }))
                  setPage(1)
                }}
                placeholder="Min monthly price"
                className="w-full rounded-3xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              />
              <input
                type="number"
                value={priceRange.max}
                onChange={(event) => {
                  setPriceRange((current) => ({ ...current, max: event.target.value }))
                  setPage(1)
                }}
                placeholder="Max monthly price"
                className="w-full rounded-3xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              />
              <select
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value)
                  setPage(1)
                }}
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
                      toggleFilter(option)
                    }}
                    className={`max-w-full rounded-full border px-3 py-2 text-sm transition sm:px-4 ${
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
            <div className="mt-5 grid grid-cols-2 gap-3 sm:hidden">
              <Button variant="secondary" onClick={() => {
                setActiveFilters([])
                setPriceRange({ min: '', max: '' })
                setNearbyMode(false)
                setPage(1)
              }}>
                Clear
              </Button>
              <Button onClick={() => setMobileFiltersOpen(false)}>Show stays</Button>
            </div>
            </div>
            {compareMessage ? <p className="mt-3 text-sm text-amber-200">{compareMessage}</p> : null}
          </motion.div>

          {compareIds.size ? (
            <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-h-[45vh] max-w-5xl flex-col gap-3 overflow-y-auto rounded-2xl border border-cyan-400/30 bg-slate-950/95 p-4 text-sm text-cyan-100 shadow-card backdrop-blur-xl sm:inset-x-4 sm:bottom-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold">{compareIds.size}/3 properties selected for comparison</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {filteredProperties
                    .filter((item) => compareIds.has(item.id || item._id))
                    .slice(0, 3)
                    .map((item) => (
                      <span key={item.id || item._id} className="max-w-[12rem] truncate rounded-full border border-cyan-400/30 px-3 py-1 text-xs text-cyan-100">
                        {item.name}
                      </span>
                    ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" className="w-full sm:w-auto" onClick={clearCompare}>Clear</Button>
                <Button className="w-full sm:w-auto" onClick={() => navigate('/compare')}>
                  <FiColumns className="mr-2" /> Open compare
                </Button>
              </div>
            </div>
          ) : null}

          <div id="map-view" className="mt-6 rounded-2xl border border-slate-800/80 bg-surface-800/90 p-3 shadow-card lg:hidden">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-400">Map view</p>
                <p className="mt-1 text-sm text-slate-400">{filteredProperties.length} stays around your search</p>
              </div>
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={locationLoading}
                className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {hasUserLocation && nearbyMode ? 'Nearby on' : 'Near me'}
              </button>
            </div>
            <div className="h-56 overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/80">
              <PropertyMap
                properties={filteredProperties}
                userLocation={hasUserLocation ? position : null}
                center={hasUserLocation ? position : filteredProperties[0]?.location}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-surface-800/90 p-3 text-sm text-slate-300 sm:hidden">
            <span>{paginationMeta.total || filteredProperties.length} stays</span>
            <span>{filteredProperties.filter((item) => item.status === 'Available').length} vacant now</span>
            <span>{searchRadiusKm} km</span>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {loading ? (
              <Loader message="Fetching properties..." />
            ) : filteredProperties.length ? (
              filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id || property._id}
                  property={property}
                  saved={savedPropertyIds.has(property.id || property._id)}
                  onToggleSave={handleToggleSave}
                  compareSelected={compareIds.has(property.id || property._id)}
                  onToggleCompare={toggleCompare}
                />
              ))
            ) : (
              <div className="lg:col-span-2">
                <div className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-10 text-center text-slate-300">
                  No properties found. Adjust the filters or search query.
                </div>
                {suggestedProperties.length ? (
                  <div className="mt-6">
                    <p className="mb-4 text-sm text-slate-400">
                      Here are a few Bangalore PGs to explore while you adjust the filters.
                    </p>
                    <div className="grid gap-6 lg:grid-cols-2">
                      {suggestedProperties.map((property) => (
                        <PropertyCard
                          key={property.id || property._id}
                          property={property}
                          saved={savedPropertyIds.has(property.id || property._id)}
                          onToggleSave={handleToggleSave}
                          compareSelected={compareIds.has(property.id || property._id)}
                          onToggleCompare={toggleCompare}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <div className="mt-8 flex flex-col gap-4 rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-4 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing page {paginationMeta.page || page} of {paginationMeta.pages || 1}
              {paginationMeta.total ? ` (${paginationMeta.total} matching Bangalore PGs)` : ''}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value))
                  setPage(1)
                }}
                className="rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-100 outline-none"
              >
                <option value={12}>12 per page</option>
                <option value={24}>24 per page</option>
                <option value={48}>48 per page</option>
              </select>
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-full border border-slate-700 px-4 py-2 text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= (paginationMeta.pages || 1) || loading}
                onClick={() => setPage((current) => Math.min(paginationMeta.pages || current + 1, current + 1))}
                className="rounded-full border border-slate-700 px-4 py-2 text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <aside className="hidden space-y-6 lg:block">
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
                <p className="mt-2 text-3xl font-semibold text-white">{paginationMeta.total || filteredProperties.length}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-4 text-slate-300">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Available now</p>
                <p className="mt-2 text-3xl font-semibold text-white">{filteredProperties.filter((item) => item.status === 'Available').length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-500">Featured area</p>
            <h3 className="mt-3 text-xl font-semibold text-white">Whitefield</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Explore verified PGs near ITPL, EPIP Zone, metro access, cafes, and Bangalore’s eastern tech corridor.
            </p>
            <div className="mt-6 gap-2 text-sm text-slate-300">
              <p>• High-speed WiFi</p>
              <p>• Food options</p>
              <p>• Shared and private rooms</p>
            </div>
          </div>
          <AdSlot placement="browse-sidebar" />
        </aside>
      </div>
    </div>
  )
}

export default PropertiesPage
