import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import type { Category, PageData, Post } from './types'

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

function jsonResponse(data: unknown, ok = true, status = ok ? 200 : 400) {
  return Promise.resolve({ ok, status, json: async () => ({ data: ok ? data : null, error: ok ? null : { code: 'REQUEST_FAILED', message: String(data) }, requestId: 'req-1' }) } as Response)
}

const category: Category = { id: 'cat-1', slug: 'open-source', nameEn: 'Open source', nameVi: 'Mã nguồn mở', descriptionEn: null, descriptionVi: null, isArchived: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }

const post: Post = {
  id: 'post-1', categoryId: 'cat-1', slug: 'hello-world', titleEn: 'Hello world', titleVi: 'Xin chào',
  excerptEn: 'An excerpt', excerptVi: 'Tóm tắt', bodyEn: 'Body text with a [safe link](https://example.com) and **bold**.', bodyVi: 'Nội dung',
  coverImageUrl: null, coverImageAltEn: null, coverImageAltVi: null,
  seoTitleEn: null, seoTitleVi: null, seoDescriptionEn: null, seoDescriptionVi: null,
  status: 'published', publishedAt: '2026-01-02T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z', viewCount: 3,
  category: { id: 'cat-1', slug: 'open-source', nameEn: 'Open source', nameVi: 'Mã nguồn mở' },
}

function baseData(overrides: Partial<PageData>): PageData {
  return { kind: 'home', path: '/', lang: 'en', title: 'osblog', description: '', status: 200, ...overrides }
}

function renderApp(data: PageData) {
  return render(<BrowserRouter><App initialData={data} /></BrowserRouter>)
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.history.pushState({}, '', '/')
})

describe('public pages', () => {
  it('renders a semantic, bilingual-ready home shell with published posts', () => {
    const data = baseData({ kind: 'home', posts: [post], categories: [category], years: ['2026'], total: 1, page: 1, limit: 9, query: { q: '', category: '', year: '', sort: 'latest' } })
    renderApp(data)
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'app-main')
    expect(screen.getByRole('heading', { name: /Ideas worth sharing/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Hello world' })).toHaveAttribute('href', '/post/hello-world?lang=en')
  })

  it('renders an empty archive state without posts', () => {
    const data = baseData({ kind: 'archive', path: '/archive', posts: [], categories: [category], years: [], total: 0, page: 1, limit: 9, query: { q: '', category: '', year: '', sort: 'latest' } })
    renderApp(data)
    expect(screen.getByRole('heading', { name: 'osblog' })).toBeInTheDocument()
    expect(screen.getByText(/No matching articles yet/i)).toBeInTheDocument()
  })

  it('renders the 404 page for not-found data', () => {
    renderApp(baseData({ kind: 'not-found', path: '/nope', status: 404 }))
    expect(screen.getByRole('heading', { name: /not here/i })).toBeInTheDocument()
  })

  it('shows a single doc title heading with an anchor id, even when the body repeats it as an H1', () => {
    const doc = { slug: 'getting-started', title: 'Getting started', description: '', body: '# Getting started\n\n## Requirements\n\nNode.js 20+.', lang: 'en' as const, order: 1 }
    renderApp(baseData({ kind: 'doc', path: '/docs/getting-started', doc, docs: [doc] }))
    expect(screen.getAllByRole('heading', { name: 'Getting started' })).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Getting started' })).toHaveAttribute('id', 'getting-started')
    expect(screen.getByRole('heading', { name: 'Requirements' })).toHaveAttribute('id', 'requirements')
  })

  describe('article page', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
        if (url === '/api/comments/token') return jsonResponse({ formToken: 'signed-token' })
        if (url.includes('/view')) return jsonResponse({ counted: true })
        if (url === '/api/comments') return jsonResponse({ accepted: true })
        return jsonResponse('not found', false, 404)
      }))
    })

    it('renders safe GFM markdown and refuses to execute injected raw HTML', () => {
      const injected: Post = { ...post, bodyEn: 'Safe **bold** text.\n\n<script data-marker="xss">window.__xss = true</script>\n\n<img src=x onerror="window.__xss2 = true">' }
      const data = baseData({ kind: 'article', path: '/post/hello-world', post: injected, comments: [], related: [] })
      renderApp(data)
      expect(screen.getByRole('heading', { name: 'Hello world' })).toBeInTheDocument()
      expect(screen.getByText('bold', { exact: false })).toBeInTheDocument()
      expect(document.querySelector('script[data-marker="xss"]')).toBeNull()
      expect(document.querySelector('img[onerror]')).toBeNull()
      expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined()
    })

    it('submits an article note and refreshes an expired token without losing the note', async () => {
      const fetchMock = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/comments/token') return jsonResponse({ formToken: 'signed-token' })
        if (url.includes('/view')) return jsonResponse({ counted: true })
        if (url === '/api/comments' && options?.method === 'POST') return jsonResponse({ accepted: true })
        return jsonResponse('not found', false, 404)
      })
      vi.stubGlobal('fetch', fetchMock)
      const data = baseData({ kind: 'article', path: '/post/hello-world', post, comments: [], related: [] })
      renderApp(data)
      expect(await screen.findByRole('heading', { name: 'Leave a note' })).toBeInTheDocument()
      const user = userEvent.setup()
      await user.type(screen.getByLabelText('Email'), 'person@example.test')
      await user.type(screen.getByLabelText('Your note'), 'A useful note')
      await user.click(screen.getByRole('button', { name: 'Send for review' }))
      expect(await screen.findByRole('status')).toHaveTextContent(/pending moderation/i)
      expect(fetchMock).toHaveBeenCalledWith('/api/comments', expect.objectContaining({ method: 'POST' }))
    })
  })
})

describe('admin login', () => {
  it('shows a clear error and keeps the form on invalid credentials', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: 'Invalid email or password.' }) }))
    renderApp(baseData({ kind: 'login', path: '/admin/login', title: 'Sign in' }))
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email'), 'admin@example.test')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Invalid email or password/i)
  })
})

describe('admin workspace', () => {
  it('loads the session and lists posts for an authenticated admin', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url === '/api/admin/session') return jsonResponse({ email: 'admin@example.test' })
      if (url === '/api/admin/posts') return jsonResponse([post])
      return jsonResponse('not found', false, 404)
    }))
    window.history.pushState({}, '', '/admin')
    renderApp(baseData({ kind: 'admin', path: '/admin', title: 'Publishing workspace' }))
    await waitFor(() => expect(screen.getByText('admin@example.test')).toBeInTheDocument())
    expect(await screen.findByRole('link', { name: 'Hello world' })).toBeInTheDocument()
  })
})
