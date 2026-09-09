import { useEffect, useRef, useState } from 'react'
import { displayDate, localPath, localized, type PageData } from '../types'
import { SafeMarkdown } from '../markdown'
import { ApiError, fetchCommentToken, postComment, recordView } from '../api'
import { ArrowUpRightIcon, ClockIcon } from '../icons'

function CommentForm({ postId, lang }: { postId: string; lang: 'en' | 'vi' }) {
  const isVi = lang === 'vi'
  const submitControllerRef = useRef<AbortController | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [body, setBody] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [state, setState] = useState<'loading' | 'ready' | 'submitting' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetchCommentToken(controller.signal)
      .then((value) => { setToken(value); setState('ready') })
      .catch((reason: unknown) => { if (!(reason instanceof DOMException && reason.name === 'AbortError')) { setState('error'); setMessage(isVi ? 'Không thể tải biểu mẫu bình luận.' : 'The comment form is temporarily unavailable.') } })
    return () => { controller.abort(); submitControllerRef.current?.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim() || !body.trim()) return
    setState('submitting')
    setMessage('')
    const controller = new AbortController()
    submitControllerRef.current = controller
    try {
      let activeToken = token
      if (!activeToken) activeToken = await fetchCommentToken(controller.signal)
      await postComment({ postId, email: email.trim(), body: body.trim(), formToken: activeToken, honeypot }, controller.signal)
      setState('success')
      setMessage(isVi ? 'Cảm ơn — bình luận của bạn đang chờ duyệt.' : 'Thanks — your note is pending moderation.')
      setBody('')
    } catch (reason: unknown) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      if (reason instanceof ApiError && reason.code === 'INVALID_FORM_TOKEN') {
        try {
          const fresh = await fetchCommentToken(controller.signal)
          setToken(fresh)
          setState('ready')
          setMessage(isVi ? 'Biểu mẫu đã hết hạn và được làm mới. Vui lòng gửi lại — nội dung bạn đã nhập vẫn còn.' : 'The form expired and has been refreshed. Please send again — your text is still here.')
          return
        } catch { /* fall through to generic error */ }
      }
      setState('error')
      setMessage(reason instanceof ApiError ? reason.message : (isVi ? 'Không thể gửi bình luận. Vui lòng thử lại sau.' : 'The note could not be submitted. Please try again later.'))
    } finally {
      if (submitControllerRef.current === controller) submitControllerRef.current = null
    }
  }

  return (
    <section className="comment-section pixel-surface-panel pixel-comment-panel" aria-labelledby="comment-title">
      <div className="pixel-mini-heading">
        <strong>{isVi ? 'TRÒ CHUYỆN' : 'CONVERSATION'}</strong>
        <span aria-hidden="true">♥</span>
      </div>
      <h2 id="comment-title">{isVi ? 'Để lại bình luận' : 'Leave a note'}</h2>
      <p className="comment-intro">{isVi ? 'Email chỉ dùng để kiểm duyệt và không bao giờ được công khai.' : 'Email is used only for moderation and is never published.'}</p>
      {state === 'error' && <p className="status-note" role="alert">{message}</p>}
      {(state === 'success' || (state === 'ready' && message)) && <p className="status-note" role="status">{message}</p>}
      {state !== 'success' && (
        <form className="comment-form pixel-comment-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="comment-email">{isVi ? 'Email' : 'Email'}
            <input id="comment-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} aria-describedby="comment-email-hint" />
          </label>
          <span id="comment-email-hint" className="field-hint">{isVi ? 'Không hiển thị công khai.' : 'Never shown publicly.'}</span>
          <label htmlFor="comment-body">{isVi ? 'Nội dung' : 'Your note'}
            <textarea id="comment-body" name="body" rows={5} required maxLength={5000} value={body} onChange={(event) => setBody(event.target.value)} />
          </label>
          <label className="honeypot-field" htmlFor="comment-website" aria-hidden="true">
            Website
            <input id="comment-website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
          </label>
          <button className="button button-primary" type="submit" disabled={state === 'submitting' || state === 'loading'}>
            {state === 'submitting' ? (isVi ? 'Đang gửi…' : 'Sending…') : (isVi ? 'Gửi để duyệt' : 'Send for review')}
          </button>
        </form>
      )}
    </section>
  )
}

export function ArticlePage({ data }: { data: PageData }) {
  const post = data.post
  const lang = data.lang
  const isVi = lang === 'vi'
  const viewSent = useRef(false)

  useEffect(() => {
    if (!post || viewSent.current) return
    viewSent.current = true
    recordView(post.id).catch(() => { /* best effort only */ })
  }, [post])

  if (!post) {
    return (
      <div className="content-wrap narrow-wrap pixel-inner-page">
        <section className="pixel-page-banner pixel-state-banner">
          <div className="pixel-page-banner-copy">
            <p className="eyebrow">{isVi ? 'BÀI VIẾT' : 'ARTICLE'}</p>
            <h1>{isVi ? 'Không tìm thấy bài viết' : 'Article unavailable'}</h1>
            <p className="page-lede">{isVi ? 'Bài viết này chưa được xuất bản.' : 'This article is not published.'}</p>
          </div>
          <div className="pixel-page-banner-art" aria-hidden="true"><span className="pixel-banner-book" /></div>
        </section>
        <a className="button button-secondary" href={localPath('/archive', lang)}>{isVi ? 'Về kho lưu trữ' : 'Back to archive'} <ArrowUpRightIcon /></a>
      </div>
    )
  }

  const title = localized(post, 'title', lang)
  const body = localized(post, 'body', lang)
  const related = data.related ?? []
  const comments = data.comments ?? []
  const readMinutes = Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200))

  return (
    <article className="content-wrap narrow-wrap article-page pixel-inner-page pixel-article-page" lang={lang}>
      <header className="pixel-page-banner pixel-article-banner">
        <div className="pixel-page-banner-copy">
          <p className="eyebrow"><a href={localPath(`/archive?category=${post.category.slug}`, lang)}>{localized(post.category, 'name', lang)}</a></p>
          <h1>{title}</h1>
          <div className="article-meta pixel-article-meta">
            <span>{displayDate(post.publishedAt, lang)}</span>
            <span className="post-meta-sep" aria-hidden="true">·</span>
            <span><ClockIcon /> {readMinutes} {isVi ? 'phút đọc' : 'min read'}</span>
          </div>
        </div>
        <div className="pixel-page-banner-art" aria-hidden="true">
          <span className="pixel-banner-book" />
          <span className="pixel-banner-spark pixel-banner-spark-a" />
          <span className="pixel-banner-spark pixel-banner-spark-b" />
        </div>
      </header>

      {post.coverImageUrl && (
        <div className="article-hero pixel-article-hero">
          <img src={post.coverImageUrl} alt={localized(post, 'coverImageAlt', lang)} loading="eager" decoding="async" width={1200} height={630} />
        </div>
      )}

      <div className="pixel-reading-surface">
        <SafeMarkdown content={body} lang={lang} mapLinks />
      </div>

      {related.length > 0 && (
        <section className="related-section pixel-surface-panel pixel-related-panel" aria-labelledby="related-title">
          <div className="pixel-mini-heading"><strong>{isVi ? 'XEM THÊM' : 'RELATED'}</strong><span>{related.length}</span></div>
          <h2 id="related-title">{isVi ? 'Bài viết liên quan' : 'Related articles'}</h2>
          <div className="post-list post-list-related pixel-related-grid">
            {related.map((item) => (
              <article className="post-card" key={item.id}>
                <div className="post-card-body">
                  <h3><a href={localPath(`/post/${item.slug}`, lang)}>{localized(item, 'title', lang)}</a></h3>
                  <p>{localized(item, 'excerpt', lang)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {comments.length > 0 && (
        <section className="approved-comments pixel-surface-panel pixel-approved-comments" aria-labelledby="approved-comments-title">
          <div className="pixel-mini-heading"><strong>{isVi ? 'BÌNH LUẬN ĐÃ DUYỆT' : 'APPROVED COMMENTS'}</strong><span>{comments.length}</span></div>
          <h2 id="approved-comments-title">{isVi ? `Bình luận (${comments.length})` : `Comments (${comments.length})`}</h2>
          <ul className="comment-list">
            {comments.map((comment) => (
              <li key={comment.id}>
                <p>{comment.body}</p>
                <span className="comment-date">{displayDate(comment.createdAt, lang)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <CommentForm postId={post.id} lang={lang} />
      <div className="pixel-article-footer-action">
        <a className="button button-secondary" href={localPath(`/archive?category=${post.category.slug}`, lang)}>{isVi ? 'Xem thêm bài viết' : 'More writing'} <ArrowUpRightIcon /></a>
      </div>
    </article>
  )
}
