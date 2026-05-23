import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiBarChart2, FiEye, FiMessageSquare, FiPlusCircle, FiSliders, FiTrash2, FiTrendingUp, FiUsers } from 'react-icons/fi'
import Button from '../../../components/common/Button'
import Card from '../../../components/common/Card'
import { useAuth } from '../../../context/AuthContext'
import dashboardService from '../../../services/dashboardService'
import adminApi from '../../../api/adminApi'

function OwnerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [overview, setOverview] = useState({ totalProperties: 0, inquiries: 0, bookings: 0, views: 0, leads: 0 })
  const [moveIns, setMoveIns] = useState([])
  const [loading, setLoading] = useState(false)
  const [reply, setReply] = useState('')
  const ownerId = user?._id || user?.id
  const { data: messages = [] } = useQuery({
    queryKey: ['owner-admin-messages', ownerId],
    queryFn: () => adminApi.ownerMessages(ownerId, { viewer: 'owner' }),
    enabled: Boolean(ownerId),
    refetchInterval: 15_000,
  })
  const replyMutation = useMutation({
    mutationFn: () => adminApi.sendOwnerMessage(ownerId, { message: reply, senderRole: 'owner' }),
    onSuccess: () => {
      setReply('')
      queryClient.invalidateQueries({ queryKey: ['owner-admin-messages', ownerId] })
    },
  })
  const deleteMessageMutation = useMutation({
    mutationFn: ({ messageId, scope }) => adminApi.deleteOwnerMessage(ownerId, messageId, { viewer: 'owner', scope }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-admin-messages', ownerId] }),
  })
  const ownerConfirmMutation = useMutation({
    mutationFn: (moveInId) => adminApi.ownerConfirmMoveIn(moveInId, { ownerId }),
    onSuccess: (updated) => {
      setMoveIns((current) => current.map((item) => (item._id === updated?._id ? updated : item)))
    },
  })

  useEffect(() => {
    if (!user?._id) return
    const load = async () => {
      try {
        setLoading(true)
        const data = await dashboardService.getOwnerOverview(user?._id)
        setOverview(data)
        const moveInRows = await dashboardService.moveIns({ vendorId: user?._id, limit: 20 })
        setMoveIns(moveInRows)
      } catch {
        setOverview({ totalProperties: 0, inquiries: 0, bookings: 0, views: 0 })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?._id])

  return (
    <div className="space-y-8">
      <header className="rounded-[1.5rem] border border-slate-800/80 bg-surface-800/90 p-5 shadow-card sm:rounded-[2rem] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-accent-400">Owner dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Manage your stay listings and inquiries</h1>
          </div>
          <Button onClick={() => navigate('/dashboard/owner/add-property')}>New property</Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-4">
        {loading ? (
          <Card className="p-8">Loading stats…</Card>
        ) : (
          [
            { label: 'Properties', value: overview.totalProperties, icon: <FiSliders />, onClick: () => navigate('/dashboard/owner/properties') },
            { label: 'Leads', value: overview.leads ?? overview.inquiries + overview.bookings, icon: <FiUsers />, onClick: () => navigate('/dashboard/owner/leads') },
            { label: 'Inquiries', value: overview.inquiries, icon: <FiUsers />, onClick: () => document.getElementById('owner-requests')?.scrollIntoView({ behavior: 'smooth' }) },
            { label: 'Bookings', value: overview.bookings, icon: <FiPlusCircle />, onClick: () => document.getElementById('owner-requests')?.scrollIntoView({ behavior: 'smooth' }) },
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

      <div className="grid gap-6 xl:grid-cols-3">
        {[
          { label: 'Conversion rate', value: `${overview?.conversionRate ?? Math.min(42, (overview?.leads || 0) * 3)}%`, icon: <FiTrendingUp /> },
          { label: 'Commission due', value: `₹${moveIns.filter((item) => item.status === 'Verified').reduce((sum, item) => sum + (Number(item.commissionAmount) || 0), 0).toLocaleString('en-IN')}`, icon: <FiBarChart2 /> },
          { label: 'Vacancy health', value: overview?.vacancyStatus || 'Live updates ready', icon: <FiEye /> },
        ].map((item) => (
          <Card key={item.label} className="p-6">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-950 text-accent-400">{item.icon}</span>
            <p className="mt-5 text-sm uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card id="owner-requests">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Active listings</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Live property performance</h2>
            </div>
            <Button variant="secondary" onClick={() => navigate('/dashboard/owner/properties')}>View listings</Button>
          </div>
          <p className="mt-6 text-slate-300">Quickly edit rent, update availability, and review active leads in one interface.</p>
        </Card>

        <Card>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Guest feedback</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Recent visitor requests</h2>
          </div>
          <div className="mt-6 space-y-4 text-slate-300">
            <p>Users are asking for quick tour slots and immediate move-in options.</p>
            <p>Your dashboard makes it easy to approve visits and update status.</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Move-in conversions</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Commission and verification queue</h2>
        </div>
        <div className="grid gap-3">
          {moveIns.slice(0, 5).map((item) => (
            <div key={item._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">{item.propertyId?.propertyName || 'StayJi property'} · {item.status}</p>
              <p className="mt-1">Commission ₹{item.commissionAmount || 0} · Cashback ₹{item.cashbackAmount || 0}</p>
              <p className="mt-1 text-slate-500">Joining: {item.joiningDate || '-'} · Owner confirmation: {item.ownerConfirmed ? 'Done' : 'Pending'}</p>
              {!item.ownerConfirmed ? (
                <button type="button" onClick={() => ownerConfirmMutation.mutate(item._id)} className="mt-3 rounded-full border border-emerald-500/60 px-3 py-2 text-xs text-emerald-200">
                  Tenant joined successfully
                </button>
              ) : null}
            </div>
          ))}
          {!moveIns.length ? <p className="text-sm text-slate-400">Verified move-ins will appear here after users submit proof.</p> : null}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <FiMessageSquare className="text-accent-400" />
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent-400">StayJi admin messages</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Private support thread</h2>
          </div>
        </div>
        <div className="mt-5 max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          {messages.map((item) => (
            <div key={item._id} className={`rounded-2xl p-3 text-sm ${item.senderRole === 'owner' ? 'bg-accent-500/10 text-accent-100' : 'bg-slate-900/80 text-slate-300'}`}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.senderRole === 'owner' ? 'You' : 'StayJi admin'} · {item.addedOn ? new Date(item.addedOn).toLocaleString() : ''}</p>
              <p className="mt-2">{item.message}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => deleteMessageMutation.mutate({ messageId: item._id, scope: 'self' })} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-rose-400"><FiTrash2 className="inline" /> Delete for me</button>
              </div>
            </div>
          ))}
          {!messages.length ? <p className="text-sm text-slate-400">No admin messages yet.</p> : null}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to StayJi admin" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
          <Button onClick={() => replyMutation.mutate()} disabled={!ownerId || !reply.trim()}>Send</Button>
        </div>
      </Card>
    </div>
  )
}

export default OwnerDashboard
