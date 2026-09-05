import { useEffect, useMemo, useState } from 'react'
import type { AdminComment } from '../types'
import { displayDate } from '../types'
import { ApiError, deleteAdminComment, fetchAdminComments, moderateComment } from '../api'
import { AlertIcon, CheckIcon, ClockIcon, SpinnerIcon, TrashIcon } from '../icons'

type Filter = 'pending' | 'approved' | 'rejected' | 'spam' | 'all'

const TABS: { key: Filter; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'spam', label: 'Spam' },
  { key: 'all', label: 'All' },
]

export function AdminModerationPage() {
  const [comments, setComments] = useState<AdminComment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('pending')
  const [actionError, setActionError] = useState<string | null>(null)
  const [reasonDraft, setReasonDraft] = useState<Record<string, string>>({})
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  function load(signal?: AbortSignal) {
    setError(null)
    fetchAdminComments(signal)
      .then(setComments)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(reason instanceof ApiError ? reason.message : 'Comments could not be loaded.')
      })
  }

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [])

  const filtered = useMemo(() => {
    if (!comments) return []
    return filter === 'all' ? comments : comments.filter((comment) => comment.status === filter)
  }, [comments, filter])

  async function act(comment: AdminComment, status: 'approved' | 'rejected' | 'spam') {
    setActionError(null)
    setBusyId(comment.id)
    try {
      await moderateComment(comment.id, { status, expectedUpdatedAt: comment.updatedAt, reason: reasonDraft[comment.id]?.trim() || null })
      load()
    } catch (reason: unknown) {
      setActionError(reason instanceof ApiError ? reason.message : 'The comment could not be updated.')
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete(comment: AdminComment) {
    setActionError(null)
    setBusyId(comment.id)
    try {
      await deleteAdminComment(comment.id, comment.updatedAt)
      setPendingDeleteId(null)
      load()
    } catch (reason: unknown) {
      setActionError(reason instanceof ApiError ? reason.message : 'The comment could not be deleted.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Community</p>
          <h1>Moderation</h1>
        </div>
      </div>

      <div className="filter-tabs" role="tablist" aria-label="Comment status">
        {TABS.map((tab) => (
          <button key={tab.key} type="button" role="tab" aria-selected={filter === tab.key} className={filter === tab.key ? 'filter-tab filter-tab-active' : 'filter-tab'} onClick={() => setFilter(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {actionError && <p className="status-note status-note-error" role="alert"><AlertIcon /> {actionError}</p>}

      {error && (
        <div className="status-note status-note-error" role="alert">
          <AlertIcon /> {error}
          <button type="button" className="button button-secondary" onClick={() => load()}>Retry</button>
        </div>
      )}
      {!error && comments === null && <p role="status" className="admin-loading"><SpinnerIcon /> Loading comments…</p>}
      {!error && comments !== null && filtered.length === 0 && (
        <div className="empty-card"><span className="empty-index">—</span><div><h3>No comments here.</h3><p>Nothing needs attention in this queue right now.</p></div></div>
      )}

      {!error && filtered.length > 0 && (
        <ul className="moderation-list">
          {filtered.map((comment) => (
            <li key={comment.id} className="moderation-row">
              <p className="moderation-meta">
                <span className={`status-badge status-badge-${comment.status === 'approved' ? 'published' : comment.status === 'pending' ? 'draft' : 'archived'}`}><ClockIcon /> {comment.status}</span>
                <span>{displayDate(comment.createdAt, 'en')}</span>
                <span className="text-muted">post {comment.postId.slice(0, 8)}…</span>
              </p>
              <p className="moderation-body">{comment.body}</p>
              {comment.moderationReason && <p className="moderation-reason">Reason: {comment.moderationReason}</p>}
              <div className="moderation-actions">
                {comment.status !== 'approved' && (
                  <button type="button" className="button button-primary" disabled={busyId === comment.id} onClick={() => act(comment, 'approved')}><CheckIcon /> Approve</button>
                )}
                {comment.status !== 'rejected' && (
                  <button type="button" className="button button-secondary" disabled={busyId === comment.id} onClick={() => act(comment, 'rejected')}>Reject</button>
                )}
                {comment.status !== 'spam' && (
                  <button type="button" className="button button-secondary" disabled={busyId === comment.id} onClick={() => act(comment, 'spam')}>Mark spam</button>
                )}
                <label className="moderation-reason-field">
                  <span className="visually-hidden">Moderation reason for {comment.id}</span>
                  <input placeholder="Reason (optional)" value={reasonDraft[comment.id] ?? ''} onChange={(event) => setReasonDraft((prev) => ({ ...prev, [comment.id]: event.target.value }))} />
                </label>
                {pendingDeleteId === comment.id ? (
                  <span className="confirm-inline">
                    <span>Delete this comment permanently?</span>
                    <button type="button" className="button button-primary" disabled={busyId === comment.id} onClick={() => confirmDelete(comment)}>Yes, delete</button>
                    <button type="button" className="button button-secondary" onClick={() => setPendingDeleteId(null)}>Cancel</button>
                  </span>
                ) : (
                  <button type="button" className="button button-secondary" onClick={() => setPendingDeleteId(comment.id)}><TrashIcon /> Delete</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
