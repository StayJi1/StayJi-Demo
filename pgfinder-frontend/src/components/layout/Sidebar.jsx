import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FiHome, FiLayers, FiUsers, FiPlusCircle, FiShield, FiUser } from 'react-icons/fi'

function Sidebar() {
  const { role, user } = useAuth()
  const normalizedRole = ['owner', 'host', 'hostel'].includes(role)
    ? 'vendor'
    : role || 'user'
  const dashboardRole = normalizedRole

  const links = [
    { label: 'Dashboard', to: `/dashboard/${dashboardRole}`, icon: <FiHome /> },
    { label: 'Browse stays', to: '/properties', icon: <FiLayers /> },
  ]

  if (normalizedRole === 'admin') {
    links.push({ label: 'Manage users', to: '/dashboard/admin/users', icon: <FiUsers /> })
    links.push({ label: 'Manage properties', to: '/dashboard/admin', icon: <FiShield /> })
  }

  if (normalizedRole === 'vendor') {
    links.push({ label: 'My properties', to: '/dashboard/vendor/properties', icon: <FiLayers /> })
    links.push({ label: 'Add property', to: '/dashboard/vendor/add-property', icon: <FiPlusCircle /> })
  }

  if (role === 'user') {
    links.push({ label: 'My bookings', to: '/dashboard/user', icon: <FiLayers /> })
  }

  if (role) {
    links.push({ label: 'Profile', to: '/dashboard/profile', icon: <FiUser /> })
  }

  return (
    <aside className="flex min-h-screen flex-col border-r border-slate-800/90 bg-surface-900 p-6 text-slate-200">
      <div className="mb-10 flex items-center gap-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-brand-600 text-xl text-white shadow-glow">
          P
        </div>
        <div>
          <p className="text-sm text-slate-400">Welcome back</p>
          <p className="text-lg font-semibold text-white">{user?.name || user?.firstName || user?.userFname || 'Host'}</p>
        </div>
      </div>

      <nav className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${
                isActive ? 'bg-brand-500/15 text-white' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
