export const POST_BADGES = [{title: 'Comunicazione del parroco', value: 'comunicazione-parroco'}]

export function badgeLabel(value?: string): string | undefined {
  return POST_BADGES.find((badge) => badge.value === value)?.title
}
