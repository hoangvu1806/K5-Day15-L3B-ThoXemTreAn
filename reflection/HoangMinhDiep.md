# Reflection — Hoàng Minh Diệp

1. **Vai trò + phần mình làm (trỏ tới file / commit):**
   Thành viên, phụ trách bằng chứng người dùng, kho tình huống và đối chiếu bộ câu thử. Thu khảo sát 20 phiếu (`evidence/survey/`, commit `70a4cb2`) và phỏng vấn 3 phụ huynh qua Zalo/Messenger (`evidence/interviews/P1.md`–`P3.md`, `evidence/summary.md`, commit `a0ede5c`).
   Soạn kho quy tắc và tình huống theo 2 nhóm tuổi, ghi nguồn trong `data/DATA_CARD.md` (`data/guidelines.json`, `data/scenarios.json`, commit `71bec65`, `b849013`), kiểm tay 11/11 màn. Là người thứ hai chấm độc lập 5 output theo `eval/metric_spec.yaml`, khớp 5/5 (`eval/README.md` mục 3).
   Ở Sprint 3, chạy thử frontend và backend, đọc diff rồi commit phần code Claude Code viết (`72bca0c`), hoàn thiện `spec.md` §0–§7 (`3f00fd6`) và sửa trích dẫn nguồn (`f698db2`).

2. **AI hỗ trợ mình thế nào (việc gì, công cụ gì, chỗ nào phải sửa lại output AI):**
   Dùng Claude Code để soạn nháp đáp án, `feedback` và `rule_card` trong `data/scenarios.json`, 7 màn mới `duyet: false`, và viết câu thử B20–B24 từ lời thật trong P1, P2. Claude Code cũng chấm nháp cột `pass` của `run-4`.
   Mình không dùng AI để tạo người được phỏng vấn, câu trích hay câu trả lời khảo sát; các câu đó chép nguyên văn từ tin nhắn.
   Phần phải sửa: trích dẫn nguồn trong `codebase/tools.py` và một số quy tắc trong `data/guidelines.json` chưa khớp tài liệu gốc (commit `f698db2`, `b849013`). Bài học là output AI về nội dung giáo dục trẻ phải đối chiếu từng câu với tài liệu UNESCO, NSPCC, Council of Europe trước khi cho trẻ đọc.

3. **Một câu thử trượt của nhóm và mình học được gì từ nó:**
   B24 lấy từ phỏng vấn P1: hỏi "Ai được giúp con tắm?", bé trả lời "con gái thì mẹ tắm, em trai thì ba tắm". Expected là khen đúng, nhưng AI trượt ở `run-1` (kết luận "đúng một phần" và bắt bẻ chuyện giới tính người tắm) và lại trượt ở `run-4` ("còn thiếu một chút", còn khen trẻ "nói KHÔNG" dù trẻ không nói vậy).
   Mình học được rằng câu trẻ thật nói thường không khớp khuôn "nói không, rời đi, kể với người lớn" nên AI hay coi là thiếu, dù với phụ huynh đó là câu trả lời đúng. Khi viết expected và quy tắc chấm phải nói rõ thế nào là "đúng đủ", không thì AI sẽ chê nhầm trẻ đã làm đúng, đúng điều phụ huynh lo nhất.
   Câu này cũng cho thấy sửa prompt có thể làm một câu đạt rồi lại trượt (đạt ở `run-3`, trượt ở `run-4`), nên mỗi lần đổi prompt phải chạy lại cả bộ chứ không chỉ xem câu mình nhắm tới.
