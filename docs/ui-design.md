# osblog UI design handover / Bàn giao thiết kế UI

## Purpose / Mục đích

**English.** `design-system/osblog/MASTER.md` is the persisted source of truth
for the osblog public blog and admin UI. Read it before creating or changing a
page. A future page-specific override may refine layout, but it must retain the
Master accessibility, contrast, keyboard, touch, responsive, motion, and image
performance rules.

**Tiếng Việt.** `design-system/osblog/MASTER.md` là nguồn sự thật đã lưu cho
giao diện blog công khai và khu vực quản trị của osblog. Hãy đọc file này trước
khi tạo hoặc sửa trang. Override theo từng trang trong tương lai chỉ được tinh
chỉnh bố cục, không được làm yếu các quy tắc về khả năng tiếp cận, tương phản,
bàn phím, vùng chạm, responsive, chuyển động và hiệu năng ảnh.

## Design direction / Định hướng

**English.** UI/UX Pro Max resolved the requested “open source bilingual
editorial blog minimalist content-first” brief to **Newsletter / Content First**
with **Swiss Modernism 2.0**. The system uses editorial black, an accent pink,
Playfair Display headings, Source Serif 4 reading text, a 4px/8px rhythm, and a
mobile-first 12-column grid that becomes active at desktop widths.

**Tiếng Việt.** UI/UX Pro Max ánh xạ brief “open source bilingual editorial blog
minimalist content-first” thành mẫu **Newsletter / Content First** và phong cách
**Swiss Modernism 2.0**. Hệ thống dùng đen biên tập, hồng nhấn, tiêu đề Playfair
Display, nội dung đọc Source Serif 4, nhịp 4px/8px và lưới 12 cột ưu tiên mobile,
chỉ mở rộng đầy đủ ở màn hình desktop.

## React/Vite implementation map / Ánh xạ triển khai React/Vite

| UI concern / Hạng mục | Implementation contract / Hợp đồng triển khai |
|---|---|
| Theme tokens / Token giao diện | Put Master CSS variables in the global stylesheet; components consume semantic tokens such as `--color-foreground`, `--color-surface`, `--color-accent-ink`, and spacing variables. Không hardcode màu theo từng trang. |
| Shell / Khung ứng dụng | Use semantic `header`, labeled `nav`, `main`, and `footer`; include a skip link and preserve the same navigation placement on public and admin routes. |
| Routing / Định tuyến | Vite/React routes must deep-link. After route changes, move focus to `main` or its page heading. Do not make navigation depend on hover. |
| Post cards / Card bài viết | Use a semantic link around the title/thumbnail when the whole card navigates; otherwise use a real button/link for each action. Use stable post IDs as React keys. |
| Article / Bài viết | Render a readable `article` with a single page `h1`, correct `lang` per language block, 65ch prose, responsive media, metadata text, and related content after the article. |
| Forms / Biểu mẫu | Pair every input with a visible label and helper/error text. Use `type="email"`, `autocomplete`, `aria-describedby`, and focus the first invalid field after submit. |
| Admin CRUD / CRUD quản trị | Use the same tokens and 44px controls; show loading/saved/error states, confirmation for delete, and publication state with text/icon as well as color. |
| Icons / Biểu tượng | Use one outline SVG family (Phosphor or Lucide), with named icon-only controls and `aria-hidden` decorative SVGs. Never use emoji icons. |

## Responsive and accessibility gates / Cổng responsive và tiếp cận

**English.** Build from 375px upward and check 768px, 1024px, and 1440px. Use
16px mobile gutters, 24px tablet gutters, 32px desktop gutters, fluid containers,
no horizontal scroll, and 60–75 characters per desktop prose line. Every target
is at least 44×44px with 8px separation. Keyboard focus is visible, Escape closes
menus/dialogs, errors are announced, and `prefers-reduced-motion: reduce`
removes non-essential animation. Keep browser zoom enabled.

**Tiếng Việt.** Xây dựng từ 375px rồi kiểm tra 768px, 1024px và 1440px. Dùng lề
16px trên mobile, 24px tablet, 32px desktop, container co giãn, không cuộn ngang
và 60–75 ký tự mỗi dòng văn bản dài trên desktop. Mọi vùng tương tác tối thiểu
44×44px và cách nhau 8px. Focus bàn phím phải nhìn thấy, Escape đóng menu/dialog,
lỗi được thông báo cho trình đọc màn hình, còn `prefers-reduced-motion: reduce`
loại bỏ animation không cần thiết. Không tắt zoom của trình duyệt.

The generated pink must not be paired with white for normal-size text: the
recorded ratio is 3.53:1. Use `--color-on-accent: #09090B` on pink fills and
`--color-accent-ink: #9D174D` for small links; the handover records verified
light-theme pairs in Master. The primary button keeps the semantic
`--color-accent`/`--color-on-accent` pair on hover at `5.64:1`; hover adds the
approved shadow treatment without changing the contrast pair.

Màu hồng được tạo không được ghép với nền trắng cho văn bản cỡ thông thường:
tỷ lệ đã ghi là 3.53:1. Nút primary giữ cặp token semantic
`--color-accent`/`--color-on-accent` khi hover ở mức `5.64:1`; hover chỉ thêm
hiệu ứng đổ bóng đã được duyệt và không đổi cặp tương phản.

## Images, motion, and loading / Ảnh, chuyển động và tải dữ liệu

Use AVIF/WebP, responsive `srcset`/`sizes`, explicit dimensions or `aspect-ratio`,
and `decoding="async"`. Eager-load only a hero image; lazy-load below-fold media.
Meaningful images need concise alt text; decorative images use empty alt text.
Reserve media space to target CLS below 0.1. Async actions over 300ms show a
skeleton or progress state.

Dùng AVIF/WebP, `srcset`/`sizes` responsive, kích thước rõ ràng hoặc
`aspect-ratio`, và `decoding="async"`. Chỉ eager-load ảnh hero; ảnh dưới fold dùng
lazy-load. Ảnh có ý nghĩa cần alt ngắn gọn; ảnh trang trí dùng alt rỗng. Dành sẵn
không gian cho media với mục tiêu CLS dưới 0.1. Tác vụ bất đồng bộ trên 300ms
phải có skeleton hoặc trạng thái tiến trình.

Motion is meaningful only, uses 150–300ms transitions, and changes transform or
opacity rather than layout dimensions. Reduced motion makes content immediate.
Chuyển động chỉ dùng để diễn đạt quan hệ nguyên nhân–kết quả, dùng transition
150–300ms, và chỉ thay đổi transform/opacity thay vì kích thước bố cục. Chế độ
giảm chuyển động phải hiển thị nội dung ngay.

## Reproducible commands / Lệnh tái lập

Run the persisted design-system search from PowerShell or a Python-capable shell:

```text
python C:\Users\THUANLYT\.codex\skills\ui-ux-pro-max\scripts\search.py "open source bilingual editorial blog minimalist content-first" --design-system --persist -p "osblog" --output-dir F:\dev\test-useagent
```

The focused searches used during handover are:

```text
python C:\Users\THUANLYT\.codex\skills\ui-ux-pro-max\scripts\search.py "animation accessibility z-index loading" --domain ux
python C:\Users\THUANLYT\.codex\skills\ui-ux-pro-max\scripts\search.py "responsive images rerender list loading" --stack react
python C:\Users\THUANLYT\.codex\skills\ui-ux-pro-max\scripts\search.py "outline navigation svg" --domain icons
```

Once application code exists, the owning QA task should additionally run the
configured Vite tests/build plus automated accessibility checks at the four
reference widths, both themes, keyboard-only navigation, and reduced motion.

Khi có application code, task QA phụ trách cần chạy test/build Vite đã cấu hình,
kiểm tra accessibility tự động ở bốn độ rộng tham chiếu, cả hai theme, điều
hướng chỉ bằng bàn phím và chế độ giảm chuyển động.

## Ownership / Sở hữu

This handover changes only the persisted design system and its documentation;
it does not implement application components. The next implementation workers
must treat Master as input and record any contract-changing decision before
altering it.

Handover này chỉ thay đổi design system đã lưu và tài liệu liên quan; không triển
khai component ứng dụng. Worker triển khai tiếp theo phải coi Master là đầu vào
và ghi decision nếu cần thay đổi hợp đồng thiết kế.
