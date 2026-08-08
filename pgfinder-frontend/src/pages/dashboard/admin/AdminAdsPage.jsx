import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import adminApi from '../../../api/adminApi'
import Button from '../../../components/common/Button'

const emptyForm = { agencyName: '', title: '', description: '', imageUrl: '', targetUrl: '', placement: 'both', startAt: '', endAt: '', priority: 0, price: 0, billingStatus: 'unbilled', notes: '', isActive: true }

function AdminAdsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [message, setMessage] = useState('')
  const { data: ads = [], isLoading } = useQuery({ queryKey: ['admin-ads'], queryFn: adminApi.ads })
  const save = useMutation({
    mutationFn: (payload) => editingId ? adminApi.updateAd(editingId, payload) : adminApi.createAd(payload),
    onSuccess: () => { setForm(emptyForm); setEditingId(null); setMessage(editingId ? 'Advertisement updated.' : 'Advertisement created.'); queryClient.invalidateQueries({ queryKey: ['admin-ads'] }) },
    onError: (error) => setMessage(error.message || 'Unable to create advertisement.'),
  })
  const archive = useMutation({
    mutationFn: adminApi.archiveAd,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-ads'] }),
  })
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const filteredAds = useMemo(() => ads.filter((ad) => {
    const text = `${ad.agencyName} ${ad.title} ${ad.placement}`.toLowerCase()
    return text.includes(search.toLowerCase()) && (statusFilter === 'all' || (statusFilter === 'active' ? ad.isActive : !ad.isActive))
  }), [ads, search, statusFilter])
  const submit = (event) => {
    event.preventDefault()
    if (!form.agencyName.trim() || !form.title.trim()) return setMessage('Agency name and title are required.')
    save.mutate({ ...form, startAt: form.startAt || undefined, endAt: form.endAt || undefined, priority: Number(form.priority) || 0, price: Number(form.price) || 0 })
  }
  const editAd = (ad) => {
    setEditingId(ad._id)
    setForm({ ...emptyForm, ...ad, startAt: ad.startAt ? new Date(ad.startAt).toISOString().slice(0, 16) : '', endAt: ad.endAt ? new Date(ad.endAt).toISOString().slice(0, 16) : '' })
    setMessage('Editing advertisement.')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="space-y-6">
      <div><p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Admin marketplace</p><h1 className="mt-2 text-3xl font-semibold text-white">Agency advertisements</h1><p className="mt-2 text-slate-400">Create campaigns for the property and listing sidebars. Only active, date-valid campaigns are shown publicly.</p></div>
      <form onSubmit={submit} className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/70 p-5 md:grid-cols-2">
        {[
          ['agencyName', 'Agency / company name'], ['title', 'Ad title'], ['imageUrl', 'Image URL'], ['targetUrl', 'Destination URL'],
        ].map(([key, label]) => <label key={key} className="text-sm text-slate-300">{label}<input value={form[key]} onChange={(event) => update(key, event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>)}
        <label className="text-sm text-slate-300 md:col-span-2">Description<textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows="3" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
        <label className="text-sm text-slate-300">Placement<select value={form.placement} onChange={(event) => update('placement', event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"><option value="home">Home page sponsored section</option><option value="browse-sidebar">Browse Stays right sidebar</option><option value="locality-sidebar">Bangalore PG/locality right sidebar</option><option value="property-sidebar">Property detail right sidebar</option><option value="both">All compatible sidebars</option></select></label>
        <label className="text-sm text-slate-300">Priority<input type="number" value={form.priority} onChange={(event) => update('priority', event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
        <label className="text-sm text-slate-300">Campaign price (₹)<input type="number" min="0" value={form.price} onChange={(event) => update('price', event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
        <label className="text-sm text-slate-300">Billing status<select value={form.billingStatus} onChange={(event) => update('billingStatus', event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"><option value="unbilled">Unbilled</option><option value="invoiced">Invoiced</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></label>
        <label className="text-sm text-slate-300">Starts<input type="datetime-local" value={form.startAt} onChange={(event) => update('startAt', event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
        <label className="text-sm text-slate-300">Ends<input type="datetime-local" value={form.endAt} onChange={(event) => update('endAt', event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
        <label className="text-sm text-slate-300 md:col-span-2">Internal notes<textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} rows="2" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
        <div className="flex items-center justify-between md:col-span-2"><label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} /> Active campaign</label><div className="flex gap-2"><Button type="button" variant="secondary" onClick={() => { setForm(emptyForm); setEditingId(null); setMessage('') }}>Clear</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : editingId ? 'Update advertisement' : 'Create advertisement'}</Button></div></div>
        {message ? <p className="text-sm text-cyan-300 md:col-span-2">{message}</p> : null}
      </form>
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60"><div className="border-b border-white/10 p-5"><h2 className="text-xl font-semibold text-white">All campaigns</h2><p className="mt-1 text-sm text-slate-400">Higher priority campaigns are displayed first. Delivery metrics are updated from public ad views and clicks.</p><div className="mt-4 grid gap-3 md:grid-cols-[1fr_12rem]"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search agency, title, placement" className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"><option value="all">All statuses</option><option value="active">Active only</option><option value="archived">Archived only</option></select></div></div>{isLoading ? <p className="p-5 text-slate-400">Loading campaigns…</p> : <div className="overflow-x-auto"><table className="w-full min-w-[1250px] text-left text-sm"><thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Agency / ad</th><th className="px-5 py-4">Placement</th><th className="px-5 py-4">Schedule</th><th className="px-5 py-4">Priority</th><th className="px-5 py-4">Price</th><th className="px-5 py-4">Impressions</th><th className="px-5 py-4">Clicks / CTR</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Actions</th></tr></thead><tbody className="divide-y divide-white/10">{filteredAds.map((ad) => <tr key={ad._id} className="text-slate-300"><td className="px-5 py-4"><p className="font-semibold text-white">{ad.title}</p><p className="text-xs text-slate-500">{ad.agencyName}</p></td><td className="px-5 py-4">{ad.placement}</td><td className="px-5 py-4 text-xs">{ad.startAt ? new Date(ad.startAt).toLocaleDateString('en-IN') : 'Now'} – {ad.endAt ? new Date(ad.endAt).toLocaleDateString('en-IN') : 'No end'}</td><td className="px-5 py-4 font-semibold text-cyan-300">{ad.priority}</td><td className="px-5 py-4">₹{Number(ad.price || 0).toLocaleString('en-IN')}<p className="text-xs text-slate-500">{ad.billingStatus}</p></td><td className="px-5 py-4">{Number(ad.impressions || 0).toLocaleString('en-IN')}</td><td className="px-5 py-4">{Number(ad.clicks || 0).toLocaleString('en-IN')}<p className="text-xs text-slate-500">{ad.impressions ? `${((Number(ad.clicks || 0) / Number(ad.impressions)) * 100).toFixed(1)}% CTR` : '0% CTR'}</p></td><td className="px-5 py-4"><span className={ad.isActive ? 'text-emerald-300' : 'text-slate-500'}>{ad.isActive ? 'Active' : 'Archived'}</span></td><td className="px-5 py-4"><div className="flex gap-2"><Button variant="secondary" onClick={() => editAd(ad)}>Edit</Button><Button variant="secondary" onClick={() => archive.mutate(ad._id)} disabled={!ad.isActive}>{ad.isActive ? 'Archive' : 'Archived'}</Button></div></td></tr>)}</tbody></table>{!filteredAds.length ? <p className="p-5 text-slate-400">No campaigns match the current filters.</p> : null}</div>}</section>
    </main>
  )
}

export default AdminAdsPage
