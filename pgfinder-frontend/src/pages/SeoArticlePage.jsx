import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import SEO from '../components/SEO'
import { blogPosts, buildSeoArticle, recommendationPosts, siteConfig } from '../data/seoContent'

export default function SeoArticlePage({ type = 'blog' }) {
  const { slug } = useParams()
  const location = useLocation()
  const isRecommendation = type === 'recommendation' || location.pathname.startsWith('/recommendations')
  const source = (isRecommendation ? recommendationPosts : blogPosts).find((item) => item.slug === slug)

  if (!source) return <Navigate to="/bangalore" replace />

  const article = buildSeoArticle(source, isRecommendation ? 'recommendation' : 'guide')
  const basePath = isRecommendation ? '/recommendations' : '/blogs'
  const path = `${basePath}/${source.slug}`
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        url: `${siteConfig.domain}${path}`,
        author: { '@type': 'Organization', name: siteConfig.name },
        publisher: { '@type': 'Organization', name: siteConfig.name },
        about: `${article.locality} PG accommodation in Bangalore`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
          { '@type': 'ListItem', position: 2, name: isRecommendation ? 'Recommendations' : 'Guides', item: `${siteConfig.domain}${basePath}` },
          { '@type': 'ListItem', position: 3, name: article.title, item: `${siteConfig.domain}${path}` },
        ],
      },
    ],
  }

  return (
    <main className="bg-white px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <SEO
        title={article.title}
        description={article.description}
        path={path}
        keywords={[article.title, `${article.locality} PG`, 'PG in Bangalore', 'StayJi']}
        schema={schema}
        type="article"
      />
      <article className="mx-auto max-w-4xl">
        <nav className="text-sm text-slate-500">
          <Link to="/" className="hover:text-blue-600">Home</Link> / <Link to="/bangalore" className="hover:text-blue-600">Bangalore</Link> / <span>{article.locality}</span>
        </nav>
        <header className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">{isRecommendation ? 'StayJi recommendation' : 'StayJi guide'}</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-5xl">{article.title}</h1>
          <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">{article.description}</p>
        </header>

        <div className="mt-8 grid gap-7 text-base leading-8 text-slate-700">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold leading-tight text-slate-950">{section.heading}</h2>
              <p className="mt-3">{section.body}</p>
            </section>
          ))}
        </div>

        <aside className="mt-10 rounded-2xl bg-slate-50 p-5 sm:p-6">
          <h2 className="text-2xl font-semibold text-slate-950">Continue on StayJi</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link to={`/properties?search=${encodeURIComponent(article.locality)}`} className="rounded-xl border border-slate-200 bg-white p-4 font-semibold text-slate-700 hover:text-blue-700">
              Search PGs in {article.locality}
            </Link>
            <Link to={`/bangalore/${article.related.locality?.slug || ''}`} className="rounded-xl border border-slate-200 bg-white p-4 font-semibold text-slate-700 hover:text-blue-700">
              Open locality guide
            </Link>
            {article.related.faqs.slice(0, 2).map((faq) => (
              <Link key={faq.slug} to={`/faq/bangalore-rentals/${faq.slug}`} className="rounded-xl border border-slate-200 bg-white p-4 font-semibold text-slate-700 hover:text-blue-700">
                {faq.title}
              </Link>
            ))}
          </div>
        </aside>
      </article>
    </main>
  )
}
