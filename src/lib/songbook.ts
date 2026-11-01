// Libretto dei canti: la scaletta sta tutta nell'indirizzo (/canti/libretto/codice-codice-…),
// così si condivide con un link senza salvare nulla. Ogni canto ha un campo `code` su Sanity:
// il link resta valido anche se si corregge il titolo.

export const MAX_SONGS = 40

export interface BookEntry {
  code: string
  title: string
}

export const bookUrl = (codes: string[]) => `/canti/libretto/${codes.join('-')}`

// Il libretto in preparazione resta nel browser, così sopravvive al cambio di categoria
const STORAGE_KEY = 'libretto-canti'

export function loadBook(): BookEntry[] {
  try {
    const entries = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(entries) ? entries.filter((e) => e?.code && e?.title) : []
  } catch {
    return []
  }
}

export function saveBook(entries: BookEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Senza spazio di archiviazione il libretto vale finché si resta sulla pagina
  }
}
