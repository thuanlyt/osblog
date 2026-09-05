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
    <section className="comment-section" aria-labelledby="comment-title">
      <p className="eyebrow">{isVi ? 'Trò chuyện' : 'Conversation'}</p>
      <h2 id="comment-title">{isVi ? 'Để lại bình luận' : 'Leave a note'}</h2>
      <p className="comment-intro">{isVi ? 'Email chỉ dùng để kiểm duyệt và không bao giờ được công khai.' : 'Email is used only for moderation and is never published.'}</p>
      {state === 'error' && <p className="status-note" role="alert">{message}</p>}
      {(state === 'success' || (state === 'ready' && message)) && <p className="status-note" role="status">{message}</p>}
      {state !== 'success' && (
        <form className="comment-form" onSubmit={handleSubmit} noValidate>
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
      <div className="content-wrap narrow-wrap">
        <p className="eyebrow">{isVi ? 'Bài viết' : 'Article'}</p>
        <h1>{isVi ? 'Không tìm thấy bài viết' : 'Article unavailable'}</h1>
        <p className="page-lede">{isVi ? 'Bài viết này chưa được xuất bản.' : 'This article is not published.'}</p>
        <a className="button button-secondary" href={localPath('/archive', lang)}>{isVi ? 'Về kho lưu trữ' : 'Back to archive'} <ArrowUpRightIcon /></a>
      </div>
    )
  }

  const title = localized(post, 'title', lang)
  const body = localized(post, 'body', lang)
  const related = data.related ?? []
  const comments = data.comments ?? []

  return (
    <article className="content-wrap narrow-wrap article-page" lang={lang}>
      <p className="eyebrow"><a href={localPath(`/archive?category=${post.category.slug}`, lang)}>{localized(post.category, 'name', lang)}</a></p>
      <h1>{title}</h1>
      <div className="article-meta">
        <span>{displayDate(post.publishedAt, lang)}</span>
        <span className="post-meta-sep" aria-hidden="true">·</span>
        <span><ClockIcon /> {Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200))} {isVi ? 'phút đọc' : 'min read'}</span>
      </div>
      {post.coverImageUrl && (
        <div className="article-hero">
          <img src={post.coverImageUrl} alt={localized(post, 'coverImageAlt', lang)} loading="eager" decoding="async" width={1200} height={630} />
        </div>
      )}
      <SafeMarkdown content={body} lang={lang} mapLinks />

      {related.length > 0 && (
        <section className="related-section" aria-labelledby="related-title">
          <p className="eyebrow">{isVi ? 'Xem thêm' : 'Related'}</p>
          <h2 id="related-title">{isVi ? 'Bài viết liên quan' : 'Related articles'}</h2>
          <div className="post-list post-list-related">
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
        <section className="approved-comments" aria-labelledby="approved-comments-title">
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
      <a className="button button-secondary" href={localPath(`/archive?category=${post.category.slug}`, lang)}>{isVi ? 'Xem thêm bài viết' : 'More writing'} <ArrowUpRightIcon /></a>
    </article>
  )
}
