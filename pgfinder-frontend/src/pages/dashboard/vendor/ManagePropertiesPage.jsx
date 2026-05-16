import { useEffect, useState } from 'react'
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi'
import Card from '../../../components/common/Card'
import dashboardService from '../../../services/dashboardService'

function ManagePropertiesPage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await dashboardService.getVendorProperties()
        setProperties(data || [])
      } catch {
        setProperties([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
              </div>
              <div className="flex flex-col items-start justify-between gap-4 sm:items-end">
                <div className="space-y-2 text-sm text-slate-400">
                  <p>Rent: ₹{property.rent || '8,500'}</p>
                  <p>Status: {property.status || 'Active'}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent-500">
                    <FiEye /> View
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent-500">
                    <FiEdit2 /> Edit
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-rose-400">
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-slate-300">
          No properties found. Add your first property to start receiving inquiries.
        </Card>
      )}
    </div>
  )
}

export default ManagePropertiesPage
