import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FiBarChart2, FiCheck, FiEye, FiHome, FiRefreshCw, FiSearch, FiUsers } from 'react-icons/fi'
import Button from '../../../components/common/Button'
import Card from '../../../components/common/Card'
import adminApi from '../../../api/adminApi'
import useDebouncedValue from '../../../hooks/useDebouncedValue'
import { useAuth } from '../../../context/AuthContext'

const statusTone = {
  Approved: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  Pending: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  Rejected: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN')
}

function AdminDashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [filters, setFilters] = useState({ search: '', city: '', propertyType: '', approvalStatus: '', active: '', occupancy: '', sort: 'newest' })
  const [selected, setSelected] = useState([])
  const debouncedSearch = useDebouncedValue(filters.search)

  const propertyParams = useMemo(() => ({ ...filters, search: debouncedSearch, limit: 30 }), [debouncedSearch, filters])
  const { data: analytics, isLoading: analyticsLoading } = useQuery({ queryKey: ['admin-analytics'], queryFn: adminApi.analytics, refetchInterval: 30_000 })
  const { data: propertiesData, isFetching: propertiesLoading, error } = useQuery({ queryKey: ['admin-properties', propertyParams], queryFn: () => adminApi.properties(propertyParams), refetchInterval: 30_000 })
  const { data: vendorData } = useQuery({ queryKey: ['admin-vendors', debouncedSearch], queryFn: () => adminApi.vendors({ search: debouncedSearch, limit: 8 }), enabled: Boolean(debouncedSearch) })
  const { data: moveIns = [] } = useQuery({ queryKey: ['admin-move-ins'], queryFn: () => adminApi.moveIns({ limit: 12 }), refetchInterval: 30_000 })

  const properties = propertiesData?.items || []
  const summary = analytics?.summary || {}
  const vendorMatches = vendorData?.items || []

  const refreshAdmin = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-analytics'] })
    queryClient.invalidateQueries({ queryKey: ['admin-properties'] })
    queryClient.invalidateQueries({ queryKey: ['admin-vendors'] })
    queryClient.invalidateQueries({ queryKey: ['admin-move-ins'] })
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, payload }) => adminApi.updatePropertyStatus(id, payload),
    onSuccess: refreshAdmin,
  })

  const bulkMutation = useMutation({
    mutationFn: (payload) => adminApi.bulkProperties(payload),
    onSuccess: () => {
      setSelected([])
      refreshAdmin()
    },
  })
  const moveInMutation = useMutation({
    mutationFn: ({ id, status }) => adminApi.reviewMoveIn(id, { status, adminId: user?._id }),
    onSuccess: refreshAdmin,
  })

  const selectedIds = selected.length ? selected : properties.map((property) => property.id)
  const handleBulk = (action) => bulkMutation.mutate({ ids: selectedIds, action })
  const toggleSelected = (id) => setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))

  const statCards = [
    { label: 'Total users', value: summary.totalUsers, icon: <FiUsers />, onClick: () => navigate('/dashboard/admin/users') },
    { label: 'Vendors', value: summary.vendors, icon: <FiHome />, onClick: () => navigate('/dashboard/admin/users?role=Owner') },
    { label: 'Active listings', value: summary.activeListings, icon: <FiBarChart2 />, onClick: () => { setFilters((current) => ({ ...current, active: 'true' })); document.getElementById('admin-properties')?.scrollIntoView({ behavior: 'smooth' }) } },
    { label: 'Leads', value: summary.leads, icon: <FiCheck />, onClick: () => document.getElementById('lead-analytics')?.scrollIntoView({ behavior: 'smooth' }) },
  ]

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-slate-800/80 bg-surface-800/90 p-4 shadow-card sm:rounded-[2rem] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-accent-400 sm:text-sm sm:tracking-[0.28em]">StayJi command center</p>
            <h1 className="mt-3 text-2xl font-semibold text-white sm:text-4xl">Live platform management</h1>
          </div>
          <Button onClick={refreshAdmin} variant="secondary"><FiRefreshCw /> Refresh live data</Button>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-4">
        {statCards.map((item) => (
          <button key={item.label} type="button" onClick={item.onClick} className="text-left">
            <Card className="h-full p-5 transition hover:border-accent-500">
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-accent-400">{item.icon}</span>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{analyticsLoading ? '...' : formatNumber(item.value)}</p>
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-4">
        {[
          { label: 'Live vacancies', value: summary.liveVacancies, onClick: () => setFilters((current) => ({ ...current, occupancy: 'vacant' })) },
          { label: 'Occupancy rate', value: `${summary.occupancyRate || 0}%`, onClick: () => setFilters((current) => ({ ...current, occupancy: 'full' })) },
          { label: 'Conversion rate', value: `${summary.conversionRate || 0}%`, onClick: () => document.getElementById('lead-analytics')?.scrollIntoView({ behavior: 'smooth' }) },
          { label: 'Revenue analytics', value: `₹${formatNumber(summary.revenue)}`, onClick: () => document.getElementById('lead-analytics')?.scrollIntoView({ behavior: 'smooth' }) },
        ].map((item) => (
          <Card key={item.label} className="p-0">
            <button type="button" onClick={() => { item.onClick(); document.getElementById('admin-properties')?.scrollIntoView({ behavior: 'smooth' }) }} className="h-full w-full p-5 text-left transition hover:bg-slate-900/50">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
            </button>
          </Card>
        ))}
      </div>

      <div id="lead-analytics" className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Lead analytics</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Monthly lead and conversion trend</h2>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.trends || []}>
                <defs>
                  <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }} />
                <Area type="monotone" dataKey="leads" stroke="#22c55e" fill="url(#leadGradient)" />
                <Area type="monotone" dataKey="conversions" stroke="#38bdf8" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">City heatmap</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Listings by city</h2>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.cityHeatmap || []}>
                <CartesianGrid stroke="#1e293b" />
                <XAxis dataKey="city" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }} />
                <Bar dataKey="listings" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr_0.7fr_0.7fr_auto]">
          <label className="flex items-center gap-3 rounded-3xl border border-slate-700 bg-slate-950/70 px-4 text-slate-300">
            <FiSearch />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search vendor, property, city, area, ID, email, phone"
              className="w-full bg-transparent py-3 text-sm text-slate-100 outline-none"
            />
          </label>
          <input value={filters.city} onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))} placeholder="City" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
          <select value={filters.propertyType} onChange={(event) => setFilters((current) => ({ ...current, propertyType: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400">
            <option value="">All types</option>
            <option value="PG">PG</option>
            <option value="Flat">Flat</option>
            <option value="Hotel">Hotel</option>
            <option value="Hostel">Hostel</option>
          </select>
          <select value={filters.approvalStatus} onChange={(event) => setFilters((current) => ({ ...current, approvalStatus: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400">
            <option value="">All approvals</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select value={filters.occupancy} onChange={(event) => setFilters((current) => ({ ...current, occupancy: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400">
            <option value="">Occupancy</option>
            <option value="vacant">Vacant</option>
            <option value="full">Full</option>
          </select>
          <select value={filters.active} onChange={(event) => setFilters((current) => ({ ...current, active: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400">
            <option value="">All active</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <Button variant="secondary" onClick={() => setFilters({ search: '', city: '', propertyType: '', approvalStatus: '', active: '', occupancy: '', sort: 'newest' })}>Clear</Button>
        </div>
        {vendorMatches.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {vendorMatches.map((vendor) => (
              <button key={vendor.id} type="button" onClick={() => navigate(`/dashboard/admin/vendors/${vendor.id}`)} className="rounded-full border border-accent-500/50 px-3 py-2 text-xs text-accent-200 hover:bg-accent-500/10">
                {vendor.name || vendor.email} · {vendor.totalProperties || 0} properties
              </button>
            ))}
          </div>
        ) : null}
      </Card>

      <Card id="admin-properties" className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-slate-800 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Property operations</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">MongoDB powered listing control</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => handleBulk('approve')} className="rounded-full border border-emerald-500/60 px-4 py-2 text-sm text-emerald-200">Verify all</button>
            <button type="button" onClick={() => handleBulk('activate')} className="rounded-full border border-cyan-500/60 px-4 py-2 text-sm text-cyan-200">Activate selected</button>
            <button type="button" onClick={() => handleBulk('reject')} className="rounded-full border border-rose-500/60 px-4 py-2 text-sm text-rose-200">Reject all</button>
            <button type="button" onClick={() => handleBulk('deactivate')} className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200">Deactivate selected</button>
          </div>
        </div>
        {error ? <p className="p-5 text-sm text-rose-300">{error.message}</p> : null}
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="min-w-[980px] divide-y divide-slate-800 text-left text-sm">
            <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Select</th>
                <th className="px-5 py-4">Property</th>
                <th className="px-5 py-4">Vendor</th>
                <th className="px-5 py-4">Occupancy</th>
                <th className="px-5 py-4">Leads</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {properties.map((property) => (
                <tr key={property.id} className="hover:bg-slate-900/70">
                  <td className="px-5 py-4"><input type="checkbox" checked={selected.includes(property.id)} onChange={() => toggleSelected(property.id)} /></td>
                  <td className="px-5 py-4">
                    <button type="button" onClick={() => navigate(`/dashboard/admin/properties/${property.id}`)} className="font-semibold text-white hover:text-accent-300">{property.name}</button>
                    <p className="mt-1 text-xs text-slate-500">{property.city || '-'} · {property.area || property.areaName || '-'} · {property.id}</p>
                  </td>
                  <td className="px-5 py-4">
                    <button type="button" onClick={() => navigate(`/dashboard/admin/vendors/${property.vendorId}`)} className="text-accent-200 hover:text-accent-100">{property.vendor?.name || property.owner?.name || '-'}</button>
                    <p className="mt-1 text-xs text-slate-500">{property.vendor?.email || property.owner?.email || '-'}</p>
                  </td>
                  <td className="px-5 py-4">{property.occupancy || 0}% · {property.vacancyStatus || '-'}</td>
                  <td className="px-5 py-4">{property.totalLeads || 0} leads · {property.totalVisits || 0} visits</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full border px-3 py-1 text-xs ${statusTone[property.approvalStatus] || statusTone.Pending}`}>{property.approvalStatus || 'Pending'}</span>
                    <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs ${
                      property.isActive
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                        : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                    }`}>{property.isActive ? 'Active' : 'Inactive'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => navigate(`/dashboard/admin/properties/${property.id}`)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-200"><FiEye /> View</button>
                      <button type="button" onClick={() => navigate(`/dashboard/admin/properties/${property.id}/edit`)} className="rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-200">Edit</button>
                      <button type="button" onClick={() => statusMutation.mutate({ id: property.id, payload: { approvalStatus: 'Approved' } })} className="rounded-full border border-emerald-500/60 px-3 py-2 text-xs text-emerald-200">Verify</button>
                      <button type="button" onClick={() => statusMutation.mutate({ id: property.id, payload: { approvalStatus: 'Rejected' } })} className="rounded-full border border-rose-500/60 px-3 py-2 text-xs text-rose-200">Reject</button>
                      <button type="button" onClick={() => statusMutation.mutate({ id: property.id, payload: { isActive: !property.isActive } })} className={`rounded-full border px-3 py-2 text-xs transition ${
                        property.isActive
                          ? 'border-rose-500/60 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20'
                          : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                      }`}>{property.isActive ? 'Deactivate' : 'Activate'}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!properties.length ? (
                <tr><td className="px-5 py-8 text-center text-slate-400" colSpan="7">{propertiesLoading ? 'Loading live properties...' : 'No properties match these filters.'}</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.65fr]">
        <Card>
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Top lead generators</p>
          <div className="mt-5 space-y-3">
            {(analytics?.topProperties || []).map((item) => (
              <button key={item.propertyId} type="button" onClick={() => navigate(`/dashboard/admin/properties/${item.propertyId}`)} className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left hover:border-accent-500">
                <span><span className="font-semibold text-white">{item.name}</span><span className="ml-2 text-sm text-slate-500">{item.city}</span></span>
                <span className="text-accent-200">{item.inquiries} leads</span>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Move-in verification</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Cashback and commission queue</h2>
          <div className="mt-5 space-y-3">
            {moveIns.slice(0, 6).map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">{item.propertyId?.propertyName || 'StayJi property'} · {item.status}</p>
                <p className="mt-1">User: {[item.userId?.userFname, item.userId?.userLname].filter(Boolean).join(' ') || item.userId?.userEmail || '-'}</p>
                <p className="mt-1">Commission ₹{item.commissionAmount || 0} · Cashback ₹{item.cashbackAmount || 0}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => moveInMutation.mutate({ id: item._id, status: 'Verified' })} className="rounded-full border border-emerald-500/60 px-3 py-2 text-xs text-emerald-200">Verify</button>
                  <button type="button" onClick={() => moveInMutation.mutate({ id: item._id, status: 'Suspicious' })} className="rounded-full border border-amber-500/60 px-3 py-2 text-xs text-amber-200">Flag suspicious</button>
                  <button type="button" onClick={() => moveInMutation.mutate({ id: item._id, status: 'Rejected' })} className="rounded-full border border-rose-500/60 px-3 py-2 text-xs text-rose-200">Reject</button>
                </div>
              </div>
            ))}
            {!moveIns.length ? <p className="text-sm text-slate-400">No move-in submissions yet.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.65fr]">
        <Card>
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Approval mix</p>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ name: 'Pending', value: summary.pendingProperties || 0 }, { name: 'Live', value: summary.activeListings || 0 }, { name: 'Inactive', value: summary.inactiveListings || 0 }]} dataKey="value" outerRadius={90}>
                  {['#f59e0b', '#22c55e', '#64748b'].map((color) => <Cell key={color} fill={color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard
