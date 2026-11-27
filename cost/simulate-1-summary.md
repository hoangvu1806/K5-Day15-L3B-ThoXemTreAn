# Tóm tắt mô phỏng simulate-1@20261127-232426

Do `python run.py simulate` sinh ra — không sửa tay. Chép bảng sang `cost/cost-estimate.md`.

| Persona | Số phiên mô phỏng | Lượt hỏi / phiên | Token vào / phiên | Token ra / phiên | Gọi model / phiên | Gọi công cụ / phiên |
|---|---:|---:|---:|---:|---:|---:|
| dung_it | 18 | 3 | 13208 | 1321 | 6.9 | 5.7 |
| dung_vua | 25 | 3 | 14394 | 1441 | 7.3 | 5.8 |
| dung_nhieu | 7 | 3 | 12495 | 1350 | 6.7 | 5.1 |

Tỉ lệ đạt dùng để tính: 22/24 (92%) — lượt run-3@20261127-232145

- Tỉ lệ đạt lấy từ lượt nhóm chọn: eval/run-3.csv (--rate-from).

| Model (giá) | Chi phí / phiên | Chi phí / task thành công | Chi phí / câu hỏi đạt | Chi phí / tháng — thấp (500 người) | Chi phí / tháng — cơ sở (2.000 người) | Chi phí / tháng — cao (10.000 người) | Chi phí / người / tháng (cơ sở) |
|---|---:|---:|---:|---:|---:|---:|---:|
| openai/gpt-6-luna (vào 0.1 · ra 0.5 $/1M) | $0.0021 | $0.0023 | $0.00075 | $34.24 | $136.97 | $684.86 | $0.0685 |
| anthropic/claude-sonnet-5.5 (vào 2.0 · ra 10.0 $/1M) | $0.0413 | $0.0450 | $0.0150 | $684.86 | $2,739.43 | $13,697.17 | $1.37 |

- Chi phí / task thành công = chi phí / phiên ÷ tỉ lệ đạt. Chi phí / câu hỏi đạt = chi phí / phiên ÷ số lượt hỏi trung bình mỗi phiên (3.0) ÷ tỉ lệ đạt — tỉ lệ đạt đo theo từng câu thử.
- Token đo trên model: openai/gpt-6-luna. Giá tính theo từng model trong bảng — model khác bộ tách token thì số token thật có thể lệch; ghi rõ "đo trên model X, tính giá model Y" trong cost/cost-estimate.md.
- Phiên lỗi (không tính vào trung bình): 0/50.
