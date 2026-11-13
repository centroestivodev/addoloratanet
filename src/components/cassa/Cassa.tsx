import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode} from 'react'
import './cassa.css'

export interface CassaProduct {
  id: string
  name: string
  description?: string
  priceCents: number
  isCombo: boolean
  image?: string
  components: {productId: string; quantity: number}[]
  // Eventi in cui si vende, con l'eventuale prezzo (centesimi) valido solo in quell'evento
  events: {eventId: string; priceCents?: number}[]
}

export interface CassaEvent {
  id: string
  label: string
}

interface Suggestion {
  combo: CassaProduct
  k: number
  regular: number
  price: number
  saving: number
}

type Cart = Record<string, number>
type View = 'none' | 'suggerimento' | 'riepilogo'

const CARTS_KEY = 'cassa-conti-v2'
const EVENT_KEY = 'cassa-evento-v2'
const BANKNOTES = [500, 1000, 2000, 5000]

const euro = (cents: number) => '€ ' + (cents / 100).toFixed(2).replace('.', ',')

// "16,5" o "16.50" -> 1650 centesimi; vuoto o non valido -> null
function parseCents(text: string): number | null {
  const clean = text.trim().replace(',', '.')
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null
  return Math.round(parseFloat(clean) * 100)
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names.join('')
  return names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1]
}

function Icon({name, size = 18}: {name: 'sparkles' | 'arrow-right' | 'x' | 'circle-check' | 'image'; size?: number}) {
  const paths: Record<string, ReactNode> = {
    sparkles: (
      <>
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        <path d="M20 3v4" />
        <path d="M22 5h-4" />
      </>
    ),
    'arrow-right': (
      <>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </>
    ),
    x: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    'circle-check': (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'image' ? 1.75 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{flex: 'none'}}
    >
      {paths[name]}
    </svg>
  )
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // senza storage il conto non sopravvive al ricaricamento, ma la cassa funziona
  }
}

export default function Cassa({
  products: allProducts,
  events,
  initialEventId,
}: {
  products: CassaProduct[]
  events: CassaEvent[]
  initialEventId?: string
}) {
  const [eventId, setEventId] = useState<string | undefined>(initialEventId ?? events[0]?.id)
  const [carts, setCarts] = useState<Record<string, Cart>>({})
  const [view, setView] = useState<View>('none')
  const [pop, setPop] = useState<string | null>(null)
  const [custom, setCustom] = useState('')
  const [received, setReceived] = useState('')
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({})
  const [loaded, setLoaded] = useState(false)
  const dockRef = useRef<HTMLDivElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [popPos, setPopPos] = useState<{top: number; left: number; arrow: number; above: boolean} | null>(null)

  // Prodotti dell'evento scelto, con il prezzo valido per quell'evento
  const products = useMemo(
    () =>
      allProducts
        .map((p) => {
          const entry = p.events.find((e) => e.eventId === eventId)
          return entry ? {...p, priceCents: entry.priceCents ?? p.priceCents} : null
        })
        .filter((p): p is CassaProduct => p !== null),
    [allProducts, eventId],
  )
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  // Una combo vale solo se tutti i suoi componenti sono in vendita in questo evento come prodotti singoli
  const combos = useMemo(
    () =>
      products.filter(
        (p) =>
          p.isCombo &&
          p.components.length > 0 &&
          p.components.every((c) => {
            const part = byId.get(c.productId)
            return part && !part.isCombo
          }),
      ),
    [products, byId],
  )
  const singles = useMemo(() => products.filter((p) => !p.isCombo), [products])
  const shownCombos = useMemo(() => products.filter((p) => p.isCombo), [products])

  const cart: Cart = useMemo(() => {
    const raw = (eventId && carts[eventId]) || {}
    const clean: Cart = {}
    for (const [id, qty] of Object.entries(raw)) if (byId.has(id) && qty > 0) clean[id] = qty
    return clean
  }, [carts, eventId, byId])

  // Evento e conti sopravvivono a un ricaricamento accidentale della pagina
  useEffect(() => {
    const saved = readStorage<Record<string, Cart>>(CARTS_KEY, {})
    setCarts(saved && typeof saved === 'object' ? saved : {})
    const savedEvent = readStorage<string | null>(EVENT_KEY, null)
    if (savedEvent && events.some((e) => e.id === savedEvent)) setEventId(savedEvent)
    setLoaded(true)
  }, [events])

  useEffect(() => {
    if (loaded) writeStorage(CARTS_KEY, carts)
  }, [carts, loaded])

  useEffect(() => {
    if (loaded && eventId) writeStorage(EVENT_KEY, eventId)
  }, [eventId, loaded])

  function suggestionsFor(c: Cart, skip: Record<string, boolean>): Suggestion[] {
    const out: Suggestion[] = []
    for (const combo of combos) {
      if (skip[combo.id]) continue
      let k = Infinity
      let regular = 0
      for (const part of combo.components) {
        k = Math.min(k, Math.floor((c[part.productId] || 0) / part.quantity))
        regular += byId.get(part.productId)!.priceCents * part.quantity
      }
      if (k >= 1) out.push({combo, k, regular: regular * k, price: combo.priceCents * k, saving: (regular - combo.priceCents) * k})
    }
    return out
  }

  const suggestions = suggestionsFor(cart, dismissed)
  const first = suggestions[0]
  const ids = Object.keys(cart)
  const count = ids.reduce((n, id) => n + cart[id], 0)
  const total = ids.reduce((t, id) => t + cart[id] * byId.get(id)!.priceCents, 0)
  const customN = parseInt(custom, 10)

  const receivedCents = parseCents(received)
  const change = receivedCents === null ? null : receivedCents - total

  // Posiziona il popover sotto la card; se sotto non c'è spazio lo apre sopra, e comunque lo tiene
  // dentro la parte di schermo visibile (tra la navbar e la barra del totale)
  const placePop = useCallback(() => {
    const card = pop ? cardRefs.current[pop] : null
    const box = popRef.current
    if (!card || !box) return setPopPos(null)
    const GAP = 10
    const EDGE = 8
    const header = document.querySelector('.site-header')
    const areaTop = header ? header.getBoundingClientRect().bottom : 0
    const areaBottom = dockRef.current ? dockRef.current.getBoundingClientRect().top : window.innerHeight
    const c = card.getBoundingClientRect()
    const w = box.offsetWidth
    const h = box.offsetHeight
    const spaceBelow = areaBottom - c.bottom - EDGE
    const spaceAbove = c.top - areaTop - EDGE
    const above = spaceBelow < h + GAP && spaceAbove > spaceBelow
    let top = above ? c.top - GAP - h : c.bottom + GAP
    top = Math.min(Math.max(top, areaTop + EDGE), areaBottom - h - EDGE)
    const center = c.left + c.width / 2
    const left = Math.min(Math.max(center - w / 2, EDGE), window.innerWidth - w - EDGE)
    const arrow = Math.min(Math.max(center - left - 7, 18), w - 32)
    setPopPos({top, left, arrow, above})
  }, [pop])

  useLayoutEffect(() => {
    placePop()
  }, [placePop, custom, cart])

  useEffect(() => {
    if (!pop) return
    window.addEventListener('resize', placePop)
    window.addEventListener('scroll', placePop, {passive: true})
    return () => {
      window.removeEventListener('resize', placePop)
      window.removeEventListener('scroll', placePop)
    }
  }, [pop, placePop])

  function setCart(update: (prev: Cart) => Cart) {
    if (!eventId) return
    setCarts((prev) => ({...prev, [eventId]: update(prev[eventId] || {})}))
  }

  function setQty(id: string, n: number) {
    setCart((prev) => {
      const next = {...prev}
      if (n > 0) next[id] = n
      else delete next[id]
      return next
    })
    setPop(null)
    setCustom('')
    setDismissed({})
  }

  function chooseEvent(id: string) {
    setEventId(id)
    setPop(null)
    setCustom('')
    setReceived('')
    setView('none')
    setDismissed({})
  }

  function openPop(id: string) {
    setPop(id)
    setCustom('')
  }

  function closePop() {
    setPop(null)
    setCustom('')
  }

  function closeSheet() {
    setView('none')
    setReceived('')
  }

  function openSummary() {
    if (!count) return
    setPop(null)
    setView(suggestions.length ? 'suggerimento' : 'riepilogo')
  }

  function acceptSuggestion() {
    if (!first) return setView('riepilogo')
    const next = {...cart}
    for (const part of first.combo.components) {
      const left = (next[part.productId] || 0) - part.quantity * first.k
      if (left > 0) next[part.productId] = left
      else delete next[part.productId]
    }
    next[first.combo.id] = (next[first.combo.id] || 0) + first.k
    setCart(() => next)
    setView(suggestionsFor(next, dismissed).length ? 'suggerimento' : 'riepilogo')
  }

  function declineSuggestion() {
    if (!first) return setView('riepilogo')
    const skip = {...dismissed, [first.combo.id]: true}
    setDismissed(skip)
    setView(suggestionsFor(cart, skip).length ? 'suggerimento' : 'riepilogo')
  }

  function newOrder() {
    setCart(() => ({}))
    setView('none')
    setPop(null)
    setCustom('')
    setReceived('')
    setDismissed({})
  }

  const showSuggestion = view === 'suggerimento' && suggestions.length > 0
  const showSummary = view === 'riepilogo' || (view === 'suggerimento' && suggestions.length === 0)
  const lines = ids.map((id) => byId.get(id)!)

  const sections = [
    {title: 'Combo', items: shownCombos},
    {title: 'Prodotti', items: singles},
  ].filter((s) => s.items.length > 0)

  function renderItem(item: CassaProduct) {
    const qty = cart[item.id] || 0
    const open = pop === item.id
    return (
      <div key={item.id} className="cs-item" style={{zIndex: open ? 95 : 1}}>
        <button
          type="button"
          ref={(el) => {
            cardRefs.current[item.id] = el
          }}
          className={'cs-card' + (qty > 0 ? ' is-in' : '')}
          aria-label={`${item.name}, ${euro(item.priceCents)}${qty ? `, nel conto: ${qty}` : ''}`}
          aria-haspopup="dialog"
          onClick={() => openPop(item.id)}
        >
          <span className="cs-card__media">
            {item.image ? (
              <img src={item.image} alt="" loading="lazy" decoding="async" />
            ) : (
              <span className="cs-card__placeholder">
                <Icon name="image" size={28} />
              </span>
            )}
            {qty > 0 && <span className="cs-card__qty">×{qty}</span>}
          </span>
          <span className="cs-card__body">
            <span className="cs-card__name">{item.name}</span>
            {item.description && <span className="cs-card__desc">{item.description}</span>}
            <span className="cs-card__price">{euro(item.priceCents)}</span>
          </span>
        </button>

        {open && (
          <div
            ref={popRef}
            role="dialog"
            aria-label={`Quantità per ${item.name}`}
            className={'cs-pop' + (popPos?.above ? ' is-above' : '')}
            style={popPos ? {top: popPos.top, left: popPos.left} : {visibility: 'hidden', top: 0, left: 0}}
          >
            <span aria-hidden="true" className="cs-pop__arrow" style={{left: popPos?.arrow ?? 20}} />
            <div className="cs-pop__head">
              <div className="cs-pop__title">
                <span className="cs-eyebrow">Quanti?</span>
                <span className="cs-pop__name">{item.name}</span>
              </div>
              <button type="button" className="cs-iconbtn" aria-label="Chiudi" onClick={closePop}>
                <Icon name="x" size={20} />
              </button>
            </div>
            <div className="cs-pop__nums">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={'cs-num' + (qty === n ? ' is-on' : '')}
                  aria-label={`${n} ${n === 1 ? 'pezzo' : 'pezzi'}`}
                  aria-pressed={qty === n}
                  onClick={() => setQty(item.id, n)}
                >
                  {n}
                </button>
              ))}
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="9+"
                aria-label="Altra quantità, da 9 in su"
                className={'cs-num cs-num--input' + (custom ? ' has-value' : '')}
                value={custom}
                onChange={(e) => setCustom(e.target.value.replace(/\D/g, '').slice(0, 3))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customN >= 1) setQty(item.id, customN)
                }}
              />
            </div>
            {customN >= 1 && (
              <button type="button" className="cs-btn cs-btn--primary cs-btn--full cs-pop__apply" onClick={() => setQty(item.id, customN)}>
                Imposta {customN}
              </button>
            )}
            {qty > 0 && (
              <button type="button" className="cs-pop__remove" onClick={() => setQty(item.id, 0)}>
                Togli dal conto
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="cs-app">
      <div className="cs-event">
        <label htmlFor="cs-event-select">Evento</label>
        <div className="cs-select">
          <select id="cs-event-select" value={eventId ?? ''} onChange={(e) => chooseEvent(e.target.value)} disabled={events.length === 0}>
            {events.length === 0 && <option value="">Nessun evento con prodotti</option>}
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {pop && <button type="button" className="cs-scrim" aria-label="Chiudi la scelta della quantità" onClick={closePop} />}

      <div className="cs-list">
        {events.length === 0 && (
          <p className="cs-empty">Nessun prodotto in cassa. In Sanity, apri un prodotto e aggiungilo a un evento nel campo “Eventi in cui si vende”.</p>
        )}
        {events.length > 0 && sections.length === 0 && <p className="cs-empty">Questo evento non ha ancora prodotti.</p>}

        {sections.map((section) => (
          <section key={section.title} className="cs-section">
            <h2>{section.title}</h2>
            <div className="cs-grid">{section.items.map(renderItem)}</div>
          </section>
        ))}
      </div>

      <div className="cs-dock" ref={dockRef}>
        {view === 'none' && !pop && first && (
          <button type="button" className="cs-hint" onClick={openSummary}>
            <span className="cs-hint__inner">
              <Icon name="sparkles" />
              <span>
                Con {first.combo.name} risparmi {euro(first.saving)}. Tocca per vedere
              </span>
              <Icon name="arrow-right" size={16} />
            </span>
          </button>
        )}

        <div className="cs-bar">
          <div className="cs-bar__inner">
            <div className="cs-bar__sum">
              <span className="cs-bar__count">{count === 0 ? 'Nessun articolo' : count === 1 ? '1 articolo' : `${count} articoli`}</span>
              <span className="cs-bar__total">{euro(total)}</span>
            </div>
            <button type="button" className="cs-btn cs-btn--primary cs-btn--lg" disabled={count === 0} onClick={openSummary}>
              Riepilogo <Icon name="arrow-right" size={18} />
            </button>
          </div>
        </div>
      </div>

      {showSuggestion && first && (
        <div className="cs-sheet-wrap">
          <button type="button" className="cs-sheet-close" aria-label="Chiudi" onClick={closeSheet} />
          <div role="dialog" aria-label="Suggerimento combo" className="cs-sheet cs-sheet--sugg">
            <div className="cs-sugg__head">
              <span className="cs-badge">
                <Icon name="sparkles" size={14} /> Suggerimento
              </span>
              <h2>Meglio la combo?</h2>
              <p>
                Hai preso {joinNames(first.combo.components.map((c) => byId.get(c.productId)!.name))} separatamente. Insieme costano meno come{' '}
                {first.combo.name}.
              </p>
            </div>
            <div className="cs-compare">
              <div className="cs-compare__old">
                <span>Separati</span>
                <strong>{euro(first.regular)}</strong>
              </div>
              <div className="cs-compare__new">
                <span>{first.k > 1 ? `${first.combo.name} ×${first.k}` : first.combo.name}</span>
                <strong>{euro(first.price)}</strong>
              </div>
            </div>
            <div>
              <span className="cs-badge cs-badge--success">
                <Icon name="circle-check" size={14} /> Risparmi {euro(first.saving)}
              </span>
            </div>
            <div className="cs-sheet__actions">
              <button type="button" className="cs-btn cs-btn--primary cs-btn--lg cs-btn--full" onClick={acceptSuggestion}>
                Passa alla combo
              </button>
              <button type="button" className="cs-btn cs-btn--outline cs-btn--lg cs-btn--full" onClick={declineSuggestion}>
                Lascia separati
              </button>
            </div>
          </div>
        </div>
      )}

      {showSummary && (
        <div className="cs-sheet-wrap">
          <button type="button" className="cs-sheet-close" aria-label="Torna ai prodotti" onClick={closeSheet} />
          <div role="dialog" aria-label="Riepilogo del conto" className="cs-sheet cs-sheet--summary">
            <div className="cs-summary__head">
              <h2>Riepilogo</h2>
              <button type="button" className="cs-iconbtn" aria-label="Torna ai prodotti" onClick={closeSheet}>
                <Icon name="x" size={20} />
              </button>
            </div>
            <div className="cs-summary__lines">
              {lines.map((line) => (
                <div key={line.id} className="cs-line">
                  <span className="cs-line__qty">{cart[line.id]}×</span>
                  <span className="cs-line__main">
                    <span className="cs-line__name">{line.name}</span>
                    <span className="cs-line__unit">
                      {line.isCombo && <span className="cs-badge cs-badge--accent">Combo</span>}
                      {euro(line.priceCents)} cad.
                    </span>
                  </span>
                  <span className="cs-line__total">{euro(line.priceCents * cart[line.id])}</span>
                </div>
              ))}
            </div>
            <div className="cs-summary__foot">
              <div className="cs-summary__total">
                <span>Totale</span>
                <strong>{euro(total)}</strong>
              </div>

              <div className="cs-pay">
                <label htmlFor="cs-received">Ricevuto</label>
                <div className="cs-pay__field">
                  <span aria-hidden="true">€</span>
                  <input
                    id="cs-received"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0,00"
                    value={received}
                    onChange={(e) => setReceived(e.target.value.replace(/[^\d.,]/g, '').slice(0, 8))}
                  />
                </div>
                <div className="cs-pay__quick">
                  <button type="button" className="cs-chip" onClick={() => setReceived((total / 100).toFixed(2).replace('.', ','))}>
                    Esatto
                  </button>
                  {BANKNOTES.filter((n) => n >= total).map((n) => (
                    <button key={n} type="button" className="cs-chip" onClick={() => setReceived(String(n / 100))}>
                      € {n / 100}
                    </button>
                  ))}
                </div>
                {change !== null && (
                  <div className={'cs-pay__result' + (change < 0 ? ' is-short' : '')} aria-live="polite">
                    <span>{change < 0 ? 'Mancano' : 'Resto da dare'}</span>
                    <strong>{euro(Math.abs(change))}</strong>
                  </div>
                )}
              </div>

              <button type="button" className="cs-btn cs-btn--primary cs-btn--lg cs-btn--full" onClick={newOrder}>
                <Icon name="circle-check" /> Incassato, nuovo ordine
              </button>
              <button type="button" className="cs-btn cs-btn--outline cs-btn--lg cs-btn--full" onClick={closeSheet}>
                Modifica ordine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
