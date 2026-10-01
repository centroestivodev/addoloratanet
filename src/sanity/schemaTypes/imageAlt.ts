import {defineField} from 'sanity'

export const altField = defineField({
  name: 'alt',
  title: 'Descrizione immagine',
  type: 'string',
  description:
    "Una frase che descrive l'immagine, per chi non può vederla. Facoltativa.",
})
