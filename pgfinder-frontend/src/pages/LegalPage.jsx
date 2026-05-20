import { Link, Navigate, useLocation } from 'react-router-dom'
import SEO from '../components/SEO'
import { legalPages, siteConfig } from '../data/seoContent'

export default function LegalPage() {
  const location = useLocation()
  const slug = location.pathname.replace(/^\/+/, '')
  const page = legalPages[slug]
  if (!page) return <Navigate to="/terms-and-conditions" replace />

  return (
    <main className="bg-white px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      <SEO title={`${page.title} - StayJi`} description={page.summary} path={`/${slug}`} keywords={['StayJi legal', page.title, 'Bangalore PG safety']} />
      <article className="mx-auto max-w-4xl">
        <nav className="text-sm text-slate-500"><Link to="/" className="hover:text-blue-600">Home</Link> / {page.title}</nav>
        <h1 className="mt-6 text-4xl font-semibold text-slate-950 sm:text-5xl">{page.title}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">{page.summary}</p>
        <div className="mt-8 grid gap-6 text-base leading-8 text-slate-700">
          <h2 className="text-2xl font-semibold text-slate-950">Platform scope</h2>
          <p>StayJi helps users discover accommodation and helps vendors manage listings, inquiries, visits, reviews, notifications, and leads. Listings, prices, availability, deposits, photos, amenities, and house rules must be accurate and kept updated by vendors.</p>
          <h2 className="text-2xl font-semibold text-slate-950">Safety, fraud, and moderation</h2>
          <p>StayJi may review reports, suspicious phone numbers, duplicate listings, abusive chats, spam leads, fake availability, misleading images, repeated cancellations, and unusual account activity. Accounts may be limited, suspended, blocked, or investigated when platform safety is at risk.</p>
          <h2 className="text-2xl font-semibold text-slate-950">Account identity</h2>
          <p>Email is the primary account identity and cannot be changed from user, vendor, or admin profile settings. Email corrections, account migration, or ownership recovery must go through admin support at {siteConfig.email}.</p>
          <h2 className="text-2xl font-semibold text-slate-950">Communication and reports</h2>
          <p>Users and vendors should communicate respectfully. Users and vendors may hide messages locally, but permanent deletion and moderation are admin-only actions so disputes and fraud reports can be investigated with complete records.</p>
        </div>
      </article>
    </main>
  )
}
