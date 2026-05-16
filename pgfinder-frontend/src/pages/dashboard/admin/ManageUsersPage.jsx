import { useEffect, useState } from 'react'
import { FiMail, FiUser, FiCheckSquare } from 'react-icons/fi'
import Card from '../../../components/common/Card'
import dashboardService from '../../../services/dashboardService'

function ManageUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await dashboardService.getAdminUsers()
        setUsers(data || [])
      } catch {
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-8">
      <header className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-accent-400">User management</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Review registered users and vendors</h1>
        </div>
      </header>

      {loading ? (
        <Card className="p-8">Loading users…</Card>
      ) : users.length ? (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id || user._id} className="grid gap-6 p-6 sm:grid-cols-[1fr_0.8fr_0.6fr]">
              <div>
                <p className="text-lg font-semibold text-white">{user.name || user.email}</p>
                <p className="text-sm text-slate-400">{user.role?.toUpperCase() || 'User'}</p>
              </div>
              <div className="text-slate-300">
                <div className="flex items-center gap-2 text-sm">
                  <FiMail />
                  <span>{user.email || 'no-email@domain.com'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent-500">
                  <FiCheckSquare /> Approve
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-slate-300">No users available yet.</Card>
      )}
    </div>
  )
}

export default ManageUsersPage
