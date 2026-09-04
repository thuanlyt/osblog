# osblog

osblog is an open-source bilingual blog for thoughtful writing about software, craft, and the commons. The interface is intentionally quiet: content, moderation, and durable server boundaries do the important work.

## osblog là gì?

osblog là một blog song ngữ mã nguồn mở về phần mềm, kỹ nghệ và những điều tốt đẹp thuộc về cộng đồng. Giao diện tối giản để nội dung được ưu tiên; dữ liệu và quyền quản trị đi qua các ranh giới máy chủ rõ ràng.

## Current status / Trạng thái hiện tại

The repository contains a verified Vite + React + TypeScript client, Drizzle/Neon persistence boundary, Better Auth admin boundary, post CRUD API, privacy-safe comment/moderation API, public data flow, SSR metadata, sitemap, robots, and Vercel routing contracts.

Kho mã hiện có client Vite + React + TypeScript đã được kiểm thử, ranh giới lưu trữ Drizzle/Neon, ranh giới Better Auth cho quản trị, API CRUD bài viết, API bình luận/kiểm duyệt bảo vệ dữ liệu riêng tư, luồng dữ liệu public, metadata SSR, sitemap, robots và hợp đồng routing cho Vercel.

Production is currently **not ready**. No Neon/Postgres or Better Auth provider target is configured, no migration or live auth/CRUD/comment/SSR integration has run, and no deployment has been made. Do not treat local contract checks as production evidence.

Trạng thái production hiện là **chưa sẵn sàng**. Chưa có target/provider Neon/Postgres hoặc Better Auth được cấu hình, chưa chạy migration hay integration auth/CRUD/bình luận/SSR thực tế, và chưa deploy. Không xem các kiểm thử contract cục bộ là bằng chứng production.

## Local development / Chạy local

Requirements: Node.js 20+ and npm.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Provider-backed routes fail closed until the server environment is configured. Never commit `.env.local` or provider credentials.

Các route cần provider sẽ fail-closed khi môi trường máy chủ chưa được cấu hình. Không commit `.env.local` hoặc thông tin đăng nhập provider.

## Verification / Kiểm thử

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm audit --audit-level=high
python tools/useagent.py validate
python tests/useagent-conformance/replay.py
```

The current local gate passes: 30 tests, lint, typecheck, build, high-severity audit, boundary scans, route smoke checks, and `useagent validate`.

Gate local hiện tại đã đạt: 30 test, lint, typecheck, build, audit mức high, quét boundary, smoke test route và `useagent validate`.

## Repository map / Cấu trúc chính

- `src/app/` — React routes, shell, public content states, and comment form.
- `src/server/` — server-only schemas, auth policy, content/comment services, HTTP envelopes, and SEO helpers.
- `api/` — Vercel-compatible health, auth, post, comment, render, sitemap, and robots handlers.
- `drizzle/` — reviewed content and Better Auth migration shapes; execution requires an authorized database target.
- `design-system/osblog/` — persisted visual and accessibility source of truth.
- `knowledge/` — source-anchored architecture, workflow, and project context.
- `work/` — UseAgent registry, reports, evidence, checkpoints, and preserved runtime history.

See [architecture](docs/architecture.md), [UI design](docs/ui-design.md), [operations](docs/operations.md), and the [supervisor report](work/SUPERVISOR_REPORT.md) for the current contracts and release gates.

Xem [kiến trúc](docs/architecture.md), [thiết kế UI](docs/ui-design.md), [vận hành](docs/operations.md) và [báo cáo supervisor](work/SUPERVISOR_REPORT.md) để biết contract và release gate hiện tại.

## License / Giấy phép

MIT. See [LICENSE](LICENSE).

No credentials, provider secrets, or private account data belong in this repository.
