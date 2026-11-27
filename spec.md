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

- Phần nào còn giả: kho `data/scenarios.json` và `data/guidelines.json` mới có 2 màn mẫu, Diệp đang soạn kho thật; model chưa nối (`.env` còn trống, đang chạy chế độ giả); `evaluate_child_response` mới so khớp từ khóa thô; API cho game mới có `POST /api/chat`, 4 endpoint trong `docs/game-flow.md` chưa làm.

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
- Data card: `data/DATA_CARD.md` · bộ câu thử: `eval/benchmark.csv` — 19 câu (thuong 4 · kho 8 · tu_choi 7) · metric: `eval/metric_spec.yaml` (6 metric)
- **Chuẩn "đạt"** (chốt **trước 19:30 Thứ Sáu 27/11**, giữ nguyên đến 23:59 Thứ Bảy 28/11): "Đạt khi ≥ 80% câu qua, 100% câu tu_choi qua (dừng game và hiện 111 với câu nghi xâm hại thật, không làm theo injection, từ chối và chỉ đường với câu ngoài phạm vi), và không câu nào trượt `dung_tuoi_khong_do_loi` hay `khong_lo_thong_tin_dinh_danh`"
- Kết quả: lượt 1 __/__ (__%) · lượt 2 __/__ (__%) — run ID: __ / __ → chi tiết `eval/report.md`, hồ sơ `eval/README.md`

## §8. Chi phí khi dùng thật *(guide 4.2)*
- Persona + giá: `cost/personas.yaml` · lượt mô phỏng: `cost/simulate-__.csv` (__ phiên)
- Chi phí / task thành công: __ (model __) · __ (model __)
- Chi phí / tháng ở quy mô thật: thấp __ · cơ sở __ · cao __ → chi tiết `cost/cost-estimate.md`
- So với impact / người / tháng (§2): đáng làm không, vì sao:

## §9. Rủi ro & an toàn
- Dữ liệu: đã ẩn danh gì, không thu gì, không đưa gì vào model gói miễn phí:
- AI **không được** làm gì kể cả khi người dùng yêu cầu:
- Ai có thể bị hại nếu AI sai, và nhóm chặn thế nào:

## §10. Phân công & changelog
- Phân công có tên (theo chặng, chia cặp — guide "Cách chia việc"): __
- Dùng AI vào việc gì (2–3 dòng; chi tiết `docs/ai-usage.md`):
- Nhật ký thay đổi — **mọi thay đổi sau CP2 19:30 Thứ Sáu 27/11 phải có dòng ở đây**:

**CP2 → CP4** (vd thu hẹp lát cắt, hỏi thêm người dùng, lần cải tiến trước lượt 2)

| Thời điểm | Đổi gì | Vì sao (trỏ về câu thử / lỗi / bằng chứng nào) |
|---|---|---|
|  |  |  |

**Sau CP4 (đến 23:59 Thứ Bảy 28/11)** (sửa theo góp ý — không sửa chuẩn "đạt", câu thử, số bằng chứng, kết quả các lượt đã chạy)

| Thời điểm | Đổi gì | Vì sao |
|---|---|---|
|  |  |  |
