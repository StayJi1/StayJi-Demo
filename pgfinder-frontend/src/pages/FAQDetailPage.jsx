import { Link, Navigate, useParams } from 'react-router-dom'
import SEO from '../components/SEO'
import { faqGroups, getFaqItems, siteConfig } from '../data/seoContent'

const slugify = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export default function FAQDetailPage() {
  const { category, faqSlug } = useParams()
  const groupKey = category || 'general'
  const group = faqGroups[groupKey]
  if (!group) return <Navigate to="/faq" replace />

  const items = getFaqItems(groupKey)
  const item = items.find(([question]) => slugify(question) === faqSlug) || items[0]
  if (!item) return <Navigate to={`/${group.slug}`} replace />

  const [question, answer] = item
  const path = `/${group.slug}/${slugify(question)}`
  const related = items.filter(([relatedQuestion]) => relatedQuestion !== question).slice(0, 5)
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    }],
  }

  return (
    <main className="bg-white px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      <SEO title={question} description={answer} path={path} keywords={['PG in Bangalore', group.title, question]} schema={schema} />
      <article className="mx-auto max-w-4xl">
        <nav className="text-sm text-slate-500"><Link to="/faq" className="hover:text-blue-600">FAQs</Link> / <Link to={`/${group.slug}`} className="hover:text-blue-600">{group.title}</Link></nav>
        <h1 className="mt-6 text-4xl font-semibold text-slate-950 sm:text-5xl">{question}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">{answer}</p>

        <section className="mt-8 grid gap-6 text-base leading-8 text-slate-700">
          <h2 className="text-2xl font-semibold text-slate-950">Short answer for Bangalore renters</h2>
          <p>{answer} On StayJi, the safest way to make a decision is to compare locality, commute, rent, deposit, sharing type, food, vacancy, photos, reviews, and visit availability before sharing sensitive information or paying anyone.</p>
          <h2 className="text-2xl font-semibold text-slate-950">What to check before choosing</h2>
          <p>For Bangalore PG searches, always compare the total monthly cost rather than rent alone. Ask about electricity, food, laundry, WiFi, maintenance, lock-in, notice period, security deposit, refund timeline, guest policy, late entry policy, and whether the listed room is actually available now.</p>
          <h3 className="text-xl font-semibold text-slate-950">Locality and commute</h3>
          <p>Whitefield, Electronic City, Bellandur, Marathahalli, HSR Layout, Koramangala, Indiranagar, Hebbal, JP Nagar, BTM Layout, KR Puram, Sarjapur Road, and Yelahanka can feel very different during office hours. Check metro access, BMTC routes, office shuttles, cab availability, and walking safety around the exact building.</p>
          <h3 className="text-xl font-semibold text-slate-950">Safety and verification</h3>
          <p>Prefer verified listings with clear photos, address consistency, owner or vendor identity, CCTV, secure entry, fire safety basics, written rules, and transparent deposits. Report suspicious pricing, duplicate photos, abusive messages, pressure to pay outside the platform, or fake availability claims.</p>
          <h2 className="text-2xl font-semibold text-slate-950">How StayJi helps</h2>
          <p>StayJi is being built as a Bangalore-focused accommodation discovery and lead-management platform. The platform connects users, vendors, and admins through structured property data, visit requests, inquiries, wishlist activity, reviews, notifications, and moderation workflows so decisions are easier to track and safer to audit.</p>
        </section>

        <aside className="mt-10 rounded-2xl bg-slate-50 p-6">
          <h2 className="text-2xl font-semibold text-slate-950">Related FAQs</h2>
          <div className="mt-4 grid gap-3">
            {related.map(([relatedQuestion]) => (
              <Link key={relatedQuestion} to={`/${group.slug}/${slugify(relatedQuestion)}`} className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 hover:text-blue-700">
                {relatedQuestion}
              </Link>
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-500">Need help? Contact {siteConfig.email}.</p>
        </aside>
      </article>
    </main>
  )
}

