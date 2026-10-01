import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nome',
      type: 'string',
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
      name: 'color',
      title: 'Colore',
      type: 'color',
      description: 'Facoltativo. Il colore con cui il tag compare sul sito.',
      options: {
        disableAlpha: true,
        colorList: ['#1d4ed8', '#0f766e', '#15803d', '#a16207', '#c2410c', '#b91c1c', '#9d174d', '#6d28d9'],
      },
    }),
  ],
  preview: {
    select: {title: 'name', hex: 'color.hex'},
    prepare({title, hex}) {
      return {title, subtitle: hex}
    },
  },
})
