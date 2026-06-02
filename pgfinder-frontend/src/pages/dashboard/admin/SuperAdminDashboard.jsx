import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiActivity, FiDatabase, FiEye, FiEyeOff } from 'react-icons/fi'
import Card from '../../../components/common/Card'
import Button from '../../../components/common/Button'
import AdvancedDataTable from '../../../components/admin/AdvancedDataTable'
import adminApi from '../../../api/adminApi'
import { useAuth } from '../../../context/AuthContext'
import { FieldNote, StatusChip, getOperationalStatus } from '../../../utils/operationalStatus.jsx'

const permissionOptions = ['manage_users', 'manage_properties', 'manage_finance', 'manage_admins', 'manage_dummy_data', 'manage_seo', 'manage_moderation', 'view_global_analytics']

function SuperAdminDashboard() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [accountForm, setAccountForm] = useState({ name: '', email: '', phone: '', role: 'Admin', assignedCity: 'Bangalore', assignedState: 'Karnataka', temporaryPassword: '' })
  const [dummyForm, setDummyForm] = useState({ city: 'Bangalore', locality: '', scope: 'properties', isDummy: true, visible: true, status: 'demo' })
  const [propertyFilters, setPropertyFilters] = useState({ city: '', locality: '', propertyStatus: '', demoLive: '', verificationStatus: '', approvalStatus: '', occupancy: '' })
  const [bulkRequest, setBulkRequest] = useState(null)
  const [selectedAudit, setSelectedAudit] = useState(null)
  const [toast, setToast] = useState('')
  const { data: governance = { summary: {}, cityRows: [], auditLogs: [] }, isLoading } = useQuery({ queryKey: ['super-admin-governance'], queryFn: adminApi.governance, refetchInterval: 30_000 })
  const { data: cityStateData = { items: [] } } = useQuery({ queryKey: ['super-admin-city-states'], queryFn: () => adminApi.cityStates({ active: true }) })
  const { data: adminUsers = [] } = useQuery({ queryKey: ['super-admin-admin-users'], queryFn: () => adminApi.users({ role: 'Admin', status: 'active', limit: 100 }) })
  const propertyParams = useMemo(() => ({ ...propertyFilters, limit: 50 }), [propertyFilters])
  const { data: propertiesData = { items: [] }, isFetching: propertiesLoading } = useQuery({ queryKey: ['super-admin-properties', propertyParams], queryFn: () => adminApi.properties(propertyParams), refetchInterval: 30_000 })
  const properties = propertiesData.items || []

  const createAccount = useMutation({
    mutationFn: (payload) => adminApi.createAccount({ ...payload, performerId: user?._id, performerRole: 'Super Admin', permissions: payload.role === 'Admin' ? ['manage_users', 'manage_properties', 'manage_moderation', 'view_city_analytics'] : undefined }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin-governance'] }),
  })

  const dummyTransition = useMutation({
    mutationFn: (payload) => adminApi.dummyTransition({ ...payload, performerId: user?._id, performerRole: 'Super Admin' }),
    onSuccess: () => {
      setToast('Demo/live visibility updated. Governance, city rows, and listing tables are refreshing.')
      queryClient.invalidateQueries({ queryKey: ['super-admin-governance'] })
      queryClient.invalidateQueries({ queryKey: ['super-admin-properties'] })
    },
  })

  const bulkMutation = useMutation({
    mutationFn: (payload) => adminApi.bulkProperties({ ...payload, adminId: user?._id, performerRole: 'Super Admin' }),
    onSuccess: () => {
      setToast('Bulk workflow completed. Public visibility and analytics are refreshing.')
      setBulkRequest(null)
      queryClient.invalidateQueries({ queryKey: ['super-admin-governance'] })
      queryClient.invalidateQueries({ queryKey: ['super-admin-properties'] })
    },
  })

  const launchCity = useMutation({
    mutationFn: ({ id }) => adminApi.launchCity(id, { hideDemo: true }),
    onSuccess: (result) => {
      setToast(result?.msg || 'City launched. Demo listings were hidden and real listings prioritized.')
      queryClient.invalidateQueries({ queryKey: ['super-admin-governance'] })
      queryClient.invalidateQueries({ queryKey: ['super-admin-city-states'] })
      queryClient.invalidateQueries({ queryKey: ['super-admin-properties'] })
    },
  })
  const pauseCity = useMutation({
    mutationFn: (row) => adminApi.saveCityState({ stateName: row.state, cityName: row.city, status: 'paused', isActive: true, dummyVisible: false }),
    onSuccess: () => {
      setToast('City paused. Admin operations remain available, but live users will not see that city until Super Admin launches it again.')
      queryClient.invalidateQueries({ queryKey: ['super-admin-governance'] })
      queryClient.invalidateQueries({ queryKey: ['super-admin-city-states'] })
      queryClient.invalidateQueries({ queryKey: ['super-admin-properties'] })
    },
  })

  const summaryCards = [
    { label: 'LIVE properties', value: governance.summary.liveProperties, icon: <FiEye />, filter: { propertyStatus: 'live', demoLive: 'live' }, note: 'Public and real' },
    { label: 'Real properties', value: governance.summary.realProperties, icon: <FiDatabase />, filter: { demoLive: 'live' }, note: 'Not demo inventory' },
    { label: 'Demo properties', value: governance.summary.dummyProperties, icon: <FiDatabase />, filter: { propertyStatus: 'demo', demoLive: 'demo' }, note: 'Pre-launch sample listings' },
    { label: 'Hidden properties', value: governance.summary.hiddenProperties, icon: <FiEyeOff />, filter: { propertyStatus: 'hidden' }, note: 'Not publicly visible' },
    { label: 'Pending properties', value: governance.summary.pendingProperties, icon: <FiActivity />, filter: { propertyStatus: 'pending', approvalStatus: 'Pending' }, note: 'Needs review' },
    { label: 'Dummy ratio', value: `${governance.summary.dummyRatio || 0}%`, icon: <FiActivity />, filter: { demoLive: 'demo' }, note: 'Demo share of supply' },
  ]

  const cityColumns = [
    { key: 'city', label: 'City', value: (row) => row.city, render: (row) => <button type="button" onClick={() => setPropertyFilters((current) => ({ ...current, city: row.city }))} className="font-semibold text-white hover:text-accent-300">{row.city}<span className="mt-1 block text-xs font-normal text-slate-500">{row.state || 'Unmapped state'}</span></button> },
    { key: 'status', label: 'Status', value: (row) => row.status, render: (row) => <StatusChip status={row.status === 'live' ? 'LIVE' : 'DEMO'} title={row.status === 'live' ? 'City is launched. Real listings are prioritized.' : 'City is in demo/pre-launch mode.'} /> },
    { key: 'real', label: 'Real listings', value: (row) => row.real || 0, sortValue: (row) => row.real || 0 },
    { key: 'demo', label: 'Demo listings', value: (row) => row.demo || 0, sortValue: (row) => row.demo || 0 },
    { key: 'admin', label: 'Admin', value: (row) => row.admin || '-' },
    { key: 'launchReadiness', label: 'Launch readiness', value: (row) => `${row.launchReadiness || 0}%`, sortValue: (row) => row.launchReadiness || 0 },
  ]

  const auditColumns = [
    { key: 'action', label: 'Action', value: (row) => row.action, render: (row) => <button type="button" onClick={() => setSelectedAudit(row)} className="font-semibold text-white hover:text-accent-300">{row.action}</button> },
    { key: 'performer', label: 'Performer', value: (row) => row.performerId?.userEmail || row.performerRole || '-' },
    { key: 'entity', label: 'Entity', value: (row) => `${row.entityType || '-'} ${row.entityId || ''}` },
    { key: 'city', label: 'Scope', value: (row) => [row.city, row.state].filter(Boolean).join(', ') || '-' },
    { key: 'addedOn', label: 'Timestamp', value: (row) => row.addedOn ? new Date(row.addedOn).toLocaleString() : '-' },
  ]
  const propertyColumns = [
    { key: 'property', label: 'Property', value: (property) => `${property.name} ${property.city} ${property.area}`, render: (property) => (
      <button type="button" onClick={() => navigate(`/dashboard/admin/properties/${property.id}`)} className="font-semibold text-white hover:text-accent-300">
        {property.name}
        <span className="mt-1 block text-xs font-normal text-slate-500">{property.city || '-'} · {property.area || '-'} · {property.id}</span>
      </button>
    ) },
    { key: 'state', label: 'State', value: (property) => `${getOperationalStatus(property)} ${property.isDummy ? 'Demo' : 'Live'} ${property.publicVisibility ? 'Public' : 'Hidden'}`, render: (property) => (
      <div className="flex flex-wrap gap-2">
        <StatusChip status={getOperationalStatus(property)} />
        <StatusChip status={property.isDummy ? 'DEMO' : 'LIVE'} />
        <StatusChip status={property.publicVisibility ? 'LIVE' : 'HIDDEN'} title={property.publicVisibility ? 'Publicly searchable.' : 'Hidden from public search.'} />
      </div>
    ) },
    { key: 'owner', label: 'Owner', value: (property) => property.owner?.name || property.owner?.email || '-' },
    { key: 'approval', label: 'Approval', value: (property) => property.approvalStatus || 'Pending' },
    { key: 'readiness', label: 'Readiness', value: (property) => `${property.launchReadiness || 0}%`, sortValue: (property) => property.launchReadiness || 0 },
  ]
  const actionDetails = {
    mark_live: { title: 'Mark selected properties as LIVE?', body: ['make listings public', 'remove demo labels', 'include listings in real analytics'] },
    mark_demo: { title: 'Mark selected properties as DEMO?', body: ['label listings as demo', 'separate them from real analytics', 'keep them useful for pre-launch demos'] },
    hide_publicly: { title: 'Hide selected properties publicly?', body: ['remove listings from public search', 'keep records available in operations', 'preserve audit history'] },
    archive: { title: 'Archive selected properties?', body: ['remove listings from active workflows', 'hide them publicly', 'keep the audit trail'] },
    unarchive: { title: 'Unarchive selected properties?', body: ['return records to active workflows', 'make approved listings eligible for public visibility', 'preserve audit history'] },
    verify: { title: 'Verify selected properties?', body: ['mark listings verified', 'approve operational readiness', 'notify property owners'] },
    suspend: { title: 'Suspend selected properties?', body: ['block public visibility', 'mark listings suspended', 'notify property owners'] },
    assign_city: { title: 'Assign selected properties to city?', body: ['move listings into the chosen city scope', 'sync dashboard filters', 'make city-admin ownership clearer'] },
    assign_admin: { title: 'Assign selected properties to admin?', body: ['attach an admin owner for operations', 'keep city moderation accountable', 'record the assignment in audit logs'] },
  }
  const openBulkAction = (action, selectedIds, extra = {}) => {
    const ids = selectedIds
    if (!ids.length) {
      setToast('No properties selected. Select checkboxes first, then choose a bulk action.')
      return
    }
    setBulkRequest({ action, ids, ...(actionDetails[action] || {}), ...extra })
  }
  const confirmBulkAction = () => {
    if (!bulkRequest) return
    bulkMutation.mutate({ ids: bulkRequest.ids, action: bulkRequest.action, city: bulkRequest.city, state: bulkRequest.state, locality: bulkRequest.locality, assignedAdmin: bulkRequest.assignedAdmin })
  }
  const cityStateByName = new Map((cityStateData.items || []).map((item) => [item.cityName?.toLowerCase(), item]))
  const availableAdmins = Array.from(new Map([
    ...(cityStateData.items || []).flatMap((city) => city.assignedAdmins || []),
    ...(adminUsers || []),
  ].map((admin) => [admin._id || admin.id, admin])).values())
  const cityRowByName = new Map((governance.cityRows || []).map((row) => [row.city, row]))
  const scrollToProperties = () => window.setTimeout(() => document.getElementById('super-admin-properties')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  const applySummaryFilter = (filter, label) => {
    setPropertyFilters((current) => ({ ...current, ...filter }))
    setToast(`${label} filter applied. Global listing workflow is showing matching records.`)
    scrollToProperties()
  }
  const runCityTask = async (selected, task) => {
    if (!selected.length) {
      setToast('Select at least one city first, then run the task.')
      return
    }
    try {
      if (task === 'show_demo') {
        await Promise.all(selected.map((city) => dummyTransition.mutateAsync({ ...dummyForm, city, scope: 'properties', isDummy: true, visible: true, status: 'demo' })))
        setToast(`Task updated: demo listings are visible for ${selected.length} selected ${selected.length === 1 ? 'city' : 'cities'}.`)
      }
      if (task === 'hide_demo') {
        await Promise.all(selected.map((city) => dummyTransition.mutateAsync({ ...dummyForm, city, scope: 'properties', isDummy: true, visible: false, status: 'archived' })))
        setToast(`Task updated: demo listings are hidden for ${selected.length} selected ${selected.length === 1 ? 'city' : 'cities'}.`)
      }
      if (task === 'launch') {
        const launchable = selected.map((city) => cityStateByName.get(city?.toLowerCase())).filter((cityState) => cityState?._id)
        if (!launchable.length) {
          setToast('No city-state record found for the selected city. Save the city first, then launch it.')
          return
        }
        await Promise.all(launchable.map((cityState) => launchCity.mutateAsync({ id: cityState._id })))
        setToast(`Task updated: ${launchable.length} selected ${launchable.length === 1 ? 'city' : 'cities'} launched.`)
      }
      if (task === 'pause') {
        const pausable = selected.map((city) => cityRowByName.get(city)).filter((row) => row?.state)
        if (!pausable.length) {
          setToast('No selected city has a mapped state yet. Save the city/state record before pausing it.')
          return
        }
        await Promise.all(pausable.map((row) => pauseCity.mutateAsync(row)))
        setToast(`Task updated: ${pausable.length} selected ${pausable.length === 1 ? 'city' : 'cities'} paused.`)
      }
    } catch (error) {
      setToast(error?.message || 'Task could not be completed. Please retry after refreshing governance data.')
    }
  }

  return (
    <div className="space-y-8">
      {toast ? (
        <div className="fixed right-4 top-4 z-50 max-w-md rounded-2xl border border-emerald-500/40 bg-slate-950 px-4 py-3 text-sm text-emerald-100 shadow-card">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
            <p className="flex-1">{toast}</p>
            <button type="button" onClick={() => setToast('')} className="text-slate-400 hover:text-white">Close</button>
          </div>
        </div>
      ) : null}
      <header className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
        <p className="text-sm uppercase tracking-[0.28em] text-accent-400">Super Admin governance</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Enterprise marketplace control</h1>
        <p className="mt-3 max-w-4xl text-slate-400">Global authority for regional admins, dummy-to-real transition, commission governance, audit trails, safety controls, and production analytics separation.</p>
        <FieldNote>LIVE means publicly searchable. DEMO means sample inventory. City launch hides demo listings and prioritizes real supply.</FieldNote>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
        {summaryCards.map((item) => (
          <button key={item.label} type="button" onClick={() => applySummaryFilter(item.filter, item.label)} className="w-full text-left">
          <Card className="h-full p-5 transition hover:border-accent-500">
            <div className="flex items-center justify-between gap-3">
              <span className="text-accent-400">{item.icon}</span>
              <p className="text-right text-xs uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{isLoading ? '...' : item.value || 0}</p>
            <p className="mt-1 text-xs text-slate-500">{item.note}</p>
          </Card>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Admin account factory</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Create regional admins and owners</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input value={accountForm.name} onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))} placeholder="Name" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none" />
            <input value={accountForm.email} onChange={(event) => setAccountForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none" />
            <input value={accountForm.phone} onChange={(event) => setAccountForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none" />
            <select value={accountForm.role} onChange={(event) => setAccountForm((current) => ({ ...current, role: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none">
              <option value="Admin">Admin</option>
              <option value="Owner">Owner</option>
              <option value="User">User</option>
            </select>
            <input value={accountForm.assignedCity} onChange={(event) => setAccountForm((current) => ({ ...current, assignedCity: event.target.value }))} placeholder="Assigned city" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none" />
            <input value={accountForm.assignedState} onChange={(event) => setAccountForm((current) => ({ ...current, assignedState: event.target.value }))} placeholder="Assigned state" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none" />
            <input value={accountForm.temporaryPassword} onChange={(event) => setAccountForm((current) => ({ ...current, temporaryPassword: event.target.value }))} placeholder="Temporary password" className="sm:col-span-2 rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
            {permissionOptions.map((permission) => <span key={permission} className="rounded-full border border-slate-700 px-3 py-1">{permission}</span>)}
          </div>
          <Button className="mt-5" onClick={() => createAccount.mutate(accountForm)} disabled={!accountForm.email || !accountForm.name}>Create account</Button>
        </Card>

        <Card>
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Dummy-to-real transition</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Locality-wise demo inventory control</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input value={dummyForm.city} onChange={(event) => setDummyForm((current) => ({ ...current, city: event.target.value }))} placeholder="City" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none" />
            <input value={dummyForm.locality} onChange={(event) => setDummyForm((current) => ({ ...current, locality: event.target.value }))} placeholder="Locality" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none" />
            <select value={dummyForm.scope} onChange={(event) => setDummyForm((current) => ({ ...current, scope: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none">
              <option value="properties">Properties</option>
              <option value="users">Users</option>
            </select>
            <select value={dummyForm.status} onChange={(event) => setDummyForm((current) => ({ ...current, status: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none">
              <option value="demo">Demo visible</option>
              <option value="archived">Archived hidden</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <label className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"><input type="checkbox" checked={dummyForm.isDummy} onChange={(event) => setDummyForm((current) => ({ ...current, isDummy: event.target.checked }))} /> Mark dummy</label>
            <label className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"><input type="checkbox" checked={dummyForm.visible} onChange={(event) => setDummyForm((current) => ({ ...current, visible: event.target.checked }))} /> Visible</label>
          </div>
          <Button className="mt-5" onClick={() => dummyTransition.mutate(dummyForm)}>Apply transition</Button>
        </Card>
      </div>

      <AdvancedDataTable
        title="City launch status"
        eyebrow="Real vs demo visibility"
        rows={governance.cityRows || []}
        columns={cityColumns}
        rowId={(row) => row.city}
        minWidth="760px"
        actions={({ selected }) => (
          <div>
            <p className="mb-3 text-sm text-slate-400">Launch City activates public discovery for selected cities. Reject/Pause keeps admin work intact but hides that city from live users.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => runCityTask(selected, 'show_demo')} className="rounded-full border border-amber-500/60 px-4 py-2 text-sm text-amber-200">Show demo in selected</button>
              <button type="button" onClick={() => runCityTask(selected, 'hide_demo')} className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200">Hide demo in selected</button>
              <button type="button" onClick={() => runCityTask(selected, 'launch')} className="rounded-full border border-emerald-500/60 px-4 py-2 text-sm text-emerald-200">Launch City</button>
              <button type="button" onClick={() => runCityTask(selected, 'pause')} className="rounded-full border border-rose-500/60 px-4 py-2 text-sm text-rose-200">Reject/Pause City</button>
            </div>
          </div>
        )}
      />
      <Card id="super-admin-properties" className="p-4 sm:p-6">
        <div className="mb-4">
          <p className="text-sm font-semibold text-white">Global property operations</p>
          <FieldNote>Cards, filters, and bulk actions share the same live/demo state so public visibility is always explicit.</FieldNote>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input value={propertyFilters.city} onChange={(event) => setPropertyFilters((current) => ({ ...current, city: event.target.value }))} placeholder="City" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none" />
          <input value={propertyFilters.locality} onChange={(event) => setPropertyFilters((current) => ({ ...current, locality: event.target.value }))} placeholder="Locality" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none" />
          <select value={propertyFilters.propertyStatus} onChange={(event) => setPropertyFilters((current) => ({ ...current, propertyStatus: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none">
            <option value="">Property status</option>
            <option value="live">LIVE</option>
            <option value="demo">DEMO</option>
            <option value="hidden">HIDDEN</option>
            <option value="pending">PENDING</option>
            <option value="verified">VERIFIED</option>
            <option value="suspended">SUSPENDED</option>
            <option value="archived">ARCHIVED</option>
          </select>
          <select value={propertyFilters.demoLive} onChange={(event) => setPropertyFilters((current) => ({ ...current, demoLive: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none">
            <option value="">Demo/Live</option>
            <option value="live">Live only</option>
            <option value="demo">Demo only</option>
          </select>
          <select value={propertyFilters.verificationStatus} onChange={(event) => setPropertyFilters((current) => ({ ...current, verificationStatus: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none">
            <option value="">Verification status</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
          <select value={propertyFilters.approvalStatus} onChange={(event) => setPropertyFilters((current) => ({ ...current, approvalStatus: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none">
            <option value="">Approval status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Verified">Verified</option>
            <option value="Suspended">Suspended</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select value={propertyFilters.occupancy} onChange={(event) => setPropertyFilters((current) => ({ ...current, occupancy: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none">
            <option value="">Occupancy</option>
            <option value="vacant">Vacant</option>
            <option value="full">Full</option>
          </select>
          <Button variant="secondary" onClick={() => setPropertyFilters({ city: '', locality: '', propertyStatus: '', demoLive: '', verificationStatus: '', approvalStatus: '', occupancy: '' })}>Clear filters</Button>
        </div>
      </Card>
      <AdvancedDataTable
        title="Global listing workflow"
        eyebrow="Bulk state management"
        rows={properties}
        columns={propertyColumns}
        loading={propertiesLoading}
        minWidth="1180px"
        emptyMessage={propertyFilters.propertyStatus === 'live' ? 'No LIVE properties currently launched. You can convert DEMO properties into LIVE listings from bulk actions.' : 'No properties match the current operational filters.'}
        actions={({ selected }) => (
          <div>
            <p className="mb-3 text-sm text-slate-400">{selected.length} listings selected. Checkbox selections open a guided confirmation before anything changes.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => openBulkAction('mark_live', selected)} className="rounded-full border border-emerald-500/60 px-4 py-2 text-sm text-emerald-200">Mark LIVE</button>
              <button type="button" onClick={() => openBulkAction('mark_demo', selected)} className="rounded-full border border-amber-500/60 px-4 py-2 text-sm text-amber-200">Mark DEMO</button>
              <button type="button" onClick={() => openBulkAction('hide_publicly', selected)} className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200">Hide Publicly</button>
              <button type="button" onClick={() => openBulkAction('archive', selected)} className="rounded-full border border-zinc-500/60 px-4 py-2 text-sm text-zinc-200">Archive</button>
              <button type="button" onClick={() => openBulkAction('unarchive', selected)} className="rounded-full border border-emerald-500/60 px-4 py-2 text-sm text-emerald-200">Unarchive</button>
              <button type="button" onClick={() => openBulkAction('verify', selected)} className="rounded-full border border-cyan-500/60 px-4 py-2 text-sm text-cyan-200">Verify</button>
              <button type="button" onClick={() => openBulkAction('suspend', selected)} className="rounded-full border border-rose-500/60 px-4 py-2 text-sm text-rose-200">Suspend</button>
              <button type="button" onClick={() => openBulkAction('assign_city', selected, { city: propertyFilters.city || dummyForm.city, locality: propertyFilters.locality || dummyForm.locality })} className="rounded-full border border-accent-500/60 px-4 py-2 text-sm text-accent-200">Assign City</button>
              <button type="button" onClick={() => openBulkAction('assign_admin', selected, { assignedAdmin: availableAdmins[0]?._id || availableAdmins[0]?.id })} className="rounded-full border border-indigo-500/60 px-4 py-2 text-sm text-indigo-200">Assign Admin</button>
            </div>
          </div>
        )}
      />
      {bulkRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-surface-800 p-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.24em] text-accent-400">Confirm bulk workflow</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{bulkRequest.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{bulkRequest.ids.length} selected listings will be updated globally.</p>
            <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
              <p className="text-sm font-semibold text-white">This will:</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {(bulkRequest.body || []).map((item) => <li key={item}>- {item}</li>)}
              </ul>
              {bulkRequest.action === 'assign_city' ? <p className="mt-3 text-xs text-slate-500">Target city: {bulkRequest.city || 'set a City filter first'} {bulkRequest.locality ? `· ${bulkRequest.locality}` : ''}</p> : null}
              {bulkRequest.action === 'assign_admin' ? (
                <select value={bulkRequest.assignedAdmin || ''} onChange={(event) => setBulkRequest((current) => ({ ...current, assignedAdmin: event.target.value }))} className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                  <option value="">Choose admin</option>
                  {availableAdmins.map((admin) => <option key={admin._id || admin.id} value={admin._id || admin.id}>{[admin.userFname, admin.userLname].filter(Boolean).join(' ') || admin.name || admin.userEmail || admin.email}</option>)}
                </select>
              ) : null}
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => setBulkRequest(null)}>Cancel</Button>
              <Button onClick={confirmBulkAction} disabled={bulkMutation.isPending || (bulkRequest.action === 'assign_city' && !bulkRequest.city) || (bulkRequest.action === 'assign_admin' && !bulkRequest.assignedAdmin)}>Confirm</Button>
            </div>
          </div>
        </div>
      ) : null}
      <AdvancedDataTable title="Operational audit trail" eyebrow="Audit and activity log" rows={governance.auditLogs || []} columns={auditColumns} rowId={(row) => row._id} minWidth="980px" />
      {selectedAudit ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-surface-800 p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-accent-400">Audit detail</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">{selectedAudit.action}</h2>
              </div>
              <button type="button" onClick={() => setSelectedAudit(null)} className="rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-accent-500">Close</button>
            </div>
            <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <p>Performer: {selectedAudit.performerId?.userEmail || selectedAudit.performerRole || '-'}</p>
              <p>Scope: {[selectedAudit.city, selectedAudit.state].filter(Boolean).join(', ') || '-'}</p>
              <p>Entity: {selectedAudit.entityType || '-'} {selectedAudit.entityId || ''}</p>
              <p>Time: {selectedAudit.addedOn ? new Date(selectedAudit.addedOn).toLocaleString() : '-'}</p>
            </div>
            <div className="mt-5 grid gap-4">
              <pre className="max-h-56 overflow-auto rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-300">{JSON.stringify(selectedAudit.previousValue || {}, null, 2)}</pre>
              <pre className="max-h-56 overflow-auto rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-300">{JSON.stringify(selectedAudit.updatedValue || {}, null, 2)}</pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default SuperAdminDashboard
