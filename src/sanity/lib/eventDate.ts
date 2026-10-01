export interface EventSchedule {
  eventDate: string
  startTime?: string
  endDate?: string
  endTime?: string
}

// Le date sono giorni di calendario ("YYYY-MM-DD"): le trattiamo in UTC per non
// farle slittare di un giorno in base al fuso del server di build.
function toUtcDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

// Data di oggi a Roma, nel formato dei campi `date` di Sanity ("YYYY-MM-DD")
export function todayInRome(): string {
  return new Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Rome'}).format(new Date())
}

const full = new Intl.DateTimeFormat('it-IT', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'})
const dayMonth = new Intl.DateTimeFormat('it-IT', {day: 'numeric', month: 'long', timeZone: 'UTC'})
const dayOnly = new Intl.DateTimeFormat('it-IT', {day: 'numeric', timeZone: 'UTC'})

function formatTimes(startTime?: string, endTime?: string): string {
  if (startTime && endTime) return `dalle ${startTime} alle ${endTime}`
  if (startTime) return `ore ${startTime}`
  if (endTime) return `fino alle ${endTime}`
  return ''
}

export function formatEventDate({eventDate, startTime, endDate, endTime}: EventSchedule): string {
  const start = toUtcDate(eventDate)
  const multiDay = endDate && endDate.slice(0, 10) !== eventDate.slice(0, 10)

  if (!multiDay) {
    const times = formatTimes(startTime, endTime)
    return times ? `${full.format(start)}, ${times}` : full.format(start)
  }

  const end = toUtcDate(endDate)
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear()
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth()
  const range = sameMonth
    ? `${dayOnly.format(start)}–${full.format(end)}`
    : sameYear
      ? `${dayMonth.format(start)} – ${full.format(end)}`
      : `${full.format(start)} – ${full.format(end)}`

  return startTime ? `${range}, inizio ore ${startTime}` : range
}
