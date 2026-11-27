# Khai báo dùng AI

README của nhóm có mục "Dùng AI vào việc gì" (2–3 dòng, bắt buộc). Ghi chi tiết vào bảng dưới đây.

> Luật của đề: dùng AI để làm bài thoải mái, nhưng **ai không giải thích được phần có tên mình thì phần đó nhận 0 điểm**. Khai thiếu không bị trừ; giấu mới bị.

| Việc | Công cụ AI | AI làm gì | Người kiểm/sửa gì | Ai phụ trách |
|---|---|---|---|---|
| Code bản chạy thử | Claude Code | Viết `codebase/game.py`, 4 endpoint trong `server.py`, toàn bộ giao diện `frontend/` | Đỗ Hoàng Vũ chạy thử game trên trình duyệt, đọc lại diff trước khi commit | Đỗ Hoàng Vũ |
| Prompt / thiết kế lời gọi mô hình | Claude Code | Viết prompt phản hồi nút đáp án và prompt soạn bản nháp cho phụ huynh (`codebase/game.py`); sửa `postcheck` để không chặn câu trấn an có phủ định | Đỗ Hoàng Vũ đọc output thật trong `traces/` | Đỗ Hoàng Vũ |
| Code Sprint 3 | Claude Code | Viết theo `docs/de-xuat-sprint-3.md`: vai Giám khảo, Gợi ý, Đạo diễn, Người lạ (kịch bản), thám tử nhận chiêu (`codebase/agent.py`, `game.py`, `lines.py`, `tts.py`, `server.py`); giao diện mới (Màn hình chính, bản đồ / điện thoại, mic, đọc to, Sổ tay, Bàn tay tin cậy, Cài đặt, khoá người lớn); dựng `data/lines.json`, `data/tactics.json` từ kịch bản đã thu âm; chạy `run-4` và `simulate` | Hoàng Minh Diệp chạy thử frontend và backend, đọc lại diff trước khi commit | Hoàng Minh Diệp |
| Soạn màn mới (bản nháp) | Claude Code | Soạn nháp 7 màn `duyet: false` (H6-01, H6-02, H11-01, T6-01, T6-02, F6-01, F11-01) | Trẻ chưa gặp. Hoàng Minh Diệp đối chiếu nguồn và duyệt trước khi đổi `duyet` thành `true` | Hoàng Minh Diệp |
| Đào data (viết script đếm, gợi ý nhãn) | | | Kiểm tay __ dòng, khớp __ | |
| Rà câu hỏi phỏng vấn / khảo sát | | Chỉ rà câu dẫn dắt | | |
| Viết câu thử (benchmark) | Claude Code | Viết B20–B24 từ lời thật trong `evidence/interviews/P1.md`, `P2.md` (input và expected) | Mỗi câu thử có `source`; B20–B24 chờ Hoàng Minh Diệp đối chiếu lại với file phỏng vấn | Hoàng Minh Diệp |
| Sinh data `synthetic` (nếu có) | | | Seed __ · kiểm tay __ dòng | |
| Chấm cột `pass` bằng LLM (nếu có) | Claude Code | Chấm nháp `pass` theo `eval/metric_spec.yaml`, ghi lý do vào `ghi_chu` (bắt đầu bằng "Claude chấm nháp") | Chờ Trần Thị Hà Anh kiểm tay từng câu; câu nào sửa điểm thì ghi vào `ghi_chu` | Trần Thị Hà Anh |
| Slide, văn bản | Claude Code | Soạn nháp spec §9, §10, `cost/cost-estimate.md`, `eval/report.md`, nội dung đáp án và thẻ quy tắc trong `data/scenarios.json` | Nhóm đọc lại; đáp án và thẻ quy tắc chờ Hoàng Minh Diệp duyệt | Cả nhóm |

**Không dùng AI để:** tạo người được phỏng vấn, trích dẫn, câu trả lời khảo sát; sửa kết quả các lượt đã chạy (`eval/run-*.csv`, `cost/simulate-*.csv`, `traces/`).
