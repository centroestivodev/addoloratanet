interface PortableTextSpan {
  _type: string
  text?: string
}

interface PortableTextBlock {
  _type: string
  children?: PortableTextSpan[]
}

export function toPlainText(blocks: PortableTextBlock[] = [], maxLength = 160): string {
  const text = blocks
    .filter((block) => block._type === 'block')
    .map((block) => block.children?.map((child) => child.text ?? '').join('') ?? '')
    .join(' ')
    .trim()

  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}
