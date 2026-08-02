import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiBookmark, FiCalendar, FiClock, FiColumns, FiSearch } from 'react-icons/fi'
import Button from '../../../components/common/Button'
import Card from '../../../components/common/Card'
import dashboardService from '../../../services/dashboardService'
import propertyService from '../../../services/propertyService'
import { useAuth } from '../../../context/AuthContext'

const getSavedSearchHref = (item = {}) => {
  if (item.queryString) return `/properties?${item.queryString}`

  const filters = item.filters && typeof item.filters === 'object' ? item.filters : {}
  const params = new URLSearchParams()
  const searchQuery = filters.searchQuery || item.city || ''
  const city = filters.city || item.city || ''
  const locality = filters.mapSearchQuery || item.locality || ''
  const activeFilters = Array.isArray(filters.activeFilters) ? filters.activeFilters : []

  if (searchQuery) params.set('search', searchQuery)
  if (city) params.set('city', city)
  if (locality) params.set('area', locality)
  activeFilters.forEach((filter) => params.append('filter', filter))
  if (filters.priceRange?.min) params.set('minPrice', filters.priceRange.min)
  if (filters.priceRange?.max) params.set('maxPrice', filters.priceRange.max)
  if (filters.sortBy) params.set('sort', filters.sortBy)
  if (filters.nearbyMode !== undefined) params.set('nearby', String(Boolean(filters.nearbyMode)))
  if (filters.searchRadiusKm) params.set('radius', String(filters.searchRadiusKm))
  if (filters.pagination?.page) params.set('page', filters.pagination.page)
  if (filters.pagination?.pageSize) params.set('pageSize', filters.pagination.pageSize)

  return `/properties?${params.toString()}`
}

function UserDashboard() {
  const { user } = useAuth()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [viewedCount, setViewedCount] = useState(0)
  const [moveIns, setMoveIns] = useState([])
  const [payout, setPayout] = useState({ upiId: '', bankDetails: '', upiQr: null })
  const [payoutMessage, setPayoutMessage] = useState('')
  const [visitEdits, setVisitEdits] = useState({})

  useEffect(() => {
    const load = async () => {
      try {
        const data = await dashboardService.getUserOverview(user?._id)
        setOverview(data)
        setMoveIns(data?.moveIns || [])
      } catch {
        setOverview({ shortlist: 0, shortlistItems: [], visits: [], inquiries: [], chats: [], savedSearches: [], viewedProperties: [], comparisonHistory: [], loginHistory: [], notifications: [], wallet: {} })
      } finally {
        setLoading(false)
      }
    }
    load()
    window.setTimeout(() => {
      setViewedCount(JSON.parse(localStorage.getItem('stayjiViewed') || '[]').length)
    }, 0)
  }, [user?._id])

  const handleRemoveWishlist = async (event, propertyIDFK) => {
    event.preventDefault()
    if (!user?._id || !propertyIDFK) return

    try {
      await propertyService.removeShortlistProperty({ userIDFK: user._id, propertyIDFK })
      setOverview((current) => {
        const shortlistItems = (current?.shortlistItems || []).filter((item) => item.property?._id !== propertyIDFK && item.property?.id !== propertyIDFK)
        return { ...current, shortlistItems, shortlist: shortlistItems.length }
      })
    } catch (err) {
      setActionError(err?.message || 'Unable to remove this property from wishlist.')
    }
  }
  const updateVisit = async (visitId, payload) => {
    try {
      const updated = await dashboardService.updateVisit(visitId, payload)
      setOverview((current) => ({
        ...current,
        visits: (current?.visits || []).map((visit) => (visit._id === visitId || visit.id === visitId ? updated : visit)),
      }))
    } catch (err) {
      setActionError(err?.message || 'Unable to update visit.')
    }
  }
  const setVisitEdit = (visitId, field, value) => {
    setVisitEdits((current) => ({ ...current, [visitId]: { ...(current[visitId] || {}), [field]: value } }))
  }

  const rescheduleVisit = async (visit) => {
    const visitId = visit._id || visit.id
    const edit = visitEdits[visitId] || {}
    if (!edit.visitDate && !edit.visitTime) {
      setActionError('Select a new visit date/time before rescheduling.')
      return
    }
    await updateVisit(visitId, { ...edit, action: 'pending' })
  }

  const submitPayout = async (event) => {
    event.preventDefault()
    setPayoutMessage('')
    const payload = new FormData()
    payload.append('userId', user._id)
    payload.append('upiId', payout.upiId)
    if (payout.bankDetails) payload.append('bankDetails', payout.bankDetails)
    if (payout.upiQr) payload.append('upiQr', payout.upiQr)
    try {
      await dashboardService.requestWalletPayout(payload)
      setPayoutMessage('Payout requested. Admin will verify UPI/bank details before approval or payment.')
      setPayout({ upiId: '', bankDetails: '', upiQr: null })
    } catch (err) {
      setPayoutMessage(err?.message || 'Unable to request payout.')
    }
  }

  const visits = overview?.visits || []
  const inquiries = overview?.inquiries || []
  const savedSearches = overview?.savedSearches || []
  const viewedProperties = overview?.viewedProperties || []
  const notifications = overview?.notifications || []
  const conversations = overview?.chats || []
  const comparisonHistory = overview?.comparisonHistory || []
  const loginHistory = overview?.loginHistory || user?.loginHistory || []
  const approvedRewards = moveIns.filter((item) => item.status === 'Verified' && item.ownerConfirmed)
  const pendingRewards = moveIns.filter((item) => ['Pending', 'Suspicious'].includes(item.status))
  const totalCoins = overview?.wallet?.totalCoins ?? approvedRewards.reduce((sum, item) => sum + (Number(item.rewardCoins || item.cashbackAmount) || 0), 0)

  return (
    <div className="min-w-0 space-y-8">
      <header className="rounded-[1.5rem] border border-slate-800/80 bg-surface-800/90 p-5 shadow-card sm:rounded-[2rem] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.14em] text-accent-400 sm:tracking-[0.28em]">User dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">Track your shortlist, visits, and messages</h1>
            <p className="mt-2 text-xs text-slate-500">StayJi ID: {user?._id ? `SJ-${user._id.toString().slice(-6).toUpperCase()}` : '-'}</p>
          </div>
          <Link to="/properties">
            <Button>Find more stays</Button>
          </Link>
        </div>
      </header>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <Card className="p-8">Loading overview…</Card>
        ) : (
          [
            { label: 'Saved Properties', value: overview.shortlist, icon: <FiBookmark />, target: 'user-wishlist' },
            { label: 'Visit Bookings', value: visits.length, icon: <FiCalendar />, target: 'visit-bookings' },
            { label: 'Comparison History', value: comparisonHistory.length, icon: <FiColumns />, target: 'comparison-history' },
            { label: 'Login History', value: loginHistory.length, icon: <FiClock />, target: 'login-history' },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth' })}
              className="text-left"
            >
              <Card className="h-full p-4 transition hover:border-accent-500 sm:p-6">
              <div className="flex min-w-0 items-center justify-between gap-4 text-slate-300">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-950 text-accent-400">{item.icon}</span>
                <div className="min-w-0 text-right">
                  <p className="text-sm uppercase tracking-[0.12em] text-slate-500 sm:tracking-[0.24em]">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                </div>
              </div>
              </Card>
            </button>
          ))
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card id="user-wishlist">
          <div>
            <p className="text-sm uppercase tracking-[0.12em] text-accent-400 sm:tracking-[0.24em]">Your interests</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Wishlisted stays</h2>
          </div>
          <div className="mt-6 space-y-4">
            {actionError ? <p className="text-sm text-rose-300">{actionError}</p> : null}
            {overview?.shortlistItems?.length ? (
              overview.shortlistItems.slice(0, 4).map(({ id, property }) => (
                <div
                  key={id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4"
                >
                  <Link to={property?.id ? `/properties/${property.id}` : '/properties'} className="block transition hover:text-accent-300">
                    <p className="font-semibold text-white">{property.name || 'PG listing'}</p>
                  </Link>
                  <p className="mt-2 text-sm text-slate-400">{property.address || property.city || 'Location available in listing'}</p>
                  <p className="mt-2 text-sm text-accent-300">₹{property.rent || 'Contact owner'}/mo</p>
                  <button
                    type="button"
                    onClick={(event) => handleRemoveWishlist(event, property?._id || property?.id)}
                    className="mt-4 rounded-full border border-rose-500/60 px-4 py-2 text-sm text-rose-200 hover:bg-rose-500/10"
                  >
                    Remove from wishlist
                  </button>
                </div>
              ))
            ) : (
              <p className="text-slate-300">Your wishlist is empty. Add stays using the heart button while exploring listings.</p>
            )}
          </div>
        </Card>

        <Card id="user-messages">
          <div>
            <p className="text-sm uppercase tracking-[0.12em] text-accent-400 sm:tracking-[0.24em]">Messages</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Owner conversations</h2>
          </div>
          <div className="mt-6 space-y-3">
            {conversations.slice(0, 5).map((conversation) => (
              <Link key={conversation.id || conversation._id} to={`/dashboard/user/messages?conversationId=${conversation.id || conversation._id}`} className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300 hover:border-accent-500">
                <p className="font-semibold text-white">{conversation.propertyId?.propertyName || conversation.propertyId?.name || 'Property conversation'}</p>
                <p className="mt-1 line-clamp-2">{conversation.lastMessagePreview || 'Open conversation history'}</p>
                <p className="mt-2 text-xs text-slate-500">{conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleString() : ''}</p>
              </Link>
            ))}
            {!conversations.length ? <p className="text-sm text-slate-400">No owner conversations yet. Use Message Owner on a property page to start one.</p> : null}
            <Link to="/dashboard/user/messages" className="inline-flex rounded-full border border-accent-500/60 px-4 py-2 text-sm text-accent-200">Open messages</Link>
          </div>
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Visit bookings', text: `${visits.length} visits across pending, approved, rejected, cancelled, and completed states.`, target: 'visit-bookings' },
          { title: 'Inquiry history', text: `${inquiries.length} inquiries with owner replies and lead timeline context.`, target: 'inquiry-history' },
          { title: 'Recently viewed', text: `${Math.max(viewedCount, viewedProperties.length)} recently viewed stays are remembered.`, target: 'viewed-properties' },
          { title: 'Saved searches', text: `${savedSearches.length} city, budget, sharing, and nearby preference searches saved.`, target: 'saved-searches' },
          { title: 'Comparison history', text: `${comparisonHistory.length} previous property comparisons stored.`, target: 'comparison-history' },
          { title: 'Rental history', text: `${moveIns.length} move-in and reward verification records.`, target: 'rental-history' },
          { title: 'Notifications', text: `${notifications.length} visit, reply, cashback, admin, property, and vacancy updates.`, target: 'notifications' },
        ].map((item) => (
          <Card key={item.title} className="p-0">
            <button
              type="button"
              onClick={() => item.href ? window.location.assign(item.href) : document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth' })}
              className="h-full w-full p-4 text-left transition hover:bg-slate-900/50 sm:p-6"
            >
            <p className="text-sm uppercase tracking-[0.12em] text-accent-400 sm:tracking-[0.24em]">{item.title}</p>
            <p className="mt-4 text-slate-300">{item.text}</p>
            </button>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card id="visit-bookings">
          <p className="text-sm uppercase tracking-[0.12em] text-accent-400 sm:tracking-[0.24em]">Visit bookings</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Upcoming and historical visits</h2>
          <div className="mt-5 space-y-3">
            {visits.slice(0, 8).map((visit) => {
              const visitId = visit._id || visit.id
              return (
              <div key={visitId} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                <Link to={`/properties/${visit.property?._id || visit.property?.id || visit.propertyIDFK?._id || visit.propertyIDFK}`} className="font-semibold text-white hover:text-accent-300">{visit.property?.name || visit.propertyIDFK?.propertyName || 'StayJi property'}</Link>
                <p className="mt-1">{visit.statusLabel || visit.status || 'Pending'} · {visit.visitDate ? new Date(visit.visitDate).toLocaleString() : 'Date pending'} {visit.visitTime || ''}</p>
                <p className="mt-1 text-slate-500">Move-in: {visit.moveInPreference || '-'} · Admin verification visible in notifications.</p>
                <div className="mt-3 grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_auto_auto]">
                  <input
                    type="date"
                    value={visitEdits[visitId]?.visitDate || ''}
                    onChange={(event) => setVisitEdit(visitId, 'visitDate', event.target.value)}
                    className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-accent-400"
                  />
                  <input
                    type="time"
                    value={visitEdits[visitId]?.visitTime || ''}
                    onChange={(event) => setVisitEdit(visitId, 'visitTime', event.target.value)}
                    className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-accent-400"
                  />
                  <button type="button" onClick={() => rescheduleVisit(visit)} className="rounded-full border border-accent-500/60 px-3 py-2 text-xs text-accent-200">Reschedule</button>
                  <button type="button" onClick={() => updateVisit(visitId, { action: 'cancel' })} className="rounded-full border border-rose-500/60 px-3 py-2 text-xs text-rose-200">Cancel</button>
                </div>
              </div>
            )})}
            {!visits.length ? <p className="text-sm text-slate-400">No visits booked yet.</p> : null}
          </div>
        </Card>

        <Card id="inquiry-history">
          <p className="text-sm uppercase tracking-[0.12em] text-accent-400 sm:tracking-[0.24em]">Inquiry history</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Owner replies and lead timeline</h2>
          <div className="mt-5 space-y-3">
            {inquiries.slice(0, 8).map((inquiry) => (
              <Link key={inquiry._id || inquiry.id} to={`/properties/${inquiry.property?._id || inquiry.property?.id || inquiry.propertyIDFK?._id || inquiry.propertyIDFK}`} className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300 hover:border-accent-500">
                <p className="font-semibold text-white">{inquiry.property?.name || inquiry.propertyIDFK?.propertyName || 'StayJi property'} · {inquiry.statusLabel || 'Open'}</p>
                <p className="mt-1">{inquiry.subject || 'Interested in this property'}</p>
                <p className="mt-1 text-slate-500">Owner reply: {inquiry.reply || 'Pending'} · Lead stage: {inquiry.leadStage || 'qualified'}</p>
              </Link>
            ))}
            {!inquiries.length ? <p className="text-sm text-slate-400">No inquiries yet.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card id="viewed-properties">
          <p className="text-sm uppercase tracking-[0.12em] text-accent-400 sm:tracking-[0.24em]">Viewed properties</p>
          <div className="mt-5 space-y-3">
            {viewedProperties.slice(0, 6).map((item) => (
              <Link key={`${item.propertyId}-${item.viewedOn}`} to={`/properties/${item.propertyId}`} className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300 hover:border-accent-500">
                <p className="font-semibold text-white">{item.propertyName || 'Viewed property'}</p>
                <p className="mt-1">{item.locality || item.city || '-'} · {item.viewedOn ? new Date(item.viewedOn).toLocaleString() : ''}</p>
              </Link>
            ))}
            {!viewedProperties.length ? <p className="text-sm text-slate-400">Open a property while logged in to build your viewing history.</p> : null}
          </div>
        </Card>
        <Card id="saved-searches">
          <p className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.12em] text-accent-400 sm:tracking-[0.24em]"><FiSearch /> Saved searches</p>
          <div className="mt-5 space-y-3">
            {savedSearches.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">{item.city || 'Any city'} · {item.locality || 'All localities'}</p>
                <p className="mt-1">Budget {item.budget || '-'} · Sharing {item.sharingType || '-'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to={getSavedSearchHref(item)} className="rounded-full border border-accent-500/60 px-3 py-2 text-xs text-accent-200">Rerun</Link>
                  <button
                    type="button"
                    onClick={async () => {
                      const nextSearches = await dashboardService.deleteSavedSearch(item.id, user._id)
                      setOverview((current) => ({ ...current, savedSearches: nextSearches }))
                    }}
                    className="rounded-full border border-rose-500/60 px-3 py-2 text-xs text-rose-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {!savedSearches.length ? <p className="text-sm text-slate-400">Saved searches will appear after you save filters.</p> : null}
          </div>
        </Card>
        <Card id="comparison-history">
          <p className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.12em] text-accent-400 sm:tracking-[0.24em]"><FiColumns /> Comparison history</p>
          <div className="mt-5 space-y-3">
            {comparisonHistory.slice(0, 6).map((item) => {
              const ids = (item.propertyIds || (item.properties || []).map((property) => property.propertyId)).filter(Boolean)
              const href = ids.length ? `/compare?ids=${ids.join(',')}` : '/compare'
              return (
                <div key={item.id || item.comparedOn} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                  <p className="font-semibold text-white">{item.properties?.map((property) => property.propertyName).filter(Boolean).join(' vs ') || `${ids.length} properties compared`}</p>
                  <p className="mt-1 text-slate-500">{item.comparedOn ? new Date(item.comparedOn).toLocaleString() : ''}</p>
                  <Link to={href} className="mt-3 inline-flex rounded-full border border-accent-500/60 px-3 py-2 text-xs text-accent-200">Reopen</Link>
                </div>
              )
            })}
            {!comparisonHistory.length ? <p className="text-sm text-slate-400">Compare two or three properties to save comparison history.</p> : null}
          </div>
        </Card>
        <Card id="notifications">
          <p className="text-sm uppercase tracking-[0.12em] text-accent-400 sm:tracking-[0.24em]">Notifications</p>
          <div className="mt-5 space-y-3">
            {notifications.slice(0, 8).map((item) => (
              <Link key={item._id} to={item.link || '/dashboard/user'} className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300 hover:border-accent-500">
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-1">{item.message}</p>
              </Link>
            ))}
            {!notifications.length ? <p className="text-sm text-slate-400">No notifications yet.</p> : null}
          </div>
        </Card>
      </div>

      <Card id="login-history">
        <p className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.12em] text-accent-400 sm:tracking-[0.24em]"><FiClock /> Login history</p>
        <div className="mt-5 overflow-x-auto overscroll-x-contain">
          {loginHistory.length ? (
            <table className="w-full min-w-[680px] text-left text-sm text-slate-300 sm:min-w-[760px]">
              <thead className="text-xs uppercase tracking-[0.1em] text-slate-500 sm:tracking-[0.2em]">
                <tr>
                  <th className="border-b border-slate-800 p-3">Browser</th>
                  <th className="border-b border-slate-800 p-3">Device</th>
                  <th className="border-b border-slate-800 p-3">OS</th>
                  <th className="border-b border-slate-800 p-3">IP</th>
                  <th className="border-b border-slate-800 p-3">Date</th>
                  <th className="border-b border-slate-800 p-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.slice(0, 10).map((item, index) => {
                  const date = item.loginAt || item.date || item.addedOn || item.time
                  const parsedDate = date ? new Date(date) : null
                  return (
                    <tr key={`${item.ip || 'login'}-${date || index}`}>
                      <td className="border-b border-slate-800 p-3">{item.browser || '-'}</td>
                      <td className="border-b border-slate-800 p-3">{item.device || '-'}</td>
                      <td className="border-b border-slate-800 p-3">{item.os || '-'}</td>
                      <td className="border-b border-slate-800 p-3">{item.ip || '-'}</td>
                      <td className="border-b border-slate-800 p-3">{parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString() : '-'}</td>
                      <td className="border-b border-slate-800 p-3">{parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toLocaleTimeString() : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-400">Login history will appear after your next successful login.</p>
          )}
        </div>
      </Card>

      <Card id="rental-history">
        <p className="text-sm uppercase tracking-[0.12em] text-accent-400 sm:tracking-[0.24em]">StayJi Coins wallet</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Rewards and cashback verification</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total coins</p>
            <p className="mt-2 text-2xl font-semibold text-white">{totalCoins}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Approved rewards</p>
            <p className="mt-2 text-2xl font-semibold text-white">{approvedRewards.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pending rewards</p>
            <p className="mt-2 text-2xl font-semibold text-white">{pendingRewards.length}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3">
          {moveIns.map((item) => (
            <div key={item._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">{item.propertyId?.propertyName || 'StayJi property'} · {item.status}</p>
              <p className="mt-1">Coins {item.rewardCoins || item.cashbackAmount || 0} · Cashback ₹{item.cashbackAmount || 0}</p>
              <p className="mt-1 text-slate-500">Owner confirmation: {item.ownerConfirmed ? 'Done' : 'Pending'} · Joining: {item.joiningDate || '-'}</p>
            </div>
          ))}
          {!moveIns.length ? <p className="text-slate-300">After joining a property, use “Moved In Successfully” on the property page to submit verification proof.</p> : null}
        </div>
        <form onSubmit={submitPayout} className="mt-6 grid min-w-0 gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <input value={payout.upiId} onChange={(event) => setPayout((current) => ({ ...current, upiId: event.target.value }))} placeholder="UPI ID for cashback payout" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
          <input value={payout.bankDetails} onChange={(event) => setPayout((current) => ({ ...current, bankDetails: event.target.value }))} placeholder='Optional bank JSON, e.g. {"account":"..."}' className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
          <label className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
            UPI QR optional
            <input type="file" accept="image/*" onChange={(event) => setPayout((current) => ({ ...current, upiQr: event.target.files?.[0] || null }))} className="mt-2 block w-full text-xs text-slate-400 file:mb-2 file:mr-3 file:rounded-full file:border-0 file:bg-accent-500 file:px-3 file:py-2 file:font-semibold file:text-slate-950 sm:file:mb-0" />
          </label>
          <Button type="submit" disabled={!payout.upiId.trim()}>Request payout</Button>
          {payoutMessage ? <p className="text-sm text-emerald-300 lg:col-span-3">{payoutMessage}</p> : null}
        </form>
      </Card>
    </div>
  )
}

export default UserDashboard
