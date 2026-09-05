# Sao lưu và khôi phục

*English: [docs/backups-and-rollback.md](../backups-and-rollback.md)*

**Trạng thái hiện tại (2026-09-05):** một database Neon Postgres thật (`osblog-db`, khu vực Singapore) đã được cấp phát và liên kết với deployment Vercel production đang live. Các migration `0000` đến `0003` đã chạy trên đó, và chạy lại (replay) bộ chạy migration cho kết quả nhất quán (idempotent). Smoke route live đã được xác minh, và rehearsal rollback alias Vercel có thể hoàn tác đã pass. Backup/restore Neon vẫn chưa được xác minh vì phiên Neon CLI local chưa đăng nhập.

## Migration database

Nguồn schema chính là [`src/server/schema.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/schema.ts). Bốn migration đã rà soát nằm trong [`drizzle/`](https://github.com/thuanlyt/osblog/blob/main/drizzle/):

| Migration | Nội dung |
|---|---|
| `0000_durable_content.sql` | Các bảng ban đầu `category`, `post`, `comment`, `rate_limit_bucket`, `audit_event`. |
| `0001_auth_tables.sql` | Các bảng `user`, `session`, `account`, và bảng verification của Better Auth. |
| `0002_precision_and_constraints.sql` | Chỉnh độ chính xác và ràng buộc bổ sung cho schema nội dung. |
| `0003_auth_issuer.sql` | Sửa trường `issuer` của account auth, dùng để phân biệt tài khoản dựa trên credential. |

`npm run db:migrate` (xem [`src/server/provision.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/provision.ts)) áp dụng các migration này trong một transaction duy nhất, được bảo vệ bởi advisory lock của Postgres (để các lần chạy đồng thời không xung đột) và một bảng theo dõi `osblog_migration` khóa theo tên kèm checksum SHA-256 của nội dung file. Chạy lại sau khi mọi migration đã áp dụng là no-op; chạy trên một file mà nội dung đã áp dụng bị thay đổi sẽ ném lỗi thay vì âm thầm áp dụng lại — điều này đã được xác minh bằng cách replay bộ chạy trên bốn migration ở trên.

Trước khi chạy migration trên một target thật:

1. Đặt `DATABASE_URL_MIGRATIONS` (hoặc dùng lại `DATABASE_URL`) trong môi trường vận hành được bảo vệ — không bao giờ đặt trong mã client hay file đã commit.
2. Sao lưu Neon hoặc mở một branch dùng một lần trước — xem bên dưới.
3. Chạy `npm run db:migrate` (hoặc `--mode=production` với `.env.production.local`) và ghi lại chính xác target, lệnh, và kết quả trong báo cáo công việc.
4. Chỉ chạy `npm run db:seed` nếu bạn muốn nội dung giới thiệu song ngữ tùy chọn; lệnh này idempotent và không bao giờ ghi đè nội dung đã chỉnh sửa (`onConflictDoNothing`).

## Kỳ vọng sao lưu

Neon Postgres cung cấp point-in-time restore và branching ngay ở gói miễn phí mà dự án này dùng.

- Xác nhận cửa sổ lưu trữ (retention) và quy trình restore từ branch trực tiếp trong Neon console trước khi dựa vào nó cho một sự cố.
- Sao lưu hoặc mở branch dùng một lần ngay trước khi chạy bất kỳ migration nào trên database production.
- Ghi lại định danh bản sao lưu/branch cùng bằng chứng migration trong báo cáo công việc, không chỉ trong tin nhắn chat.

Việc sao lưu/restore từ branch của Neon chưa được thực hiện thử nghiệm đầu-cuối cho dự án này — hãy coi các bước trên là quy trình, không phải một lần diễn tập đã hoàn tất. Cycle vận hành ngày 2026-09-05 không thể tạo branch disposable: `npx neon@latest profile list -o json` trả về profile `DEFAULT` chưa xác thực (`account: "-"`), và `neon status` yêu cầu OAuth qua trình duyệt. Không có mutation nào trên database production. Hãy đăng nhập Neon CLI, tạo branch có thời hạn ngắn, ghi lại định danh, rồi thực hiện rehearsal restore trước migration schema tiếp theo.

## Rollback mã nguồn

Rollback có hai chiều:

1. **Lỗi chỉ do code:** trỏ alias/domain của target triển khai về bản build tốt gần nhất đã biết, sau đó chạy smoke check (tối thiểu là `GET /api/healthz` và một trang bài viết thật) trên bản đã khôi phục trước khi coi sự cố đã đóng.
2. **Có thay đổi schema:** chỉ rollback code trong khi database vẫn tương thích ngược với phiên bản trước (migration kiểu expand/contract, không phải thay đổi phá hủy tại chỗ). Không bao giờ chạy một migration "down" phá hủy chưa được rà soát trong lúc xử lý sự cố. Nếu cần khôi phục nội dung, dùng cơ chế backup/point-in-time đã kiểm chứng của Neon dưới sự phê duyệt sự cố rõ ràng, sau đó đối soát lại các dòng `audit_event` và vô hiệu hóa HTML đã cache.

Bước "trỏ alias về bản cũ" đã được rehearsal vào ngày 2026-09-05. Alias chính `osblog.thuanlyt.id.vn` tạm thời trỏ tới deployment READY trước đó `osblog-q0r15ysiu-thuanlyts-projects.vercel.app`; `/api/healthz`, `/`, `/docs`, `/sitemap.xml`, và `/robots.txt` đều trả về kết quả thành công như kỳ vọng. Sau đó alias được trả về deployment READY hiện tại `osblog-4p4nm76sx-thuanlyts-projects.vercel.app`, alias tạm đã được gỡ, và cả hai alias production được smoke-test lại. Bằng chứng đầy đủ nằm tại [`work/evidence/ops-recovery-drill.md`](https://github.com/thuanlyt/osblog/blob/main/work/evidence/ops-recovery-drill.md).

## Khôi phục ở cấp nội dung

Vì post và category dùng soft delete (trạng thái `archived`, không xóa cứng) và mọi thao tác ghi đều tạo một dòng `audit_event`, hầu hết thay đổi nội dung ngoài ý muốn có thể khôi phục bằng cách xuất bản lại bản ghi đã archive thay vì restore toàn bộ database. **Xóa bình luận là xóa thật, vĩnh viễn** (xem [Quản trị và bình luận](admin-and-comments.md)) — khôi phục một bình luận đã xóa cần restore toàn bộ database, và không có đường soft-delete nào cho nó.

## Những gì vẫn chưa xác minh

- Sao lưu/restore từ branch của Neon chưa được thử nghiệm cho một sự cố thật; blocker hiện tại là Neon CLI chưa xác thực.
- Rollback alias triển khai đã được rehearsal an toàn trên alias production chính và khôi phục thành công.
- Cơ chế khóa migration khi chạy đồng thời được bảo vệ bởi advisory lock nhưng chưa được load-test.
- Mục tiêu thời gian khôi phục và mức mất dữ liệu chấp nhận được chưa được chủ dự án định nghĩa.

Quay lại [Mục lục tài liệu](index.md).
