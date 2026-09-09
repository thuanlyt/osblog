import { useState, type ReactNode } from 'react'
import { localPath, type Language } from '../types'
import { GlobeIcon, MenuIcon, CloseIcon, SearchIcon } from '../icons'
import { ThemeToggle } from './ThemeToggle'

const NAV_LINKS_EN = [
  { to: '/', label: 'Home' },
  { to: '/archive', label: 'Articles' },
  { to: '/docs', label: 'Docs' },
  { to: '/about', label: 'About' },
]
const NAV_LINKS_VI = [
  { to: '/', label: 'Trang chủ' },
  { to: '/archive', label: 'Bài viết' },
  { to: '/docs', label: 'Tài liệu' },
  { to: '/about', label: 'Giới thiệu' },
]

export function PublicLayout({ lang, path, children }: { lang: Language; path: string; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const links = lang === 'vi' ? NAV_LINKS_VI : NAV_LINKS_EN
  const otherLang: Language = lang === 'vi' ? 'en' : 'vi'
  const isVi = lang === 'vi'

  return (
    <div className="app-shell pixel-app-shell">
      <a className="skip-link" href="#app-main">{isVi ? 'Đi tới nội dung chính' : 'Skip to main content'}</a>
      <div className="pixel-page-frame">
        <header className="site-header pixel-site-header">
          <div className="header-inner pixel-header-inner">
            <a className="brand pixel-brand" href={localPath('/', lang)} aria-label="osblog home">
              <span className="brand-mark pixel-brand-mark" aria-hidden="true">
                <span className="pixel-brand-eye pixel-brand-eye-left" />
                <span className="pixel-brand-eye pixel-brand-eye-right" />
                <span className="pixel-brand-mouth" />
              </span>
              <span className="pixel-brand-copy">
                <strong>OSBLOG</strong>
                <small>{isVi ? 'MÃ NGUỒN MỞ · CHIA SẺ' : 'OPEN SOURCE · SHARE'}</small>
              </span>
            </a>
            <button
              type="button"
              className="icon-button nav-toggle pixel-nav-toggle"
              aria-expanded={menuOpen}
              aria-controls="primary-nav"
              aria-label={menuOpen ? (isVi ? 'Đóng menu' : 'Close menu') : (isVi ? 'Mở menu' : 'Open menu')}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            <nav className="site-nav pixel-site-nav" id="primary-nav" aria-label="Primary navigation" data-open={menuOpen}>
              {links.map((link, index) => (
                <a key={link.to} className="pixel-nav-link" href={localPath(link.to, lang)} aria-current={path === link.to ? 'page' : undefined}>
                  <span className="pixel-nav-dot" aria-hidden="true">{index + 1}</span>
                  <span>{link.label}</span>
                </a>
              ))}
              <a className="pixel-nav-link pixel-search-link" href={localPath('/archive', lang)}>
                <SearchIcon />
                <span>{isVi ? 'Tìm kiếm' : 'Search'}</span>
              </a>
              <div className="pixel-nav-tools">
                <a className="lang-switch pixel-tool-button" href={localPath(path, otherLang)} lang={otherLang} aria-label={otherLang === 'vi' ? 'Chuyển sang tiếng Việt' : 'Switch to English'}>
                  <GlobeIcon />
                  <span>{otherLang === 'vi' ? 'VI' : 'EN'}</span>
                </a>
                <ThemeToggle />
                <a className="nav-admin pixel-admin-link" href="/admin/login">{isVi ? 'Admin' : 'Admin'}</a>
              </div>
            </nav>
          </div>
        </header>
        <main id="app-main" className="page-main pixel-page-main" tabIndex={-1}>
          {children}
        </main>
        <footer className="site-footer pixel-site-footer">
          <div className="pixel-footer-brand">
            <strong>OSBLOG</strong>
            <span>{isVi ? 'Blog mã nguồn mở · viết, học và chia sẻ.' : 'Open-source writing · build, learn and share.'}</span>
          </div>
          <div className="footer-links pixel-footer-links">
            <a href="https://github.com/thuanlyt/osblog" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href={localPath('/docs', lang)}>{isVi ? 'Tài liệu' : 'Docs'}</a>
            <span className="footer-note">MIT</span>
          </div>
          <span className="pixel-footer-sprite" aria-hidden="true" />
        </footer>
      </div>
    </div>
  )
}
