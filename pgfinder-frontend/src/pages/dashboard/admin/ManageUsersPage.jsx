import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiCheckSquare, FiEye, FiMail, FiPhone, FiUser, FiX } from 'react-icons/fi'
import Card from '../../../components/common/Card'
import dashboardService from '../../../services/dashboardService'

function ManageUsersPage() {
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') || 'all'
  const [users, setUsers] = useState([])
  const [filters, setFilters] = useState({ search: '', role: initialRole, status: 'active' })
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await dashboardService.getAdminUsers(filters)
        setUsers(data || [])
      } catch (err) {
        setError(err?.message || 'Unable to load users.')
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filters.search, filters.role, filters.status])

  const handleStatus = async (user, isActive) => {
    try {
      const updated = await dashboardService.updateUserStatus({ id: user.id, isActive })
      setUsers((current) => current.map((item) => (item.id === user.id ? updated : item)))
      setSelectedUser((current) => (current?.id === user.id ? updated : current))
    } catch (err) {
      setError(err?.message || 'Unable to update user.')
    }
  }

  const handleVendorApproval = async (user) => {
    try {
      const updated = await dashboardService.updateUserStatus({ id: user.id, userType: 'Owner', isActive: true })
      setUsers((current) => current.map((item) => (item.id === user.id ? updated : item)))
      setSelectedUser((current) => (current?.id === user.id ? updated : current))
    } catch (err) {
      setError(err?.message || 'Unable to approve vendor.')
    }
  }

  return (
    <div className="space-y-8">
      <header className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-accent-400">User management</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Review registered users and vendors</h1>
        </div>
      </header>

      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_0.6fr_0.6fr]">
          <input
            type="search"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search name, email, phone"
            className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400"
          />
          <select
            value={filters.role}
            onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
            className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400"
          >
            <option value="all">All roles</option>
            <option value="User">Users</option>
            <option value="Owner">Vendors</option>
            <option value="Admin">Admins</option>
          </select>
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All status</option>
          </select>
        </div>
      </Card>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {loading ? (
        <Card className="p-8">Loading users...</Card>
      ) : users.length ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {users.map((user) => (
                  <tr key={user.id || user._id} className="hover:bg-slate-900/70">
                    <td className="px-5 py-4">
                      <button type="button" onClick={() => setSelectedUser(user)} className="font-semibold text-white hover:text-accent-300">
                        {user.name || user.email}
                      </button>
                    </td>
                    <td className="px-5 py-4">{user.email || '-'}</td>
                    <td className="px-5 py-4">{user.role?.toUpperCase() || 'USER'}</td>
                    <td className="px-5 py-4">{user.contact || '-'}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setSelectedUser(user)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-accent-500">
                          <FiEye /> View
                        </button>
                        {!['owner', 'vendor', 'admin'].includes(user.role) ? (
                          <button type="button" onClick={() => handleVendorApproval(user)} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 px-3 py-2 text-xs text-emerald-200">
                            <FiCheckSquare /> Approve vendor
                          </button>
                        ) : null}
                        <button type="button" onClick={() => handleStatus(user, !user.isActive)} className="rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-200">
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center text-slate-300">No users available yet.</Card>
      )}

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-800 bg-surface-900 p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-accent-400">{selectedUser.role || 'user'}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{selectedUser.name || selectedUser.email}</h2>
              </div>
              <button type="button" onClick={() => setSelectedUser(null)} className="rounded-full border border-slate-700 p-2 text-slate-300 hover:border-accent-500">
                <FiX />
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <p className="flex items-center gap-2 text-slate-300"><FiMail /> {selectedUser.email || '-'}</p>
              <p className="flex items-center gap-2 text-slate-300"><FiPhone /> {selectedUser.contact || '-'}</p>
              <p className="flex items-center gap-2 text-slate-300"><FiUser /> {selectedUser.gender || '-'}</p>
              <p className="text-slate-300">Occupation: {selectedUser.occupation || '-'}</p>
              <p className="text-slate-300">Status: {selectedUser.isActive ? 'Active' : 'Inactive'}</p>
              <p className="text-slate-300">Joined: {selectedUser.addedOn ? new Date(selectedUser.addedOn).toLocaleDateString() : '-'}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ManageUsersPage
