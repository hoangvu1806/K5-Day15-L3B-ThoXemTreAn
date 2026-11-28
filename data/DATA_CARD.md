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
| Số dòng / số đoạn | 12 quy tắc (R01–R12) · 5 nguồn (bỏ `SRC-UNICEF-ONLINE` ngày 28/11) |
| Phiên bản / ngày lấy | v0.1 · 27/11/2026 |
| Nhãn | Nhóm tự viết, dựa trên tài liệu thật. Không phải `synthetic` sinh tự động |
| Giới hạn | **Chưa kiểm link và số mục của từng nguồn** (trường `trang_thai`). `SRC-UNICEF-ONLINE` đã bỏ ngày 28/11 vì chưa tìm được tài liệu cụ thể; R08 (an toàn trên mạng) nay chỉ dựa trên UNESCO 4.3, còn 5 nguồn · Tài liệu gốc là của nước ngoài, cách nói đã được chỉnh cho tiếng Việt nhưng chưa có chuyên gia hay giáo viên duyệt · Chỉ phủ 6 chủ đề trong lát cắt |

## Dataset 2 · Kho tình huống (`data/scenarios.json`)

| | |
|---|---|
| Dùng để làm gì | Nguồn cho công cụ `get_scenario(age_group, topic)`: tình huống đưa cho trẻ trong game, kèm `y_can_co` (ý câu trả lời tốt cần có) để `evaluate_child_response` chấm |
| Từ đâu | Nhóm tự viết. 3 tình huống (S6-04, S6-05, S6-06) phỏng theo chuyện người lớn kể trong khảo sát (phiếu 17, 10, 18, `evidence/survey/results.csv`). Tên nhân vật và chi tiết là nhóm đặt |
| Xử lý những bước gì | Mỗi tình huống gắn nhóm tuổi, chủ đề (`vung_rieng_tu`, `bi_mat`, `nguoi_la`, `ranh_gioi_nguoi_than`, `nguoi_lon_tin_cay`, `an_toan_mang`) và mã quy tắc ở Dataset 1 · Lời kể không tả chi tiết hành vi xâm hại, dùng tên đúng bộ phận cơ thể |
| Số dòng / số đoạn | 11 tình huống: 6-10 tuổi có 6 · 11-15 tuổi có 5 |
| Trường cho giao diện game (v0.2) | `type` (`mot_cau`), `genders`, `choices` (2–3 nút đáp án, mỗi nút có `correct` và `feedback` là lời phản hồi dự phòng khi model lỗi hoặc chạy chế độ giả), `rule_card` (câu in trên thẻ quy tắc), `scene` (`bg`, `npc`: tên ảnh trong `frontend/public/assets/`; `card`: khung thẻ `body` / `secret` / `stranger` / `online`) |
| Phiên bản / ngày lấy | v0.1 · 27/11/2026 · v0.2 (thêm trường game) 27/11/2026: **`choices`, `feedback`, `rule_card` do Claude soạn, chờ Diệp duyệt** |
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

## Sprint 3 (28/11/2026) · thay đổi dữ liệu

| | |
|---|---|
| `data/scenarios.json` v0.3 | Lời kể 11 màn viết lại theo `docs/kich-ban-giong-doc.md` mục 2 (bản đã thu âm), tên nhân vật chính là ô `{ten}` (Bin/Na, Khôi/Mai) · bỏ `choices` và `feedback` (không còn nút đáp án) · `genders` chỉ còn `nam`, `nu` · thêm `location` (địa điểm trên bản đồ / app trên điện thoại), `tier` (bậc khó 1–5), `hints` (mã câu gợi ý), `key_actions[].code` (A/B/C hoặc mã riêng), `chain`/`chain_step` (chuỗi Khoa), `duyet` · `rule_card` đổi xưng hô sang "cậu/bạn" theo thẻ quy tắc mới. `key_actions`, `rule_ids` của 11 màn cũ giữ nguyên |
| Màn mới, **chưa duyệt** | 7 màn `duyet: false` do Claude soạn nháp: H6-01, H6-02, H11-01 (hội thoại với người lạ, chế độ kịch bản có sẵn, câu đầu lấy từ câu mẫu đã nghe thử ở `kich-ban-giong-doc.md` mục 8), T6-01, T6-02 (bậc 4: phân biệt lần chạm bình thường, T6-01 căn cứ ngoại lệ trong R01), F6-01, F11-01 (bậc 5: giúp bạn). Trẻ không gặp các màn này cho tới khi Diệp duyệt và đổi `duyet` thành `true`. F11-01 (Vy bị dọa tung ảnh) phải đối chiếu tài liệu UNICEF trước |
| `data/guidelines.json` | Thêm `ten_the` (tên thẻ) và `the` (khung thẻ: body / secret / stranger / online); `loi_6_10`, `loi_11_15` đổi sang lời thẻ ở `kich-ban-giong-doc.md` mục 3 (xưng "cậu", "bạn"). `rule`, `source` không đổi |
| `data/lines.json` (mới) | Kho câu viết sẵn: câu an toàn (111, từ chối, dự phòng, thoát vai), chào, khen, động viên, nhận thẻ, kết phiên, câu theo buổi và tiến độ, mảnh "đã làm / còn thiếu", câu gợi ý. Dựng tự động từ `data/voice_lines.json` (đã duyệt, đã thu âm), nên chữ và giọng luôn khớp. Nhóm `safe_*` không AI nào sinh lại |
| `data/tactics.json` (mới) | 8 thẻ chiêu theo `kich-ban-giong-doc.md` mục 4: tên, cách nhận ra, một câu đáp lại, nhóm tuổi; `keywords` cho bước so khớp đầu của thám tử nhận chiêu. Mặt sau thẻ không tả cách dụ. Nội dung thẻ chiêu đánh dấu *(mới)* trong kịch bản, Diệp đối chiếu tài liệu gốc |
| Dữ liệu trên máy của trẻ | Hồ sơ (nhóm tuổi, giới tính), mã màn đã xong, thẻ đã nhận, vai người lớn trong "Bàn tay tin cậy" lưu trong `localStorage` của trình duyệt. Không có tên thật |
| Tài khoản người lớn (SQLite, `codebase/auth.py`) | Tên đăng nhập, mật khẩu băm scrypt, thời điểm đồng ý; bản băm token đăng nhập; tiến độ dạng mã (màn đã chơi, mã thẻ quy tắc, mã thẻ chiêu, vai trong Bàn tay tin cậy). Không lưu câu trả lời, giới tính, bản nháp, email, tên thật |
| Giọng nói | Lúc trả lời, nút mic và ô gõ hiện cùng lúc; mic bấm để bật, bấm lần nữa hoặc ngừng nói là tắt. Nhận giọng dùng Web Speech API của trình duyệt: trên Chrome âm thanh được gửi tới máy chủ Google để chuyển thành chữ. Game không lưu âm thanh; server chỉ nhận chữ trẻ đã xác nhận. Đọc to: câu cố định là file đã thu âm, lời AI viết đọc qua OpenRouter (`google/gemini-3.8-flash-lite-tts`, `data/voices.json`), chỉ đọc chữ do game tạo ra |
| `data/topics.json` (Góc Tò Mò) | 12 chủ đề hỏi đáp giáo dục giới tính (tên bộ phận, khác biệt nam nữ, em bé từ đâu, đồng thuận, vệ sinh, cảm xúc và ranh giới, dậy thì chung / nữ / nam, tình bạn, hình ảnh cơ thể, an toàn ảnh trên mạng), mỗi chủ đề có ý chính tách theo 6-10 và 11-15. Soạn từ UNESCO 2018, cả 12 đang đánh `duyet: true` trong file. Báo cáo cho phụ huynh chỉ ghi chủ đề, không lưu nguyên văn câu trẻ hỏi |
