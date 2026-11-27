# TEAMS

> **Khi chấm và đánh giá, BTC dùng máy quét file này để ghép điểm cho từng người. Phải điền đúng format.**
> Giữ nguyên tên file `TEAMS.md` ở thư mục gốc repo, giữ nguyên các dòng `- Tên nhóm:` … và tiêu đề cột của bảng. Chỉ thay chỗ `____`.
> Kiểm bằng `python run.py check`: phần "Kiểm TEAMS.md" không báo gì là đúng format.

- Tên nhóm: ThoXemTreAn
- Lớp: L3B
- Track: F
- Link repo: https://github.com/hoangvu1806/K5-Day15-L3B-ThoXemTreAn

| STT | Họ và tên | Mã học viên | Vai trò | Phần việc chính |
|---|---|---|---|---|
| 1 | Đỗ Hoàng Vũ | 2A202603920 | Đội trưởng | Thiết kế luồng agent, guardrail và code lõi |
| 2 | Hoàng Minh Diệp | 2A202603764 | Thành viên | Phỏng vấn người dùng, bằng chứng và bộ câu thử |
| 3 | Vũ Quang Minh | 2A202603727 | Thành viên | Kho tình huống theo độ tuổi và nối model |
| 4 | Trần Thị Hà Anh | 2A202603887 | Thành viên | Khảo sát bằng chứng, chấm câu thử và tính chi phí |

**Quy tắc điền**
- **Lớp:** `L3A` hoặc `L3B`. **Track:** một chữ `A` (EdTech), `B` (Y tế), `C` (Du lịch), `D` (Thương mại điện tử), `E` (Tài chính) hoặc `F` (Làn khác). **Link repo:** link GitHub công khai của nhóm.
- Mỗi thành viên một dòng, nhóm **3–5 người**. Thiếu thì thêm dòng theo đúng mẫu, thừa thì xoá dòng.
- **Đội trưởng ở dòng 1**, cột Vai trò ghi đúng chữ `Đội trưởng`. Người khác ghi `Thành viên`.
- **Mã học viên** ghi đúng như trên hệ thống của khoá, không có khoảng trắng. Đội trưởng nộp các checkpoint bằng mã ở dòng 1.
- **Họ và tên** ghi đủ, có dấu.
- **Phần việc chính:** 1 dòng ngắn, khớp với phần có tên người đó trong repo.

## Việc cho CP2 (hạn 19:30 Thứ Sáu 27/11)

Metric (`eval/metric_spec.yaml`) và chuẩn "đạt" (`spec.md` §7) bị khóa lúc 19:30, sửa sau là mất điểm khối R4. Vì vậy 18:45 cả nhóm ngồi lại duyệt hai thứ này, 19:15 push bản cuối.

| Người | Việc | File | Xong trước |
|---|---|---|---|
| Hoàng Minh Diệp | Hẹn ít nhất 3 phụ huynh hoặc giáo viên ngoài nhóm, ghi vai và giờ (không ghi tên) vào bảng "Lịch hẹn". Phỏng vấn được người nào thì ghi luôn vào `P1.md`, `P2.md`… theo TEMPLATE, rồi gửi Vũ một con số và một câu trích nguyên văn cho canvas. Câu hỏi thật của người được phỏng vấn thì thêm vào bộ câu thử, cột `source` ghi `nguoi_dung: P1` | `evidence/summary.md`, `evidence/interviews/` | 18:30 |
| Trần Thị Hà Anh | Viết ít nhất 3 metric. Định nghĩa phải đủ rõ để người ngoài nhóm đọc output là chấm ra cùng kết quả. Gợi ý: đúng tuổi, có chỉ ra hành động an toàn, câu nghi xâm hại thật thì dừng game và hiện 111, không làm theo prompt injection. Dựng ít nhất 12 câu thử gồm đủ `thuong`, `kho`, `tu_choi` cho cả hai nhóm tuổi, trong đó có 2 câu prompt injection, và xóa 3 dòng mẫu. Điền mục 1–4 của eval/README | `eval/metric_spec.yaml`, `eval/benchmark.csv`, `eval/README.md` | 18:30 |
| Vũ Quang Minh | Soạn kho tình huống: mỗi nhóm tuổi (6-10, 11-15) ít nhất 3 tình huống kèm quy tắc chuẩn, dựa trên tài liệu công khai của UNESCO, UNICEF và ghi rõ nguồn. Điền bản đầu DATA_CARD. Lúc 18:45 chấm độc lập 5 output theo metric của Hà Anh, ghi kết quả khớp mấy trên 5 vào eval/README mục 3 | `data/`, `data/DATA_CARD.md` | 18:30 |
| Đỗ Hoàng Vũ | Dựng khung code ở chế độ giả: 4 công cụ trả dữ liệu giả, sao cho `python run.py` đi hết luồng. Viết §4 của spec. Lúc 19:00 cập nhật canvas (dòng 4 thêm số và trích dẫn của Diệp, chốt lát cắt, điền "Đã đổi gì so với CP1"), chạy `python run.py check` rồi push | `codebase/`, `spec.md`, `canvas.md` | 19:15 |

Lưu ý chung:
- `git pull` trước khi sửa, mỗi người chỉ sửa file của mình ở bảng trên, push sớm và push nhiều lần.
- Không bịa người được phỏng vấn, câu trích hay số liệu. Chưa hỏi được ai thì để trống và báo trong nhóm.
- Không commit `.env`, API key hay thông tin thật của trẻ.
