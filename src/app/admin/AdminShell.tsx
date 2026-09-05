import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { Language } from '../types'
import { ArchiveIcon, FolderIcon, LogOutIcon, MessageIcon } from '../icons'

export function AdminChrome({ email, lang, children, onLogout }: { email: string | null; lang: Language; children: ReactNode; onLogout?: () => void }) {
  return (
    <div className="app-shell admin-shell">
      <a className="skip-link" href="#app-main">Skip to main content</a>
      <header className="site-header admin-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="osblog home">
            <span className="brand-mark" aria-hidden="true">o/</span>
            <span>osblog admin</span>
          </a>
          <div className="admin-header-actions">
            {email && <span className="admin-user" title={email}>{email}</span>}
            {email && onLogout && (
              <button type="button" className="button button-secondary" onClick={onLogout}>
                <LogOutIcon /> Sign out
              </button>
            )}
            <a className="text-link" href={lang === 'vi' ? '/?lang=vi' : '/'}>Back to site</a>
          </div>
        </div>
      </header>
      <main id="app-main" className="page-main" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}

export function AdminNav() {
  const location = useLocation()
  const items = [
    { to: '/admin', label: 'Posts', icon: <ArchiveIcon />, match: (path: string) => path === '/admin' || path.startsWith('/admin/posts') },
    { to: '/admin/categories', label: 'Categories', icon: <FolderIcon />, match: (path: string) => path.startsWith('/admin/categories') },
    { to: '/admin/comments', label: 'Moderation', icon: <MessageIcon />, match: (path: string) => path.startsWith('/admin/comments') },
  ]
  return (
    <nav className="admin-nav" aria-label="Admin sections">
      {items.map((item) => (
        <Link key={item.to} to={item.to} className={item.match(location.pathname) ? 'admin-nav-link admin-nav-link-active' : 'admin-nav-link'} aria-current={item.match(location.pathname) ? 'page' : undefined}>
          {item.icon} {item.label}
        </Link>
      ))}
    </nav>
  )
}
