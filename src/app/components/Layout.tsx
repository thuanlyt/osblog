import { useState, type ReactNode } from 'react'
import { localPath, type Language } from '../types'
import { GlobeIcon, MenuIcon, CloseIcon } from '../icons'
import { ThemeToggle } from './ThemeToggle'

const NAV_LINKS_EN = [
  { to: '/', label: 'Home' },
  { to: '/archive', label: 'Archive' },
  { to: '/docs', label: 'Docs' },
  { to: '/about', label: 'About' },
]
const NAV_LINKS_VI = [
  { to: '/', label: 'Trang chủ' },
  { to: '/archive', label: 'Lưu trữ' },
  { to: '/docs', label: 'Tài liệu' },
  { to: '/about', label: 'Giới thiệu' },
]

export function PublicLayout({ lang, path, children }: { lang: Language; path: string; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const links = lang === 'vi' ? NAV_LINKS_VI : NAV_LINKS_EN
  const otherLang: Language = lang === 'vi' ? 'en' : 'vi'

  return (
    <div className="app-shell">
      <a className="skip-link" href="#app-main">{lang === 'vi' ? 'Đi tới nội dung chính' : 'Skip to main content'}</a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href={localPath('/', lang)} aria-label="osblog home">
            <span className="brand-mark" aria-hidden="true">o/</span>
            <span>osblog</span>
          </a>
          <button
            type="button"
            className="icon-button nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            aria-label={menuOpen ? (lang === 'vi' ? 'Đóng menu' : 'Close menu') : (lang === 'vi' ? 'Mở menu' : 'Open menu')}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <nav className="site-nav" id="primary-nav" aria-label="Primary navigation" data-open={menuOpen}>
            {links.map((link) => (
              <a key={link.to} href={localPath(link.to, lang)} aria-current={path === link.to ? 'page' : undefined}>{link.label}</a>
            ))}
            <a className="lang-switch" href={localPath(path, otherLang)} lang={otherLang} aria-label={otherLang === 'vi' ? 'Chuyển sang tiếng Việt' : 'Switch to English'}>
              <GlobeIcon />
              <span>{otherLang === 'vi' ? 'VI' : 'EN'}</span>
            </a>
            <ThemeToggle />
            <a className="nav-admin" href="/admin/login">{lang === 'vi' ? 'Quản trị' : 'Admin'}</a>
          </nav>
        </div>
      </header>
      <main id="app-main" className="page-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div>
          <strong>osblog</strong>
          <span>{lang === 'vi' ? 'Ý tưởng mở, viết bằng hai ngôn ngữ.' : 'Open source ideas, in Vietnamese and English.'}</span>
        </div>
        <div className="footer-links">
          <a href="https://github.com/thuanlyt/osblog" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={localPath('/docs', lang)}>{lang === 'vi' ? 'Tài liệu' : 'Docs'}</a>
          <span className="footer-note">MIT licensed</span>
        </div>
      </footer>
    </div>
  )
}
