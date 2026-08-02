import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bangaloreLocalities, blogPosts, faqGroups, getFaqRecords, legalPages, recommendationPosts, siteConfig } from '../src/data/seoContent.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '../public')

const routes = [
  ['/', 'daily', '1.0'],
  ['/properties', 'daily', '0.9'],
  ['/bangalore', 'weekly', '0.95'],
  ...bangaloreLocalities.map((item) => [`/bangalore/${item.slug}`, 'weekly', '0.9']),
  ...Object.values(faqGroups).map((group) => [`/${group.slug}`, 'monthly', '0.75']),
  ...Object.entries(faqGroups).flatMap(([key, group]) =>
    getFaqRecords(key).slice(0, 40).map((item) => [`/${group.slug}/${item.slug}`, 'monthly', '0.65']),
  ),
  ...blogPosts.map((post) => [`/blogs/${post.slug}`, 'monthly', '0.72']),
  ...recommendationPosts.map((post) => [`/recommendations/${post.slug}`, 'monthly', '0.7']),
  ...Object.keys(legalPages).map((slug) => [`/${slug}`, 'yearly', '0.45']),
]

const seen = new Set()
const urls = routes
  .filter(([path]) => {
    if (seen.has(path)) return false
    seen.add(path)
    return true
  })
  .map(([path, changefreq, priority]) => (
    `  <url><loc>${siteConfig.domain}${path}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
  ))
  .join('\n')

writeFileSync(
  resolve(publicDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
)

writeFileSync(
  resolve(publicDir, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /login\nDisallow: /signup\nDisallow: /admin-login\n\nSitemap: ${siteConfig.domain}/sitemap.xml\n`,
)
