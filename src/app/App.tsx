import { useEffect, useRef, useState } from 'react'
import { Link, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { fetchCommentFormToken, fetchLatestPosts, fetchPostBySlug, submitComment, type PublishedPost } from './content-api'

function FocusOnRouteChange() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    mainRef.current = document.getElementById('app-main')
    mainRef.current?.focus()
  }, [location.pathname, location.search])

  return null
}

function IconArrowUpRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="icon" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 17 17 7M8 7h9v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#app-main">Skip to main content</a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="osblog home">
            <span className="brand-mark" aria-hidden="true">o/</span>
            <span>osblog</span>
          </Link>
          <nav className="site-nav" aria-label="Primary navigation">
            <Link to="/">Home</Link>
            <Link to="/category/open-source">Open source</Link>
            <Link to="/about">About</Link>
            <Link className="nav-admin" to="/admin/login">Admin</Link>
          </nav>
        </div>
      </header>
      <main id="app-main" className="page-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div>
          <strong>osblog</strong>
          <span>Open source ideas, in Vietnamese and English.</span>
        </div>
        <span className="footer-note">MIT licensed · content layer coming next</span>
      </footer>
    </div>
  )
}

function StatusNote() {
  return (
    <p className="status-note" role="status">
      Published content is loaded from the server-backed API; no local content fallback is used.
    </p>
  )
}

function HomePage() {
  const [posts, setPosts] = useState<PublishedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchLatestPosts(controller.signal)
      .then((data) => { setPosts(data); setError(null) })
      .catch((reason: unknown) => { if (!(reason instanceof DOMException && reason.name === 'AbortError')) setError('The archive is temporarily unavailable.') })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  return (
    <div className="content-wrap">
      <section className="hero-grid" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">01 / open source blog</p>
          <h1 id="hero-title">Ideas worth <em>sharing.</em></h1>
          <p className="hero-lede">A bilingual home for thoughtful writing about software, craft, and the commons.</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/category/open-source">Explore writing <IconArrowUpRight /></Link>
            <Link className="text-link" to="/about">Read the manifesto</Link>
          </div>
        </div>
        <div className="hero-aside" aria-label="Project note">
          <span className="aside-label">The point</span>
          <p>Keep the interface quiet so the words can do the work.</p>
          <span className="aside-rule" aria-hidden="true" />
          <span className="aside-label">Hai ngôn ngữ</span>
          <p>Viết bằng tiếng Việt. Đọc bằng tiếng Anh. Hoặc ngược lại.</p>
        </div>
      </section>
      <section className="section-block" aria-labelledby="latest-title">
        <div className="section-heading">
          <div><p className="eyebrow">02 / archive</p><h2 id="latest-title">Latest writing</h2></div>
          <span className="section-meta">Server-backed archive</span>
        </div>
        <div aria-live="polite">
          {loading && <p className="status-note">Loading the archive…</p>}
          {error && <p className="status-note" role="alert">{error}</p>}
          {!loading && !error && posts.length === 0 && <div className="empty-card"><span className="empty-index">—</span><div><h3>The archive is quiet for now.</h3><p>Published bilingual posts will appear here when the server-backed content layer has rows.</p></div><Link className="text-link" to="/about">Why osblog <IconArrowUpRight /></Link></div>}
          {!loading && !error && posts.length > 0 && <div className="post-list">{posts.map((post) => <article className="post-card" key={post.id}><p className="eyebrow">{post.category.nameEn}</p><h3><Link to={`/post/${post.slug}`}>{post.titleEn}</Link></h3><p>{post.excerptEn}</p></article>)}</div>}
        </div>
      </section>
    </div>
  )
}

function CategoryPage() {
  const { slug } = useParams()
  return <PlaceholderPage eyebrow="Category" title={slug?.replaceAll('-', ' ') ?? 'Category'} description="Published posts for this category will be loaded from the server-backed content API." />
}

function PostPage() {
  const { slug } = useParams()
  const [post, setPost] = useState<PublishedPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    const controller = new AbortController()
    fetchPostBySlug(slug, controller.signal)
      .then((data) => { setPost(data); setError(null) })
      .catch((reason: unknown) => { if (!(reason instanceof DOMException && reason.name === 'AbortError')) setError('This article could not be loaded.') })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [slug])

  if (loading) return <div className="content-wrap narrow-wrap"><p className="eyebrow">Article</p><p className="status-note" role="status">Loading article…</p></div>
  if (error || !post) return <PlaceholderPage eyebrow="Article" title="Article unavailable" description={error ?? 'This article is not published.'} />
  return <article className="content-wrap narrow-wrap article-page"><p className="eyebrow">{post.category.nameEn}</p><h1>{post.titleEn}</h1><p className="page-lede">{post.excerptEn}</p><div className="article-body">{post.bodyEn}</div><CommentForm postId={post.id} /><Link className="button button-secondary" to={`/category/${post.category.slug}`}>More writing <IconArrowUpRight /></Link></article>
}

function CommentForm({ postId }: { postId: string }) {
  const submitControllerRef = useRef<AbortController | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [body, setBody] = useState('')
  const [state, setState] = useState<'loading' | 'ready' | 'submitting' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetchCommentFormToken(controller.signal)
      .then((value) => { setToken(value); setState('ready') })
      .catch((reason: unknown) => { if (!(reason instanceof DOMException && reason.name === 'AbortError')) { setState('error'); setMessage('The comment form is temporarily unavailable.') } })
    return () => {
      controller.abort()
      submitControllerRef.current?.abort()
    }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !email.trim() || !body.trim()) return
    setState('submitting')
    setMessage('')
    const controller = new AbortController()
    submitControllerRef.current = controller
    try {
      await submitComment({ postId, email: email.trim(), body: body.trim(), formToken: token }, controller.signal)
      setState('success')
      setMessage('Thanks — your note is pending moderation.')
      setBody('')
    } catch (reason: unknown) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      setState('error')
      setMessage('The note could not be submitted. Please try again later.')
    } finally {
      if (submitControllerRef.current === controller) submitControllerRef.current = null
    }
  }

  return <section className="comment-section" aria-labelledby="comment-title"><p className="eyebrow">Conversation</p><h2 id="comment-title">Leave a note</h2><p className="comment-intro">Email is used only for moderation and is never published.</p>{state === 'error' && <p className="status-note" role="alert">{message}</p>}{state === 'success' && <p className="status-note" role="status">{message}</p>}{state !== 'success' && <form className="comment-form" onSubmit={handleSubmit}><label htmlFor="comment-email">Email<input id="comment-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label htmlFor="comment-body">Your note<textarea id="comment-body" name="body" rows={5} required maxLength={5000} value={body} onChange={(event) => setBody(event.target.value)} /></label><button className="button button-primary" type="submit" disabled={state !== 'ready'}>{state === 'submitting' ? 'Sending…' : 'Send for review'}</button></form>}</section>
}

function SearchPage() {
  return <PlaceholderPage eyebrow="Search" title="Search the archive" description="Search will be server-side and noindex by design, as defined in docs/architecture.md." />
}

function AboutPage() {
  return <PlaceholderPage eyebrow="About" title="A small home for open ideas." description="osblog is an open source, bilingual publishing project. The product shell is ready; the durable content layer is the next gate." />
}

function AdminLoginPage() {
  return <PlaceholderPage eyebrow="Admin / sign in" title="Protected workspace" description="The admin session boundary is documented, but login is not implemented in this scaffold. No public registration is exposed." action="Back home" />
}

function AdminPage() {
  return <PlaceholderPage eyebrow="Admin" title="Publishing workspace" description="Admin CRUD and moderation will be backed by the reviewed server boundary; this route is a deep-linkable placeholder only." action="Admin sign in" actionTo="/admin/login" />
}

function PlaceholderPage({ eyebrow, title, description, action = 'Back home', actionTo = '/' }: { eyebrow: string; title: string; description: string; action?: string; actionTo?: string }) {
  return <div className="content-wrap narrow-wrap"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-lede">{description}</p><StatusNote /><Link className="button button-secondary" to={actionTo}>{action} <IconArrowUpRight /></Link></div>
}

function NotFoundPage() {
  return <PlaceholderPage eyebrow="404" title="That page is not here." description="The route is deep-linkable, but this address has no published content yet." />
}

export function App() {
  return <Layout><FocusOnRouteChange /><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/category/:slug" element={<CategoryPage />} />
    <Route path="/post/:slug" element={<PostPage />} />
    <Route path="/search" element={<SearchPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route path="/admin" element={<AdminPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Layout>
}
