# Cấu hình

*English: [docs/configuration.md](../configuration.md)*

**Trạng thái hiện tại:** các biến dưới đây là tập biến thật được đọc bởi [`src/server/env.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/env.ts), [`tools/server/database.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/server/database.ts), và [`tools/server/configure-vercel.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/server/configure-vercel.ts), khớp với [`.env.example`](https://github.com/thuanlyt/osblog/blob/main/.env.example). Trang này không bịa thêm biến nào chưa có trong mã nguồn.

## Quy tắc: giá trị có tiền tố `VITE_` là công khai, còn lại là chỉ dành cho server

Vite lộ ra bất kỳ biến nào có tiền tố `VITE_` vào bundle trình duyệt lúc build. Mọi biến khác chỉ được đọc phía server (`src/server/`, `tools/server/`, và các adapter triển khai trong `api/` / `netlify/functions/`). Không bao giờ đặt URL database, bí mật, hay credential dưới tên có tiền tố `VITE_`.

## Danh sách biến

| Biến | Bắt buộc khi production? | Công dụng |
|---|---|---|
| `NODE_ENV` | — | `development`, `test`, hoặc `production`; mặc định `development`. |
| `DATABASE_URL` | **có** | Chuỗi kết nối Postgres qua pool, dùng cho truy vấn runtime (connection string pooled của Neon dùng trực tiếp được). |
| `DATABASE_URL_MIGRATIONS` | không (dùng bởi người vận hành) | Kết nối trực tiếp, không qua pool, chỉ dùng khi chạy `npm run db:migrate` hoặc `npm run db:bootstrap`/`db:seed`; sẽ dùng lại `DATABASE_URL` nếu không đặt. Không bao giờ được đóng gói vào mã client hay đường xử lý serverless. Khi lấy biến môi trường từ một project Vercel liên kết với tích hợp Neon, [`tools/server/configure-vercel.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/server/configure-vercel.ts) còn chấp nhận biến `DATABASE_URL_UNPOOLED` của Neon làm nguồn dự phòng cho giá trị này — biến đó không được ứng dụng đọc trực tiếp lúc chạy. |
| `BETTER_AUTH_SECRET` | **có** | Khóa ký phiên cho Better Auth; cũng dùng để ký token form bình luận và hash giá trị IP/email cho rate limiting. Phải có ít nhất 32 ký tự. Xoay khóa sẽ vô hiệu hóa mọi phiên đang có. |
| `BETTER_AUTH_URL` | **có** | Origin chuẩn, đáng tin cậy mà Better Auth cấp phiên cho. |
| `SITE_URL` | không | Origin chuẩn phía server, được ưu tiên hơn `BETTER_AUTH_URL`/`VITE_SITE_URL` khi server tự xác định origin cho SEO, sitemap, và URL tuyệt đối. Phải là `http(s)://`; production bắt buộc `https://`. |
| `VITE_SITE_URL` | không | Origin công khai, an toàn cho trình duyệt, lộ ra trong bundle client; dùng làm nguồn dự phòng/kế thừa cho origin của trang. |
| `ADMIN_EMAIL` | không (bắt buộc để bootstrap) | Email tài khoản vận hành duy nhất được allow-list. Không phải trường đăng ký công khai — xem [Quản trị và bình luận](admin-and-comments.md). |
| `COMMENT_EMAIL_ENCRYPTION_KEY` | **có** | Đúng 32 byte ngẫu nhiên, mã hóa base64, dùng với AES-256-GCM để mã hóa email người bình luận khi lưu trữ. Xem [`src/server/comment-policy.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/comment-policy.ts). |
| `TURNSTILE_SECRET_KEY` | không | Được schema môi trường chấp nhận nhưng **hiện chưa được mã ứng dụng sử dụng.** Đặt biến này chưa có tác dụng gì — đừng quảng cáo tính năng bảo vệ CAPTCHA/Turnstile cho đến khi nó được nối vào luồng bình luận. |
| `TRUST_PROXY` | không | `true` hoặc `false` (mặc định `false`). Khi `true`, server tin tưởng header `X-Forwarded-For` để lấy IP client — chỉ bật khi chạy sau một reverse proxy bạn kiểm soát (xem phần VPS/Nginx trong [Triển khai](deployment.md)). Trên Vercel, header `x-vercel-forwarded-for` do nền tảng cấp được dùng tự động, bất kể cờ này. |
| `OSBLOG_ADMIN_PASSWORD` | chỉ dùng bởi người vận hành | Chỉ được đọc bởi `npm run db:bootstrap`; không bao giờ lưu trữ, không bao giờ là tham số request. Phải từ 12–128 ký tự. Xóa biến này khỏi shell ngay sau khi bootstrap. |
| `PORT` | không | Port cho `tools/server/start.ts` khi phát triển/preview; mặc định `5173`. |

`readServerEnv()` fail-closed: khi `NODE_ENV=production`, nếu thiếu `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_EMAIL`, hoặc `COMMENT_EMAIL_ENCRYPTION_KEY`, hàm sẽ ném `ServerConfigError` thay vì dùng giá trị mặc định của môi trường phát triển. `requireDatabaseUrl()` cũng ném lỗi thay vì bao giờ dùng dữ liệu giả trong bộ nhớ — không có đường dữ liệu giả nào trong production.

## Những gì cố ý chưa triển khai

Không có đăng ký công khai, xác minh email, hay quy trình đặt lại mật khẩu — mô hình bootstrap bởi người vận hành trong [Quản trị và bình luận](admin-and-comments.md) chính là toàn bộ hệ thống tài khoản, theo thiết kế. Đừng cấu hình hay quảng cáo một provider email gửi đi cho việc khôi phục tài khoản; không có provider nào tồn tại.

## Thiết lập tại local

```powershell
Copy-Item .env.example .env.local
```

Điền các giá trị mô tả ở trên, sau đó làm theo [Bắt đầu](getting-started.md) để migrate, bootstrap, và seed.

## Vệ sinh bí mật

- `.gitignore` đã loại trừ `.env` và `.env.*` ngoại trừ file mẫu `.env.example` đã được theo dõi — không bao giờ commit `.env.local` hay `.env.production.local` thật.
- Không bao giờ đọc hoặc trích dẫn `.env.production.local`, `draft/admin-access.json`, hay bất kỳ file credential nào được sinh ra tại local, trong tài liệu, issue, hay pull request.
- Dùng database riêng cho preview/phát triển và production. Chạy migration hay seed trên một database dùng chung giữa nhiều môi trường có thể làm hỏng nội dung thật.
- Biến môi trường của Vercel/Netlify/VPS nên được đặt qua kho bí mật riêng của từng nền tảng, không commit vào kho mã này.

Tiếp theo: [Quản trị và bình luận](admin-and-comments.md) hoặc [Triển khai](deployment.md).
