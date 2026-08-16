import { Link } from 'react-router-dom'
import { FaWhatsapp } from 'react-icons/fa'
import { FiMail, FiPhoneCall } from 'react-icons/fi'
import { siteConfig } from '../../data/seoContent'

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="mb-4 inline-flex items-center gap-3">
              <span className="inline-flex h-12 w-12 overflow-hidden rounded-2xl bg-slate-950 shadow-soft">
                <img src="/stayji-logo.png" alt="StayJi" className="h-full w-full object-cover" />
              </span>
              <span>
                <span className="block text-xl font-semibold text-slate-950">StayJi</span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Find Your Perfect Stay</span>
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-6">
              Premium stay search for students and professionals. Discover verified PGs, hostels, flats, and short stays from one modern platform.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-900">Explore</h3>
            <div className="grid gap-2 text-sm">
              <Link to="/properties" className="hover:text-blue-600">PGs and hostels</Link>
              <Link to="/properties" className="hover:text-blue-600">Flats</Link>
              <Link to="/properties" className="hover:text-blue-600">Nearby stays</Link>
              <Link to="/signup?role=owner" className="hover:text-blue-600">List property</Link>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-900">Platform</h3>
            <div className="grid gap-2 text-sm">
              <Link to="/login" className="hover:text-blue-600">Login</Link>
              <Link to="/signup" className="hover:text-blue-600">Create account</Link>
              <Link to="/properties" className="hover:text-blue-600">Wishlist</Link>
              <Link to="/properties" className="hover:text-blue-600">Book visits</Link>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-900">Contact</h3>
            <div className="grid gap-3 text-sm">
              <a href={siteConfig.mailtoUrl} className="inline-flex items-center gap-2 leading-6 hover:text-blue-600">
                <FiMail className="shrink-0" /> {siteConfig.email}
              </a>
              <a href={siteConfig.telUrl} className="inline-flex items-center gap-2 leading-6 hover:text-blue-600">
                <FiPhoneCall className="shrink-0" /> {siteConfig.phoneDisplay}
              </a>
              <a href={siteConfig.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 leading-6 text-emerald-700 hover:text-emerald-600">
                <FaWhatsapp className="shrink-0" /> WhatsApp support
              </a>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
          © 2026 StayJi. Designed for modern Indian stay discovery.
        </div>
      </div>
    </footer>
  )
}

export default Footer
