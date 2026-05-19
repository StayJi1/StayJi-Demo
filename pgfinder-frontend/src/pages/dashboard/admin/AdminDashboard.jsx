import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiBarChart2, FiUsers, FiHome, FiThumbsUp, FiX } from 'react-icons/fi'
import Button from '../../../components/common/Button'
import Card from '../../../components/common/Card'
import dashboardService from '../../../services/dashboardService'
import propertyService from '../../../services/propertyService'

function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [leadSummary, setLeadSummary] = useState({ totalLeads: 0, vendors: [] })
  const [properties, setProperties] = useState([])
  const [inactiveProperties, setInactiveProperties] = useState([])
  const [filters, setFilters] = useState({ approvalStatus: '', category: '', search: '' })
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const [data, propertyList, inactiveList, leadData] = await Promise.all([
        dashboardService.getAdminStats(),
        propertyService.fetchAllProperties(),
        propertyService.fetchAllProperties({ status: 'inactive' }),
        dashboardService.getAdminVendorLeadSummary(),
      ])
      setStats(data)
      setProperties(propertyList || [])
      setInactiveProperties(inactiveList || [])
      setLeadSummary(leadData)
    } catch {
      setStats({ users: 0, vendors: 0, properties: 0, inactiveProperties: 0, inquiries: 0, pendingProperties: 0 })
      setProperties([])
      setInactiveProperties([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const filteredProperties = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return properties.filter((property) => {
      if (filters.approvalStatus && (property.approvalStatus || 'Approved') !== filters.approvalStatus) return false
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
        property.propertyTypeName,
      ].filter(Boolean).join(' ').toLowerCase().includes(search)
    })
  }, [filters, properties])

  const handleReview = async (propertyId, approvalStatus) => {
    setActionError('')
    try {
      const updated = await propertyService.reviewProperty(propertyId, approvalStatus)
      setProperties((current) => current.map((property) => (property.id === propertyId ? updated : property)))
      setSelectedProperty((current) => (current?.id === propertyId ? updated : current))
    } catch (error) {
      setActionError(error?.message || 'Unable to update property approval.')
    }
  }

  const handleDeactivate = async (propertyId) => {
    setActionError('')
    try {
      await propertyService.deleteProperty(propertyId)
      setProperties((current) => current.filter((property) => property.id !== propertyId))
      const [statsData, inactiveList] = await Promise.all([
        dashboardService.getAdminStats(),
        propertyService.fetchAllProperties({ status: 'inactive' }),
      ])
      setStats(statsData)
      setInactiveProperties(inactiveList || [])
    } catch (error) {
      setActionError(error?.message || 'Unable to deactivate property.')
    }
  }

  const handleReactivate = async (propertyId) => {
    setActionError('')
    try {
      const updated = await propertyService.reactivateProperty(propertyId)
      setInactiveProperties((current) => current.filter((property) => property.id !== propertyId))
      setProperties((current) => [updated, ...current])
      setStats(await dashboardService.getAdminStats())
    } catch (error) {
      setActionError(error?.message || 'Unable to reactivate property.')
    }
  }

  const handleBulkReview = async (approvalStatus) => {
    setActionError('')
    try {
      const targets = filteredProperties.filter((property) => (property.approvalStatus || 'Approved') !== approvalStatus)
      const updatedProperties = await Promise.all(targets.map((property) => propertyService.reviewProperty(property.id, approvalStatus)))
      const updatedById = new Map(updatedProperties.map((property) => [property.id, property]))
      setProperties((current) => current.map((property) => updatedById.get(property.id) || property))
      setStats(await dashboardService.getAdminStats())
    } catch (error) {
      setActionError(error?.message || `Unable to ${approvalStatus.toLowerCase()} selected properties.`)
    }
  }

  const pendingProperties = filteredProperties.filter((property) => (property.approvalStatus || 'Approved') === 'Pending')

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
            { label: 'Total users', value: stats.users, icon: <FiUsers />, onClick: () => navigate('/dashboard/admin/users') },
            { label: 'Vendors', value: stats.vendors, icon: <FiHome />, onClick: () => navigate('/dashboard/admin/users?role=Owner') },
            { label: 'Properties', value: stats.properties, icon: <FiBarChart2 />, onClick: () => document.getElementById('admin-properties')?.scrollIntoView({ behavior: 'smooth' }) },
            { label: 'Leads', value: stats.leads || leadSummary.totalLeads, icon: <FiThumbsUp />, onClick: () => document.getElementById('admin-vendor-leads')?.scrollIntoView({ behavior: 'smooth' }) },
          ].map((item) => (
            <button key={item.label} type="button" onClick={item.onClick} className="text-left">
              <Card className="h-full p-6 transition hover:border-accent-500">
              <div className="flex items-center justify-between gap-4 text-slate-300">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-950 text-accent-400">{item.icon}</span>
                <div className="text-right">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                </div>
              </div>
              </Card>
            </button>
          ))
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        {[
          { label: 'Revenue pipeline', value: `₹${((stats?.leads || leadSummary.totalLeads || 0) * 2500).toLocaleString('en-IN')}` },
          { label: 'Active listings', value: stats?.properties || 0 },
          { label: 'Pending reviews', value: stats?.pendingProperties || pendingProperties.length },
          { label: 'Conversions', value: stats?.conversions || 0 },
        ].map((item) => (
          <Card key={item.label} className="p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card id="admin-vendor-leads">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Vendor delivery</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Vendor lead breakdown</h2>
          </div>
          <Button variant="secondary">{leadSummary.totalLeads} total leads</Button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {leadSummary.vendors.slice(0, 6).map((vendor) => (
            <div key={vendor.vendorId} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{vendor.vendor.name || 'Vendor'}</p>
              <p className="mt-2 text-lg font-semibold text-white">{vendor.totalLeads}</p>
              <p className="mt-2 text-slate-400">Visits: {vendor.visitCount} • Interest: {vendor.inquiryCount}</p>
            </div>
          ))}
          {!leadSummary.vendors.length ? (
            <p className="text-slate-400">No vendor leads have been recorded yet.</p>
          ) : null}
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_0.7fr_0.7fr_auto]">
          <input
            type="search"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search property, city, area"
            className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400"
          />
          <select
            value={filters.approvalStatus}
            onChange={(event) => setFilters((current) => ({ ...current, approvalStatus: event.target.value }))}
            className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400"
          >
            <option value="">All approvals</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select
            value={filters.category}
            onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
            className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400"
          >
            <option value="">All categories</option>
            <option value="PG">PG</option>
            <option value="Flat">Flat</option>
            <option value="Hotel">Hotel</option>
            <option value="Hostel">Hostel</option>
          </select>
          <Button variant="secondary" onClick={() => setFilters({ approvalStatus: '', category: '', search: '' })}>Clear</Button>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Property reviews</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Vendor listing approvals</h2>
            </div>
            <Button variant="secondary">{filteredProperties.length} shown</Button>
          </div>
          {actionError ? <p className="mt-4 text-sm text-rose-300">{actionError}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => handleBulkReview('Approved')} className="rounded-full border border-emerald-500/60 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/10">
              Accept all shown
            </button>
            <button type="button" onClick={() => handleBulkReview('Rejected')} className="rounded-full border border-rose-500/60 px-4 py-2 text-sm text-rose-200 hover:bg-rose-500/10">
              Reject all shown
            </button>
          </div>
          <div className="mt-6 space-y-4">
            {pendingProperties.length ? (
              pendingProperties.map((property) => (
                <div key={property.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-400">{property.category || property.type || 'PG'} • {property.city || 'Unknown city'}</p>
                      <button type="button" onClick={() => setSelectedProperty(property)} className="mt-2 text-left text-lg font-semibold text-white hover:text-accent-300">{property.name}</button>
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

        <Card id="admin-properties">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Metrics</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">All property controls</h2>
          </div>
          <div className="mt-6 max-h-[360px] space-y-3 overflow-y-auto rounded-[1.75rem] bg-slate-950/80 p-4 text-slate-300">
            {filteredProperties.length ? (
              filteredProperties.map((property) => (
                <div key={property.id} className="flex flex-col gap-3 rounded-3xl border border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <button type="button" onClick={() => setSelectedProperty(property)} className="font-semibold text-white hover:text-accent-300">{property.name}</button>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {property.category || property.type || 'PG'} • {property.approvalStatus || 'Approved'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setSelectedProperty(property)} className="rounded-full border border-slate-600 px-3 py-2 text-xs text-slate-200">View</button>
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

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Inactive folder</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Deactivated properties</h2>
            </div>
            <Button variant="secondary">{inactiveProperties.length} stored</Button>
          </div>
          <div className="mt-6 max-h-[360px] space-y-3 overflow-y-auto rounded-[1.75rem] bg-slate-950/80 p-4 text-slate-300">
            {inactiveProperties.length ? (
              inactiveProperties.map((property) => (
                <div key={property.id} className="flex flex-col gap-3 rounded-3xl border border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">{property.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {property.category || property.type || 'PG'} • {property.city || 'Unknown city'}
                    </p>
                  </div>
                  <button type="button" onClick={() => handleReactivate(property.id)} className="rounded-full border border-emerald-500/60 px-3 py-2 text-xs text-emerald-200">
                    Activate again
                  </button>
                </div>
              ))
            ) : (
              <p>No deactivated properties stored.</p>
            )}
          </div>
        </Card>
      </div>
      {selectedProperty ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-slate-800 bg-surface-900 p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-accent-400">{selectedProperty.category || selectedProperty.type || 'PG'} • {selectedProperty.approvalStatus || 'Approved'}</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">{selectedProperty.name}</h2>
              </div>
              <button type="button" onClick={() => setSelectedProperty(null)} className="rounded-full border border-slate-700 p-2 text-slate-300 hover:border-accent-500">
                <FiX />
              </button>
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
            {selectedProperty.menuPhoto ? <img src={selectedProperty.menuPhoto} alt={`${selectedProperty.name} menu`} className="mt-4 max-h-72 w-full rounded-2xl object-cover" /> : null}
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={() => handleReview(selectedProperty.id, 'Approved')} className="rounded-full border border-emerald-500/60 px-4 py-2 text-sm text-emerald-200">Approve</button>
              <button type="button" onClick={() => handleReview(selectedProperty.id, 'Rejected')} className="rounded-full border border-rose-500/60 px-4 py-2 text-sm text-rose-200">Reject</button>
              <button type="button" onClick={() => handleDeactivate(selectedProperty.id)} className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200">Deactivate</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AdminDashboard
