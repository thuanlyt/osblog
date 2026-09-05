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
- `drizzle/` sở hữu bốn migration SQL đã áp dụng và migration bổ sung `0004_post_slug_history.sql` đã kiểm tra cục bộ nhưng chờ rollout; [`src/server/provision.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/provision.ts) sở hữu việc chạy migration, preflight slug, bootstrap admin, và seed nội dung tùy chọn.

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

**Đã xác minh cục bộ:** schema, chính sách auth, API post/comment/category, trang quản trị (component), health check, helper SEO, 93 test unit/component/SQL integration và 2 test browser E2E đạt trên schema thật, tính đến 2026-09-05 (xem [`docs/architecture.md`](../architecture.md#verification-boundaries)). Database Neon thật đã được cấp phát, migrate (`0000`–`0003`), và seed.

**Chưa xác minh:** xác minh Turnstile (chưa nối vào mã), triển khai Netlify/VPS, và drill sao lưu/khôi phục/rollback. Vercel/Neon production, browser E2E, SSR và media smoke đã đạt. Xem [Triển khai](deployment.md) và [Sao lưu và khôi phục](backups-and-rollback.md).

## Lịch sử slug đã xuất bản

UA-0073/UA-0077 bổ sung và hoàn thiện migration `0004_post_slug_history.sql`, bảng `post_slug_history`, bộ phân giải URL cũ và cảnh báo trong editor. Thay đổi này được kiểm tra cục bộ; không task nào trong hai task chạy preflight trên production, áp dụng migration hay ghi dữ liệu Neon.

Mỗi slug từng có trạng thái `published` (kể cả bài hẹn giờ) được giữ cho đúng một ID bài viết. Trigger cơ sở dữ liệu chạy sau INSERT hoặc UPDATE slug/status, dùng advisory lock trong transaction và trả SQLSTATE `23505` khi trùng quyền sở hữu. Slug đã xuất bản không được tái sử dụng, kể cả bởi chính bài cũ. Slug chỉ dùng cho bản nháp không bị giữ lại; bỏ xuất bản hoặc lưu trữ không giải phóng tên đã xuất bản. Ứng dụng chỉ lưu trữ bài; thao tác xóa vĩnh viễn được người vận hành cho phép riêng mới có thể xóa lịch sử theo cascade.

Khi đổi `a → b → c`, cả `a` và `b` đều trỏ qua ID bài đến slug hiện tại `c`, không tạo chuỗi redirect. GET/HEAD URL HTML cũ trả 308 đến URL tuyệt đối hiện tại với `lang=vi` nếu yêu cầu chọn tiếng Việt, nếu không dùng `lang=en`; bỏ các tham số khác. URL API cũ trả 308 đến API JSON hiện tại, không chuyển sang HTML. Bài nháp, lưu trữ, hẹn giờ hoặc thuộc chuyên mục lưu trữ trả 404 cho cả URL mới/cũ và không có header `Location`. Redirect giữ `Cache-Control: no-store`. Canonical, hreflang, Open Graph, JSON-LD và sitemap chỉ chứa slug hiện tại.

Editor ghi nhớ slug đã lưu, cảnh báo khi thay đổi slug của bài có sẵn và cập nhật URL xem trước. Lỗi 409 `SLUG_TAKEN` gắn với trường slug, giữ nguyên nội dung chưa lưu. Lưu thành công cập nhật lại mốc so sánh. Chạy lại seed bỏ qua slug đã được giữ nên không tạo lại bài mẫu đã đổi tên.

## Cổng triển khai migration 0004

Migration bổ sung giữ khóa ghi bảng post/audit trong lúc khôi phục slug hiện tại đã xuất bản và slug hợp lệ từ `before_summary` của audit có trạng thái published. Nó giữ thời điểm sớm nhất, bỏ bản ghi sai định dạng hoặc không còn bài đích. Nếu một slug có nhiều chủ lịch sử hoặc khác chủ hiện tại (kể cả bản nháp), toàn bộ migration bị rollback; cần người vận hành đối chiếu thay vì tự chọn chủ.

Helper chỉ đọc `provision.ts:preflightSlugHistory(db)` chạy được trước migration 0004 và chỉ trả số lượng: audit sai định dạng, thiếu bài đích, nhiều chủ lịch sử, xung đột với chủ hiện tại. Trước khi triển khai cần checkpoint sao lưu/khôi phục đã xác minh, xem xét các bản ghi bị bỏ, không còn xung đột sở hữu, kiểm tra thời gian khóa và thử tranh chấp bằng hai phiên PostgreSQL riêng. PGlite cục bộ kiểm tra các lời gọi cạnh tranh nhưng tuần tự hóa phiên cơ sở dữ liệu, không chứng minh thời gian chờ khóa trên provider.

Áp dụng migration trước khi phát hành code redirect để instance cũ cũng giữ lịch sử nhờ trigger. Seed chạy đồng thời với đổi tên có thể bị từ chối do xung đột; chạy lại sau khi thao tác kia hoàn tất. Không thể tự suy ra slug đã đổi mà không có audit, audit đã mất hoặc bài đã xóa. Rollback ứng dụng giữ nguyên bảng/trigger; code cũ vẫn chặn tái sử dụng nhưng tạm trả 404 cho URL lịch sử. Xóa bảng/trigger không phải rollback thông thường và cần quyền riêng cùng phương án khôi phục/đối chiếu.

Nguồn đối chiếu: `drizzle/0004_post_slug_history.sql`, `src/server/schema.ts:postSlugHistory`, `content.ts:resolvePublishedSlug`, `router.ts`, `provision.ts` và `src/app/admin/AdminPostEditorPage.tsx`. Sau khi migration và code này được triển khai, mục này thay thế nhận định cũ trong hướng dẫn editor rằng không có slug redirect.

Quay lại [Mục lục tài liệu](index.md).
