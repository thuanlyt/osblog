# Bắt đầu

*English: [docs/getting-started.md](../getting-started.md)*

**Trạng thái hiện tại:** mọi lệnh trên trang này là script thật trong [`package.json`](https://github.com/thuanlyt/osblog/blob/main/package.json). Làm theo từ đầu đến cuối, bạn sẽ có một blog hoạt động thật với tài khoản admin thật và database thật — đây không phải bản xem trước chỉ có client.

## Yêu cầu

- Node.js 20+ và npm.
- Một chuỗi kết nối Postgres. Dùng thử miễn phí với [Neon](https://neon.tech) là đủ; bất kỳ Postgres 14+ nào cũng dùng được.

## Clone và cài đặt

```powershell
git clone https://github.com/thuanlyt/osblog.git
cd osblog
npm ci
```

## Thiết lập biến môi trường

Sao chép file mẫu và điền giá trị của riêng bạn. Không bao giờ commit `.env.local` hay bất kỳ file nào chứa bí mật thật — `.gitignore` đã loại trừ `.env` và `.env.*` ngoại trừ file mẫu `.env.example` đã được theo dõi.

```powershell
Copy-Item .env.example .env.local
```

Trên macOS/Linux:

```bash
cp .env.example .env.local
```

Tối thiểu, hãy đặt `DATABASE_URL`, `BETTER_AUTH_SECRET` (từ 32 ký tự trở lên), `COMMENT_EMAIL_ENCRYPTION_KEY` (32 byte ngẫu nhiên, base64), và `ADMIN_EMAIL`. Xem [Cấu hình](configuration.md) để biết công dụng từng biến.

## Thiết lập database

Đây là các script thật trong [`tools/server/database.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/server/database.ts), chạy qua npm:

```powershell
npm run db:migrate
```

Áp dụng lần lượt mọi file SQL trong [`drizzle/`](https://github.com/thuanlyt/osblog/blob/main/drizzle/), theo dõi trong bảng `osblog_migration` kèm checksum bảo vệ — chạy lại là an toàn (idempotent) và sẽ báo lỗi rõ ràng nếu một migration đã áp dụng bị sửa đổi. `db:migrate` đọc `NODE_ENV`, hoặc truyền `--mode=production` để nạp `.env.production.local` thay vì `.env.local`.

```powershell
$env:OSBLOG_ADMIN_PASSWORD = "chon-mat-khau-manh-tu-12-ky-tu-tro-len"
npm run db:bootstrap
Remove-Item Env:\OSBLOG_ADMIN_PASSWORD
```

Tạo tài khoản admin duy nhất cho email trong `ADMIN_EMAIL`, dùng mật khẩu từ biến môi trường `OSBLOG_ADMIN_PASSWORD` (12–128 ký tự). Đây là lệnh chỉ dành cho người vận hành, không phải endpoint web — lệnh không bao giờ ghi đè admin đã tồn tại, nên chạy lại sau một lần thất bại là an toàn. Xóa biến môi trường ngay sau khi chạy xong.

```powershell
npm run db:seed
```

Tùy chọn và idempotent: thêm ba bài giới thiệu song ngữ đã xuất bản trong category "Open source", dùng `onConflictDoNothing` nên chạy lại không bao giờ tạo trùng nội dung hay ghi đè chỉnh sửa.

## Chạy dev server

```powershell
npm run dev
```

Lệnh này chạy [`tools/server/start.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/server/start.ts): một Vite dev server ở chế độ middleware đứng trước router SSR Node thật, lắng nghe tại `http://localhost:5173`. Mọi route — trang chủ, category, bài viết, `/docs`, `/about`, `/admin`, bình luận, và API — đều chạy trên database bạn đã cấu hình, không phải mock.

Đăng nhập tại `http://localhost:5173/admin/login` bằng `ADMIN_EMAIL` và mật khẩu vừa bootstrap.

## Lệnh kiểm thử

Chạy các lệnh sau từ thư mục gốc kho mã trước khi coi một thay đổi là hoàn tất:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

- `npm run lint` — ESLint cho mã nguồn TypeScript/React.
- `npm run typecheck` — kiểm tra kiểu dữ liệu toàn dự án bằng `tsc -b`.
- `npm test` — test unit, component, và SQL integration bằng Vitest (xem [`tests/server/`](https://github.com/thuanlyt/osblog/blob/main/tests/server/)).
- `npm run build` — build production bằng Vite (xem [Triển khai](deployment.md) để biết output là gì).

Một bộ test trình duyệt Playwright (`npm run test:e2e`, xem [`tests/browser/`](https://github.com/thuanlyt/osblog/tree/main/tests/browser/)) đã nằm trong cổng release tại local. Bộ test hiện bao phủ luồng publish/comment/moderation thật, SSR compile, docs responsive, điều hướng bàn phím và Axe. Nếu revision Chromium do Playwright quản lý chưa có sẵn, đặt `OSBLOG_TEST_BROWSER` tới executable Chromium đã cài trước khi chạy.

## Xem trước bản build production tại local

```powershell
npm run build
npm run preview
```

`npm run build` tạo ra `dist/client` (asset tĩnh đã hash, không có `index.html`) và `dist/server/index.js` (bundle SSR). `npm run preview` giống hệt `npm start`: chạy [`tools/server/start.ts --production`](https://github.com/thuanlyt/osblog/blob/main/tools/server/start.ts), một server Node HTTP thật bind vào `127.0.0.1`, phục vụ asset client đã build và toàn bộ router SSR — kể cả API kết nối database — trên cùng một port. Xem [Triển khai](deployment.md) để biết vì sao cần reverse proxy khi chạy trên VPS, và bản build này được đóng gói cho Vercel và Netlify như thế nào.

Tiếp theo: [Trình soạn thảo Markdown](editor.md) hoặc [Triển khai](deployment.md).
