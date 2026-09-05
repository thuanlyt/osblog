import { localPath, localized, type PageData } from '../types'
import { PostCard } from '../components/PostCard'
import { Pagination } from '../components/Pagination'
import { ArrowUpRightIcon, SearchIcon } from '../icons'

function FilterForm({ data }: { data: PageData }) {
  const lang = data.lang
  const query = data.query ?? { q: '', category: '', year: '', sort: 'latest' }
  const categories = data.categories ?? []
  const years = data.years ?? []
  const isVi = lang === 'vi'
  return (
    <form className="filter-form" method="get" action="/archive" aria-label={isVi ? 'Lọc bài viết' : 'Filter articles'}>
      <input type="hidden" name="lang" value={lang} />
      <div className="filter-field filter-search">
        <label htmlFor="filter-q">{isVi ? 'Tìm kiếm' : 'Search'}</label>
        <div className="filter-search-input">
          <SearchIcon />
          <input id="filter-q" name="q" type="search" defaultValue={query.q} placeholder={isVi ? 'Tìm bài viết…' : 'Search articles…'} />
        </div>
      </div>
      <div className="filter-field">
        <label htmlFor="filter-category">{isVi ? 'Chuyên mục' : 'Category'}</label>
        <select id="filter-category" name="category" defaultValue={query.category}>
          <option value="">{isVi ? 'Tất cả' : 'All'}</option>
          {categories.map((category) => <option key={category.id} value={category.slug}>{localized(category, 'name', lang)}</option>)}
        </select>
      </div>
      <div className="filter-field">
        <label htmlFor="filter-year">{isVi ? 'Năm' : 'Year'}</label>
        <select id="filter-year" name="year" defaultValue={query.year}>
          <option value="">{isVi ? 'Tất cả' : 'All'}</option>
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
      </div>
      <div className="filter-field">
        <label htmlFor="filter-sort">{isVi ? 'Sắp xếp' : 'Sort'}</label>
        <select id="filter-sort" name="sort" defaultValue={query.sort}>
          <option value="latest">{isVi ? 'Mới nhất' : 'Latest'}</option>
          <option value="popular">{isVi ? 'Phổ biến' : 'Popular'}</option>
          <option value="random">{isVi ? 'Ngẫu nhiên' : 'Random'}</option>
        </select>
      </div>
      <button className="button button-primary" type="submit">{isVi ? 'Áp dụng' : 'Apply'}</button>
    </form>
  )
}

function PostGrid({ data }: { data: PageData }) {
  const lang = data.lang
  const posts = data.posts ?? []
  const isVi = lang === 'vi'
  if (posts.length === 0) {
    return (
      <div className="empty-card">
        <span className="empty-index">—</span>
        <div>
          <h3>{isVi ? 'Chưa có bài viết phù hợp.' : 'No matching articles yet.'}</h3>
          <p>{isVi ? 'Hãy thử một chuyên mục hoặc từ khóa khác.' : 'Try a different category, year, or search term.'}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="post-list">
      {posts.map((post) => <PostCard key={post.id} post={post} lang={lang} />)}
    </div>
  )
}

export function HomePage({ data }: { data: PageData }) {
  const lang = data.lang
  const isVi = lang === 'vi'
  const posts = data.posts ?? []
  const [featured, ...rest] = posts

  return (
    <div className="content-wrap">
      <section className="hero-grid" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">{isVi ? '01 / blog mã nguồn mở' : '01 / open source blog'}</p>
          <h1 id="hero-title">{isVi ? <>Ý tưởng đáng <em>chia sẻ.</em></> : <>Ideas worth <em>sharing.</em></>}</h1>
          <p className="hero-lede">{isVi ? 'Một mái nhà song ngữ cho những bài viết chỉn chu về phần mềm, sự sáng tạo và tri thức chung.' : 'A bilingual home for thoughtful writing about software, craft, and the commons.'}</p>
          <div className="hero-actions">
            <a className="button button-primary" href={localPath('/archive', lang)}>{isVi ? 'Khám phá bài viết' : 'Explore writing'} <ArrowUpRightIcon /></a>
            <a className="text-link" href={localPath('/about', lang)}>{isVi ? 'Đọc giới thiệu' : 'Read the manifesto'}</a>
          </div>
        </div>
        <div className="hero-aside" aria-label={isVi ? 'Ghi chú dự án' : 'Project note'}>
          <span className="aside-label">{isVi ? 'Trọng tâm' : 'The point'}</span>
          <p>{isVi ? 'Giữ giao diện yên tĩnh để câu chữ được là điều quan trọng nhất.' : 'Keep the interface quiet so the words can do the work.'}</p>
          <span className="aside-rule" aria-hidden="true" />
          <span className="aside-label">{isVi ? 'Song ngữ' : 'Bilingual'}</span>
          <p>{isVi ? 'Viết bằng tiếng Việt. Đọc bằng tiếng Anh. Hoặc ngược lại.' : 'Viết bằng tiếng Việt. Đọc bằng tiếng Anh. Or the other way around.'}</p>
        </div>
      </section>

      {featured && (
        <section className="section-block" aria-labelledby="featured-title">
          <div className="section-heading">
            <div><p className="eyebrow">{isVi ? '02 / mới nhất' : '02 / latest'}</p><h2 id="featured-title">{isVi ? 'Bài viết mới nhất' : 'Latest writing'}</h2></div>
          </div>
          <div className="post-list post-list-featured">
            <PostCard post={featured} lang={lang} featured />
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="section-block" aria-labelledby="more-title">
          <div className="section-heading">
            <div><p className="eyebrow">{isVi ? '03 / kho lưu trữ' : '03 / archive'}</p><h2 id="more-title">{isVi ? 'Thêm bài viết' : 'More writing'}</h2></div>
            <a className="text-link" href={localPath('/archive', lang)}>{isVi ? 'Xem toàn bộ kho lưu trữ' : 'Browse the full archive'} <ArrowUpRightIcon /></a>
          </div>
          <div className="post-list">
            {rest.map((post) => <PostCard key={post.id} post={post} lang={lang} />)}
          </div>
        </section>
      )}
    </div>
  )
}

export function ArchivePage({ data }: { data: PageData }) {
  const lang = data.lang
  const isVi = lang === 'vi'
  const query = data.query ?? { q: '', category: '', year: '', sort: 'latest' }
  return (
    <div className="content-wrap">
      <p className="eyebrow">{isVi ? 'Kho lưu trữ' : 'Archive'}</p>
      <h1>{data.title}</h1>
      {data.description && <p className="page-lede">{data.description}</p>}
      <FilterForm data={data} />
      <div aria-live="polite" className="archive-results">
        <PostGrid data={data} />
      </div>
      <Pagination
        path={data.path.split('?')[0]}
        query={{ q: query.q, category: query.category, year: query.year, sort: query.sort, lang }}
        page={data.page ?? 1}
        limit={data.limit ?? 9}
        total={data.total ?? 0}
        lang={lang}
      />
    </div>
  )
}
