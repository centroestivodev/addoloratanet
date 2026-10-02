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

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function parts(value: string) {
  const d = toUtcDate(value)
  return {day: d.getUTCDate(), weekday: GIORNI[d.getUTCDay()], month: MESI[d.getUTCMonth()], year: d.getUTCFullYear()}
}

function isMultiDay({eventDate, endDate}: EventSchedule): boolean {
  return !!endDate && endDate.slice(0, 10) !== eventDate.slice(0, 10)
}

// "ore 10:00 – 17:00" per le card; per gli eventi di più giorni "fino a domenica 25 ottobre"
export function formatCardTime(event: EventSchedule): string {
  if (isMultiDay(event)) {
    const e = parts(event.endDate as string)
    return `fino a ${e.weekday} ${e.day} ${e.month}`
  }
  const {startTime, endTime} = event
  if (startTime) return endTime ? `ore ${startTime} – ${endTime}` : `ore ${startTime}`
  if (endTime) return `fino alle ${endTime}`
  return ''
}

// "Domenica 4 ottobre, ore 10:00 – 17:00" oppure "Venerdì 23 ottobre – 25 ottobre"
export function formatWhenShort(event: EventSchedule): string {
  const s = parts(event.eventDate)
  const head = `${capitalize(s.weekday)} ${s.day} ${s.month}`
  if (isMultiDay(event)) {
    const e = parts(event.endDate as string)
    return `${head} – ${e.day} ${e.month}`
  }
  const time = formatCardTime(event)
  return time ? `${head}, ${time}` : head
}

// "Domenica 4 ottobre 2026" oppure "Da venerdì 23 a domenica 25 ottobre 2026"
export function formatWhenLong(event: EventSchedule): string {
  const s = parts(event.eventDate)
  if (!isMultiDay(event)) return capitalize(`${s.weekday} ${s.day} ${s.month} ${s.year}`)
  const e = parts(event.endDate as string)
  const start = s.month === e.month && s.year === e.year ? `${s.weekday} ${s.day}` : `${s.weekday} ${s.day} ${s.month}`
  return `Da ${start} a ${e.weekday} ${e.day} ${e.month} ${e.year}`
}

// "Dalle 10:00 alle 17:00"; per gli eventi di più giorni "Partenza venerdì alle 18:00, rientro domenica alle 16:00"
export function formatTimeLong(event: EventSchedule): string {
  const {startTime, endTime} = event
  if (isMultiDay(event)) {
    if (!startTime) return ''
    const s = parts(event.eventDate)
    const e = parts(event.endDate as string)
    return `Partenza ${s.weekday} alle ${startTime}` + (endTime ? `, rientro ${e.weekday} alle ${endTime}` : '')
  }
  if (startTime) return endTime ? `Dalle ${startTime} alle ${endTime}` : `Ore ${startTime}`
  if (endTime) return `Fino alle ${endTime}`
  return ''
}

// "4 ott."
export function formatShortDate(value: string): string {
  const s = parts(value)
  return `${s.day} ${s.month.slice(0, 3)}.`
}

// "4 ottobre 2026"
export function formatDay(value: string): string {
  const s = parts(value)
  return `${s.day} ${s.month} ${s.year}`
}

// "Mercoledì 30 settembre 2026, ore 18:00" (orario di Roma)
export function formatDateTimeLong(iso: string): string {
  const d = new Date(iso)
  const day = new Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Rome'}).format(d)
  const time = new Intl.DateTimeFormat('it-IT', {timeZone: 'Europe/Rome', hour: 'numeric', minute: '2-digit'}).format(d)
  return `${formatWhenLong({eventDate: day})}, ore ${time}`
}

// Data di calendario di un istante, a Roma: "YYYY-MM-DD"
export function dayInRome(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Rome'}).format(new Date(iso))
}

// Raggruppa per mese ("Ottobre 2026"), mantenendo l'ordine ricevuto
export function groupByMonth<T>(items: T[], dateOf: (item: T) => string): {label: string; items: T[]}[] {
  const groups: {key: string; label: string; items: T[]}[] = []
  for (const item of items) {
    const key = dateOf(item).slice(0, 7)
    let group = groups.find((g) => g.key === key)
    if (!group) {
      const p = parts(`${key}-01`)
      group = {key, label: capitalize(`${p.month} ${p.year}`), items: []}
      groups.push(group)
    }
    group.items.push(item)
  }
  return groups
}

export function isPastEvent(event: EventSchedule, today: string): boolean {
  return (event.endDate || event.eventDate).slice(0, 10) < today
}
