import type {APIRoute} from 'astro'
import {setCdnCache} from '../lib/cache'
import {sanityClient} from '../sanity/lib/client'
import {PUBLISHED_POST} from '../sanity/lib/queries'

export const prerender = false

const STATIC_PATHS = [
  '/',
  '/notizie',
  '/eventi',
  '/info',
  '/info/orari',
  '/info/contatti',
  '/info/dove-siamo',
  '/info/attivita',
  '/sostienici',
]

interface Entry {
  slug: string
  updatedAt: string
}

export const GET: APIRoute = async ({site, url}) => {
  const {posts, events} = await sanityClient.fetch<{posts: Entry[]; events: Entry[]}>(
    `{
      "posts": *[_type == "post" && defined(slug.current) && ${PUBLISHED_POST}]{ "slug": slug.current, "updatedAt": _updatedAt },
      "events": *[_type == "event" && defined(slug.current)]{ "slug": slug.current, "updatedAt": _updatedAt }
    }`,
  )

  const origin = site ?? url.origin
  const entry = (path: string, lastmod?: string) =>
    `<url><loc>${new URL(path, origin)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`
  const urls = [
    ...STATIC_PATHS.map((path) => entry(path)),
    ...posts.map((p) => entry(`/notizie/${encodeURIComponent(p.slug)}`, p.updatedAt)),
    ...events.map((e) => entry(`/eventi/${encodeURIComponent(e.slug)}`, e.updatedAt)),
  ]

  const headers = new Headers({'Content-Type': 'application/xml; charset=utf-8'})
  setCdnCache(headers)
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
    {headers},
  )
}
