import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiCheckSquare, FiEye, FiX } from 'react-icons/fi'
import Card from '../../../components/common/Card'
import AdvancedDataTable from '../../../components/admin/AdvancedDataTable'
import adminApi from '../../../api/adminApi'
import useDebouncedValue from '../../../hooks/useDebouncedValue'
import { useAuth } from '../../../context/AuthContext'

function ManageUsersPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { role: currentRole } = useAuth()
  const initialRole = searchParams.get('role') || 'all'
  const [filters, setFilters] = useState({ search: '', role: initialRole, ownerType: 'all', city: '', status: 'all' })
  const [selectedUser, setSelectedUser] = useState(null)
  const [editUser, setEditUser] = useState(null)
  const [error, setError] = useState('')
  const debouncedSearch = useDebouncedValue(filters.search)
  const canManageAdminScope = currentRole === 'admin'

  const queryFilters = {
    ...filters,
    search: debouncedSearch,
    ownerType: filters.role === 'User' ? 'all' : filters.ownerType,
    limit: 80,
  }
  const { data: users = [], isLoading: loading } = useQuery({ queryKey: ['admin-users', queryFilters], queryFn: () => adminApi.users(queryFilters), refetchInterval: 30_000 })
  const statusMutation = useMutation({
    mutationFn: ({ user, payload }) => adminApi.updateUserStatus(user.id || user._id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setSelectedUser((current) => (current?.id === updated?.id || current?._id === updated?._id ? updated : current))
    },
    onError: (err) => setError(err?.message || 'Unable to update user.'),
  })
  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }) => adminApi.updateUser(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setSelectedUser(updated)
      setEditUser(null)
    },
    onError: (err) => setError(err?.message || 'Unable to update user.'),
  })

  const handleStatus = async (user, isActive) => {
    if (!user) return
    try {
      statusMutation.mutate({ user, payload: { isActive } })
    } catch (err) {
      setError(err?.message || 'Unable to update user.')
    }
  }

  const handleOwnerVerification = async (user) => {
    try {
      statusMutation.mutate({ user, payload: { verificationStatus: 'Verified', approvalStatus: 'Approved', accountStatus: 'active', isActive: true, isVerified: true } })
    } catch (err) {
      setError(err?.message || 'Unable to verify owner.')
    }
  }

  const userColumns = [
    {
      key: 'name',
      label: 'Name',
      value: (user) => user.name || user.email,
      render: (user) => (
        <button type="button" onClick={() => (['owner', 'owner'].includes(user.role) ? navigate(`/dashboard/admin/owners/${user.id || user._id}`) : setSelectedUser(user))} className="font-semibold text-white hover:text-accent-300">
          {user.name || user.email}
          <span className="mt-1 block max-w-[220px] truncate text-xs font-normal text-slate-500">{user.objectId || user._id || user.id}</span>
        </button>
      ),
    },
    { key: 'email', label: 'Email', value: (user) => user.email || '-' },
    {
      key: 'role',
      label: 'Role',
      value: (user) => user.role || 'user',
      render: (user) => (
        <span className={`rounded-full border px-3 py-1 text-xs ${
          ['owner', 'owner'].includes(user.role)
            ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200'
            : user.role === 'admin'
              ? 'border-violet-500/50 bg-violet-500/10 text-violet-200'
              : 'border-slate-600 bg-slate-900 text-slate-200'
        }`}>{user.role?.toUpperCase() || 'USER'}</span>
      ),
    },
    { key: 'phone', label: 'Phone', value: (user) => user.contact || '-' },
    { key: 'verification', label: 'Verification', value: (user) => user.verificationStatus || 'Pending' },
    {
      key: 'status',
      label: 'Status',
      value: (user) => user.accountStatus || (user.isActive ? 'active' : 'suspended'),
      render: (user) => (
        <span className={`rounded-full border px-3 py-1 text-xs ${
          user.isActive
            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
            : 'border-rose-500/50 bg-rose-500/10 text-rose-200'
        }`}>{user.isActive ? 'Active' : 'Inactive'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      value: (user) => user.id,
      render: (user) => (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => (['owner', 'owner'].includes(user.role) ? navigate(`/dashboard/admin/owners/${user.id || user._id}`) : setSelectedUser(user))} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-accent-500">
            <FiEye /> View
          </button>
          <button type="button" onClick={() => setEditUser(user)} className="rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-cyan-400 hover:text-cyan-200">
            Edit
          </button>
          {['owner', 'owner'].includes(user.role) ? (
            <button type="button" onClick={() => handleOwnerVerification(user)} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 px-3 py-2 text-xs text-emerald-200">
              <FiCheckSquare /> Verify
            </button>
          ) : null}
          <button type="button" onClick={() => handleStatus(user, !user.isActive)} className={`rounded-full border px-3 py-2 text-xs transition ${
            user.isActive
              ? 'border-rose-500/60 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20'
              : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
          }`}>
            {user.isActive ? 'Suspend' : 'Activate'}
          </button>
        </div>
      ),
    },
  ]
  const selectedAnalytics = selectedUser ? {
    wishlistCount: selectedUser.wishlistCount || selectedUser.wishlistHistory?.length || 0,
    leadCount: selectedUser.leadCount || selectedUser.inquiryHistory?.length || selectedUser.analyticsSummary?.leads || 0,
    bookingCount: selectedUser.bookingCount || selectedUser.analyticsSummary?.bookings || 0,
  } : {}

  return (
    <div className="space-y-8">
      <header className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-accent-400">User management</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Review registered users and owners</h1>
        </div>
      </header>

      <Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <input
            type="search"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search name, email, phone, StayJi ID"
            className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400"
          />
          <select
            value={filters.role}
            onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value, ownerType: event.target.value === 'User' ? 'all' : current.ownerType }))}
            className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400"
          >
            <option value="all">All roles</option>
            <option value="User">Users</option>
            <option value="Owner">Owners</option>
          </select>
          <select
            value={filters.ownerType}
            onChange={(event) => setFilters((current) => ({ ...current, ownerType: event.target.value }))}
            disabled={filters.role === 'User'}
            className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400"
          >
            <option value="all">All owner types</option>
            <option value="PG">PG owners</option>
            <option value="Flat">Flat owners</option>
            <option value="Hostel">Hostel owners</option>
          </select>
          <input
            value={filters.city}
            onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}
            placeholder="City"
            className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400"
          />
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

      <AdvancedDataTable
        title="Users, owners, and MongoDB identities"
        eyebrow="Admin database table"
        rows={users}
        columns={userColumns}
        loading={loading}
        searchPlaceholder="Search ObjectId, name, email, phone, role, status"
        minWidth="1120px"
        actions={({ selected }) => (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => selected.forEach((id) => handleStatus(users.find((user) => (user.id || user._id) === id), false))} className="rounded-full border border-rose-500/60 px-4 py-2 text-sm text-rose-200">Suspend selected</button>
            <button type="button" onClick={() => selected.forEach((id) => handleStatus(users.find((user) => (user.id || user._id) === id), true))} className="rounded-full border border-emerald-500/60 px-4 py-2 text-sm text-emerald-200">Activate selected</button>
          </div>
        )}
      />

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-slate-800 bg-surface-900 p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-accent-400">{selectedUser.role || 'user'}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{selectedUser.name || selectedUser.email}</h2>
              </div>
              <button type="button" onClick={() => setSelectedUser(null)} className="rounded-full border border-slate-700 p-2 text-slate-300 hover:border-accent-500">
                <FiX />
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ['MongoDB _id', selectedUser._id || selectedUser.id],
                ['ObjectId', selectedUser.objectId || selectedUser._id || selectedUser.id],
                ['First name', selectedUser.firstName || selectedUser.userFname],
                ['Last name', selectedUser.lastName || selectedUser.userLname],
                ['Email', selectedUser.email],
                ['Phone', selectedUser.contact],
                ['Gender', selectedUser.gender],
                ['DOB', selectedUser.dob],
                ['Occupation', selectedUser.occupation],
                ['City', selectedUser.city],
                ['Bio', selectedUser.bio],
                ['User type', selectedUser.userType || selectedUser.role],
                ['Verification', selectedUser.verificationStatus || 'Pending'],
                ['Account status', selectedUser.accountStatus || (selectedUser.isActive ? 'active' : 'suspended')],
                ['Created', selectedUser.createdAt || selectedUser.addedOn],
                ['Updated', selectedUser.updatedAt || '-'],
                ['Last login', selectedUser.lastLogin || '-'],
                ['Wishlist count', selectedAnalytics.wishlistCount],
                ['Lead count', selectedAnalytics.leadCount],
                ['Booking count', selectedAnalytics.bookingCount],
                ['Notifications', Object.keys(selectedUser.notificationPreferences || {}).length ? JSON.stringify(selectedUser.notificationPreferences) : 'Default'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
                  <p className="mt-2 break-words text-sm text-slate-200">{value || '-'}</p>
                </div>
              ))}
              {selectedUser.profile ? <img src={selectedUser.profile} alt={selectedUser.name || 'Profile'} className="h-32 w-32 rounded-2xl object-cover" /> : null}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => setEditUser(selectedUser)} className="rounded-full border border-cyan-500/60 px-4 py-2 text-sm text-cyan-200">Edit profile</button>
              <button type="button" onClick={() => handleStatus(selectedUser, !selectedUser.isActive)} className="rounded-full border border-rose-500/60 px-4 py-2 text-sm text-rose-200">{selectedUser.isActive ? 'Suspend account' : 'Activate account'}</button>
              <button type="button" onClick={() => setError('Password reset handoff uses the secure OTP flow from login; direct admin password mutation is intentionally blocked.')} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200">Reset password</button>
            </div>
          </div>
        </div>
      ) : null}
      {editUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const targetId = editUser.objectId || editUser._id || editUser.id
              const payload = {
                name: editUser.name || '',
                userFname: editUser.firstName || editUser.userFname || editUser.name?.split(' ')[0] || '',
                userLname: editUser.lastName || editUser.userLname || editUser.name?.split(' ').slice(1).join(' ') || '',
                userEmail: editUser.email,
                contact: editUser.contact,
                occupation: editUser.occupation || '',
                gender: editUser.gender || '',
                dob: editUser.dob || '',
                city: editUser.city || '',
                state: editUser.state || '',
                bio: editUser.bio || '',
                accountStatus: editUser.accountStatus || '',
                verificationStatus: editUser.verificationStatus || '',
                approvalStatus: editUser.approvalStatus || '',
                isVerified: Boolean(editUser.isVerified),
                businessName: editUser.businessName || '',
                vendorType: editUser.vendorType || '',
              }
              if (canManageAdminScope) {
                payload.assignedCity = editUser.assignedCity || ''
                payload.assignedState = editUser.assignedState || ''
                payload.userType = editUser.userType || editUser.role
              }
              updateUserMutation.mutate({ id: targetId, payload })
            }}
            className="w-full max-w-2xl rounded-[2rem] border border-slate-800 bg-surface-900 p-6 shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Edit user</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{editUser.name || editUser.email}</h2>
              </div>
              <button type="button" onClick={() => setEditUser(null)} className="rounded-full border border-slate-700 p-2 text-slate-300 hover:border-accent-500"><FiX /></button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input value={editUser.name || ''} onChange={(event) => setEditUser((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
              <input type="email" value={editUser.email || ''} onChange={(event) => setEditUser((current) => ({ ...current, email: event.target.value }))} placeholder="Email" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
              <input value={editUser.contact || ''} onChange={(event) => setEditUser((current) => ({ ...current, contact: event.target.value }))} placeholder="Phone" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
              <input value={editUser.occupation || ''} onChange={(event) => setEditUser((current) => ({ ...current, occupation: event.target.value }))} placeholder="Occupation" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
              <input value={editUser.gender || ''} onChange={(event) => setEditUser((current) => ({ ...current, gender: event.target.value }))} placeholder="Gender" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
              <input value={editUser.dob || ''} onChange={(event) => setEditUser((current) => ({ ...current, dob: event.target.value }))} placeholder="DOB" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
              <input value={editUser.city || ''} onChange={(event) => setEditUser((current) => ({ ...current, city: event.target.value }))} placeholder="City/locality" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
              <input value={editUser.state || ''} onChange={(event) => setEditUser((current) => ({ ...current, state: event.target.value }))} placeholder="State" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
              {canManageAdminScope ? (
                <>
                  <input value={editUser.assignedCity || ''} onChange={(event) => setEditUser((current) => ({ ...current, assignedCity: event.target.value }))} placeholder="Assigned city" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
                  <input value={editUser.assignedState || ''} onChange={(event) => setEditUser((current) => ({ ...current, assignedState: event.target.value }))} placeholder="Assigned state" className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
                  <select value={editUser.userType || editUser.role || 'User'} onChange={(event) => setEditUser((current) => ({ ...current, userType: event.target.value, role: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400">
                    <option value="User">User</option>
                    <option value="Owner">Owner</option>
                    <option value="Admin">Admin</option>
                  </select>
                </>
              ) : null}
              <select value={editUser.accountStatus || (editUser.isActive ? 'active' : 'suspended')} onChange={(event) => setEditUser((current) => ({ ...current, accountStatus: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400">
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="blocked">Blocked</option>
                <option value="pending_verification">Pending verification</option>
              </select>
              <select value={editUser.verificationStatus || 'Pending'} onChange={(event) => setEditUser((current) => ({ ...current, verificationStatus: event.target.value }))} className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400">
                <option value="Pending">Verification pending</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
              </select>
              <label className="inline-flex items-center gap-3 rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100">
                <input type="checkbox" checked={Boolean(editUser.isVerified)} onChange={(event) => setEditUser((current) => ({ ...current, isVerified: event.target.checked }))} />
                Platform verified
              </label>
              <textarea value={editUser.bio || ''} onChange={(event) => setEditUser((current) => ({ ...current, bio: event.target.value }))} placeholder="Bio/admin notes" className="sm:col-span-2 min-h-24 rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditUser(null)} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200">Cancel</button>
              <button type="submit" className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">Save changes</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

export default ManageUsersPage
