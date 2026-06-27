import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCheckCircle, FiHome, FiMapPin, FiStar, FiTrash2 } from 'react-icons/fi'
import Button from '../components/common/Button'
import Loader from '../components/common/Loader'
import propertyService from '../services/propertyService'

const rows = [
  { label: 'Rent', value: (item) => (item.rent ? `₹${item.rent}/mo` : 'Contact owner') },
  { label: 'Rating', value: (item) => item.rating || '4.6' },
  { label: 'Distance', value: (item) => item.distanceKm ? `${item.distanceKm.toFixed(1)} km` : item.locationLabel || item.city || '-' },
  { label: 'Food', value: (item) => item.mealsAvailable?.length ? item.mealsAvailable.join(', ') : item.foodIncluded ? 'Included' : 'Optional' },
  { label: 'Sharing', value: (item) => item.sharingAvailability || item.sharing || '-' },
  { label: 'Availability', value: (item) => item.vacancyStatus || `${item.availableBeds || 0} beds available` },
  { label: 'Amenities', value: (item) => item.amenities?.slice(0, 5).join(', ') || '-' },
  { label: 'Property Type', value: (item) => item.category || item.type || 'PG' },
  { label: 'Reviews', value: (item) => `${item.rating || 4.6}/5 resident score` },
]

function ComparePage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const ids = JSON.parse(localStorage.getItem('stayjiCompare') || '[]').slice(0, 3)
      if (!ids.length) {
        setLoading(false)
        return
      }

      try {
        const results = await Promise.all(ids.map((id) => propertyService.fetchPropertyById(id)))
        setProperties(results.filter(Boolean))
      } catch {
        setError('Unable to load comparison properties.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const bestRent = useMemo(() => Math.min(...properties.map((item) => Number(item.rent) || Infinity)), [properties])

  const removeProperty = (id) => {
    const next = properties.filter((item) => (item.id || item._id) !== id)
    setProperties(next)
    localStorage.setItem('stayjiCompare', JSON.stringify(next.map((item) => item.id || item._id)))
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
                  <img src={property.image} alt={property.name} loading="lazy" className="h-40 w-full rounded-[1.5rem] object-cover" />
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-accent-400">{property.category || 'PG'}</p>
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
