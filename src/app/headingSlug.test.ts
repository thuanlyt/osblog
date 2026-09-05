import { describe, expect, it } from 'vitest'
import { slugifyHeading, stripDuplicateLeadingH1 } from './headingSlug'

describe('slugifyHeading', () => {
  it('lowercases, hyphenates spaces, and strips punctuation while keeping Vietnamese letters', () => {
    expect(slugifyHeading('Getting started')).toBe('getting-started')
    expect(slugifyHeading('Cấu hình môi trường')).toBe('cấu-hình-môi-trường')
    expect(slugifyHeading('Node.js 20+ & npm')).toBe('nodejs-20-npm')
  })
})

describe('stripDuplicateLeadingH1', () => {
  it('removes a leading H1 that duplicates the page title', () => {
    const body = '# Getting started\n\n## Requirements\n\ntext'
    expect(stripDuplicateLeadingH1(body, 'Getting started')).toBe('## Requirements\n\ntext')
  })

  it('leaves the body untouched when the leading heading does not match the title', () => {
    const body = '# Something else\n\ntext'
    expect(stripDuplicateLeadingH1(body, 'Getting started')).toBe(body)
  })

  it('leaves the body untouched when there is no leading heading', () => {
    const body = 'Just a paragraph.\n\n## Requirements'
    expect(stripDuplicateLeadingH1(body, 'Getting started')).toBe(body)
  })
})
