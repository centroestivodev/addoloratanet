import type {APIRoute} from 'astro'
import {sanityClient} from 'sanity:client'

// File .ics dell'evento, per aggiungerlo al calendario del telefono o del computer
export const prerender = false

const escape = (text: string) => text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')
const compact = (date: string) => date.slice(0, 10).replace(/-/g, '')

function nextDay(date: string) {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
}

export const GET: APIRoute = async ({params, site, url}) => {
  const event = await sanityClient.fetch(
    `*[_type == "event" && slug.current == $slug][0]{ title, description, eventDate, startTime, endDate, endTime }`,
    {slug: params.slug},
  )
  if (!event) return new Response('Evento non trovato', {status: 404})

  const last = event.endDate || event.eventDate
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Parrocchia S. M. Addolorata//IT',
    'BEGIN:VEVENT',
    `UID:${params.slug}@addolorata.net`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
  ]
  if (event.startTime) {
    lines.push(`DTSTART;TZID=Europe/Rome:${compact(event.eventDate)}T${event.startTime.replace(':', '')}00`)
    if (event.endTime) lines.push(`DTEND;TZID=Europe/Rome:${compact(last)}T${event.endTime.replace(':', '')}00`)
  } else {
    lines.push(`DTSTART;VALUE=DATE:${compact(event.eventDate)}`, `DTEND;VALUE=DATE:${compact(nextDay(last))}`)
  }
  lines.push(
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(event.description ?? '')}`,
    'LOCATION:Parrocchia S. M. Addolorata\\, V.le della Venezia Giulia 134\\, 00177 Roma',
    `URL:${new URL(`/eventi/${params.slug}`, site ?? url.origin)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  )

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${params.slug}.ics"`,
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=300, stale-while-revalidate=3600',
    },
  })
}
