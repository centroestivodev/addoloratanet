import {defineField, defineType} from 'sanity'

export const YOUTUBE_URL = /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//

export default defineType({
  name: 'youtube',
  title: 'Video YouTube',
  type: 'object',
  fields: [
    defineField({
      name: 'url',
      title: 'Indirizzo del video',
      type: 'url',
      description: 'Copia qui il link del video da YouTube.',
      validation: (Rule) =>
        Rule.required().custom((url) =>
          !url || YOUTUBE_URL.test(url) ? true : 'Deve essere un link di YouTube',
        ),
    }),
  ],
  preview: {
    select: {url: 'url'},
    prepare({url}) {
      return {title: 'Video YouTube', subtitle: url}
    },
  },
})
