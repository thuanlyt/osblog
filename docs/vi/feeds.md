---
title: Nguồn tin RSS và Atom
description: Theo dõi các bài viết OSBlog mới xuất bản bằng tiếng Việt hoặc tiếng Anh.
---
# Nguồn tin RSS và Atom

*English: [RSS and Atom feeds](../feeds.md)*

Thêm URL nguồn tin của trang OSBlog vào ứng dụng đọc tin:

| Định dạng | Tiếng Anh | Tiếng Việt |
| --- | --- | --- |
| RSS 2.0 | `/feed.xml?lang=en` | `/feed.xml?lang=vi` |
| Atom 1.0 | `/feed.atom?lang=en` | `/feed.atom?lang=vi` |

Ví dụ: `https://your-blog.example/feed.atom?lang=vi`; thay tên miền ví dụ bằng tên miền của bạn. Khi không có `lang`, cả hai địa chỉ dùng tiếng Anh. Chỉ `lang=vi` chọn tiếng Việt; các giá trị khác dùng tiếng Anh, giống các trang công khai. Cookie và `Accept-Language` không quyết định ngôn ngữ.

Các trang công khai tải thành công còn khai báo cả hai nguồn tin trong phần head HTML do máy chủ kết xuất, với `rel="alternate"`, `type="application/rss+xml"` hoặc `type="application/atom+xml"` và URL tuyệt đối theo ngôn ngữ của trang. Ứng dụng đọc tin có thể tự tìm nguồn tin từ URL trang. Trang tìm kiếm công khai cũng có các liên kết này; trang quản trị, đăng nhập và trang lỗi không có. Liên kết nguồn tin không mang theo bộ lọc phân trang, chuyên mục hoặc tìm kiếm.

Mỗi nguồn tin có tối đa 20 bài đã xuất bản, xếp theo ngày xuất bản giảm dần; nếu trùng ngày thì xếp theo ID bài giảm dần để thứ tự ổn định. Truy vấn dùng chung với danh sách công khai loại bỏ bản nháp, bài lưu trữ, bài hẹn ngày xuất bản trong tương lai và bài thuộc chuyên mục đã lưu trữ. Các tham số khác (gồm `limit`, `page`, tìm kiếm và sắp xếp) bị bỏ qua. Nguồn tin phục vụ theo dõi bài mới, không phải toàn bộ kho bài viết.

Mỗi mục có tiêu đề và tóm tắt theo ngôn ngữ đã chọn, ngày xuất bản và cập nhật, cùng liên kết tuyệt đối đến `/post/:slug?lang=en` hoặc `?lang=vi`. Phần mô tả RSS và tóm tắt Atom chứa văn bản thuần được escape đúng một lần khi tạo XML. Sau khi phân tích XML, văn bản gốc được khôi phục, gồm dấu &, dấu ngoặc nhọn và chuỗi entity nguyên văn; ký tự không hợp lệ trong XML 1.0 được loại bỏ. Markup vẫn là văn bản, không trở thành phần tử XML. Khi tự xây ứng dụng đọc tin, hãy hiển thị tóm tắt đã giải mã bằng `textContent`, không chèn như HTML đáng tin cậy. Atom khai báo rõ `type="text"` cho tóm tắt. Nội dung đầy đủ và dữ liệu riêng của tài khoản/bình luận không được đưa vào nguồn tin. Atom dùng tên trang OSBlog làm tác giả nguồn tin.

UUID bài viết là mã định danh ổn định qua các lần sửa và đổi slug. Liên kết dùng slug hiện tại; liên kết cũ vẫn chịu giới hạn nêu trong [hướng dẫn trình soạn thảo](editor.md). Ngày cập nhật của mục là thời điểm muộn hơn giữa ngày lưu cập nhật và ngày xuất bản. Trường `updated` của nguồn Atom và `lastBuildDate` của RSS lấy ngày muộn nhất trong các mục được đưa vào; nguồn tin trống dùng `1970-01-01T00:00:00.000Z`. RSS cũng cung cấp ngày cập nhật từng mục qua namespace Atom.

## Tên miền và bộ nhớ đệm

Liên kết nguồn tin và bài viết dùng cấu hình origin SSR hiện có: ưu tiên `SITE_URL`, rồi `BETTER_AUTH_URL`, rồi `VITE_SITE_URL`. URL cấu hình được rút về origin HTTP(S); môi trường production yêu cầu HTTPS. Host header của yêu cầu không quyết định liên kết. Xem [cấu hình](configuration.md) để thiết lập.

Phản hồi GET và HEAD thành công có content type RSS hoặc Atom với UTF-8, `Content-Language`, ETag và `Cache-Control: public, max-age=300, s-maxage=300`. HEAD trả cùng header nhưng không có body. `If-None-Match` khớp trả 304 không có body. ETag phản ánh toàn bộ nguồn tin nên thay đổi nội dung, thêm/xóa mục hoặc đổi ngôn ngữ đều làm mất hiệu lực, kể cả khi ngày cập nhật mới nhất không tăng. Các ngày trong nguồn tin không được dùng để xác thực bộ nhớ đệm HTTP.

Ứng dụng đọc tin và bộ nhớ đệm dùng chung có thể giữ phản hồi thành công trong năm phút, kể cả bài vừa lưu trữ hoặc bỏ xuất bản. Máy chủ tạo lại nguồn tin từ dữ liệu SQL công khai cho mỗi yêu cầu không được phục vụ từ bộ nhớ đệm. Lỗi trả thông báo đã lọc thông tin nhạy cảm với `no-store`; các tuyến khác giữ chính sách bộ nhớ đệm hiện có.

## Kiểm tra cục bộ

```powershell
npm test -- --run tests/server/feed.test.ts tests/server/seo.test.ts
```

Các bộ kiểm tra dùng SQL cục bộ dùng một lần và trình phân tích DOM/XML để kiểm tra hai định dạng, văn bản tóm tắt chính xác, markup không trở thành phần tử XML, điều kiện công khai, thứ tự và giới hạn, ngôn ngữ, ngày, liên kết, bộ nhớ đệm, lỗi và liên kết khám phá nguồn tin trên trang SSR công khai/riêng tư. Không cần cơ sở dữ liệu trực tuyến hoặc thông tin đăng nhập.

Nguồn đối chiếu: `src/server/feed.ts`, `src/server/router.ts`, `src/server/seo.ts:renderDocument` và `src/server/content.ts:listPublishedPosts` / `visiblePost`. Đặc tả định dạng: [RSS 2.0](https://www.rssboard.org/rss-specification) và [Atom RFC 4287](https://www.rfc-editor.org/rfc/rfc4287).
