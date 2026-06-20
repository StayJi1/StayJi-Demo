import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FiMenu, FiX } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../notifications/NotificationBell'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Bangalore PGs', to: '/bangalore' },
  { label: 'FAQs', to: '/faq' },
  { label: 'Login', to: '/login' },
  { label: 'Signup', to: '/signup' },
]

function Navbar() {
  const [open, setOpen] = useState(false)
  const { isAuthenticated, logout, role } = useAuth()
  const dashboardRole = ['owner', 'host', 'hostel', 'vendor'].includes(role)
    ? 'owner'
    : role || 'user'
  const visibleNavItems = isAuthenticated
    ? navItems
      .filter((item) => !['/login', '/signup'].includes(item.to))
      .map((item) => (dashboardRole === 'owner' && item.to === '/properties' ? { ...item, label: 'My stays', to: '/dashboard/owner/properties' } : item))
    : navItems

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/75 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3 text-lg font-semibold text-white">
          <span className="inline-flex h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-white shadow-glow ring-1 ring-white/20 sm:h-12 sm:w-12">
            <img src="/stayji-logo.png" alt="StayJi" className="h-full w-full object-cover" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-lg sm:text-xl">StayJi</span>
            <span className="block truncate text-[10px] font-medium uppercase tracking-[0.14em] text-cyan-300 sm:text-[11px] sm:tracking-[0.22em]">Find Your Perfect Stay</span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition ${isActive ? 'text-white' : 'text-slate-300 hover:text-white'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <NotificationBell />
              <NavLink
                to={`/dashboard/${dashboardRole}`}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
              >
                Dashboard
              </NavLink>
              <button
                onClick={logout}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-white"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <NotificationBell />
          <button
            className="inline-flex items-center justify-center rounded-2xl border border-white/20 p-2 text-slate-200 transition hover:bg-white/10"
            onClick={() => setOpen((current) => !current)}
            aria-label="Menu"
          >
            {open ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-slate-950/95 px-6 py-5 backdrop-blur-2xl md:hidden">
          <div className="grid gap-4">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="text-base font-medium text-slate-300 hover:text-white"
              >
                {item.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <>
                <NavLink
                  to={`/dashboard/${dashboardRole}`}
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-slate-950"
                >
                  Dashboard
                </NavLink>
                <button
                  onClick={() => {
                    logout()
                    setOpen(false)
                  }}
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent-500 hover:text-white"
                >
                  Sign out
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  )
}

export default Navbar
