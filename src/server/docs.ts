import type { Doc, Language } from '../app/types'

// Vite embeds Markdown in the server bundle; docs are never fetched from disk by user path.
const sources = import.meta.glob('/docs/**/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
export function parseDoc(filename: string, source: string): Doc | null {
  const match = filename.replaceAll('\\', '/').match(/\/docs\/(vi\/)?([a-z0-9][a-z0-9-]*?)(\.vi)?\.md$/i)
  if (!match) return null
  const [, folder, slug, suffix] = match
  const lang = folder || suffix ? 'vi' : 'en'
  const fields: Record<string, string> = {}
  const front = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (front) {
    for (const line of front[1].split(/\r?\n/)) {
      const entry = line.match(/^(title|description|order):\s*(.*?)\s*$/)
      if (entry) fields[entry[1]] = entry[2].replace(/^['"]|['"]$/g, '')
    }
  }
  const body = front ? source.slice(front[0].length) : source
  const title = fields.title || body.match(/^#\s+(.+)$/m)?.[1]?.trim() || slug.replaceAll('-', ' ')
  const description = fields.description || body.split(/\r?\n\s*\r?\n/).find((line) => line.trim() && !/^[#>|`*-]/.test(line.trim()))?.replace(/\s+/g, ' ').slice(0, 180) || title
  return { slug, lang, title, description, body, order: Number(fields.order) || (slug === 'index' ? -1 : 100) }
}
export function documents(lang: Language, input = sources): Doc[] {
  const result = new Map<string, Doc>()
  const all = Object.entries(input).sort(([a], [b]) => a.localeCompare(b)).map(([name, text]) => parseDoc(name, text)).filter((doc): doc is Doc => doc !== null)
  for (const doc of all.filter((doc) => doc.lang === 'en')) result.set(doc.slug, doc)
  if (lang === 'vi') for (const doc of all.filter((doc) => doc.lang === 'vi')) result.set(doc.slug, doc)
  return [...result.values()].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
}
