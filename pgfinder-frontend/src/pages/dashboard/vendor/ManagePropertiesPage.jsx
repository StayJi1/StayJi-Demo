import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiBarChart2, FiEdit2, FiTrash2 } from 'react-icons/fi'
import Card from '../../../components/common/Card'
import PropertyCard from '../../../components/property/PropertyCard'
import dashboardService from '../../../services/dashboardService'
import propertyService from '../../../services/propertyService'
import { useAuth } from '../../../context/AuthContext'

function ManagePropertiesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const ownerId = user?._id || user?.id
  const [properties, setProperties] = useState([])
  const [filters, setFilters] = useState({ search: '', approvalStatus: '', category: '', sortBy: 'newest' })
  const [quickEdit, setQuickEdit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await dashboardService.getOwnerProperties(ownerId)
        setProperties((data || []).filter((property) => {
          const propertyOwnerId = property.ownerId || property.userIDFK?._id || property.userIDFK || property.vendorId?._id || property.vendorId
          return propertyOwnerId?.toString() === ownerId.toString()
        }))
      } catch (err) {
        setError(err?.message || 'Unable to load your properties.')
        setProperties([])
      } finally {
        setLoading(false)
      }
    }
    if (ownerId) load()
    else window.setTimeout(() => setLoading(false), 0)
  }, [ownerId])

  const handleDelete = async (propertyId) => {
    if (!window.confirm('Request admin approval to delete/archive this property?')) return
    try {
      await propertyService.deleteProperty(propertyId, { ownerId, userIDFK: ownerId })
      setNotice('Delete request sent to admin for approval. The listing remains unchanged until approval.')
    } catch (err) {
      setError(err?.message || 'Unable to delete property.')
    }
  }

  const openQuickEdit = (property) => {
    setQuickEdit({
      id: property.id || property._id,
      availableBeds: property.availableBeds || '',
      vacancyStatus: property.vacancyStatus || 'Available now',
      availableFrom: property.availableFrom || '',
      sharingAvailability: property.sharingAvailability || '',
    })
  }

  const submitQuickEdit = async (event) => {
    event.preventDefault()
    if (!quickEdit?.id) return
    try {
      const updated = await propertyService.updateOccupancy(quickEdit.id, {
        availableBeds: quickEdit.availableBeds,
        vacancyStatus: quickEdit.vacancyStatus,
        availableFrom: quickEdit.availableFrom,
        sharingAvailability: quickEdit.sharingAvailability,
      })
      setProperties((current) => current.map((property) => ((property.id || property._id) === quickEdit.id ? { ...property, ...updated } : property)))
      setQuickEdit(null)
      setNotice('Quick availability updated without changing protected listing details.')
    } catch (err) {
      setError(err?.message || 'Unable to update availability.')
    }
  }

  const filteredProperties = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return [...properties]
      .filter((property) => {
        if (filters.approvalStatus && (property.approvalStatus || 'Pending') !== filters.approvalStatus) return false
        if (filters.category && ![property.category, property.type, property.propertyTypeName].includes(filters.category)) return false
        if (!search) return true
        return [
          property.name,
          property.description,
          property.address,
          property.city,
          property.areaName,
          property.category,
          property.type,
        ].filter(Boolean).join(' ').toLowerCase().includes(search)
      })
      .sort((a, b) => {
        if (filters.sortBy === 'price-low') return (Number(a.rent) || 0) - (Number(b.rent) || 0)
        if (filters.sortBy === 'price-high') return (Number(b.rent) || 0) - (Number(a.rent) || 0)
        if (filters.sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
        return new Date(b.addedOn || 0) - new Date(a.addedOn || 0)
      })
  }, [filters, properties])

  return (
    <div className="min-w-0 space-y-8">
      <header className="rounded-[1.5rem] border border-slate-800/80 bg-surface-800/90 p-5 shadow-card sm:rounded-[2rem] sm:p-8">
        <div>
          <p className="text-sm uppercase tracking-[0.14em] text-accent-400 sm:tracking-[0.28em]">Property management</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">Your active listings</h1>
        </div>
      </header>

      <Card>
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_0.65fr_0.65fr_0.65fr_auto]">
          <input
            type="search"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search your properties"
            className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400"
          />
          <select value={filters.approvalStatus} onChange={(event) => setFilters((current) => ({ ...current, approvalStatus: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400">
            <option value="">All approvals</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400">
            <option value="">All categories</option>
            <option value="PG">PG</option>
            <option value="Flat">Flat</option>
            <option value="Hotel">Hotel</option>
            <option value="Hostel">Hostel</option>
          </select>
          <select value={filters.sortBy} onChange={(event) => setFilters((current) => ({ ...current, sortBy: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400">
            <option value="newest">Newest</option>
            <option value="name">Name</option>
            <option value="price-low">Price low</option>
            <option value="price-high">Price high</option>
          </select>
          <button type="button" onClick={() => setFilters({ search: '', approvalStatus: '', category: '', sortBy: 'newest' })} className="rounded-3xl border border-slate-700 px-4 py-3 text-sm text-slate-200 hover:border-accent-500">
            Clear
          </button>
        </div>
      </Card>

      {loading ? (
        <Card className="p-8">Loading properties…</Card>
      ) : filteredProperties.length ? (
        <>
        {notice ? <Card className="border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">{notice}</Card> : null}
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filteredProperties.map((property) => (
            <div key={property.id || property._id} className="space-y-3">
              <PropertyCard property={property} hideSave />
              <Card className="p-4">
                <div className="mb-3 flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-3 py-2 ${property.approvalStatus === 'Rejected' ? 'bg-rose-500/10 text-rose-300' : property.approvalStatus === 'Approved' || property.approvalStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-200'}`}>
                    {property.approvalStatus || 'Pending'}
                  </span>
                  <span className="rounded-full bg-slate-900 px-3 py-2 text-slate-300">{property.vacancyStatus || property.status || 'Available'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => navigate(`/dashboard/owner/leads?propertyId=${property.id || property._id}`)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-accent-500"><FiBarChart2 /> Analytics</button>
                  <button type="button" onClick={() => openQuickEdit(property)} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-500/10">Availability</button>
                  <button type="button" onClick={() => navigate(`/dashboard/owner/properties/${property.id || property._id}/edit`)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-accent-500"><FiEdit2 /> Edit</button>
                  <button type="button" onClick={() => handleDelete(property.id || property._id)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-rose-400"><FiTrash2 /> Delete</button>
                </div>
              </Card>
            </div>
          ))}
        </div>
        </>
      ) : error ? (
        <Card className="p-8 text-center text-rose-300">{error}</Card>
      ) : (
        <Card className="p-8 text-center text-slate-300">
          No properties found. Add your first property to start receiving inquiries.
        </Card>
      )}
      {quickEdit ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
          <form onSubmit={submitQuickEdit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-surface-900 p-4 shadow-card sm:rounded-[2rem] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Quick property edit</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Availability and room status</h2>
              </div>
              <button type="button" onClick={() => setQuickEdit(null)} className="rounded-full border border-slate-700 px-3 py-2 text-slate-300 hover:border-accent-500">Close</button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input type="number" value={quickEdit.availableBeds} onChange={(event) => setQuickEdit((current) => ({ ...current, availableBeds: event.target.value }))} placeholder="Beds available" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
              <select value={quickEdit.vacancyStatus} onChange={(event) => setQuickEdit((current) => ({ ...current, vacancyStatus: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400">
                <option value="Available now">Available now</option>
                <option value="Few beds left">Few beds left</option>
                <option value="Fully occupied">Fully occupied</option>
                <option value="Available from date">Available from date</option>
              </select>
              <input type="date" value={quickEdit.availableFrom} onChange={(event) => setQuickEdit((current) => ({ ...current, availableFrom: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
              <input value={quickEdit.sharingAvailability} onChange={(event) => setQuickEdit((current) => ({ ...current, sharingAvailability: event.target.value }))} placeholder="Sharing availability" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
            </div>
            <p className="mt-4 text-sm text-slate-400">This updates vacancy and room availability immediately. Name, address, coordinates, and image changes still use admin approval.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setQuickEdit(null)} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200">Cancel</button>
              <button type="submit" className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">Save quick update</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

export default ManagePropertiesPage
