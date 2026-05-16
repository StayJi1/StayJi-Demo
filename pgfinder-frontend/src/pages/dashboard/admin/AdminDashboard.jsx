import { useEffect, useState } from 'react'
import { FiBarChart2, FiUsers, FiHome, FiThumbsUp } from 'react-icons/fi'
import Button from '../../../components/common/Button'
import Card from '../../../components/common/Card'
import dashboardService from '../../../services/dashboardService'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getAdminStats()
        setStats(data)
      } catch {
        setStats({ users: 0, vendors: 0, properties: 0, inquiries: 0 })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-8">
      <header className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-accent-400">Admin dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Manage users, vendors, and properties</h1>
          </div>
          <Button>Review approvals</Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-4">
        {loading ? (
          <Card className="p-8">
            <p className="text-slate-300">Loading metrics…</p>
          </Card>
        ) : (
          [
            { label: 'Total users', value: stats.users, icon: <FiUsers /> },
            { label: 'Vendors', value: stats.vendors, icon: <FiHome /> },
            { label: 'Properties', value: stats.properties, icon: <FiBarChart2 /> },
            { label: 'Inquiries', value: stats.inquiries, icon: <FiThumbsUp /> },
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
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Property reviews</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Latest reported listings</h2>
            </div>
            <Button variant="secondary">View all</Button>
          </div>
          <p className="mt-6 text-slate-300">Manage new property approvals, deactivate listings, and keep featured properties updated in real time.</p>
        </Card>

        <Card>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Metrics</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Revenue & vendor growth</h2>
          </div>
          <div className="mt-6 h-[280px] rounded-[1.75rem] bg-slate-950/80 p-6 text-slate-300">Analytics chart placeholder</div>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard
