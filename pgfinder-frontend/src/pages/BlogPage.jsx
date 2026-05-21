import { Link, Navigate, useParams } from 'react-router-dom'
import SEO from '../components/SEO'
import SeoContentCard from '../components/seo/SeoContentCard'
import { blogPosts, bangaloreLocalities, buildSeoArticle, siteConfig } from '../data/seoContent'

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
              <SeoContentCard key={post.slug} item={post} to={`/blogs/${post.slug}`} eyebrow={post.locality} />
            ))}
          </div>
        </div>
      </main>
    )
  }

  const post = blogPosts.find((item) => item.slug === slug)
  if (!post) return <Navigate to="/blog" replace />
  const locality = bangaloreLocalities.find((item) => item.name === post.locality)
  const article = buildSeoArticle(post, 'blog')
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BlogPosting', headline: post.title, description: post.description, author: { '@type': 'Organization', name: siteConfig.name }, publisher: { '@type': 'Organization', name: siteConfig.name }, mainEntityOfPage: `${siteConfig.domain}/blogs/${post.slug}` },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain }, { '@type': 'ListItem', position: 2, name: 'Blogs', item: `${siteConfig.domain}/blogs` }, { '@type': 'ListItem', position: 3, name: post.title, item: `${siteConfig.domain}/blogs/${post.slug}` }] },
    ],
  }

  return (
    <main className="bg-white px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      <SEO title={post.title} description={post.description} path={`/blogs/${post.slug}`} keywords={['PG in Bangalore', post.locality, 'StayJi guide']} schema={schema} />
      <article className="mx-auto max-w-4xl">
        <nav className="text-sm text-slate-500"><Link to="/blogs" className="hover:text-blue-600">Blogs</Link> / {post.title}</nav>
        <h1 className="mt-6 text-4xl font-semibold text-slate-950 sm:text-5xl">{post.title}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">{post.description}</p>
        <div className="mt-8 grid gap-6 text-base leading-8 text-slate-700">
          <p>Start with commute. A PG that looks cheaper can become expensive if the daily travel time is high. For Bangalore, compare metro access, BMTC routes, office shuttles, and peak traffic before booking a visit.</p>
          <p>Next compare the total monthly cost: rent, food, deposit, electricity, laundry, WiFi, maintenance, AC charges, and notice period. StayJi listings are structured to help renters compare these details before speaking to a vendor.</p>
          <p>For safety, prefer verified properties with CCTV, secure entry, transparent house rules, and responsive vendors. Students and working professionals should also check late entry rules, visitor policy, and nearby food availability.</p>
          {locality ? <p>{locality.overview} {locality.price}</p> : null}
          <h2 className="text-2xl font-semibold text-slate-950">How to compare listings like a local</h2>
          <p>In Bangalore, the right PG is rarely just the lowest rent. A room near a tech park can save an hour of daily travel, while a cheaper stay two signals away can become expensive through cabs, food delivery, and lost time. Compare exact street location, walking distance to bus stops or metro, office shuttle pickup points, and how the route behaves during rain and evening traffic.</p>
          <p>For students, the same logic applies to college timings, library access, exam season routines, and food availability after classes. A PG with a study table, quiet floor, reliable WiFi, and predictable meals can be better than a newer property with weak management. For remote workers, power backup, desk space, call-friendly rooms, and router placement matter as much as the bed count.</p>
          <h2 className="text-2xl font-semibold text-slate-950">Rent, deposit, and monthly cost</h2>
          <p>Always ask what the advertised rent includes. Many PGs include breakfast and dinner but charge separately for electricity, AC, laundry, parking, or weekend lunch. Deposit can vary by locality and room type, so compare refund rules, notice period, lock-in period, and deductions for damages. StayJi property cards are designed to expose rent, deposit, room inventory, food availability, amenities, reviews, and lead actions in a structured way.</p>
          <p>If you are comparing premium co-living with a traditional PG, calculate the total value. Premium rooms may include better cleaning, app-based support, community areas, AC, managed maintenance, and faster issue resolution. Budget PGs can still be a strong choice when the owner is responsive, the building is safe, and the commute is short.</p>
          <h2 className="text-2xl font-semibold text-slate-950">Safety and verification checklist</h2>
          <p>Before paying, verify owner identity, room photos, live vacancy, address consistency, CCTV, visitor logs, secure entry, fire safety basics, and house rules. Girls PG searches should give extra weight to road lighting, late-entry policy, staff availability, women-only floors where needed, and how quickly management responds to issues. Reviews are useful when they mention specifics like food quality, cleaning frequency, water supply, WiFi stability, and deposit handling.</p>
          <p>StayJi supports a traceable lead flow through inquiries, callback requests, visit requests, vendor responses, notifications, reviews, and move-in confirmation. That matters because users and vendors both get a clearer record of what was promised, when a visit was booked, and how the lead moved through the funnel.</p>
          <h2 className="text-2xl font-semibold text-slate-950">Related StayJi paths</h2>
          <p>After reading this guide, compare live listings for the locality, open related FAQs for deposit and safety questions, and review nearby alternatives. Bangalore searches often work best when you shortlist two budget options, two commute-friendly options, and one premium option, then book visits close together so the room quality and management style are easy to compare.</p>
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold text-slate-950">{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
          <h2 className="text-2xl font-semibold text-slate-950">Related FAQs and recommendations</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {article.related.faqs.slice(0, 2).map((faq) => <Link key={faq.slug} to={`/faq/bangalore-rentals/${faq.slug}`} className="rounded-xl border border-slate-200 p-4 font-semibold text-slate-700 hover:text-blue-700">{faq.title}</Link>)}
            {article.related.recommendations.slice(0, 2).map((recommendation) => <Link key={recommendation.slug} to={`/recommendations/${recommendation.slug}`} className="rounded-xl border border-slate-200 p-4 font-semibold text-slate-700 hover:text-blue-700">{recommendation.title}</Link>)}
          </div>
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to={`/properties?search=${encodeURIComponent(post.locality)}`} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Search {post.locality} stays</Link>
          {locality ? <Link to={`/bangalore/${locality.slug}`} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Read locality guide</Link> : <Link to="/bangalore" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Read Bangalore guide</Link>}
        </div>
      </article>
    </main>
  )
}
