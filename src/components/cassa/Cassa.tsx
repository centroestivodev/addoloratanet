import {useEffect, useMemo, useState, type ReactNode} from 'react'
import './cassa.css'

export interface CassaProduct {
  id: string
  name: string
  description?: string
  priceCents: number
  isCombo: boolean
  image?: string
  components: {productId: string; quantity: number}[]
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

const STORAGE_KEY = 'cassa-conto-v1'

const euro = (cents: number) => '€ ' + (cents / 100).toFixed(2).replace('.', ',')

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

export default function Cassa({products}: {products: CassaProduct[]}) {
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  // Una combo vale solo se tutti i suoi componenti esistono in cassa come prodotti singoli
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

  const [cart, setCart] = useState<Cart>({})
  const [view, setView] = useState<View>('none')
  const [pop, setPop] = useState<string | null>(null)
  const [custom, setCustom] = useState('')
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({})
  const [loaded, setLoaded] = useState(false)

  // Il conto sopravvive a un ricaricamento accidentale della pagina
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Cart
      const clean: Cart = {}
      for (const [id, qty] of Object.entries(saved)) {
        if (byId.has(id) && Number.isInteger(qty) && qty > 0) clean[id] = qty
      }
      setCart(clean)
    } catch {
      // niente storage: si parte da un conto vuoto
    }
    setLoaded(true)
  }, [byId])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    } catch {
      // ignorato
    }
  }, [cart, loaded])

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
  const ids = Object.keys(cart).filter((id) => byId.has(id))
  const count = ids.reduce((n, id) => n + cart[id], 0)
  const total = ids.reduce((t, id) => t + cart[id] * byId.get(id)!.priceCents, 0)
  const customN = parseInt(custom, 10)

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

  function openPop(id: string) {
    setPop(id)
    setCustom('')
  }

  function closePop() {
    setPop(null)
    setCustom('')
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
    setCart(next)
    setView(suggestionsFor(next, dismissed).length ? 'suggerimento' : 'riepilogo')
  }

  function declineSuggestion() {
    if (!first) return setView('riepilogo')
    const skip = {...dismissed, [first.combo.id]: true}
    setDismissed(skip)
    setView(suggestionsFor(cart, skip).length ? 'suggerimento' : 'riepilogo')
  }

  function newOrder() {
    setCart({})
    setView('none')
    setPop(null)
    setCustom('')
    setDismissed({})
  }

  const showSuggestion = view === 'suggerimento' && suggestions.length > 0
  const showSummary = view === 'riepilogo' || (view === 'suggerimento' && suggestions.length === 0)
  const lines = ids.map((id) => byId.get(id)!)

  const sections = [
    {title: 'Combo', eyebrow: 'Menu fissi', items: shownCombos},
    {title: 'Prodotti', eyebrow: 'Singoli', items: singles},
  ].filter((s) => s.items.length > 0)

  function renderItem(item: CassaProduct, index: number) {
    const qty = cart[item.id] || 0
    const open = pop === item.id
    const col = index % 2
    return (
      <div key={item.id} className="cs-item" style={{zIndex: open ? 30 : 1}}>
        <button
          type="button"
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
            role="dialog"
            aria-label={`Quantità per ${item.name}`}
            className={'cs-pop ' + (col === 0 ? 'cs-pop--left' : 'cs-pop--right')}
          >
            <span aria-hidden="true" className="cs-pop__arrow" style={{left: col === 0 ? 79 : 199}} />
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
      <header className="cs-header">
        <img src="/logo-icon.svg" alt="" width="34" height="34" />
        <div className="cs-header__text">
          <span className="cs-header__title">Cassa</span>
          <span className="cs-header__sub">Festa della parrocchia</span>
        </div>
      </header>

      <div className="cs-scroll">
        <div className="cs-list">
          {pop && <button type="button" className="cs-scrim" aria-label="Chiudi la scelta della quantità" onClick={closePop} />}

          {sections.length === 0 && <p className="cs-empty">Nessun prodotto in cassa. Aggiungili da Sanity, nella sezione “Prodotto (cassa)”.</p>}

          {sections.map((section) => (
            <section key={section.title} className="cs-section">
              <div className="cs-heading">
                <span className="cs-eyebrow">{section.eyebrow}</span>
                <h2>{section.title}</h2>
              </div>
              <div className="cs-grid">{section.items.map(renderItem)}</div>
            </section>
          ))}
        </div>
      </div>

      {view === 'none' && !pop && first && (
        <button type="button" className="cs-hint" onClick={openSummary}>
          <Icon name="sparkles" />
          <span>
            Con {first.combo.name} risparmi {euro(first.saving)}. Tocca per vedere
          </span>
          <Icon name="arrow-right" size={16} />
        </button>
      )}

      <div className="cs-bar">
        <div className="cs-bar__sum">
          <span className="cs-bar__count">{count === 0 ? 'Nessun articolo' : count === 1 ? '1 articolo' : `${count} articoli`}</span>
          <span className="cs-bar__total">{euro(total)}</span>
        </div>
        <button type="button" className="cs-btn cs-btn--primary cs-btn--lg" disabled={count === 0} onClick={openSummary}>
          Riepilogo <Icon name="arrow-right" size={18} />
        </button>
      </div>

      {showSuggestion && first && (
        <div className="cs-sheet-wrap">
          <button type="button" className="cs-sheet-close" aria-label="Chiudi" onClick={() => setView('none')} />
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
          <button type="button" className="cs-sheet-close" aria-label="Torna ai prodotti" onClick={() => setView('none')} />
          <div role="dialog" aria-label="Riepilogo del conto" className="cs-sheet cs-sheet--summary">
            <div className="cs-summary__head">
              <h2>Riepilogo</h2>
              <button type="button" className="cs-iconbtn" aria-label="Torna ai prodotti" onClick={() => setView('none')}>
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
              <button type="button" className="cs-btn cs-btn--primary cs-btn--lg cs-btn--full" onClick={newOrder}>
                <Icon name="circle-check" /> Incassato, nuovo ordine
              </button>
              <button type="button" className="cs-btn cs-btn--outline cs-btn--lg cs-btn--full" onClick={() => setView('none')}>
                Modifica ordine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
