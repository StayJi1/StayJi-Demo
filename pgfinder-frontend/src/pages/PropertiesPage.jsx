import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FiFilter, FiMapPin, FiSearch } from 'react-icons/fi'
import SectionHeading from '../components/common/SectionHeading'
import Button from '../components/common/Button'
import Loader from '../components/common/Loader'
import PropertyCard from '../components/property/PropertyCard'
import propertyService from '../services/propertyService'

const filterOptions = [
  'Boys',
  'Girls',
  'Co-ed',
  'AC',
  'Non-AC',
  'Food included',
  'Attached bathroom',
]

function PropertiesPage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState([])

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

  const filteredProperties = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    return properties.filter((item) => {
      const haystack = [
        item.name,
        item.description,
        item.address,
        item.city,
        item.locationLabel,
        item.type,
        item.gender,
        ...(item.amenities || []),
      ].filter(Boolean).join(' ').toLowerCase()

      if (normalizedSearch && !haystack.includes(normalizedSearch)) {
        return false
      }

      return activeFilters.every((filter) => {
        if (filter === 'Food included') return item.foodIncluded
        if (filter === 'AC') return item.amenities?.some((amenity) => /ac|air conditioning/i.test(amenity))
        if (filter === 'Non-AC') return !item.amenities?.some((amenity) => /ac|air conditioning/i.test(amenity))
        if (filter === 'Attached bathroom') return item.amenities?.some((amenity) => /bathroom/i.test(amenity))
        return item.gender === filter
      })
    })
  }, [properties, activeFilters, searchQuery])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.95fr_0.45fr]">
        <section>
          <SectionHeading title="Search PGs" description="Explore available PGs with filters, map view, and nearby search." />
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
              <Button variant="secondary" className="w-full sm:w-auto">
                <span className="inline-flex items-center gap-2">
                  <FiMapPin /> Map search
                </span>
              </Button>
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
