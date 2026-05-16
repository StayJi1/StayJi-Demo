import { Link } from 'react-router-dom'
import Button from '../components/common/Button'

function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-108px)] flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
      <p className="text-sm uppercase tracking-[0.3em] text-accent-400">Page not found</p>
      <h1 className="mt-6 text-5xl font-semibold text-white">404</h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-slate-300">
        We couldn’t find the page you were looking for. Head back to the home page or your dashboard.
      </p>
      <Link to="/">
        <Button className="mt-8">Go back home</Button>
      </Link>
    </div>
  )
}

export default NotFoundPage
