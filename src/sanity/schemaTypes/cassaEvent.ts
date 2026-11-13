import {defineField, defineType} from 'sanity'

// Un evento per cui la cassa ha un listino (feste, sagre...). I prodotti si collegano a questi eventi
export default defineType({
  name: 'cassaEvent',
  title: 'Evento (cassa)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Nome',
      type: 'string',
      description: 'Il nome che compare nel selettore in cima alla cassa.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Posizione',
      type: 'number',
      description: 'Facoltativa. Numeri più bassi compaiono prima nel selettore; il primo è quello preselezionato.',
    }),
  ],
  orderings: [
    {title: 'Posizione', name: 'order', by: [{field: 'order', direction: 'asc'}, {field: 'title', direction: 'asc'}]},
  ],
  preview: {select: {title: 'title'}},
})
