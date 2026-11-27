# Đề xuất Sprint 3: dàn nhân vật, gameplay mới, vai trò của AI, assets và giao diện

Bản đề xuất ngày 28/11. Xây tiếp trên `docs/de-xuat-tinh-nang.md` (sổ tay thẻ, thám tử nhận chiêu, bản đồ, bỏ trắc nghiệm, mic và loa, màn do AI tạo) và trên bản game đang chạy ở `frontend/`. Chờ Vũ duyệt. Mục nào đụng luật đã chốt thì có ghi rõ ở mục 8.

Ba việc phải giữ nguyên dù đổi gì: câu 111 và màn "cần giúp" do code quyết, không do AI; `eval/benchmark.csv`, `eval/metric_spec.yaml` và chuẩn "đạt" không sửa; mọi thay đổi sau CP2 có dòng trong `spec.md` §10.

## 1. Dàn nhân vật dùng chung cho mọi màn

Hiện mỗi màn một tên: Na, Bin, Su, Tôm, Mít. Trẻ chơi 5 màn gặp 5 nhân vật chính khác nhau nên không nhớ ai, và người lớn trong cảnh cũng đổi vai lung tung: ảnh `npc_man_friendly` vừa là chú hàng xóm định sờ Bin ở S6-01, vừa là người họ hàng ở S11-04.

Đề xuất một dàn nhân vật cố định. Nhân vật chính có 4 người, theo nhóm tuổi và giới tính trẻ chọn ở màn đầu:

| | Nam | Nữ |
|---|---|---|
| 6-10 tuổi | **Bin**, 8 tuổi, lớp 3A | **Na**, 8 tuổi, lớp 3A |
| 11-15 tuổi | **Khôi**, 13 tuổi, lớp 8B | **Mai**, 13 tuổi, lớp 8B |

Trẻ đóng vai người bạn đi cạnh nhân vật chính. Giữ nhân vật chính có tên (thay vì kể "cậu bị…") vì chuyện bị chạm vào người kể ở ngôi thứ ba thì trẻ 6-10 đỡ sợ hơn, trẻ khuyên bạn dễ hơn khuyên chính mình.

Màn hình đầu bỏ lựa chọn "Không muốn nói", chỉ còn Nam và Nữ, bắt buộc chọn. Một màn chơi có một lời kể, tên nhân vật chính là ô trống `{ten}` điền theo giới tính, nên Bin và Na gặp đúng cùng tình huống, cùng lời dặn. Luật "không đổi lời dặn an toàn theo giới tính" giữ nguyên. Màn dậy thì sau này mới tách nội dung theo giới. Phần dưới viết `{ten}` ở chỗ nào là tên nhân vật chính.

### Nhóm 6-10: "Một ngày của Bin" hoặc "Một ngày của Na"

| Nhân vật | Là ai | Ảnh | Vai cố định |
|---|---|---|---|
| Tin | Linh vật cú, đeo khăn có huy hiệu khiên. Xưng "tớ", gọi trẻ "cậu" | `narrator_*` (đã có) | Dẫn truyện, khen, gợi ý, giảng lại. Không bao giờ buồn hay giận trẻ |
| Bin | Nhân vật chính khi trẻ chọn Nam | `kid_610_neutral_*` đổi tên thành `kid_610_boy_*` | Nhân vật chính mọi màn 6-10 |
| Na | Nhân vật chính khi trẻ chọn Nữ | `kid_610_girl_*` (đã có) | Nhân vật chính mọi màn 6-10 |
| Mít | Bạn thân cùng lớp của `{ten}` | mới | Bạn đi cùng; có màn Mít kể chuyện của mình để `{ten}` (và trẻ) biết cách giúp bạn |
| Mẹ, bố của `{ten}` | | mới | Luôn là người lớn tin cậy |
| Bà nội | Ở cùng xóm | `npc_grandma_warm` | Người thân thương `{ten}`. Màn hôn má dạy quyền từ chối, không dạy "bà là người xấu" |
| Cô Hạnh | Cô chủ nhiệm lớp 3A | `npc_teacher_friendly` | Luôn là người lớn tin cậy |
| Bác Tâm | Bảo vệ trường | `npc_trusted_guard` | Luôn là người lớn tin cậy |
| Cô Lan | Hàng xóm, hay cho quà | `npc_neighbor_friendly`, `npc_neighbor_secret` | Người quen. Lúc bình thường, lúc dặn giữ bí mật xấu |
| Chú Hải | Hàng xóm, hay rủ trẻ trong xóm sang đá bóng | mới | Người quen vượt ranh giới (S6-01) |
| Người lạ | Không có tên, chỉ tả ngoài hình ("chú đội mũ lưỡi trai") | `npc_man_insistent` | Chỉ xuất hiện ở màn người lạ |

### Nhóm 11-15: "Điện thoại của Khôi" hoặc "Điện thoại của Mai"

| Nhân vật | Là ai | Ảnh | Vai cố định |
|---|---|---|---|
| Tin | Cùng linh vật, xưng "mình", gọi trẻ "bạn" | (đã có) | Như nhóm 6-10 |
| Khôi | Nhân vật chính khi trẻ chọn Nam | `kid_1115_neutral_*` đổi tên thành `kid_1115_boy_*` | Nhân vật chính mọi màn 11-15 |
| Mai | Nhân vật chính khi trẻ chọn Nữ | `kid_1115_girl_*` (đã có) | Nhân vật chính mọi màn 11-15 |
| Vy | Bạn thân cùng lớp của `{ten}` | mới | Có màn Vy bị chụp lén, có màn Vy lỡ gửi ảnh và nhờ `{ten}` giúp |
| Khoa (`khoa_lv99`) | Tài khoản quen trong game | `npc_online_avatar` | Xuyên suốt 4 màn, leo thang dần (xem mục 3) |
| Mẹ, bố của `{ten}` | | mới | Người lớn tin cậy |
| Cô Thủy | Cô chủ nhiệm lớp 8B | mới (hoặc dùng `npc_teacher_friendly`) | Người lớn tin cậy |
| Chú Toàn | Chú họ, hay đến chơi dịp giỗ | mới | Người thân vượt ranh giới (S11-04) |

Ảnh `kid_*_neutral_*` hiện có vẽ tóc ngắn, áo hoodie, trông như bé trai, nên dùng luôn làm Bin và Khôi, không phải gen thêm nhân vật chính.

Khi viết màn thì người lớn tin cậy (mẹ, bố, cô Hạnh, bác Tâm, cô Thủy) không bao giờ là người vượt ranh giới. Người quen (cô Lan, chú Hải, chú Toàn, Khoa) có lúc bình thường, có lúc không, vì ngoài đời người dụ dỗ thường là người quen. Một gương mặt chỉ mang một tên.

Cần sửa kèm:
- Viết lại lời kể 11 màn trong `data/scenarios.json`, thay tên cũ bằng `{ten}`: S6-01 "Bạn Na", S6-02 "Bin", S6-04 "Su", S6-05 "Tôm", S6-06 "Mít thấy sợ" (Mít thành bạn đi cùng). Lời kể 11-15 hiện gọi "em", đổi sang `{ten}`. `key_actions` và `rule_ids` giữ nguyên.
- Bỏ "khong_noi" khỏi `genders` trong `data/scenarios.json`, `GENDERS` trong `codebase/game.py`, lựa chọn giới tính ở `frontend/components/game/SetupScreen.tsx`. Hàm `kid()` trong `frontend/lib/assets.ts` chọn `boy` hoặc `girl`.
- Đổi tên file ảnh `kid_610_neutral_*`, `kid_1115_neutral_*` thành `kid_*_boy_*`, cập nhật `manifest.json`. Hai ảnh `icon_gender_neutral` không dùng nữa.
- Sửa `docs/game-flow.md` (mục "Giới tính": bỏ dòng "Chọn Không muốn nói thì chỉ nhận màn dành cho cả hai giới") và `spec.md` §9 (giới tính thành bắt buộc), ghi changelog §10.

## 2. Cách xưng hô và giọng văn

Theo bảng xưng hô ở mục 4.1 của `de-xuat-tinh-nang.md`. Thêm vài luật viết cho mọi câu trong game, cả câu viết sẵn lẫn câu AI viết:

- Câu ngắn như lời nói. Nhóm 6-10 dưới 20 từ một câu.
- Nhắc lại một chữ trẻ vừa nói để trẻ biết Tin có nghe.
- Không mở hai lượt liền bằng cùng một câu khen. Không "Tuyệt vời!" đứng đầu mọi lượt.
- Không giọng sách giáo khoa: bỏ "hành động an toàn", "người lớn tin cậy" trong lời nói với trẻ, thay bằng tên người cụ thể ("mẹ", "cô Hạnh", "bác Tâm").
- Người lạ nói như người thật, có lý do nghe hợp lý, không nói giọng kẻ xấu.

Ví dụ, câu hiện tại và câu đề xuất:

| Chỗ | Hiện tại | Đề xuất |
|---|---|---|
| Khen ở S6-01 | "Giỏi quá! Con nói KHÔNG, rời đi rồi kể với mẹ. Đủ cả ba bước luôn!" | "Cậu bảo 'cháu không chịu', chạy về rồi kể mẹ nghe. Đúng y như tớ muốn!" |
| Động viên | "Gần được rồi" + "Con còn 1 lần thử" | "Chạy về là đúng rồi. Về đến nhà thì cậu kể cho ai nghe?" |
| Người lạ S6-03 | "Mẹ con bận, nhờ chú đón con về. Đi với chú nhé." | "Cháu là con mẹ Hương phải không? Mẹ cháu đang ở viện với bà, nhờ chú qua đón. Lên xe nhanh chú chở về." |
| Chào đầu phiên | "Chào con! Mình là bạn cú." | "{ten} dậy rồi kìa! Hôm nay tớ với cậu đi cùng {ten} cả ngày nhé, Thỏ Xanh." |
| Màn 111, 11-15 | "Mình tạm dừng trò chơi ở đây nhé. Điều con vừa kể…" | "Mình dừng game ở đây đã. Chuyện bạn vừa kể quan trọng hơn game nhiều, và bạn không có lỗi gì hết. Bạn kể với mẹ, bố hoặc cô giáo bạn tin nhé. Bạn hoặc người lớn gọi 111, miễn phí, gọi lúc nào cũng được." |

Câu viết sẵn để trong `data/lines.json` (mục 4.2 của `de-xuat-tinh-nang.md`), mỗi loại 5–8 biến thể, Diệp soạn, nhóm duyệt. Biến thể câu 111 vẫn phải đủ ba ý bắt buộc: có số 111, nói rõ game dừng, không chấm điểm.

Sửa xưng hô xong phải thêm ngay "lỗi của cậu", "tại cậu", "lỗi của bạn", "tại bạn", "sẽ phạt cậu", "sẽ phạt bạn" vào `BANNED_OUTPUT`. Thiếu bước này là postcheck lọt câu đổ lỗi.

## 3. Tình huống khó hơn, có cốt truyện

Kho hiện có 11 màn và màn nào đáp án cũng lộ (người lạ rủ đi thì không đi). Ngoài đời, chỗ khó là người quen, có lý do nghe xuôi tai, có áp lực thời gian hoặc tình cảm, và có cả những lần chạm là bình thường. Đề xuất chia mỗi địa điểm thành các bậc khó, trẻ qua bậc dễ thì mới gặp bậc khó.

| Bậc | Kiểu khó | Ví dụ 6-10 | Ví dụ 11-15 |
|---|---|---|---|
| 1. Rõ ràng | Người lạ, lời rủ lộ | Người lạ ở công viên rủ đi xem chó con | Tài khoản lạ xin ảnh |
| 2. Người quen có cớ | Người quen, lý do hợp lý | Chú Hải bảo "để chú xem vết muỗi đốt" rồi định sờ chỗ đồ bơi che | Khoa tặng vật phẩm 3 lần, lần thứ 4 mới xin ảnh |
| 3. Áp lực | Giục gấp, viện tình cảm, dọa nhẹ | Người lạ mặc áo giống shipper nói mẹ ở viện, giục lên xe ngay | "Nếu thương thì gửi", "không gửi là chia tay" |
| 4. Phân biệt | Có lần chạm là bình thường | Bác sĩ khám bụng khi có mẹ ngồi cạnh (đáp án: được); anh họ cù lét quá tay, `{ten}` bảo dừng mà anh không dừng (đáp án: không được) | Chú Toàn ôm lâu, cả nhà bảo "người nhà cả mà" |
| 5. Giúp bạn | Trẻ là người nghe bạn kể | Mít thì thầm "chú ấy bảo đừng kể ai" | Vy lỡ gửi ảnh, giờ bị dọa tung lên nhóm lớp |

Màn bậc 4 có đáp án "trường hợp này được" là cần thiết. Thiếu loại màn này thì trẻ học thành sợ mọi cái chạm, và phụ huynh sẽ phản đối.

Cốt truyện 11-15 đi theo đúng các bước dụ dỗ qua mạng, mỗi màn là một bước của Khoa:

1. Game online: Khoa chơi cùng đội, khen `{ten}` chơi hay, tặng vật phẩm.
2. Tin nhắn: Khoa rủ chuyển sang nhắn riêng, hỏi chuyện trường lớp, "đừng kể bố mẹ, người lớn không hiểu đâu".
3. Tin nhắn: Khoa xin "ảnh mặc đồ ngủ thôi, có gì đâu".
4. Hẹn gặp: Khoa rủ ra quán gần trường, dặn đi một mình.

Chơi xong cả chuỗi, Tin chỉ lại cho trẻ thấy từng bước leo thang. Đây cũng là chỗ dùng "thám tử nhận chiêu" hợp nhất.

Màn bậc 5 về Vy bị dọa tung ảnh là chủ đề nặng. Lời kể chỉ nói "ảnh Vy lỡ gửi", không tả ảnh. Tin phải nói rõ là Vy không có lỗi, không trả tiền hay gửi thêm ảnh, kể với người lớn ngay và gọi 111. Màn này nên để Diệp đối chiếu tài liệu UNICEF trước khi viết.

Màn mới vẫn theo luật cũ: nhóm viết, nhóm duyệt rồi mới vào kho. Không thêm vào `eval/benchmark.csv`. Muốn đo màn mới thì dựng bộ câu thử riêng.

## 4. Gameplay

Vòng chơi đề xuất, từ lúc mở game:

```
Màn hình chính ─► Bản đồ (6-10) / Điện thoại (11-15) ─► Địa điểm ─► Màn chơi
      ▲                                                                │
      └── Sổ tay, Góc phụ huynh, Cài đặt ◄── Thẻ, Thám tử ◄┘
```

Các kiểu màn, mỗi phiên trộn 2–3 kiểu:

| Kiểu màn | Trẻ làm gì | AI làm gì | Nhóm tuổi |
|---|---|---|---|
| Tình huống tự kể | Nghe lời kể, nói hoặc gõ cách `{ten}` nên làm. Bí thì bấm "Gợi ý" | Chấm theo `key_actions`, hỏi lại nếu mơ hồ, gợi ý kiểu hỏi ngược | Cả hai |
| Hội thoại với người lạ | Nói chuyện qua lại, tối đa 3 lượt người lạ nói | Chế độ kịch bản: xếp câu của trẻ vào nhánh. Chế độ AI đóng vai: nói thay người lạ, qua đủ 9 lớp guardrail ở `game-flow.md` | Cả hai |
| Thám tử nhận chiêu | Kể lại người lạ đã dùng chiêu gì | Đối chiếu với `tactics_seen` | Cả hai |
| Bàn tay tin cậy | Mỗi ngón tay ghi một người trẻ sẽ tìm khi cần (chọn vai: mẹ, bố, cô chủ nhiệm, bác bảo vệ…) | Không dùng AI. Chỉ lưu vai trên máy, không lưu tên thật | 6-10 |
| Giúp bạn | Mít hoặc Vy kể chuyện, trẻ trả lời bạn | Chấm theo hành động: tin bạn, không hứa giữ bí mật xấu, cùng bạn đi kể người lớn | Cả hai |

"Bàn tay tin cậy" chạy hoàn toàn trên máy, không tốn tiền gọi model, và luyện đúng chỗ phiếu khảo sát 18 kể: trẻ không biết tìm ai khi cô đã về (`evidence/summary.md`).

Hai kiểu màn tạm gác vì khó làm và dễ lỗi: điện thoại giả lập có nút chặn, chụp màn hình, báo cáo cho trẻ bấm, và "Tập nói KHÔNG" đo độ to giọng trên máy. Chuỗi màn của Khoa ở nhóm 11-15 vẫn chơi bằng màn tự kể và màn hội thoại như bình thường.

Phần thưởng đi theo `de-xuat-tinh-nang.md` mục 1: thẻ chỉ cộng, không bị lấy lại; Tin lớn thêm một nấc hoặc có thêm một phụ kiện sau mỗi 2 thẻ; sai không bị trừ gì. Thêm 2 huy hiệu: "Thám tử" (nhận đủ chiêu của một màn hội thoại) và "Sáng cả bản đồ".

## 5. AI agent làm nhiều hơn

Hiện AI chỉ chấm và viết lời phản hồi. Đề xuất chia thành 6 vai. Vẫn chạy trên một agent ADK, mỗi vai là một prompt và bộ công cụ riêng, code gọi vai nào tùy lúc. Không tách thành nhiều agent tự nói chuyện với nhau, vì khó kiểm và tốn tiền.

| Vai | Làm gì | Dữ liệu dựa vào | Chặn rủi ro thế nào |
|---|---|---|---|
| Giám khảo | Trả kết luận có cấu trúc `{ket_luan, da_lam, con_thieu, can_hoi_lai}` trước, rồi người dẫn truyện mới viết lời | `key_actions`, `rule_ids`, `guidelines.json` | Sửa lỗi lượt 2 (B21 kết luận lệch expected, B24 bắt bẻ khi trẻ đúng): code giữ kết luận, model không tự đổi giữa chừng |
| Người dẫn truyện (Tin) | Viết lời phản hồi theo kết luận, nhắc lại chữ trẻ vừa nói, nhắc thẻ trẻ đã nhận ở màn trước ("Lúc ở công viên cậu đã gọi mẹ, giờ cũng vậy nhé") | Kết luận của giám khảo, lịch sử phiên | Postcheck như hiện tại. Không được đổi kết luận |
| Gợi ý | Hỏi ngược một câu khi trẻ bấm "Gợi ý" hoặc nói "không biết". Không đưa đáp án | `key_actions` còn thiếu | Tối đa 1 gợi ý mỗi lượt |
| Người lạ (khi người lớn bật) | Nói thay người lạ, nài theo đúng điều trẻ vừa nói | `persona`, `allowed_tactics`, câu mẫu trong `dialogue` | 9 lớp guardrail ở `game-flow.md`, gồm một lần gọi model riêng để kiểm duyệt; không qua thì dùng câu kịch bản |
| Đạo diễn | Chọn màn và bậc khó tiếp theo theo chỗ trẻ yếu; quyết khi nào dừng phiên vì trẻ mệt (trả lời cụt 3 lượt liền) | Kết quả các màn trong phiên | Code kiểm mã màn có thật, đúng tuổi, đúng giới, chưa chơi |
| Người viết báo cáo | Bản nháp cho phụ huynh: con làm tốt gì, còn lúng túng ở đâu, kèm câu trẻ thật sự nói ở màn khó nhất (đã che thông tin), một câu gợi ý mở lời | Kết quả phiên | Đã có, giữ trạng thái `cho_duyet` |

Màn do AI biến tấu (nấc A ở mục 4.5 của `de-xuat-tinh-nang.md`) nằm ở vai Đạo diễn, chỉ chạy khi người lớn bật và khi nhóm đã đồng ý đổi luật (mục 8).

Chi phí: vai Giám khảo thêm 1 lần gọi model mỗi lượt, AI đóng vai thêm 2 lần mỗi câu người lạ nói (sinh câu và kiểm duyệt). Với `openai/gpt-6-luna` mỗi phiên đang tốn khoảng $0,002 (`cost/simulate-1-summary.md`), có tăng gấp ba vẫn rất rẻ. Phải chạy lại `python run.py simulate` sau khi đổi và cập nhật `cost/cost-estimate.md`.

Đo chất lượng: chạy lại bộ 24 câu sau khi thêm vai Giám khảo để chắc không tụt so với lượt 2 (22/24). Vai Người lạ và Gợi ý cần bộ câu thử riêng, đặt ở `eval/extra/`, không trộn vào bộ đã khoá.

## 6. Giao diện

### Màn hình và điều hướng

| Màn hình | Có gì |
|---|---|
| Màn hình chính | Tin đứng giữa, nút lớn "Chơi tiếp", và các ô Bản đồ / Điện thoại, Sổ tay, Góc phụ huynh, Cài đặt |
| Tạo hồ sơ (người lớn làm) | Nhóm tuổi, giới tính (Nam hoặc Nữ, bắt buộc). Bật mic, bật AI đóng vai, bật màn AI biến tấu nằm sau khoá người lớn |
| Bản đồ 6-10 | 5 địa điểm, chỗ nào xong thì sáng đèn, Tin gợi ý nơi nên đi tiếp |
| Điện thoại 11-15 | Màn hình khoá rồi màn hình chính với 4 app; app có tin chưa đọc thì hiện chấm đỏ |
| Màn chơi | Như hiện tại, thay nút đáp án bằng nút mic lớn (giữ để nói), ô gõ, nút "Gợi ý", nút nghe lại |
| Sổ tay | Lưới thẻ quy tắc và thẻ chiêu, ô thẻ chưa nhận để mờ, bấm thẻ để lật và nghe đọc |
| Góc phụ huynh | Sau khoá người lớn. Bản nháp các phiên trên máy này, bật tắt tính năng, xoá tiến độ |

### Thanh trên cùng ở mọi màn chơi

Trái: nút Nhà (về Màn hình chính, hỏi lại "Thoát màn này? Tiến độ màn này chưa lưu" nếu đang giữa màn), nút Tạm dừng. Giữa: tiến độ. Phải: nút Cài đặt, nút "Con cần giúp" / "Mình cần giúp". Nút cần giúp không bao giờ bị che, kể cả khi đang mở hộp thoại.

### Cài đặt

- Ba thanh kéo âm lượng: nhạc nền, hiệu ứng, giọng đọc. Kéo về 0 là tắt hẳn, có nút tắt tiếng nhanh.
- Tốc độ đọc: chậm, vừa, nhanh.
- Cỡ chữ: vừa, lớn, rất lớn. Cỡ chữ thay đổi đi qua hook tự co chữ đang có, nên không tràn khung.
- Bật/tắt tự đọc to lời kể.
- Giảm chuyển động (tắt pháo giấy, tắt nhân vật nhún).
- Mic và các tính năng AI: chỉ hiện trạng thái, đổi thì phải qua khoá người lớn.
- Xoá tiến độ trên máy này (qua khoá người lớn).

Cài đặt và tiến độ lưu trong `localStorage` của trình duyệt, không gửi lên server, không gắn tên.

### Khoá người lớn

Một phép tính hai chữ số hiện bằng chữ ("mười bảy cộng tám bằng mấy?"). Trẻ 6-10 khó vượt, người lớn mất 3 giây. Dùng cho Góc phụ huynh, bật mic, bật AI, xoá tiến độ.

### Những thứ nhỏ nên có

- Tạm dừng thì nhạc nhỏ lại.
- Mất mạng thì hiện băng thông báo, vẫn cho mở Sổ tay và chơi Bàn tay tin cậy, vì hai phần này không cần AI.
- Tin chuyển sang dáng "đang nghe" khi trẻ giữ nút mic, dáng "đang nghĩ" khi chờ model.
- Bấm nút back của trình duyệt hay phím Esc thì mở menu tạm dừng, trang vẫn giữ nguyên.

### Giọng nói: nhận giọng và đọc to

**Nhận giọng (STT)** dùng Web Speech API có sẵn của trình duyệt, `SpeechRecognition` với `lang = "vi-VN"`, không cần key, không tốn tiền. Cách dùng:

- Giữ để nói (`continuous: false`). Nhấn nút mic thì `start()`, thả ra thì `stop()`. Không nghe liên tục suốt lúc chơi, vì trẻ vô tình nói gì cũng bị gửi đi.
- Bật `interimResults` để chữ hiện dần trong lúc trẻ nói. Thả nút xong, chữ chốt hiện trong ô với hai nút "Đúng rồi" và "Nói lại", sửa tay cũng được. Trẻ bấm "Đúng rồi" thì chữ mới đi vào `POST /api/answer` như chữ gõ, qua `precheck` và `mask_pii` y như cũ.
- Lỗi `not-allowed` (bị từ chối quyền mic) thì ẩn nút mic, chuyển sang ô gõ, không dừng game. Lỗi `network` thì báo "chưa nghe được, cậu gõ giúp tớ nhé". `no-speech` thì Tin nhắc "cậu nói to hơn chút nhé".
- Trình duyệt không hỗ trợ (Firefox) thì không hiện nút mic, ô gõ vẫn chạy.
- Bọc API trong `frontend/lib/speech.ts` thành hook React `useSpeechInput`.

Trên Chrome, âm thanh được gửi lên máy chủ Google để chuyển thành chữ. Phải ghi điều này vào `spec.md` §9 và `data/DATA_CARD.md`, và màn bật mic (sau khoá người lớn) có một dòng nói rõ "giọng nói được gửi tới Google để chuyển thành chữ, game không lưu âm thanh". Mic mặc định tắt. Nếu có thêm thời gian thì chuyển sang PhoWhisper của VinAI chạy trên server của nhóm để âm thanh không qua bên thứ ba.

**Đọc to (TTS)** gọi model qua OpenRouter, endpoint `POST /api/v1/audio/speech` (cùng dạng với API đọc của OpenAI, trả về mp3). Dùng chung `API_KEY` trong `.env` đang có.

- Trình duyệt không gọi thẳng OpenRouter. Thêm `POST /api/tts` vào `codebase/server.py`, nhận `text` và `voice`, gọi OpenRouter rồi trả mp3, để key không lộ ra giao diện.
- Chỉ đọc chữ của game: lời kể, lời Tin, lời người lạ, thẻ quy tắc, câu 111. Không đọc lại chữ trẻ gõ hay nói. Lời phản hồi đã qua `postcheck` và `mask_pii` trước khi đem đi đọc.
- Câu cố định (lời kể 11 màn, thẻ quy tắc, câu trong `data/lines.json`, câu 111) đọc sẵn một lần bằng script rồi lưu thành file trong `frontend/public/assets/voice/`. Lúc chơi chỉ gọi API cho lời phản hồi AI vừa viết. Server lưu tạm theo mã băm của câu để câu nào lặp lại thì không gọi lại.
- Mỗi nhân vật một giọng: Tin vui, nhanh vừa; người lạ giọng người lớn bình thường, không làm giọng đáng sợ; câu 111 đọc chậm, bình tĩnh. Model và giọng chọn từ danh sách `GET /api/v1/audio/speech/models`, phải nghe thử tiếng Việt trước, vì không phải model nào cũng đọc dấu tiếng Việt chuẩn.
- Gọi TTS lỗi hoặc chậm quá 4 giây thì dùng `speechSynthesis` của trình duyệt (giọng `vi`), máy không có giọng Việt thì chỉ hiện chữ. Chữ luôn hiện trên màn hình dù có đọc hay không.
- Chi phí đọc tính theo số ký tự hoặc thời lượng tùy model, phải ghi vào `cost/cost-estimate.md` sau khi chọn model.

## 7. Assets cần gen thêm

Mọi ảnh mới phải cùng nét với bộ hiện có: hoạt hình phẳng kiểu kawaii, viền nâu đậm (#4a2f22) dày đều, tô màu pastel, đổ bóng mềm rất nhẹ, mắt tròn má hồng, không chữ trong ảnh. Đầu mọi prompt ghép sẵn đoạn mô tả này:

```
Cute flat kawaii children's book illustration, thick even dark-brown outline (#4a2f22),
soft pastel palette (mint #9fe3c4, sunshine yellow #ffd45c, peach #ffb08f, sky blue #9bd8f5,
lilac #d6c1f7, cream #fffaf0), gentle soft shading, rounded shapes, friendly expressions,
Vietnamese everyday setting, no text, no watermark.
```

Nhân vật: nền trong suốt, khổ 672×900, đứng thẳng nhìn về trước, chân chạm đáy khung như `kid_610_girl_idle.webp`. Nền: 1376×768. Biểu tượng: nền trong suốt, 512×512. Sau khi gen, chạy lại script tạo `frontend/public/assets/manifest.json` và xem cả bộ trên một tờ để soát lệch nét.

Ưu tiên P0 là cần cho vòng chơi mới, P1 làm game đầy đủ hơn, P2 làm nếu còn giờ.

### Nhân vật

| Tên file | Mô tả | Ưu tiên |
|---|---|---|
| `kid_610_boy_*`, `kid_1115_boy_*` | Không gen mới: đổi tên từ `kid_*_neutral_*` đang có | đổi tên |
| `kid_610_*_talk`, `kid_1115_*_talk` | Nhân vật chính đang nói, tay đưa ra, dùng khi phát lời trẻ vừa nói | P1 |
| `kid_610_*_worried`, `kid_1115_*_worried` | Hơi lo, không khóc, không sợ hãi | P1 |
| `npc_mit` | Bạn thân của Bin/Na, 8 tuổi, tóc xoăn, áo kẻ sọc (khác áo vàng của Bin) | P0 |
| `npc_vy` | Bạn thân của Khôi/Mai, 13 tuổi, tóc buộc cao (khác kiểu tóc của Mai) | P0 |
| `npc_mom`, `npc_dad` | Mẹ, bố của nhân vật chính, nửa người như các NPC hiện có | P0 |
| `npc_uncle_hai` | Chú Hải hàng xóm, 40 tuổi, áo ba lỗ, trông bình thường thân thiện | P0 |
| `npc_uncle_toan` | Chú Toàn, chú họ 50 tuổi, áo sơ mi, trông bình thường | P1 |
| `npc_teacher_thuy` | Cô chủ nhiệm cấp 2 | P1 |
| `npc_doctor` | Bác sĩ nhi, áo blouse, ống nghe, cười hiền (màn bậc 4) | P1 |
| `npc_cousin_teen` | Anh họ 14 tuổi (màn cù lét) | P2 |
| `npc_stranger_shipper` | Người lạ mặc áo khoác giống shipper, mũ bảo hiểm cầm tay, trông bình thường | P1 |
| `owl_stage_{1,2,3,4}` | Tin lớn dần, hoặc giữ cỡ và thêm phụ kiện: mũ thám hiểm, ba lô, đèn lồng, áo choàng | P0 |
| `narrator_listen`, `narrator_think`, `narrator_phone` | Tin nghiêng đầu nghe, Tin chống cằm nghĩ, Tin cầm điện thoại | P0 |

Luật vẽ người quen và người lạ giữ như `game-flow.md`: trông bình thường, thân thiện, không vẽ thành kẻ xấu dễ nhận ra.

### Nền và bản đồ

| Tên file | Mô tả | Ưu tiên |
|---|---|---|
| `map_610_day` | Bản đồ xóm nhìn từ trên: nhà của nhân vật chính, nhà bà, công viên, bể bơi, trường. Không có chỗ nào trông đáng sợ | P0 |
| `map_pin_{home,grandma,park,pool,school}_{off,on}` | Ghim địa điểm, bản tắt và bản sáng đèn | P0 |
| `phone_frame_1115` | Khung điện thoại dọc, màn hình trống để code vẽ app lên | P0 |
| `app_{game,chat,classgroup,family}` | Biểu tượng 4 app của điện thoại Khôi/Mai | P0 |
| `bg_home_morning` | Bếp nhà nhân vật chính buổi sáng | P1 |
| `bg_grandma_house` | Nhà bà, có bàn thờ, dịp giỗ | P1 |
| `bg_neighborhood_alley` | Ngõ xóm, sân nhỏ có quả bóng | P1 |
| `bg_clinic` | Phòng khám nhi sáng sủa | P1 |
| `bg_school_gate_evening` | Cổng trường lúc chiều muộn, vắng hơn | P2 |
| `bg_home_hub` | Màn hình chính: phòng của nhân vật chính hoặc góc học tập ấm áp | P1 |

### Giao diện

| Tên file | Mô tả | Ưu tiên |
|---|---|---|
| `icon_rule_R01` đến `icon_rule_R11` | Biểu tượng cho 11 thẻ quy tắc. Đã có 4 (đồ bơi, bí mật, người lớn tin cậy, khiên mạng), cần thêm 7 | P0 |
| `icon_tactic_*` (8 cái) | Biểu tượng 8 chiêu: đồng hồ (giục gấp), hộp quà (cho quà), ngón tay suỵt (dặn bí mật), điện thoại có dấu chấm than (nói bố mẹ gặp chuyện), tay bắt tay (tự nhận người quen), viên kim cương game (hứa vật phẩm), trái tim nứt (ép bằng tình cảm), ghim bản đồ (rủ gặp riêng) | P0 |
| `card_back_tactic` | Mặt sau thẻ chiêu, khung riêng màu khác thẻ quy tắc | P0 |
| `notebook_cover`, `notebook_page`, `card_slot_empty` | Bìa sổ tay, trang sổ có ô thẻ, ô thẻ chưa nhận | P0 |
| `btn_mic_idle`, `btn_mic_recording` | Nút mic lớn, bản thường và bản đang thu (vòng sáng) | P0 |
| `btn_hint` | Bóng đèn nhỏ | P0 |
| `btn_home`, `btn_settings`, `btn_pause`, `btn_back`, `btn_replay_voice` | Bộ nút điều hướng tròn, cùng viền nâu | P0 |
| `icon_lock_adult` | Ổ khoá có hình người lớn, cho khoá người lớn | P1 |
| `hand_trusted_5` | Bàn tay xòe 5 ngón, mỗi ngón có ô trống | P1 |
| `badge_detective`, `badge_map_complete` | 2 huy hiệu mới | P1 |

### Âm thanh

| Tên | Dùng ở đâu | Ưu tiên |
|---|---|---|
| `sfx_mic_on`, `sfx_mic_off` | Bắt đầu và thả nút mic | P0 |
| `sfx_page_turn`, `sfx_card_flip` | Sổ tay | P1 |
| `sfx_map_light` | Địa điểm sáng đèn | P1 |
| Nhạc nền riêng cho bản đồ và màn hình chính | Đổi nhạc theo nơi | P2 |

Bộ hiệu ứng hiện tại lấy từ Kenney (CC0, `frontend/public/assets/audio/CREDITS.txt`). Âm thanh mới nên lấy cùng nguồn để cùng chất tiếng.

Giọng đọc làm bằng TTS qua OpenRouter theo mục 6 "Giọng nói". Câu cố định đọc sẵn thành file trong `frontend/public/assets/voice/`, đặt tên theo mã câu (vd `S6-01_situation.mp3`, `rule_R03.mp3`, `hotline_610.mp3`).

## 8. Những chỗ phải chốt trước khi làm

| Việc | Đụng gì | Đề xuất của bản này |
|---|---|---|
| Đổi lát cắt từ "bấm đáp án hoặc tự gõ" sang "tự trả lời, gõ hoặc nói" | `spec.md` §4, `docs/game-flow.md` | Đổi, ghi changelog |
| Màn do AI biến tấu tới tay trẻ (nấc A) | Luật "không đưa màn AI tạo cho trẻ" ở `spec.md` §4 | Chỉ làm sau khi cả nhóm đồng ý; mặc định tắt, người lớn bật |
| Nhận giọng và đọc to | Riêng tư, chi phí | Nhận giọng bằng Web Speech API của trình duyệt (âm thanh qua máy chủ Google, ghi vào §9, mic mặc định tắt). Đọc to bằng TTS qua OpenRouter, server làm trung gian giữ key. Còn phải chọn model đọc tiếng Việt chuẩn |
| Đổi tên nhân vật trong 11 màn | `data/scenarios.json` | Đổi; benchmark dùng lời kể riêng nên không ảnh hưởng |
| Bỏ lựa chọn "Không muốn nói", giới tính thành bắt buộc | `docs/game-flow.md` mục "Giới tính", `spec.md` §9, giao diện, `game.py` | Bỏ. Giới tính vẫn chỉ nằm trong phiên, không gửi cho model, không ghi vào bản nháp cho phụ huynh |
| Vai Giám khảo có cấu trúc | Luồng `agent.py`, kết quả eval | Làm, rồi chạy lại 24 câu thành lượt mới, ghi vào `eval/README.md` mục 5. Không sửa `run-2`, `run-3` |

## 9. Thứ tự làm gợi ý

1. Xưng hô mới, `BANNED_OUTPUT` thêm biến thể, `data/lines.json` (nhanh, ít rủi ro).
2. Dàn nhân vật: 4 nhân vật chính, lời kể dùng `{ten}`, bỏ "Không muốn nói", đổi tên ảnh `neutral` thành `boy`, gen P0 nhân vật phụ.
3. Bỏ nút đáp án, thêm "Gợi ý", vai Giám khảo có cấu trúc, chạy lại 24 câu.
4. Thanh trên cùng, Cài đặt, khoá người lớn, Màn hình chính.
5. Bản đồ 6-10, Điện thoại 11-15, Sổ tay, Tin lớn dần.
6. Màn hội thoại người lạ chế độ kịch bản, Thám tử nhận chiêu, chuỗi màn của Khoa.
7. Mic giữ để nói bằng Web Speech API, bước xác nhận chữ; `POST /api/tts` qua OpenRouter, đọc sẵn câu cố định thành file.
8. Màn bậc 4 và bậc 5, Bàn tay tin cậy.
9. AI đóng vai người lạ và màn AI biến tấu, chỉ khi các bước trên đã ổn và nhóm đã chốt mục 8.
