import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FiBarChart2, FiCheck, FiEye, FiHome, FiRefreshCw, FiSearch, FiUsers } from 'react-icons/fi'
import Button from '../../../components/common/Button'
import Card from '../../../components/common/Card'
import AdvancedDataTable from '../../../components/admin/AdvancedDataTable'
import adminApi from '../../../api/adminApi'
import useDebouncedValue from '../../../hooks/useDebouncedValue'
import { useAuth } from '../../../context/AuthContext'
import { FieldNote, StatusChip, getOperationalStatus } from '../../../utils/operationalStatus.jsx'

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
  const emptyFilters = { search: '', city: '', locality: '', owner: '', propertyType: '', propertyStatus: '', verificationStatus: '', demoLive: '', approvalStatus: '', active: '', occupancy: '', dateFrom: '', dateTo: '', sort: 'newest' }
  const [filters, setFilters] = useState(emptyFilters)
  const [bulkRequest, setBulkRequest] = useState(null)
  const [toast, setToast] = useState('')
  const debouncedSearch = useDebouncedValue(filters.search)

  const propertyParams = useMemo(() => ({ ...filters, search: debouncedSearch, limit: 30 }), [debouncedSearch, filters])
  const { data: analytics, isLoading: analyticsLoading } = useQuery({ queryKey: ['admin-analytics', propertyParams], queryFn: () => adminApi.analytics(propertyParams), refetchInterval: 30_000 })
  const { data: propertiesData, isFetching: propertiesLoading, error } = useQuery({ queryKey: ['admin-properties', propertyParams], queryFn: () => adminApi.properties(propertyParams), refetchInterval: 30_000 })
  const { data: ownerData } = useQuery({ queryKey: ['admin-owners', debouncedSearch], queryFn: () => adminApi.owners({ search: debouncedSearch, limit: 8 }), enabled: Boolean(debouncedSearch) })
  const { data: moveIns = [] } = useQuery({ queryKey: ['admin-move-ins'], queryFn: () => adminApi.moveIns({ limit: 12 }), refetchInterval: 30_000 })
  const { data: payouts = [] } = useQuery({ queryKey: ['admin-wallet-payouts'], queryFn: () => adminApi.walletPayouts({ limit: 12 }), refetchInterval: 30_000 })
  const { data: updateRequests = [] } = useQuery({ queryKey: ['admin-property-update-requests'], queryFn: () => adminApi.propertyUpdateRequests({ status: 'Pending', limit: 12 }), refetchInterval: 30_000 })

  const properties = propertiesData?.items || []
  const summary = analytics?.summary || {}
  const ownerMatches = ownerData?.items || []

  const refreshAdmin = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-analytics'] })
    queryClient.invalidateQueries({ queryKey: ['admin-properties'] })
    queryClient.invalidateQueries({ queryKey: ['admin-owners'] })
    queryClient.invalidateQueries({ queryKey: ['admin-move-ins'] })
    queryClient.invalidateQueries({ queryKey: ['admin-wallet-payouts'] })
    queryClient.invalidateQueries({ queryKey: ['admin-property-update-requests'] })
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, payload }) => adminApi.updatePropertyStatus(id, payload),
    onSuccess: refreshAdmin,
  })

  const bulkMutation = useMutation({
    mutationFn: (payload) => adminApi.bulkProperties(payload),
    onSuccess: () => {
      refreshAdmin()
      setToast('Bulk action completed. Tables, counts, and charts are refreshing.')
      setBulkRequest(null)
    },
  })
  const moveInMutation = useMutation({
    mutationFn: ({ id, status }) => adminApi.reviewMoveIn(id, { status, adminId: user?._id }),
    onSuccess: refreshAdmin,
  })
  const payoutMutation = useMutation({
    mutationFn: ({ id, status }) => adminApi.reviewWalletPayout(id, { status, adminId: user?._id }),
    onSuccess: refreshAdmin,
  })
  const updateRequestMutation = useMutation({
    mutationFn: ({ id, status }) => adminApi.reviewPropertyUpdateRequest(id, { status, adminId: user?._id, performerRole: user?.userType || 'Admin' }),
    onSuccess: refreshAdmin,
  })

  const statCards = [
    { label: 'Total users', value: summary.totalUsers, icon: <FiUsers />, onClick: () => navigate('/dashboard/admin/users') },
    { label: 'Owners', value: summary.owners, icon: <FiHome />, onClick: () => navigate('/dashboard/admin/users?role=Owner') },
    { label: 'Total properties', value: (summary.realProperties || 0) + (summary.demoProperties || 0), icon: <FiBarChart2 />, onClick: () => document.getElementById('admin-properties')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Pending verification', value: summary.pendingVerification || summary.pendingProperties, icon: <FiCheck />, onClick: () => { setFilters((current) => ({ ...current, propertyStatus: 'pending', approvalStatus: 'Pending' })); document.getElementById('admin-properties')?.scrollIntoView({ behavior: 'smooth' }) } },
    { label: 'Approved properties', value: summary.approvedProperties, icon: <FiCheck />, onClick: () => { setFilters((current) => ({ ...current, approvalStatus: 'Approved' })); document.getElementById('admin-properties')?.scrollIntoView({ behavior: 'smooth' }) } },
    { label: 'Rejected properties', value: summary.rejectedProperties, icon: <FiCheck />, onClick: () => { setFilters((current) => ({ ...current, approvalStatus: 'Rejected' })); document.getElementById('admin-properties')?.scrollIntoView({ behavior: 'smooth' }) } },
    { label: "Today's visits", value: summary.todayVisits, icon: <FiUsers />, onClick: () => document.getElementById('lead-analytics')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Monthly visits', value: summary.monthlyVisits, icon: <FiUsers />, onClick: () => document.getElementById('lead-analytics')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Unread messages', value: summary.unreadMessages, icon: <FiUsers />, onClick: () => document.getElementById('lead-analytics')?.scrollIntoView({ behavior: 'smooth' }) },
  ]
  const operationCards = [
    { label: 'LIVE properties', value: summary.activeListings, note: 'Public searchable listings', filter: { propertyStatus: 'live', demoLive: 'live', active: 'true' } },
    { label: 'DEMO properties', value: summary.demoProperties || 0, note: 'Sample inventory', filter: { propertyStatus: 'demo', demoLive: 'demo' } },
    { label: 'Pending review', value: summary.pendingProperties, note: 'Needs moderation', filter: { propertyStatus: 'pending', approvalStatus: 'Pending' } },
    { label: 'Hidden listings', value: summary.inactiveListings, note: 'Not publicly visible', filter: { propertyStatus: 'hidden', active: 'false' } },
  ]
  const actionDetails = {
    mark_live: { title: 'Mark selected properties as LIVE?', body: ['make listings public', 'remove demo labels', 'include listings in real analytics'] },
    mark_demo: { title: 'Mark selected properties as DEMO?', body: ['show listings as sample inventory', 'separate them from real analytics', 'keep them available for pre-launch demos'] },
    hide_publicly: { title: 'Hide selected properties publicly?', body: ['remove listings from public search', 'keep records available for operations', 'preserve analytics history'] },
    archive: { title: 'Archive selected properties?', body: ['remove records from active workflows', 'hide them publicly', 'keep audit history'] },
    unarchive: { title: 'Unarchive selected properties?', body: ['return records to active workflows', 'make eligible approved listings visible again', 'keep audit history'] },
    verify: { title: 'Verify selected properties?', body: ['mark listings as verified', 'approve them for operational use', 'notify owners'] },
    suspend: { title: 'Suspend selected properties?', body: ['block public visibility', 'mark listings as suspended', 'notify owners'] },
  }
  const openBulkAction = (action, selectedIds) => {
    const ids = selectedIds
    if (!ids.length) {
      setToast('No properties selected. Select checkboxes first, then choose a bulk action.')
      return
    }
    setBulkRequest({ action, ids, ...(actionDetails[action] || {}) })
  }
  const confirmBulkAction = () => {
    if (!bulkRequest) return
    bulkMutation.mutate({ ids: bulkRequest.ids, action: bulkRequest.action, adminId: user?._id, performerRole: user?.userType || 'Admin' })
  }
  const propertyColumns = [
    {
      key: 'property',
      label: 'Property',
      value: (property) => `${property.name || ''} ${property.city || ''} ${property.area || property.areaName || ''} ${property.id || ''}`,
      render: (property) => (
        <button type="button" onClick={() => navigate(`/dashboard/admin/properties/${property.id}`)} className="font-semibold text-white hover:text-accent-300">
          {property.name}
          <span className="mt-1 block max-w-[260px] truncate text-xs font-normal text-slate-500">{property.city || '-'} · {property.area || property.areaName || '-'} · {property.id}</span>
        </button>
      ),
    },
    {
      key: 'owner',
      label: 'Owner',
      value: (property) => `${property.owner?.name || property.ownerProfile?.name || ''} ${property.owner?.email || property.ownerProfile?.email || ''}`,
      render: (property) => (
        <button type="button" onClick={() => navigate(`/dashboard/admin/owners/${property.vendorId}`)} className="text-accent-200 hover:text-accent-100">
          {property.owner?.name || property.ownerProfile?.name || '-'}
          <span className="mt-1 block text-xs text-slate-500">{property.owner?.email || property.ownerProfile?.email || '-'}</span>
        </button>
      ),
    },
    { key: 'occupancy', label: 'Occupancy', value: (property) => `${property.occupancy || 0}% ${property.vacancyStatus || ''}` },
    { key: 'leads', label: 'Leads', value: (property) => `${property.totalLeads || 0} leads ${property.totalVisits || 0} visits`, sortValue: (property) => property.totalLeads || 0 },
    {
      key: 'status',
      label: 'Operational state',
      value: (property) => `${getOperationalStatus(property)} ${property.approvalStatus || 'Pending'} ${property.isDummy ? 'Demo' : 'Live'} ${property.isActive ? 'Visible' : 'Hidden'}`,
      render: (property) => (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <StatusChip status={getOperationalStatus(property)} />
            <StatusChip status={property.isDummy ? 'DEMO' : 'LIVE'} title={property.isDummy ? 'Demo listing, separated from real inventory.' : 'Real listing, counted as marketplace supply.'} />
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs ${statusTone[property.approvalStatus] || statusTone.Pending}`}>{property.approvalStatus || 'Pending'}</span>
            <span className={`rounded-full border px-3 py-1 text-xs ${property.publicVisibility ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-slate-500/40 bg-slate-500/10 text-slate-200'}`}>{property.publicVisibility ? 'Public' : 'Not public'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      value: (property) => property.id,
      render: (property) => (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate(`/dashboard/admin/properties/${property.id}`)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-200"><FiEye /> View</button>
          <button type="button" onClick={() => navigate(`/dashboard/admin/properties/${property.id}/edit`)} className="rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-200">Edit</button>
          <button type="button" onClick={() => statusMutation.mutate({ id: property.id, payload: { approvalStatus: 'Approved' } })} className="rounded-full border border-emerald-500/60 px-3 py-2 text-xs text-emerald-200">Verify</button>
          <button type="button" onClick={() => statusMutation.mutate({ id: property.id, payload: { approvalStatus: 'Rejected' } })} className="rounded-full border border-rose-500/60 px-3 py-2 text-xs text-rose-200">Reject</button>
          <button type="button" onClick={() => statusMutation.mutate({ id: property.id, payload: property.isActive && property.status !== 'archived' ? { isActive: false } : { isActive: true, status: 'active' } })} className={`rounded-full border px-3 py-2 text-xs transition ${
            property.isActive
              ? 'border-rose-500/60 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20'
              : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
          }`}>{property.isActive && property.status !== 'archived' ? 'Hide' : property.status === 'archived' ? 'Unarchive' : 'Unhide'}</button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      {toast ? (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{toast}</div>
      ) : null}
      <header className="rounded-2xl border border-slate-800/80 bg-surface-800/90 p-4 shadow-card sm:rounded-[2rem] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-accent-400 sm:text-sm sm:tracking-[0.28em]">StayJi command center</p>
            <h1 className="mt-3 text-2xl font-semibold text-white sm:text-4xl">Live platform management</h1>
            <p className="mt-2 text-sm text-slate-400">Launch scope: Bangalore, Karnataka. Admin has full launch controls across users, owners, properties, leads, reviews, and analytics.</p>
            <p className="mt-1 text-xs text-slate-500">Admin ID: {user?._id ? `SJ-${user._id.toString().slice(-6).toUpperCase()}` : user?.id || '-'}</p>
          </div>
          <Button onClick={refreshAdmin} variant="secondary"><FiRefreshCw /> Refresh live data</Button>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <button key={item.label} type="button" onClick={item.onClick} className="w-full text-left">
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
        {operationCards.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => { setFilters((current) => ({ ...current, ...item.filter })); document.getElementById('admin-properties')?.scrollIntoView({ behavior: 'smooth' }) }}
            className="w-full text-left"
            title={`${item.label} filters the property table, cards, and analytics together.`}
          >
            <Card className="h-full p-5 transition hover:border-accent-500">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{analyticsLoading ? '...' : formatNumber(item.value)}</p>
              <p className="mt-1 text-sm text-slate-400">{item.note}</p>
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
        <div className="mb-4">
          <p className="text-sm font-semibold text-white">Synchronized operations filters</p>
          <FieldNote>Changing these filters refreshes the table, counts, charts, and clickable cards together.</FieldNote>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex items-center gap-3 rounded-3xl border border-slate-700 bg-slate-950/70 px-4 text-slate-300">
            <FiSearch />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search owner, property, city, area, ID, email, phone"
              className="w-full bg-transparent py-3 text-sm text-slate-100 outline-none"
            />
          </label>
          <input value={filters.city} onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))} placeholder="City" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
          <input value={filters.locality} onChange={(event) => setFilters((current) => ({ ...current, locality: event.target.value }))} placeholder="Locality" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
          <select value={filters.propertyType} onChange={(event) => setFilters((current) => ({ ...current, propertyType: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400">
            <option value="">All types</option>
            <option value="PG">PG</option>
            <option value="Flat">Flat</option>
            <option value="Hotel">Hotel</option>
            <option value="Hostel">Hostel</option>
          </select>
          <select value={filters.propertyStatus} onChange={(event) => setFilters((current) => ({ ...current, propertyStatus: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400">
            <option value="">Property status</option>
            <option value="live">LIVE</option>
            <option value="demo">DEMO</option>
            <option value="hidden">HIDDEN</option>
            <option value="pending">PENDING</option>
            <option value="verified">VERIFIED</option>
            <option value="suspended">SUSPENDED</option>
            <option value="archived">ARCHIVED</option>
          </select>
          <select value={filters.verificationStatus} onChange={(event) => setFilters((current) => ({ ...current, verificationStatus: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400">
            <option value="">Verification</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
          <select value={filters.demoLive} onChange={(event) => setFilters((current) => ({ ...current, demoLive: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400">
            <option value="">Demo/Live</option>
            <option value="live">Live only</option>
            <option value="demo">Demo only</option>
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
            <input value={filters.owner} onChange={(event) => setFilters((current) => ({ ...current, owner: event.target.value }))} placeholder="Owner email/name" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
            <input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
            <input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
          <Button variant="secondary" onClick={() => setFilters(emptyFilters)}>Clear</Button>
        </div>
        {ownerMatches.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {ownerMatches.map((owner) => (
              <button key={owner.id} type="button" onClick={() => navigate(`/dashboard/admin/owners/${owner.id}`)} className="rounded-full border border-accent-500/50 px-3 py-2 text-xs text-accent-200 hover:bg-accent-500/10">
                {owner.name || owner.email} · {owner.totalProperties || 0} properties
              </button>
            ))}
          </div>
        ) : null}
      </Card>

      <div id="admin-properties">
        {error ? <p className="mb-3 text-sm text-rose-300">{error.message}</p> : null}
        <AdvancedDataTable
          title="Guided listing operations"
          eyebrow="Property operations"
          rows={properties}
          columns={propertyColumns}
          loading={propertiesLoading}
          searchPlaceholder="Search ObjectId, owner, property, locality, status"
          minWidth="1180px"
          actions={({ selected: tableSelected }) => (
            <div>
              <p className="mb-3 text-sm text-slate-400">{tableSelected.length} listings selected. Select checkboxes, then choose a workflow to see the confirmation details.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => openBulkAction('mark_live', tableSelected)} className="rounded-full border border-emerald-500/60 px-4 py-2 text-sm text-emerald-200">Mark LIVE</button>
                <button type="button" onClick={() => openBulkAction('mark_demo', tableSelected)} className="rounded-full border border-amber-500/60 px-4 py-2 text-sm text-amber-200">Mark DEMO</button>
                <button type="button" onClick={() => openBulkAction('hide_publicly', tableSelected)} className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200">Hide Publicly</button>
                <button type="button" onClick={() => openBulkAction('archive', tableSelected)} className="rounded-full border border-zinc-500/60 px-4 py-2 text-sm text-zinc-200">Archive</button>
                <button type="button" onClick={() => openBulkAction('unarchive', tableSelected)} className="rounded-full border border-emerald-500/60 px-4 py-2 text-sm text-emerald-200">Unarchive</button>
                <button type="button" onClick={() => openBulkAction('verify', tableSelected)} className="rounded-full border border-cyan-500/60 px-4 py-2 text-sm text-cyan-200">Verify</button>
                <button type="button" onClick={() => openBulkAction('suspend', tableSelected)} className="rounded-full border border-rose-500/60 px-4 py-2 text-sm text-rose-200">Suspend</button>
              </div>
            </div>
          )}
          emptyMessage={filters.propertyStatus === 'live' ? 'No LIVE properties currently launched. You can convert DEMO properties into LIVE listings from bulk actions.' : 'No records match the active operational filters.'}
        />
      </div>

      {bulkRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-surface-800 p-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.24em] text-accent-400">Confirm bulk workflow</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{bulkRequest.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{bulkRequest.ids.length} selected listings will be updated in the Bangalore launch scope.</p>
            <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
              <p className="text-sm font-semibold text-white">This will:</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {(bulkRequest.body || []).map((item) => <li key={item}>- {item}</li>)}
              </ul>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => setBulkRequest(null)}>Cancel</Button>
              <Button onClick={confirmBulkAction} disabled={bulkMutation.isPending}>Confirm</Button>
            </div>
          </div>
        </div>
      ) : null}

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
                  <button
                    type="button"
                    onClick={() => moveInMutation.mutate({ id: item._id, status: 'Verified' })}
                    disabled={!item.ownerConfirmed}
                    title={!item.ownerConfirmed ? 'Owner must confirm tenant joined before reward approval.' : 'Approve reward'}
                    className="rounded-full border border-emerald-500/60 px-3 py-2 text-xs text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Approve reward
                  </button>
                  <button type="button" onClick={() => moveInMutation.mutate({ id: item._id, status: 'Suspicious' })} className="rounded-full border border-amber-500/60 px-3 py-2 text-xs text-amber-200">Flag suspicious</button>
                  <button type="button" onClick={() => moveInMutation.mutate({ id: item._id, status: 'Rejected' })} className="rounded-full border border-rose-500/60 px-3 py-2 text-xs text-rose-200">Reject</button>
                </div>
                {!item.ownerConfirmed ? <p className="mt-2 text-xs text-amber-200">Waiting for owner confirmation before reward approval.</p> : null}
              </div>
            ))}
            {!moveIns.length ? <p className="text-sm text-slate-400">No move-in submissions yet.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Finance panel</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">User payouts and owner commission</h2>
          <div className="mt-5 space-y-3">
            {payouts.slice(0, 6).map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">{item.userId?.userFname || item.userId?.userEmail || 'User'} · {item.status}</p>
                <p className="mt-1">UPI {item.upiId || '-'} · Coins {item.coins || 0} · Amount ₹{item.amount || 0}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => payoutMutation.mutate({ id: item._id, status: 'Approved' })} className="rounded-full border border-cyan-500/60 px-3 py-2 text-xs text-cyan-200">Approve</button>
                  <button type="button" onClick={() => payoutMutation.mutate({ id: item._id, status: 'Paid' })} className="rounded-full border border-emerald-500/60 px-3 py-2 text-xs text-emerald-200">Mark paid</button>
                  <button type="button" onClick={() => payoutMutation.mutate({ id: item._id, status: 'Rejected' })} className="rounded-full border border-rose-500/60 px-3 py-2 text-xs text-rose-200">Reject</button>
                </div>
              </div>
            ))}
            {!payouts.length ? <p className="text-sm text-slate-400">No payout requests yet.</p> : null}
          </div>
        </Card>

        <Card>
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Property update approval</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Protected owner edits</h2>
          <div className="mt-5 space-y-3">
            {updateRequests.slice(0, 6).map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">{item.propertyId?.propertyName || 'Property'} · {item.status}</p>
                <p className="mt-1 text-slate-400">Fields: {Object.keys(item.requestedChanges || {}).join(', ') || '-'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => updateRequestMutation.mutate({ id: item._id, status: 'Approved' })} className="rounded-full border border-emerald-500/60 px-3 py-2 text-xs text-emerald-200">Approve</button>
                  <button type="button" onClick={() => updateRequestMutation.mutate({ id: item._id, status: 'Rejected' })} className="rounded-full border border-rose-500/60 px-3 py-2 text-xs text-rose-200">Reject</button>
                </div>
              </div>
            ))}
            {!updateRequests.length ? <p className="text-sm text-slate-400">No protected edits pending.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.65fr]">
        <Card>
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Approval mix</p>
          <FieldNote>Approval mix shows how many listings are pending admin review, live/public, or inactive/hidden so you can balance moderation workload and supply health.</FieldNote>
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
        <Card>
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Latest activities</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Recent admin actions</h2>
          <div className="mt-5 space-y-3">
            {(analytics?.latestActivities || []).slice(0, 8).map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">{item.action || 'Activity'} · {item.entityType || 'record'}</p>
                <p className="mt-1 text-slate-500">{item.city || 'Platform'} {item.addedOn || item.createdAt ? `· ${new Date(item.addedOn || item.createdAt).toLocaleString()}` : ''}</p>
              </div>
            ))}
            {!analytics?.latestActivities?.length ? <p className="text-sm text-slate-400">No recent admin activity yet.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard
