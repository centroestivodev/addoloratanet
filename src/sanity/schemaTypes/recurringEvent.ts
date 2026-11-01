import {defineArrayMember, defineField, defineType} from 'sanity'
import {isTimeAfter, isValidTime, TIME_ERROR} from '../lib/eventDate'

const WEEKDAYS = [
  {title: 'Lunedì', value: 1},
  {title: 'Martedì', value: 2},
  {title: 'Mercoledì', value: 3},
  {title: 'Giovedì', value: 4},
  {title: 'Venerdì', value: 5},
  {title: 'Sabato', value: 6},
  {title: 'Domenica', value: 0},
]

type Doc = {frequency?: string; weekday?: number; dates?: string[]; startTime?: string} | undefined

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
      description: 'Ad esempio 11:00.',
      validation: (Rule) =>
        Rule.required().custom((time) => (!time || isValidTime(time as string) ? true : TIME_ERROR)),
    }),
    defineField({
      name: 'endTime',
      title: 'Ora di fine',
      type: 'string',
      description: 'Facoltativa. Ad esempio 12:40.',
      validation: (Rule) =>
        Rule.custom((time, context) => {
          if (!time) return true
          if (!isValidTime(time)) return TIME_ERROR
          const start = (context.document as Doc)?.startTime
          return !start || !isValidTime(start) || isTimeAfter(time, start)
            ? true
            : "L'ora di fine deve essere dopo l'ora di inizio"
        }),
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
