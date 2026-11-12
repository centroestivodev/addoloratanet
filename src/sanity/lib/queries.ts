import type {EventSchedule} from './eventDate'

export interface Tag {
  name: string
  slug: string
  color?: string
}

export interface EventCard extends EventSchedule {
  _id: string
  title: string
  slug: string
  description: string
  image?: any
  imageDimensions?: {width: number; height: number}
  tags: Tag[]
}

export interface PostCard {
  _id: string
  title: string
  slug: string
  publishedAt: string
  cover?: any
  body?: any[]
  tags?: Tag[]
  // Id dell'asset del primo PDF allegato: se la notizia non ha foto, la card ne mostra la prima pagina
  pdfId?: string
}

// Il tag delle comunicazioni del parroco si riconosce dallo slug e si mostra in evidenza
export const PARROCO_TAG = 'comunicazione-del-parroco'

export const isParrocoPost = (post: {tags?: (Tag | null)[] | null}) =>
  post.tags?.some((tag) => tag?.slug === PARROCO_TAG) ?? false

// Una notizia con data futura resta nascosta finché non arriva il suo momento
export const PUBLISHED_POST = `coalesce(publishedAt, _createdAt) <= now()`

export const TAG_FIELDS = `name, "slug": slug.current, "color": color.hex`

// I tag di un evento sono i suoi più quelli dell'articolo collegato, tranne quello del parroco
// che riguarda la notizia e non l'evento
export const EVENT_CARD_FIELDS = `
  _id, title, "slug": slug.current, description, image,
  "imageDimensions": image.asset->metadata.dimensions,
  eventDate, startTime, endDate, endTime,
  "tags": *[_type == "tag" && slug.current != "${PARROCO_TAG}" && (_id in coalesce(^.tags[]._ref, []) || _id in coalesce(^.relatedPost->tags[]._ref, []))] | order(name asc){ ${TAG_FIELDS} }
`

export const POST_CARD_FIELDS = `
  _id, title, "slug": slug.current, body,
  "publishedAt": coalesce(publishedAt, _createdAt),
  "cover": images[0],
  "pdfId": attachments[asset->extension == "pdf"][0].asset._ref,
  "tags": tags[]->{ ${TAG_FIELDS} }
`

export const RECURRING_EVENTS = `*[_type == "recurringEvent"]{
  _id, title, frequency, weekday, dates, skippedDates, validFrom, validUntil, startTime, endTime
}`

export interface MassSpecialDay {
  date: string
  times: string[]
  note?: string
}

export const MASS_SPECIAL_DAY_FIELDS = `date, times, note`

export interface EventToday extends EventSchedule {
  _id: string
  title: string
  slug: string
}

export const EVENT_TODAY_FIELDS = `_id, title, "slug": slug.current, eventDate, startTime, endDate, endTime`

export interface SongCategory {
  name: string
  slug: string
}

export interface Song {
  _id: string
  title: string
  slug: string
  code?: string
  author?: string
  lyrics: string
  categories: SongCategory[]
}

export const SONG_CATEGORY_FIELDS = `name, "slug": slug.current`

export const SONG_FIELDS = `
  _id, title, "slug": slug.current, "code": code.current, author, lyrics,
  "categories": coalesce(categories[]->{ ${SONG_CATEGORY_FIELDS} }, [])
`

// Cassa: prodotti e combo. Il prezzo in Sanity è in euro, in cassa si calcola in centesimi.
export interface CassaProductDoc {
  id: string
  name: string
  description?: string
  priceCents: number
  isCombo: boolean
  image?: any
  components: {productId: string; quantity: number}[]
}

export const CASSA_PRODUCTS = `*[_type == "product" && hidden != true && defined(price)]
  | order(coalesce(order, 9999) asc, name asc){
    "id": _id, name, description, "priceCents": round(price * 100), "isCombo": coalesce(isCombo, false), image,
    "components": select(isCombo == true => comboItems[defined(product._ref)]{ "productId": product._ref, "quantity": coalesce(quantity, 1) }, [])
  }`

// Immagine di una card notizia: la foto, altrimenti la prima pagina del PDF allegato
export const pdfPreviewUrl = (pdfId: string) => `/pdf-preview/${pdfId}.jpg`
