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
    <form className="filter-form pixel-filter-form" method="get" action="/archive" aria-label={isVi ? 'Lọc bài viết' : 'Filter articles'}>
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
      <div className="empty-card pixel-empty-card">
        <span className="empty-index">?</span>
        <div>
          <h3>{isVi ? 'Chưa có bài viết phù hợp.' : 'No matching articles yet.'}</h3>
          <p>{isVi ? 'Hãy thử một chuyên mục hoặc từ khóa khác.' : 'Try a different category, year, or search term.'}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="post-list pixel-archive-grid">
      {posts.map((post) => <PostCard key={post.id} post={post} lang={lang} />)}
    </div>
  )
}

function PixelHero({ data }: { data: PageData }) {
  const isVi = data.lang === 'vi'
  return (
    <section className="pixel-hero" aria-labelledby="hero-title">
      <img className="pixel-hero-world" src="/pixel/hero/osblog-world.svg" alt="" aria-hidden="true" width="1400" height="330" />
      <div className="pixel-hero-notice">
        <span className="pixel-hero-corner pixel-hero-corner-a" aria-hidden="true" />
        <span className="pixel-hero-corner pixel-hero-corner-b" aria-hidden="true" />
        <p className="pixel-hero-kicker">{isVi ? 'THÔNG BÁO:' : 'ANNOUNCEMENT:'}</p>
        <h1 id="hero-title">
          {isVi ? <>OSBLOG pixel <span>chính thức mở cửa</span></> : <>The OSBLOG pixel world <span>is now open</span></>}
        </h1>
        <p className="pixel-hero-lede">
          {isVi
            ? 'Blog song ngữ về phần mềm, sáng tạo, tài liệu và những thứ đáng lưu lại — xây dựng công khai bằng mã nguồn mở.'
            : 'A bilingual open-source blog about software, craft, documentation and things worth keeping.'}
        </p>
        <a className="pixel-hero-button" href={localPath('/archive', data.lang)}>
          <span className="pixel-button-star" aria-hidden="true" />
          <strong>{isVi ? 'KHÁM PHÁ OSBLOG' : 'EXPLORE OSBLOG'}</strong>
          <span className="pixel-button-star" aria-hidden="true" />
        </a>
      </div>
      <div className="pixel-hero-pager" aria-hidden="true"><i /><i /><i /></div>
    </section>
  )
}

function PixelCategoryStrip({ data }: { data: PageData }) {
  const categories = (data.categories ?? []).filter((category) => !category.isArchived).slice(0, 6)
  const isVi = data.lang === 'vi'

  return (
    <nav className="pixel-category-strip" aria-label={isVi ? 'Chuyên mục nổi bật' : 'Featured categories'}>
      <span className="pixel-category-title">{isVi ? 'DANH MỤC' : 'CATEGORIES'} <b aria-hidden="true">▶</b></span>
      <div className="pixel-category-items">
        {categories.length > 0 ? categories.map((category, index) => (
          <a key={category.id} className="pixel-category-link" href={localPath(`/archive?category=${category.slug}`, data.lang)}>
            <span className={`pixel-category-icon pixel-category-icon-${(index % 6) + 1}`} aria-hidden="true" />
            <span>{localized(category, 'name', data.lang)}</span>
          </a>
        )) : (
          <>
            <a className="pixel-category-link" href={localPath('/archive', data.lang)}><span className="pixel-category-icon pixel-category-icon-1" aria-hidden="true" /><span>{isVi ? 'Bài viết' : 'Articles'}</span></a>
            <a className="pixel-category-link" href={localPath('/docs', data.lang)}><span className="pixel-category-icon pixel-category-icon-2" aria-hidden="true" /><span>{isVi ? 'Tài liệu' : 'Docs'}</span></a>
            <a className="pixel-category-link" href={localPath('/archive?sort=popular', data.lang)}><span className="pixel-category-icon pixel-category-icon-3" aria-hidden="true" /><span>{isVi ? 'Nổi bật' : 'Popular'}</span></a>
            <a className="pixel-category-link" href={localPath('/docs', data.lang)}><span className="pixel-category-icon pixel-category-icon-4" aria-hidden="true" /><span>{isVi ? 'Hướng dẫn' : 'Guides'}</span></a>
            <a className="pixel-category-link" href="https://github.com/thuanlyt/osblog" target="_blank" rel="noopener noreferrer"><span className="pixel-category-icon pixel-category-icon-5" aria-hidden="true" /><span>GitHub</span></a>
            <a className="pixel-category-link" href={localPath('/about', data.lang)}><span className="pixel-category-icon pixel-category-icon-6" aria-hidden="true" /><span>{isVi ? 'Giới thiệu' : 'About'}</span></a>
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
  const docs = data.docs ?? []

  return (
    <aside className="pixel-home-sidebar" aria-label={isVi ? 'Thông tin OSBLOG' : 'About OSBLOG'}>
      <section className="pixel-side-panel pixel-about-panel">
        <h2><span className="pixel-title-heart" aria-hidden="true" /> {isVi ? 'VỀ OSBLOG' : 'ABOUT OSBLOG'}</h2>
        <div className="pixel-about-row">
          <span className="pixel-side-mascot" aria-hidden="true"><i /><b /></span>
          <p>{isVi ? 'OSBLOG là góc nhỏ để lưu lại bài viết, tài liệu và những điều học được khi xây phần mềm.' : 'OSBLOG is a small place for articles, documentation and lessons learned while building software.'}</p>
        </div>
        <a className="pixel-side-link" href={localPath('/about', data.lang)}>{isVi ? 'Tìm hiểu thêm' : 'Learn more'} »</a>
      </section>

      <section className="pixel-side-panel pixel-stats-panel">
        <h2><span className="pixel-title-bars" aria-hidden="true" /> {isVi ? 'THỐNG KÊ' : 'STATS'}</h2>
        <div className="pixel-stat-grid pixel-stat-grid-three">
          <div><span className="pixel-stat-icon pixel-stat-posts" aria-hidden="true" /><strong>{posts.length}</strong><span>{isVi ? 'Bài hiển thị' : 'Posts'}</span></div>
          <div><span className="pixel-stat-icon pixel-stat-cats" aria-hidden="true" /><strong>{categories.length}</strong><span>{isVi ? 'Chuyên mục' : 'Categories'}</span></div>
          <div><span className="pixel-stat-icon pixel-stat-docs" aria-hidden="true" /><strong>{docs.length}</strong><span>{isVi ? 'Tài liệu' : 'Docs'}</span></div>
        </div>
      </section>

      <section className="pixel-side-panel pixel-feed-panel">
        <h2><span className="pixel-title-mail" aria-hidden="true" /> {isVi ? 'THEO DÕI BÀI MỚI' : 'FOLLOW NEW POSTS'}</h2>
        <p>{isVi ? 'Đăng ký bằng trình đọc feed yêu thích của bạn.' : 'Subscribe with your favorite feed reader.'}</p>
        <div className="pixel-feed-actions">
          <a href="/feed.xml">RSS 2.0</a>
          <a href="/feed.atom">ATOM</a>
        </div>
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
            <h2 id="latest-title"><span className="pixel-heading-star" aria-hidden="true" /> {isVi ? 'BÀI VIẾT MỚI' : 'LATEST POSTS'}</h2>
          </div>
          {posts.length > 0 ? (
            <div className="pixel-post-grid">
              {posts.slice(0, 6).map((post) => <PostCard key={post.id} post={post} lang={lang} />)}
            </div>
          ) : (
            <div className="empty-card pixel-empty-card">
              <span className="empty-index">?</span>
              <div><h3>{isVi ? 'Chưa có bài viết.' : 'No posts yet.'}</h3><p>{isVi ? 'Hãy quay lại sau.' : 'Check back soon.'}</p></div>
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
  const total = data.total ?? 0

  return (
    <div className="content-wrap pixel-inner-page pixel-archive-page">
      <section className="pixel-page-banner" aria-labelledby="archive-title">
        <div className="pixel-page-banner-copy">
          <p className="eyebrow">{isVi ? 'KHO LƯU TRỮ OSBLOG' : 'OSBLOG ARCHIVE'}</p>
          <h1 id="archive-title">{data.title}</h1>
          {data.description && <p className="page-lede">{data.description}</p>}
        </div>
        <div className="pixel-page-banner-art" aria-hidden="true"><span className="pixel-banner-folder" /><span className="pixel-banner-spark pixel-banner-spark-a" /><span className="pixel-banner-spark pixel-banner-spark-b" /></div>
      </section>

      <section className="pixel-surface-panel pixel-filter-panel" aria-labelledby="archive-filter-title">
        <div className="pixel-mini-heading"><strong id="archive-filter-title">{isVi ? 'TÌM & LỌC BÀI VIẾT' : 'FIND & FILTER POSTS'}</strong><span>{total} {isVi ? 'bài' : 'posts'}</span></div>
        <FilterForm data={data} />
      </section>

      <section className="pixel-surface-panel pixel-results-panel" aria-labelledby="archive-results-title">
        <div className="pixel-panel-heading pixel-results-heading"><h2 id="archive-results-title"><span className="pixel-heading-star" aria-hidden="true" /> {isVi ? 'KẾT QUẢ' : 'RESULTS'}</h2><span className="pixel-result-count">{total}</span></div>
        <div aria-live="polite" className="archive-results"><PostGrid data={data} /></div>
        <Pagination path={data.path.split('?')[0]} query={{ q: query.q, category: query.category, year: query.year, sort: query.sort, lang }} page={data.page ?? 1} limit={data.limit ?? 9} total={total} lang={lang} />
      </section>
    </div>
  )
}
