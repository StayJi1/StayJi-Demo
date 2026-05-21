import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import SEO from '../components/SEO'
import SeoContentCard from '../components/seo/SeoContentCard'
import Loader from '../components/common/Loader'
import PropertyCard from '../components/property/PropertyCard'
import PropertyMap from '../components/map/PropertyMap'
import propertyService from '../services/propertyService'
import { bangaloreLocalities, blogPosts, getFaqRecords, recommendationPosts, siteConfig } from '../data/seoContent'

const bangaloreOverview = {
  slug: '',
  name: 'Bangalore',
  title: 'PG in Bangalore',
  keywords: ['PG in Bangalore', 'Boys PG in Bangalore', 'Girls PG in Bangalore', 'Affordable PG Bangalore', 'Co-living Bangalore'],
  overview: 'StayJi helps students and working professionals discover verified PGs, hostels, co-living rooms, flats, and short stays across Bangalore localities.',
  itParks: ['Whitefield IT corridor', 'Electronic City', 'Outer Ring Road', 'Manyata Tech Park', 'Bagmane Tech Park'],
  transport: 'Bangalore commute planning should consider metro access, BMTC routes, office shuttles, and peak traffic around IT corridors.',
  safety: 'Shortlist verified properties with CCTV, transparent deposits, secure entry, and responsive vendors.',
  food: 'Most PG markets offer meal plans, mess options, cafes, restaurants, and delivery services.',
  price: 'Bangalore PG pricing depends on locality, sharing type, meals, AC, deposit, and proximity to offices or colleges.',
}

const pageSize = 6

export default function LocalityPage() {
  const { localitySlug } = useParams()
  const locality = localitySlug ? bangaloreLocalities.find((item) => item.slug === localitySlug) : bangaloreOverview
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('recommended')
  const [gender, setGender] = useState('')
  const [category, setCategory] = useState('')
  const [visibleCount, setVisibleCount] = useState(pageSize)

  useEffect(() => {
    if (!locality) return undefined
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      setVisibleCount(pageSize)
      try {
        const data = await propertyService.fetchProperties(
          locality.slug ? { cityName: 'Bangalore', areaName: locality.name } : { cityName: 'Bangalore' },
        )
        if (active) setProperties(data || [])
      } catch (err) {
        if (active) {
          setProperties([])
          setError(err?.message || 'Unable to load locality listings.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [locality])

  const filteredProperties = useMemo(() => {
    return properties
      .filter((property) => (gender ? property.gender === gender : true))
      .filter((property) => (category ? property.category === category || property.type === category : true))
      .sort((a, b) => {
        if (sortBy === 'price-low') return (Number(a.rent) || 0) - (Number(b.rent) || 0)
        if (sortBy === 'price-high') return (Number(b.rent) || 0) - (Number(a.rent) || 0)
        if (sortBy === 'rating') return (Number(b.rating) || 0) - (Number(a.rating) || 0)
        return (Number(b.isFeatured) - Number(a.isFeatured)) || ((Number(b.boostScore) || 0) - (Number(a.boostScore) || 0))
      })
  }, [category, gender, properties, sortBy])

  if (!locality) return <Navigate to="/bangalore" replace />

  const visibleProperties = filteredProperties.slice(0, visibleCount)
  const avgRent = filteredProperties.length
    ? Math.round(filteredProperties.reduce((sum, item) => sum + (Number(item.rent) || 0), 0) / filteredProperties.length)
    : 0
  const girlsCount = filteredProperties.filter((item) => item.gender === 'Girls').length
  const boysCount = filteredProperties.filter((item) => item.gender === 'Boys').length
  const colivingCount = filteredProperties.filter((item) => item.gender === 'Co-ed' || /co.?living/i.test(`${item.category} ${item.description}`)).length
  const path = locality.slug ? `/bangalore/${locality.slug}` : '/bangalore'
  const faqs = getFaqRecords('bangalore-rentals')
    .filter((faq) => !locality.slug || faq.locality === locality.name || faq.locality === 'Bangalore')
    .slice(0, 8)
  const relatedBlogs = blogPosts.filter((post) => post.locality === locality.name || post.locality === 'Bangalore').slice(0, 4)
  const relatedRecommendations = recommendationPosts.filter((post) => post.locality === locality.name).slice(0, 4)
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${siteConfig.name} - ${locality.title}`,
    url: `${siteConfig.domain}${path}`,
    about: locality.overview,
    mainEntity: visibleProperties.map((property) => ({
      '@type': 'Accommodation',
      name: property.name,
      address: property.address,
      aggregateRating: { '@type': 'AggregateRating', ratingValue: property.rating || 4.6, reviewCount: 1 },
    })),
  }

  return (
    <main className="bg-white text-slate-900">
      <SEO
        title={`${locality.title} - Verified PGs, Hostels and Co-living`}
        description={`${locality.overview} Compare rent, amenities, visits, reviews, safety, and locality details on StayJi.`}
        path={path}
        keywords={locality.keywords}
        schema={schema}
      />
      <section className="bg-slate-950 px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav className="text-sm text-slate-400">
            <Link to="/" className="hover:text-white">Home</Link> / <Link to="/bangalore" className="hover:text-white">Bangalore</Link>{locality.slug ? ` / ${locality.name}` : ''}
          </nav>
          <div className="mt-8 max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Dynamic Bangalore locality marketplace</p>
            <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">{locality.title}</h1>
            <p className="mt-5 text-lg leading-8 text-slate-300">{locality.overview}</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Live listings', filteredProperties.length],
              ['Average rent', avgRent ? `₹${avgRent.toLocaleString('en-IN')}` : 'Updating'],
              ['Girls PG options', girlsCount],
              ['Boys PG options', boysCount || colivingCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <select value={gender} onChange={(event) => setGender(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <option value="">All genders</option>
                  <option value="Boys">Boys PG</option>
                  <option value="Girls">Girls PG</option>
                  <option value="Co-ed">Co-living</option>
                </select>
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <option value="">All stay types</option>
                  <option value="PG">PG</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Flat">Flat</option>
                  <option value="Hotel">Hotel</option>
                </select>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price low to high</option>
                  <option value="price-high">Price high to low</option>
                  <option value="rating">Rating</option>
                </select>
                <Link to={`/properties?search=${encodeURIComponent(locality.name)}`} className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white">
                  Advanced search
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-2">
              {loading ? (
                <Loader message="Loading locality listings..." />
              ) : error ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</p>
              ) : visibleProperties.length ? (
                visibleProperties.map((property) => <PropertyCard key={property.id || property._id} property={property} />)
              ) : (
                <p className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-slate-600">No verified listings match these filters yet.</p>
              )}
            </div>
            {visibleCount < filteredProperties.length ? (
              <button type="button" onClick={() => setVisibleCount((count) => count + pageSize)} className="mt-8 w-full rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">
                Load more listings
              </button>
            ) : null}
          </div>

          <aside className="space-y-6">
            <div className="h-80 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 lg:sticky lg:top-24">
              <PropertyMap properties={filteredProperties} center={filteredProperties[0]?.location} />
            </div>
            {[
              ['Nearby IT parks', locality.itParks.join(', ')],
              ['Metro and bus connectivity', locality.transport],
              ['Safety checklist', locality.safety],
              ['Hospitals and malls nearby', `${locality.name} renters should compare commute to hospitals, grocery stores, malls, pharmacies, and late-night food options before booking.`],
              ['Rent trends', locality.price],
            ].map(([title, text]) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </aside>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-semibold text-slate-950">Related Bangalore locality pages</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {bangaloreLocalities.map((item) => (
              <Link key={item.slug} to={`/bangalore/${item.slug}`} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700">
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-semibold text-slate-950">{locality.name} FAQs and recommendations</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <SeoContentCard key={faq.slug} item={faq} to={`/faq/bangalore-rentals/${faq.slug}`} eyebrow="FAQ" />
            ))}
            {relatedBlogs.map((post) => (
              <SeoContentCard key={post.slug} item={post} to={`/blogs/${post.slug}`} eyebrow="Guide" />
            ))}
            {relatedRecommendations.map((post) => (
              <SeoContentCard key={post.slug} item={post} to={`/recommendations/${post.slug}`} eyebrow="Recommendation" />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
