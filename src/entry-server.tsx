import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { App } from './app/App'
import type { PageData } from './app/types'
import { renderDocument, type ClientAssets } from './server/seo'
import { createRouter, type RouterOptions } from './server/router'
import { createNodeHandler } from './server/node-adapter'

declare const __OSBLOG_ASSETS__: ClientAssets
const assets = typeof __OSBLOG_ASSETS__ === 'undefined' ? { scripts: ['/src/main.tsx'], styles: [] } : __OSBLOG_ASSETS__
export function render(data: PageData, origin: string, nonce: string) {
  const body = renderToString(<StaticRouter location={data.path}><App initialData={data}/></StaticRouter>)
  return renderDocument(body, data, origin, nonce, assets)
}
export const createApp = (options: Omit<RouterOptions, 'render'> = {}) => createRouter({ ...options, render })
export const handle = createApp()
export const nodeHandler = createNodeHandler(handle)
