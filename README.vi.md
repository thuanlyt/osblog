# osblog

*English: [README.md](README.md)*

**osblog** ("open source blog" — blog mã nguồn mở) là ứng dụng xuất bản Markdown song ngữ (Việt/Anh), mã nguồn mở, cấp phép MIT, xây dựng bằng Vite, React 19, TypeScript, PostgreSQL (Neon) qua Drizzle ORM, và Better Auth. Một người vận hành viết và xuất bản bài viết song ngữ từ trang quản trị thật; độc giả nhận trang được render phía server và có thể để lại bình luận (đã kiểm duyệt, chỉ cần email) mà không cần tài khoản.

- **Tài liệu:** cùng bộ file Markdown trong kho mã này cũng được phục vụ trực tiếp tại `/docs` và `/docs/<slug>` (thêm `?lang=vi` cho tiếng Việt) — xem [Bản đồ tài liệu](#bản-đồ-tài-liệu) bên dưới.
- **Mã nguồn:** [github.com/thuanlyt/osblog](https://github.com/thuanlyt/osblog) — công khai, cấp phép MIT.
- **Giấy phép:** [MIT](LICENSE).

## Tình trạng hiện tại (2026-09-05)

| Hạng mục | Trạng thái |
|---|---|
| Mã ứng dụng | Trang quản trị, trang công khai, bình luận, SEO, và cả hai adapter triển khai (Vercel, Netlify) đã được xây dựng và rà soát. |
| Test tự động | 64 test unit/component/SQL integration đạt; 2 test E2E trên browser compile đạt; lint và typecheck đạt. |
| Database | Một project Neon Free Postgres thật (`osblog-db`, khu vực Singapore) đã được cấp phát. Các migration `0000`–`0003` đã chạy và replay lại vẫn nhất quán (idempotent); tài khoản admin đã được bootstrap; ba bài viết giới thiệu song ngữ đã được seed. |
| Build production tại local | `npm run build` + `npm start` phục vụ dữ liệu bài viết thật và asset đã hash qua HTTP 200 trên `127.0.0.1`. |
| Triển khai thật | **Đang live trên Vercel.** `https://osblog.thuanlyt.id.vn` là domain chính và `https://osblog.vercel.app` là alias phụ của deployment production liên kết GitHub trên `main`; cả hai đã đạt smoke test live gồm health Neon, trang SSR, sitemap, robots, redirect admin, GIF và MP4. Netlify đã có adapter nhưng chưa từng deploy. |
| QA trình duyệt/E2E và media | Cổng browser compile đạt các luồng publish/comment/moderation thực và docs responsive; đã có walkthrough Cap thật trong [Media](docs/vi/media.md). |

Mọi thông tin ở trên chỉ chính xác tại thời điểm ghi; xem [`work/SUPERVISOR_REPORT.md`](https://github.com/thuanlyt/osblog/blob/main/work/SUPERVISOR_REPORT.md) để biết trạng thái release được cập nhật liên tục.

## Ảnh chụp và media

Kho mã đã có [GIF walkthrough Cap thật](https://raw.githubusercontent.com/thuanlyt/osblog/main/public/media/osblog-cap-demo.gif) và [MP4](https://github.com/thuanlyt/osblog/blob/main/public/media/osblog-cap-demo.mp4), cho thấy trang công khai, docs nằm cùng mã nguồn, và một bài viết đã xuất bản. Xem [docs/vi/media.md](docs/vi/media.md) để biết nguồn gốc và quy tắc ghi hình.

## Tính năng

- **Mô hình nội dung song ngữ.** Mỗi bài viết có tiêu đề, tóm tắt, nội dung, alt text ảnh bìa, và trường SEO cho cả tiếng Anh lẫn tiếng Việt — không có bản nháp riêng theo ngôn ngữ.
- **Trang quản trị thật** tại `/admin` (yêu cầu phiên đăng nhập Better Auth): toolbar Markdown, chế độ xem edit/preview/split, tab riêng cho từng ngôn ngữ, slug tự sinh từ tiêu đề tiếng Anh, URL ảnh bìa kèm alt text bắt buộc, tiêu đề/mô tả SEO riêng từng ngôn ngữ, trạng thái và ngày xuất bản, khôi phục bản nháp chưa lưu từ `localStorage`, và cảnh báo xung đột (optimistic concurrency) khi bài viết đã thay đổi kể từ lúc tải.
- **Bình luận ẩn danh, có kiểm duyệt.** Độc giả chỉ cần gửi email và nội dung — không cần tài khoản. Mọi bình luận bắt đầu ở trạng thái `pending`, được bảo vệ bằng token form đã ký và giới hạn thời gian, một trường honeypot, và giới hạn tốc độ bền vững lưu trong database theo hash của IP và hash của email. Email người bình luận được mã hóa khi lưu trữ và không bao giờ trả về cho client công khai.
- **Xóa có thể khôi phục cho nội dung, xóa vĩnh viễn cho bình luận.** Xóa bài viết hoặc category sẽ lưu trữ (archive, có thể khôi phục); xóa bình luận là xóa thật, vĩnh viễn.
- **Trang công khai render phía server** kèm sitemap, robots, và metadata SEO cho từng bài viết, xây trên một router request dùng chung để cùng logic chạy được trên Vercel, Netlify, hoặc một server Node thuần.
- **Tài liệu nhúng cùng mã nguồn.** Bộ tài liệu này được đóng gói cùng ứng dụng đã build và phục vụ tại `/docs`.

## Bắt đầu nhanh

Yêu cầu: Node.js 20+, npm, và một chuỗi kết nối Postgres (dùng thử miễn phí với [Neon](https://neon.tech) là đủ).

```powershell
git clone https://github.com/thuanlyt/osblog.git
cd osblog
npm ci
Copy-Item .env.example .env.local
```

Điền vào `.env.local` giá trị `DATABASE_URL`, `BETTER_AUTH_SECRET` (từ 32 ký tự ngẫu nhiên trở lên), `COMMENT_EMAIL_ENCRYPTION_KEY` (32 byte ngẫu nhiên, mã hóa base64), và `ADMIN_EMAIL` của riêng bạn. Xem [Cấu hình](docs/vi/configuration.md) để biết từng biến.

```powershell
npm run db:migrate
$env:OSBLOG_ADMIN_PASSWORD = "chon-mat-khau-manh-tu-12-ky-tu-tro-len"
npm run db:bootstrap
Remove-Item Env:\OSBLOG_ADMIN_PASSWORD
npm run db:seed   # tùy chọn: thêm ba bài giới thiệu song ngữ đã xuất bản
npm run dev
```

Mở `http://localhost:5173`. Đăng nhập tại `/admin/login` bằng `ADMIN_EMAIL` và mật khẩu vừa bootstrap. Hướng dẫn đầy đủ: [docs/vi/getting-started.md](docs/vi/getting-started.md).

## Kiểm thử

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Tính đến 2026-09-05, các lệnh trên đạt tại local: 64 test unit/component/SQL integration, 2 test E2E trên browser compile, lint, typecheck, và build production. Cổng E2E dùng executable Chromium đã cài khi browser do Playwright quản lý chưa có sẵn; xem [docs/vi/getting-started.md](docs/vi/getting-started.md).

## Kiến trúc, tóm tắt

```text
Trình duyệt
  └─ UI React (src/app) ── hydrate lại HTML từ SSR
        │
        v
Router request dùng chung (src/server/router.ts)
  ├─ phục vụ bởi tools/server/start.ts khi phát triển (Vite middleware + Node HTTP)
  ├─ phục vụ bởi api/index.ts trên Vercel (dist/server đóng gói vào một function)
  ├─ phục vụ bởi netlify/functions/osblog.mts trên Netlify (một Fetch function)
  └─ phục vụ bởi npm start trên một máy chủ Node/VPS thuần
        │
        v
Postgres (Neon) qua Drizzle ORM ── kho lưu phiên Better Auth
```

Một router, một bản build (`dist/client` là asset tĩnh + `dist/server/index.js` là bundle SSR), ba adapter mỏng. Xem [docs/architecture.md](docs/architecture.md) (tiếng Anh, đầy đủ) để biết toàn bộ quyết định kỹ thuật.

## Bản đồ tài liệu

- [Giới thiệu](docs/vi/introduction.md) — osblog là gì và dành cho ai.
- [Bắt đầu](docs/vi/getting-started.md) — cài đặt, cấu hình, chạy, kiểm thử.
- [Trình soạn thảo Markdown](docs/vi/editor.md) — trang quản trị thật: toolbar, các chế độ xem, slug, ảnh bìa, SEO, draft/publish.
- [Cấu hình](docs/vi/configuration.md) — toàn bộ biến môi trường và nơi đọc chúng.
- [Quản trị và bình luận](docs/vi/admin-and-comments.md) — ranh giới đăng nhập, CRUD nội dung, kiểm duyệt bình luận.
- [Triển khai](docs/vi/deployment.md) — local, VPS/Nginx, Vercel, và Netlify, kèm lệnh thật và những gì đã thực sự xác minh.
- [Sao lưu và khôi phục](docs/vi/backups-and-rollback.md) — lịch sử migration, kỳ vọng sao lưu, và quy trình rollback.
- [Kiến trúc (tóm tắt)](docs/vi/architecture.md) — xem [bản đầy đủ tiếng Anh](docs/architecture.md).
- [Media](docs/vi/media.md) — GIF/MP4 walkthrough Cap đã xác minh và nguồn gốc bản ghi.
- [CHANGELOG](CHANGELOG.md) · [CONTRIBUTING](CONTRIBUTING.md) · [SECURITY](SECURITY.md) (tiếng Anh)

Bản tiếng Việt nằm tại [docs/vi/](docs/vi/index.md) và cũng được phục vụ tại `/docs?lang=vi`.

## Hỗ trợ

Mở issue hoặc pull request tại [github.com/thuanlyt/osblog](https://github.com/thuanlyt/osblog). Xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết quy trình đóng góp và [SECURITY.md](SECURITY.md) để báo lỗ hổng bảo mật một cách riêng tư.

## Giấy phép

MIT — xem [LICENSE](LICENSE).
