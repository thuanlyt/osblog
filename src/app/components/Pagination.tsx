import { localPath, type Language } from '../types'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons'

export function Pagination({ path, query, page, limit, total, lang }: { path: string; query: Record<string, string>; page: number; limit: number; total: number; lang: Language }) {
  const pageCount = Math.max(1, Math.ceil(total / limit))
  if (pageCount <= 1) return null

  function hrefFor(target: number) {
    const url = new URL(path, 'http://local')
    for (const [key, value] of Object.entries(query)) if (value) url.searchParams.set(key, value)
    url.searchParams.set('page', String(target))
    return localPath(url.pathname + url.search, lang)
  }

  return (
    <nav className="pagination" aria-label={lang === 'vi' ? 'Phân trang' : 'Pagination'}>
      {page > 1
        ? <a className="button button-secondary" href={hrefFor(page - 1)}><ChevronLeftIcon />{lang === 'vi' ? 'Trước' : 'Previous'}</a>
        : <span className="button button-secondary" aria-disabled="true">{<ChevronLeftIcon />}{lang === 'vi' ? 'Trước' : 'Previous'}</span>}
      <span className="pagination-status" role="status">{lang === 'vi' ? `Trang ${page} / ${pageCount}` : `Page ${page} of ${pageCount}`}</span>
      {page < pageCount
        ? <a className="button button-secondary" href={hrefFor(page + 1)}>{lang === 'vi' ? 'Sau' : 'Next'}<ChevronRightIcon /></a>
        : <span className="button button-secondary" aria-disabled="true">{lang === 'vi' ? 'Sau' : 'Next'}{<ChevronRightIcon />}</span>}
    </nav>
  )
}
