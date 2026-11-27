# Kế hoạch build GrowSafe AI

Ba sprint chính, xong là xong toàn bộ dự án. Sprint 4 là bonus: đưa game lên mạng.
Mỗi việc có điều kiện "xong khi". Chưa đạt điều kiện thì chưa chuyển sang việc sau.

Tài liệu gốc: `spec.md` §4, `docs/game-flow.md`, `data/DATA_CARD.md`, `eval/metric_spec.yaml`.

## Hiện trạng lúc bắt đầu

| Phần | Đã có | Còn thiếu |
|---|---|---|
| Backend | Agent ADK + guardrail (precheck 111, chặn injection, che thông tin cá nhân, postcheck), `POST /api/chat`, `GET /api/drafts` | 4 endpoint của game, trạng thái phiên chơi |
| Dữ liệu | 11 màn (6 màn nhóm 6-10, 5 màn nhóm 11-15), 12 quy tắc chuẩn | `type`, `choices`, `genders`, `rule_card`, ảnh cho từng màn; chưa có màn hội thoại |
| Frontend | Next.js 16 + Tailwind 4, 69 assets (ảnh, âm thanh) trong `frontend/public/assets/` | Toàn bộ giao diện game; chưa có ảnh nhân vật bé trai |
| Eval | 19 câu thử, 6 metric, `run-1.csv` | Chấm cột `pass`, thêm câu cho đủ 20–30 câu (≥1/3 lấy từ người dùng), lượt cải tiến |
| Chi phí | `personas.yaml` có 3 persona | Số người dùng có nguồn, chạy mô phỏng |
| Tài liệu | spec §4, §7 | spec §0–§3, §5, §6, §8–§10, slide, video, kết quả chơi thử, reflection |

---

## Sprint 1 — Chơi trọn một màn

**Mục tiêu:** trẻ mở game, chọn tuổi, chơi xong một màn trên trình duyệt (bấm nút hoặc tự gõ), nhận phản hồi của AI, và nút "Con cần giúp" chạy đúng.

### Dữ liệu
- [x] Thêm vào 11 màn trong `data/scenarios.json`:
  - `type`: `mot_cau`
  - `genders`: `["nam", "nu", "khong_noi"]` (an toàn cơ thể, bí mật, an toàn mạng dùng chung cho cả hai giới)
  - `choices`: 2–3 đáp án, mỗi đáp án có `correct`
  - `rule_card`: một câu ngắn để in trên thẻ quy tắc
  - `scene`: `{"bg": "...", "npc": "..."}`, chọn trong `frontend/public/assets/`
- [x] Cập nhật `data/DATA_CARD.md` theo các trường mới. *(nội dung `choices`, `feedback`, `rule_card` chờ duyệt)*
- **Xong khi:** màn nào cũng đủ trường, ảnh nào được trỏ tới cũng có file thật.

### Backend
- [x] Lưu phiên trong bộ nhớ: nhóm tuổi, giới tính, chế độ hội thoại, màn đang chơi, số lần thử của màn đó, các màn đã chơi, kết quả theo chủ đề.
- [x] `POST /api/session`: nhận `age_group`, `gender` (không bắt buộc), `dialogue_mode`; trả `session_id` và màn đầu tiên đúng tuổi, đúng giới.
- [x] `POST /api/answer`:
  - có `choice_id` thì code chấm đúng/sai, AI chỉ viết lời phản hồi
  - có `text` thì đi qua precheck → che thông tin cá nhân → agent → postcheck
  - trả `feedback`, `result` (`dat` / `chua_dat` / `hoi_lai`), `attempts_left`, `rule_card` khi xong màn, `stopped` khi phải dừng game
  - mỗi màn tối đa 2 lần thử
- [x] `POST /api/help`: trả nội dung màn "Con cần giúp" (người lớn tin tưởng, Tổng đài 111) và đánh dấu phiên đã dừng.
- [x] Giữ nguyên `answer(text)` trong `codebase/agent.py` để `run.py eval` và `simulate` vẫn chạy được.
- **Xong khi:** gọi đủ 3 endpoint qua `http://127.0.0.1:6161/docs`, có một câu nghi xâm hại thật trả về `stopped`, và `python run.py eval --try` vẫn chạy.

### Frontend
- [x] `npm install`. Đọc tài liệu trong `node_modules/next/dist/docs/` trước khi viết code (Next 16 thay đổi nhiều).
- [x] Đặt URL của API trong biến môi trường (`NEXT_PUBLIC_API_URL`, mặc định `http://127.0.0.1:6161`).
- [x] Màn chọn thiết lập: nhóm tuổi (6-10 / 11-15), giới tính (Nam / Nữ / Không muốn nói), dòng ghi chú "không hỏi tên, không lưu thông tin".
- [x] Màn chơi: ảnh nền, NPC, nhân vật trẻ theo tuổi và giới (chọn Nam thì tạm dùng nhân vật trung tính), lời kể tình huống, nút đáp án, ô tự gõ.
- [x] Khung phản hồi: người dẫn truyện đổi biểu cảm theo `result` (vui / động viên / tò mò khi hỏi lại).
- [x] Nút "Con cần giúp" luôn hiện; màn 111 dùng tông màu dịu, không gây sợ.
- [x] Trạng thái đang tải và lỗi mạng: hiện câu nhẹ nhàng, cho thử lại.
- **Xong khi:** chơi hết một màn của mỗi nhóm tuổi trên trình duyệt, cả bằng nút và bằng chữ gõ.

### Eval
- [ ] Chấm cột `pass` của `eval/run-1.csv` theo `eval/metric_spec.yaml`, rồi chạy `python run.py score eval/run-1.csv`.
- [ ] Thêm câu thử để bộ câu có 20–30 câu, trong đó ≥1/3 câu có nguồn `nguoi_dung` (lấy từ phỏng vấn và khảo sát). Không xoá câu trượt, không sửa `expected`.
- [ ] Chạy `python run.py eval` trên bộ câu mới. Đây là **lượt 1 chính thức**. `run-1` giữ nguyên làm lượt chạy thử 19 câu, ghi rõ trong `eval/README.md`.
- [ ] Chấm lượt 1, gom lỗi thành nhóm có tên trong `eval/report.md` mục 1–2.
- **Xong khi:** `python run.py check` không còn cảnh báo, và lệnh `score` in ra % của lượt 1.

### Spec
- [ ] Viết §0–§3, §5, §6. Số nào không có nguồn thì ghi *(tự ước tính)*.
- [ ] Ghi changelog §10 cho mọi thay đổi trong sprint.

---

## Sprint 2 — Chơi trọn một phiên, đo và cải tiến

**Mục tiêu:** chơi liền một phiên 5 màn, người lớn đọc được bản nháp cuối phiên, có kết quả lượt 2 và chi phí khi dùng thật.

### Vòng chơi
- [x] Backend chọn màn tiếp theo: ưu tiên chủ đề trẻ còn yếu; code kiểm mã màn có thật, đúng tuổi, đúng giới, chưa chơi. Đủ 5 màn hoặc hết màn phù hợp thì kết phiên.
- [x] `POST /api/session/end`: gọi `draft_parent_teacher_note`, trả bản nháp trạng thái `cho_duyet` gồm con làm tốt gì, còn lúng túng ở đâu, một câu gợi ý để mở lời nói chuyện với con. Không có tên, không có giới tính.
- [x] Frontend: thanh tiến độ 5 nút, thẻ quy tắc mở khi xong màn, sao (đạt ngay lần đầu được nhiều sao hơn), huy hiệu, màn kết phiên.
- [x] "Góc phụ huynh": đọc bản nháp, ghi rõ "bản nháp, game không gửi đi đâu". Chỉ có nút sao chép, không có nút gửi.
- [x] Âm thanh: click, gửi/nhận tin, đúng, động viên, mở thẻ, kết phiên; có nút tắt tiếng.
- **Xong khi:** chơi liền 5 màn ở cả hai nhóm tuổi không lỗi, cuối phiên đọc được bản nháp.

### Eval: một lần cải tiến
- [x] Chọn nhóm lỗi đau nhất với người dùng trong lượt 1. Sửa nhắm vào nhóm đó (prompt, guardrail, công cụ), không so khớp nguyên văn câu thử.
- [x] *(điểm là bản chấm nháp của Claude, chờ người kiểm)* Chạy lượt 2 trên cùng bộ câu, chấm, điền `eval/report.md` mục 3–4: nhóm lỗi trước → sau, tổng % trước → sau, câu nào tệ đi.
- [x] Điền `spec.md` §7 phần kết quả.
- **Xong khi:** report có đủ số của hai lượt và so sánh với chuẩn "đạt".

### Chi phí
- [x] Số người dùng 3 kịch bản (thấp / cơ sở / cao) trong `cost/personas.yaml` có nguồn hoặc ghi *(tự ước tính)*; giá của ≥2 model, có link và ngày xem.
- [x] `python run.py simulate` (≥50 phiên), lấy tỉ lệ đạt từ lượt 2.
- [x] Điền `cost/cost-estimate.md` và spec §8: chi phí / task thành công, chi phí / tháng, so với impact.

### Chơi thử với người dùng
- [ ] 2–3 phụ huynh hoặc giáo viên ngoài nhóm, mỗi người ~10 phút. Ghi `validation/log.md` theo vai, không ghi tên.
- [ ] Sửa lỗi mức "cao" tìm được.

### Hoàn thiện tài liệu
- [x] Spec §9 (dữ liệu, điều AI không được làm, ai có thể bị hại) và §10 (phân công, dùng AI vào việc gì).
- [x] README: model đang dùng, bảng phần nào thật / giả, cách chạy cả backend lẫn frontend.
- [ ] *(đã điền dàn ý có số trong `slides/outline.md`, chưa dựng PDF và video)* Slide theo `slides/outline.md`, xuất `demo-slides.pdf`. Quay video demo: một màn thường, một màn khó, nút "Con cần giúp".
- [ ] Chạy thử từ một bản clone sạch theo README.

---

## Sprint 3 — Màn hội thoại và hoàn thiện

**Mục tiêu:** có loại màn thứ hai (hội thoại với người lạ, kịch bản có sẵn), game chạy mượt, tài liệu đóng lại.

### Màn hội thoại, chế độ kịch bản có sẵn
- [x] *(bản nháp H6-01, H6-02, H11-01, chờ Diệp duyệt)* Soạn ≥1 màn `hoi_thoai` cho mỗi nhóm tuổi theo định dạng trong `docs/game-flow.md`: `persona`, `allowed_tactics`, `max_turns: 3`, `dialogue` chia nhánh. Nhóm 6-10 chỉ dùng màn quà, bí mật, rủ đi theo; màn trên mạng chỉ dành cho 11-15.
- [x] Backend: AI xếp câu của trẻ vào nhánh `tu_choi` / `luong_lu` / `dong_y`, lấy câu tiếp theo của nhánh đó. `tu_choi` thì thắng màn; `dong_y` thì người lạ dừng ngay, người dẫn truyện giảng lại.
- [x] Thoát vai ngay khi trẻ kể chuyện thật, gõ "dừng", bấm "Con cần giúp" hoặc cố kéo người lạ ra khỏi kịch bản.
- [x] Frontend: khung chat có nhãn "Người lạ trong trò chơi", người dẫn truyện luôn đứng cạnh, cuối màn giảng lại chiêu người lạ vừa dùng.
- **Xong khi:** chơi được cả ba nhánh của mỗi màn hội thoại, và câu nghi xâm hại thật giữa hội thoại vẫn dừng game.

### Hoàn thiện game
- [x] Ảnh nhân vật bé trai (`kid_610_boy_*`, `kid_1115_boy_*`), thay cho nhân vật trung tính khi chọn Nam.
- [ ] Giao diện dùng được trên máy tính bảng và điện thoại; nút đủ to cho trẻ 6 tuổi; chữ dễ đọc.
- [x] Tải trước ảnh của màn tiếp theo; xử lý mất mạng giữa phiên.
- [ ] Rà lời trên giao diện: đúng tuổi, không dọa, không đổi lời dặn theo giới tính.

### Đóng dự án
- [x] Ghi changelog §10 cho mọi thay đổi của sprint.
- [ ] Mỗi thành viên viết `reflection/<ten>.md`.
- [ ] Hoàn thiện `docs/ai-usage.md`, README (link video), cập nhật slide và video nếu game đổi nhiều.
- [ ] Ghi vào `eval/report.md` mục 4 những việc làm tiếp, trong đó có chế độ AI đóng vai người lạ: chưa làm vì cần đủ 9 lớp guardrail trong `docs/game-flow.md` và một bộ câu tấn công riêng cho vai này.

---

## Sprint 4 (bonus) — Deployment

**Mục tiêu:** phụ huynh hoặc giáo viên mở một đường link là chơi được, không cần cài gì.

### Đóng gói
- [ ] Backend: `Dockerfile` (Python 3.11, cài `requirements.txt`, chạy `uvicorn server:app --app-dir codebase --host 0.0.0.0 --port $PORT`).
- [ ] Frontend: `npm run build` chạy sạch, không lỗi lint.
- [ ] `.env.example` liệt kê đủ biến cho cả hai phía; không có khoá API nào trong repo hoặc trong bundle của frontend.

### Đưa lên mạng
- [ ] Frontend lên Vercel (hoặc tương đương), `NEXT_PUBLIC_API_URL` trỏ về backend.
- [ ] Backend lên một dịch vụ chạy container (Render, Railway, Fly.io…), khoá model đặt trong biến môi trường của dịch vụ. Chạy **một instance** vì phiên chơi đang nằm trong bộ nhớ.
- [ ] CORS chỉ cho phép domain của frontend, bỏ `allow_origins=["*"]`.
- [ ] `GET /health` dùng làm health check của dịch vụ.

### An toàn khi mở công khai
- [ ] Giới hạn số lượt gọi theo IP và theo phiên; giới hạn độ dài chữ trẻ gõ.
- [ ] Đặt hạn mức chi tiêu cho khoá model ở phía nhà cung cấp.
- [ ] Phiên hết hạn sau một khoảng không hoạt động; bản nháp xoá cùng phiên.
- [ ] "Góc phụ huynh" và `GET /api/drafts` không mở công khai: chỉ đọc bản nháp của đúng phiên mình, hoặc cần mã của người lớn. `POST /api/admin/scenario-draft` (nếu làm) chỉ nhóm truy cập được.
- [ ] Log và trace không chứa lời gõ chưa che thông tin cá nhân.

### Kiểm sau khi lên
- [ ] Chơi trọn một phiên trên link thật bằng máy tính và điện thoại.
- [ ] Gõ thử một câu nghi xâm hại thật và một câu injection trên bản đã lên mạng, kiểm hành vi giống bản chạy ở máy.
- [ ] Ghi link vào README và slide.
- **Xong khi:** người ngoài nhóm mở link, chơi hết 5 màn, đọc được bản nháp, và không thấy được bản nháp của phiên khác.
