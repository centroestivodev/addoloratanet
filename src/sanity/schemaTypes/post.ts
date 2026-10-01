import {defineArrayMember, defineField, defineType} from 'sanity'
import {altField} from './imageAlt'
import {POST_BADGES} from '../lib/badges'

export default defineType({
  name: 'post',
  title: 'Post',
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
      name: 'publishedAt',
      title: 'Data di pubblicazione',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'badge',
      title: 'Etichetta',
      type: 'string',
      description: "Facoltativa. Compare accanto al titolo.",
      options: {list: POST_BADGES},
    }),
    defineField({
      name: 'images',
      title: 'Immagini',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [altField],
        }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
        }),
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [altField],
        }),
        defineArrayMember({
          type: 'youtube',
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'attachments',
      title: 'Allegati',
      type: 'array',
      description: 'File da scaricare, per esempio la locandina in PDF.',
      of: [
        defineArrayMember({
          type: 'file',
          fields: [
            defineField({
              name: 'title',
              title: 'Nome da mostrare',
              type: 'string',
              description: 'Se vuoto, si usa il nome del file.',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'tags',
      title: 'Tag',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'tag'}]})],
    }),
  ],
  orderings: [
    {
      title: 'Data di pubblicazione',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'images.0',
      publishedAt: 'publishedAt',
    },
    prepare({title, media, publishedAt}) {
      return {
        title,
        media,
        subtitle: publishedAt
          ? `Pubblicato il ${new Date(publishedAt).toLocaleDateString('it-IT')}`
          : '',
      }
    },
  },
})
