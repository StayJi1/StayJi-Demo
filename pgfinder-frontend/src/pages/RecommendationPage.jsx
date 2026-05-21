import { Link, Navigate, useParams } from 'react-router-dom'
import SEO from '../components/SEO'
import SeoContentCard from '../components/seo/SeoContentCard'
import { buildSeoArticle, recommendationPosts, siteConfig } from '../data/seoContent'

function RecommendationPage() {
  const { slug } = useParams()

  if (!slug) {
    return (
      <main className="bg-white px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
        <SEO title="StayJi Bangalore PG Recommendations" description="Locality-wise PG, hostel, and co-living recommendations for Bangalore renters." path="/recommendations" keywords={['Bangalore PG recommendations', 'StayJi']} />
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-semibold text-slate-950">Bangalore PG recommendations</h1>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {recommendationPosts.map((post) => <SeoContentCard key={post.slug} item={post} to={`/recommendations/${post.slug}`} eyebrow={post.locality} />)}
          </div>
        </div>
      </main>
    )
  }

  const post = recommendationPosts.find((item) => item.slug === slug)
  if (!post) return <Navigate to="/recommendations" replace />
  const article = buildSeoArticle(post, 'recommendation')
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Article', headline: article.title, description: article.description, author: { '@type': 'Organization', name: siteConfig.name }, mainEntityOfPage: `${siteConfig.domain}/recommendations/${post.slug}` },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain }, { '@type': 'ListItem', position: 2, name: 'Recommendations', item: `${siteConfig.domain}/recommendations` }, { '@type': 'ListItem', position: 3, name: article.title, item: `${siteConfig.domain}/recommendations/${post.slug}` }] },
    ],
  }

  return (
    <main className="bg-white px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      <SEO title={article.title} description={article.description} path={`/recommendations/${post.slug}`} keywords={['PG in Bangalore', article.locality, 'StayJi recommendations']} schema={schema} />
      <article className="mx-auto max-w-4xl">
        <nav className="text-sm text-slate-500"><Link to="/recommendations" className="hover:text-blue-600">Recommendations</Link> / {article.title}</nav>
        <h1 className="mt-6 text-4xl font-semibold text-slate-950 sm:text-5xl">{article.title}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">{article.description}</p>
        <div className="mt-8 grid gap-6 text-base leading-8 text-slate-700">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold text-slate-950">{section.heading}</h2>
              <p className="mt-3">{section.body}</p>
            </section>
          ))}
          <h2 className="text-2xl font-semibold text-slate-950">Related StayJi paths</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to={`/properties?search=${encodeURIComponent(article.locality)}`} className="rounded-xl border border-slate-200 p-4 font-semibold text-slate-700 hover:text-blue-700">Related properties in {article.locality}</Link>
            <Link to={`/bangalore/${article.related.locality?.slug || ''}`} className="rounded-xl border border-slate-200 p-4 font-semibold text-slate-700 hover:text-blue-700">Read locality guide</Link>
            {article.related.blogs.slice(0, 2).map((blog) => <Link key={blog.slug} to={`/blogs/${blog.slug}`} className="rounded-xl border border-slate-200 p-4 font-semibold text-slate-700 hover:text-blue-700">{blog.title}</Link>)}
            {article.related.faqs.slice(0, 2).map((faq) => <Link key={faq.slug} to={`/faq/bangalore-rentals/${faq.slug}`} className="rounded-xl border border-slate-200 p-4 font-semibold text-slate-700 hover:text-blue-700">{faq.title}</Link>)}
          </div>
        </div>
      </article>
    </main>
  )
}

export default RecommendationPage
