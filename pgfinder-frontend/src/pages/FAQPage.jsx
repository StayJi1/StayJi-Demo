import { Link, Navigate, useParams } from 'react-router-dom'
import SEO from '../components/SEO'
import SeoContentCard from '../components/seo/SeoContentCard'
import { buildSeoArticle, faqGroups, getFaqItems, getFaqRecords, siteConfig } from '../data/seoContent'

const slugify = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export default function FAQPage() {
  const { category } = useParams()
  const groupKey = category || 'general'
  const group = faqGroups[groupKey]
  if (!group) {
    const direct = getFaqRecords('general').find((item) => item.slug === category)
    if (!direct) return <Navigate to="/faq" replace />
    const article = buildSeoArticle(direct, 'faq')
    const question = direct.question || direct.title
    const answer = direct.answer || direct.summary
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } }] },
        { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain }, { '@type': 'ListItem', position: 2, name: 'FAQ', item: `${siteConfig.domain}/faq` }, { '@type': 'ListItem', position: 3, name: question, item: `${siteConfig.domain}/faq/${category}` }] },
      ],
    }
    return (
      <main className="bg-white px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
        <SEO title={question} description={answer} path={`/faq/${category}`} keywords={['PG in Bangalore', question, 'StayJi FAQ']} schema={schema} />
        <article className="mx-auto max-w-4xl">
          <nav className="text-sm text-slate-500"><Link to="/" className="hover:text-blue-600">Home</Link> / <Link to="/faq" className="hover:text-blue-600">FAQ</Link></nav>
          <h1 className="mt-6 text-4xl font-semibold text-slate-950 sm:text-5xl">{question}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{answer}</p>
          <div className="mt-8 grid gap-6 text-base leading-8 text-slate-700">
            {article.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-semibold text-slate-950">{section.heading}</h2>
                <p className="mt-3">{section.body}</p>
              </section>
            ))}
            <h2 className="text-2xl font-semibold text-slate-950">Related StayJi reading</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {article.related.blogs.slice(0, 2).map((post) => <Link key={post.slug} to={`/blogs/${post.slug}`} className="rounded-xl border border-slate-200 p-4 font-semibold text-slate-700 hover:text-blue-700">{post.title}</Link>)}
              {article.related.recommendations.slice(0, 2).map((post) => <Link key={post.slug} to={`/recommendations/${post.slug}`} className="rounded-xl border border-slate-200 p-4 font-semibold text-slate-700 hover:text-blue-700">{post.title}</Link>)}
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/bangalore" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Explore Bangalore</Link>
            <Link to="/blogs" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Read guides</Link>
          </div>
        </article>
      </main>
    )
  }

  const items = getFaqItems(groupKey)
  const records = getFaqRecords(groupKey)
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
          {items.slice(0, 48).map(([question, answer]) => (
            <SeoContentCard key={question} item={{ title: question, summary: answer }} to={groupKey === 'general' ? `/faq/${slugify(question)}` : `${path}/${slugify(question)}`} eyebrow="FAQ" />
          ))}
          {groupKey === 'general' ? records.slice(0, 1).map((item) => <SeoContentCard key={item.slug} item={item} to={`/faq/${item.slug}`} eyebrow="Featured guide" />) : null}
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
