import type { Language } from './types'

const GITHUB_README_URL = 'https://github.com/thuanlyt/osblog/blob/main/README.md'

/** docs/<slug>.md, relative <slug>.md, and their vi/ or .vi.md variants map onto the /docs route; root README links leave the app for GitHub. */
export function mapMarkdownHref(href: string, lang: Language): string {
  if (/^(?:\.\.\/)*readme(?:\.vi)?\.md(?:#.*)?$/i.test(href)) return GITHUB_README_URL
  const match = href.match(/^(?:\.\.\/|\.\/)*(?:docs\/)?(vi\/)?([a-z0-9][a-z0-9-]*)(\.vi)?\.md(#.*)?$/i)
  if (match) {
    const [, folderVi, slug, suffixVi, hash] = match
    const targetLang = folderVi || suffixVi ? 'vi' : lang
    const base = slug === 'index' ? '/docs' : `/docs/${slug}`
    const query = targetLang === 'vi' ? (base.includes('?') ? '&lang=vi' : '?lang=vi') : ''
    return `${base}${query}${hash ?? ''}`
  }
  return href
}
