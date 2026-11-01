// Header di cache per le route dinamiche. Il tag è uno solo perché una notizia nuova
// cambia home, elenchi e filtri: al Publish invalidiamo tutto insieme (netlify/functions/purge-cache.mts).
const BROWSER_CACHE = 'public, max-age=0, must-revalidate'
const CACHE_TAG = 'contenuti'

const CDN_MAX_AGE = 3600
const CDN_CACHE_NOT_FOUND = 'public, durable, s-maxage=60'

// Secondi che mancano alla mezzanotte di Roma
export function secondsToMidnightInRome(now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now)
  const value = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return 86400 - (value('hour') * 3600 + value('minute') * 60 + value('second'))
}

// s-maxage è la rete di sicurezza se il purge fallisce. Molte pagine mostrano "oggi", gli eventi
// futuri o le Messe del giorno: nessuna copia, nemmeno scaduta, deve essere servita dopo mezzanotte.
export function cdnCacheValue(now = new Date()): string {
  const left = secondsToMidnightInRome(now)
  const maxAge = Math.min(CDN_MAX_AGE, left)
  return `public, durable, s-maxage=${maxAge}, stale-while-revalidate=${left - maxAge}`
}

function applyCache(headers: Headers, cdnCache: string) {
  headers.set('Cache-Control', BROWSER_CACHE)
  headers.set('Netlify-CDN-Cache-Control', cdnCache)
  headers.set('Netlify-Cache-Tag', CACHE_TAG)
}

export function setCdnCache(headers: Headers) {
  applyCache(headers, cdnCacheValue())
}

export function setNotFoundCache(headers: Headers) {
  applyCache(headers, CDN_CACHE_NOT_FOUND)
}

// Risposta 404 da restituire da una pagina: Astro ci mostra la pagina 404 del sito
export function notFoundResponse() {
  const headers = new Headers()
  setNotFoundCache(headers)
  return new Response(null, {status: 404, headers})
}
