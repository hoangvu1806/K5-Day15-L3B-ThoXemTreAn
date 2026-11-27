# Data card — dữ liệu bản chạy thử dùng

> Điền ở guide bước 2.4 (bản đầu ở CP2, đủ ở CP3). Ôn lại: ngày 6 · lab ngày 6. Chấm ở rubric R4.
> Một trang. Mỗi dataset một mục. Dữ liệu chạy thử (bài mẫu, thông báo mẫu, đoạn transcript…) để trong thư mục `data/` này.
> Không commit nguyên tài liệu khoá, dữ liệu cá nhân thật hay nguyên file data BTC cấp — chỉ đoạn trích ngắn, bản viết lại, hoặc số đã tổng hợp.

**Bản đầu CP2 · 27/11/2026 · người phụ trách: Hoàng Minh Diệp.** Không có data BTC cấp. Không có dữ liệu nào của trẻ thật.

**Định dạng** (theo `codebase/tools.py`): cả hai file là danh sách JSON. Tình huống có `id, age_group, topic, situation, key_actions[{action, keywords}], source`. Quy tắc có `code, title, rule, keywords, age_groups, source`. Các trường tiếng Việt cũ vẫn giữ để người đọc (`tinh_huong`, `y_can_co`, `loi_6_10`…). `keywords` chỉ dùng để so khớp thô trong `evaluate_child_response`, không phải cách chấm chính.

## Dataset 1 · Quy tắc chuẩn (`data/guidelines.json`)

| | |
|---|---|
| Dùng để làm gì | Nguồn cho công cụ `search_safety_guideline(age_group, query)`, là "tài liệu chuẩn" để chấm phản xạ của trẻ. Cũng là căn cứ để viết `expected` trong `eval/benchmark.csv` |
| Từ đâu | Nhóm **viết lại ngắn** (không chép nguyên văn) theo tài liệu công khai: UNESCO *International technical guidance on sexuality education* (2018), Council of Europe *The Underwear Rule*, NSPCC *Talk PANTS*, Tổng đài 111. Mỗi quy tắc ghi mã nguồn trong trường `nguon` |
| Xử lý những bước gì | Chọn các ý về giữ an toàn cơ thể, bỏ nội dung ngoài lát cắt (sức khoẻ sinh sản, quan hệ tình dục) · viết lại thành 1 đoạn chuẩn và 2 lời nói theo tuổi (`loi_6_10` câu ≤25 từ, `loi_11_15`) · gắn 3 hành động chuẩn A/B/C khớp metric `chi_ra_hanh_dong_an_toan` |
| Số dòng / số đoạn | 12 quy tắc (R01–R12) · 6 nguồn |
| Phiên bản / ngày lấy | v0.1 · 27/11/2026 |
| Nhãn | Nhóm tự viết, dựa trên tài liệu thật. Không phải `synthetic` sinh tự động |
| Giới hạn | **Chưa kiểm link và số mục của từng nguồn** (trường `trang_thai`). `SRC-UNICEF-ONLINE` chưa tìm được tài liệu cụ thể, phải thay hoặc bỏ trước CP3 · Tài liệu gốc là của nước ngoài, cách nói đã được chỉnh cho tiếng Việt nhưng chưa có chuyên gia hay giáo viên duyệt · Chỉ phủ 6 chủ đề trong lát cắt |

## Dataset 2 · Kho tình huống (`data/scenarios.json`)

| | |
|---|---|
| Dùng để làm gì | Nguồn cho công cụ `get_scenario(age_group, topic)`: tình huống đưa cho trẻ trong game, kèm `y_can_co` (ý câu trả lời tốt cần có) để `evaluate_child_response` chấm |
| Từ đâu | Nhóm tự viết. 3 tình huống (S6-04, S6-05, S6-06) phỏng theo chuyện người lớn kể trong khảo sát (phiếu 17, 10, 18, `evidence/survey/results.csv`). Tên nhân vật và chi tiết là nhóm đặt |
| Xử lý những bước gì | Mỗi tình huống gắn nhóm tuổi, chủ đề (`vung_rieng_tu`, `bi_mat`, `nguoi_la`, `ranh_gioi_nguoi_than`, `nguoi_lon_tin_cay`, `an_toan_mang`) và mã quy tắc ở Dataset 1 · Lời kể không tả chi tiết hành vi xâm hại, dùng tên đúng bộ phận cơ thể |
| Số dòng / số đoạn | 11 tình huống: 6-10 tuổi có 6 · 11-15 tuổi có 5 |
| Phiên bản / ngày lấy | v0.1 · 27/11/2026 |
| Nhãn | Nhóm tự viết (giả định trong game). **Không phải bằng chứng pain** |
| Giới hạn | Bản nháp do Claude (trợ lý code) soạn, **Diệp duyệt: đã kiểm tay 11/11** · Chưa cho trẻ hay giáo viên đọc thử giọng văn · Lệch về tình huống cá nhân, ít tình huống ở trường · Benchmark B01–B04, B06–B08 dùng tình huống gần giống S6-01…S11-04, nên câu thử không độc lập hoàn toàn với kho |

## Dataset 3 · Kết quả khảo sát (`evidence/survey/results.csv`)

| | |
|---|---|
| Dùng để làm gì | Bằng chứng pain (`evidence/summary.md`) · chọn tình huống đời thường cho Dataset 2 · câu thử nguồn `nguoi_dung` · số lượt chơi cho persona chi phí |
| Từ đâu | Google Form ẩn danh của nhóm, gửi qua Zalo và Messenger, 17:40–18:30 27/11/2026 (`evidence/survey/questions.md`) |
| Xử lý những bước gì | Form không thu email · thêm cột `hop_le`, loại 1 phiếu đùa cợt · ẩn 1 câu trả lời phản cảm · đếm bằng `python evidence/survey/count.py` |
| Số dòng / số đoạn | 21 phiếu · hợp lệ 20 |
| Phiên bản / ngày lấy | 27/11/2026 18:30 |
| Nhãn | Thật |
| Giới hạn | 6/20 phiếu có trẻ dưới 6 tuổi · chỉ hỏi người lớn, chưa hỏi trẻ |
