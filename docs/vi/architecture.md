# Kiến trúc (tóm tắt)

*English (đầy đủ): [docs/architecture.md](../architecture.md)*

Đây là bản tóm tắt tiếng Việt của tài liệu kiến trúc đầy đủ. Bản tiếng Anh là nguồn tham chiếu chính thức — khi có khác biệt, bản tiếng Anh thắng.

## Quyết định trong một đoạn

osblog là ứng dụng Vite + React 19 + TypeScript với **một router request dùng chung duy nhất** ([`src/server/router.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/router.ts)) xử lý mọi path — trang công khai, trang tài liệu, ứng dụng admin, và API JSON. Router đó được tái sử dụng nguyên vẹn trên ba runtime: server Node HTTP khi phát triển/VPS ([`tools/server/start.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/server/start.ts)), một Vercel Node.js Function duy nhất ([`api/index.ts`](https://github.com/thuanlyt/osblog/blob/main/api/index.ts)), và một Netlify Fetch function duy nhất ([`netlify/functions/osblog.mts`](https://github.com/thuanlyt/osblog/blob/main/netlify/functions/osblog.mts)). Lưu trữ dùng Neon Postgres qua driver HTTP của Drizzle ORM; xác thực admin dùng Better Auth, tắt đăng ký công khai, chỉ một danh tính do người vận hành bootstrap. Trang công khai render phía server bằng `renderToString` để crawler nhận HTML và metadata bài viết thật; cùng cây React đó hydrate lại trên trình duyệt.

## Ranh giới thực thi

```text
Trình duyệt
  ├─ UI React và hydration (src/app/)
  ├─ yêu cầu đọc công khai ───────────────┐
  └─ yêu cầu admin/form bình luận ────────┤
                                          v
Router request dùng chung (src/server/router.ts)
  ├─ parse request, auth, kiểm tra CSRF/origin, validate, security header
  ├─ điều hướng route: API JSON, SSR HTML, sitemap/robots
  └─ service chỉ dành cho server ──> Neon Postgres (Drizzle)
        ^
        │ cùng router, ba adapter mỏng
  ┌─────┴──────┬───────────────────┬─────────────────────┐
  Node HTTP     Vercel Function      Netlify Function
  (dev/VPS)     (api/index.ts)       (netlify/functions/osblog.mts)
```

- `src/app/` sở hữu route React, layout, cây component công khai, và ứng dụng admin (`src/app/admin/`).
- `src/entry-server.tsx` render mọi route thành chuỗi qua `renderToString` và dựng tài liệu HTML đầy đủ (thẻ SEO, JSON-LD, link asset đã hash) qua [`src/server/seo.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/seo.ts).
- `src/server/` sở hữu router, schema, service truy vấn, contract validate, và cấu hình auth — chỉ được import bởi entry point phía server, không bao giờ vào bundle client.
- `api/index.ts` và `netlify/functions/osblog.mts` chỉ re-export handler đã build từ `dist/server/index.js` — không chứa logic routing riêng.
- `drizzle/` sở hữu bốn migration SQL đã áp dụng; [`src/server/provision.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/provision.ts) sở hữu việc chạy migration, bootstrap admin, và seed nội dung tùy chọn.

## Bảng route (tóm tắt)

| Route | Quyền truy cập | Hành vi |
|---|---|---|
| `/`, `/archive` | công khai | Trang chủ/lưu trữ song ngữ, bài đã xuất bản, category, năm lưu trữ. SSR. |
| `/category/:slug` | công khai | Bài đã xuất bản trong một category. SSR. |
| `/search?q=` | công khai | Tìm kiếm phía server có giới hạn; `noindex,follow`. |
| `/post/:slug` | công khai | Bài viết đã xuất bản, alternate ngôn ngữ, bình luận đã duyệt, tối đa 3 bài liên quan. SSR. |
| `/about` | công khai | Trang giới thiệu tĩnh song ngữ. |
| `/docs`, `/docs/:slug` | công khai | Chính bộ tài liệu này, đọc từ `docs/**/*.md`. |
| `/admin/login` | chưa xác thực | Đăng nhập Better Auth; không có đăng ký công khai. |
| `/admin`, `/admin/posts`, `/admin/categories`, `/admin/comments` | admin | Không gian xuất bản thật (ứng dụng React Router trong `src/app/admin/`). |

Xem bảng API đầy đủ, hợp đồng entity, biến môi trường, kế hoạch migration/seed, và rollback trong [bản tiếng Anh](../architecture.md).

## Trạng thái đã xác minh so với chưa xác minh

**Đã xác minh cục bộ:** schema, chính sách auth, API post/comment/category, trang quản trị (component), health check, helper SEO, 64 test unit/component/SQL integration và 2 test browser compile đạt trên schema thật, tính đến 2026-09-05 (xem [`docs/architecture.md`](../architecture.md#verification-boundaries)). Database Neon thật đã được cấp phát, migrate (`0000`–`0003`), và seed.

**Chưa xác minh:** xác minh Turnstile (chưa nối vào mã), triển khai Netlify/VPS, và drill sao lưu/khôi phục/rollback. Vercel/Neon production, browser E2E, SSR và media smoke đã đạt. Xem [Triển khai](deployment.md) và [Sao lưu và khôi phục](backups-and-rollback.md).

Quay lại [Mục lục tài liệu](index.md).
