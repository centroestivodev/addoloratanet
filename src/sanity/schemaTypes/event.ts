import {defineArrayMember, defineField, defineType} from 'sanity'
import {altField} from './imageAlt'

// Orari a passi di 15 minuti, salvati come "HH:mm" (ora di Roma, senza fuso)
const TIME_OPTIONS = Array.from({length: 96}, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, '0')
  const m = String((i % 4) * 15).padStart(2, '0')
  return `${h}:${m}`
})

export default defineType({
  name: 'event',
  title: 'Evento',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titolo',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descrizione',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Immagine',
      type: 'image',
      options: {hotspot: true},
      fields: [altField],
    }),
    defineField({
      name: 'eventDate',
      title: 'Data',
      type: 'date',
      description: "Il giorno dell'evento (o il primo giorno, se dura più giorni).",
      options: {dateFormat: 'DD/MM/YYYY'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startTime',
      title: 'Ora di inizio',
      type: 'string',
      description: "Facoltativa. Lasciala vuota se l'orario non è definito.",
      options: {list: TIME_OPTIONS},
    }),
    defineField({
      name: 'endDate',
      title: 'Data di fine',
      type: 'date',
      description: "Solo per gli eventi di più giorni, come un pellegrinaggio.",
      options: {dateFormat: 'DD/MM/YYYY'},
      validation: (Rule) =>
        Rule.custom((endDate, context) => {
          const start = (context.document as {eventDate?: string} | undefined)?.eventDate
          if (!endDate || !start) return true
          return endDate >= start ? true : 'La data di fine non può essere prima della data di inizio'
        }),
    }),
    defineField({
      name: 'endTime',
      title: 'Ora di fine',
      type: 'string',
      description: 'Facoltativa. Senza data di fine, vale per lo stesso giorno.',
      options: {list: TIME_OPTIONS},
      validation: (Rule) =>
        Rule.custom((endTime, context) => {
          const doc = context.document as
            | {eventDate?: string; endDate?: string; startTime?: string}
            | undefined
          const sameDay = !doc?.endDate || doc.endDate === doc.eventDate
          if (!endTime || !doc?.startTime || !sameDay) return true
          return endTime > doc.startTime
            ? true
            : "L'ora di fine deve essere dopo l'ora di inizio"
        }),
    }),
    defineField({
      name: 'relatedPost',
      title: 'Articolo collegato',
      type: 'reference',
      to: [{type: 'post'}],
      description:
        "Facoltativo. Per gli incontri di un percorso: il post che lo presenta. Nella pagina del post compariranno tutti gli incontri collegati.",
    }),
    defineField({
      name: 'tags',
      title: 'Tag',
      type: 'array',
      description:
        "Facoltativi. Servono a filtrare il calendario. Se c'è un articolo collegato, l'evento eredita anche i suoi tag.",
      of: [defineArrayMember({type: 'reference', to: [{type: 'tag'}]})],
      validation: (Rule) => Rule.unique(),
    }),
  ],
  orderings: [
    {
      title: 'Data evento',
      name: 'eventDateDesc',
      by: [
        {field: 'eventDate', direction: 'desc'},
        {field: 'startTime', direction: 'desc'},
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      eventDate: 'eventDate',
      startTime: 'startTime',
    },
    prepare({title, media, eventDate, startTime}) {
      const day = eventDate
        ? new Date(`${String(eventDate).slice(0, 10)}T12:00:00Z`).toLocaleDateString('it-IT')
        : ''
      return {
        title,
        media,
        subtitle: [day, startTime].filter(Boolean).join(' · '),
      }
    },
  },
})
