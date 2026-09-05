import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AdminPostEditorPage } from './AdminPostEditorPage'
import type { Post } from '../types'

function jsonResponse(data: unknown, ok = true, status = ok ? 200 : 400, error?: { code: string; message: string; fields?: Record<string, string[]> }) {
  return Promise.resolve({ ok, status, json: async () => ({ data: ok ? data : null, error: ok ? null : (error ?? { code: 'REQUEST_FAILED', message: String(data) }), requestId: 'req-1' }) } as Response)
}

const post: Post = {
  id: 'post-1', categoryId: 'cat-1', slug: 'hello-world', titleEn: 'Hello world', titleVi: 'Xin chào',
  excerptEn: 'An excerpt', excerptVi: 'Tóm tắt', bodyEn: 'Body content in English.', bodyVi: 'Nội dung tiếng Việt.',
  coverImageUrl: null, coverImageAltEn: null, coverImageAltVi: null,
  seoTitleEn: null, seoTitleVi: null, seoDescriptionEn: null, seoDescriptionVi: null,
  status: 'draft', publishedAt: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z', viewCount: 0,
  category: { id: 'cat-1', slug: 'open-source', nameEn: 'Open source', nameVi: 'Mã nguồn mở' },
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.localStorage.clear()
})

function renderEditor(props: Parameters<typeof AdminPostEditorPage>[0]) {
  return render(<BrowserRouter><AdminPostEditorPage {...props} /></BrowserRouter>)
}

describe('draft recovery', () => {
  it('offers to restore an unsaved draft found after a reload, and keeps it out of the way until asked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url === '/api/admin/categories') return jsonResponse([])
      return jsonResponse('not found', false, 404)
    }))

    const user = userEvent.setup()
    const { unmount } = renderEditor({ mode: 'new', adminEmail: 'admin@example.test' })
    const titleInput = await screen.findByLabelText('Title (English)')
    await user.type(titleInput, 'Draft in progress')
    await waitFor(() => expect(window.localStorage.getItem('osblog:draft:admin@example.test:new')).toContain('Draft in progress'), { timeout: 2000 })
    unmount()

    renderEditor({ mode: 'new', adminEmail: 'admin@example.test' })
    expect(await screen.findByText(/unsaved draft/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Title (English)')).toHaveValue('')
    await user.click(screen.getByRole('button', { name: 'Restore draft' }))
    expect(screen.getByLabelText('Title (English)')).toHaveValue('Draft in progress')
  })
})

describe('SEO preview', () => {
  it('shows a relative preview URL with no hardcoded personal domain when VITE_SITE_URL is unset', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url === '/api/admin/categories') return jsonResponse([])
      return jsonResponse('not found', false, 404)
    }))
    const user = userEvent.setup()
    renderEditor({ mode: 'new', adminEmail: 'admin@example.test' })
    const titleInput = await screen.findByLabelText('Title (English)')
    await user.type(titleInput, 'A real publishing walkthrough')
    const slugInput = screen.getByLabelText('Slug')
    await user.click(slugInput)
    await user.tab()
    expect(slugInput).toHaveValue('a-real-publishing-walkthrough')
    expect(screen.getByText('/post/a-real-publishing-walkthrough', { selector: '.seo-preview-url' })).toBeInTheDocument()
  })
})

describe('editing language tabs', () => {
  it('wires each tab to its panel with aria-controls and aria-labelledby', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url === '/api/admin/categories') return jsonResponse([])
      return jsonResponse('not found', false, 404)
    }))
    renderEditor({ mode: 'new', adminEmail: 'admin@example.test' })
    const enTab = await screen.findByRole('tab', { name: 'English' })
    const viTab = screen.getByRole('tab', { name: 'Tiếng Việt' })
    const panel = screen.getByRole('tabpanel')
    expect(enTab).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveAttribute('aria-labelledby', enTab.id)
    expect(viTab).toHaveAttribute('aria-controls')
    expect(viTab.id).toBeTruthy()
  })
})

describe('conflict handling', () => {
  it('warns on a published slug change, preserves text on reserved-slug 409 and resets the warning after saving', async () => {
    let rejectSlug = true
    const published = { ...post, status: 'published', publishedAt: '2026-01-01T00:00:00.000Z' }
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url === '/api/admin/categories') return jsonResponse([])
      if (url === '/api/admin/posts/post-1' && options?.method === 'GET') return jsonResponse(published)
      if (url === '/api/admin/posts/post-1' && options?.method === 'PATCH') {
        return rejectSlug ? jsonResponse(null, false, 409, { code: 'SLUG_TAKEN', message: 'This slug is already in use.', fields: { slug: ['Choose an unused slug.'] } })
          : jsonResponse({ ...published, ...JSON.parse(String(options.body)), updatedAt: '2026-01-03T00:00:00.000Z' })
      }
      return jsonResponse('not found', false, 404)
    }))
    const user = userEvent.setup()
    renderEditor({ mode: 'edit', postId: 'post-1', adminEmail: 'admin@example.test' })
    const slug = await screen.findByLabelText('Slug')
    expect(screen.queryByText(/Previously published URLs permanently redirect/)).not.toBeInTheDocument()
    await user.clear(slug)
    await user.type(slug, 'renamed-article')
    expect(screen.getByText(/Previously published URLs permanently redirect/)).toBeInTheDocument()
    expect(slug).toHaveAttribute('aria-describedby', 'post-slug-warning')
    expect(screen.getByRole('link', { name: '/post/renamed-article' })).toHaveAttribute('href', '/post/renamed-article')
    const body = screen.getByLabelText('Body (English)')
    await user.clear(body)
    await user.type(body, 'Unsaved body to preserve.')
    await user.click(screen.getByRole('button', { name: 'Publish' }))
    expect(await screen.findByText('Choose an unused slug.')).toBeInTheDocument()
    expect(slug).toHaveAttribute('aria-invalid', 'true')
    expect(slug).toHaveValue('renamed-article')
    expect(body).toHaveValue('Unsaved body to preserve.')
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    rejectSlug = false
    await user.click(screen.getByRole('button', { name: 'Publish' }))
    await waitFor(() => expect(screen.queryByText(/Previously published URLs permanently redirect/)).not.toBeInTheDocument())
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
  })

  it('keeps the edited text and offers an explicit reload when the server reports a conflict', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url === '/api/admin/categories') return jsonResponse([])
      if (url === '/api/admin/posts/post-1' && options?.method === 'GET') return jsonResponse(post)
      if (url === '/api/admin/posts/post-1' && options?.method === 'PATCH') {
        return jsonResponse('conflict', false, 409, { code: 'CONFLICT', message: 'This post changed in another session. Your text is still here; reload the latest version before saving.' })
      }
      return jsonResponse('not found', false, 404)
    }))

    const user = userEvent.setup()
    renderEditor({ mode: 'edit', postId: 'post-1', adminEmail: 'admin@example.test' })
    const titleInput = await screen.findByLabelText('Title (English)')
    expect(titleInput).toHaveValue('Hello world')
    await user.clear(titleInput)
    await user.type(titleInput, 'Hello world, edited locally')

    await user.click(screen.getByRole('button', { name: 'Save draft' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/changed in another session/i)
    expect(screen.getByRole('button', { name: 'Reload latest version' })).toBeInTheDocument()
    expect(titleInput).toHaveValue('Hello world, edited locally')
  })
})
