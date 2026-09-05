# Triển khai

*English: [docs/deployment.md](../deployment.md)*

**Trạng thái hiện tại (2026-09-05): deployment production trên Vercel đã live và được xác minh.** Deployment `dpl_8PzrSBYo5rsYzwfeqTXn2tDLzdjD` liên kết với Neon và phục vụ cả hai hostname yêu cầu. Adapter Netlify đã được xây dựng nhưng chưa từng deploy; VPS vẫn là target đã viết tài liệu nhưng chưa chạy thực tế.

## Điều mọi target đều dùng chung

```powershell
npm ci
npm run build
```

[`tools/build/build.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/build/build.ts) chạy hai lượt build Vite và tạo ra hai output riêng biệt:

- **`dist/client/`** — asset tĩnh đã hash, bất biến (JS, CSS, font). `index.html` bị xóa có chủ đích sau khi build, vì không có trang tĩnh entry nào cả — mọi route đều được server render.
- **`dist/server/index.js`** — một bundle SSR duy nhất export router request (`handle`) và một adapter Node (`nodeHandler`), kèm sẵn manifest asset client qua `__OSBLOG_ASSETS__`.

**Vì sao host chỉ phục vụ tĩnh là không đủ:** mọi request — kể cả trang chủ công khai và mọi lời gọi `/api/*` — đều được xử lý bởi router dùng chung trong [`src/server/router.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/router.ts), router này truy vấn Postgres, kiểm tra phiên Better Auth, và render HTML theo từng request. Một host chỉ phục vụ `dist/client/` dưới dạng file tĩnh (không có runtime server) không thể chạy router đó, không thể chạm tới database, và không có `index.html` để dự phòng. Bạn cần một trong ba target server bên dưới.

Không có bước `npm run build` hay bước deploy nào tự động chạy migration hay seed database — xem [Bắt đầu](getting-started.md) và [Sao lưu và khôi phục](backups-and-rollback.md) để biết khi nào cần chạy chúng thủ công.

## Xem trước production tại local

```powershell
npm run build
npm start
```

`npm start` và `npm run preview` là cùng một lệnh: [`tools/server/start.ts --production`](https://github.com/thuanlyt/osblog/blob/main/tools/server/start.ts). Lệnh này phục vụ trực tiếp asset trong `dist/client` và định tuyến mọi thứ khác qua router SSR thật — kể cả API kết nối database — trên một server Node `http` thuần bind vào `127.0.0.1:5173` (ghi đè bằng `PORT`). Đây là một lần chạy production đầy đủ tại local, không phải bản xem trước chỉ có client.

## VPS / server Node độc lập

Chạy cùng lệnh production phía sau một process manager và một reverse proxy, vì `npm start` chỉ bind vào loopback và không tự xử lý TLS.

```powershell
npm ci
npm run build
set NODE_ENV=production
npm start
```

Dùng một process manager để server tự khởi động lại khi crash hoặc reboot — ví dụ `pm2 start npm --name osblog -- start` hoặc một unit systemd chạy `npm start` với `NODE_ENV=production` và các giá trị còn lại trong `.env.production.local` đã được export.

Ví dụ cấu hình reverse proxy Nginx (điều chỉnh `server_name` và đường dẫn chứng chỉ TLS):

```nginx
server {
    listen 443 ssl;
    server_name your-domain.example;

    ssl_certificate     /etc/letsencrypt/live/your-domain.example/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.example/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Chỉ đặt `TRUST_PROXY=true` trong cấu hình này, để server đọc IP client thật từ `X-Forwarded-For` do chính Nginx của bạn đặt — không bao giờ bật cờ này nếu server lộ trực tiếp ra internet, vì bất kỳ ai cũng có thể giả mạo header đó. Đặt `SITE_URL`/`BETTER_AUTH_URL` thành `https://your-domain.example`. Đường triển khai này đã được rà soát nhưng chưa được chạy thử trên một VPS thật trong kho mã này — hãy xác minh toàn bộ trước khi phụ thuộc vào nó.

## Vercel

[`vercel.json`](https://github.com/thuanlyt/osblog/blob/main/vercel.json) trỏ mọi request vào một Node.js Function duy nhất:

```json
{
  "regions": ["sin1"],
  "buildCommand": "npm run build",
  "outputDirectory": "dist/client",
  "functions": { "api/index.ts": { "includeFiles": "dist/server/**", "maxDuration": 30 } },
  "routes": [{ "handle": "filesystem" }, { "src": "/(.*)", "dest": "/api/index" }]
}
```

Vercel phục vụ trực tiếp file tĩnh đã hash trong `dist/client` khi request khớp một file (`handle: filesystem`), còn lại chuyển tiếp đến [`api/index.ts`](https://github.com/thuanlyt/osblog/blob/main/api/index.ts), file này export lại cùng `nodeHandler` được đóng gói trong `dist/server/index.js` (đưa vào qua `includeFiles`). Chỉ có một function, một router, không có function Vercel riêng cho từng route.

**Điều gì đã thật hôm nay:** ứng dụng đang chạy trên Vercel production với environment Neon và route smoke bên dưới đã đạt. Nếu cần tạo deployment mới với credential được ủy quyền, dùng:

```powershell
npx vercel          # deploy preview
npx vercel --prod   # deploy production
```

Đặt mọi biến chỉ dành cho server từ [Cấu hình](configuration.md) trong phần cài đặt môi trường của project Vercel trước khi deploy production — không bao giờ đặt trong `vercel.json` hay mã nguồn. [`tools/server/configure-vercel.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/server/configure-vercel.ts) là công cụ chạy một lần bởi người vận hành, đẩy các bí mật được sinh ra lên một project Vercel đã liên kết và bootstrap tài khoản admin trên đó; nó cần một `.env.production.local` đã được pull từ Vercel (`vercel env pull`) từ trước và sẽ từ chối chạy nếu chưa có `DATABASE_URL` trong đó. Environment production hiện tại đã được operator provision/bootstrap; giá trị secret không được lưu trong repository.

Các domain dự kiến:

- Chính: [`https://osblog.thuanlyt.id.vn`](https://osblog.thuanlyt.id.vn) — **live, đã xác minh 2026-09-05**. DNS/TLS và HTTP smoke đạt.
- Phụ: [`https://osblog.vercel.app`](https://osblog.vercel.app) — **live, đã xác minh 2026-09-05** dưới dạng alias cùng deployment production. Canonical HTML cố ý trỏ về domain chính.

Smoke route live cho `dpl_8PzrSBYo5rsYzwfeqTXn2tDLzdjD` đạt trên cả hai hostname: `GET /api/healthz` trả `200` với `database=connected`; `/`, bài viết seed, `/docs/editor?lang=vi`, `/sitemap.xml`, `/robots.txt`, `/media/osblog-cap-demo.gif`, và `/media/osblog-cap-demo.mp4` trả `200`; `/admin` trả `303` tới `/admin/login`. Đây là xác minh đường Vercel/Neon production, không phải xác minh VPS hay Netlify.

Việc liên kết provider (project Vercel tồn tại, được liên kết với Neon) là một sự thật khác với việc ứng dụng đã thật sự được deploy — đừng đọc cái này như bằng chứng cho cái kia. Đừng coi bất kỳ URL nào ở trên là có thể truy cập cho đến khi trang này hoặc `work/SUPERVISOR_REPORT.md` xác nhận kèm bằng chứng có ngày tháng.

## Netlify

[`netlify.toml`](https://github.com/thuanlyt/osblog/blob/main/netlify.toml) build cùng output client/server và nối vào một function kiểu Fetch duy nhất:

```toml
[build]
command = "npm run build"
publish = "dist/client"
functions = "netlify/functions"

[build.environment]
NODE_VERSION = "24"

[functions]
node_bundler = "esbuild"
included_files = ["dist/server/**"]

[[redirects]]
from = "/*"
to = "/.netlify/functions/osblog"
status = 200
```

[`netlify/functions/osblog.mts`](https://github.com/thuanlyt/osblog/blob/main/netlify/functions/osblog.mts) import cùng router đã build (`handle` từ `dist/server/index.js`) và chuyển đổi nó sang chữ ký function kiểu Fetch của Netlify. Mọi path đều đi qua redirect catch-all đến function duy nhất đó, giống hành vi của Vercel và VPS. **Adapter này đã được xây dựng và build thành công, nhưng chưa từng có lần deploy Netlify nào được thực hiện.** Xây dựng một adapter và xác minh nó trên nền tảng Netlify thật là hai khẳng định khác nhau — trang này chỉ khẳng định điều đầu tiên. Nếu bạn tự deploy, hãy đặt cùng các biến môi trường chỉ dành cho server trong phần cài đặt môi trường riêng của Netlify.

## Danh sách cần đối soát cho lần release tiếp theo

1. Thực hiện và ghi lại một lần deploy Vercel thật (preview, rồi production) kèm kết quả `curl -I` hoặc health-check có ngày tháng trên URL thật.
2. Xác nhận trạng thái domain chính/phụ và cập nhật đồng thời trang này lẫn `work/SUPERVISOR_REPORT.md`.
3. Chạy thử đường VPS/Nginx trên một host thật ít nhất một lần và ghi lại unit process-manager đã dùng.
4. Nếu một lần deploy Netlify được ủy quyền, ghi lại kết quả tại đây thay vì mô tả adapter là chưa kiểm thử.

Tiếp theo: [Sao lưu và khôi phục](backups-and-rollback.md).
