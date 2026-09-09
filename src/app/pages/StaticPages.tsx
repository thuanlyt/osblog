import { localPath, type PageData } from '../types'
import { ArrowUpRightIcon, AlertIcon } from '../icons'

export function AboutPage({ data }: { data: PageData }) {
  const lang = data.lang
  const isVi = lang === 'vi'
  return (
    <div className="content-wrap narrow-wrap pixel-inner-page pixel-static-page">
      <section className="pixel-page-banner pixel-about-banner">
        <div className="pixel-page-banner-copy">
          <p className="eyebrow">{isVi ? 'VỀ DỰ ÁN' : 'ABOUT THE PROJECT'}</p>
          <h1>{data.title}</h1>
          <p className="page-lede">{data.description}</p>
        </div>
        <div className="pixel-page-banner-art" aria-hidden="true">
          <span className="pixel-side-mascot pixel-banner-mascot" />
          <span className="pixel-banner-spark pixel-banner-spark-a" />
        </div>
      </section>

      <section className="pixel-surface-panel pixel-about-panel">
        <div className="pixel-mini-heading"><strong>{isVi ? 'OSBLOG LÀ GÌ?' : 'WHAT IS OSBLOG?'}</strong><span aria-hidden="true">♥</span></div>
        <div className="about-body">
          <p>
            {isVi
              ? 'osblog là một dự án xuất bản mã nguồn mở, cấp phép MIT, song ngữ Việt–Anh. Toàn bộ mã nguồn và tài liệu đều công khai.'
              : 'osblog is an open source, MIT-licensed, bilingual publishing project. All source code and documentation are public.'}
          </p>
          <p>
            {isVi
              ? 'Dự án được xây dựng bằng Vite, React, TypeScript, Postgres (Neon/Drizzle) và Better Auth, với quy trình kiểm duyệt bình luận tôn trọng quyền riêng tư.'
              : 'It is built with Vite, React, TypeScript, Postgres (Neon/Drizzle), and Better Auth, with a privacy-respecting comment moderation flow.'}
          </p>
        </div>
        <div className="hero-actions pixel-static-actions">
          <a className="button button-primary" href="https://github.com/thuanlyt/osblog" target="_blank" rel="noopener noreferrer">
            {isVi ? 'Xem mã nguồn trên GitHub' : 'View source on GitHub'} <ArrowUpRightIcon />
          </a>
          <a className="text-link" href={localPath('/docs', lang)}>{isVi ? 'Đọc tài liệu' : 'Read the docs'}</a>
        </div>
      </section>
    </div>
  )
}

export function NotFoundPage({ data }: { data: PageData }) {
  const lang = data.lang
  const isVi = lang === 'vi'
  return (
    <div className="content-wrap narrow-wrap pixel-inner-page pixel-static-page pixel-state-page">
      <section className="pixel-page-banner pixel-state-banner">
        <div className="pixel-page-banner-copy">
          <p className="eyebrow">404 / LOST TILE</p>
          <h1>{isVi ? 'Không tìm thấy trang này.' : 'That page is not here.'}</h1>
          <p className="page-lede">{isVi ? 'Địa chỉ này chưa có nội dung. Có vẻ bạn đã đi ra ngoài bản đồ.' : 'This address has no published content yet. Looks like you wandered beyond the map.'}</p>
          <a className="button button-secondary" href={localPath('/', lang)}>{isVi ? 'Về trang chủ' : 'Back home'} <ArrowUpRightIcon /></a>
        </div>
        <div className="pixel-page-banner-art" aria-hidden="true">
          <span className="pixel-state-block">?</span>
          <span className="pixel-banner-spark pixel-banner-spark-a" />
          <span className="pixel-banner-spark pixel-banner-spark-b" />
        </div>
      </section>
    </div>
  )
}

export function ErrorPage({ data }: { data: PageData }) {
  const lang = data.lang
  const isVi = lang === 'vi'
  return (
    <div className="content-wrap narrow-wrap pixel-inner-page pixel-static-page pixel-state-page">
      <section className="pixel-page-banner pixel-state-banner pixel-error-banner">
        <div className="pixel-page-banner-copy">
          <p className="eyebrow" role="alert"><AlertIcon /> {isVi ? 'LỖI HỆ THỐNG' : 'SYSTEM ERROR'}</p>
          <h1>{isVi ? 'Đã có sự cố.' : 'Something went wrong.'}</h1>
          <p className="page-lede">{data.description || (isVi ? 'Vui lòng thử lại sau.' : 'Please try again shortly.')}</p>
          <a className="button button-secondary" href={localPath('/', lang)}>{isVi ? 'Về trang chủ' : 'Back home'} <ArrowUpRightIcon /></a>
        </div>
        <div className="pixel-page-banner-art" aria-hidden="true">
          <span className="pixel-state-block">!</span>
        </div>
      </section>
    </div>
  )
}
