import { Outlet } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

function PageLayout() {
  return (
    <div className="min-h-screen bg-surface-900 text-slate-100">
      <Navbar />
      <main className="relative overflow-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default PageLayout
