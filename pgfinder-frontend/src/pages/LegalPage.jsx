import { Link, Navigate, useLocation } from 'react-router-dom'
import SEO from '../components/SEO'
import { legalPages, siteConfig } from '../data/seoContent'
import termsMarkdown from '../data/legal/terms-and-conditions.md?raw'
import privacyMarkdown from '../data/legal/privacy-policy.md?raw'

const legalMarkdown = {
  'terms-and-conditions': termsMarkdown,
  'privacy-policy': privacyMarkdown,
}

function MarkdownContent({ content, fallbackPage }) {
  if (!content) {
    return (
      <div className="mt-8 grid gap-6 text-base leading-8 text-slate-700">
        <h2 className="text-2xl font-semibold text-slate-950">Platform scope</h2>
        <p>StayJi helps users discover accommodation and helps owners manage listings, inquiries, visits, reviews, notifications, and leads. Listings, prices, availability, deposits, photos, amenities, and house rules must be accurate and kept updated by owners.</p>
        <h2 className="text-2xl font-semibold text-slate-950">Safety, fraud, and moderation</h2>
        <p>StayJi may review reports, suspicious phone numbers, duplicate listings, abusive chats, spam leads, fake availability, misleading images, repeated cancellations, and unusual account activity. Accounts may be limited, suspended, blocked, or investigated when platform safety is at risk.</p>
        <h2 className="text-2xl font-semibold text-slate-950">Account identity</h2>
        <p>Email is the primary account identity and cannot be changed from user, owner, or admin profile settings. Email corrections, account migration, or ownership recovery must go through admin support at {siteConfig.email}.</p>
        <h2 className="text-2xl font-semibold text-slate-950">Communication and reports</h2>
        <p>Users and owners should communicate respectfully. Users and owners may hide messages locally, but permanent deletion and moderation are admin-only actions so disputes and fraud reports can be investigated with complete records.</p>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-4 text-base leading-8 text-slate-700">
      {content.split('\n').map((rawLine, index) => {
        const line = rawLine.trim()
        const key = `${fallbackPage.title}-${index}`
        if (!line) return null
        if (line === '---') return <hr key={key} className="my-8 border-slate-200" />
        if (line.startsWith('# ')) return <h2 key={key} className="pt-6 text-3xl font-semibold text-slate-950">{line.replace(/^#\s+/, '')}</h2>
        if (line.startsWith('## ')) return <h2 key={key} className="pt-6 text-2xl font-semibold text-slate-950">{line.replace(/^##\s+/, '')}</h2>
        if (line.startsWith('### ')) return <h3 key={key} className="pt-4 text-xl font-semibold text-slate-950">{line.replace(/^###\s+/, '')}</h3>
        if (/^\d+\.\s+/.test(line)) return <p key={key} className="pl-4">{line}</p>
        if (line.startsWith('* ')) return <p key={key} className="pl-5 before:mr-2 before:content-['•']">{line.replace(/^\*\s+/, '')}</p>
        return <p key={key}>{line.replace(/\*\*/g, '')}</p>
      })}
    </div>
  )
}

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
        <MarkdownContent content={legalMarkdown[slug]} fallbackPage={page} />
      </article>
    </main>
  )
}
