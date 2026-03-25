import {defineField, defineType} from 'sanity'

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
    }),
    defineField({
      name: 'eventDate',
      title: 'Data e orario evento',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      eventDate: 'eventDate',
    },
    prepare({title, media, eventDate}) {
      return {
        title,
        media,
        subtitle: eventDate
          ? new Date(eventDate).toLocaleString('it-IT')
          : '',
      }
    },
  },
})