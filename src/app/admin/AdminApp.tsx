import { useEffect, useRef, useState } from 'react'
import { Route, Routes, useLocation, useParams } from 'react-router-dom'
import type { PageData } from '../types'
import { ApiError, fetchAdminSession, signOut } from '../api'
import { AdminChrome, AdminNav } from './AdminShell'
import { AdminPostsPage } from './AdminPostsPage'
import { AdminPostEditorPage } from './AdminPostEditorPage'
import { AdminCategoriesPage } from './AdminCategoriesPage'
import { AdminModerationPage } from './AdminModerationPage'
import { clearAllDraftsForAdmin } from '../storage'
import { AlertIcon, SpinnerIcon } from '../icons'

function EditPostRoute({ email }: { email: string }) {
  const { id } = useParams()
  if (!id) return null
  return <AdminPostEditorPage mode="edit" postId={id} adminEmail={email} />
}

function FocusMainOnNavigate() {
  const location = useLocation()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    document.getElementById('app-main')?.focus()
  }, [location.pathname])

  return null
}

export function AdminApp({ data }: { data: PageData }) {
  const [session, setSession] = useState<{ status: 'loading' | 'ready' | 'unauthorized' | 'error'; email: string | null; message: string }>({ status: 'loading', email: data.adminEmail ?? null, message: '' })

  useEffect(() => {
    const controller = new AbortController()
    fetchAdminSession(controller.signal)
      .then((result) => setSession({ status: 'ready', email: result.email, message: '' }))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        if (reason instanceof ApiError && reason.status === 401) {
          window.location.href = '/admin/login'
          return
        }
        setSession({ status: 'error', email: null, message: reason instanceof ApiError ? reason.message : 'Could not verify your session.' })
      })
    return () => controller.abort()
  }, [])

  async function handleLogout() {
    if (session.email) clearAllDraftsForAdmin(session.email)
    await signOut()
    window.location.href = '/admin/login'
  }

  if (session.status === 'loading') {
    return (
      <AdminChrome email={null} lang={data.lang}>
        <div className="content-wrap admin-loading" role="status">
          <SpinnerIcon /> Checking your session…
        </div>
      </AdminChrome>
    )
  }

  if (session.status === 'error' || session.status === 'unauthorized') {
    return (
      <AdminChrome email={null} lang={data.lang}>
        <div className="content-wrap narrow-wrap">
          <p className="status-note status-note-error" role="alert"><AlertIcon /> {session.message}</p>
          <a className="button button-secondary" href="/admin/login">Sign in again</a>
        </div>
      </AdminChrome>
    )
  }

  const email = session.email ?? ''

  return (
    <AdminChrome email={email} lang={data.lang} onLogout={handleLogout}>
      <div className="admin-layout">
        <AdminNav />
        <div className="admin-content">
          <FocusMainOnNavigate />
          <Routes>
            <Route path="/admin" element={<AdminPostsPage adminEmail={email} />} />
            <Route path="/admin/posts/new" element={<AdminPostEditorPage mode="new" adminEmail={email} />} />
            <Route path="/admin/posts/:id/edit" element={<EditPostRoute email={email} />} />
            <Route path="/admin/categories" element={<AdminCategoriesPage />} />
            <Route path="/admin/comments" element={<AdminModerationPage />} />
            <Route path="*" element={<AdminPostsPage adminEmail={email} />} />
          </Routes>
        </div>
      </div>
    </AdminChrome>
  )
}
