import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-surface-900 text-slate-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <main className="min-w-0 border-slate-800/80 bg-surface-800/70 p-4 sm:p-6 lg:border-l xl:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
