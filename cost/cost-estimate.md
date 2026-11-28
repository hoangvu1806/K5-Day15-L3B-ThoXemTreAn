# Chi phí khi dùng thật

> Điền ở guide bước 4.2, nộp ở CP4 14:30 Thứ Bảy 28/11. Ôn lại: ngày 13, ngày 1, ngày 14 · lab ngày 13, lab ngày 14. Chấm ở rubric R6.
> Số **không điền tay**: điền `cost/personas.yaml` → `python run.py simulate` → chép bảng trong `cost/simulate-N-summary.md` vào đây.
> Lúc build dùng gói miễn phí vẫn tính theo **giá gói trả phí** — đây là chi phí cho lúc đưa vào dùng thật.

## 1. Đầu vào

- **Persona** (`cost/personas.yaml`): 3 kiểu — `dung_it` 33% · 3 phiên/tháng, `dung_vua` 56% · 6 phiên/tháng, `dung_nhieu` 11% · 280 phiên/tháng (một lớp học); mỗi phiên 3 lượt hỏi. Nguồn: khảo sát 20 phiếu, câu 7 (`evidence/survey/results.csv`); số phiên và số lượt cụ thể là *(tự ước tính)*, ghi từng dòng trong `personas.yaml`
- **Số người dùng thật** 3 kịch bản: thấp 500 · cơ sở 2.000 · cao 10.000 phụ huynh hoặc giáo viên. Nguồn: *(tự ước tính)*, mốc so sánh 19,08 triệu học sinh phổ thông năm học 2025-2026 (Bộ GD&ĐT qua https://giaoduc.net.vn/ban-in/post262421.gd, xem 28/11/2026)
- **Giá** 2 mức model (USD / 1 triệu token, xem 28/11/2026): `openai/gpt-6-luna` vào 0,10 · ra 0,50 (https://openrouter.ai/openai/gpt-6-luna; trang này có hiện thêm mức 0,05 / 0,25, có vẻ là giá batch nên không dùng) · `anthropic/claude-sonnet-5.5` vào 2,00 · ra 10,00 (https://openrouter.ai/anthropic/claude-sonnet-5.5). Chưa đối chiếu với `further-reading/model-prices.md` của repo đề
- **Tỉ lệ đạt** dùng để tính: 22/24 (92%) — lượt `run-3` (lượt 2), điểm do Claude Code chấm nháp, Trần Thị Hà Anh đã kiểm tay
- Luồng đo: `simulate-1` chạy trên luồng trước Sprint 3 (một agent). Luồng đang chạy thêm vai Giám khảo; `run-4` đo khoảng 2,7 lần gọi model và ~4.100 token vào mỗi câu (`eval/README.md` mục 5), gần với ~4.400–4.800 token vào mỗi lượt của `simulate-1`. Chưa có file `simulate-N` nào đo luồng mới, nên số dưới đây vẫn là của `simulate-1`. Góc Tò Mò và TTS chưa nằm trong mô phỏng
- Đo token trên model `openai/gpt-6-luna`, tính giá model `openai/gpt-6-luna` và `anthropic/claude-sonnet-5.5` (Claude tách token khác nên số token thật có thể lệch)

## 2. Kết quả mô phỏng

Lượt mô phỏng: `cost/simulate-1.csv` · run ID `simulate-1@20261127-232426` · 50 phiên (0 phiên lỗi) · seed 42

| Persona | Số phiên mô phỏng | Lượt hỏi / phiên | Token vào / phiên | Token ra / phiên | Gọi model / phiên | Gọi công cụ / phiên |
|---|---:|---:|---:|---:|---:|---:|
| dung_it | 18 | 3 | 13208 | 1321 | 6.9 | 5.7 |
| dung_vua | 25 | 3 | 14394 | 1441 | 7.3 | 5.8 |
| dung_nhieu | 7 | 3 | 12495 | 1350 | 6.7 | 5.1 |

| Model (giá) | Chi phí / phiên | Chi phí / task thành công | Chi phí / câu hỏi đạt | Chi phí / tháng — thấp (500 người) | Chi phí / tháng — cơ sở (2.000 người) | Chi phí / tháng — cao (10.000 người) | Chi phí / người / tháng (cơ sở) |
|---|---:|---:|---:|---:|---:|---:|---:|
| openai/gpt-6-luna (vào 0.1 · ra 0.5 $/1M) | $0.0021 | $0.0023 | $0.00075 | $34.24 | $136.97 | $684.86 | $0.0685 |
| anthropic/claude-sonnet-5.5 (vào 2.0 · ra 10.0 $/1M) | $0.0413 | $0.0450 | $0.0150 | $684.86 | $2,739.43 | $13,697.17 | $1.37 |

Chi phí / task thành công = chi phí trung bình mỗi phiên ÷ tỉ lệ đạt — **không coi như đạt 100%**.

## 3. So với impact

- Impact / người / tháng: `spec.md` §2 lấy tròn 3 lần × 10 phút = 30 phút *(tự ước tính từ P1, P3)*. Từ phỏng vấn, người lớn gặp chuyện này khoảng 2–4 lần/tháng, mỗi lần 5–15 phút (P1: 3–4 lần, ~15 phút; P3: 2–3 lần, 5–10 phút; `evidence/summary.md`), tức khoảng 10–60 phút/người/tháng
- Chi phí / người / tháng (cơ sở, model `openai/gpt-6-luna`): $0,0685 · với `claude-sonnet-5.5`: $1,37. Một lớp học (`dung_nhieu`, 280 phiên/tháng) tốn khoảng $0,59/tháng với gpt-6-luna
- **Kết luận một dòng — đáng làm không:** đáng, với model rẻ: chưa tới 0,07 USD mỗi người mỗi tháng, ở quy mô cơ sở 2.000 người khoảng 137 USD/tháng, rất nhỏ so với 10–60 phút người lớn tiết kiệm mỗi tháng. Model mạnh đắt gấp 20 lần, chỉ đáng dùng nếu lượt chấm với model rẻ không đạt chuẩn. Chi phí lớn nhất khi dùng thật không phải model mà là giờ công người duyệt màn mới và bản nháp.

## 4. *(Muốn sâu hơn, không bắt buộc)*

- Bảng độ nhạy: model rẻ hơn · cache · cắt ngữ cảnh · giới hạn bước — mỗi cần gạt đổi chi phí bao nhiêu
- Chi phí ngoài model: hosting, lưu trữ, giờ công người duyệt
- Quy mô nào thì bài toán còn đáng làm
