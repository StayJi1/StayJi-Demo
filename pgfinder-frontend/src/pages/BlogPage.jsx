import { Link, Navigate, useParams } from 'react-router-dom'
import SEO from '../components/SEO'
import { blogPosts, bangaloreLocalities, siteConfig } from '../data/seoContent'

export default function BlogPage() {
  const { slug } = useParams()
  if (!slug) {
    return (
      <main className="bg-white px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
        <SEO title="StayJi Bangalore PG Guides" description="Bangalore PG, hostel, co-living, deposit, visit booking, and locality guides from StayJi." path="/blog" keywords={['Bangalore PG blog', 'PG guide Bangalore']} />
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-semibold text-slate-950">Bangalore PG and rental guides</h1>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {blogPosts.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 hover:border-blue-300">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">{post.locality}</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">{post.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{post.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    )
  }

  const post = blogPosts.find((item) => item.slug === slug)
  if (!post) return <Navigate to="/blog" replace />
  const locality = bangaloreLocalities.find((item) => item.name === post.locality)
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    author: { '@type': 'Organization', name: siteConfig.name },
    publisher: { '@type': 'Organization', name: siteConfig.name },
    mainEntityOfPage: `${siteConfig.domain}/blog/${post.slug}`,
  }

  return (
    <main className="bg-white px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      <SEO title={post.title} description={post.description} path={`/blog/${post.slug}`} keywords={['PG in Bangalore', post.locality, 'StayJi guide']} schema={schema} />
      <article className="mx-auto max-w-4xl">
        <nav className="text-sm text-slate-500"><Link to="/blog" className="hover:text-blue-600">Blog</Link> / {post.title}</nav>
        <h1 className="mt-6 text-4xl font-semibold text-slate-950 sm:text-5xl">{post.title}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">{post.description}</p>
        <div className="mt-8 grid gap-6 text-base leading-8 text-slate-700">
          <p>Start with commute. A PG that looks cheaper can become expensive if the daily travel time is high. For Bangalore, compare metro access, BMTC routes, office shuttles, and peak traffic before booking a visit.</p>
          <p>Next compare the total monthly cost: rent, food, deposit, electricity, laundry, WiFi, maintenance, AC charges, and notice period. StayJi listings are structured to help renters compare these details before speaking to a vendor.</p>
          <p>For safety, prefer verified properties with CCTV, secure entry, transparent house rules, and responsive vendors. Students and working professionals should also check late entry rules, visitor policy, and nearby food availability.</p>
          {locality ? <p>{locality.overview} {locality.price}</p> : null}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to={`/properties?search=${encodeURIComponent(post.locality)}`} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Search {post.locality} stays</Link>
          {locality ? <Link to={`/bangalore/${locality.slug}`} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Read locality guide</Link> : <Link to="/bangalore" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Read Bangalore guide</Link>}
        </div>
      </article>
    </main>
  )
}

