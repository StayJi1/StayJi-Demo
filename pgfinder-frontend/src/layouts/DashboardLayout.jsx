import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-surface-900 text-slate-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <main className="border-l border-slate-800/80 bg-surface-800/70 p-6 xl:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
