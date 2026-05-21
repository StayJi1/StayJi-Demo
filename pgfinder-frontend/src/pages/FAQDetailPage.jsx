import { Link, Navigate, useParams } from 'react-router-dom'
import SEO from '../components/SEO'
import { buildSeoArticle, faqGroups, getFaqRecords, siteConfig } from '../data/seoContent'

const slugify = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export default function FAQDetailPage() {
  const { category, faqSlug } = useParams()
  const groupKey = category || 'general'
  const group = faqGroups[groupKey]
  if (!group) return <Navigate to="/faq" replace />

  const items = getFaqRecords(groupKey)
  const item = items.find((record) => slugify(record.question || record.title) === faqSlug || record.slug === faqSlug) || items[0]
  if (!item) return <Navigate to={`/${group.slug}`} replace />

  const question = item.question || item.title
  const answer = item.answer || item.summary
  const article = buildSeoArticle(item, 'faq')
  const path = `/${group.slug}/${slugify(question)}`
  const related = items.filter((relatedItem) => (relatedItem.question || relatedItem.title) !== question).slice(0, 5)
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } }] },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain }, { '@type': 'ListItem', position: 2, name: group.title, item: `${siteConfig.domain}/${group.slug}` }, { '@type': 'ListItem', position: 3, name: question, item: `${siteConfig.domain}${path}` }] },
    ],
  }

  return (
    <main className="bg-white px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      <SEO title={question} description={answer} path={path} keywords={['PG in Bangalore', group.title, question]} schema={schema} />
      <article className="mx-auto max-w-4xl">
        <nav className="text-sm text-slate-500"><Link to="/faq" className="hover:text-blue-600">FAQs</Link> / <Link to={`/${group.slug}`} className="hover:text-blue-600">{group.title}</Link></nav>
        <h1 className="mt-6 text-4xl font-semibold text-slate-950 sm:text-5xl">{question}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">{answer}</p>

        <section className="mt-8 grid gap-6 text-base leading-8 text-slate-700">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold text-slate-950">{section.heading}</h2>
              <p className="mt-3">{section.body}</p>
            </section>
          ))}
          <h2 className="text-2xl font-semibold text-slate-950">Internal links for deeper research</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to={`/properties?search=${encodeURIComponent(article.locality)}`} className="rounded-xl border border-slate-200 p-4 font-semibold text-slate-700 hover:text-blue-700">Related properties in {article.locality}</Link>
            <Link to={`/bangalore/${article.related.locality?.slug || ''}`} className="rounded-xl border border-slate-200 p-4 font-semibold text-slate-700 hover:text-blue-700">Locality guide</Link>
            {article.related.blogs.slice(0, 2).map((post) => <Link key={post.slug} to={`/blogs/${post.slug}`} className="rounded-xl border border-slate-200 p-4 font-semibold text-slate-700 hover:text-blue-700">{post.title}</Link>)}
          </div>
        </section>

        <aside className="mt-10 rounded-2xl bg-slate-50 p-6">
          <h2 className="text-2xl font-semibold text-slate-950">Related FAQs</h2>
          <div className="mt-4 grid gap-3">
            {related.map((relatedItem) => (
              <Link key={relatedItem.slug} to={`/${group.slug}/${slugify(relatedItem.question || relatedItem.title)}`} className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 hover:text-blue-700">
                {relatedItem.question || relatedItem.title}
              </Link>
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-500">Need help? Contact {siteConfig.email}.</p>
        </aside>
      </article>
    </main>
  )
}
