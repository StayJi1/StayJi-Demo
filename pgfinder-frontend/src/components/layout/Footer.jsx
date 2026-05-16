import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-surface-900/90 py-10 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="mb-3 text-xl font-semibold text-white">PG Finder</p>
            <p className="max-w-sm text-sm leading-6 text-slate-400">
              Premium rental search for students and professionals. Discover verified PGs, manage vendor listings, and track offers from a single modern dashboard.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">Explore</h3>
            <div className="grid gap-2 text-sm text-slate-400">
              <Link to="/properties" className="hover:text-white">Explore PGs</Link>
              <Link to="/login" className="hover:text-white">Login</Link>
              <Link to="/signup" className="hover:text-white">Create account</Link>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">Contact</h3>
            <p className="text-sm leading-6 text-slate-400">hello@pgfinder.com</p>
            <p className="text-sm leading-6 text-slate-400">+91 98765 43210</p>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-800/70 pt-6 text-sm text-slate-500">
          © 2026 PG Finder. Designed for modern rental experiences.
        </div>
      </div>
    </footer>
  )
}

export default Footer
