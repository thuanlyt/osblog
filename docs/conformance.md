# UseAgent conformance and replay / Kiểm thử tuân thủ và replay

## Status / Trạng thái

This is a bounded **supervisor-local replay/simulation** of the UseAgent
control-plane lifecycle. It is not a live Antigravity, Claude, or vendor Codex
run, and it does not modify the osblog registry or deploy anything.

Đây là **replay/mô phỏng cục bộ có giới hạn** của lifecycle control-plane
UseAgent. Đây không phải lần chạy live của Antigravity, Claude hay vendor Codex,
không sửa registry của osblog và không deploy.

## What it proves / Điều được chứng minh

The fixture invokes the real target-local CLI in an isolated temporary root and
asserts the complete sequence:

1. initialize the control-plane layout and minimum knowledge ledger;
2. validate the project;
3. create a dependency-aware task/DAG item;
4. run a bounded supervisor cycle that dispatches a mailbox assignment;
5. pull/claim the assignment as the recorded Codex fixture worker;
6. write a proof artifact and submit a worker report plus completion log;
7. add supervisor review evidence and pass the explicit `needs_review → done`
   gate; and
8. create a complete checkpoint with exactly one next action.

Fixture gọi CLI thật của target trong một root tạm biệt lập và kiểm tra toàn bộ
chuỗi như trên. `simulation=true` trong output là nhãn bắt buộc: các bước worker
được replay để kiểm thử control-plane, không được trình bày thành vendor activity.

## Reproduce / Tái lập

From `F:\dev\test-useagent`:

```powershell
python tests/useagent-conformance/replay.py
```

Expected output contains `REPLAY_PASS`, a temporary task/report/checkpoint path,
`mode=supervisor-local-replay`, `simulation=true`, and `cleanup=true`. The
temporary root is deleted automatically; the target `work/registry.json` is
never used by the fixture.

Output dự kiến có `REPLAY_PASS`, đường dẫn task/report/checkpoint tạm,
`mode=supervisor-local-replay`, `simulation=true`, và `cleanup=true`. Root tạm
được xóa tự động; fixture không dùng `work/registry.json` của target.

## Attribution and fallback / Ghi nhận và fallback

Claude remains the preferred owner of the original conformance assignment when
its client becomes callable. The original manual assignment and outbox history
are preserved as UA-0006. A Codex fallback attempt was preserved as UA-0015
runtime-failure evidence and cancelled after no fixture/report progress. This
recovery is supervisor-local; it must not be attributed to Claude or called a
live Codex vendor execution.

Claude vẫn là owner ưu tiên của assignment conformance gốc khi client của Claude
có thể gọi được. Assignment manual và outbox gốc được giữ lại dưới UA-0006.
Lần fallback Codex UA-0015 được ghi nhận là runtime failure và hủy sau khi không
có fixture/report. Bản recovery này là supervisor-local; không được ghi nhận là
Claude hoặc live Codex vendor execution.

## QA boundary / Ranh giới QA

`python tools/useagent.py validate` is the control-plane QA signal. Product
tests, browser recording, Vite build, accessibility checks, and performance
checks remain separate gates after application code exists. Any GIF/MP4 made
from this process must carry the same replay/simulation label unless it is a
genuine screen recording.
