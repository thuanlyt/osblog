# Trình soạn thảo Markdown: slug, ảnh bìa, SEO, và draft/publish

*English: [docs/editor.md](../editor.md)*

**Trạng thái hiện tại: đã xây dựng và kiểm thử trên browser.** Trình soạn thảo mô tả dưới đây là một màn hình thật tại `/admin/posts/new` và `/admin/posts/:id/edit` — xem [`AdminPostEditorPage.tsx`](https://github.com/thuanlyt/osblog/blob/main/src/app/admin/AdminPostEditorPage.tsx) và test đi kèm trong [`AdminPostEditorPage.test.tsx`](https://github.com/thuanlyt/osblog/blob/main/src/app/admin/AdminPostEditorPage.test.tsx). Cổng browser compile bao phủ đăng nhập, soạn Markdown, publish và bài viết công khai tạo ra; walkthrough Cap trong [Media](media.md) cho thấy runtime public. Việc khám phá thủ công toàn bộ màn hình admin vẫn là trách nhiệm của operator.

## Bố cục

- **Tab ngôn ngữ** ("English" / "Tiếng Việt") chuyển đổi trường tiêu đề, tóm tắt, nội dung, SEO, và alt ảnh bìa cho ngôn ngữ đó. Cả hai ngôn ngữ được chỉnh sửa trên cùng một bài viết — không có bản nháp riêng theo ngôn ngữ.
- **Toolbar Markdown** phía trên trường nội dung: các nút heading, in đậm, in nghiêng, link, ảnh, danh sách, trích dẫn, và code áp dụng cú pháp Markdown quanh vùng chọn hiện tại (xem [`src/app/admin/toolbar.ts`](https://github.com/thuanlyt/osblog/blob/main/src/app/admin/toolbar.ts)).
- **Chế độ xem**: Edit, Preview, và Split. Preview render bằng cùng component Markdown đã sanitize ([`src/app/markdown.tsx`](https://github.com/thuanlyt/osblog/blob/main/src/app/markdown.tsx)) dùng trên trang công khai, qua `react-markdown` + `remark-gfm`.
- **Sidebar**: trạng thái (`draft`/`published`/`archived`), ngày giờ xuất bản, chọn category, trường slug kèm link xem trước, URL ảnh bìa, và ảnh xem trước.

## Một bài viết có gì

| Trường | Ghi chú |
|---|---|
| `slug` | Chỉ chữ thường, số, và dấu gạch ngang đơn (`^[a-z0-9]+(?:-[a-z0-9]+)*$`), 1–180 ký tự, duy nhất. Xuất hiện trong `/post/:slug`. Tự sinh từ tiêu đề tiếng Anh khi rời khỏi trường lúc tạo bài mới (xem [`src/app/admin/slug.ts`](https://github.com/thuanlyt/osblog/blob/main/src/app/admin/slug.ts)); có thể chỉnh sửa sau đó. |
| `titleVi` / `titleEn` | Bắt buộc, tối đa 240 ký tự mỗi trường. |
| `excerptVi` / `excerptEn` | Bắt buộc, tối đa 1.000 ký tự mỗi trường. |
| `bodyVi` / `bodyEn` | Nội dung Markdown bắt buộc, tối đa 100.000 ký tự mỗi trường. Có đếm số từ trực tiếp bên dưới ô soạn thảo. |
| `coverImageUrl` | Tùy chọn. Phải là URL `http(s)://` hoặc đường dẫn `/assets/...`. |
| `coverImageAltVi` / `coverImageAltEn` | **Bắt buộc ở cả hai ngôn ngữ ngay khi có ảnh bìa.** Được kiểm tra cả phía client lẫn server (`createPostInput`/`updatePostInput`) — đây không chỉ là gợi ý UI. |
| `seoTitleVi` / `seoTitleEn` | Tiêu đề SEO tùy chọn theo từng ngôn ngữ, tối đa 240 ký tự, kèm bản xem trước kết quả tìm kiếm trực tiếp trong sidebar. |
| `seoDescriptionVi` / `seoDescriptionEn` | Mô tả SEO tùy chọn theo từng ngôn ngữ, tối đa 320 ký tự. |
| `status` | `draft`, `published`, hoặc `archived`. |
| `publishedAt` | Bắt buộc ngay khi `status` được đặt thành `published`. |
| `categoryId` | Bắt buộc; mỗi bài viết thuộc đúng một category. Category đã archive vẫn hiện trong danh sách chọn nếu bài viết đang thuộc category đó. |

## Hành vi slug và một lưu ý thật

Slug được kiểm tra theo mẫu trên ở mọi lần tạo và cập nhật, cả phía client lẫn server. **Không có cơ chế redirect slug.** Nếu bạn đổi slug của một bài đã xuất bản, mọi link hoặc bookmark trỏ đến URL cũ sẽ trả về 404 — không có redirect tự động. Hãy coi slug đã xuất bản là gần như cố định, hoặc chấp nhận có chủ đích chi phí link hỏng.

## Khôi phục bản nháp và xử lý xung đột

- **Khôi phục bản nháp chưa lưu.** Trong lúc soạn, form được ghi vào `localStorage` (có debounce, khóa theo email admin và ID bài viết) qua [`src/app/storage.ts`](https://github.com/thuanlyt/osblog/blob/main/src/app/storage.ts). Nếu quay lại trình soạn thảo với một bản nháp chưa lưu mới hơn bài đã lưu, một banner sẽ đề nghị khôi phục hoặc bỏ. Có cảnh báo `beforeunload` khi rời trang mà chưa lưu.
- **Optimistic concurrency.** Mỗi lần lưu đều gửi `expectedUpdatedAt`. Nếu bài viết đã thay đổi kể từ lúc bạn tải nó (do người khác sửa, hoặc từ một tab khác), server từ chối cập nhật với lỗi xung đột và trình soạn thảo hiện lời nhắc "bài viết này đã thay đổi" kèm lựa chọn tải lại bản mới nhất hoặc tiếp tục soạn.

## Quy trình xuất bản

1. Bài mới mặc định `status: draft` và có thể lưu mà không cần `publishedAt`.
2. Chuyển `status` sang `published` yêu cầu `publishedAt`; nút "Publish" tự đặt thời gian hiện tại nếu để trống.
3. `archived` gỡ bài khỏi danh sách công khai mà không xóa. Hành động "Archive" trong trình soạn thảo thực hiện điều này cho một bài đã lưu, và yêu cầu `expectedUpdatedAt` hiện tại, giống mọi cập nhật khác.
4. Đặt `publishedAt` trong tương lai cho một bài `published` được validation chấp nhận, nhưng truy vấn danh sách/chi tiết công khai lọc theo `published_at <= now()` — một bài "published" với ngày tương lai sẽ chưa hiện công khai cho đến khi qua thời điểm đó.

## Render Markdown

Cả preview trong trình soạn thảo lẫn trang bài viết công khai đều render qua cùng một component: [`react-markdown`](https://github.com/remarkjs/react-markdown) với [`remark-gfm`](https://github.com/remarkjs/remark-gfm), bọc bởi [`src/app/markdown.tsx`](https://github.com/thuanlyt/osblog/blob/main/src/app/markdown.tsx) để giữ output đã sanitize và nhất quán giữa những gì tác giả xem trước và những gì độc giả thấy.

Tiếp theo: [Quản trị và bình luận](admin-and-comments.md).
