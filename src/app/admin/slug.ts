const DIACRITICS: Record<string, string> = {
  đ: 'd', Đ: 'd',
}

export function slugify(input: string): string {
  const normalized = input
    .split('')
    .map((char) => DIACRITICS[char] ?? char)
    .join('')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
  return normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180)
}
