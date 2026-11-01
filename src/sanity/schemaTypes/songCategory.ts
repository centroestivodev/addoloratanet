import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'songCategory',
  title: 'Categoria di canti',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nome',
      type: 'string',
      description: 'Ad esempio "Canti d\'ingresso" o "Canti d\'Avvento".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Ordine',
      type: 'number',
      description: 'Facoltativo. Le categorie con il numero più basso compaiono per prime.',
    }),
  ],
  orderings: [
    {title: 'Ordine', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}, {field: 'name', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'name'},
  },
})
