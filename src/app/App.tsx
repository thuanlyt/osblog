import type { PageData } from './types'
import { PublicLayout } from './components/Layout'
import { HomePage, ArchivePage } from './pages/HomePage'
import { ArticlePage } from './pages/ArticlePage'
import { DocsPage } from './pages/DocsPage'
import { AboutPage, ErrorPage, NotFoundPage } from './pages/StaticPages'
import { AdminLoginPage } from './admin/AdminLoginPage'
import { AdminApp } from './admin/AdminApp'

export function App({ initialData }: { initialData: PageData }) {
  if (initialData.kind === 'login') return <AdminLoginPage data={initialData} />
  if (initialData.kind === 'admin') return <AdminApp data={initialData} />

  return (
    <PublicLayout lang={initialData.lang} path={initialData.path}>
      {renderPublicPage(initialData)}
    </PublicLayout>
  )
}

function renderPublicPage(data: PageData) {
  switch (data.kind) {
    case 'home':
      return <HomePage data={data} />
    case 'archive':
      return <ArchivePage data={data} />
    case 'article':
      return <ArticlePage data={data} />
    case 'docs':
    case 'doc':
      return <DocsPage data={data} />
    case 'about':
      return <AboutPage data={data} />
    case 'error':
      return <ErrorPage data={data} />
    case 'not-found':
    default:
      return <NotFoundPage data={data} />
  }
}
