import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import adminApi from '../../../api/adminApi'
import Button from '../../../components/common/Button'
import AdSlot from '../../../components/ads/AdSlot'

const emptyForm = {
  agencyName: '',
  title: '',
  description: '',
  imageUrl: '',
  targetUrl: '',
  placement: 'both',
  startAt: '',
  endAt: '',
  priority: 0,
  price: 0,
  billingStatus: 'unbilled',
  notes: '',
  isActive: true,
}

const placements = [
  ['both', 'All compatible sidebars'],
  ['home', 'Home page sponsored section'],
  ['browse-sidebar', 'Browse Stays right sidebar'],
  ['listing-sidebar', 'Listing sidebar alias'],
  ['locality-sidebar', 'Bangalore locality right sidebar'],
  ['property-sidebar', 'Property detail right sidebar'],
]

const exportCsv = (ads) => {
  const headers = ['id', 'agency', 'title', 'placement', 'active', 'startAt', 'endAt', 'priority', 'price', 'billingStatus', 'impressions', 'clicks', 'ctr', 'targetUrl', 'imageUrl', 'notes']
  const rows = ads.map((ad) => {
    const impressions = Number(ad.impressions || 0)
    const clicks = Number(ad.clicks || 0)
    return [
      ad._id || ad.id || '',
      ad.agencyName || '',
      ad.title || '',
      ad.placement || '',
      ad.isActive ? 'Active' : 'Archived',
      ad.startAt || '',
      ad.endAt || '',
      ad.priority || 0,
      ad.price || 0,
      ad.billingStatus || '',
      impressions,
      clicks,
      impressions ? `${((clicks / impressions) * 100).toFixed(1)}%` : '0%',
      ad.targetUrl || '',
      ad.imageUrl || '',
      ad.notes || '',
    ]
  })
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `stayji-ads-${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function AdminAdsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [previewPlacement, setPreviewPlacement] = useState('browse-sidebar')
  const [message, setMessage] = useState('')
  const { data: ads = [], isLoading } = useQuery({ queryKey: ['admin-ads'], queryFn: adminApi.ads, refetchInterval: 30_000 })

  const save = useMutation({
    mutationFn: (payload) => editingId ? adminApi.updateAd(editingId, payload) : adminApi.createAd(payload),
    onSuccess: () => {
      setForm(emptyForm)
      setEditingId(null)
      setMessage(editingId ? 'Advertisement updated.' : 'Advertisement created.')
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] })
      queryClient.invalidateQueries({ queryKey: ['public-ads'] })
    },
    onError: (error) => setMessage(error.message || 'Unable to save advertisement.'),
  })

  const archive = useMutation({
    mutationFn: ({ id, isActive }) => adminApi.updateAd(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] })
      queryClient.invalidateQueries({ queryKey: ['public-ads'] })
    },
  })

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const filteredAds = useMemo(() => ads.filter((ad) => {
    const text = `${ad.agencyName} ${ad.title} ${ad.placement} ${ad.billingStatus}`.toLowerCase()
    return text.includes(search.toLowerCase()) && (statusFilter === 'all' || (statusFilter === 'active' ? ad.isActive : !ad.isActive))
  }), [ads, search, statusFilter])

  const totals = useMemo(() => ({
    active: ads.filter((ad) => ad.isActive).length,
    impressions: ads.reduce((sum, ad) => sum + Number(ad.impressions || 0), 0),
    clicks: ads.reduce((sum, ad) => sum + Number(ad.clicks || 0), 0),
    revenue: ads.reduce((sum, ad) => sum + Number(ad.price || 0), 0),
  }), [ads])

  const submit = (event) => {
    event.preventDefault()
    if (!form.agencyName.trim() || !form.title.trim()) return setMessage('Agency name and title are required.')
    save.mutate({
      ...form,
      startAt: form.startAt || undefined,
      endAt: form.endAt || null,
      priority: Number(form.priority) || 0,
      price: Number(form.price) || 0,
      isActive: Boolean(form.isActive),
    })
  }

  const editAd = (ad) => {
    setEditingId(ad._id)
    setForm({ ...emptyForm, ...ad, startAt: ad.startAt ? new Date(ad.startAt).toISOString().slice(0, 16) : '', endAt: ad.endAt ? new Date(ad.endAt).toISOString().slice(0, 16) : '' })
    setMessage('Editing advertisement.')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Admin marketplace</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Manage advertisements</h1>
        <p className="mt-2 text-slate-400">Create sponsored campaigns, control placements, preview public slots, and track delivery metrics.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['Active campaigns', totals.active],
          ['Impressions', totals.impressions.toLocaleString('en-IN')],
          ['Clicks', totals.clicks.toLocaleString('en-IN')],
          ['Campaign value', `₹${totals.revenue.toLocaleString('en-IN')}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </section>

      <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5 md:grid-cols-2">
        {[
          ['agencyName', 'Agency / company name'],
          ['title', 'Ad title'],
          ['imageUrl', 'Image URL'],
          ['targetUrl', 'Destination URL'],
        ].map(([key, label]) => (
          <label key={key} className="text-sm text-slate-300">
            {label}
            <input value={form[key]} onChange={(event) => update(key, event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" />
          </label>
        ))}
        <label className="text-sm text-slate-300 md:col-span-2">
          Description
          <textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows="3" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" />
        </label>
        <label className="text-sm text-slate-300">
          Placement
          <select value={form.placement} onChange={(event) => update('placement', event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white">
            {placements.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm text-slate-300">Priority<input type="number" value={form.priority} onChange={(event) => update('priority', event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
        <label className="text-sm text-slate-300">Campaign price (INR)<input type="number" min="0" value={form.price} onChange={(event) => update('price', event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
        <label className="text-sm text-slate-300">
          Billing status
          <select value={form.billingStatus} onChange={(event) => update('billingStatus', event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white">
            <option value="unbilled">Unbilled</option>
            <option value="invoiced">Invoiced</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </label>
        <label className="text-sm text-slate-300">Starts<input type="datetime-local" value={form.startAt} onChange={(event) => update('startAt', event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
        <label className="text-sm text-slate-300">Ends<input type="datetime-local" value={form.endAt} onChange={(event) => update('endAt', event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
        <label className="text-sm text-slate-300 md:col-span-2">Internal notes<textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} rows="2" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
        <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
          <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} /> Active campaign</label>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => { setForm(emptyForm); setEditingId(null); setMessage('') }}>Clear</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving...' : editingId ? 'Update advertisement' : 'Create advertisement'}</Button>
          </div>
        </div>
        {message ? <p className="text-sm text-cyan-300 md:col-span-2">{message}</p> : null}
      </form>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
          <div className="border-b border-white/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">All campaigns</h2>
                <p className="mt-1 text-sm text-slate-400">Higher priority campaigns are displayed first.</p>
              </div>
              <Button type="button" variant="secondary" onClick={() => exportCsv(filteredAds)}>Download CSV</Button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_12rem]">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search agency, title, placement" className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white">
                <option value="all">All statuses</option>
                <option value="active">Active only</option>
                <option value="archived">Archived only</option>
              </select>
            </div>
          </div>
          {isLoading ? <p className="p-5 text-slate-400">Loading campaigns...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] text-left text-sm">
                <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-500">
                  <tr><th className="px-5 py-4">Agency / ad</th><th className="px-5 py-4">Creative</th><th className="px-5 py-4">Placement</th><th className="px-5 py-4">Schedule</th><th className="px-5 py-4">Priority</th><th className="px-5 py-4">Price</th><th className="px-5 py-4">Impressions</th><th className="px-5 py-4">Clicks / CTR</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredAds.map((ad) => {
                    const impressions = Number(ad.impressions || 0)
                    const clicks = Number(ad.clicks || 0)
                    return (
                      <tr key={ad._id} className="text-slate-300">
                        <td className="px-5 py-4"><p className="font-semibold text-white">{ad.title}</p><p className="text-xs text-slate-500">{ad.agencyName}</p></td>
                        <td className="px-5 py-4">{ad.imageUrl ? <img src={ad.imageUrl} alt={ad.title} className="h-14 w-24 rounded-lg border border-white/10 object-contain" loading="lazy" /> : <span className="text-slate-500">No image</span>}</td>
                        <td className="px-5 py-4">{ad.placement}</td>
                        <td className="px-5 py-4 text-xs">{ad.startAt ? new Date(ad.startAt).toLocaleDateString('en-IN') : 'Now'} - {ad.endAt ? new Date(ad.endAt).toLocaleDateString('en-IN') : 'No end'}</td>
                        <td className="px-5 py-4 font-semibold text-cyan-300">{ad.priority}</td>
                        <td className="px-5 py-4">₹{Number(ad.price || 0).toLocaleString('en-IN')}<p className="text-xs text-slate-500">{ad.billingStatus}</p></td>
                        <td className="px-5 py-4">{impressions.toLocaleString('en-IN')}</td>
                        <td className="px-5 py-4">{clicks.toLocaleString('en-IN')}<p className="text-xs text-slate-500">{impressions ? `${((clicks / impressions) * 100).toFixed(1)}% CTR` : '0% CTR'}</p></td>
                        <td className="px-5 py-4"><span className={ad.isActive ? 'text-emerald-300' : 'text-slate-500'}>{ad.isActive ? 'Active' : 'Archived'}</span></td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" onClick={() => editAd(ad)}>Edit</Button>
                            {ad.targetUrl ? <Button variant="secondary" onClick={() => window.open(ad.targetUrl, '_blank', 'noopener,noreferrer')}>Open</Button> : null}
                            <Button variant="secondary" onClick={() => archive.mutate({ id: ad._id, isActive: !ad.isActive })}>{ad.isActive ? 'Archive' : 'Reactivate'}</Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {!filteredAds.length ? <p className="p-5 text-slate-400">No campaigns match the current filters.</p> : null}
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Public preview</h2>
          <select value={previewPlacement} onChange={(event) => setPreviewPlacement(event.target.value)} className="mt-4 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white">
            {placements.filter(([value]) => value !== 'both').map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <div className="mt-5">
            <AdSlot placement={previewPlacement} />
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">Preview uses the same public ad API as the website. Impression counters may increase while previewing active campaigns.</p>
        </aside>
      </section>
    </main>
  )
}

export default AdminAdsPage
