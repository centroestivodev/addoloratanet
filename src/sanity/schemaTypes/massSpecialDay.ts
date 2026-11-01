import {defineArrayMember, defineField, defineType} from 'sanity'
import {isValidTime, TIME_ERROR} from '../lib/eventDate'

// Un giorno in cui le Messe non seguono gli orari normali: sostituisce quelli feriali o festivi
export default defineType({
  name: 'massSpecialDay',
  title: 'Orari speciali delle Messe',
  type: 'document',
  fields: [
    defineField({
      name: 'date',
      title: 'Giorno',
      type: 'date',
      options: {dateFormat: 'DD/MM/YYYY'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'times',
      title: 'Orari delle Messe',
      type: 'array',
      description: 'Aggiungi una riga per ogni orario, ad esempio 15:30. Sostituiscono gli orari normali di quel giorno.',
      of: [
        defineArrayMember({
          type: 'string',
          validation: (Rule) =>
            Rule.required().custom((time) => (!time || isValidTime(time as string) ? true : TIME_ERROR)),
        }),
      ],
      validation: (Rule) => Rule.required().min(1).unique(),
    }),
    defineField({
      name: 'note',
      title: 'Motivo',
      type: 'string',
      description: 'Facoltativo. Ad esempio: Commemorazione dei defunti.',
    }),
  ],
  orderings: [{title: 'Giorno', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]}],
  preview: {
    select: {date: 'date', note: 'note', times: 'times'},
    prepare({date, note, times}) {
      const day = date ? date.split('-').reverse().join('/') : 'Giorno da scegliere'
      return {title: note ? `${day} · ${note}` : day, subtitle: (times ?? []).join(', ')}
    },
  },
})
