import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiEye, FiPlusCircle, FiSliders, FiUsers } from 'react-icons/fi'
import Button from '../../../components/common/Button'
import Card from '../../../components/common/Card'
import { useAuth } from '../../../context/AuthContext'
import dashboardService from '../../../services/dashboardService'

function VendorDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await dashboardService.getVendorOverview(user?._id)
        setOverview(data)
      } catch {
        setOverview({ totalProperties: 0, inquiries: 0, bookings: 0, views: 0 })
      } finally {
        setLoading(false)
      }
    }
    if (user?._id) load()
    else setLoading(false)
  }, [user?._id])

  return (
    <div className="space-y-8">
      <header className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-accent-400">Vendor dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Manage your stay listings and inquiries</h1>
          </div>
          <Button onClick={() => navigate('/dashboard/vendor/add-property')}>New property</Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-4">
        {loading ? (
          <Card className="p-8">Loading stats…</Card>
        ) : (
          [
            { label: 'Properties', value: overview.totalProperties, icon: <FiSliders />, onClick: () => navigate('/dashboard/vendor/properties') },
            { label: 'Leads', value: overview.leads ?? overview.inquiries + overview.bookings, icon: <FiUsers />, onClick: () => navigate('/dashboard/vendor/leads') },
            { label: 'Inquiries', value: overview.inquiries, icon: <FiUsers />, onClick: () => document.getElementById('vendor-requests')?.scrollIntoView({ behavior: 'smooth' }) },
            { label: 'Bookings', value: overview.bookings, icon: <FiPlusCircle />, onClick: () => document.getElementById('vendor-requests')?.scrollIntoView({ behavior: 'smooth' }) },
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

      <div className="grid gap-6 xl:grid-cols-2">
        <Card id="vendor-requests">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Active listings</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Live property performance</h2>
            </div>
            <Button variant="secondary" onClick={() => navigate('/dashboard/vendor/properties')}>View listings</Button>
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
    </div>
  )
}

export default VendorDashboard
