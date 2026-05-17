import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi'
import Card from '../../../components/common/Card'
import dashboardService from '../../../services/dashboardService'
import propertyService from '../../../services/propertyService'
import { useAuth } from '../../../context/AuthContext'

function ManagePropertiesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [filters, setFilters] = useState({ search: '', approvalStatus: '', category: '', sortBy: 'newest' })
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await dashboardService.getVendorProperties(user?._id)
        setProperties(data || [])
      } catch (err) {
        setError(err?.message || 'Unable to load your properties.')
        setProperties([])
      } finally {
        setLoading(false)
      }
    }
    if (user?._id) load()
    else setLoading(false)
  }, [user?._id])

  const handleDelete = async (propertyId) => {
    if (!window.confirm('Delete this property? This action cannot be undone.')) return
    try {
      await propertyService.deleteProperty(propertyId)
      setProperties((current) => current.filter((property) => property.id !== propertyId))
    } catch (err) {
      setError(err?.message || 'Unable to delete property.')
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
    <div className="space-y-8">
      <header className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-accent-400">Property management</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Your active listings</h1>
        </div>
      </header>

      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_0.65fr_0.65fr_0.65fr_auto]">
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
        <div className="space-y-4">
          {filteredProperties.map((property) => (
            <Card key={property.id || property._id} className="grid gap-4 rounded-[2rem] p-6 sm:grid-cols-[1.3fr_0.7fr]">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-accent-400">{property.city || 'Unknown city'}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{property.name}</h2>
                <p className="mt-3 text-slate-300">{property.description?.substring(0, 100) || 'No description available.'}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                  <span className="rounded-full bg-slate-950/80 px-3 py-2 text-slate-300">{property.category || property.type || 'PG'}</span>
                  <span className={`rounded-full px-3 py-2 ${
                    property.approvalStatus === 'Approved'
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : property.approvalStatus === 'Rejected'
                        ? 'bg-rose-500/10 text-rose-300'
                        : 'bg-amber-500/10 text-amber-200'
                  }`}>
                    {property.approvalStatus || 'Pending'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-start justify-between gap-4 sm:items-end">
                <div className="space-y-2 text-sm text-slate-400">
                  <p>Rent: ₹{property.rent || '8,500'}</p>
                  <p>Deposit: ₹{property.depositAmount || '0'}</p>
                  {property.perDayCheckIn ? <p>Day stay: ₹{property.dailyRate || property.rent || '0'}/day</p> : null}
                  <p>Status: {property.status || 'Available'}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProperty(property)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent-500"
                  >
                    <FiEye /> View
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/vendor/properties/${property.id}/edit`)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent-500"
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(property.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-rose-400"
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center text-rose-300">{error}</Card>
      ) : (
        <Card className="p-8 text-center text-slate-300">
          No properties found. Add your first property to start receiving inquiries.
        </Card>
      )}
      {selectedProperty ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-slate-800 bg-surface-900 p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-accent-400">{selectedProperty.category || selectedProperty.type || 'PG'} • {selectedProperty.approvalStatus || 'Pending'}</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">{selectedProperty.name}</h2>
              </div>
              <button type="button" onClick={() => setSelectedProperty(null)} className="rounded-full border border-slate-700 px-3 py-2 text-slate-300 hover:border-accent-500">Close</button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <p className="text-slate-300">City: {selectedProperty.city || '-'}</p>
              <p className="text-slate-300">Address: {selectedProperty.address || selectedProperty.locationLabel || '-'}</p>
              <p className="text-slate-300">Latitude: {selectedProperty.location?.lat ?? selectedProperty.latitude ?? '-'}</p>
              <p className="text-slate-300">Longitude: {selectedProperty.location?.lng ?? selectedProperty.longitude ?? '-'}</p>
              <p className="text-slate-300">Rent: ₹{selectedProperty.rent || '0'}</p>
              <p className="text-slate-300">Deposit: ₹{selectedProperty.depositAmount || '0'}</p>
            </div>
            <p className="mt-5 text-slate-300">{selectedProperty.description || 'No description available.'}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {(selectedProperty.images || [selectedProperty.image]).filter(Boolean).slice(0, 6).map((image) => (
                <img key={image} src={image} alt={selectedProperty.name} className="h-40 w-full rounded-2xl object-cover" />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ManagePropertiesPage
