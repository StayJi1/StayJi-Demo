import { useEffect, useState } from 'react'
import { FiBarChart2, FiUsers, FiHome, FiThumbsUp } from 'react-icons/fi'
import Button from '../../../components/common/Button'
import Card from '../../../components/common/Card'
import dashboardService from '../../../services/dashboardService'
import propertyService from '../../../services/propertyService'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [data, propertyList] = await Promise.all([
          dashboardService.getAdminStats(),
          propertyService.fetchAllProperties(),
        ])
        setStats(data)
        setProperties(propertyList || [])
      } catch {
        setStats({ users: 0, vendors: 0, properties: 0, inquiries: 0 })
        setProperties([])
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const handleReview = async (propertyId, approvalStatus) => {
    setActionError('')
    try {
      const updated = await propertyService.reviewProperty(propertyId, approvalStatus)
      setProperties((current) => current.map((property) => (property.id === propertyId ? updated : property)))
    } catch (error) {
      setActionError(error?.message || 'Unable to update property approval.')
    }
  }

  const handleDeactivate = async (propertyId) => {
    setActionError('')
    try {
      await propertyService.deleteProperty(propertyId)
      setProperties((current) => current.filter((property) => property.id !== propertyId))
    } catch (error) {
      setActionError(error?.message || 'Unable to deactivate property.')
    }
  }

  const pendingProperties = properties.filter((property) => (property.approvalStatus || 'Approved') === 'Pending')

  return (
    <div className="space-y-8">
      <header className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-accent-400">Admin dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Manage users, vendors, and properties</h1>
          </div>
          <Button>{pendingProperties.length} pending approvals</Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-4">
        {loading ? (
          <Card className="p-8">
            <p className="text-slate-300">Loading metrics…</p>
          </Card>
        ) : (
          [
            { label: 'Total users', value: stats.users, icon: <FiUsers /> },
            { label: 'Vendors', value: stats.vendors, icon: <FiHome /> },
            { label: 'Properties', value: stats.properties, icon: <FiBarChart2 /> },
            { label: 'Inquiries', value: stats.inquiries, icon: <FiThumbsUp /> },
          ].map((item) => (
            <Card key={item.label} className="p-6">
              <div className="flex items-center justify-between gap-4 text-slate-300">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-950 text-accent-400">{item.icon}</span>
                <div className="text-right">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Property reviews</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Vendor listing approvals</h2>
            </div>
            <Button variant="secondary">{properties.length} total</Button>
          </div>
          {actionError ? <p className="mt-4 text-sm text-rose-300">{actionError}</p> : null}
          <div className="mt-6 space-y-4">
            {pendingProperties.length ? (
              pendingProperties.map((property) => (
                <div key={property.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-400">{property.category || property.type || 'PG'} • {property.city || 'Unknown city'}</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{property.name}</h3>
                      <p className="mt-2 text-sm text-slate-400">₹{property.rent || '0'}/mo • Deposit ₹{property.depositAmount || '0'}</p>
                      {property.perDayCheckIn ? <p className="mt-1 text-sm text-emerald-300">Per-day check-in enabled</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleReview(property.id, 'Approved')}
                        className="rounded-full border border-emerald-500/60 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/10"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReview(property.id, 'Rejected')}
                        className="rounded-full border border-rose-500/60 px-4 py-2 text-sm text-rose-200 hover:bg-rose-500/10"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-300">No pending vendor listings right now.</p>
            )}
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Metrics</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">All property controls</h2>
          </div>
          <div className="mt-6 max-h-[360px] space-y-3 overflow-y-auto rounded-[1.75rem] bg-slate-950/80 p-4 text-slate-300">
            {properties.length ? (
              properties.map((property) => (
                <div key={property.id} className="flex flex-col gap-3 rounded-3xl border border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">{property.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {property.category || property.type || 'PG'} • {property.approvalStatus || 'Approved'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {property.approvalStatus !== 'Approved' ? (
                      <button type="button" onClick={() => handleReview(property.id, 'Approved')} className="rounded-full border border-emerald-500/60 px-3 py-2 text-xs text-emerald-200">Approve</button>
                    ) : null}
                    {property.approvalStatus !== 'Rejected' ? (
                      <button type="button" onClick={() => handleReview(property.id, 'Rejected')} className="rounded-full border border-rose-500/60 px-3 py-2 text-xs text-rose-200">Reject</button>
                    ) : null}
                    <button type="button" onClick={() => handleDeactivate(property.id)} className="rounded-full border border-slate-600 px-3 py-2 text-xs text-slate-200">Deactivate</button>
                  </div>
                </div>
              ))
            ) : (
              <p>No properties found.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard
