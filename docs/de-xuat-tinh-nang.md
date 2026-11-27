# Đề xuất 3 tính năng giữ chân người chơi

Bản đề xuất ngày 27/11, chờ Vũ duyệt rồi mới chép vào `docs/game-flow.md`. Mục 1–3 là tính năng mới, chủ yếu là giao diện và assets. Mục 4 là các chỗ cần sửa trong thiết kế hiện tại: xưng hô, câu thoại, bỏ trắc nghiệm, dùng mic và loa, màn chơi do AI tạo dưới kiểm duyệt. Mục 4 có đổi luồng AI, nên đọc kỹ phần ảnh hưởng.

## 1. Sổ tay thẻ quy tắc và linh vật lớn dần

**Cách chơi.** Xong một màn, trẻ nhận thẻ quy tắc của màn đó và thẻ được cất vào "sổ tay an toàn". Trẻ mở sổ tay lúc nào cũng được để đọc lại. Linh vật dẫn truyện lớn thêm một nấc, hoặc có thêm một phụ kiện, sau mỗi 2 thẻ.

**Vì sao.** Khảo sát có 10/20 người nói trẻ nghe dặn xong là quên (`evidence/summary.md`). Sổ tay cho trẻ một lý do để quay lại đọc quy tắc mà không thấy như đang học bài.

**Dữ liệu.** Không cần thêm. Mỗi màn trong `data/scenarios.json` đã có `rule_ids`. Nội dung thẻ lấy từ `data/guidelines.json`: `title` làm tên thẻ, `loi_6_10` hoặc `loi_11_15` làm lời trên thẻ. Có 12 quy tắc (R01–R12), tức tối đa 12 thẻ. Riêng R12 (trẻ kể chuyện thật thì dừng game) không làm thành thẻ để sưu tầm.

**Luật.**
- Thẻ chỉ được cộng, không bao giờ bị lấy lại. Trả lời sai thì vẫn nhận thẻ sau khi nghe giảng lại.
- Linh vật không bao giờ buồn, ốm hay bỏ đi vì trẻ trả lời sai.
- Tiến độ sổ tay chỉ lưu trên máy (mã thẻ đã nhận), không gửi lên server, không gắn với tên hay tài khoản.

**Assets (Minh).** 11 mặt thẻ (R01–R11) theo một khung chung · linh vật 4 nấc lớn hoặc 4 phụ kiện · trang sổ tay có ô trống cho thẻ chưa nhận.

## 2. Thám tử nhận chiêu

**Cách chơi.** Hết màn hội thoại với người lạ, nhân vật dẫn truyện hỏi: "Người lạ vừa làm gì để rủ cậu đi?". Trẻ tự kể bằng lời của mình, gõ hoặc nói (không có thẻ để chọn, xem mục 4.3). Kể ra được chiêu nào thì nhận thẻ chiêu đó vào sổ tay. Còn sót chiêu nào thì nhân vật dẫn truyện chỉ ra chiêu đó và câu người lạ đã dùng nó.

**Vì sao.** Trẻ đổi từ vai người bị dụ sang vai người phát hiện ra chiêu, nên thấy mình giỏi chứ không sợ. `game-flow.md` đã yêu cầu cuối màn phải "chỉ ra chiêu người lạ vừa dùng". Tính năng này biến bước đó thành câu hỏi để trẻ tự làm.

**Dữ liệu (Diệp).** Thêm trường `tactics` cho từng câu trong `dialogue`, để code biết trẻ đã thực sự gặp chiêu nào trên nhánh mình đi:

```json
{"turn": 1, "line": "Chú là bạn của mẹ, mẹ nhờ chú đón con. Lên xe đi.",
 "tactics": ["gia_quen_bo_me"]},
{"turn": 2, "next": {
  "luong_lu": {"line": "Nhanh lên, mẹ đang chờ ở bệnh viện đấy.",
               "tactics": ["giuc_gap", "noi_me_gap_chuyen"]},
  "tu_choi": "KET_THANG",
  "dong_y": "KET_GIANG_LAI"
}}
```

Đáp án đúng là các chiêu đã xuất hiện trên nhánh trẻ đi qua. Chấm hai bước: code so khớp từ khóa của từng chiêu trước (vd `giuc_gap`: "giục", "nhanh lên", "vội"); chiêu nào chưa khớp thì mới gọi model đối chiếu lời của trẻ với `tactics_seen`. Mỗi chiêu cần thêm trường `keywords`.

Danh sách chiêu đề xuất (mã · tên trên thẻ · nhóm tuổi):

| Mã | Tên trên thẻ | Nhóm tuổi |
|---|---|---|
| `gia_quen_bo_me` | Tự nhận là người quen của bố mẹ | 6-10, 11-15 |
| `giuc_gap` | Giục đi thật nhanh | 6-10, 11-15 |
| `noi_me_gap_chuyen` | Nói bố mẹ đang gặp chuyện | 6-10, 11-15 |
| `cho_qua` | Cho quà, cho kẹo | 6-10, 11-15 |
| `dan_bi_mat` | Dặn giữ bí mật, đừng kể ai | 6-10, 11-15 |
| `hua_vat_pham` | Hứa tặng đồ trong game | 11-15 |
| `ep_bang_tinh_cam` | "Nếu thương thì phải làm" | 11-15 |
| `ru_gap_rieng` | Rủ gặp riêng | 11-15 |

Danh sách này phải khớp với `allowed_tactics` của các màn hội thoại. Chiêu mới chỉ được thêm vào sau khi nhóm duyệt.

**Luật.**
- Mặt sau thẻ chiêu chỉ ghi **cách nhận ra** và **một câu đáp lại** (vd "Con gọi mẹ để hỏi đã"). Không ghi cách dụ chi tiết.
- Kể sai hoặc không nhớ thì không bị trừ gì, chỉ chưa nhận thẻ.

**Assets (Minh).** 8 thẻ chiêu, có biểu tượng dễ hiểu cho trẻ 6-10 chưa đọc giỏi (vd đồng hồ cho `giuc_gap`, hộp quà cho `cho_qua`).

## 3. Bản đồ "Một ngày của Bin"

**Cách chơi.** Màn chọn màn là một bản đồ. Mỗi địa điểm mở ra các màn ở nơi đó. Xong hết màn của một địa điểm thì nơi đó sáng đèn. AI vẫn gợi ý địa điểm tiếp theo theo chủ đề trẻ còn yếu (bước 6 trong "Một phiên chơi"), nhưng trẻ được bấm chọn nơi khác.

**Vì sao.** Trẻ thấy mình đang đi một hành trình và muốn mở hết bản đồ. Bản đồ có cả nhà và nhà người thân, để trẻ nhớ chuyện không an toàn có thể xảy ra ở bất cứ đâu, không chỉ với người lạ.

**Gán màn hiện có vào địa điểm (Diệp kiểm lại).** Phần lớn gán theo lời kể của màn. Riêng S6-02 lời kể không nói ở đâu, nhóm tự gán vào "Xóm nhà".

Nhóm 6-10, bản đồ "Một ngày của Bin":

| Địa điểm | Màn | Chủ đề |
|---|---|---|
| Xóm nhà | S6-01 Chú hàng xóm · S6-02 Kẹo và bí mật | vùng riêng tư · bí mật |
| Nhà bà | S6-04 Bà muốn hôn má | ranh giới với người thân |
| Công viên | S6-03 Người lạ ở cổng công viên | người lạ |
| Bể bơi | S6-05 Thay đồ ở bể bơi | vùng riêng tư |
| Trường | S6-06 Tan học, cô về rồi | người lớn tin cậy |

Nhóm 11-15 có 4/5 màn là an toàn trên mạng, nên bản đồ là **chiếc điện thoại** với các "ứng dụng" làm địa điểm. Tên nhân vật cho nhóm này nhóm tự đặt.

| Địa điểm | Màn |
|---|---|
| Game online | S11-01 Vật phẩm trong game |
| Tin nhắn | S11-02 Hẹn gặp người quen qua mạng · S11-03 Nếu thương thì gửi đi |
| Nhóm chat lớp | S11-05 Ảnh chụp lén trong nhóm chat lớp |
| Nhà họ hàng (ngoài điện thoại) | S11-04 Người họ hàng hay ôm lâu |

**Dữ liệu.** Thêm một trường `location` vào mỗi màn trong `data/scenarios.json`. Code kiểm mã màn và địa điểm phải có thật, đúng tuổi, đúng giới, như luật chọn màn hiện có.

**Luật.**
- Bản đồ tươi sáng, không vẽ nơi nào thành "chỗ nguy hiểm". Nhà và nhà bà vẫn là nơi ấm áp.
- Nút "Con cần giúp" luôn hiện trên bản đồ, không gắn điểm hay phần thưởng.
- Địa điểm chưa có màn thì ẩn, không hiện ô khoá trống.

**Assets (Minh).** 1 bản đồ 5 địa điểm cho nhóm 6-10 · 1 màn hình điện thoại 4 ô cho nhóm 11-15 · trạng thái tắt/sáng đèn cho mỗi địa điểm.

## 4. Phần cần sửa trong thiết kế hiện tại

### 4.1. Xưng hô

**Hiện tại.** Prompt trong `codebase/agent.py` cho AI xưng "mình", gọi trẻ "con" (6-10) hoặc "em" (11-15). Nhưng các câu viết sẵn trong `codebase/guardrails.py` (`HOTLINE_MESSAGE`, `SAFE_FALLBACK`) luôn gọi "con", kể cả với trẻ 11-15. Nút "Con cần giúp" cũng dùng chung cho cả hai nhóm tuổi. "Mình – con" nghe như người lớn dạy bảo, trẻ 11-15 dễ thấy bị coi là trẻ con.

**Đề xuất (nhóm chốt):**

| Ai nói | 6-10 tuổi | 11-15 tuổi |
|---|---|---|
| Linh vật dẫn truyện | xưng "tớ", gọi trẻ "cậu" | xưng "mình", gọi trẻ "bạn" |
| Người lạ trong màn hội thoại | theo vai trong `persona`: "chú/cô – cháu" | theo vai: "anh/chị – em" (trên mạng) |
| Màn "cần giúp" và câu 111 | giọng linh vật, viết riêng cho từng nhóm tuổi | giọng linh vật, viết riêng cho từng nhóm tuổi |
| Nút cần giúp (lời của trẻ) | "Con cần giúp" | "Mình cần giúp" |
| Bản nháp cho phụ huynh | gọi trẻ là "con", không ghi tên | như 6-10 |

Linh vật xưng hô ngang hàng thì giống bạn đồng hành hơn là thầy cô, trẻ dễ nói thật hơn. Người lạ giữ cách xưng hô ngoài đời để trẻ tập nhận ra đúng tình huống thật.

**Cần sửa kèm:**
- Dòng xưng hô trong prompt `SYSTEM` (`codebase/agent.py`).
- `HOTLINE_MESSAGE`, `INJECTION_MESSAGE`, `SAFE_FALLBACK` tách thành bản 6-10 và bản 11-15. Câu 111 vẫn phải có đủ: số 111, trò chơi tạm dừng, không chấm điểm.
- `BANNED_OUTPUT` thêm biến thể theo xưng hô mới: "lỗi của cậu", "tại cậu", "lỗi của bạn", "tại bạn", "sẽ phạt cậu", "sẽ phạt bạn". Thiếu bước này thì postcheck lọt câu đổ lỗi.
- Metric không đổi: định nghĩa trong `eval/metric_spec.yaml` chấm theo nghĩa ("đổ lỗi", "dọa"), các câu "tại con", "lỗi của con" chỉ là ví dụ.

### 4.2. Câu thoại và câu chào linh hoạt, mới mẻ hơn

**Hiện tại.** Câu chào, câu dừng game, câu từ chối đều cố định, lần nào cũng giống hệt. Chơi vài phiên là trẻ thuộc và chán.

**Đề xuất:**
- **Kho câu viết sẵn có biến thể.** Mỗi loại câu có 5–8 biến thể đã duyệt: chào đầu phiên, chào khi quay lại, đến địa điểm mới trên bản đồ, khen khi đúng, động viên khi còn thiếu, nhận thẻ mới, kết phiên. Chọn ngẫu nhiên, không lặp lại trong cùng một phiên. Đặt trong file mới `data/lines.json`, Diệp soạn, nhóm duyệt.
- **Câu theo ngữ cảnh**, không cần AI: theo buổi ("Chiều rồi, mình đi bể bơi nhé!"), theo tiến độ ("Còn 2 nơi nữa là sáng hết bản đồ"), nhắc lại thẻ đã nhận ("Nhớ thẻ bí mật xấu hôm trước không?").
- **Biệt danh thay cho tên.** Đầu phiên, trẻ chọn biệt danh trong danh sách có sẵn (vd "Thỏ Xanh", "Mèo Mây") để linh vật gọi cho thân. Không cho gõ tên tự do, để không thu tên thật.
- **Phản hồi của AI bớt rập khuôn.** Thêm vào prompt: không mở đầu hai lượt liền bằng cùng một câu khen; nhắc lại một chi tiết trẻ vừa nói để trẻ thấy được lắng nghe ("Cậu nói sẽ chạy về nhà, đúng rồi!"). Giới hạn câu ≤ 20 từ cho 6-10 vẫn giữ.
- **Người lạ ở chế độ kịch bản có sẵn:** mỗi nhánh có 2–3 câu biến thể đã duyệt, chọn ngẫu nhiên, để trẻ không học thuộc kịch bản.

**Không đổi:** nội dung chính của câu 111 và câu từ chối. Các câu này có thể có vài biến thể, nhưng biến thể nào cũng phải được duyệt và giữ đủ ý bắt buộc. AI không tự sinh các câu này.

### 4.3. Bỏ trắc nghiệm, trẻ trả lời tự luận

**Hiện tại.** `docs/game-flow.md` cho trẻ hai cách trả lời: bấm 2–3 nút đáp án, hoặc tự gõ. Bấm nút thì trẻ đoán được đáp án "đúng" mà không cần nghĩ.

**Đề xuất:**
- Bỏ nút đáp án ở mọi màn. Trẻ luôn tự trả lời bằng lời của mình, gõ hoặc nói (mục 4.4).
- Bỏ trường `choices` khỏi định dạng màn. `key_actions` giữ nguyên để chấm.
- **Trẻ bí thì có nút "Gợi ý"**: linh vật hỏi gợi mở, không đưa đáp án (vd "Lúc đó cậu thấy thế nào? Cậu muốn tìm ai?"). Tối đa 1 gợi ý mỗi lượt. Trả lời "không biết" hay để trống thì không chê, gợi ý nhẹ.
- Câu thám tử ở mục 2 cũng chuyển sang tự kể.

**Ảnh hưởng:**
- Lượt nào cũng phải gọi AI chấm, kể cả lượt trước đây bấm nút. Chi phí và thời gian chờ tăng. Cần chạy lại `python run.py simulate` và cập nhật `cost/cost-estimate.md`.
- Giao diện cần hiệu ứng "linh vật đang nghĩ" để che thời gian chờ model.
- Bộ câu thử hiện có đã là câu tự luận nên vẫn dùng được, không cần sửa.

### 4.4. Dùng mic và loa thay cho đọc và gõ tay

**Vì sao.** Trẻ 6-7 tuổi còn đọc chậm, gõ tiếng Việt có dấu càng chậm. Bỏ trắc nghiệm (mục 4.3) mà không có giọng nói thì trẻ nhỏ khó chơi.

**Loa: đọc to mọi thứ.**
- Lời kể, câu người lạ, phản hồi của linh vật, thẻ quy tắc đều được đọc to, có nút nghe lại.
- Mỗi nhân vật một giọng: linh vật vui vẻ; người lạ giọng bình thường, thân thiện, không làm giọng đáng sợ (khớp với luật vẽ người lạ trong `game-flow.md`).
- Màn "cần giúp" và câu 111 đọc chậm, bình tĩnh.
- Chữ vẫn luôn hiện trên màn hình, cho trẻ chơi ở nơi cần yên lặng.

**Mic: nói thay cho gõ.**
- Người lớn bật mic ở màn hình đầu, trình duyệt xin quyền. Không bật thì trẻ gõ như cũ.
- Nút **giữ để nói**: chỉ thu khi trẻ đang giữ nút, không nghe liên tục.
- Nói xong, game hiện chữ đã nghe được. Trẻ bấm "Đúng rồi" để gửi, hoặc nói lại, hoặc sửa chữ. Bước này bắt buộc: máy nghe nhầm "con không đi" thành "con đi" là đảo ngược nghĩa câu trả lời.
- Chữ nghe được mà lộn xộn hoặc không rõ nghĩa thì AI hỏi lại, không chấm.
- Ô gõ chữ luôn còn để dự phòng.

**Riêng tư và an toàn:**
- Không lưu âm thanh. Chỉ gửi chữ đã chuyển từ giọng nói cho agent. Chữ này đi qua `precheck` và `mask_pii` y như chữ gõ tay, nên trẻ nói chuyện bị xâm hại thật thì game vẫn dừng và hiện 111.
- Trace chỉ ghi chữ, không ghi âm thanh.
- **Cần kiểm trước khi chọn dịch vụ chuyển giọng nói thành chữ:** nhận giọng có sẵn trong trình duyệt Chrome gửi âm thanh lên máy chủ của Google, không xử lý trên máy. Nhóm phải đọc điều khoản của dịch vụ định dùng, ghi vào `spec.md` §9 và `data/DATA_CARD.md`, hoặc chọn cách chạy ngay trên máy.
- Giọng trẻ em, giọng địa phương, nói ngọng thì máy nghe sai nhiều hơn giọng người lớn *(tự ước tính, chưa đo)*. Nên thử với vài câu nói thật trước khi đưa vào lát cắt.

**Ảnh hưởng:**
- Đọc to và nhận giọng đều có phí theo dịch vụ. Cần thêm vào `cost/cost-estimate.md` (chưa có số).
- Muốn đo độ chính xác khi dùng giọng nói thì dựng một bộ câu thử riêng (chữ chuyển từ giọng nói: không dấu, dính câu, nghe nhầm). Không trộn vào `eval/benchmark.csv` đã khoá.

### 4.5. Tình huống và màn chơi linh hoạt hơn, có AI tạo dưới kiểm duyệt

> **Mục này đụng vào một luật đã chốt.** `spec.md` §4 (mục "Không làm") và `docs/game-flow.md` đều ghi: AI không tự nghĩ tình huống rồi đưa thẳng cho trẻ, trẻ chỉ gặp màn đã có người duyệt. Muốn làm thì cả nhóm phải đồng ý, sửa hai chỗ đó và ghi changelog ở `spec.md` §10. Lý do của luật vẫn đúng: trẻ đọc hoặc nghe rồi thì không rút lại được, và không guardrail nào chặn được 100%.

**Hiện tại.** Kho có 11 màn cố định. Chơi vài phiên là trẻ thuộc hết tình huống, thuộc luôn đáp án.

**Đề xuất chia 3 nấc, rủi ro tăng dần. Khuyên làm nấc A, cân nhắc nấc B, chưa làm nấc C.**

| Nấc | AI được làm gì | Trẻ thấy ngay không | Rủi ro |
|---|---|---|---|
| A. Biến tấu màn đã duyệt | Đổi bề mặt của một màn trong kho: tên nhân vật, địa điểm, món quà, lời kể. Giữ nguyên tình huống gốc, `key_actions`, quy tắc | Có, sau khi qua kiểm duyệt | Thấp |
| B. Ghép màn từ khung | Ghép một màn mới từ các mảnh đã duyệt: một người (trong danh sách), một chiêu (trong `allowed_tactics`), một địa điểm, một quy tắc | Có, sau khi qua kiểm duyệt | Vừa |
| C. Tạo màn hoàn toàn mới | AI tự nghĩ chủ đề và tình huống | **Không.** Chỉ thành bản nháp `cho_duyet` cho nhóm duyệt, như `POST /api/admin/scenario-draft` đã có trong `game-flow.md` | Cao nếu đưa thẳng cho trẻ |

**Nấc A, biến tấu màn đã duyệt.**
- Ví dụ màn gốc S6-02 "Kẹo và bí mật". Bản biến tấu: "Một người quen tặng Bin thẻ hình siêu nhân rồi dặn đừng kể với mẹ…". Tình huống vẫn là bí mật xấu, hành động cần có vẫn là kể với người lớn.
- AI chỉ được thay các ô đã đánh dấu trong màn gốc. Giá trị thay lấy từ danh sách có sẵn, vd `qua`: kẹo, thẻ hình, đồ chơi, tiền ăn quà.
- Chấm vẫn theo `key_actions` và `rule_ids` của màn gốc, nên không cần viết thêm cách chấm.

**Nấc B, ghép màn từ khung.**
- Thêm file `data/scene_parts.json` gồm các danh sách đã duyệt: người (người quen, hàng xóm, bạn của anh chị, người lạ, tài khoản trên mạng…), chiêu, địa điểm, quy tắc. Mỗi mảnh ghi nhóm tuổi được dùng.
- Code chọn mảnh hợp lệ trước: đúng tuổi, đúng giới, chiêu khớp với quy tắc. AI chỉ viết lời kể từ các mảnh đã chọn.
- `key_actions` lấy theo quy tắc đã chọn, không để AI tự nghĩ.

**Guardrail bắt buộc cho nấc A và B.** Màn nào AI tạo ra cũng phải qua đủ các lớp sau trước khi tới tay trẻ.

1. **Người lớn bật mới có.** Mặc định tắt, chỉ dùng màn trong kho. Phụ huynh hoặc giáo viên bật ở màn hình đầu, như chế độ AI đóng vai.
2. **Chỉ dùng mảnh có trong kho.** Code kiểm từng ô đã thay có nằm trong danh sách được phép không.
3. **Danh sách cấm cứng, kiểm bằng code.** Dùng chung danh sách của chế độ AI đóng vai: không nội dung tình dục, không tả bộ phận hay hình ảnh cơ thể ngoài tên đúng đã dùng trong kho, không tả hành vi xâm hại, không bạo lực, không máu me. Không có tên người thật, trường, địa chỉ. Lời kể cho nhóm 6-10 không câu nào quá 25 từ.
4. **Một lần gọi model riêng để kiểm duyệt.** Prompt riêng, hỏi: màn này còn đúng quy tắc gốc không, có hợp tuổi không, có làm trẻ sợ hay đổ lỗi cho nhân vật trẻ không. Không qua thì dùng màn gốc trong kho.
5. **Theo tuổi.** Màn trên mạng (xin ảnh, hẹn gặp) chỉ có ở nhóm 11-15, như luật hiện có.
6. **Không đổi lời dặn theo giới tính.** Đổi nhân vật nam hay nữ thì lời dặn vẫn giữ nguyên.
7. **Không có máy thì dùng kho.** Model lỗi, chậm quá vài giây, hay kiểm duyệt không qua thì dùng ngay màn gốc. Trẻ không phải chờ.
8. **Lưu để rà lại.** Mọi màn AI tạo và kết quả kiểm duyệt đều nằm trong trace. Định kỳ nhóm đọc lại. Màn tốt thì chép vào kho làm màn chính thức.
9. **Thử tấn công trước khi bật.** Dựng bộ câu thử riêng cho phần sinh màn: ép mảnh ngoài danh sách, chèn từ cấm vào lời kể, ép đổi quy tắc. Không trộn vào `eval/benchmark.csv` đã khoá.

**Ảnh hưởng:**
- Mỗi màn tạo mới tốn thêm 2 lần gọi model, một lần tạo và một lần kiểm duyệt. Cần cập nhật `cost/cost-estimate.md`.
- Thêm metric hay câu thử cho phần sinh màn sau CP2 thì để ở bộ riêng. Không sửa `eval/metric_spec.yaml` và chuẩn "đạt" đã chốt.
- Cần sửa `spec.md` §4 (Không làm, Chỗ người duyệt) và `docs/game-flow.md` (mục "AI soạn màn mới", bảng "AI làm gì") cho khớp nấc nhóm chọn.

## Ảnh hưởng tới API (bản dự kiến ở `docs/game-flow.md`)

- `POST /api/session` nhận thêm `mic_enabled`, `nickname` (biệt danh chọn trong danh sách có sẵn), và trả thêm `map`: danh sách địa điểm và các mã màn trong đó.
- `POST /api/answer` bỏ `choice_id`, chỉ nhận `text`. Text là chữ trẻ gõ hoặc chữ đã chuyển từ giọng nói và được trẻ xác nhận. Server không nhận âm thanh. Kết màn trả thêm `rule_card` (mã quy tắc của thẻ vừa nhận). Màn hội thoại trả thêm `tactics_seen` (các chiêu đã xuất hiện trên nhánh).
- Thêm `POST /api/hint` (`session_id`, `scenario_id`) trả câu gợi ý cho nút "Gợi ý".
- Chấm câu thám tử dùng lại `POST /api/answer`. Lưu sổ tay làm ở giao diện.

## Ghi chú cho nhóm

- Không mục nào sửa `eval/metric_spec.yaml`, chuẩn "đạt" hay `eval/benchmark.csv`.
- Mục 4 làm đổi lát cắt trong `spec.md` §4 ("bấm đáp án hoặc tự gõ" thành "tự trả lời bằng lời, gõ hoặc nói"). Sửa sau CP2 thì phải ghi một dòng vào changelog ở §10.
- `data/scenarios.json` hiện chưa có các trường `type`, `rule_card` như định dạng trong `game-flow.md`. Nên thống nhất định dạng trước khi thêm `location` và `tactics`. Theo mục 4.3, trường `choices` không cần thêm nữa.
- Thứ tự làm gợi ý: 4.1 xưng hô (sửa prompt và guardrail, nhanh) → 4.3 bỏ trắc nghiệm → 4.2 kho câu thoại → 4.4 mic và loa (cần chọn dịch vụ, kiểm riêng tư) → 4.5 nấc A (chỉ sau khi nhóm đồng ý đổi luật "không đưa màn AI tạo cho trẻ").
