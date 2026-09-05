import { localPath, type PageData } from '../types'
import { ArrowUpRightIcon, AlertIcon } from '../icons'

export function AboutPage({ data }: { data: PageData }) {
  const lang = data.lang
  const isVi = lang === 'vi'
  return (
    <div className="content-wrap narrow-wrap">
      <p className="eyebrow">{isVi ? 'Giới thiệu' : 'About'}</p>
      <h1>{data.title}</h1>
      <p className="page-lede">{data.description}</p>
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
      <div className="hero-actions">
        <a className="button button-primary" href="https://github.com/thuanlyt/osblog" target="_blank" rel="noopener noreferrer">
          {isVi ? 'Xem mã nguồn trên GitHub' : 'View source on GitHub'} <ArrowUpRightIcon />
        </a>
        <a className="text-link" href={localPath('/docs', lang)}>{isVi ? 'Đọc tài liệu' : 'Read the docs'}</a>
      </div>
    </div>
  )
}

export function NotFoundPage({ data }: { data: PageData }) {
  const lang = data.lang
  const isVi = lang === 'vi'
  return (
    <div className="content-wrap narrow-wrap">
      <p className="eyebrow">404</p>
      <h1>{isVi ? 'Không tìm thấy trang này.' : 'That page is not here.'}</h1>
      <p className="page-lede">{isVi ? 'Địa chỉ này chưa có nội dung.' : 'This address has no published content yet.'}</p>
      <a className="button button-secondary" href={localPath('/', lang)}>{isVi ? 'Về trang chủ' : 'Back home'} <ArrowUpRightIcon /></a>
    </div>
  )
}

export function ErrorPage({ data }: { data: PageData }) {
  const lang = data.lang
  const isVi = lang === 'vi'
  return (
    <div className="content-wrap narrow-wrap">
      <p className="eyebrow" role="alert"><AlertIcon /> {isVi ? 'Lỗi' : 'Error'}</p>
      <h1>{isVi ? 'Đã có sự cố.' : 'Something went wrong.'}</h1>
      <p className="page-lede">{data.description || (isVi ? 'Vui lòng thử lại sau.' : 'Please try again shortly.')}</p>
      <a className="button button-secondary" href={localPath('/', lang)}>{isVi ? 'Về trang chủ' : 'Back home'} <ArrowUpRightIcon /></a>
    </div>
  )
}
