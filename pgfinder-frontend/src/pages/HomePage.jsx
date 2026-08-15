import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiCheckCircle, FiMapPin, FiNavigation, FiSearch, FiShield, FiSliders, FiStar, FiUsers } from 'react-icons/fi'
import Button from '../components/common/Button'
import Loader from '../components/common/Loader'
import PropertyCard from '../components/property/PropertyCard'
import propertyService from '../services/propertyService'
import useCurrentLocation from '../hooks/useCurrentLocation'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'
import { bangaloreLocalities } from '../data/seoContent'

const cities = [
  { name: 'Whitefield', slug: 'whitefield', count: 'PGs near ITPL', tone: 'from-blue-600 to-cyan-500' },
  { name: 'HSR Layout', slug: 'hsr-layout', count: 'Co-living hub', tone: 'from-indigo-600 to-blue-500' },
  { name: 'Electronic City', slug: 'electronic-city', count: 'Budget PGs', tone: 'from-cyan-600 to-blue-600' },
  { name: 'Marathahalli', slug: 'marathahalli', count: 'ORR access', tone: 'from-sky-600 to-indigo-600' },
  { name: 'Koramangala', slug: 'koramangala', count: 'Student stays', tone: 'from-blue-500 to-violet-600' },
  { name: 'Bellandur', slug: 'bellandur', count: 'Tech corridor', tone: 'from-cyan-500 to-blue-700' },
]

const reasons = [
  { title: 'Verified listings', text: 'Photos, pricing, amenities, and availability reviewed before going live.', icon: <FiShield /> },
  { title: 'Fast nearby search', text: 'Find PGs, hostels, flats, and stays around your campus or office.', icon: <FiNavigation /> },
  { title: 'Smart dashboards', text: 'Purpose-built dashboards for users, owners, and admins.', icon: <FiSliders /> },
  { title: 'Book visits', text: 'Shortlist properties, check live availability, and schedule visits quickly.', icon: <FiCheckCircle /> },
]

const testimonials = [
  {
    name: 'Aditi Sharma',
    role: 'Student, Bangalore',
    quote: 'StayJi helped me compare safe PGs near college and book visits without calling ten different owners.',
  },
  {
    name: 'Rahul Mehta',
    role: 'Working professional, Whitefield',
    quote: 'The listings felt premium and transparent. I found a flat close to office in one evening.',
  },
  {
    name: 'Nisha Iyer',
    role: 'Owner, Bangalore',
    quote: 'The owner dashboard makes approvals, availability, and inquiries much easier to manage.',
  },
]

const stats = [
  { label: 'Verified stays', value: '250+' },
  { label: 'Bangalore localities', value: `${bangaloreLocalities.length}+` },
  { label: 'Avg. rating', value: '4.8' },
]

const PropertyMap = lazy(() => import('../components/map/PropertyMap'))
const AdSlot = lazy(() => import('../components/ads/AdSlot'))

function useDeferredSection(rootMargin = '600px') {
  const [ready, setReady] = useState(false)
  const observerRef = useRef(null)

  const ref = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect()
    if (ready) return
    if (!node || typeof IntersectionObserver === 'undefined') {
      if (!node) return
      setReady(true)
      return
    }
    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setReady(true)
        observerRef.current?.disconnect()
      }
    }, { rootMargin })
    observerRef.current.observe(node)
  }, [ready, rootMargin])

  useEffect(() => () => observerRef.current?.disconnect(), [])

  return [ref, ready]
}

function PropertyCardSkeleton() {
  return (
    <div className="min-h-[480px] overflow-hidden rounded-[1.5rem] border border-slate-800/70 bg-slate-950/90 shadow-card sm:rounded-[2rem]">
      <div className="h-52 animate-pulse bg-slate-800 sm:h-64" />
      <div className="space-y-4 p-5 sm:p-6">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
        <div className="h-6 w-3/4 animate-pulse rounded bg-slate-800" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-800" />
        <div className="grid gap-3 md:grid-cols-3">
          <span className="h-11 animate-pulse rounded-3xl bg-slate-800" />
          <span className="h-11 animate-pulse rounded-3xl bg-slate-800" />
          <span className="h-11 animate-pulse rounded-3xl bg-slate-800" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <span className="h-11 animate-pulse rounded-3xl bg-slate-800" />
          <span className="h-11 animate-pulse rounded-3xl bg-slate-800" />
        </div>
      </div>
    </div>
  )
}

function SectionSkeleton({ className = 'min-h-[340px]' }) {
  return (
    <div className={`animate-pulse rounded-2xl border border-slate-200 bg-slate-100 ${className}`} aria-hidden="true" />
  )
}

function HomePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { position, loading: locationLoading, error: locationError, hasUserLocation } = useCurrentLocation()
  const [featuredProperties, setFeaturedProperties] = useState([])
  const [savedPropertyIds, setSavedPropertyIds] = useState(new Set())
  const [featuredLoading, setFeaturedLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAds, setShowAds] = useState(false)
  const [localityRef, showLocalities] = useDeferredSection()
  const [reasonsRef, showReasons] = useDeferredSection()
  const [mapRef, showMap] = useDeferredSection()
  const [testimonialsRef, showTestimonials] = useDeferredSection()

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await propertyService.fetchFeaturedProperties(3)
        if (!cancelled) setFeaturedProperties(data || [])
      } catch {
        if (!cancelled) setFeaturedProperties([])
      } finally {
        if (!cancelled) setFeaturedLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const schedule = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 1200))
    const cancel = window.cancelIdleCallback || window.clearTimeout
    const id = schedule(() => setShowAds(true))
    return () => cancel(id)
  }, [])

  useEffect(() => {
    const loadWishlist = async () => {
      if (!isAuthenticated || !user?._id) {
        setSavedPropertyIds(new Set())
        return
      }

      try {
        const shortlist = await propertyService.fetchShortlist(user._id)
        setSavedPropertyIds(
          new Set(
            shortlist
              .map((item) => item.property?.id || item.property?._id || item.propertyIDFK?._id)
              .filter(Boolean),
          ),
        )
      } catch {
        setSavedPropertyIds(new Set())
      }
    }

    loadWishlist()
  }, [isAuthenticated, user?._id])

  const featured = useMemo(() => featuredProperties.slice(0, 3), [featuredProperties])

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

  const handleSearch = (event) => {
    event.preventDefault()
    const query = search.trim()
    navigate(query ? `/properties?search=${encodeURIComponent(query)}` : '/properties')
  }

  const handleNearby = () => {
    navigate('/properties?nearby=true')
  }

  return (
    <div className="overflow-hidden">
      <SEO
        title="StayJi - PG in Bangalore, Boys PG, Girls PG and Co-living"
        description="Find verified PGs, hostels, co-living rooms, flats, visits, reviews, and lead-managed accommodation across Bangalore localities."
        path="/"
        keywords={['PG in Bangalore', 'Boys PG in Bangalore', 'Girls PG in Bangalore', 'Co-living Bangalore', 'Student accommodation Bangalore']}
      />
      <section className="relative isolate overflow-hidden bg-slate-950 text-white lg:min-h-[calc(100vh-76px)]">
        <div className="absolute inset-0 stayji-grid opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.36),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(6,182,212,0.24),transparent_30%),linear-gradient(135deg,#0F172A_0%,#111827_52%,#1E1B4B_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-20">
          <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
            <span className="inline-flex rounded-full border border-cyan-300/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100 backdrop-blur-xl sm:tracking-[0.26em]">
              Bangalore stays
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Find Your Perfect Stay
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              StayJi helps students and working professionals discover verified PGs, hostels, flats, and short stays across Bangalore with live availability, maps, filters, visits, and wishlist built in.
            </p>

            <form onSubmit={handleSearch} className="mt-8 grid gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl sm:grid-cols-[1fr_auto_auto] sm:rounded-[2rem]">
              <label className="flex min-w-0 items-center gap-3 rounded-xl bg-white px-4 py-3 text-slate-900 sm:rounded-[1.5rem]">
                <FiSearch className="text-blue-600" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search locality or PG name"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
                />
              </label>
              <Button type="button" variant="secondary" onClick={handleNearby} className="w-full sm:w-auto">
                <FiMapPin className="mr-2" /> Nearby
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                Search <FiArrowRight className="ml-2" />
              </Button>
            </form>
            {locationError ? <p className="mt-3 text-sm text-rose-200">{locationError}</p> : null}

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((item) => (
                <motion.div key={item.label} whileHover={{ y: -4 }} className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
                  <p className="text-3xl font-semibold">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-300">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="relative">
            <div className="glass-card rounded-2xl p-3 sm:rounded-[2.5rem] sm:p-5">
              <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
                <img
                  src="/stayji-logo.png"
                  alt="StayJi logo"
                  width="900"
                  height="600"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="h-64 w-full object-cover sm:h-80"
                />
                <div className="grid gap-4 p-5 text-slate-900">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">Live discovery</p>
                      <h2 className="mt-1 text-2xl font-semibold">Verified stays near you</h2>
                    </div>
                    <span className="w-max rounded-full bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700">Open now</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {['Wishlist', 'Book visits', 'Live availability'].map((item) => (
                      <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">{item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <aside className="fixed top-32 z-20 hidden w-56 min-[1800px]:block" style={{ right: 'calc((100vw - 80rem) / 2 - 15rem)' }} aria-label="Home page sponsored advertisements">
        {showAds ? (
          <Suspense fallback={null}>
            <AdSlot placement="home" className="max-h-[calc(100vh-9rem)] overflow-y-auto pr-1" />
          </Suspense>
        ) : null}
      </aside>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-600 sm:tracking-[0.24em]">Featured stays</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Premium verified stays</h2>
            </div>
            <Link to="/bangalore" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-purple-600">
              Explore Bangalore PGs <FiArrowRight className="ml-2" />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {featuredLoading ? (
              <>
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
              </>
            ) : featured.length ? (
              featured.map((item, index) => (
                <PropertyCard
                  key={item.id || item._id}
                  property={item}
                  saved={savedPropertyIds.has(item.id || item._id)}
                  onToggleSave={handleToggleSave}
                  imageLoading={index < 3 ? 'eager' : 'lazy'}
                  imageFetchPriority={index === 0 ? 'high' : 'auto'}
                />
              ))
            ) : (
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-10 text-center text-slate-600">
                No featured StayJi properties available yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section ref={localityRef} className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid min-h-[360px] min-w-0 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
            {showLocalities ? (
              <>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-purple-600 sm:tracking-[0.24em]">Search by city</p>
                  <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Choose your Bangalore locality</h2>
                  <p className="mt-4 text-slate-600">Browse student and professional stays around Bangalore’s IT corridors, colleges, metro routes, and residential hubs.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cities.map((city) => (
                    <motion.button
                      key={city.name}
                      whileHover={{ y: -5 }}
                      type="button"
                      onClick={() => navigate(`/bangalore/${city.slug}`)}
                      className={`rounded-2xl bg-gradient-to-br ${city.tone} p-5 text-left text-white shadow-card sm:rounded-[1.75rem]`}
                    >
                      <p className="text-xl font-semibold">{city.name}</p>
                      <p className="mt-2 text-sm text-white/80">{city.count}</p>
                    </motion.button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <SectionSkeleton className="min-h-[180px]" />
                <SectionSkeleton className="min-h-[260px]" />
              </>
            )}
          </div>
        </div>
      </section>

      <section ref={reasonsRef} className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {showReasons ? (
          <>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-600 sm:tracking-[0.24em]">Why StayJi</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Built for trust, speed, and clarity</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {reasons.map((item) => (
              <motion.article key={item.title} whileHover={{ y: -6 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:shadow-card sm:p-6">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-600">{item.icon}</span>
                <h3 className="mt-5 text-lg font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
              </motion.article>
            ))}
          </div>
          </>
          ) : <SectionSkeleton className="min-h-[340px]" />}
        </div>
      </section>

      <section ref={mapRef} className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl min-w-0 gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-300 sm:tracking-[0.24em]">Google Maps nearby</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Find stays around your real location</h2>
            <p className="mt-4 leading-7 text-slate-300">Use map-first discovery to compare commute distance, nearby areas, and verified StayJi listings before booking a visit.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={handleNearby} disabled={locationLoading}>
                <FiNavigation className="mr-2" /> {hasUserLocation ? 'Show nearby stays' : 'Show nearby stays'}
              </Button>
              <Link to="/bangalore">
                <Button variant="secondary">Open map search</Button>
              </Link>
            </div>
          </div>
          <div className="glass-card overflow-hidden rounded-2xl p-3">
            <div className="h-80 overflow-hidden rounded-xl bg-slate-900 sm:h-[420px] sm:rounded-[1.5rem]">
              {showMap ? (
                <Suspense fallback={<Loader message="Loading map..." />}>
                  <PropertyMap center={position} userLocation={hasUserLocation ? position : null} properties={featuredProperties.slice(0, 8)} />
                </Suspense>
              ) : <div className="h-full w-full animate-pulse bg-slate-800/80" />}
            </div>
          </div>
        </div>
      </section>

      <section ref={testimonialsRef} className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {showTestimonials ? (
          <>
          <div className="flex items-center gap-3">
            <FiUsers className="text-blue-600" />
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-600 sm:tracking-[0.24em]">Testimonials</p>
          </div>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Loved by students, professionals, and owners</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {testimonials.map((item) => (
              <motion.article key={item.name} whileHover={{ y: -6 }} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-soft sm:p-7">
                <div className="flex gap-1 text-amber-400">{Array.from({ length: 5 }).map((_, index) => <FiStar key={index} fill="currentColor" />)}</div>
                <p className="mt-5 leading-7 text-slate-700">"{item.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 font-semibold text-white">
                    {item.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-950">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.role}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
          </>
          ) : <SectionSkeleton className="min-h-[360px]" />}
        </div>
      </section>

      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-100 sm:tracking-[0.24em]">Ready when you are</p>
            <h2 className="mt-3 text-3xl font-semibold">Move smarter with StayJi</h2>
            <p className="mt-3 text-blue-50">Wishlist, filter, book visits, and manage your stay journey from one place.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/properties"><Button>Explore stays</Button></Link>
            <Link to="/signup?role=owner"><Button variant="secondary">List your property</Button></Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
