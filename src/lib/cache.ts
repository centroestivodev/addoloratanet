// Header di cache per le route dinamiche. Il tag è uno solo perché una notizia nuova
// cambia home, elenchi e filtri: al Publish invalidiamo tutto insieme (netlify/functions/purge-cache.mts).
const BROWSER_CACHE = 'public, max-age=0, must-revalidate'
const CACHE_TAG = 'contenuti'

// s-maxage è la rete di sicurezza se il purge fallisce e il ritardo normale per ciò che dipende
// dall'orario; per una pagina ferma da tempo il primo visitatore può ricevere una copia vecchia fino a un giorno.
const CDN_CACHE = 'public, durable, s-maxage=3600, stale-while-revalidate=86400'
const CDN_CACHE_NOT_FOUND = 'public, durable, s-maxage=60'

function applyCache(headers: Headers, cdnCache: string) {
  headers.set('Cache-Control', BROWSER_CACHE)
  headers.set('Netlify-CDN-Cache-Control', cdnCache)
  headers.set('Netlify-Cache-Tag', CACHE_TAG)
}

export function setCdnCache(headers: Headers) {
  applyCache(headers, CDN_CACHE)
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
