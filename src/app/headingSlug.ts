/** GitHub-style heading anchor slugs: lowercase, spaces to hyphens, punctuation stripped, Unicode letters (incl. Vietnamese diacritics) kept. */
export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}_-]+/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Returns a fresh per-document allocator so repeated heading text gets -1, -2… suffixes instead of colliding ids. */
export function createHeadingIdAllocator() {
  const seen = new Map<string, number>()
  return (text: string): string => {
    const base = slugifyHeading(text) || 'section'
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base}-${count}`
  }
}

/** Strips a leading "# Title" line from a doc body when it duplicates the page's own displayed title, so the rendered page shows one H1 instead of two. */
export function stripDuplicateLeadingH1(markdown: string, title: string): string {
  const match = markdown.match(/^\s*#[ \t]+([^\n]+?)[ \t]*(?:\n|$)/)
  if (!match) return markdown
  if (match[1].trim().toLowerCase() !== title.trim().toLowerCase()) return markdown
  return markdown.slice(match[0].length).replace(/^\s*\n/, '')
}
