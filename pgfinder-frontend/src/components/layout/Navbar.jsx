import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FiMenu, FiX } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'PGs', to: '/properties' },
  { label: 'Login', to: '/login' },
  { label: 'Signup', to: '/signup' },
]

function Navbar() {
  const [open, setOpen] = useState(false)
  const { isAuthenticated, logout, role } = useAuth()
  const dashboardRole = ['owner', 'host', 'hostel'].includes(role)
    ? 'vendor'
    : role || 'user'
  const visibleNavItems = isAuthenticated ? navItems.filter((item) => !['/login', '/signup'].includes(item.to)) : navItems

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-surface-900/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-lg font-semibold text-white">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-xl shadow-glow">
            P
          </span>
          PG Finder
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <NavLink
                to={`/dashboard/${dashboardRole}`}
                className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-400"
              >
                Dashboard
              </NavLink>
              <button
                onClick={logout}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-accent-500 hover:text-white"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>

        <button
          className="inline-flex items-center justify-center rounded-2xl border border-slate-700 p-2 text-slate-200 transition hover:bg-slate-800/80 md:hidden"
          onClick={() => setOpen((current) => !current)}
          aria-label="Menu"
        >
          {open ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-800/80 bg-surface-900/95 px-6 py-5 md:hidden">
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
                  className="rounded-full bg-brand-500 px-4 py-2 text-center text-sm font-semibold text-slate-950"
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
