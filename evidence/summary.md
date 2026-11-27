# Tổng hợp bằng chứng pain

> Điền ở guide bước 1.2, xong trước **CP3 10:00 Thứ Bảy 28/11**. Chấm ở rubric R1.
> Ba nguồn ngang nhau — tối thiểu **≥1 nguồn đạt ngưỡng**. Mạnh nhất: đào data ra insight → hỏi người dùng để kiểm lại (hoặc ngược lại).

## 1. Nguồn đã dùng

| Nguồn | Đạt ngưỡng? | File |
|---|---|---|
| Đào data (x/N, %, cách đếm chạy lại được, ≥5 ví dụ) | ☐ | `evidence/data-mining.md` |
| Phỏng vấn (≥3 người ngoài nhóm, đúng người dùng) | ☑ 3 người, cả 3 là người chăm trẻ 6–10 tuổi. Phỏng vấn qua tin nhắn (Zalo, Messenger), không phải trực tiếp. P3 đang chờ kiểm lại độ tin cậy | `evidence/interviews/P1.md`… |
| Khảo sát (≥20 người ngoài nhóm, đúng người dùng) | ☑ 20 phiếu hợp lệ, vừa đủ ngưỡng. Nếu chỉ tính trẻ 6–15 tuổi thì còn 14 (xem giới hạn ở `questions.md`) | `evidence/survey/` |

## 2. Số chính

- Đào data: __/__ (__%) …
- Phỏng vấn: **2/3 người gặp** (P1 bí khi con hỏi vặn và nghĩ bé sẽ giấu quà; P2 nghĩ bé chỉ "hiểu sơ sơ" và có thể nghe theo người lạ; P3 gần như không vướng) · số lần / tháng: P1 3–4, P2 không hỏi, P3 2–3 · mỗi lần mất 5–15 phút (P1 ~15, P3 5–10, P2 không hỏi)
- Khảo sát (Zalo, Messenger · 17:40–18:30 27/11 · đếm bằng `python evidence/survey/count.py`): n = 20 hợp lệ / 21 phiếu
  - **Giả thuyết:** **18/20 (90%)** thấy ngại hoặc không biết nói sao cho hợp tuổi (câu 3), **hoặc** không chắc trẻ sẽ kể lại khi bị cho quà rồi dặn giữ bí mật (câu 6). Chỉ tính trẻ 6–15 tuổi: 12/14 (86%).
  - Riêng câu 3, thấy ngại hoặc không biết nói sao: 12/20 (60%). Riêng câu 6, không chắc hoặc không biết trẻ có kể: 15/20 (75%).
  - Câu 4, khó nhất là **không biết dùng từ nào cho hợp tuổi: 12/20 (60%)**, rồi đến trẻ nghe xong là quên: 10/20 (50%). Thấy ngại chỉ 6/20 (30%).
  - Câu 5, có hỏi lại trẻ "nếu… thì con làm gì?": thường xuyên 12/20 (60%), thỉnh thoảng 5/20, chưa bao giờ 3/20.
  - Câu 7, nếu có trò chơi: 1–2 lần mỗi tuần 10/20 · vài lần mỗi tháng 6/20 · cả lớp nhiều lượt mỗi tuần 2/20 · không cho chơi 2/20.
  - Câu 8, lo nhất: nội dung không hợp tuổi 8/20 · trẻ chơi một mình không ai giải thích 6/20 · lộ thông tin của trẻ 5/20 · không lo 1/20.

Đếm theo vai (giả thuyết, câu 3 hoặc câu 6): phụ huynh 10/12 (83%) · giáo viên 4/4 · cả hai 1/1 · vai khác (người thân, gia sư) 3/3.

| | Vai | Gặp pain? | Số lần / 1 tháng qua | Lần gần nhất mất | Đang xoay xở bằng |
|---|---|---|---|---|---|
| P1 | Phụ huynh (con 7 và 5 tuổi) · nhắn Zalo | Một phần: bí khi con hỏi vặn ("ngực của con sao ko gọi là riêng tư"), không ngại | 3–4 lần | ~15 phút (không chắc) | Trường dạy vùng đồ bơi + sách đọc cho con · thấy ổn nên vẫn dùng |
| P2 | Phụ huynh (con 9 tuổi) · nhắn Zalo | Có: "bé cx hiểu sơ sơ thôi, kiểu ba mẹ dặn thì nghe theo"; không chắc bé từ chối người lạ nếu chưa được chuẩn bị trước | không hỏi (lần gần nhất ~1 tháng trước) | không hỏi | Tự giải thích khi bé hỏi + hỏi lại khi đón con + kênh TikTok/YouTube của bác sĩ, chuyên gia |
| P3 | Người chăm bé 7 tuổi · nhắn Messenger · *độ tin cậy cần kiểm, xem P3.md* | Gần như không: chỉ "hơi khựng lại một chút", tin bé hiểu và sẽ kể | 2–3 lần | 5–10 phút (+ vài phút tra) | Tra bài của chuyên gia tâm lý, bác sĩ nhi trên mạng + sách + tự đặt tình huống giả định hỏi bé |

## 3. ≥5 trích dẫn hoặc ví dụ nguyên văn (có nguồn, bỏ tên)

1. "Con hỏi sao đi bơi lại phải vào buồng mới được thay đồ, trong khi mấy bạn nó thay luôn ở ngoài. Tôi nói “Con cứ vào buồng thay cho tiện”. Nó hỏi “Tiện gì hả bố?” thì tôi cũng bí, nên lại bảo "thôi nhanh nhanh lên"" — phiếu khảo sát 10 (giáo viên, trẻ 6–10)
2. "Hôm đi ăn giỗ, con né lúc bà định hôn má. Mình bảo bà thương con mà. Lúc về con hỏi thế con không thích thì sao?, mình ậm ừ một lúc rồi bảo lần sau con vẫy tay chào bà cũng được" — phiếu khảo sát 17 (phụ huynh, trẻ 6–10)
3. "Tôi là giáo viên, có hôm tôi hỏi cả lớp là nếu thấy không an toàn thì nói với ai? Các em  bảo nói với người lớn. Đến lúc tôi hỏi 1 em lúc tan học, cô về rồi, em tìm ai? thì em ấy ngồi nghĩ mãi. Lần sau tôi sẽ cho từng em nghĩ trước hai người mình có thể tìm." — phiếu khảo sát 18 (giáo viên, trẻ dưới 6)
4. "bé trai là cháu mình lúc nhỏ hỏi làm sao mà có em bé, mình cũng không biết trả lời sao thường là nói dối hoặc lảng qua chuyện khác" — phiếu khảo sát 2 (người thân, trẻ 6–10)
5. "Sau này con sẽ biết. Lớn sẽ hiểu" — phiếu khảo sát 12 (chú/bác, trẻ dưới 6)
6. "Sau lớn mẹ sẽ giải thích cho nhé :))" — phiếu khảo sát 4 (phụ huynh, trẻ 6–10)
7. "Có, lúc đó tôi sẽ bảo để tôi tra thêm thông tin trên điện thoại để giải thích" — phiếu khảo sát 11 (gia sư, trẻ 11–15)

Trích dẫn 4–7 cho thấy cách xoay xở hiện nay: hẹn "lớn sẽ hiểu", lảng sang chuyện khác, hoặc lên mạng tra.

## 4. Các nguồn có khớp nhau không

Khảo sát (n = 20) và phỏng vấn (3 người) **khớp nhau ở 3 điểm:**
- **Ngại không phải vướng mắc chính.** Khảo sát: chỉ 6/20 chọn "thấy ngại". Phỏng vấn: cả 3 người đều nói chuyện này 2–4 lần mỗi tháng, khi bé hỏi hoặc tự chủ động.
- **Chỗ hở là bí mật kèm quà.** Khảo sát: 15/20 không chắc trẻ sẽ kể lại. Phỏng vấn: P1 nói "nếu món quà bé thích bé sẽ dấu", P2 nói "có thể bé sẽ nghe theo người lạ" nếu chưa được dặn trước.
- **Người lớn không thiếu tài liệu mà thiếu cách biết trẻ hiểu thật chưa.** Khảo sát: chỉ 2/20 chọn "không có tài liệu đáng tin". Phỏng vấn: cả 3 đã có nguồn (trường, sách, kênh của bác sĩ, chuyên gia), nhưng P2 nói "bé cx hiểu sơ sơ thôi, kiểu ba mẹ dặn thì nghe theo". Cả 3 đều muốn bản tóm tắt cho biết **bé hiểu phần nào, phản ứng ra sao, còn hổng chỗ nào**.

**Lệch ở 1 điểm:** khảo sát cho thấy vướng nhiều nhất là "không biết dùng từ cho hợp tuổi" (12/20), nhưng trong phỏng vấn chỉ P1 kể một lần bí cụ thể (con hỏi về ngực của bố). Có thể vì phỏng vấn hỏi về một lần cụ thể, còn khảo sát hỏi cảm nhận chung.

**Một điểm đáng chú ý:** người duy nhất chắc chắn bé sẽ kể lại (P3) cũng là người hay đặt tình huống giả định hỏi bé. Trích dẫn 3 của giáo viên (phiếu 18) cũng cho thấy: hỏi chung cả lớp thì các em trả lời đúng, nhưng gặp tình huống cụ thể thì bí. Cả hai gợi ý **luyện bằng tình huống cụ thể** là điều tạo khác biệt. Điểm này đúng với lát cắt, nhưng mới dựa trên 1 người và 1 trích dẫn, và P3 còn chờ kiểm độ tin cậy.

## 5. Kết luận

Giả thuyết ở `evidence/hypothesis.md`: **đúng, cần chỉnh một phần.** Lý do: khảo sát có 18/20 (90%) gặp ít nhất một trong hai vướng mắc. Phỏng vấn có 2/3 người (P1, P2), vừa đúng ngưỡng 2/3. Nhưng vướng mắc chính là **không biết chọn từ cho hợp tuổi (12/20)**, không phải ngại (6/20). Phần "trẻ chỉ nghe dặn suông, không ai kiểm lại" thì yếu hơn dự đoán, vì 12/20 tự nhận thường xuyên hỏi lại trẻ.

Điều vẫn chưa biết:
- Số lần lúng túng trong tháng qua (form không hỏi theo khung thời gian).
- Hỏi lại trẻ kiểu gì mà vẫn không chắc trẻ sẽ kể. Phỏng vấn gợi ý: hỏi chung chung thì chưa đủ, phải hỏi theo tình huống cụ thể (P3, phiếu 18). Mới có 1 người và 1 trích dẫn.
- Trẻ tự nghĩ gì, vì mới hỏi người lớn.
- Người trả lời khảo sát có thật sự ở ngoài nhóm không (form ẩn danh).
- Phỏng vấn chưa có phụ huynh hay giáo viên của trẻ 11–15 tuổi, cả 3 người đều chăm trẻ 6–10 tuổi.

## Lịch hẹn (dùng cho CP2 — chỉ ghi vai và giờ, không tên)

| Vai | Giờ hẹn | Đã xong? |
|---|---|---|
| | | |
