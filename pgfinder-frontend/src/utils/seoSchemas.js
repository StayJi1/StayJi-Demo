import { bangaloreLocalities, siteConfig } from '../data/seoContent'

const absoluteUrl = (path = '/') => `${siteConfig.domain}${path.startsWith('/') ? path : `/${path}`}`

const cleanText = (value = '') => value.toString().replace(/\s+/g, ' ').trim()

export const defaultSeoImage = absoluteUrl('/stayji-logo.png')

export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': `${siteConfig.domain}/#organization`,
    name: siteConfig.name,
    url: siteConfig.domain,
    logo: defaultSeoImage,
    description: 'StayJi is a PG accommodation platform for verified PGs, hostels, co-living rooms, flats, and short stays in Bangalore, Karnataka, India.',
    email: siteConfig.email,
    telephone: siteConfig.phone,
    areaServed: {
      '@type': 'City',
      name: 'Bangalore',
      addressRegion: 'Karnataka',
      addressCountry: 'IN',
    },
    contactPoint: [{
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: siteConfig.email,
      telephone: siteConfig.phone,
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi', 'Kannada'],
    }],
  }
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${siteConfig.domain}/#website`,
    url: siteConfig.domain,
    name: siteConfig.name,
    publisher: { '@id': `${siteConfig.domain}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.domain}/properties?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function localBusinessSchema() {
  return {
    '@type': 'LocalBusiness',
    '@id': `${siteConfig.domain}/#localbusiness`,
    name: siteConfig.name,
    url: siteConfig.domain,
    image: defaultSeoImage,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bangalore',
      addressRegion: 'Karnataka',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 12.9716,
      longitude: 77.5946,
    },
    areaServed: bangaloreLocalities.map((locality) => ({
      '@type': 'Place',
      name: `${locality.name}, Bangalore`,
    })),
  }
}

export function breadcrumbSchema(items = []) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function faqSchema(items = []) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  }
}

export function graphSchema(nodes = []) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationSchema(),
      websiteSchema(),
      localBusinessSchema(),
      ...nodes.filter(Boolean),
    ],
  }
}

export function propertySeo(property = {}) {
  const name = cleanText(property.name || property.propertyName || 'Verified PG')
  const area = cleanText(property.area || property.areaName || property.locationLabel || 'Bangalore')
  const city = cleanText(property.city || property.cityName || 'Bangalore')
  const gender = cleanText(property.gender || property.genderType || '')
  const type = cleanText(property.propertyType || property.category || property.type || 'PG')
  const rent = property.rent ? ` from ₹${property.rent}/month` : ''
  const genderPhrase = gender && !/co-ed/i.test(gender) ? `${gender} ` : ''
  const title = `${name} | ${genderPhrase}${type} in ${area} ${city} | ${siteConfig.name}`
  const description = cleanText(`${name} is a verified ${genderPhrase}${type} in ${area}, ${city}${rent}. Compare amenities, food, sharing, live vacancy, reviews, map location, and contact the owner on StayJi.`)
  return { title, description, area, city, type, name }
}

export function propertySchema(property = {}, path = '/') {
  const seo = propertySeo(property)
  const image = property.image || property.propertyImage || property.propertyImageUrls?.[0] || defaultSeoImage
  const lat = property.location?.lat || property.latitude
  const lng = property.location?.lng || property.longitude
  const rent = Number(property.rent)
  const rating = Number(property.rating || property.reviewSummary?.averageRating || 4.6)
  const reviewCount = Number(property.reviewSummary?.reviewsCount || property.reviewsCount || 1)

  return {
    '@type': ['Residence', 'Place', 'Product'],
    '@id': `${absoluteUrl(path)}#property`,
    name: seo.name,
    description: seo.description,
    url: absoluteUrl(path),
    image: {
      '@type': 'ImageObject',
      url: image,
      caption: `${seo.name} in ${seo.area}, ${seo.city}`,
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: cleanText(property.address || property.locationLabel || seo.area),
      addressLocality: seo.area,
      addressRegion: 'Karnataka',
      addressCountry: 'IN',
    },
    geo: lat && lng ? {
      '@type': 'GeoCoordinates',
      latitude: lat,
      longitude: lng,
    } : undefined,
    amenityFeature: (property.amenities || property.customFeatures || []).slice(0, 12).map((amenity) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
      value: true,
    })),
    offers: Number.isFinite(rent) ? {
      '@type': 'Offer',
      price: rent,
      priceCurrency: 'INR',
      availability: property.availableBeds || property.isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/LimitedAvailability',
      url: absoluteUrl(path),
    } : undefined,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount: Math.max(1, reviewCount),
    },
  }
}

export function localitySchema(locality, properties = [], path = '/') {
  return graphSchema([
    {
      '@type': 'CollectionPage',
      '@id': `${absoluteUrl(path)}#collection`,
      name: `${locality.title} - verified PGs and co-living on StayJi`,
      url: absoluteUrl(path),
      description: locality.overview,
      about: {
        '@type': 'Place',
        name: `${locality.name}, Bangalore`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: locality.name,
          addressRegion: 'Karnataka',
          addressCountry: 'IN',
        },
      },
      mainEntity: properties.slice(0, 12).map((property) => propertySchema(property, `/properties/${property.id || property._id}`)),
    },
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Bangalore', path: '/bangalore' },
      ...(locality.slug ? [{ name: locality.name, path }] : []),
    ]),
  ])
}
