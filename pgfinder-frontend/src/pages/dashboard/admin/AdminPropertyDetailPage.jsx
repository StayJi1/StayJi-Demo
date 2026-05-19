import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FiArrowLeft, FiCheck, FiEdit2, FiMapPin, FiMessageSquare, FiPower, FiTrash2, FiX } from 'react-icons/fi'
import Card from '../../../components/common/Card'
import Button from '../../../components/common/Button'
import adminApi from '../../../api/adminApi'

function AdminPropertyDetailPage() {
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [ownerMessage, setOwnerMessage] = useState('')
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-property-detail', propertyId], queryFn: () => adminApi.propertyDetail(propertyId), refetchInterval: 30_000 })
  const property = data?.property || {}
  const owner = property.vendor || property.owner || {}
  const ownerId = property.vendorId || owner.id || owner._id
  const statusMutation = useMutation({
    mutationFn: (payload) => adminApi.updatePropertyStatus(propertyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-property-detail', propertyId] })
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] })
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] })
    },
  })
  const { data: messages = [] } = useQuery({
    queryKey: ['admin-property-vendor-messages', ownerId, propertyId],
    queryFn: () => adminApi.vendorMessages(ownerId, { viewer: 'admin' }),
    enabled: Boolean(ownerId),
    refetchInterval: 15_000,
  })
  const messageMutation = useMutation({
    mutationFn: () => adminApi.sendVendorMessage(ownerId, { message: ownerMessage, propertyId }),
    onSuccess: () => {
      setOwnerMessage('')
      queryClient.invalidateQueries({ queryKey: ['admin-property-vendor-messages', ownerId, propertyId] })
      queryClient.invalidateQueries({ queryKey: ['admin-vendor-messages', ownerId] })
    },
  })
  const deleteMessageMutation = useMutation({
    mutationFn: ({ messageId, scope }) => adminApi.deleteVendorMessage(ownerId, messageId, { viewer: 'admin', scope }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-property-vendor-messages', ownerId, propertyId] })
      queryClient.invalidateQueries({ queryKey: ['admin-vendor-messages', ownerId] })
    },
  })

  if (isLoading) return <Card className="p-8 text-slate-300">Loading property detail...</Card>
  if (error || !data) return <Card className="p-8 text-rose-300">{error?.message || 'Property not found.'}</Card>

  const leads = data.leads || { visits: [], inquiries: [] }
  const images = [
    ...(property.propertyImageUrls || []),
    property.propertyImage,
    property.image,
    ...(data.images || []).map((item) => item.image),
  ].filter(Boolean)
  const chartData = [
    { name: 'Visits', value: leads.visits?.length || 0 },
    { name: 'Callbacks', value: leads.inquiries?.length || 0 },
    { name: 'Wishlist', value: data.shortlists?.length || property.wishlistCount || 0 },
    { name: 'Reviews', value: data.reviews?.length || 0 },
    { name: 'Complaints', value: data.complaints?.length || 0 },
  ]
  const propertyMessages = messages.filter((item) => !item.propertyId || `${item.propertyId?._id || item.propertyId}` === propertyId)

  return (
    <div className="space-y-8">
      <button type="button" onClick={() => navigate('/dashboard/admin')} className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><FiArrowLeft /> Admin dashboard</button>
      <header className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-accent-400">Property detail</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">{property.name || property.propertyName}</h1>
            <p className="mt-3 text-slate-300">{property.city || property.cityName || '-'} · {property.area || property.areaName || '-'} · {property.id}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => statusMutation.mutate({ approvalStatus: 'Approved' })}><FiCheck /> Verify</Button>
            <Button variant="secondary" onClick={() => statusMutation.mutate({ approvalStatus: 'Rejected' })}><FiX /> Reject</Button>
            <Button variant="secondary" onClick={() => statusMutation.mutate({ isActive: !property.isActive })}><FiPower /> {property.isActive ? 'Deactivate' : 'Activate'}</Button>
            <Button variant="secondary" onClick={() => navigate(`/dashboard/admin/properties/${property.id}/edit`)}><FiEdit2 /> Edit</Button>
          </div>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        {images.slice(0, 6).map((image) => <img key={image} src={image} alt={property.name} className="h-52 w-full rounded-2xl object-cover" />)}
        {!images.length ? <Card className="p-8 text-slate-400">No media uploaded.</Card> : null}
      </div>
      {property.videoUrl ? <video src={property.videoUrl} controls className="max-h-[420px] w-full rounded-2xl bg-slate-950" /> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
        <Card>
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Listing intelligence</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <p className="text-slate-300">Owner: <button type="button" onClick={() => navigate(`/dashboard/admin/vendors/${property.vendorId}`)} className="text-accent-200">{owner.name || owner.email || '-'}</button></p>
            <p className="text-slate-300">Phone: {owner.phone || owner.contact || '-'}</p>
            <p className="text-slate-300">Approval: {property.approvalStatus || 'Pending'}</p>
            <p className="text-slate-300">Active: {property.isActive ? 'Yes' : 'No'}</p>
            <p className="text-slate-300">Occupancy: {property.occupancy || 0}%</p>
            <p className="text-slate-300">Vacancy: {property.vacancyStatus || '-'}</p>
            <p className="text-slate-300">Pricing: ₹{property.rent || 0}/month</p>
            <p className="text-slate-300">Deposit: ₹{property.depositAmount || 0}</p>
            <p className="text-slate-300">Room types: {property.sharingAvailability || property.sharing || '-'}</p>
            <p className="text-slate-300">Rating: {property.rating || 0}</p>
          </div>
          {property.roomInventory?.length ? (
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sharing inventory</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {property.roomInventory.map((row) => (
                  <div key={row.sharingType} className="rounded-2xl bg-slate-900/80 p-3 text-sm text-slate-300">
                    <p className="font-semibold text-white">{row.sharingType}</p>
                    <p className="mt-1">{row.vacantRooms || 0}/{row.totalRooms || 0} rooms vacant</p>
                    <p>{row.vacantBeds || 0} beds vacant</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <p className="mt-5 text-slate-300">{property.description || 'No description available.'}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {(property.amenities || property.aminityFeatures?.split(',') || []).filter(Boolean).map((amenity) => <span key={amenity} className="rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-300">{amenity}</span>)}
          </div>
        </Card>

        <Card>
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Lead mix</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }} />
                <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <FiMessageSquare className="text-accent-400" />
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Owner communication</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Private property message</h2>
          </div>
        </div>
        <div className="mt-5 max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          {propertyMessages.map((item) => (
            <div key={item._id} className="rounded-2xl bg-slate-900/80 p-3 text-sm text-slate-300">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.senderRole || 'admin'} · {item.addedOn ? new Date(item.addedOn).toLocaleString() : ''}</p>
              <p className="mt-2">{item.message}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => deleteMessageMutation.mutate({ messageId: item._id, scope: 'self' })} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-rose-400"><FiTrash2 className="inline" /> Delete for me</button>
                <button type="button" onClick={() => deleteMessageMutation.mutate({ messageId: item._id, scope: 'both' })} className="rounded-full border border-rose-500/50 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/10">Delete both</button>
              </div>
            </div>
          ))}
          {!propertyMessages.length ? <p className="text-sm text-slate-400">No property messages yet.</p> : null}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input value={ownerMessage} onChange={(event) => setOwnerMessage(event.target.value)} placeholder="Message this PG owner about this property" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
          <Button onClick={() => messageMutation.mutate()} disabled={!ownerId || !ownerMessage.trim()}>Send</Button>
        </div>
      </Card>

      <Card>
        <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Location</p>
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-slate-300">
          <p className="flex items-center gap-2"><FiMapPin /> {property.address || property.locationLabel || '-'}</p>
          <p className="mt-2 text-sm text-slate-500">Latitude {property.latitude ?? property.location?.lat ?? '-'} · Longitude {property.longitude ?? property.location?.lng ?? '-'}</p>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Visit requests</p>
          <div className="mt-5 space-y-3">
            {(leads.visits || []).map((visit) => <p key={visit._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-slate-300">{visit.userIDFK?.userFname || 'User'} · {visit.visitDate || '-'} · {visit.isConverted ? 'Converted' : 'Open'}</p>)}
            {!leads.visits?.length ? <p className="text-slate-400">No visit requests yet.</p> : null}
          </div>
        </Card>
        <Card>
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Reviews and complaints</p>
          <div className="mt-5 space-y-3">
            {[...(data.reviews || []), ...(data.complaints || [])].slice(0, 8).map((item) => <p key={item._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-slate-300">{item.details || item.sharing || 'Request'} · {item.rating ? `${item.rating} stars` : 'Complaint'}</p>)}
            {!data.reviews?.length && !data.complaints?.length ? <p className="text-slate-400">No reviews or complaints recorded.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AdminPropertyDetailPage
