import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { App } from './app/App'
import { renderHtmlDocument, seoForPath } from './server/seo'

/**
 * Route-aware SSR boundary for the Vercel Node function.
 * Provider-backed article data is still loaded by the client until the
 * server query snapshot is wired into this entry in a later slice.
 */
export function render(url: string) {
  const body = renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  )
  return renderHtmlDocument(body, seoForPath(url))
}
