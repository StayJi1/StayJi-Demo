import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiCheckCircle, FiHome, FiMapPin, FiStar, FiTrash2 } from 'react-icons/fi'
import Button from '../components/common/Button'
import Loader from '../components/common/Loader'
import propertyService from '../services/propertyService'
import { useAuth } from '../context/AuthContext'
import { readCompareIds, writeCompareIds } from '../utils/compareStorage'

const hasAmenity = (item, pattern) => [
  ...(item.amenities || []),
  ...(item.customFeatures || []),
  ...(item.securityFeatures || []),
  item.aminityFeatures,
].filter(Boolean).some((value) => pattern.test(value.toString()))

const yesNo = (item, pattern) => hasAmenity(item, pattern) ? 'Yes' : 'No'

const rows = [
  { label: 'Owner', value: (item) => item.ownerName || item.owner?.name || 'StayJi owner' },
  { label: 'Rent', value: (item) => (item.rent ? `₹${item.rent}/mo` : 'Contact owner') },
  { label: 'Deposit', value: (item) => item.depositAmount ? `₹${item.depositAmount}` : 'No deposit' },
  { label: 'Sharing', value: (item) => item.sharingAvailability || item.sharing || '-' },
  { label: 'Property Type', value: (item) => item.propertyType || item.category || item.type || 'PG' },
  { label: 'Gender', value: (item) => item.gender || 'Co-ed' },
  { label: 'Rating', value: (item) => item.rating || '4.6' },
  { label: 'Distance', value: (item) => item.distanceKm ? `${item.distanceKm.toFixed(1)} km` : item.locationLabel || item.city || '-' },
  { label: 'Food', value: (item) => item.mealsAvailable?.length ? item.mealsAvailable.join(', ') : item.foodIncluded ? 'Included' : 'Optional' },
  { label: 'Available Beds', value: (item) => item.availableBeds || 0 },
  { label: 'Availability', value: (item) => item.vacancyStatus || `${item.availableBeds || 0} beds available` },
  { label: 'Amenities', value: (item) => item.amenities?.slice(0, 5).join(', ') || '-' },
  { label: 'WiFi', value: (item) => yesNo(item, /wifi|internet/i) },
  { label: 'AC', value: (item) => item.acAvailable || hasAmenity(item, /ac|air conditioning/i) ? 'Yes' : 'No' },
  { label: 'Parking', value: (item) => item.parkingAvailable || hasAmenity(item, /parking/i) ? 'Yes' : 'No' },
  { label: 'Security', value: (item) => hasAmenity(item, /security|guard|biometric/i) ? 'Yes' : 'No' },
  { label: 'CCTV', value: (item) => hasAmenity(item, /cctv|camera/i) ? 'Yes' : 'No' },
  { label: 'Power Backup', value: (item) => hasAmenity(item, /power|backup|electric/i) ? 'Yes' : 'No' },
  { label: 'Curfew', value: (item) => hasAmenity(item, /curfew|24.?7|no restriction/i) ? 'Listed' : '-' },
  { label: 'Verification', value: (item) => item.isVerified || ['Approved', 'Verified'].includes(item.approvalStatus) ? 'Verified' : item.approvalStatus || 'Pending' },
  { label: 'Reviews', value: (item) => `${item.rating || 4.6}/5 resident score` },
]

function ComparePage() {
  const { user, isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const idsFromQuery = (searchParams.get('ids') || '').split(',').map((item) => item.trim()).filter(Boolean)
      const storedIds = readCompareIds(user)
      const ids = Array.from(new Set([...(idsFromQuery.length ? idsFromQuery : storedIds)]))
        .slice(0, 3)

      if (!ids.length) {
        setProperties([])
        setLoading(false)
        return
      }

      try {
        const results = await Promise.allSettled(ids.map((id) => propertyService.fetchPropertyById(id)))
        const loaded = results
          .filter((result) => result.status === 'fulfilled' && result.value)
          .map((result) => result.value)
          .slice(0, 3)

        setProperties(loaded)
        if (loaded.length) {
          const nextIds = loaded.map((item) => item.id || item._id).filter(Boolean)
          writeCompareIds(user, nextIds)
          setSearchParams((current) => {
            const next = new URLSearchParams(current)
            next.set('ids', nextIds.join(','))
            return next
          }, { replace: true })
        }

        if (isAuthenticated && user?._id && loaded.length >= 2) {
          propertyService.recordComparison({
            userId: user._id,
            propertyIds: loaded.map((item) => item.id || item._id).filter(Boolean),
          }).catch(() => {})
        }
      } catch {
        setError('Unable to load comparison properties.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAuthenticated, searchParams, setSearchParams, user?._id])

  const bestRent = useMemo(() => Math.min(...properties.map((item) => Number(item.rent) || Infinity)), [properties])

  const removeProperty = (id) => {
    const next = properties.filter((item) => (item.id || item._id) !== id)
    const nextIds = next.map((item) => item.id || item._id).filter(Boolean)
    setProperties(next)
    writeCompareIds(user, nextIds)
    setSearchParams((current) => {
      const nextParams = new URLSearchParams(current)
      if (nextIds.length) {
        nextParams.set('ids', nextIds.join(','))
      } else {
        nextParams.delete('ids')
      }
      return nextParams
    }, { replace: true })
  }

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-10"><Loader message="Building comparison..." /></div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-accent-400">Compare stays</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Side-by-side property comparison</h1>
          <p className="mt-3 text-slate-400">Compare rent, food, sharing, vacancy, amenities, and resident score before contacting an owner.</p>
        </div>
        <Link to="/properties"><Button variant="secondary">Add more stays</Button></Link>
      </div>

      {error ? <div className="rounded-[2rem] border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">{error}</div> : null}

      {!properties.length ? (
        <div className="rounded-[2rem] border border-slate-800 bg-surface-800/90 p-10 text-center text-slate-300">
          No properties added for comparison yet.
          <div className="mt-6"><Link to="/properties"><Button>Browse stays</Button></Link></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[2rem] border border-slate-800 bg-surface-800/90 shadow-card">
          <div className="grid min-w-[860px]" style={{ gridTemplateColumns: `190px repeat(${properties.length}, minmax(220px, 1fr))` }}>
            <div className="border-b border-slate-800 p-5 text-sm uppercase tracking-[0.22em] text-slate-500">Feature</div>
            {properties.map((property) => {
              const id = property.id || property._id
              return (
                <div key={id} className="border-b border-l border-slate-800 p-5">
                  <div className="relative">
                    <img src={property.image} alt={property.name} loading="lazy" className="h-40 w-full rounded-[1.5rem] object-cover" />
                    {property.isPremium ? <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-slate-950">Premium</span> : null}
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-accent-400">{property.propertyType || property.category || 'PG'}</p>
                      <h2 className="mt-2 text-xl font-semibold text-white">{property.name}</h2>
                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-400"><FiMapPin /> {property.locationLabel || property.city}</p>
                    </div>
                    <button type="button" onClick={() => removeProperty(id)} className="rounded-full border border-slate-700 p-2 text-slate-300 hover:border-rose-400 hover:text-rose-200" aria-label="Remove property">
                      <FiTrash2 />
                    </button>
                  </div>
                  {Number(property.rent) === bestRent ? (
                    <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"><FiCheckCircle /> Best rent</p>
                  ) : null}
                </div>
              )
            })}

            {rows.map((row) => (
              <Fragment key={row.label}>
                <div key={`${row.label}-label`} className="border-b border-slate-800 p-5 font-semibold text-white">{row.label}</div>
                {properties.map((property) => (
                  <div key={`${property.id || property._id}-${row.label}`} className="border-b border-l border-slate-800 p-5 text-slate-300">
                    {row.label === 'Rating' ? <span className="inline-flex items-center gap-2"><FiStar className="text-amber-400" /> {row.value(property)}</span> : row.value(property)}
                  </div>
                ))}
              </Fragment>
            ))}

            <div className="p-5 font-semibold text-white">Action</div>
            {properties.map((property) => (
              <div key={`${property.id || property._id}-action`} className="border-l border-slate-800 p-5">
                <Link to={`/properties/${property.id || property._id}`}>
                  <Button className="w-full"><FiHome className="mr-2" /> View stay</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ComparePage
