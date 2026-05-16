import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiBookmark, FiCalendar, FiMapPin, FiMessageSquare } from 'react-icons/fi'
import Button from '../../../components/common/Button'
import Card from '../../../components/common/Card'
import dashboardService from '../../../services/dashboardService'
import { useAuth } from '../../../context/AuthContext'

function UserDashboard() {
  const { user } = useAuth()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await dashboardService.getUserOverview(user?._id)
        setOverview(data)
      } catch {
        setOverview({ shortlist: 0, shortlistItems: [], visits: 0, messages: 0, savedSearches: 0 })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?._id])

  return (
    <div className="space-y-8">
      <header className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-accent-400">User dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Track your shortlist, visits, and messages</h1>
          </div>
          <Link to="/properties">
            <Button>Find more PGs</Button>
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
            <Card key={item.label} className="p-6">
              <div className="flex items-center justify-between gap-4 text-slate-300">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-950 text-accent-400">{item.icon}</span>
                <div className="text-right">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Your interests</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Wishlisted PGs</h2>
          </div>
          <div className="mt-6 space-y-4">
            {overview?.shortlistItems?.length ? (
              overview.shortlistItems.slice(0, 4).map(({ id, property }) => (
                <Link
                  key={id}
                  to={`/properties/${property.id}`}
                  className="block rounded-3xl border border-slate-800 bg-slate-950/80 p-4 transition hover:border-accent-500"
                >
                  <p className="font-semibold text-white">{property.name || 'PG listing'}</p>
                  <p className="mt-2 text-sm text-slate-400">{property.address || property.city || 'Location available in listing'}</p>
                  <p className="mt-2 text-sm text-accent-300">₹{property.rent || 'Contact owner'}/mo</p>
                </Link>
              ))
            ) : (
              <p className="text-slate-300">Your wishlist is empty. Add PGs using the heart button while exploring listings.</p>
            )}
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Support</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Contact support</h2>
          </div>
          <p className="mt-6 text-slate-300">Need help with a booking or vendor query? Message the owner or our team directly from your dashboard.</p>
        </Card>
      </div>
    </div>
  )
}

export default UserDashboard
