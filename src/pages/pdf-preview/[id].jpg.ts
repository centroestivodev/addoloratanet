import type {APIRoute} from 'astro'
import {createCanvas} from '@napi-rs/canvas'
import {dataset, projectId} from '../../sanity/env'

// Anteprima (prima pagina) di un PDF caricato in Sanity, usata dalle card delle notizie senza foto.
// L'id è quello dell'asset (file-<hash>-pdf): il contenuto non cambia mai, quindi la risposta si può tenere in cache per sempre.
export const prerender = false

const ASSET_ID = /^file-([a-f0-9]{40})-pdf$/
const WIDTH = 640
const MAX_BYTES = 25 * 1024 * 1024

const CACHE = 'public, max-age=31536000, immutable'

export const GET: APIRoute = async ({params}) => {
  const match = ASSET_ID.exec(params.id ?? '')
  if (!match) return new Response(null, {status: 404})

  const source = `https://cdn.sanity.io/files/${projectId}/${dataset}/${match[1]}.pdf`
  const res = await fetch(source)
  if (!res.ok) return new Response(null, {status: 404})
  const bytes = new Uint8Array(await res.arrayBuffer())
  if (bytes.byteLength > MAX_BYTES) return new Response(null, {status: 413})

  try {
    const {getDocument} = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const doc = await getDocument({data: bytes, useSystemFonts: true, verbosity: 0}).promise
    const page = await doc.getPage(1)
    const base = page.getViewport({scale: 1})
    const viewport = page.getViewport({scale: WIDTH / base.width})
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
    const context = canvas.getContext('2d')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({canvasContext: context as unknown as CanvasRenderingContext2D, canvas: canvas as any, viewport}).promise
    const jpeg = canvas.toBuffer('image/jpeg', 80)
    return new Response(new Uint8Array(jpeg), {
      headers: {'Content-Type': 'image/jpeg', 'Cache-Control': CACHE, 'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=31536000, immutable'},
    })
  } catch (error) {
    console.error('Anteprima PDF non generata', params.id, error)
    return new Response(null, {status: 404, headers: {'Cache-Control': 'public, max-age=300'}})
  }
}
