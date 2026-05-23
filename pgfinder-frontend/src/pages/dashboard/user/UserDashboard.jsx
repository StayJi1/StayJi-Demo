import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiBookmark, FiCalendar, FiMapPin, FiMessageSquare } from 'react-icons/fi'
import Button from '../../../components/common/Button'
import Card from '../../../components/common/Card'
import dashboardService from '../../../services/dashboardService'
import propertyService from '../../../services/propertyService'
import { useAuth } from '../../../context/AuthContext'

function UserDashboard() {
  const { user } = useAuth()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [compareCount, setCompareCount] = useState(0)
  const [viewedCount, setViewedCount] = useState(0)
  const [moveIns, setMoveIns] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await dashboardService.getUserOverview(user?._id)
        setOverview(data)
        const moveInRows = user?._id ? await dashboardService.moveIns({ userId: user._id, limit: 20 }) : []
        setMoveIns(moveInRows)
      } catch {
        setOverview({ shortlist: 0, shortlistItems: [], visits: 0, messages: 0, savedSearches: 0 })
      } finally {
        setLoading(false)
      }
    }
    load()
    window.setTimeout(() => {
      setCompareCount(JSON.parse(localStorage.getItem('stayjiCompare') || '[]').length)
      setViewedCount(JSON.parse(localStorage.getItem('stayjiViewed') || '[]').length)
    }, 0)
  }, [user?._id])

  const handleRemoveWishlist = async (event, propertyIDFK) => {
    event.preventDefault()
    if (!user?._id || !propertyIDFK) return

    try {
      await propertyService.removeShortlistProperty({ userIDFK: user._id, propertyIDFK })
      setOverview((current) => {
        const shortlistItems = (current?.shortlistItems || []).filter((item) => item.property._id !== propertyIDFK && item.property.id !== propertyIDFK)
        return { ...current, shortlistItems, shortlist: shortlistItems.length }
      })
    } catch (err) {
      setActionError(err?.message || 'Unable to remove this property from wishlist.')
    }
  }
  const approvedRewards = moveIns.filter((item) => item.status === 'Verified')
  const pendingRewards = moveIns.filter((item) => ['Pending', 'Suspicious'].includes(item.status))
  const totalCoins = approvedRewards.reduce((sum, item) => sum + (Number(item.rewardCoins || item.cashbackAmount) || 0), 0)

  return (
    <div className="space-y-8">
      <header className="rounded-[1.5rem] border border-slate-800/80 bg-surface-800/90 p-5 shadow-card sm:rounded-[2rem] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-accent-400">User dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Track your shortlist, visits, and messages</h1>
          </div>
          <Link to="/properties">
            <Button>Find more stays</Button>
          </Link>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-4">
        {loading ? (
          <Card className="p-8">Loading overview…</Card>
        ) : (
          [
            { label: 'Shortlist', value: overview.shortlist, icon: <FiBookmark /> },
            { label: 'Visits', value: overview.visits, icon: <FiCalendar /> },
            { label: 'Messages', value: overview.messages, icon: <FiMessageSquare /> },
            { label: 'Saved searches', value: overview.savedSearches, icon: <FiMapPin /> },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => document.getElementById(item.label === 'Shortlist' ? 'user-wishlist' : 'user-support')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-left"
            >
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

      <div className="grid gap-6 xl:grid-cols-2">
        <Card id="user-wishlist">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Your interests</p>
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
                  <Link to={`/properties/${property.id}`} className="block transition hover:text-accent-300">
                    <p className="font-semibold text-white">{property.name || 'PG listing'}</p>
                  </Link>
                  <p className="mt-2 text-sm text-slate-400">{property.address || property.city || 'Location available in listing'}</p>
                  <p className="mt-2 text-sm text-accent-300">₹{property.rent || 'Contact owner'}/mo</p>
                  <button
                    type="button"
                    onClick={(event) => handleRemoveWishlist(event, property._id || property.id)}
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

        <Card id="user-support">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Support</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Contact support</h2>
          </div>
          <p className="mt-6 text-slate-300">Need help with a booking or owner query? Reach the StayJi team at hello.stayji@gmail.com or 1234567899.</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {[
          { title: 'Visit bookings', text: 'Track upcoming visits and owner confirmations in one place.' },
          { title: 'Inquiry history', text: 'Your contacted owners, replies, and follow-up status stay organized.' },
          { title: 'Comparison history', text: `${compareCount} properties currently saved for side-by-side comparison.` },
          { title: 'Viewed properties', text: `${viewedCount} recently viewed stays are remembered in this browser session.` },
          { title: 'Saved searches', text: 'Keep city, budget, sharing, and nearby filters ready for your next move.' },
          { title: 'Rental history', text: 'Converted stays and past rentals will appear here after owner confirmation.' },
          { title: 'Notifications', text: 'Visit updates, owner replies, and vacancy alerts are grouped here.' },
        ].map((item) => (
          <Card key={item.title}>
            <p className="text-sm uppercase tracking-[0.24em] text-accent-400">{item.title}</p>
            <p className="mt-4 text-slate-300">{item.text}</p>
          </Card>
        ))}
      </div>

      <Card>
        <p className="text-sm uppercase tracking-[0.24em] text-accent-400">StayJi Coins wallet</p>
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
      </Card>
    </div>
  )
}

export default UserDashboard
