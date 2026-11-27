# Dàn slide → lấy số từ file nào

> Làm ở guide bước 5.1. Luật: **không có bằng chứng thì không có slide** — mỗi trang ≥1 con số / trích dẫn có nguồn / kết quả đo.
> Xuất PDF thành `demo-slides.pdf` ở thư mục gốc repo, nộp tại CP4 14:30 Thứ Bảy 28/11. Nộp PDF, không nộp link.

| # | Trang | Có gì | Số lấy từ | Xong |
|---|---|---|---|---|
| 1 | Người dùng & pain | Phụ huynh, giáo viên trẻ 6-15 tuổi muốn biết trẻ có phản xạ đúng không. Khảo sát 20 phiếu: 18/20 (90%) ngại hoặc không biết nói sao, hoặc không chắc trẻ sẽ kể khi bị dặn giữ bí mật; 12/20 không biết dùng từ nào cho hợp tuổi. Trích P2: "bé cx hiểu sơ sơ thôi, kiểu ba mẹ dặn thì nghe theo" | `evidence/summary.md` | ☐ |
| 2 | Vì sao chọn bài này | Bảng impact rút gọn + hướng bị loại | `spec.md` §2 | ☐ |
| 3 | Giải pháp | Lát cắt một câu (§4) · sơ đồ kiến trúc `docs/architecture/growsafe-architecture.png` · AI tự chấm và giảng lại trong game; nghi xâm hại thật thì code dừng game, hiện 111, không gọi model; bản nháp cho phụ huynh chỉ ở trạng thái chờ duyệt. Ảnh chụp giao diện game | `spec.md` §4 | ☐ |
| 4 | Demo live | Thường: màn "Kẹo và bí mật", bấm đáp án đúng → thẻ quy tắc. Khó: tự gõ "con chạy" → AI hỏi lại; gõ câu kể chuyện thật (kiểu B10) → dừng game, hiện 111. Mạng hỏng → video dự phòng | `eval/benchmark.csv` | ☐ |
| 5 | **Đánh giá thế nào** | 24 câu thử (9/24 từ người dùng), 6 metric. Lượt 1 `run-2` 21/24 (88%, chưa đạt vì tu_choi 7/8) → sửa prompt cho câu trẻ hỏi lại → lượt 2 `run-3` 22/24 (92%, đạt). Nhóm lỗi đã sửa 0/2 → 2/2; B09, B21 tệ đi. Điểm chấm nháp, ghi rõ ai kiểm | `eval/README.md`, `eval/report.md` | ☐ |
| 6 | **Chi phí khi dùng thật** | 50 phiên mô phỏng. Chi phí / task thành công $0,0023 (gpt-6-luna) · $0,045 (claude-sonnet-5.5). Một tháng: $34 / $137 / $685 cho 500 / 2.000 / 10.000 người (tự ước tính). Khoảng $0,07/người/tháng so với 10–60 phút người lớn mỗi tháng | `cost/cost-estimate.md` | ☐ |
| 7 | Kết luận | Đề xuất **iterate**: đạt chuẩn ở lượt 2 (92%) và chi phí rất thấp, nhưng điểm mới là chấm nháp, chưa có người dùng chơi thử trọn phiên, còn 2 câu tệ đi | — | ☐ |
| 8 | Nếu có thêm 1 tuần | Chạy mỗi lượt 3 lần để đo dao động · cho bước chấm trả kết luận có cấu trúc để AI không lệch expected (B21, B24) · 2–3 phụ huynh chơi thử trọn phiên, chấm bản nháp · làm màn hội thoại với người lạ | `eval/report.md` mục 4 · `validation/log.md` | ☐ |

**Trước khi lên:** tải repo về một máy khác (hoặc thư mục mới), chạy theo mục "Chạy trong 3 phút" của `README.md` · `.env` có trên máy demo, đã gọi thử 1 câu trong vòng 1 giờ trước giờ demo · video dự phòng mở được bằng cửa sổ ẩn danh · biết bản chạy thử sẽ làm gì với **1 câu thử lạ** của giám khảo.

Ai nói trang nào (mỗi người ≥1 phần):

| Trang | Người nói |
|---|---|
| | |
