export type ThemePreference = 'light' | 'dark'

const THEME_KEY = 'osblog:theme'

export function readStoredTheme(): ThemePreference | null {
  try {
    const value = window.localStorage.getItem(THEME_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

export function writeStoredTheme(theme: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* storage may be unavailable (private browsing); theme still applies for this session */
  }
}

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches === true
}

export interface PostDraft {
  categoryId: string
  slug: string
  titleEn: string
  titleVi: string
  excerptEn: string
  excerptVi: string
  bodyEn: string
  bodyVi: string
  status: 'draft' | 'published' | 'archived'
  publishedAt: string | null
  coverImageUrl: string | null
  coverImageAltEn: string | null
  coverImageAltVi: string | null
  seoTitleEn: string | null
  seoTitleVi: string | null
  seoDescriptionEn: string | null
  seoDescriptionVi: string | null
  savedAt: string
}

function draftKey(adminEmail: string, postId: string): string {
  return `osblog:draft:${adminEmail}:${postId}`
}

export function readDraft(adminEmail: string, postId: string): PostDraft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(adminEmail, postId))
    return raw ? (JSON.parse(raw) as PostDraft) : null
  } catch {
    return null
  }
}

export function writeDraft(adminEmail: string, postId: string, draft: PostDraft): void {
  try {
    window.localStorage.setItem(draftKey(adminEmail, postId), JSON.stringify(draft))
  } catch {
    /* best effort only */
  }
}

export function clearDraft(adminEmail: string, postId: string): void {
  try {
    window.localStorage.removeItem(draftKey(adminEmail, postId))
  } catch {
    /* best effort only */
  }
}

export function clearAllDraftsForAdmin(adminEmail: string): void {
  try {
    const prefix = `osblog:draft:${adminEmail}:`
    const toRemove: string[] = []
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (key?.startsWith(prefix)) toRemove.push(key)
    }
    for (const key of toRemove) window.localStorage.removeItem(key)
  } catch {
    /* best effort only */
  }
}
