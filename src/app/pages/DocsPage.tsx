import { useEffect, useRef, useState } from 'react'
import { localPath, type PageData } from '../types'
import { SafeMarkdown } from '../markdown'
import { MenuIcon, CloseIcon } from '../icons'
import { slugifyHeading, stripDuplicateLeadingH1 } from '../headingSlug'

function DocsSidebar({ data, mobileOpen, onClose }: { data: PageData; mobileOpen: boolean; onClose: () => void }) {
  const lang = data.lang
  const docs = data.docs ?? []
  const isVi = lang === 'vi'
  return (
    <nav className={mobileOpen ? 'docs-sidebar docs-sidebar-open' : 'docs-sidebar'} aria-label={isVi ? 'Mục lục tài liệu' : 'Documentation contents'}>
      <div className="docs-sidebar-head">
        <span>{isVi ? 'Tài liệu' : 'Documentation'}</span>
        <button type="button" className="icon-button docs-sidebar-close" onClick={onClose} aria-label={isVi ? 'Đóng mục lục' : 'Close contents'}>
          <CloseIcon />
        </button>
      </div>
      <ul>
        {docs.map((doc) => (
          <li key={doc.slug}>
            <a href={localPath(doc.slug === 'index' ? '/docs' : `/docs/${doc.slug}`, lang)} aria-current={data.doc?.slug === doc.slug ? 'page' : undefined}>
              {doc.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function DocsPage({ data }: { data: PageData }) {
  const lang = data.lang
  const isVi = lang === 'vi'
  const doc = data.doc
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement | null>(null)

  function closeMobileSidebar() {
    setMobileOpen(false)
    toggleRef.current?.focus()
  }

  useEffect(() => {
    if (!mobileOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeMobileSidebar()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  return (
    <div className="content-wrap docs-layout">
      <button ref={toggleRef} type="button" className="button button-secondary docs-mobile-toggle" onClick={() => setMobileOpen(true)} aria-haspopup="true">
        <MenuIcon /> {isVi ? 'Mục lục' : 'Contents'}
      </button>
      {mobileOpen && <div className="docs-overlay" onClick={closeMobileSidebar} />}
      <DocsSidebar data={data} mobileOpen={mobileOpen} onClose={closeMobileSidebar} />
      <div className="docs-content">
        {doc
          ? (
            <article lang={lang}>
              <p className="eyebrow">{isVi ? 'Tài liệu' : 'Documentation'}</p>
              <h1 id={slugifyHeading(doc.title)}>{doc.title}</h1>
              {doc.description && <p className="page-lede">{doc.description}</p>}
              <SafeMarkdown content={stripDuplicateLeadingH1(doc.body, doc.title)} lang={lang} mapLinks />
            </article>
          )
          : (
            <div>
              <p className="eyebrow">{isVi ? 'Tài liệu' : 'Documentation'}</p>
              <h1>{data.title}</h1>
              <p className="page-lede">{data.description}</p>
              <ul className="docs-index-list">
                {(data.docs ?? []).filter((entry) => entry.slug !== 'index').map((entry) => (
                  <li key={entry.slug}>
                    <a href={localPath(`/docs/${entry.slug}`, lang)}>{entry.title}</a>
                    <p>{entry.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>
    </div>
  )
}
