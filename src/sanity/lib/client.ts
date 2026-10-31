import {createClient, type ClientPerspective} from '@sanity/client'
import {dataset, projectId} from '../env'

// Niente CDN di Sanity: il purge arriva subito dopo il Publish e una risposta ancora vecchia
// resterebbe nella cache di Netlify. Queste chiamate partono solo ai MISS di Netlify.
export function getClient({perspective = 'published'}: {perspective?: ClientPerspective} = {}) {
  return createClient({projectId, dataset, apiVersion: '2025-02-19', useCdn: false, perspective})
}

export const sanityClient = getClient()
