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
    links.push({ label: 'Manage ads', to: '/dashboard/admin/ads', icon: <FiLayers /> })
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
    <aside className="sticky top-0 z-[1000] flex min-w-0 flex-col border-b border-slate-800/90 bg-surface-900 p-4 text-slate-200 lg:min-h-screen lg:border-b-0 lg:border-r lg:p-6">
      <div className="mb-0 flex items-center gap-3 lg:mb-4">
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

      <button
        type="button"
        onClick={() => {
          logout()
          navigate('/login', { replace: true })
        }}
        className="mb-8 hidden items-center gap-3 rounded-3xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-100 transition hover:border-rose-300 hover:bg-rose-500/20 hover:text-white lg:flex"
      >
        <FiLogOut />
        Logout
      </button>

      <nav className="fixed inset-x-2 bottom-2 z-40 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-card backdrop-blur-xl sm:inset-x-3 sm:bottom-3 sm:rounded-3xl lg:static lg:block lg:space-y-2 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex min-w-[4.25rem] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center text-[10px] font-medium transition sm:min-w-[4.75rem] sm:rounded-2xl sm:text-[11px] lg:min-w-0 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-3xl lg:px-4 lg:py-3 lg:text-left lg:text-sm ${
                isActive ? 'bg-brand-500/15 text-white' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <span className="text-lg lg:text-base">{link.icon}</span>
            <span className="w-full truncate">{link.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
          className="flex min-w-[4.25rem] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center text-[10px] font-medium text-rose-200 transition hover:bg-rose-500/10 hover:text-white sm:min-w-[4.75rem] sm:rounded-2xl sm:text-[11px] lg:hidden"
        >
          <span className="text-lg"><FiLogOut /></span>
          <span className="w-full truncate">Logout</span>
        </button>
      </nav>

    </aside>
  )
}

export default Sidebar
