import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Post } from '../types'
import { ApiError, archiveAdminPost, fetchAdminPosts } from '../api'
import { AlertIcon, CheckIcon, ClockIcon, PlusIcon, SpinnerIcon, TrashIcon } from '../icons'

const STATUS_LABEL: Record<Post['status'], string> = { draft: 'Draft', published: 'Published', archived: 'Archived' }

function StatusBadge({ status }: { status: Post['status'] }) {
  const icon = status === 'published' ? <CheckIcon /> : status === 'archived' ? <TrashIcon /> : <ClockIcon />
  return <span className={`status-badge status-badge-${status}`}>{icon} {STATUS_LABEL[status]}</span>
}

export function AdminPostsPage({ adminEmail }: { adminEmail: string }) {
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  function load(signal?: AbortSignal) {
    setError(null)
    fetchAdminPosts(signal)
      .then(setPosts)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(reason instanceof ApiError ? reason.message : 'Posts could not be loaded.')
      })
  }

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [])

  async function confirmArchive(post: Post) {
    setActionError(null)
    try {
      await archiveAdminPost(post.id, post.updatedAt)
      setPendingArchiveId(null)
      load()
    } catch (reason: unknown) {
      setActionError(reason instanceof ApiError ? reason.message : 'The post could not be archived.')
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Publishing</p>
          <h1>Posts</h1>
        </div>
        <Link className="button button-primary" to="/admin/posts/new"><PlusIcon /> New post</Link>
      </div>

      {actionError && <p className="status-note status-note-error" role="alert"><AlertIcon /> {actionError}</p>}

      {error && (
        <div className="status-note status-note-error" role="alert">
          <AlertIcon /> {error}
          <button type="button" className="button button-secondary" onClick={() => load()}>Retry</button>
        </div>
      )}

      {!error && posts === null && <p role="status" className="admin-loading"><SpinnerIcon /> Loading posts…</p>}

      {!error && posts !== null && posts.length === 0 && (
        <div className="empty-card">
          <span className="empty-index">—</span>
          <div>
            <h3>No posts yet.</h3>
            <p>Create your first post to see it here.</p>
          </div>
          <Link className="text-link" to="/admin/posts/new">Create a post</Link>
        </div>
      )}

      {!error && posts !== null && posts.length > 0 && (
        <ul className="admin-post-list">
          {posts.map((post) => (
            <li key={post.id} className="admin-post-row">
              <div className="admin-post-row-main">
                <h3><Link to={`/admin/posts/${post.id}/edit`}>{post.titleEn}</Link></h3>
                <p className="admin-post-row-meta">
                  <StatusBadge status={post.status} />
                  <span>{post.category.nameEn}</span>
                  <span>{post.viewCount} views</span>
                </p>
              </div>
              <div className="admin-post-row-actions">
                <Link className="button button-secondary" to={`/admin/posts/${post.id}/edit`}>Edit</Link>
                {post.status !== 'archived' && (
                  pendingArchiveId === post.id ? (
                    <span className="confirm-inline">
                      <span>Archive this post?</span>
                      <button type="button" className="button button-primary" onClick={() => confirmArchive(post)}>Yes, archive</button>
                      <button type="button" className="button button-secondary" onClick={() => setPendingArchiveId(null)}>Cancel</button>
                    </span>
                  ) : (
                    <button type="button" className="button button-secondary" onClick={() => setPendingArchiveId(post.id)}>
                      <TrashIcon /> Archive
                    </button>
                  )
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="admin-identity-hint">Signed in as {adminEmail}</p>
    </div>
  )
}
