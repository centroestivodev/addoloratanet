import {purgeCache} from '@netlify/functions'
import {isValidSignature, SIGNATURE_HEADER_NAME} from '@sanity/webhook'

// Chiamata dal webhook di Sanity al Publish: invalida tutte le pagine dinamiche
export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {status: 405, headers: {Allow: 'POST'}})
  }

  const secret = process.env.SANITY_WEBHOOK_SECRET
  if (!secret) {
    console.error('SANITY_WEBHOOK_SECRET non impostata')
    return new Response('Server Error', {status: 500})
  }

  const body = await req.text()
  const signature = req.headers.get(SIGNATURE_HEADER_NAME) ?? ''
  if (!signature || !(await isValidSignature(body, signature, secret))) {
    return new Response('Unauthorized', {status: 401})
  }

  await purgeCache({tags: ['contenuti']})

  let doc: {_id?: string; _type?: string} = {}
  try {
    doc = JSON.parse(body) ?? {}
  } catch {
    // Il corpo non è indispensabile: la firma è valida e il purge è già fatto
  }
  console.log(`Cache invalidata: _id=${doc._id ?? req.headers.get('sanity-document-id')} _type=${doc._type}`)

  return new Response('OK')
}
