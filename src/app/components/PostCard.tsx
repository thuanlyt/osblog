import { displayDate, localPath, localized, type Language, type Post } from '../types'
import { ClockIcon } from '../icons'

function estimateReadMinutes(post: Post, lang: Language): number {
  const words = localized(post, 'excerpt', lang).split(/\s+/).filter(Boolean).length + localized(post, 'body', lang).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export function PostCard({ post, lang, featured = false }: { post: Post; lang: Language; featured?: boolean }) {
  const href = localPath(`/post/${post.slug}`, lang)
  const title = localized(post, 'title', lang)
  const excerpt = localized(post, 'excerpt', lang)
  const alt = localized(post, 'coverImageAlt', lang)
  return (
    <article className={featured ? 'post-card post-card-featured' : 'post-card'}>
      {post.coverImageUrl && (
        <a className="post-thumb" href={href} tabIndex={-1} aria-hidden="true">
          <img src={post.coverImageUrl} alt={alt} loading={featured ? 'eager' : 'lazy'} decoding="async" width={800} height={450} />
        </a>
      )}
      <div className="post-card-body">
        <p className="eyebrow"><a href={localPath(`/archive?category=${post.category.slug}`, lang)}>{localized(post.category, 'name', lang)}</a></p>
        <h3><a href={href}>{title}</a></h3>
        <p>{excerpt}</p>
        <div className="post-meta">
          <span>{displayDate(post.publishedAt, lang)}</span>
          <span className="post-meta-sep" aria-hidden="true">·</span>
          <span><ClockIcon /> {estimateReadMinutes(post, lang)} {lang === 'vi' ? 'phút đọc' : 'min read'}</span>
        </div>
      </div>
    </article>
  )
}
