import {defineArrayMember, defineField, defineType} from 'sanity'

const TIME = /^([01]?\d|2[0-3]):[0-5]\d$/

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
      description: 'Scrivi un orario alla volta e premi Invio, ad esempio 9:00 oppure 15:30. Sostituiscono gli orari normali di quel giorno.',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .custom((times) => {
            const wrong = ((times as string[] | undefined) ?? []).find((t) => !TIME.test(t))
            return wrong ? `"${wrong}" non è un orario: scrivilo come 9:00 o 15:30` : true
          }),
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
