# Dàn slide → lấy số từ file nào

> Làm ở guide bước 5.1. Luật: **không có bằng chứng thì không có slide** — mỗi trang ≥1 con số / trích dẫn có nguồn / kết quả đo.
> Xuất PDF thành `demo-slides.pdf` ở thư mục gốc repo, nộp tại CP4 14:30 Thứ Bảy 28/11. Nộp PDF, không nộp link.

| # | Trang | Có gì | Số lấy từ | Xong |
|---|---|---|---|---|
| 1 | Người dùng & pain | Phụ huynh, giáo viên trẻ 6-15 tuổi muốn biết trẻ có phản xạ đúng không. Khảo sát 20 phiếu: 18/20 (90%) ngại hoặc không biết nói sao, hoặc không chắc trẻ sẽ kể khi bị dặn giữ bí mật; 12/20 không biết dùng từ nào cho hợp tuổi. Trích P2: "bé cx hiểu sơ sơ thôi, kiểu ba mẹ dặn thì nghe theo" | `evidence/summary.md` | ☐ |
| 2 | Vì sao chọn bài này | Bảng impact rút gọn + hướng bị loại | `spec.md` §2 | ☐ |
| 3 | Giải pháp | Lát cắt một câu (§4) · sơ đồ kiến trúc `docs/architecture/growsafe-architecture.png` · AI (Giám khảo) chấm ngầm, Tin nhận xét gợi mở, trẻ "Trả lời lại" hoặc "Đi tiếp"; thêm Góc Tò Mò hỏi đáp đúng tuổi; người lớn đăng nhập trước khi chơi phần có AI; nghi xâm hại thật thì code dừng game, hiện 111, không gọi model; bản nháp cho phụ huynh chỉ ở trạng thái chờ duyệt. Ảnh chụp giao diện game | `spec.md` §4 | ☐ |
| 4 | Demo live | Thường: https://canthansaulungkiabeiu.site/, màn "Người lạ ở cổng công viên", trẻ gõ/nói "con không đi theo chú, chạy vào chỗ đông người" → Tin nhận xét, Đi tiếp → cuối phiên thẻ quy tắc + bản nháp Góc phụ huynh. Khó: trả lời thiếu → Tin gợi mở, Trả lời lại; gõ câu kể chuyện thật (kiểu B10) → dừng game, hiện 111. Mạng hỏng → video dự phòng | `eval/benchmark.csv` | ☐ |
| 5 | **Đánh giá thế nào** | 24 câu thử (9/24 từ người dùng), 6 metric. Lượt 1 `run-2` 21/24 (88%, chưa đạt vì tu_choi 7/8) → sửa prompt cho câu trẻ hỏi lại → lượt 2 `run-3` 22/24 (92%, đạt). Nhóm lỗi đã sửa 0/2 → 2/2; B09, B21 tệ đi. Sau CP4 thêm Giám khảo → `run-4` 20/24 (83%, vẫn đạt, tu_choi 8/8): sửa B09, B21 nhưng trượt mới B06, B18, B20. Claude Code chấm nháp, Trần Thị Hà Anh đã kiểm tay | `eval/README.md`, `eval/report.md` | ☐ |
| 6 | **Chi phí khi dùng thật** | 50 phiên mô phỏng. Chi phí / task thành công $0,0023 (gpt-6-luna) · $0,045 (claude-sonnet-5.5). Một tháng: $34 / $137 / $685 cho 500 / 2.000 / 10.000 người (tự ước tính). Khoảng $0,07/người/tháng so với 10–60 phút người lớn mỗi tháng | `cost/cost-estimate.md` | ☐ |
| 7 | Kết luận | Đề xuất **iterate**: đạt chuẩn ở lượt 2 (92%) và chi phí rất thấp, nhưng chưa có người dùng chơi thử trọn phiên, còn 2 câu tệ đi | — | ☐ |
| 8 | Cảm ơn | Mã QR + tên miền chữ to `canthansaulungkiabeiu.site` để giám khảo quét chơi thử | — | ☐ |

**Trước khi lên:** tải repo về một máy khác (hoặc thư mục mới), chạy theo mục "Chạy trong 3 phút" của `README.md` · `.env` có trên máy demo, đã gọi thử 1 câu trong vòng 1 giờ trước giờ demo · video dự phòng mở được bằng cửa sổ ẩn danh · biết bản chạy thử sẽ làm gì với **1 câu thử lạ** của giám khảo.

Ai nói trang nào (mỗi người ≥1 phần):

| Trang | Người nói |
|---|---|
| | |
