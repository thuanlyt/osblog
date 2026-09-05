import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { isValidElement, type AnchorHTMLAttributes, type HTMLAttributes, type ImgHTMLAttributes, type ReactNode } from 'react'
import type { Language } from './types'
import { mapMarkdownHref } from './docLinks'
import { createHeadingIdAllocator } from './headingSlug'

interface MarkdownNodeProp { node?: unknown }

function headingText(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(headingText).join('')
  if (isValidElement(children)) return headingText((children.props as { children?: ReactNode }).children)
  return ''
}

function headingRenderer(Tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', allocateId: (text: string) => string) {
  return function Heading({ children, node: _node, ...rest }: HTMLAttributes<HTMLHeadingElement> & MarkdownNodeProp) {
    void _node
    return <Tag id={allocateId(headingText(children))} {...rest}>{children}</Tag>
  }
}

function LinkRenderer({ mapLinks, docLang, href = '', children, node: _node, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & MarkdownNodeProp & { mapLinks?: boolean; docLang: Language }) {
  void _node
  const resolved = mapLinks && /\.md(#.*)?$/i.test(href) ? mapMarkdownHref(href, docLang) : href
  const isExternal = /^https?:\/\//i.test(resolved)
  return isExternal
    ? <a href={resolved} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>
    : <a href={resolved} {...rest}>{children}</a>
}

function ImageRenderer({ alt = '', node: _node, ...rest }: ImgHTMLAttributes<HTMLImageElement> & MarkdownNodeProp) {
  void _node
  return <img alt={alt} loading="lazy" decoding="async" {...rest} />
}

export function SafeMarkdown({ content, lang, mapLinks = false, className }: { content: string; lang: Language; mapLinks?: boolean; className?: string }) {
  const allocateId = createHeadingIdAllocator()
  const components: Components = {
    a: (props) => <LinkRenderer mapLinks={mapLinks} docLang={lang} {...props} />,
    img: (props) => <ImageRenderer {...props} />,
    pre: ({ children }) => <pre className="md-pre" tabIndex={0}>{children}</pre>,
    table: ({ children }) => <div className="md-table-wrap" tabIndex={0}><table>{children}</table></div>,
    h1: headingRenderer('h1', allocateId),
    h2: headingRenderer('h2', allocateId),
    h3: headingRenderer('h3', allocateId),
    h4: headingRenderer('h4', allocateId),
    h5: headingRenderer('h5', allocateId),
    h6: headingRenderer('h6', allocateId),
  }
  return (
    <div className={className ? `md-body ${className}` : 'md-body'}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
        {content}
      </ReactMarkdown>
    </div>
  )
}
