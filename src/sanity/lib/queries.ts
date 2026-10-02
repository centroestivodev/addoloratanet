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
