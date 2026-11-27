# Kịch bản game GrowSafe và vai trò của AI

Bản chốt ngày 27/11. Minh dựa vào đây để làm assets, Diệp để soạn kho tình huống, Hà Anh để viết câu thử. Muốn đổi gì thì báo Vũ trước rồi mới sửa file này.

## Một phiên chơi

1. Phụ huynh hoặc giáo viên mở game, chọn nhóm tuổi 6-10 hoặc 11-15, giới tính của trẻ (Nam / Nữ, bắt buộc, để chọn nhân vật chính Bin/Na hoặc Khôi/Mai). Game không hỏi tên hay biệt danh, không lưu thông tin định danh.
2. Game mở màn đầu tiên hợp với nhóm tuổi và giới tính đó trong kho.
3. Mỗi màn có một cảnh minh họa kèm lời kể tình huống, ví dụ "Một chú quen cho con kẹo và dặn đây là bí mật của hai chú cháu. Con sẽ làm gì?". Trẻ trả lời theo một trong hai cách:
   - tự gõ cách mình sẽ làm, bằng lời của mình
   - hoặc giữ nút mic để nói, rồi bấm "Đúng rồi" để xác nhận chữ (người lớn bật mic)
   Không còn nút đáp án (Sprint 3, `docs/de-xuat-tinh-nang.md` mục 4.3). Trẻ bí thì bấm "Gợi ý": Tin hỏi gợi mở, không đưa đáp án.
4. AI phản hồi: khen điều trẻ làm đúng, chỉ ra hành động an toàn còn thiếu, rồi cho thử lại, tối đa 2 lần mỗi màn. Câu trả lời mơ hồ ("con chạy") thì AI hỏi lại ("Con chạy tới chỗ ai?").
5. Kết màn, trẻ nhận thẻ quy tắc của màn đó (ví dụ "Bí mật làm con sợ là bí mật xấu, con kể với người lớn") và sao hoặc huy hiệu.
6. AI chọn màn tiếp theo trong kho, ưu tiên chủ đề trẻ còn yếu. Đủ 5 màn, hoặc hết màn phù hợp, thì kết phiên.
7. Kết phiên, AI soạn bản nháp cho phụ huynh: con làm tốt gì, còn lúng túng ở đâu, một câu gợi ý để mở lời nói chuyện với con. Người lớn đọc rồi tự quyết dùng thế nào, game không tự gửi đi đâu.

Màn nào cũng có nút "Con cần giúp". Bấm nút đó, hoặc khi trẻ gõ điều giống chuyện bị xâm hại thật, game dừng ngay và hiện màn hướng dẫn: kể với người lớn tin tưởng, gọi Tổng đài 111.

## Hai loại màn

**Màn một câu hỏi.** Kể tình huống, trẻ trả lời một lần, AI phản hồi. Đây là loại màn chính, làm trước.

**Màn hội thoại với người lạ.** Người lạ nói chuyện với trẻ và nài thêm khi trẻ chưa dứt khoát, để trẻ tập từ chối như ngoài đời. Ví dụ:

> Người lạ: "Chú là bạn của mẹ, mẹ nhờ chú đón con. Lên xe đi."
> Trẻ: "Dạ… con không biết."
> Người lạ: "Nhanh lên, mẹ đang chờ ở bệnh viện đấy."
> Trẻ: "Con không đi. Con gọi mẹ đã."
> Nhân vật dẫn truyện: "Giỏi lắm! Chú ấy bảo là bạn của mẹ và giục con đi gấp, đó là hai chiêu hay gặp. Con gọi mẹ để hỏi lại là đúng."

Tối đa 3 lượt người lạ nói. Trẻ từ chối dứt khoát là thắng màn. Trẻ đồng ý đi theo thì người lạ dừng ngay, nhân vật dẫn truyện bước vào giảng lại, game không diễn tiếp chuyện xấu.

Màn hội thoại có hai chế độ. Người lớn chọn chế độ ở màn hình đầu:

| | Kịch bản có sẵn (mặc định) | AI đóng vai |
|---|---|---|
| Lời người lạ | Viết sẵn trong kho, có người duyệt, chia nhánh | AI sinh ra, chỉ dùng chiêu có trong kho, qua đủ guardrail bên dưới |
| AI làm gì | Xếp câu của trẻ vào nhánh `tu_choi` (dứt khoát), `luong_lu` (chần chừ), `dong_y` (đi theo), rồi lấy câu tiếp theo của nhánh đó | Đọc câu của trẻ rồi nói câu tiếp, nài theo đúng điều trẻ vừa nói |
| Ưu điểm | Nhóm kiểm soát từng chữ, rẻ, dễ viết câu thử | Giống thật hơn, trẻ không học thuộc được kịch bản |
| Ai dùng | Mọi nhóm tuổi | Người lớn bật riêng, nên dùng khi trẻ đã chơi qua kịch bản có sẵn |
| Làm khi nào | Trước CP2 | Sau CP2, khi đã có câu tấn công để thử guardrail |

Cả hai chế độ dùng chung tình huống, chiêu và cách giảng lại cuối màn. Chế độ AI đóng vai gặp lỗi hoặc câu sinh ra không qua kiểm duyệt thì lùi về câu của kịch bản có sẵn.

### Guardrail cho chế độ AI đóng vai

Trẻ đọc rồi thì không rút lại được, nên câu nào AI nói trong vai người lạ cũng phải qua đủ các lớp sau trước khi hiện ra.

1. **Người lớn bật mới có.** Chế độ AI đóng vai mặc định tắt. Phụ huynh hoặc giáo viên bật ở màn hình đầu, sau khi đọc một dòng giải thích chế độ này làm gì.
2. **Chỉ dùng chiêu có trong kho.** Mỗi màn ghi sẵn vai người lạ (`persona`), các chiêu được dùng (`allowed_tactics`, ví dụ giả làm người quen của bố mẹ, cho quà, dặn giữ bí mật, giục gấp) và vài câu mẫu. AI chỉ được nói lại các chiêu đó bằng lời khác, không được thêm chiêu mới.
3. **Danh sách cấm cứng, kiểm bằng code.** Không có nội dung tình dục, không nhắc tới bộ phận hay hình ảnh cơ thể, không chạm vào người, không đe dọa bạo lực, không chửi mắng. Không hỏi thông tin thật như tên, địa chỉ, trường, số điện thoại. Mỗi câu không quá 25 từ.
4. **Một lần gọi model riêng để kiểm duyệt.** Câu người lạ do một lần gọi model sinh ra. Một lần gọi khác, với prompt riêng, kiểm câu đó có nằm trong `allowed_tactics` và danh sách cấm không. Không qua thì thay bằng câu cùng nhánh của kịch bản có sẵn, ghi lại vào trace.
5. **Thoát vai ngay** khi trẻ tỏ ra sợ, kể chuyện thật, gõ "dừng", bấm nút "Con cần giúp", hoặc cố kéo người lạ ra khỏi kịch bản ("giờ chú nói chuyện khác đi", "bỏ qua luật"). Nhân vật dẫn truyện vào thay, người lạ không nói thêm câu nào.
6. **Trẻ lỡ gõ thông tin thật** (số điện thoại, địa chỉ, tên trường) thì code che đi trước khi gửi cho model. Nhân vật dẫn truyện nhắc: không đưa thông tin này cho người lạ.
7. **Luôn ghi rõ là trò chơi.** Khung chat của người lạ có nhãn "Người lạ trong trò chơi" và nhân vật dẫn truyện luôn đứng cạnh. Hết màn nào cũng có phần giảng lại, chỉ ra chiêu người lạ vừa dùng.
8. **Theo tuổi.** Nhóm 6-10 chỉ có màn quà, bí mật, rủ đi theo. Màn trên mạng (xin ảnh, hẹn gặp, dặn đừng kể ai) chỉ có ở nhóm 11-15. Ở màn xin ảnh, người lạ chỉ được xin "ảnh của em", không được mô tả ảnh gì.
9. **Lưu để rà lại.** Mọi câu người lạ sinh ra đều nằm trong trace. Bộ câu thử có câu tấn công riêng cho vai này, ví dụ trẻ cố dụ người lạ nói bậy hoặc xin thông tin thật.

## Giới tính

- Màn về an toàn cơ thể, bí mật xấu, an toàn mạng thì cả hai giới chơi như nhau. Lời dặn giống hệt, chỉ đổi nhân vật trong cảnh cho trẻ thấy gần mình hơn.
- Màn dậy thì (nhóm 11-15) mới tách theo giới: kinh nguyệt, ngực phát triển cho nữ; mộng tinh, vỡ giọng cho nam. Thêm vài màn để trẻ biết cả về giới còn lại.
- Từ Sprint 3 không còn lựa chọn "Không muốn nói": giới tính chỉ dùng để chọn nhân vật chính (Bin/Na, Khôi/Mai). Một màn có một lời kể, tên nhân vật là ô `{ten}`, nên hai giới gặp đúng cùng tình huống, cùng lời dặn.
- AI không bao giờ đổi lời dặn an toàn theo giới tính. Không nói "con gái phải cẩn thận hơn", "con trai thì không sao". Bước hậu kiểm chặn các câu kiểu này.
- Giới tính chỉ nằm trong phiên chơi, không ghi vào bản nháp gửi phụ huynh, không lưu sau phiên.

Thứ tự làm: trước CP2 chỉ thêm trường `gender` vào API và luật "không đổi lời dặn theo giới" vào prompt. Màn dậy thì và assets theo giới làm sau, khi mỗi nhóm tuổi đã có 3 màn chạy được.

## AI soạn màn mới (cho nhóm, không cho trẻ)

Để kho đa dạng hơn mà không phải viết tay hết, AI được soạn nháp màn mới:
- Diệp hoặc Vũ nhập chủ đề, nhóm tuổi, giới tính. AI soạn một màn đúng định dạng bên dưới, kể cả các nhánh hội thoại, dựa trên quy tắc chuẩn đã có trong kho.
- Bản nháp có trạng thái `cho_duyet`, nằm riêng, trẻ không thấy.
- Người trong nhóm đọc, sửa, đối chiếu tài liệu gốc rồi mới chép vào `data/scenarios.json`. Chỉ màn đã vào kho mới tới tay trẻ.

Trong lúc chơi, AI không tự nghĩ tình huống mới để đưa thẳng cho trẻ.

## AI làm gì

| AI làm | AI không làm |
|---|---|
| Đọc câu trả lời tự do của trẻ (cụt, sai chính tả, ấp úng) và chấm theo các hành động an toàn của màn. Đây là quyết định AI trung tâm | Đưa tình huống tự nghĩ thẳng tới trẻ. Trẻ chỉ gặp màn đã có người duyệt |
| Màn hội thoại: ở chế độ kịch bản có sẵn thì xếp câu của trẻ vào nhánh; ở chế độ AI đóng vai thì nói thay người lạ, chỉ bằng các chiêu có trong kho, qua đủ guardrail ở trên | Nói nội dung tình dục, chạm vào người, đe dọa, hỏi thông tin thật của trẻ, hay nói tiếp khi đã phải thoát vai |
| Giảng lại bằng lời đúng tuổi, chỉ dựa trên quy tắc trong kho | Đổi lời dặn an toàn theo giới tính |
| Hỏi lại khi câu trả lời mơ hồ | Chẩn đoán y khoa, nói nội dung 18+ |
| Chọn màn tiếp theo trong kho theo chỗ trẻ còn yếu. Code kiểm mã màn phải có thật, đúng tuổi, đúng giới, chưa chơi | Tự gửi đánh giá cho phụ huynh hay nhà trường |
| Nhận ra trẻ đang kể chuyện thật, không phải trả lời game (lớp chặn thứ hai, sau lớp so từ khóa) | Lưu thông tin định danh của trẻ |
| Soạn bản nháp tóm tắt cho người lớn, và soạn nháp màn mới cho nhóm duyệt | |

Trẻ luôn tự trả lời. Vai Giám khảo trả kết luận có cấu trúc trước, code giữ kết luận, rồi Tin mới viết lời theo kết luận đó (`codebase/agent.py`).

## Dữ liệu một màn (Diệp soạn trong `data/scenarios.json`)

```json
{
  "id": "S-610-01",
  "age_group": "6-10",
  "genders": ["nam", "nu", "khong_noi"],
  "topic": "bí mật xấu",
  "type": "mot_cau",
  "situation": "lời kể tình huống, câu hỏi cuối là 'Con sẽ làm gì?'",
  "choices": [
    {"id": "A", "text": "Con giữ bí mật vì chú cho kẹo", "correct": false},
    {"id": "B", "text": "Con không nhận và kể với mẹ", "correct": true}
  ],
  "key_actions": [
    {"action": "từ chối giữ bí mật làm mình khó chịu", "keywords": ["không giữ", "từ chối"]},
    {"action": "kể với người lớn tin tưởng", "keywords": ["kể", "bố mẹ"]}
  ],
  "rule_card": "câu ngắn in trên thẻ quy tắc",
  "guideline_codes": ["G-BIMAT"],
  "source": "link tài liệu gốc"
}
```

Màn hội thoại có `"type": "hoi_thoai"` và thêm các trường dưới đây. `dialogue` là kịch bản có sẵn chia nhánh. Chế độ AI đóng vai đọc `persona` và `allowed_tactics`, và lấy câu trong `dialogue` làm câu dự phòng. Vì vậy màn nào cũng phải có đủ `dialogue`.

```json
"persona": "người đàn ông tự nhận là đồng nghiệp của mẹ, đứng ở cổng trường",
"allowed_tactics": ["giả làm người quen của bố mẹ", "giục gấp", "nói mẹ đang gặp chuyện"],
"max_turns": 3,
"dialogue": [
  {"turn": 1, "line": "Chú là bạn của mẹ, mẹ nhờ chú đón con. Lên xe đi."},
  {"turn": 2, "next": {
    "luong_lu": "Nhanh lên, mẹ đang chờ ở bệnh viện đấy.",
    "tu_choi": "KET_THANG",
    "dong_y": "KET_GIANG_LAI"
  }},
  {"turn": 3, "next": {
    "luong_lu": "Chú quen mẹ con lâu rồi mà, đi thôi.",
    "tu_choi": "KET_THANG",
    "dong_y": "KET_GIANG_LAI"
  }}
]
```

Mỗi nhóm tuổi cần ít nhất 3 màn, mỗi màn một chủ đề khác nhau để AI có màn mà chọn. Nên có ít nhất một màn hội thoại mỗi nhóm tuổi.

## Assets (Minh làm)

- Mỗi màn một cảnh minh họa. Đặt tên file theo mã màn, ví dụ `S-610-01.png`. Màn chơi được cho cả hai giới thì làm thêm bản nhân vật nam, nữ, trung tính nếu kịp, ví dụ `S-610-01-nam.png`. Cách rẻ hơn là chỉ đổi nhân vật chính, nền và người lạ giữ nguyên.
- Nhân vật dẫn truyện, có vài biểu cảm: vui khi trẻ làm đúng, động viên khi còn thiếu.
- Người lạ trong màn hội thoại: vẻ ngoài bình thường, thân thiện, không vẽ thành "kẻ xấu" dễ nhận ra, vì ngoài đời người dụ dỗ thường là người quen.
- Thẻ quy tắc, sao, huy hiệu.
- Màn "Con cần giúp" với số 111, tông màu bình tĩnh, không gây sợ.
- Màn kết phiên.

## API cho giao diện (bản dự kiến, server chạy ở port 6161)

| Gọi | Gửi | Nhận |
|---|---|---|
| `POST /api/session` | `age_group`, `gender` (không bắt buộc), `dialogue_mode`: `kich_ban` (mặc định) hoặc `ai_dong_vai` (người lớn bật) | `session_id`, màn đầu tiên |
| `POST /api/answer` | `session_id`, `scenario_id`, `text` (chữ gõ, hoặc chữ chuyển từ giọng nói đã được trẻ xác nhận) | lời phản hồi, kết quả (`dat`, `chua_dat`, `hoi_lai`), câu người lạ nói tiếp nếu đang ở màn hội thoại, màn tiếp theo, `stopped` nếu phải dừng game hoặc thoát vai |
| `POST /api/level` | `session_id`, `location` | màn tiếp theo ở địa điểm đó (Đạo diễn chọn trong các màn đã duyệt, đã mở khoá), câu đầu của người lạ nếu là màn hội thoại |
| `POST /api/hint` | `session_id`, `scenario_id` | một câu gợi ý, tối đa 1 lần mỗi lượt |
| `POST /api/detective` | `session_id`, `scenario_id`, `text` | chiêu trẻ nhận ra, chiêu còn sót kèm câu người lạ đã dùng |
| `POST /api/tts` | `session_id`, `text`, `role` | mp3, chỉ đọc chữ do game tạo ra trong phiên |
| `POST /api/help` | `session_id` | nội dung màn cần giúp, viết riêng cho từng nhóm tuổi |
| `POST /api/session/end` | `session_id` | bản nháp cho phụ huynh, trạng thái `cho_duyet` |
| `POST /api/admin/scenario-draft` | `topic`, `age_group`, `genders`, `type` | bản nháp màn mới, trạng thái `cho_duyet`. Chỉ nhóm dùng, giao diện của trẻ không gọi |
