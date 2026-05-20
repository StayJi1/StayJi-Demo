import { useEffect } from 'react'
import { siteConfig } from '../data/seoContent'

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

export default function SEO({ title, description, path = '/', keywords = [], schema }) {
  useEffect(() => {
    const fullTitle = title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}`
    const canonical = `${siteConfig.domain}${path}`
    document.title = fullTitle
    setMeta('description', description)
    setMeta('keywords', keywords.join(', '))
    setMeta('og:title', fullTitle, 'property')
    setMeta('og:description', description, 'property')
    setMeta('og:url', canonical, 'property')
    setMeta('og:type', 'website', 'property')
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', description)
    setCanonical(canonical)

    const id = 'stayji-schema'
    document.getElementById(id)?.remove()
    if (schema) {
      const script = document.createElement('script')
      script.id = id
      script.type = 'application/ld+json'
      script.text = JSON.stringify(schema)
      document.head.appendChild(script)
    }
  }, [description, keywords, path, schema, title])

  return null
}

