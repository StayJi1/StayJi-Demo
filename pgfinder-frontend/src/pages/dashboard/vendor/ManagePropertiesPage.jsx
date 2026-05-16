import { useEffect, useState } from 'react'
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

  return (
    <div className="space-y-8">
      <header className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-accent-400">Property management</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Your active listings</h1>
        </div>
      </header>

      {loading ? (
        <Card className="p-8">Loading properties…</Card>
      ) : properties.length ? (
        <div className="space-y-4">
          {properties.map((property) => (
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
                    onClick={() => navigate(`/properties/${property.id}`)}
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
    </div>
  )
}

export default ManagePropertiesPage
