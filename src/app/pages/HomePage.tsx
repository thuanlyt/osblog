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

function PixelHero({ data }: { data: PageData }) {
  const isVi = data.lang === 'vi'
  return (
    <section className="pixel-hero" aria-labelledby="hero-title">
      <div className="pixel-hero-sky" aria-hidden="true">
        <span className="pixel-cloud pixel-cloud-a" />
        <span className="pixel-cloud pixel-cloud-b" />
        <span className="pixel-spark pixel-spark-a" />
        <span className="pixel-spark pixel-spark-b" />
        <span className="pixel-tree pixel-tree-a" />
        <span className="pixel-tree pixel-tree-b" />
        <span className="pixel-castle" />
        <span className="pixel-ground" />
        <span className="pixel-chest" />
        <span className="pixel-mascot" />
      </div>
      <div className="pixel-hero-copy">
        <p className="pixel-hero-kicker">{isVi ? 'THÔNG BÁO TỪ OSBLOG' : 'A MESSAGE FROM OSBLOG'}</p>
        <h1 id="hero-title">
          {isVi ? <>Nơi ý tưởng mở <span>được viết & chia sẻ</span></> : <>Where open ideas <span>are written & shared</span></>}
        </h1>
        <p className="pixel-hero-lede">
          {isVi
            ? 'Một blog song ngữ về phần mềm, sáng tạo và những thứ đáng lưu lại — xây dựng công khai, đọc thoải mái.'
            : 'A bilingual blog about software, craft and things worth keeping — built in the open and made to be read.'}
        </p>
        <div className="pixel-hero-actions">
          <a className="button button-primary pixel-hero-button" href={localPath('/archive', data.lang)}>
            <span aria-hidden="true">★</span> OSBLOG <span aria-hidden="true">★</span>
          </a>
          <a className="pixel-hero-secondary" href={localPath('/about', data.lang)}>
            {isVi ? 'Khám phá câu chuyện' : 'Explore the story'} <ArrowUpRightIcon />
          </a>
        </div>
      </div>
    </section>
  )
}

function PixelCategoryStrip({ data }: { data: PageData }) {
  const categories = (data.categories ?? []).filter((category) => !category.isArchived).slice(0, 6)
  const isVi = data.lang === 'vi'

  return (
    <nav className="pixel-category-strip" aria-label={isVi ? 'Chuyên mục nổi bật' : 'Featured categories'}>
      <span className="pixel-category-title">{isVi ? 'DANH MỤC' : 'CATEGORIES'}</span>
      <div className="pixel-category-items">
        {categories.length > 0 ? categories.map((category, index) => (
          <a key={category.id} className="pixel-category-link" href={localPath(`/archive?category=${category.slug}`, data.lang)}>
            <span className={`pixel-category-icon pixel-category-icon-${(index % 4) + 1}`} aria-hidden="true" />
            <span>{localized(category, 'name', data.lang)}</span>
          </a>
        )) : (
          <>
            <a className="pixel-category-link" href={localPath('/archive', data.lang)}><span className="pixel-category-icon pixel-category-icon-1" aria-hidden="true" /><span>{isVi ? 'Bài viết' : 'Articles'}</span></a>
            <a className="pixel-category-link" href={localPath('/docs', data.lang)}><span className="pixel-category-icon pixel-category-icon-2" aria-hidden="true" /><span>{isVi ? 'Tài liệu' : 'Docs'}</span></a>
            <a className="pixel-category-link" href={localPath('/about', data.lang)}><span className="pixel-category-icon pixel-category-icon-3" aria-hidden="true" /><span>{isVi ? 'Giới thiệu' : 'About'}</span></a>
          </>
        )}
      </div>
    </nav>
  )
}

function PixelSidebar({ data }: { data: PageData }) {
  const isVi = data.lang === 'vi'
  const posts = data.posts ?? []
  const categories = (data.categories ?? []).filter((category) => !category.isArchived)

  return (
    <aside className="pixel-home-sidebar" aria-label={isVi ? 'Thông tin OSBLOG' : 'About OSBLOG'}>
      <section className="pixel-side-panel">
        <h2><span aria-hidden="true">♥</span> {isVi ? 'VỀ OSBLOG' : 'ABOUT OSBLOG'}</h2>
        <div className="pixel-about-row">
          <span className="pixel-side-mascot" aria-hidden="true" />
          <p>{isVi ? 'Một góc nhỏ để lưu lại ý tưởng, tài liệu và những điều học được khi xây phần mềm.' : 'A small place for ideas, documentation and lessons learned while building software.'}</p>
        </div>
        <a className="pixel-side-link" href={localPath('/about', data.lang)}>{isVi ? 'Tìm hiểu thêm' : 'Learn more'} »</a>
      </section>

      <section className="pixel-side-panel">
        <h2>{isVi ? 'THỐNG KÊ TRANG NÀY' : 'THIS PAGE'}</h2>
        <div className="pixel-stat-grid">
          <div><strong>{posts.length}</strong><span>{isVi ? 'Bài hiển thị' : 'Posts shown'}</span></div>
          <div><strong>{categories.length}</strong><span>{isVi ? 'Chuyên mục' : 'Categories'}</span></div>
        </div>
      </section>

      <section className="pixel-side-panel pixel-side-actions">
        <h2>{isVi ? 'LỐI TẮT' : 'QUICK LINKS'}</h2>
        <a href={localPath('/docs', data.lang)}>{isVi ? 'Đọc tài liệu' : 'Read docs'} <ArrowUpRightIcon /></a>
        <a href="https://github.com/thuanlyt/osblog" target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRightIcon /></a>
      </section>
    </aside>
  )
}

export function HomePage({ data }: { data: PageData }) {
  const lang = data.lang
  const isVi = lang === 'vi'
  const posts = data.posts ?? []

  return (
    <div className="pixel-home">
      <PixelHero data={data} />
      <PixelCategoryStrip data={data} />

      <div className="pixel-home-main">
        <section className="pixel-latest-panel" aria-labelledby="latest-title">
          <div className="pixel-panel-heading">
            <h2 id="latest-title"><span aria-hidden="true">★</span> {isVi ? 'BÀI VIẾT MỚI' : 'LATEST POSTS'}</h2>
            <a href={localPath('/archive', lang)}>{isVi ? 'Xem tất cả' : 'View all'} <ArrowUpRightIcon /></a>
          </div>
          {posts.length > 0 ? (
            <div className="pixel-post-grid">
              {posts.slice(0, 6).map((post) => <PostCard key={post.id} post={post} lang={lang} />)}
            </div>
          ) : (
            <div className="empty-card">
              <span className="empty-index">—</span>
              <div>
                <h3>{isVi ? 'Chưa có bài viết.' : 'No posts yet.'}</h3>
                <p>{isVi ? 'Hãy quay lại sau.' : 'Check back soon.'}</p>
              </div>
            </div>
          )}
          <a className="pixel-all-posts-button" href={localPath('/archive', lang)}>{isVi ? 'XEM TẤT CẢ BÀI VIẾT' : 'VIEW ALL POSTS'} <ArrowUpRightIcon /></a>
        </section>
        <PixelSidebar data={data} />
      </div>
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
