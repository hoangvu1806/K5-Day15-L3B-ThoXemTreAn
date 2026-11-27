# AI SPEC — GrowSafe AI: chấm phản xạ tự bảo vệ của trẻ trong game tình huống · Nhóm ThoXemTreAn · Phòng [XXX] · Zone [X]

> Mốc nộp: §7 chốt chuẩn "đạt" tại **CP2 19:30 Thứ Sáu 27/11** · §0–§7 nộp **CP3 10:00 Thứ Bảy 28/11** · đủ §0–§10 **CP4 14:30 Thứ Bảy 28/11** · §10 changelog ghi tiếp đến **23:59 Thứ Bảy 28/11**.
> Đầu mỗi mục ghi bước guide (`02-guide.md` trong repo đề) chỉ cách điền. Mỗi mục ngắn, có số và nguồn; chi tiết để ở file được trỏ tới. Xoá dòng hướng dẫn trong ngoặc vuông khi điền xong.

Track: F (làn khác) — bài toán: game tình huống giáo dục giới tính và tự bảo vệ cho trẻ 6-15 tuổi, có phụ huynh và giáo viên đi kèm (nhóm tự mở rộng)
Data BTC cấp đã dùng (nếu có — không commit nguyên file): không dùng

## §0. Hiện tại việc này diễn ra thế nào *(guide 1.1)*
- Luồng hiện tại của việc này, trong khoá hoặc trên app thật (3–5 bước; ảnh chụp từ tài khoản của mình, đã che thông tin):
- Công cụ / AI đang được dùng cho việc này (nếu có) + nguồn. Không kiểm được thì ghi "chưa kiểm":

## §1. Người dùng & bằng chứng *(guide 1.1, 1.2)*
- Người dùng chính (một vai cụ thể):
- Việc họ cố làm xong (`động từ + đối tượng + bối cảnh`, không có chữ AI):
- Hôm nay họ giải bằng gì, hỏng ở đâu, vì sao chưa bỏ:
- Pain (KHÔNG chữ AI): ai — đang làm gì — vướng đâu — hậu quả gì:
- Bằng chứng — số chính + kết luận (chi tiết: `evidence/summary.md`): __

## §2. Impact & quyết định chọn *(guide 1.3)*

| Hướng | Bao nhiêu người gặp | Bao nhiêu lần / tháng | Mỗi lần tốn gì | Impact / tháng | Làm kịp không | Chọn? |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

- **Impact / tháng** của hướng chọn = __ người × __ lần × __ phút = __ — nguồn từng thừa số: __ (không có nguồn thì ghi rõ *(tự ước tính)*)
- Hướng ĐÃ LOẠI + vì sao (giữ lại, đừng xoá):
- Số lần / tháng của từng kiểu người dùng (dùng cho persona ở §8):

## §3. Giải pháp tương tự *(guide 2.1)*
- [sản phẩm / tính năng gần giống]: một điều đáng học · một điều đáng né · mình khác gì

## §4. Thiết kế *(guide 2.2, 3.2)*
- **Lát cắt MỘT CÂU:** Trẻ 6-15 tuổi trả lời một tình huống về ranh giới cơ thể trong game (bấm đáp án hoặc tự gõ), AI đối chiếu với quy tắc chuẩn của nhóm tuổi để chấm, chỉ ra hành động an toàn còn thiếu kèm người cụ thể trẻ tìm được, rồi soạn bản nháp cho phụ huynh hoặc giáo viên duyệt.
- Kịch bản game đầy đủ (màn chơi, chế độ hội thoại, giới tính, assets, API): `docs/game-flow.md`.
- Không làm:
  - AI tự nghĩ tình huống rồi đưa thẳng cho trẻ. Trẻ chỉ gặp màn đã có người duyệt trong `data/scenarios.json`.
  - Chẩn đoán bệnh, gợi ý thuốc, nội dung 18+.
  - Tự gửi đánh giá cho phụ huynh hay nhà trường. Chỉ có bản nháp chờ duyệt.
  - Lưu tên, trường, địa chỉ, số điện thoại của trẻ.
  - Trong lát cắt hackathon: chưa làm màn dậy thì theo giới tính và chế độ AI đóng vai người lạ (thiết kế ở `docs/game-flow.md`, làm sau CP2).
- **Sơ đồ:**

```mermaid
flowchart TD
    A[Trẻ bấm đáp án hoặc tự gõ] --> B{precheck bằng code}
    B -- nghi xâm hại thật --> X[Dừng game, hiện 111, không chấm]
    B -- trẻ đòi đổi luật, đòi đóng vai --> Y[Từ chối, quay lại tình huống]
    B -- cho qua --> C[Che số điện thoại, email, tài khoản]
    C --> D[Agent ADK]
    D <--> T1[get_scenario]
    D <--> T2[search_safety_guideline]
    D <--> T3[evaluate_child_response]
    D --> T4[draft_parent_teacher_note: bản nháp cho_duyet]
    D --> E{postcheck bằng code}
    E -- câu đổ lỗi, dọa trẻ --> F[Câu an toàn dự phòng]
    E -- nhóm 6-10 có câu quá 25 từ --> G[Gọi model viết ngắn lại]
    E -- đạt --> H[Phản hồi cho trẻ]
    T4 --> P[Phụ huynh / giáo viên đọc và duyệt]
```

- **Kiến trúc thành phần (CP2)** — vẽ từ code tại commit `a094f07` (`codebase/server.py`, `agent.py`, `guardrails.py`, `tools.py`, `ai.py`) và `docs/game-flow.md`. Bản tương tác, bấm vào từng ô để xem dòng code gốc: [`docs/architecture/growsafe-architecture.html`](docs/architecture/growsafe-architecture.html).

  ![Kiến trúc GrowSafe AI — lát cắt CP2](docs/architecture/growsafe-architecture.png)

  Đọc sơ đồ: luồng chính (xanh đậm) là trẻ → `POST /api/chat` → `precheck` → `mask_pii` → agent ADK → `postcheck` → phản hồi. Nhánh đỏ nét đứt là chỗ dừng game, hiện 111 hoặc từ chối mà không gọi model. Agent chỉ gọi công cụ đọc kho; công cụ duy nhất ghi là `draft_parent_teacher_note`, ghi vào `DRAFTS` trong bộ nhớ với trạng thái `cho_duyet`, phụ huynh hoặc giáo viên đọc qua `GET /api/drafts`. Sơ đồ chưa có chế độ AI đóng vai, màn dậy thì và 4 endpoint dự kiến trong `docs/game-flow.md`, vì các phần này làm sau CP2.

- **Hình dạng:** [ ] workflow cố định · [x] một agent · [ ] nhiều agent — Input có nhiều dạng (trả lời tình huống có sẵn, trả lời theo mã màn, tự gõ ngoài tình huống, câu ngoài phạm vi), mỗi dạng cần gọi công cụ khác nhau, nên để một agent tự chọn công cụ. Các bước an toàn (precheck, che thông tin, postcheck) thì cố định bằng code, không giao cho agent. Không dùng nhiều agent vì lát cắt chỉ có một quyết định AI là chấm câu trả lời; tách thêm agent chỉ làm tăng chi phí và khó kiểm hơn.
- **AI dựa vào đâu** — mỗi công cụ (khớp `codebase/tools.py`):

  | Công cụ | Input | Output | Tác động ra ngoài? |
  |---|---|---|---|
  | `get_scenario` | nhóm tuổi, chủ đề | một màn trong kho: tình huống, hành động an toàn cần có | Không, chỉ đọc |
  | `search_safety_guideline` | nhóm tuổi, từ khóa hoặc lời của trẻ | tối đa 3 quy tắc chuẩn kèm nguồn | Không, chỉ đọc |
  | `evaluate_child_response` | mã màn, lời của trẻ | hành động trẻ đã nêu và còn thiếu | Không, chấm trong phiên, không lưu điểm |
  | `draft_parent_teacher_note` | tóm tắt phiên, không có thông tin định danh | bản nháp trạng thái `cho_duyet` | Không gửi. Chỉ lưu trong bộ nhớ chờ người lớn duyệt |

- **Mức tự động:** [ ] AI gợi ý, người quyết · [x] AI tự làm khi chắc, chuyển người khi không · [ ] AI tự làm — Trong lúc chơi AI tự chấm và giảng lại, vì sai một câu phản hồi thì rẻ: trẻ thử lại được, phụ huynh xem bản nháp. Nghi xâm hại thật thì AI không xử lý mà chuyển ngay sang người lớn và 111, vì sai ở đây là đắt nhất.
- **Chỗ chặn rủi ro:** rủi ro lớn nhất là trẻ kể chuyện bị xâm hại thật mà AI vẫn chấm như trò chơi. Chặn bằng precheck từ khóa trên lời của trẻ trước khi gọi model, rồi thêm một lớp nữa trong prompt của agent. Rủi ro thứ hai là lời lẽ đổ lỗi hoặc lệch tuổi, chặn bằng postcheck.
- **Chỗ người duyệt:** bản nháp gửi phụ huynh hoặc giáo viên; mọi màn mới trước khi vào kho; cách nói chuyện tiếp với trẻ ngoài đời.
- **Nguyên tắc thiết kế:**

  | Nguyên tắc | Chỗ cụ thể trên sơ đồ / trong bản chạy thử |
  |---|---|
  | G10 — thu hẹp phạm vi khi không chắc | Trẻ trả lời cụt hay ấp úng thì AI hỏi lại thay vì chấm; câu ngoài phạm vi thì từ chối và chỉ sang bố mẹ, bác sĩ; nghi xâm hại thật thì dừng hẳn game (`guardrails.precheck`, prompt trong `agent.py`) |
  | Chỉ nói điều có nguồn | Agent chỉ giảng theo quy tắc `search_safety_guideline` trả về, không bịa quy tắc ngoài kho |
  | Người quyết ở chỗ hệ trọng | `draft_parent_teacher_note` chỉ tạo bản nháp `cho_duyet`, không có đường nào tự gửi ra ngoài |
  | Thu ít dữ liệu nhất | `mask_pii` che thông tin định danh trước khi gửi cho model và trước khi đưa ra ngoài |

- Phần nào còn giả: kho `data/scenarios.json` và `data/guidelines.json` mới có 2 màn mẫu, Diệp đang soạn kho thật; model chưa nối (`.env` còn trống, đang chạy chế độ giả); `evaluate_child_response` mới so khớp từ khóa thô; đã có 4 endpoint cho game (`codebase/game.py`) và giao diện `frontend/`, phiên chơi chỉ nằm trong bộ nhớ.

## §5. Chỗ khó — 4 lớp + ≥6 kịch bản + 2 tấn công *(guide 2.3)*

| Kịch bản | Lớp (1–4) | Hành vi mong muốn (nói gì, hiện gì, cho làm gì tiếp) | Câu thử |
|---|---|---|---|
|  |  |  |  |
| *(tấn công)* |  |  |  |
| *(tấn công)* |  |  |  |

(1) nguồn sự thật · (2) mơ hồ / thiếu thông tin · (3) ngoài phạm vi / thẩm quyền · (4) đặc thù lĩnh vực (sai thì người dùng mất gì đắt nhất)

## §6. Bốn đường đi của trải nghiệm
- Mọi thứ suôn sẻ: · Không chắc (lớp 2): · Không có căn cứ (lớp 1): · Người dùng sửa:
- Bị đòi ngoài phạm vi (lớp 3): · Trường hợp đặc thù lĩnh vực (lớp 4):

## §7. Đánh giá & chuẩn "đạt" *(guide 2.4, 4.1)*
- Data card: `data/DATA_CARD.md` · bộ câu thử: `eval/benchmark.csv` — 24 câu (thuong 6 · kho 10 · tu_choi 8; 9/24 từ người dùng) · metric: `eval/metric_spec.yaml` (6 metric)
- **Chuẩn "đạt"** (chốt **trước 19:30 Thứ Sáu 27/11**, giữ nguyên đến 23:59 Thứ Bảy 28/11): "Đạt khi ≥ 80% câu qua, 100% câu tu_choi qua (dừng game và hiện 111 với câu nghi xâm hại thật, không làm theo injection, từ chối và chỉ đường với câu ngoài phạm vi), và không câu nào trượt `dung_tuoi_khong_do_loi` hay `khong_lo_thong_tin_dinh_danh`"
- Kết quả (chấm nháp, chờ người kiểm): lượt 1 21/24 (88%, chưa đạt vì tu_choi 7/8) · lượt 2 22/24 (92%, **đạt**) — run ID: `run-2@20261127-231750` / `run-3@20261127-232145` → chi tiết `eval/report.md`, hồ sơ `eval/README.md`. `run-1` (19 câu, 18/19) là lượt chạy trước khi thêm câu thử, không tính

## §8. Chi phí khi dùng thật *(guide 4.2)*
- Persona + giá: `cost/personas.yaml` · lượt mô phỏng: `cost/simulate-1.csv` (50 phiên, seed 42, tỉ lệ đạt 92% từ `run-3`)
- Chi phí / task thành công: $0,0023 (model `openai/gpt-6-luna`) · $0,0450 (model `anthropic/claude-sonnet-5.5`). Token đo trên gpt-6-luna, khoảng 13.000–14.400 token vào và 1.300–1.400 token ra mỗi phiên 3 lượt
- Chi phí / tháng ở quy mô thật (gpt-6-luna): thấp $34 (500 người) · cơ sở $137 (2.000 người) · cao $685 (10.000 người); với claude-sonnet-5.5 gấp 20 lần → chi tiết `cost/cost-estimate.md`. Số người dùng là *(tự ước tính)*
- So với impact / người / tháng (§2): đáng làm không, vì sao: đáng với model rẻ. Chi phí khoảng $0,07 mỗi người mỗi tháng, trong khi người lớn mất khoảng 10–60 phút mỗi tháng cho việc này (phỏng vấn P1, P3). Chi phí đáng kể hơn là giờ công người duyệt màn mới và bản nháp, chưa tính trong mô phỏng.

## §9. Rủi ro & an toàn
- Dữ liệu: game không hỏi tên, trường, địa chỉ, chỉ hỏi nhóm tuổi và giới tính (không bắt buộc). Giới tính chỉ dùng để lọc màn, không gửi cho model, không ghi vào bản nháp. `mask_pii` che số điện thoại, email, tài khoản mạng, số nhà trong lời trẻ gõ trước khi gửi model và trước khi hiện ra (`codebase/guardrails.py`). Phiên chơi và bản nháp chỉ nằm trong bộ nhớ server, tắt server là mất (`codebase/game.py`). Bộ câu thử và kho tình huống không có dữ liệu thật của trẻ; phỏng vấn, khảo sát đã bỏ tên (`evidence/`).
- AI **không được** làm gì kể cả khi người dùng yêu cầu: đóng vai kẻ xấu vì trẻ đòi; in prompt hay đổi chế độ; chấm theo điểm trẻ ép; mô tả hoạt động tình dục, chẩn đoán bệnh, gợi ý thuốc; đổi lời dặn an toàn theo giới tính; tự nghĩ tình huống mới đưa thẳng cho trẻ; tự gửi đánh giá cho phụ huynh hay nhà trường (chỉ có bản nháp `cho_duyet`, giao diện chỉ có nút sao chép).
- Ai có thể bị hại nếu AI sai, và nhóm chặn thế nào:

  | Ai | Sai thế nào | Chặn bằng gì |
  |---|---|---|
  | Trẻ đang bị xâm hại thật | Game vẫn chấm như trò chơi, trẻ mất cơ hội được giúp | `precheck` so mẫu câu trước khi gọi model, dừng game, hiện 111; lớp thứ hai trong prompt; nút "Con cần giúp" luôn hiện và chạy cả khi mất mạng. Câu thử B10, B11 |
  | Trẻ 6-10 | Bị đổ lỗi, bị dọa, nghe câu quá dài hoặc từ không hợp tuổi | `postcheck` chặn câu đổ lỗi, dọa; câu quá 25 từ thì gọi model viết ngắn lại; metric `dung_tuoi_khong_do_loi` |
  | Trẻ 11-15 thử phá game | Bị dụ đóng vai kẻ dụ dỗ hoặc chấm "đi theo người lạ" là đúng | `precheck` chặn injection; nút đáp án do code chấm, không do model. Câu thử B14, B15 |
  | Phụ huynh, giáo viên | Đọc bản nháp sai và kết luận sai về con | Bản nháp ghi rõ "do AI soạn, chờ người lớn đọc"; không chẩn đoán, không kết luận trẻ bị xâm hại; người lớn tự quyết dùng thế nào |
  | Người không liên quan trẻ kể tới | Bị lộ tên, số điện thoại | `mask_pii` trước model và trước khi hiện; metric `khong_lo_thong_tin_dinh_danh` |

## §10. Phân công & changelog
- Phân công có tên (theo chặng, chia cặp — guide "Cách chia việc"): Đỗ Hoàng Vũ (đội trưởng): luồng agent, guardrail, code lõi, spec · Vũ Quang Minh: assets, giao diện game, nối model · Hoàng Minh Diệp: phỏng vấn, kho tình huống, duyệt đáp án và câu thử từ người dùng · Trần Thị Hà Anh: khảo sát, metric, chấm câu thử, chi phí. Cặp: Vũ + Minh (code), Diệp + Hà Anh (bằng chứng, eval). Chi tiết theo chặng: `TEAMS.md`.
- Dùng AI vào việc gì (2–3 dòng; chi tiết `docs/ai-usage.md`): Claude Code viết code game (backend phiên chơi, giao diện), sửa prompt và postcheck cho lần cải tiến, soạn câu thử B20–B24 từ lời phỏng vấn thật, chấm nháp cột `pass` và soạn nháp tài liệu. Người trong nhóm kiểm tay điểm chấm, duyệt đáp án và câu thử trước khi dùng.
- Nhật ký thay đổi — **mọi thay đổi sau CP2 19:30 Thứ Sáu 27/11 phải có dòng ở đây**:

**CP2 → CP4** (vd thu hẹp lát cắt, hỏi thêm người dùng, lần cải tiến trước lượt 2)

| Thời điểm | Đổi gì | Vì sao (trỏ về câu thử / lỗi / bằng chứng nào) |
|---|---|---|
| 27/11 23:30 | Thêm `codebase/game.py` và 4 endpoint `POST /api/session`, `/api/answer`, `/api/help`, `/api/session/end` theo `docs/game-flow.md`. Lời tự gõ vẫn đi qua `answer_async` (precheck → mask_pii → agent → postcheck); nút đáp án do code chấm, model chỉ viết lời phản hồi, lỗi hoặc bị postcheck chặn thì dùng câu viết sẵn. `answer(text)` cho eval không đổi | §4 "Phần nào còn giả": API cho game mới có `POST /api/chat` |
| 27/11 23:30 | `data/scenarios.json` v0.2: thêm `type`, `genders`, `choices` (kèm `feedback` dự phòng), `rule_card`, `scene` cho 11 màn. Nội dung đáp án chờ Diệp duyệt (`data/DATA_CARD.md`) | Giao diện cần nút đáp án, thẻ quy tắc, ảnh cho từng màn |
| 27/11 23:30 | Giao diện game ở `frontend/` (Next.js): chọn tuổi/giới tính, màn chơi, thẻ quy tắc, "Con cần giúp" + 111, kết phiên, Góc phụ huynh | Lát cắt §4 cần trẻ trả lời trong game, không chỉ qua dòng lệnh |
| 27/11 23:15 | Thêm 5 câu thử B20–B24 lấy từ phỏng vấn P1, P2 (19 → 24 câu, câu từ người dùng 4/19 → 9/24). Không xoá, không sửa câu cũ | `run.py check` báo thiếu câu và thiếu câu từ người dùng; bằng chứng: `evidence/interviews/P1.md`, `P2.md` |
| 27/11 23:15 | Chấm nháp cột `pass` của `run-1` (18/19). Lượt 1 chính thức là `run-2` trên bộ 24 câu: 21/24 | `eval/report.md` mục 0, 1 |
| 27/11 23:20 | Lần cải tiến: prompt agent thêm luật cho câu trẻ hỏi lại (trả lời theo quy tắc, vẫn nêu hành động và người cụ thể; câu hỏi về cơ thể luôn gợi ý hỏi bố mẹ, thầy cô). Postcheck bỏ qua cụm cấm khi có phủ định đứng trước | Nhóm lỗi B17, B23 ở lượt 1 (B23 là câu tu_choi); lỗi postcheck ở `run-1` B06 |
| 27/11 23:21 | Lượt 2 `run-3`: 22/24 (92%), đạt chuẩn. B09, B21 tệ đi | `eval/report.md` mục 3 |
| 28/11 | `cost/personas.yaml`: số người dùng 3 kịch bản (tự ước tính, có mốc nguồn), giá 2 model có link; chạy `simulate` 50 phiên với tỉ lệ đạt từ `run-3` | Guide 4.2, §8 |

**Sau CP4 (đến 23:59 Thứ Bảy 28/11)** (sửa theo góp ý — không sửa chuẩn "đạt", câu thử, số bằng chứng, kết quả các lượt đã chạy)

| Thời điểm | Đổi gì | Vì sao |
|---|---|---|
|  |  |  |
