import { Link, Navigate, useParams } from 'react-router-dom'
import SEO from '../components/SEO'
import { faqGroups, getFaqItems, siteConfig } from '../data/seoContent'

const slugify = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export default function FAQPage() {
  const { category } = useParams()
  const groupKey = category || 'general'
  const group = faqGroups[groupKey]
  if (!group) {
    const directItems = getFaqItems('general')
    const direct = directItems.find(([question]) => slugify(question) === category)
    if (!direct) return <Navigate to="/faq" replace />
    const [question, answer] = direct
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [{ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } }],
    }
    return (
      <main className="bg-white px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
        <SEO title={question} description={answer} path={`/faq/${category}`} keywords={['PG in Bangalore', question, 'StayJi FAQ']} schema={schema} />
        <article className="mx-auto max-w-4xl">
          <nav className="text-sm text-slate-500"><Link to="/" className="hover:text-blue-600">Home</Link> / <Link to="/faq" className="hover:text-blue-600">FAQ</Link></nav>
          <h1 className="mt-6 text-4xl font-semibold text-slate-950 sm:text-5xl">{question}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{answer}</p>
          <div className="mt-8 grid gap-6 text-base leading-8 text-slate-700">
            <h2 className="text-2xl font-semibold text-slate-950">Bangalore-focused guidance</h2>
            <p>When choosing a PG or co-living stay in Bangalore, compare total monthly cost, commute, food quality, safety, deposit rules, visitor policy, and verified availability. StayJi keeps phone numbers private initially so users can message owners, request callbacks, and book visits through a controlled lead flow.</p>
            <h2 className="text-2xl font-semibold text-slate-950">What StayJi verifies</h2>
            <p>StayJi is structured around verified listings, visit requests, lead history, admin moderation, fraud detection, and move-in confirmation. After a user joins a property, the “Moved In Successfully” workflow helps verify proof before cashback, vendor commission, or conversion analytics are processed.</p>
            <h3 className="text-xl font-semibold text-slate-950">Related locality searches</h3>
            <p>Explore Whitefield, Electronic City, HSR Layout, Marathahalli, Bellandur, Koramangala, Indiranagar, Hebbal, Yelahanka, Sarjapur Road, JP Nagar, BTM Layout, and KR Puram for Bangalore-specific PG options.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/bangalore" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Explore Bangalore</Link>
            <Link to="/blog" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Read guides</Link>
          </div>
        </article>
      </main>
    )
  }

  const items = getFaqItems(groupKey)
  const path = `/${group.slug}`
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }

  return (
    <main className="bg-white px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <SEO
        title={group.title}
        description={group.intro}
        path={path}
        keywords={['PG in Bangalore', 'Bangalore PG FAQs', group.title, 'StayJi']}
        schema={schema}
      />
      <div className="mx-auto max-w-5xl">
        <nav className="text-sm text-slate-500">
          <Link to="/" className="hover:text-blue-600">Home</Link> / <span>{group.title}</span>
        </nav>
        <header className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Bangalore accommodation help</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-5xl">{group.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{group.intro}</p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {items.slice(0, 16).map(([question, answer]) => (
            <article key={question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-base font-semibold text-slate-950">{question}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{answer}</p>
              <Link to={groupKey === 'general' ? `/faq/${slugify(question)}` : `${path}/${slugify(question)}`} className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                Read More
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-2xl bg-slate-950 p-6 text-white">
          <h2 className="text-2xl font-semibold">Need help finding a Bangalore PG?</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Search verified stays by locality, rent, sharing, food, and visit availability, or contact {siteConfig.email}.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/properties?search=Bangalore" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950">Explore Bangalore PGs</Link>
            <Link to="/bangalore" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white">Bangalore guide</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
