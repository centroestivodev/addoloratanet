import {defineArrayMember, defineField, defineType} from 'sanity'
import {altField} from './imageAlt'

export default defineType({
  name: 'product',
  title: 'Prodotto (cassa)',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nome',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Foto',
      type: 'image',
      options: {hotspot: true},
      fields: [altField],
    }),
    defineField({
      name: 'price',
      title: 'Prezzo (€)',
      type: 'number',
      description:
        'Prezzo di una porzione, in euro, usato in tutti gli eventi che non ne indicano uno proprio. Per una combo è il prezzo della combo intera.',
      validation: (Rule) => Rule.required().min(0).precision(2),
    }),
    defineField({
      name: 'isCombo',
      title: 'È una combo',
      type: 'boolean',
      description:
        'Una combo è composta da altri prodotti. In cassa, se nel conto ci sono tutti i prodotti della combo presi separatamente, viene proposto di passare alla combo.',
      initialValue: false,
    }),
    defineField({
      name: 'description',
      title: 'Descrizione',
      type: 'string',
      description: 'Facoltativa. Una riga che compare sotto il nome, utile per le combo.',
      hidden: ({document}) => !document?.isCombo,
    }),
    defineField({
      name: 'comboItems',
      title: 'Prodotti della combo',
      type: 'array',
      hidden: ({document}) => !document?.isCombo,
      of: [
        defineArrayMember({
          type: 'object',
          name: 'comboItem',
          fields: [
            defineField({
              name: 'product',
              title: 'Prodotto',
              type: 'reference',
              to: [{type: 'product'}],
              options: {filter: 'isCombo != true'},
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'quantity',
              title: 'Quantità',
              type: 'number',
              initialValue: 1,
              validation: (Rule) => Rule.required().integer().min(1),
            }),
          ],
          preview: {
            select: {title: 'product.name', quantity: 'quantity', media: 'product.image'},
            prepare({title, quantity, media}) {
              return {title: title || 'Prodotto', subtitle: `× ${quantity ?? 1}`, media}
            },
          },
        }),
      ],
      validation: (Rule) =>
        Rule.custom((items, context) =>
          (context.document as {isCombo?: boolean} | undefined)?.isCombo && (!items || (items as unknown[]).length < 2)
            ? 'Una combo ha bisogno di almeno due prodotti.'
            : true,
        ),
    }),
    defineField({
      name: 'events',
      title: 'Eventi in cui si vende',
      type: 'array',
      description:
        'La cassa mostra il prodotto solo negli eventi elencati qui. Se in un evento il prezzo è diverso, scrivilo nel campo "Prezzo per questo evento"; se lo lasci vuoto vale il prezzo del prodotto.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'productEvent',
          fields: [
            defineField({
              name: 'event',
              title: 'Evento',
              type: 'reference',
              to: [{type: 'cassaEvent'}],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'price',
              title: 'Prezzo per questo evento (€)',
              type: 'number',
              description: 'Facoltativo. Vuoto = stesso prezzo del prodotto.',
              validation: (Rule) => Rule.min(0).precision(2),
            }),
          ],
          preview: {
            select: {event: 'event.title', price: 'price'},
            prepare({event, price}) {
              const euro = typeof price === 'number' ? `€ ${price.toFixed(2).replace('.', ',')}` : 'prezzo standard'
              return {title: event || 'Evento', subtitle: euro}
            },
          },
        }),
      ],
      validation: (Rule) =>
        Rule.custom((items) => {
          const ids = ((items as {event?: {_ref?: string}}[] | undefined) ?? []).map((i) => i.event?._ref).filter(Boolean)
          return new Set(ids).size === ids.length ? true : 'Lo stesso evento compare due volte.'
        }),
    }),
    defineField({
      name: 'order',
      title: 'Posizione',
      type: 'number',
      description: 'Facoltativa. Numeri più bassi compaiono prima in cassa.',
    }),
    defineField({
      name: 'hidden',
      title: 'Nascondi dalla cassa',
      type: 'boolean',
      description: 'Per tenere il prodotto in archivio senza mostrarlo in cassa.',
      initialValue: false,
    }),
  ],
  orderings: [
    {title: 'Posizione', name: 'order', by: [{field: 'order', direction: 'asc'}, {field: 'name', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'name', price: 'price', isCombo: 'isCombo', media: 'image'},
    prepare({title, price, isCombo, media}) {
      const euro = typeof price === 'number' ? `€ ${price.toFixed(2).replace('.', ',')}` : ''
      return {title, subtitle: [isCombo ? 'Combo' : null, euro].filter(Boolean).join(' · '), media}
    },
  },
})
