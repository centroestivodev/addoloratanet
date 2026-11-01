// Testi dei canti in formato ChordPro: "[Do]Alleluia, [Sol]canta". Accordi in notazione italiana.
// Direttive riconosciute: {c: Ritornello} per un'etichetta, {soc} e {eoc} per il ritornello.
// {chorus} ripete l'ultimo ritornello.

export interface ChordSegment {
  chord?: string
  text: string
}

export interface SongLine {
  // Ogni parola è una lista di pezzi, così un accordo può cadere anche a metà parola
  words: ChordSegment[][]
  hasChords: boolean
}

export interface SongBlock {
  label?: string
  chorus: boolean
  lines: SongLine[]
}

const NOTES = ['Do', 'Do#', 'Re', 'Mib', 'Mi', 'Fa', 'Fa#', 'Sol', 'Lab', 'La', 'Sib', 'Si']
const NATURALS: Record<string, number> = {do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11}
const NOTE = /^(do|re|mi|fa|sol|la|si)([#b]?)(.*)$/i

function parseNote(value: string) {
  const match = value.match(NOTE)
  if (!match) return undefined
  const [, natural, accidental, rest] = match
  const shift = accidental === '#' ? 1 : accidental ? -1 : 0
  return {index: (NATURALS[natural.toLowerCase()] + shift + 12) % 12, rest}
}

export function isKnownChord(chord: string): boolean {
  return chord.split('/').every((part) => parseNote(part) !== undefined)
}

// "RE" e "MI-" si mostrano come "Re" e "Mi-"; ciò che non riconosce resta com'è
function normalizeChord(chord: string): string {
  if (!isKnownChord(chord)) return chord
  return chord
    .split('/')
    .map((part) => {
      const [, natural, accidental, rest] = part.match(NOTE)!
      return natural[0].toUpperCase() + natural.slice(1).toLowerCase() + accidental.toLowerCase() + rest
    })
    .join('/')
}

// Sposta l'accordo di `semitones`, compreso il basso ("Do/Mi"). Ciò che non riconosce resta com'è.
export function transposeChord(chord: string, semitones: number): string {
  if (!isKnownChord(chord)) return chord
  return chord
    .split('/')
    .map((part) => {
      const {index, rest} = parseNote(part)!
      return NOTES[(index + semitones + 120) % 12] + rest
    })
    .join('/')
}

const CHORD = /\[([^\]]*)\]/g
const DIRECTIVE = /^\{\s*([a-z_]+)\s*(?::\s*(.*?))?\s*\}$/i

function parseLine(raw: string): SongLine {
  const segments: ChordSegment[] = []
  let last = 0
  let chord: string | undefined
  for (const match of raw.matchAll(CHORD)) {
    if (match.index > last || chord) segments.push({chord, text: raw.slice(last, match.index)})
    chord = normalizeChord(match[1].trim()) || undefined
    last = match.index + match[0].length
  }
  segments.push({chord, text: raw.slice(last)})

  const words: ChordSegment[][] = [[]]
  for (const segment of segments) {
    segment.text.split(/\s+/).forEach((text, i) => {
      if (i > 0 && words[words.length - 1].length) words.push([])
      if (text || (i === 0 && segment.chord)) {
        words[words.length - 1].push({chord: i === 0 ? segment.chord : undefined, text})
      }
    })
  }
  return {words: words.filter((word) => word.length), hasChords: segments.some((s) => s.chord)}
}

export function parseSong(source: string): SongBlock[] {
  const blocks: SongBlock[] = []
  let lastChorus: SongBlock[] = []
  let current: SongBlock | undefined
  let chorus = false
  const open = (label?: string) => (current = {label, chorus, lines: []})
  const close = () => {
    if (current?.lines.length || current?.label) {
      blocks.push(current)
      if (current.chorus) lastChorus.push(current)
    }
    current = undefined
  }

  for (const line of source.split(/\r?\n/).map((l) => l.trim())) {
    const directive = line.match(DIRECTIVE)
    if (directive) {
      const name = directive[1].toLowerCase()
      close()
      if (name === 'soc' || name === 'start_of_chorus') {
        chorus = true
        lastChorus = []
      }
      if (name === 'eoc' || name === 'end_of_chorus') chorus = false
      if (name === 'c' || name === 'comment') open(directive[2])
      if (name === 'chorus') blocks.push(...lastChorus)
    } else if (!line) {
      if (current?.lines.length) close()
      else current = undefined
    } else {
      ;(current ?? open()).lines.push(parseLine(line))
    }
  }
  close()
  return blocks
}

// Il primo accordo del canto, che di solito ne indica la tonalità
export function firstChord(source: string): string | undefined {
  for (const match of source.matchAll(CHORD)) {
    const chord = match[1].trim()
    if (chord) return normalizeChord(chord)
  }
}

export function songChords(source: string): string[] {
  return [...source.matchAll(CHORD)].map((match) => match[1].trim()).filter(Boolean)
}

// Il testo senza accordi né direttive, una riga per verso: serve alla ricerca
export function songText(source: string): string {
  return source
    .split(/\r?\n/)
    .filter((line) => !DIRECTIVE.test(line.trim()))
    .map((line) => line.replace(CHORD, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

// Maiuscole e accenti non contano nella ricerca
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}
