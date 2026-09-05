# Tài liệu OSBlog

*English: [docs/index.md](../index.md)*

OSBlog ("open source blog" — blog mã nguồn mở) là ứng dụng xuất bản Markdown song ngữ (Việt/Anh) xây dựng bằng Vite, React, TypeScript, Neon Postgres/Drizzle và Better Auth. Bộ tài liệu này nằm cùng kho mã nguồn và cũng được phục vụ trực tiếp: cùng các file này được đọc lúc build và lộ ra tại `/docs` (mục lục) và `/docs/<slug>` (`?lang=vi` cho bản tiếng Việt), qua [`src/server/docs.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/docs.ts) và được render bởi [`src/app/pages/DocsPage.tsx`](https://github.com/thuanlyt/osblog/blob/main/src/app/pages/DocsPage.tsx). Một trang có thể khai báo `title`, `description`, `order` trong khối frontmatter `---`; nếu không, tiêu đề sẽ lấy từ `# heading` đầu tiên và mô tả lấy từ đoạn văn đầu tiên.

**Nhãn trạng thái:** mỗi trang tự nêu rõ trạng thái đã xác minh so với chưa xác minh ở gần đầu trang. Tính đến 2026-09-05, mã ứng dụng, trang quản trị, kiểm duyệt bình luận và cả hai adapter triển khai đã được xây dựng; 64 test unit/component/SQL integration và 2 test E2E trên browser compile đạt tại local; database Neon thật đã được cấp phát và migrate; Vercel production đã live trên cả hai hostname yêu cầu và route smoke đã đạt. Xem [`work/SUPERVISOR_REPORT.md`](https://github.com/thuanlyt/osblog/blob/main/work/SUPERVISOR_REPORT.md) để biết trạng thái release và các khoảng trống vận hành còn lại.

## Tài liệu sản phẩm

| Trang | Nội dung |
|---|---|
| [Giới thiệu](introduction.md) | OSBlog là gì, dành cho ai, và vì sao dự án tồn tại |
| [Bắt đầu](getting-started.md) | Cài đặt local, thiết lập biến môi trường, migrate/bootstrap/seed, chạy dev server |
| [Trình soạn thảo Markdown](editor.md) | Trang quản trị thật: toolbar, chế độ edit/preview/split, slug, ảnh bìa + alt, trường SEO, draft/publish |
| [Cấu hình](configuration.md) | Toàn bộ biến môi trường, nơi đọc chúng, và biến nào là bí mật |
| [Quản trị và bình luận](admin-and-comments.md) | Ranh giới đăng nhập admin, CRUD category/post, kiểm duyệt bình luận ẩn danh |
| [Triển khai](deployment.md) | Local, VPS + Nginx, Vercel, và Netlify — kèm lệnh thật và những gì đã thực sự xác minh |
| [Sao lưu và khôi phục](backups-and-rollback.md) | Lịch sử migration, kỳ vọng sao lưu database, và quy trình rollback |
| [Media](media.md) | GIF/MP4 walkthrough Cap đã xác minh và nguồn gốc bản ghi |

## Tài liệu tham chiếu và kỹ thuật

Các tài liệu này có trước bộ tài liệu này và do các hạng mục công việc khác duy trì; chúng được liên kết ở đây để dễ tìm, không dịch lại toàn bộ:

- [Kiến trúc (tóm tắt tiếng Việt)](architecture.md) — bản tóm tắt; xem [architecture.md](../architecture.md) (tiếng Anh) để có nội dung đầy đủ.
- [Hệ thống thiết kế UI](../ui-design.md) (tiếng Anh) — nguồn tham chiếu thị giác/khả năng tiếp cận đã lưu trữ.
- [Vận hành](../operations.md) và [Autopilot](../autopilot.md) (tiếng Anh) — quy ước vận hành/QA của quy trình UseAgent dùng để xây dựng kho mã này, không phải tài liệu về bản thân blog.
- [Conformance](../conformance.md) (tiếng Anh) — kịch bản replay vòng đời UseAgent.

## Bản tiếng Anh

Mỗi trang tiếng Việt đều có bản tiếng Anh tương ứng tại [`docs/`](../index.md), cũng được phục vụ tại `/docs/<slug>`:

- [Introduction](../introduction.md)
- [Getting started](../getting-started.md)
- [Markdown editor](../editor.md)
- [Configuration](../configuration.md)
- [Admin and comments](../admin-and-comments.md)
- [Deployment](../deployment.md)
- [Backups and rollback](../backups-and-rollback.md)
- [Architecture (full)](../architecture.md)
- [Media](../media.md)

## Báo lỗi

Sử dụng kho GitHub [thuanlyt/osblog](https://github.com/thuanlyt/osblog) để mở issue hoặc pull request. Xem [CONTRIBUTING.md](../../CONTRIBUTING.md) để biết quy trình đóng góp và [SECURITY.md](../../SECURITY.md) để báo lỗ hổng bảo mật.
