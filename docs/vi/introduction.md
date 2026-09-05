# Giới thiệu OSBlog

*English: [docs/introduction.md](../introduction.md)*

OSBlog — "open source blog" — là ứng dụng xuất bản song ngữ nhỏ gọn. Một người viết hoặc một nhóm nhỏ viết bằng tiếng Việt và tiếng Anh, xuất bản bài viết Markdown kèm ảnh bìa thật và metadata SEO, và cho phép độc giả để lại bình luận đã kiểm duyệt mà không cần tạo tài khoản. Không khẩu hiệu, không trừu tượng hóa thừa thãi — một giao diện lấy nội dung làm trọng tâm, được hỗ trợ bởi database Postgres thật.

## Vì sao dự án tồn tại

Hầu hết các blog starter song ngữ đều giả lập backend (một mảng trong bộ nhớ giả vờ là database) hoặc mang theo cả một CMS phức tạp cho một trang blog một tác giả. OSBlog chọn mục tiêu hẹp hơn:

- Một database Postgres thật duy nhất (Neon) với schema đã rà soát cho category, post, comment, rate limit, và audit event — xem [`src/server/schema.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/schema.ts).
- Một danh tính admin duy nhất qua [Better Auth](https://better-auth.com), được người vận hành bootstrap — không có đăng ký công khai, xác minh email, hay quy trình đặt lại mật khẩu.
- Bình luận ẩn danh, chỉ cần email, luôn bắt đầu ở trạng thái kiểm duyệt `pending` — không bao giờ tự động xuất bản.
- Một trình soạn thảo Markdown thật với slug, ảnh bìa kèm alt text bắt buộc theo từng ngôn ngữ, và tiêu đề/mô tả SEO riêng từng ngôn ngữ.
- Render phía server để bài viết đã xuất bản mang HTML và metadata thật đến crawler, không chỉ là một client shell.

## Dành cho ai

- Nhà phát triển muốn một blog song ngữ họ hoàn toàn sở hữu và có thể tự host, chạy trên VPS, hoặc triển khai lên Vercel/Netlify.
- Bất kỳ ai đánh giá kho mã này như một tham chiếu cho stack Vite + React + TypeScript + Drizzle + Better Auth với một router server dùng chung cho ba runtime.
- Người đóng góp tiếp nối công việc — xem [Triển khai](deployment.md) và [Sao lưu và khôi phục](backups-and-rollback.md) để biết chính xác bằng chứng vận hành nào còn thiếu.

## "Mã nguồn mở" ở đây nghĩa là gì

Dự án cấp phép MIT (xem [LICENSE](../../LICENSE)) và mã nguồn công khai tại [github.com/thuanlyt/osblog](https://github.com/thuanlyt/osblog). Bất kỳ ai cũng có thể đọc, fork, tự host, hoặc đóng góp theo điều khoản trong [CONTRIBUTING.md](../../CONTRIBUTING.md). Không có gói trả phí, không có thành phần đóng.

## Trạng thái trung thực, tính đến 2026-09-05

Mã ứng dụng, trang quản trị, kiểm duyệt bình luận, và pipeline SEO/SSR đã được xây dựng và có 64 test unit/component/SQL integration cùng 2 test E2E trên browser compile đạt. Một database Neon Postgres thật đã được cấp phát, migrate, seed kèm quyền truy cập admin đã bootstrap. Đã có walkthrough Cap thật trong [Media](media.md). Vercel production đã live trên cả hai hostname yêu cầu và route smoke theo ngày đã đạt. Mỗi trang trong bộ tài liệu này tự nêu rõ trạng thái đã xác minh so với chưa xác minh ở gần đầu trang — nếu một trang không ghi rõ điều gì đó là đã hoàn tất, hãy coi nó là đang chờ. Xem [`work/SUPERVISOR_REPORT.md`](https://github.com/thuanlyt/osblog/blob/main/work/SUPERVISOR_REPORT.md) để biết trạng thái release chính thức, cập nhật liên tục.

Tiếp tục đến [Bắt đầu](getting-started.md).
