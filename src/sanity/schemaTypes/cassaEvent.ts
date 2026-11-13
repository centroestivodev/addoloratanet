import {defineField, defineType} from 'sanity'

// Un listino della cassa, di solito uno per festa o sagra. I prodotti si collegano a questi listini
export default defineType({
  name: 'cassaEvent',
  title: 'Listino (cassa)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Nome',
      type: 'string',
      description: 'Il nome che compare nel selettore in cima alla cassa, per esempio "Festa della parrocchia".',
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
