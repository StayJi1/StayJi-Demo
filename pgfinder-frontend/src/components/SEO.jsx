import { useEffect } from 'react'
import { siteConfig } from '../data/seoContent'
import { defaultSeoImage, graphSchema } from '../utils/seoSchemas'

function setMeta(name, content, attribute = 'name') {
  if (!content) return
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setCanonical(url) {
  let element = document.head.querySelector('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }
  element.setAttribute('href', url)
}

function absoluteImageUrl(image) {
  if (!image) return defaultSeoImage
  if (/^https?:\/\//i.test(image)) return image
  return `${siteConfig.domain}${image.startsWith('/') ? image : `/${image}`}`
}

export default function SEO({ title, description, path = '/', keywords = [], schema, noindex = false, image = defaultSeoImage, type = 'website' }) {
  useEffect(() => {
    const fullTitle = title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}`
    const canonical = `${siteConfig.domain}${path}`
    const socialImage = absoluteImageUrl(image)
    document.title = fullTitle
    document.documentElement.lang = 'en-IN'
    setMeta('description', description)
    setMeta('keywords', keywords.join(', '))
    setMeta('author', siteConfig.name)
    setMeta('geo.region', 'IN-KA')
    setMeta('geo.placename', 'Bangalore')
    setMeta('theme-color', '#0f172a')
    setMeta('og:title', fullTitle, 'property')
    setMeta('og:description', description, 'property')
    setMeta('og:url', canonical, 'property')
    setMeta('og:type', type, 'property')
    setMeta('og:image', socialImage, 'property')
    setMeta('og:locale', 'en_IN', 'property')
    setMeta('og:site_name', siteConfig.name, 'property')
    setMeta('twitter:image', socialImage)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', description)
    setMeta('robots', noindex ? 'noindex,nofollow' : 'index,follow')
    setCanonical(canonical)

    const id = 'stayji-schema'
    document.getElementById(id)?.remove()
    const activeSchema = schema || graphSchema()
    if (activeSchema) {
      const script = document.createElement('script')
      script.id = id
      script.type = 'application/ld+json'
      script.text = JSON.stringify(activeSchema)
      document.head.appendChild(script)
    }
  }, [description, image, keywords, noindex, path, schema, title, type])

  return null
}
