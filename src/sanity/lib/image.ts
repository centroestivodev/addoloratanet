import {createImageUrlBuilder} from '@sanity/image-url'
import type {SanityImageSource} from '@sanity/image-url/lib/types/types'

const builder = createImageUrlBuilder({
  projectId: 'bomj2fjw',
  dataset: 'addoloratanet',
})

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}
