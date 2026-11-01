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
  badge?: string
  publishedAt: string
  cover?: any
  body?: any[]
  tags?: Tag[]
}

// Una notizia con data futura resta nascosta finché non arriva il suo momento
export const PUBLISHED_POST = `coalesce(publishedAt, _createdAt) <= now()`

export const TAG_FIELDS = `name, "slug": slug.current, "color": color.hex`

// I tag di un evento sono i suoi più quelli dell'articolo collegato
export const EVENT_CARD_FIELDS = `
  _id, title, "slug": slug.current, description, image,
  "imageDimensions": image.asset->metadata.dimensions,
  eventDate, startTime, endDate, endTime,
  "tags": *[_type == "tag" && (_id in coalesce(^.tags[]._ref, []) || _id in coalesce(^.relatedPost->tags[]._ref, []))] | order(name asc){ ${TAG_FIELDS} }
`

export const POST_CARD_FIELDS = `
  _id, title, "slug": slug.current, badge, body,
  "publishedAt": coalesce(publishedAt, _createdAt),
  "cover": images[0],
  "tags": tags[]->{ ${TAG_FIELDS} }
`

export const PARROCO_BADGE = 'comunicazione-parroco'

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
