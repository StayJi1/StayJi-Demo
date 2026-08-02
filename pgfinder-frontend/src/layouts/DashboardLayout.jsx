import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import { useAuth } from '../context/AuthContext'

function DashboardLayout() {
  const { user } = useAuth()
  const profileIncomplete = user && ![
    user.firstName || user.userFname,
    user.contact,
    user.gender,
    user.city,
  ].every(Boolean)

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-900 pb-24 text-slate-100 lg:pb-0">
      <div className="grid min-h-screen min-w-0 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />
        <main className="min-w-0 overflow-x-clip border-slate-800/80 bg-surface-800/70 p-3 sm:p-6 lg:border-l xl:p-8 2xl:p-10">
          {profileIncomplete ? (
            <div className="mb-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              <strong>Complete Your Profile</strong>
              <span className="ml-2">Add contact, gender, city, and profile details to unlock a safer StayJi experience.</span>
              <Link to="/dashboard/profile" className="ml-3 font-semibold text-white underline">Update profile</Link>
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
