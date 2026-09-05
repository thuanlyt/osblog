# Quản trị và bình luận

*English: [docs/admin-and-comments.md](../admin-and-comments.md)*

**Trạng thái hiện tại: đã xây dựng và kiểm thử.** Ranh giới đăng nhập, hợp đồng CRUD, và kiểm duyệt bình luận mô tả dưới đây tồn tại trong mã nguồn và có test unit/contract bao phủ (xem [`tests/server/auth.test.ts`](https://github.com/thuanlyt/osblog/blob/main/tests/server/auth.test.ts) và [`tests/server/comments.test.ts`](https://github.com/thuanlyt/osblog/blob/main/tests/server/comments.test.ts)). Một tài khoản admin thật đã được bootstrap trên database Neon đã cấp phát. Cổng browser compile xác minh end-to-end luồng publish và moderation; operator vẫn nên khám phá thủ công toàn bộ màn hình admin.

## Mô hình đăng nhập admin

- Xác thực dùng [Better Auth](https://better-auth.com) với đúng một danh tính admin — xem [`src/server/auth.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/auth.ts) và [`src/server/auth-policy.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/auth-policy.ts).
- **Không có đăng ký công khai, không tự đăng ký, và không có quy trình xác minh email hay đặt lại mật khẩu.** `disableSignUp` được bật trong chính sách Better Auth, và tài khoản duy nhất có thể tồn tại là do người vận hành tạo ra bằng lệnh `npm run db:bootstrap` (xem [Bắt đầu](getting-started.md)). Chạy bootstrap tức là người vận hành xác nhận họ kiểm soát danh tính đứng sau `ADMIN_EMAIL` — không có bước xác minh tự động nào, và tài liệu này không bịa ra bước nào cả.
- Phiên đăng nhập hết hạn sau 8 giờ và làm mới sau 1 giờ sử dụng. Cookie tự động đánh dấu `Secure` bất cứ khi nào `BETTER_AUTH_URL` là origin `https://`.
- Mọi thao tác ghi đều có kiểm tra vai trò phía server riêng (`isAdminUser`) trong [`src/server/router.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/router.ts) — việc ẩn điều khiển admin trong UI React không bao giờ được coi là ủy quyền.
- Đăng nhập cũng bị giới hạn tốc độ: 15 lần thử mỗi 15 phút, theo dõi riêng theo hash IP và hash email.

## Hợp đồng CRUD category và post

Trang quản trị (`/admin`, `/admin/posts`, `/admin/posts/new`, `/admin/posts/:id/edit`, `/admin/categories`, `/admin/comments`) là một ứng dụng React thật — xem [`src/app/admin/`](https://github.com/thuanlyt/osblog/blob/main/src/app/admin/) — giao tiếp với các route `/api/admin/*`:

- Trường bài viết, validation, và quy trình slug/ảnh bìa/SEO/draft-publish được mô tả trong [Trình soạn thảo Markdown](editor.md).
- Xóa category bị từ chối với lỗi `409 Conflict` khi vẫn còn bài viết tham chiếu, trừ khi có bước gán lại/archive có chủ đích trước đó.
- **Xóa post và category mặc định là archive** — hành động "Archive" trong UI đặt `isArchived`/`status: archived` thay vì xóa dòng dữ liệu. Không có nút xóa vĩnh viễn cho post hoặc category trong giao diện admin hiện tại.
- Mọi thao tác ghi đều tạo một audit event (người thực hiện, hành động, entity, tóm tắt trước/sau, request ID) theo bảng `audit_event` trong [`src/server/schema.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/schema.ts).
- Cập nhật dùng optimistic concurrency qua `expectedUpdatedAt`; một lần ghi dựa trên dữ liệu cũ sẽ bị từ chối với lỗi `409` thay vì âm thầm ghi đè một chỉnh sửa đồng thời.

## Bình luận ẩn danh

Bình luận không bao giờ yêu cầu tài khoản. Độc giả chỉ cần cung cấp email và nội dung:

| Trường | Quy tắc |
|---|---|
| `email` | Bắt buộc, email hợp lệ, tối đa 320 ký tự. Lưu trữ dưới dạng mã hóa (`emailCiphertext`, AES-256-GCM) kèm một hash (`emailHash`) dùng để chống trùng lặp và rate limiting — không bao giờ trả về cho client công khai. |
| `body` | Bắt buộc, 1–5.000 ký tự. |
| `formToken` | Token do server cấp, ký bằng HMAC (`GET /api/comments/token`), có hiệu lực 15 phút; submission thiếu, hết hạn, hoặc sai token sẽ bị từ chối. |
| `honeypot` | Trường ẩn tùy chọn, tối đa 200 ký tự. Nếu có giá trị, submission bị đánh dấu spam — đây là một trong nhiều tín hiệu, không bao giờ là kiểm tra duy nhất. |

Xem [`src/server/comment-contract.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/comment-contract.ts) để biết validation chính xác và [`src/server/comment-policy.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/comment-policy.ts) / [`src/server/comments.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/comments.ts) cho service kiểm duyệt.

### Cỗ máy trạng thái kiểm duyệt

Mọi bình luận vào hệ thống ở trạng thái `pending` hoặc `spam` — **không bao giờ** trực tiếp `approved`:

```
pending ──► approved
        └─► rejected
        └─► spam
```

Một hành động kiểm duyệt của admin mang theo `status`, `reason` tùy chọn, và cùng cơ chế bảo vệ optimistic-concurrency `expectedUpdatedAt` như post.

### Các lớp chống lạm dụng — điều gì thật sự có hôm nay

- Token form do server cấp, đã ký, giới hạn thời gian, từ chối submission cũ hoặc giả mạo.
- Trường honeypot có mặt nhưng không bao giờ được dựa vào một mình.
- Rate limiting nguyên tử và lưu trong database (bảng `rate_limit_bucket`), theo hash IP và hash email đã chuẩn hóa — không phải bộ đếm phía client.
- Địa chỉ IP và email thô không bao giờ được log dưới dạng văn bản thuần; chỉ hash HMAC được lưu cho rate limiting, và bản thân email được mã hóa khi lưu trữ, chỉ dùng cho người kiểm duyệt.
- **Turnstile/CAPTCHA chưa hoạt động.** Schema môi trường chấp nhận giá trị `TURNSTILE_SECRET_KEY`, nhưng chưa có đường mã nào xác minh token Turnstile. Đừng mô tả bình luận là "được bảo vệ bởi CAPTCHA" cho đến khi tích hợp đó tồn tại — xem [Cấu hình](configuration.md).

## Xóa bình luận là xóa thật

Khác với post và category, xóa một bình luận khỏi hàng đợi kiểm duyệt **sẽ xóa vĩnh viễn dòng dữ liệu** — không có trạng thái archive cho bình luận. Đây là hành động được audit rõ ràng, không phải soft delete.

Tiếp theo: [Triển khai](deployment.md).
