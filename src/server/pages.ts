import type { Database } from './db'
import { archiveYears, countPublishedPosts, getPublishedPost, listCategories, listPublishedPosts, relatedPosts } from './content'
import { approvedComments } from './comments'
import { listPostsQuery } from './content-contract'
import { documents } from './docs'
import { localized, type PageData } from '../app/types'

export async function loadPage(url: URL, database: () => Database): Promise<PageData> {
  const lang = url.searchParams.get('lang') === 'vi' ? 'vi' : 'en'
  const path = url.pathname + url.search
  const base: PageData = { kind: 'not-found', path, lang, title: lang === 'vi' ? 'Không tìm thấy trang' : 'Page not found', description: '', status: 404 }
  if (url.pathname === '/admin/login') return { ...base, kind: 'login', title: 'Sign in', status: 200 }
  if (/^\/admin(?:\/.*)?$/.test(url.pathname)) return { ...base, kind: 'admin', title: 'Publishing workspace', status: 200 }
  if (url.pathname === '/about') return { ...base, kind: 'about', title: lang === 'vi' ? 'Một nơi cho những ý tưởng mở.' : 'A home for open ideas.', status: 200 }
  if (/^\/docs(?:\/[a-z0-9-]+)?$/.test(url.pathname)) {
    const docs = documents(lang)
    const slug = url.pathname.split('/')[2]
    const doc = docs.find((doc) => doc.slug === (slug || 'index'))
    if (slug && !doc) return base
    return { ...base, kind: slug ? 'doc' : 'docs', title: doc?.title ?? (lang === 'vi' ? 'Tài liệu' : 'Documentation'), description: doc?.description ?? 'Build, publish, and maintain your own OSBlog.', docs: docs.map((entry) => ({ ...entry, body: '' })), doc, status: 200 }
  }
  if (url.pathname.startsWith('/post/')) {
    const post = await getPublishedPost(database(), url.pathname.slice(6))
    if (!post) return base
    const [comments, related] = await Promise.all([approvedComments(database(), post.id), relatedPosts(database(), post.categoryId, post.id)])
    return JSON.parse(JSON.stringify({ ...base, kind: 'article', title: localized(post, 'seoTitle', lang) || localized(post, 'title', lang), description: localized(post, 'seoDescription', lang) || localized(post, 'excerpt', lang), status: 200, post, comments, related })) as PageData
  }
  if (['/', '/archive', '/search'].includes(url.pathname) || /^\/category\/[a-z0-9-]+$/.test(url.pathname)) {
    const query = listPostsQuery.parse({ ...Object.fromEntries(url.searchParams), limit: 9, category: url.pathname.startsWith('/category/') ? url.pathname.slice(10) : url.searchParams.get('category') ?? '' })
    const db = database()
    const [posts, categories, years, total] = await Promise.all([listPublishedPosts(db, query), listCategories(db), archiveYears(db), countPublishedPosts(db, query)])
    if (query.category && !categories.some((category) => category.slug === query.category)) return base
    const selected = categories.find((category) => category.slug === query.category)
    return JSON.parse(JSON.stringify({ ...base, kind: url.pathname === '/' ? 'home' : 'archive', title: selected ? localized(selected, 'name', lang) : lang === 'vi' ? 'Ghi chép về một thế giới mở.' : 'Notes on an open world.', description: lang === 'vi' ? 'Những bài viết về phần mềm, sự sáng tạo và chia sẻ tri thức.' : 'Thoughtful writing on software, craft, and sharing what we learn.', status: 200, posts, categories, years: years.map((row) => row.year), total, query, page: query.page, limit: query.limit })) as PageData
  }
  return base
}
