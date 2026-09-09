import { useState, type ReactNode } from 'react'
import { localPath, type Language } from '../types'
import { GlobeIcon, MenuIcon, CloseIcon, SearchIcon } from '../icons'
import { ThemeToggle } from './ThemeToggle'

const NAV_LINKS_EN = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/archive', label: 'Articles', icon: 'posts' },
  { to: '/docs', label: 'Docs', icon: 'docs' },
  { to: '/about', label: 'About', icon: 'about' },
]
const NAV_LINKS_VI = [
  { to: '/', label: 'Trang chủ', icon: 'home' },
  { to: '/archive', label: 'Bài viết', icon: 'posts' },
  { to: '/docs', label: 'Tài liệu', icon: 'docs' },
  { to: '/about', label: 'Giới thiệu', icon: 'about' },
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
            <a className="brand pixel-brand" href={localPath('/', lang)} aria-label="OSBLOG home">
              <span className="pixel-brand-mark" aria-hidden="true">
                <span className="pixel-brand-antenna" />
                <span className="pixel-brand-eye pixel-brand-eye-left" />
                <span className="pixel-brand-eye pixel-brand-eye-right" />
                <span className="pixel-brand-mouth" />
              </span>
              <span className="pixel-brand-copy">
                <strong><span>OS</span>BLOG</strong>
                <small>{isVi ? 'BLOG MÃ NGUỒN MỞ · VIẾT & CHIA SẺ' : 'OPEN SOURCE BLOG · WRITE & SHARE'}</small>
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

            <nav className="site-nav pixel-site-nav" id="primary-nav" aria-label={isVi ? 'Điều hướng chính' : 'Primary navigation'} data-open={menuOpen}>
              {links.map((link) => (
                <a key={link.to} className="pixel-nav-link" href={localPath(link.to, lang)} aria-current={path === link.to ? 'page' : undefined}>
                  <span className={`pixel-nav-icon pixel-nav-icon-${link.icon}`} aria-hidden="true" />
                  <span>{link.label}</span>
                </a>
              ))}
              <a className="pixel-nav-link pixel-search-link" href={localPath('/archive', lang)}>
                <span className="pixel-search-icon" aria-hidden="true"><SearchIcon /></span>
                <span>{isVi ? 'Tìm kiếm' : 'Search'}</span>
              </a>
            </nav>

            <div className="pixel-header-tools" aria-label={isVi ? 'Tiện ích' : 'Utilities'}>
              <a className="lang-switch pixel-tool-button" href={localPath(path, otherLang)} lang={otherLang} aria-label={otherLang === 'vi' ? 'Chuyển sang tiếng Việt' : 'Switch to English'}>
                <GlobeIcon /><span>{otherLang === 'vi' ? 'VI' : 'EN'}</span>
              </a>
              <ThemeToggle />
              <a className="pixel-admin-link" href="/admin/login">ADMIN</a>
            </div>
          </div>
        </header>

        <main id="app-main" className="page-main pixel-page-main" tabIndex={-1}>
          {children}
        </main>

        <footer className="site-footer pixel-site-footer">
          <div className="pixel-footer-left">
            <span className="pixel-footer-heart" aria-hidden="true" />
            <span>© {new Date().getFullYear()} OSBLOG · {isVi ? 'Mã nguồn mở · Viết & Chia sẻ' : 'Open Source · Write & Share'}</span>
          </div>
          <div className="footer-links pixel-footer-links">
            <a href={localPath('/about', lang)}>{isVi ? 'Giới thiệu' : 'About'}</a>
            <a href={localPath('/docs', lang)}>{isVi ? 'Tài liệu' : 'Docs'}</a>
            <a href="https://github.com/thuanlyt/osblog" target="_blank" rel="noopener noreferrer">GitHub</a>
            <span>MIT</span>
          </div>
          <span className="pixel-footer-cat" aria-hidden="true"><i /><b /></span>
        </footer>
      </div>
    </div>
  )
}
