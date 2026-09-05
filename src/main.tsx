import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './app/App'
import type { PageData } from './app/types'
import '@fontsource-variable/source-serif-4/wght.css'
import '@fontsource-variable/source-serif-4/wght-italic.css'
import '@fontsource-variable/playfair-display/wght.css'
import './styles.css'

const rootElement = document.getElementById('root')
const dataElement = document.getElementById('osblog-data')

function renderStartupError(message: string) {
  if (!rootElement) return
  createRoot(rootElement).render(
    <StrictMode>
      <div className="content-wrap narrow-wrap" role="alert">
        <p className="eyebrow">Error</p>
        <h1>osblog could not start</h1>
        <p className="page-lede">{message}</p>
      </div>
    </StrictMode>,
  )
}

if (!rootElement) {
  throw new Error('#root element is missing from the document')
}

if (!dataElement?.textContent) {
  renderStartupError('No page data was provided by the server. Reload the page; if this keeps happening, the site may be temporarily unavailable.')
} else {
  let initialData: PageData
  try {
    initialData = JSON.parse(dataElement.textContent) as PageData
  } catch {
    renderStartupError('The page data returned by the server was invalid.')
    initialData = undefined as unknown as PageData
  }
  if (initialData) {
    hydrateRoot(
      rootElement,
      <StrictMode>
        <BrowserRouter>
          <App initialData={initialData} />
        </BrowserRouter>
      </StrictMode>,
    )
  }
}
