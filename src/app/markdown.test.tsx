import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { SafeMarkdown } from './markdown'

afterEach(() => {
  cleanup()
})

describe('SafeMarkdown', () => {
  it('does not leak the internal AST node prop onto rendered links or images', () => {
    render(<SafeMarkdown content={'A [link](https://example.com) and ![alt text](https://example.com/pic.png)'} lang="en" />)
    const link = screen.getByRole('link', { name: 'link' })
    expect(link).not.toHaveAttribute('node')
    const image = screen.getByRole('img', { name: 'alt text' })
    expect(image).not.toHaveAttribute('node')
  })

  it('maps relative docs Markdown links to the /docs route when mapLinks is enabled', () => {
    render(<SafeMarkdown content={'See [Getting started](getting-started.md) or [tiếng Việt](vi/getting-started.md).'} lang="en" mapLinks />)
    expect(screen.getByRole('link', { name: 'Getting started' })).toHaveAttribute('href', '/docs/getting-started')
    expect(screen.getByRole('link', { name: 'tiếng Việt' })).toHaveAttribute('href', '/docs/getting-started?lang=vi')
  })

  it('refuses to render raw HTML as live markup', () => {
    render(<SafeMarkdown content={'Safe text.\n\n<script data-marker="xss">window.__xss = true</script>'} lang="en" />)
    expect(screen.getByText('Safe text.')).toBeInTheDocument()
    expect(document.querySelector('script[data-marker="xss"]')).toBeNull()
  })

  it('gives headings deterministic, GitHub-style anchor ids, including Vietnamese diacritics', () => {
    render(<SafeMarkdown content={'## Cấu hình môi trường\n\ntext\n\n## Kết luận'} lang="vi" />)
    expect(screen.getByRole('heading', { name: 'Cấu hình môi trường' })).toHaveAttribute('id', 'cấu-hình-môi-trường')
    expect(screen.getByRole('heading', { name: 'Kết luận' })).toHaveAttribute('id', 'kết-luận')
  })

  it('deduplicates repeated heading text with -1, -2 suffixes', () => {
    render(<SafeMarkdown content={'## Overview\n\ntext\n\n## Overview'} lang="en" />)
    const headings = screen.getAllByRole('heading', { name: 'Overview' })
    expect(headings.map((heading) => heading.id)).toEqual(['overview', 'overview-1'])
  })
})
