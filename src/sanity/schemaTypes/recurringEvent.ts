import {defineArrayMember, defineField, defineType} from 'sanity'

// Orari a passi di 5 minuti, salvati come "HH:mm": servono anche orari come le 12:40
const TIME_OPTIONS = Array.from({length: 288}, (_, i) => {
  const h = String(Math.floor(i / 12)).padStart(2, '0')
  const m = String((i % 12) * 5).padStart(2, '0')
  return `${h}:${m}`
})

const WEEKDAYS = [
  {title: 'Lunedì', value: 1},
  {title: 'Martedì', value: 2},
  {title: 'Mercoledì', value: 3},
  {title: 'Giovedì', value: 4},
  {title: 'Venerdì', value: 5},
  {title: 'Sabato', value: 6},
  {title: 'Domenica', value: 0},
]

type Doc = {frequency?: string; weekday?: number; dates?: string[]} | undefined

export default defineType({
  name: 'recurringEvent',
  title: 'Appuntamento fisso',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titolo',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'frequency',
      title: 'Quando',
      type: 'string',
      options: {
        list: [
          {title: 'Ogni settimana', value: 'weekly'},
          {title: 'Solo in certe date', value: 'dates'},
        ],
        layout: 'radio',
      },
      initialValue: 'weekly',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'weekday',
      title: 'Giorno della settimana',
      type: 'number',
      options: {list: WEEKDAYS},
      hidden: ({document}) => (document as Doc)?.frequency === 'dates',
      validation: (Rule) =>
        Rule.custom((weekday, context) => {
          if ((context.document as Doc)?.frequency === 'dates') return true
          return weekday === undefined ? 'Scegli il giorno della settimana' : true
        }),
    }),
    defineField({
      name: 'dates',
      title: 'Date',
      type: 'array',
      description: 'I giorni in cui si svolge. Nelle altre date non comparirà.',
      of: [defineArrayMember({type: 'date', options: {dateFormat: 'DD/MM/YYYY'}})],
      hidden: ({document}) => (document as Doc)?.frequency !== 'dates',
      validation: (Rule) =>
        Rule.custom((dates, context) => {
          if ((context.document as Doc)?.frequency !== 'dates') return true
          return (dates as string[] | undefined)?.length ? true : 'Aggiungi almeno una data'
        }),
    }),
    defineField({
      name: 'startTime',
      title: 'Ora di inizio',
      type: 'string',
      options: {list: TIME_OPTIONS},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endTime',
      title: 'Ora di fine',
      type: 'string',
      description: 'Facoltativa.',
      options: {list: TIME_OPTIONS},
    }),
    defineField({
      name: 'skippedDates',
      title: 'Date saltate',
      type: 'array',
      description: 'I giorni in cui non si svolge: in quelle date non comparirà.',
      of: [defineArrayMember({type: 'date', options: {dateFormat: 'DD/MM/YYYY'}})],
      hidden: ({document}) => (document as Doc)?.frequency === 'dates',
    }),
    defineField({
      name: 'validFrom',
      title: 'Attivo dal',
      type: 'date',
      description: 'Facoltativo. Per le attività che si fermano, come in estate.',
      options: {dateFormat: 'DD/MM/YYYY'},
      hidden: ({document}) => (document as Doc)?.frequency === 'dates',
    }),
    defineField({
      name: 'validUntil',
      title: 'Attivo fino al',
      type: 'date',
      description: 'Facoltativo.',
      options: {dateFormat: 'DD/MM/YYYY'},
      hidden: ({document}) => (document as Doc)?.frequency === 'dates',
    }),
  ],
  preview: {
    select: {title: 'title', frequency: 'frequency', weekday: 'weekday', startTime: 'startTime'},
    prepare({title, frequency, weekday, startTime}) {
      const day = frequency === 'dates' ? 'Solo in certe date' : WEEKDAYS.find((d) => d.value === weekday)?.title
      return {title, subtitle: [day, startTime].filter(Boolean).join(' · ')}
    },
  },
})
