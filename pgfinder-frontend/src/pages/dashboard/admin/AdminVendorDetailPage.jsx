import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiEdit2, FiEye, FiMessageSquare, FiPower, FiShield, FiTrash2 } from 'react-icons/fi'
import Card from '../../../components/common/Card'
import Button from '../../../components/common/Button'
import adminApi from '../../../api/adminApi'

const userName = (user = {}) => user.name || [user.userFname, user.userLname].filter(Boolean).join(' ') || user.userEmail || user.email || 'Vendor'

function AdminVendorDetailPage() {
  const { vendorId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-vendor-detail', vendorId], queryFn: () => adminApi.vendorDetail(vendorId), refetchInterval: 30_000 })
  const { data: messages = [] } = useQuery({ queryKey: ['admin-vendor-messages', vendorId], queryFn: () => adminApi.vendorMessages(vendorId), refetchInterval: 15_000 })
  const statusMutation = useMutation({
    mutationFn: ({ id, payload }) => adminApi.updatePropertyStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendor-detail', vendorId] })
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] })
    },
  })
  const messageMutation = useMutation({
    mutationFn: () => adminApi.sendVendorMessage(vendorId, { message }),
    onSuccess: () => {
      setMessage('')
      queryClient.invalidateQueries({ queryKey: ['admin-vendor-messages', vendorId] })
    },
  })

  if (isLoading) return <Card className="p-8 text-slate-300">Loading vendor analytics...</Card>
  if (error || !data) return <Card className="p-8 text-rose-300">{error?.message || 'Vendor not found.'}</Card>

  const vendor = data.vendor || {}
  const properties = data.properties || []
  const totalLeads = properties.reduce((sum, item) => sum + (item.leads?.visits?.length || 0) + (item.leads?.inquiries?.length || 0), 0)

  return (
    <div className="space-y-8">
      <button type="button" onClick={() => navigate('/dashboard/admin')} className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><FiArrowLeft /> Admin dashboard</button>
      <header className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-accent-400">Vendor detail</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">{userName(vendor)}</h1>
            <p className="mt-3 text-slate-300">{vendor.userEmail || vendor.email || '-'} · {vendor.contact || vendor.phone || '-'}</p>
          </div>
          <Button variant="secondary"><FiShield /> {vendor.isActive === false ? 'Inactive' : 'Verified vendor'}</Button>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-4">
        {[
          ['Total properties', properties.length],
          ['Total leads', totalLeads],
          ['Active status', vendor.isActive === false ? 'Inactive' : 'Active'],
          ['Joined', vendor.addedOn ? new Date(vendor.addedOn).toLocaleDateString() : '-'],
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Property tree</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-white">
              {userName(vendor)}
              <div className="mt-4 space-y-3 border-l border-slate-700 pl-4">
                {properties.map(({ property, leads }) => (
                  <button key={property._id || property.id} type="button" onClick={() => navigate(`/dashboard/admin/properties/${property._id || property.id}`)} className="block w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-left text-sm text-slate-300 hover:border-accent-500">
                    <span className="font-semibold text-white">{property.propertyName || property.name}</span>
                    <span className="mt-1 block text-xs text-slate-500">{property.cityName || property.city || '-'} · {(leads?.visits?.length || 0) + (leads?.inquiries?.length || 0)} leads · {property.approvalStatus || 'Pending'}</span>
                  </button>
                ))}
                {!properties.length ? <p className="text-sm text-slate-400">No properties connected to this vendor.</p> : null}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <FiMessageSquare className="text-accent-400" />
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Admin-owner messages</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Private communication</h2>
            </div>
          </div>
          <div className="mt-5 max-h-64 space-y-3 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            {messages.map((item) => (
              <div key={item._id} className="rounded-2xl bg-slate-900/80 p-3 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.senderRole || 'admin'} · {item.addedOn ? new Date(item.addedOn).toLocaleString() : ''}</p>
                <p className="mt-2">{item.message}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => adminApi.deleteVendorMessage(vendorId, item._id, { viewer: 'admin', scope: 'self' }).then(() => queryClient.invalidateQueries({ queryKey: ['admin-vendor-messages', vendorId] }))} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-rose-400">Delete for me</button>
                  <button type="button" onClick={() => adminApi.deleteVendorMessage(vendorId, item._id, { viewer: 'admin', scope: 'both' }).then(() => queryClient.invalidateQueries({ queryKey: ['admin-vendor-messages', vendorId] }))} className="rounded-full border border-rose-500/50 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/10">Delete both</button>
                </div>
              </div>
            ))}
            {!messages.length ? <p className="text-sm text-slate-400">No messages yet.</p> : null}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message this PG owner privately" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
            <Button onClick={() => messageMutation.mutate()} disabled={!message.trim()}>Send</Button>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {properties.map(({ property, leads }) => {
          const totalPropertyLeads = (leads?.visits?.length || 0) + (leads?.inquiries?.length || 0)
          const image = property.propertyImageUrls?.[0] || property.propertyImage || property.image
          return (
            <Card key={property._id || property.id} className="overflow-hidden p-0">
              {image ? <img src={image} alt={property.propertyName || property.name} className="h-44 w-full object-cover" /> : <div className="h-44 bg-slate-950" />}
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-accent-400">{property.cityName || property.city || '-'} · {property.areaName || '-'}</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{property.propertyName || property.name}</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
                  <p>Occupancy: {property.occupancy || 0}%</p>
                  <p>Rating: {property.rating || 0}</p>
                  <p>Leads: {totalPropertyLeads}</p>
                  <p>Visits: {leads?.visits?.length || 0}</p>
                  <p>Vacancy: {property.vacancyStatus || (property.isAvailable === false ? 'Full' : 'Available')}</p>
                  <p>Status: {property.isActive === false ? 'Inactive' : 'Active'}</p>
                </div>
                <p className="mt-3 rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-300">{property.approvalStatus || 'Pending'}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" onClick={() => navigate(`/dashboard/admin/properties/${property._id || property.id}`)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-200"><FiEye /> View</button>
                  <button type="button" onClick={() => navigate(`/dashboard/admin/properties/${property._id || property.id}/edit`)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-200"><FiEdit2 /> Edit</button>
                  <button type="button" onClick={() => statusMutation.mutate({ id: property._id || property.id, payload: { approvalStatus: 'Approved' } })} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 px-3 py-2 text-xs text-emerald-200"><FiShield /> Verify</button>
                  <button type="button" onClick={() => statusMutation.mutate({ id: property._id || property.id, payload: { isActive: !property.isActive } })} className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${property.isActive === false ? 'border-emerald-500/60 text-emerald-200 hover:bg-emerald-500/10' : 'border-rose-500/60 text-rose-200 hover:bg-rose-500/10'}`}><FiPower /> {property.isActive === false ? 'Activate' : 'Deactivate'}</button>
                  <button type="button" onClick={() => statusMutation.mutate({ id: property._id || property.id, payload: { isActive: false, approvalStatus: 'Rejected' } })} className="inline-flex items-center gap-2 rounded-full border border-rose-500/60 px-3 py-2 text-xs text-rose-200"><FiTrash2 /> Remove</button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default AdminVendorDetailPage
