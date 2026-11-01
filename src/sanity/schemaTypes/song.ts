import {defineArrayMember, defineField, defineType} from 'sanity'
import {isKnownChord, songChords} from '../../lib/chordpro'

const CODE_LENGTH = 6
const CODE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

function randomCode(): string {
  const values = crypto.getRandomValues(new Uint32Array(CODE_LENGTH))
  return Array.from(values, (value) => CODE_ALPHABET[value % CODE_ALPHABET.length]).join('')
}

export default defineType({
  name: 'song',
  title: 'Canto',
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
    // Come tipo slug ha già il pulsante Generate e il controllo che non sia usato da un altro canto
    defineField({
      name: 'code',
      title: 'Codice per il libretto',
      type: 'slug',
      description: 'Identifica il canto nei link dei libretti: se lo cambi, i libretti già condivisi non lo troveranno più.',
      options: {source: () => randomCode()},
      initialValue: () => ({_type: 'slug', current: randomCode()}),
      validation: (Rule) =>
        Rule.required().custom((code) => {
          const current = (code as {current?: string} | undefined)?.current
          return !current || /^[a-z0-9]+$/.test(current) ? true : 'Usa solo lettere minuscole e numeri, senza trattini'
        }),
    }),
    defineField({
      name: 'author',
      title: 'Autore',
      type: 'string',
      description: 'Facoltativo.',
    }),
    defineField({
      name: 'categories',
      title: 'Categorie',
      type: 'array',
      description: 'Un canto può stare in più categorie.',
      of: [defineArrayMember({type: 'reference', to: [{type: 'songCategory'}]})],
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'lyrics',
      title: 'Testo e accordi',
      type: 'text',
      rows: 20,
      description:
        "Scrivi ogni accordo tra parentesi quadre, subito prima della sillaba su cui cade: [Do]Alleluia, [Sol]canta il po[Lam]polo tuo. Lascia una riga vuota tra le strofe. Racchiudi il ritornello tra {soc} e {eoc}; quando si ripete, scrivi solo {chorus}. Per dare un nome a una strofa: {c: Finale}.",
      validation: (Rule) => [
        Rule.required(),
        Rule.custom((lyrics) => {
          if (!lyrics) return true
          const unknown = songChords(lyrics).filter((chord) => !isKnownChord(chord))
          return unknown.length
            ? `Accordi non riconosciuti, non cambieranno con la tonalità: ${[...new Set(unknown)].join(', ')}`
            : true
        }).warning(),
      ],
    }),
  ],
  orderings: [{title: 'Titolo', name: 'titleAsc', by: [{field: 'title', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', subtitle: 'author'},
  },
})
