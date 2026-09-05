# Media

*English: [docs/media.md](../media.md)*

**Đã có media sản phẩm thật.** Kho mã chứa một bản ghi màn hình Cap được quay từ OSBlog đang chạy, xuất ra cả MP4 và GIF trong `public/media/`.

## Vì sao

Đăng một ảnh chụp của một màn hình chưa hoàn thiện, hoặc một mockup dàn dựng trình bày như ảnh chụp sản phẩm thật, sẽ phản ánh sai trạng thái thật của dự án. Chuẩn tài liệu của dự án này là mô tả trạng thái thật, có thể kiểm chứng, thay vì minh họa một trạng thái mong muốn. Bản ghi dưới đây được quay từ bản build production đang chạy bằng Cap, sau khi luồng kiểm thử trên trình duyệt đã đạt.

Bộ test trình duyệt Playwright ([`tests/browser/`](https://github.com/thuanlyt/osblog/tree/main/tests/browser/)) là bằng chứng xác minh, không phải demo được biên tập. Cổng hiện tại bao phủ publish thật, SSR công khai, gửi bình luận ẩn danh, kiểm duyệt, bàn phím, tài liệu responsive, và kiểm tra Axe.

## Demo sản phẩm

![Demo OSBlog: trang công khai, tài liệu và bài viết](/media/osblog-cap-demo.gif)

- [Xem video MP4](/media/osblog-cap-demo.mp4)
- File nguồn: [`public/media/osblog-cap-demo.gif`](https://github.com/thuanlyt/osblog/blob/main/public/media/osblog-cap-demo.gif) và [`public/media/osblog-cap-demo.mp4`](https://github.com/thuanlyt/osblog/blob/main/public/media/osblog-cap-demo.mp4)

Bản ghi cho thấy trang chủ công khai, trang tài liệu nằm cùng mã nguồn, và một bài viết đã xuất bản trong các cửa sổ Chromium app cô lập. Bản ghi không chứa thông tin đăng nhập admin hay dữ liệu riêng tư. MP4 có chất lượng cao hơn; GIF phù hợp để xem nhanh trong README và issue.

## Nguồn gốc bản ghi

- Công cụ: [Cap](https://cap.so), xuất bằng Cap CLI của kho mã.
- Nguồn: ứng dụng OSBlog đang chạy với dữ liệu công khai đã seed.
- Định dạng: MP4 để xem đầy đủ và GIF 960×540/8 fps để xem nhanh.
- Xác minh: kiểm tra tính hợp lệ của project Cap đạt; cùng bản build đạt smoke test production tại local và bộ test browser đã compile.
- Quay lại: chạy `cap record start`, thao tác các route công khai, dừng bản ghi, rồi export cả hai định dạng vào `public/media/`. Không để thông tin đăng nhập riêng tư lọt vào khung hình.

## Quy tắc cho người đóng góp

Không thêm tham chiếu `![alt](đường-dẫn)` ảnh, GIF, hay video vào bất kỳ file Markdown nào trong kho mã này trừ khi file được tham chiếu thật sự đã được commit tại đường dẫn đó. Nếu bạn muốn đề xuất thêm media, hãy mở một pull request thêm cả file lẫn tham chiếu cùng lúc — xem [CONTRIBUTING.md](../../CONTRIBUTING.md).

Quay lại [Mục lục tài liệu](index.md).
