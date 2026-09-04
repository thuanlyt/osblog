import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.history.pushState({}, '', '/')
})

function renderApp() {
  return render(<BrowserRouter><App /></BrowserRouter>)
}

describe('osblog scaffold routes', () => {
  it('renders a semantic, bilingual-ready home shell', () => {
    renderApp()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'app-main')
    expect(screen.getByRole('heading', { name: /Ideas worth sharing/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Explore writing/i })).toHaveAttribute('href', '/category/open-source')
  })

  it('renders a deep-linked admin placeholder without exposing CRUD', () => {
    window.history.pushState({}, '', '/admin')
    renderApp()
    expect(screen.getByRole('heading', { name: 'Publishing workspace' })).toBeInTheDocument()
    expect(screen.getByText(/CRUD and moderation will be backed/i)).toBeInTheDocument()
  })

  it('renders published posts returned by the server API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 'post-1', slug: 'real-post', titleEn: 'A real post', excerptEn: 'A server response', category: { nameEn: 'Open source' } }],
        error: null,
        requestId: 'request-1',
      }),
    }))
    renderApp()
    expect(await screen.findByRole('link', { name: 'A real post' })).toHaveAttribute('href', '/post/real-post')
  })

  it('submits an article note through the server token and pending API', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/api/posts/slug/')) return Promise.resolve({ ok: true, json: async () => ({ data: { id: 'post-1', slug: 'real-post', titleEn: 'A real post', excerptEn: 'A server response', bodyEn: 'Body', category: { id: 'category-1', slug: 'open-source', nameEn: 'Open source' } }, error: null, requestId: 'request-1' }) })
      if (url === '/api/comments/token') return Promise.resolve({ ok: true, json: async () => ({ data: { token: 'signed-token' }, error: null, requestId: 'request-2' }) })
      expect(options?.method).toBe('POST')
      return Promise.resolve({ ok: true, json: async () => ({ data: { accepted: true }, error: null, requestId: 'request-3' }) })
    })
    vi.stubGlobal('fetch', fetchMock)
    window.history.pushState({}, '', '/post/real-post')
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Leave a note' })).toBeInTheDocument()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email'), 'person@example.test')
    await user.type(screen.getByLabelText('Your note'), 'A useful note')
    await user.click(screen.getByRole('button', { name: 'Send for review' }))
    expect(await screen.findByRole('status')).toHaveTextContent(/pending moderation/i)
    expect(fetchMock).toHaveBeenCalledWith('/api/comments', expect.objectContaining({ method: 'POST' }))
  })
})
