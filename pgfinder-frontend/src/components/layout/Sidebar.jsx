import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FiHome, FiLayers, FiUsers, FiPlusCircle, FiShield, FiUser, FiLogOut, FiMessageSquare } from 'react-icons/fi'
import NotificationBell from '../notifications/NotificationBell'

function Sidebar() {
  const navigate = useNavigate()
  const { role, user, logout } = useAuth()
  const normalizedRole = ['owner', 'host', 'hostel', 'vendor'].includes(role)
    ? 'owner'
    : role || 'user'
  const dashboardRole = normalizedRole

  const links = [
    { label: 'Dashboard', to: `/dashboard/${dashboardRole}`, icon: <FiHome /> },
  ]

  if (normalizedRole !== 'owner') {
    links.push({ label: 'Browse stays', to: '/properties', icon: <FiLayers /> })
  }

  if (normalizedRole === 'admin') {
    links.push({ label: 'Manage users', to: '/dashboard/admin/users', icon: <FiUsers /> })
    links.push({ label: 'Manage properties', to: '/dashboard/admin', icon: <FiShield /> })
  }

  if (normalizedRole === 'owner') {
    links.push({ label: 'My properties', to: '/dashboard/owner/properties', icon: <FiLayers /> })
    links.push({ label: 'My leads', to: '/dashboard/owner/leads', icon: <FiUsers /> })
    links.push({ label: 'Messages', to: '/dashboard/owner/messages', icon: <FiMessageSquare /> })
    links.push({ label: 'Add property', to: '/dashboard/owner/add-property', icon: <FiPlusCircle /> })
  }

  if (role === 'user') {
    links.push({ label: 'My bookings', to: '/dashboard/user', icon: <FiLayers /> })
    links.push({ label: 'Messages', to: '/dashboard/user/messages', icon: <FiMessageSquare /> })
  }

  if (role) {
    links.push({ label: 'Profile', to: '/dashboard/profile', icon: <FiUser /> })
  }

  return (
    <aside className="sticky top-0 z-30 flex flex-col border-b border-slate-800/90 bg-surface-900 p-4 text-slate-200 lg:min-h-screen lg:border-b-0 lg:border-r lg:p-6">
      <div className="mb-0 flex items-center gap-3 lg:mb-10">
        <div className="inline-flex h-12 w-12 overflow-hidden rounded-3xl bg-white shadow-glow">
          <img src="/stayji-logo.png" alt="StayJi" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-slate-400">StayJi dashboard</p>
          <p className="truncate text-lg font-semibold text-white">{user?.name || user?.firstName || user?.userFname || 'Owner'}</p>
        </div>
        <div className="ml-auto lg:hidden">
          <NotificationBell />
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 flex gap-1 overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/95 p-2 shadow-card backdrop-blur-xl lg:static lg:block lg:space-y-2 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex min-w-[4.75rem] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[11px] font-medium transition lg:min-w-0 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-3xl lg:px-4 lg:py-3 lg:text-left lg:text-sm ${
                isActive ? 'bg-brand-500/15 text-white' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <span className="text-lg lg:text-base">{link.icon}</span>
            <span className="w-full truncate">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => {
          logout()
          navigate('/login', { replace: true })
        }}
        className="mt-4 hidden items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-slate-800/80 hover:text-white lg:mt-auto lg:flex"
      >
        <FiLogOut />
        Logout
      </button>
    </aside>
  )
}

export default Sidebar
