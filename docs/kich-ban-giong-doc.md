# Kịch bản câu đọc sẵn (bản nháp để duyệt)

Ngày 28/11, bản sửa lần 2: viết lại cho gần giọng nói thật hơn, bớt kiểu "sách giáo khoa", thêm chỗ ngập ngừng, câu cụt, câu dài ngắn xen nhau như người thật nói chuyện. Đây là toàn bộ câu sẽ đọc sẵn thành file âm thanh bằng `google/gemini-3.8-flash-lite-tts`, theo phương án ở `docs/de-xuat-sprint-3.md` mục 6 "Giọng nói". Duyệt xong thì chép sang `data/voice_lines.json` rồi mới chạy script đọc.

Cách đọc file:
- Cột **Mã** là tên file âm thanh (thêm `.mp3`).
- `{ten}` là tên nhân vật chính. Câu có `{ten}` đọc hai lần: nhóm 6-10 thành Bin và Na, nhóm 11-15 thành Khôi và Mai. Mã file thêm hậu tố `_bin`, `_na`, `_khoi`, `_mai`.
- Cột **Vai** chỉ giọng và cách đọc, khai trong `data/voices.json`: `tin610` (Tin nói với trẻ 6-10), `tin1115` (Tin nói với trẻ 11-15), `tin_calm610`, `tin_calm1115` (Tin ở màn cần giúp, đọc chậm), `nguoi_la`, `co_lan`, `chu_hai`, `chu_toan`, `ba`, `khoa`.
- Số 111 viết "một một một" trong chữ đưa cho TTS, còn chữ hiện trên màn hình vẫn là "111".
- Khoa xưng "tao, mày" theo đúng cách game thủ tuổi teen hay nhắn nhau, khác hẳn "tớ, cậu" của Tin. Nhóm xem lại xem có muốn dịu bớt không, vì đây là chỗ duy nhất trong game dùng kiểu xưng hô này.
- Câu nào đánh dấu *(mới)* là nội dung chưa có trong kho, cần Diệp đối chiếu tài liệu gốc trước khi dùng.

## 1. Câu an toàn

Không AI nào được sinh lại các câu này. Câu 111 nào cũng đủ ba ý: có số 111, nói rõ trò chơi dừng, không chấm điểm.

| Mã | Vai | Câu |
|---|---|---|
| `safe_hotline_610_a` | tin_calm610 | Thôi, mình dừng chơi ở đây một chút nhé. Chuyện cậu vừa kể, tớ nghe thấy quan trọng lắm đấy. Cậu không làm sai gì cả đâu. Giờ cậu chạy đi tìm mẹ, bố, hay cô giáo, kể y như vừa kể cho tớ nghe vậy. Có số này nữa, một một một, gọi miễn phí, lúc nào cũng gọi được. |
| `safe_hotline_610_b` | tin_calm610 | Chuyện này, tớ với cậu nghỉ chơi một xíu đã. Cậu không có lỗi gì hết, nghe chưa. Kể được cho tớ là cậu can đảm lắm rồi. Giờ việc quan trọng là cậu đi kể lại với mẹ, với bố, hoặc cô giáo. Số một một một gọi được bất cứ lúc nào, không mất tiền đâu. |
| `safe_hotline_1115_a` | tin_calm1115 | Mình dừng chơi ở đây xíu nhé. Chuyện bạn vừa kể, mình nghe thấy quan trọng hơn cái game này nhiều. Bạn không làm gì sai hết. Giờ bạn tìm một người lớn mình tin, kể lại y vậy cho họ nghe, bố mẹ cũng được, thầy cô cũng được. Số một một một gọi được bất cứ lúc nào, miễn phí luôn. |
| `safe_hotline_1115_b` | tin_calm1115 | Game nghỉ chút đã. Dám kể ra như vậy là bạn can đảm lắm rồi, với lại đây không phải lỗi của bạn đâu. Tìm một người lớn bạn tin để kể, còn chưa biết kể ai thì gọi số một một một, miễn phí, cả ngày lẫn đêm. |
| `safe_helpbtn_610` | tin_calm610 | Tớ đây, có tớ rồi. Mình dừng chơi một chút nhé. Cái gì làm cậu sợ hay khó chịu thì kể ngay cho mẹ, bố, hay cô giáo nghe. Số một một một cũng gọi được, miễn phí. |
| `safe_helpbtn_1115` | tin_calm1115 | Mình ở đây. Game dừng lại xíu nhé. Có chuyện gì đang làm bạn lo thì kể cho người lớn bạn tin, hoặc gọi số một một một, miễn phí, lúc nào cũng gọi được. Không cần tự ôm một mình đâu. |
| `safe_inject_610_a` | tin610 | Ấy, cái đó tớ chịu thôi, không chơi được đâu. Quay lại chuyện của {ten} nhé? |
| `safe_inject_610_b` | tin610 | Tớ chỉ biết chơi mấy tình huống có sẵn thôi à. Về với {ten} tiếp nào! |
| `safe_inject_1115_a` | tin1115 | Cái đó mình không chơi được. Quay lại chuyện của {ten} nhé. |
| `safe_inject_1115_b` | tin1115 | Mình chỉ chạy mấy tình huống có sẵn thôi, không đổi luật được đâu. Tiếp tục nhé? |
| `safe_fallback_610` | tin610 | Ơ, cái này tớ chưa nghĩ ra câu trả lời. Cậu kể lại giúp tớ xem {ten} sẽ làm gì nhé. |
| `safe_fallback_1115` | tin1115 | Câu này mình chưa trả lời được. Bạn kể lại xem {ten} định làm gì nhé. |
| `safe_exitrole_610` | tin610 | Thôi dừng ở đây, người lạ không nói nữa đâu. Giờ tớ với cậu ngồi lại xem chuyện vừa rồi một chút. |
| `safe_exitrole_1115` | tin1115 | Dừng đoạn này lại đã. Mình xem lại chuyện vừa xảy ra một chút nhé. |

## 2. Lời kể các màn

Lời kể viết lại theo dàn nhân vật, giữ nguyên tình huống gốc, `key_actions` và `rule_ids` trong `data/scenarios.json`. Lời kể do Tin đọc. Câu hỏi cuối đọc riêng một file để phát lại được khi trẻ bấm nghe lại câu hỏi.

### Nhóm 6-10

| Mã | Địa điểm | Lời kể (`tin610`) | Câu hỏi (`tin610`) |
|---|---|---|---|
| `S6-01` | Xóm nhà | Chiều nay {ten} sang nhà chú Hải đá bóng với mấy bạn trong xóm. Đá xong các bạn về hết, chỉ còn mỗi {ten} ở lại. Chú Hải gọi {ten} lại, bảo ngồi lên đùi chú để xem vết muỗi đốt, rồi tay chú cứ đưa dần xuống dưới, chạm vào chỗ không ai được chạm vào. | Cậu là {ten}, giờ làm gì đây? |
| `S6-02` | Xóm nhà | Cô Lan hàng xóm cho {ten} một bịch kẹo to, rồi ôm {ten} hồi lâu. Lúc {ten} sắp về, cô ghé tai dặn nhỏ: chuyện cô ôm con lúc nãy, mình giữ riêng hai cô cháu thôi nhé, đừng kể mẹ. | Đây là bí mật tốt hay bí mật xấu? {ten} làm gì bây giờ? |
| `S6-03` | Công viên | {ten} đang trèo cầu trượt ở công viên thì có một chú đội mũ lưỡi trai lại gần. Chú bảo: mẹ con bận quá, nhờ chú qua đón con, đi với chú nhé. {ten} thì chưa gặp chú này bao giờ. | Nếu là {ten} thì làm sao đây? |
| `S6-04` | Nhà bà | Hôm đi ăn giỗ, bà định thơm má {ten} một cái, {ten} không thích nên né sang bên. Có bác ngồi gần cười bảo: bà thương con mà, có gì đâu. | {ten} không thích thì có làm gì được không? |
| `S6-05` | Bể bơi | Ở bể bơi, mấy bạn cứ thay đồ luôn ngoài thành bể cho nhanh. Bố bảo {ten} vào buồng thay. {ten} hỏi lại: sao con phải vào buồng vậy bố? | Cậu giải thích giúp {ten} xem, vì sao nên vào buồng thay đồ? |
| `S6-06` | Trường | Tan học rồi mà mẹ chưa tới đón, cô Hạnh cũng về mất rồi. {ten} đứng một mình thì có một anh lớn lạ hoắc cứ bám theo, hỏi nhà {ten} ở đâu. {ten} sợ quá. | {ten} lúc này tìm ai được? Kể tên hai người xem. |

### Nhóm 11-15

| Mã | Địa điểm | Lời kể (`tin1115`) | Câu hỏi (`tin1115`) |
|---|---|---|---|
| `S11-01` | Game online | Khoa, tài khoản {ten} hay chơi chung đội trong game, nhắn riêng: gửi tao tấm ảnh mày mặc đồ lót đi, tao tặng cái skin hiếm cho. | Là {ten} thì làm gì? |
| `S11-02` | Tin nhắn | {ten} nhắn tin qua lại với Khoa được ba tháng rồi. Hôm nay Khoa rủ ra quán trà sữa gần trường gặp trực tiếp, dặn đi một mình thôi, đừng nói cho ai biết. | Lời rủ này có chỗ nào đáng lo không? {ten} làm gì? |
| `S11-03` | Tin nhắn | Một bạn cùng lớp mà {ten} đang thích cứ nhắn đòi {ten} gửi một tấm ảnh nhạy cảm, còn thêm câu: thương thì phải gửi chứ. | {ten} trả lời sao đây? |
| `S11-04` | Nhà họ hàng | Lần nào qua chơi, chú Toàn cũng ôm {ten} thật lâu, tay cứ chạm vào người làm {ten} khó chịu. Người lớn trong nhà thấy vậy chỉ cười: người nhà cả mà, có gì đâu. | Quy tắc về cơ thể có áp dụng với người thân không? {ten} nên làm gì? |
| `S11-05` | Nhóm chat lớp | Có người gửi vào nhóm chat lớp 8B một tấm ảnh chụp lén một bạn đang thay đồ. Mấy đứa khác thả haha, share tiếp ầm ầm. | Là {ten} thì làm gì? |

## 3. Thẻ quy tắc

Lời trên thẻ lấy từ `loi_6_10`, `loi_11_15` trong `data/guidelines.json`, đổi xưng hô sang "cậu" và "bạn". Nếu duyệt thì sửa luôn hai trường đó cho khớp. R12 không làm thẻ.

| Mã | Tên thẻ | Lời thẻ 6-10 (`tin610`) | Lời thẻ 11-15 (`tin1115`) |
|---|---|---|---|
| `rule_R01` | Vùng đồ bơi là riêng tư | Vùng đồ bơi che là của riêng cậu thôi, không ai được nhìn hay chạm vào đó cả. | Vùng kín là của riêng bạn. Dù là ai, cũng không được nhìn, chạm hay chụp ảnh nếu bạn chưa đồng ý. |
| `rule_R02` | Cơ thể của mình là của mình | Không thích ôm hay thơm thì cậu cứ nói không, vẫy tay chào thay cũng được mà. | Bạn có quyền từ chối cái chạm làm mình khó chịu, kể cả từ người thân. Ai thật lòng tôn trọng bạn sẽ dừng lại ngay. |
| `rule_R03` | Bí mật tốt, bí mật xấu | Bí mật nào làm cậu thấy sợ hay khó chịu thì đó là bí mật xấu, cứ kể cho bố mẹ nghe. | Ai dặn bạn giấu bố mẹ, nhất là kèm quà hay lời dọa, đó là dấu hiệu nguy hiểm đấy. Kể ngay đi. |
| `rule_R04` | Ba bước: không, đi, kể | Ba bước nhớ nhé: nói không, chạy đi, rồi kể lại cho người lớn mình tin. | Nói không, rời đi hoặc chặn, rồi kể với người lớn bạn tin. Làm được bước nào cũng đáng khen cả. |
| `rule_R05` | Người lớn tin cậy | Cậu nghĩ sẵn trong đầu hai người lớn mình tìm được nhé. Người này chưa giúp thì mình kể người khác. | Chọn sẵn vài người lớn bạn tin, ở nhà lẫn ở trường. Người đầu chưa giúp được thì kể tiếp người khác, đừng bỏ cuộc. |
| `rule_R06` | Gọi đúng tên | Chỗ đồ bơi che gọi là vùng kín đó. Nói đúng tên vậy không có gì xấu hổ cả. | Gọi đúng tên bộ phận cơ thể giúp bạn kể lại rõ ràng hơn, lúc cần người khác giúp. |
| `rule_R07` | Không đi theo người lạ | Người lạ nói mẹ nhờ đón cũng mặc kệ, cậu không đi đâu. Ở lại tìm cô giáo hay bác bảo vệ. | Đừng lên xe hay đi theo người bạn không quen, dù họ nói lý do gì. Gọi bố mẹ hỏi lại cho chắc trước đã. |
| `rule_R08` | An toàn trên mạng | Trên mạng có ai xin ảnh hay hỏi nhà cậu ở đâu thì đừng trả lời, gọi bố mẹ ngay. | Đừng gửi ảnh riêng tư cho bất kỳ ai. Chặn, chụp màn hình giữ lại làm bằng chứng, rồi kể cho người lớn bạn tin. |
| `rule_R09` | Không phải lỗi của mình | Chuyện đó không phải lỗi của cậu đâu. Kể ra được là cậu can đảm lắm rồi. | Không phải lỗi của bạn, kể cả khi bạn đã lỡ làm theo. Kể ra lúc nào cũng chưa muộn cả. |
| `rule_R10` | Không gặp riêng bạn qua mạng | Người chỉ quen qua mạng mà rủ đi gặp thì đừng đi, kể cho bố mẹ nghe liền. | Đừng gặp riêng người chỉ quen qua mạng. Càng bị dặn giữ bí mật thì càng phải kể cho bố mẹ. |
| `rule_R11` | Có quyền từ chối gửi ảnh | (không có ở 6-10) | Thích ai cũng không có nghĩa là phải gửi ảnh nhạy cảm. Ảnh gửi đi rồi là không lấy lại được nữa đâu. |

Mã file: `rule_R01_610.mp3`, `rule_R01_1115.mp3`, đọc cả tên thẻ trước lời thẻ.

## 4. Thẻ chiêu (thám tử nhận chiêu)

Mặt sau thẻ chỉ có cách nhận ra và một câu đáp lại, không tả cách dụ. *(mới)*

| Mã | Tên thẻ | Cách nhận ra | Câu đáp lại | Nhóm tuổi |
|---|---|---|---|---|
| `tactic_gia_quen_bo_me` | Tự nhận là người quen của bố mẹ | Người mình chưa gặp bao giờ mà nói quen bố mẹ mình. | "Để cháu gọi hỏi mẹ đã." | Cả hai |
| `tactic_giuc_gap` | Giục đi thật nhanh | Cứ giục mình đi thật nhanh, không cho kịp hỏi ai cả. | "Cháu không vội đâu, để cháu hỏi bố mẹ đã." | Cả hai |
| `tactic_noi_me_gap_chuyen` | Nói bố mẹ đang gặp chuyện | Bảo mẹ đang ở viện, bố bị sao đó, để mình hoảng mà đi theo. | "Để cháu gọi bố mẹ ngay bây giờ." | Cả hai |
| `tactic_cho_qua` | Cho quà, cho kẹo | Cho quà rồi đòi mình làm gì đó, hoặc dặn đừng kể ai. | "Cháu không nhận đâu ạ." | Cả hai |
| `tactic_dan_bi_mat` | Dặn giữ bí mật | Dặn đừng kể với bố mẹ. Bí mật kiểu này là bí mật xấu đấy. | "Cháu sẽ kể cho mẹ nghe." | Cả hai |
| `tactic_hua_vat_pham` | Hứa tặng đồ trong game | Tặng vật phẩm, tặng skin để đổi lấy ảnh hay thông tin của mình. | "Thôi khỏi, cảm ơn." rồi chặn luôn | 11-15 |
| `tactic_ep_bang_tinh_cam` | "Nếu thương thì phải làm" | Lôi tình cảm ra ép mình làm điều mình không muốn. | "Thương thật thì không ép nhau đâu." | 11-15 |
| `tactic_ru_gap_rieng` | Rủ gặp riêng | Người chỉ quen qua mạng rủ gặp một mình, dặn đừng nói ai. | "Mình không đi đâu. Mình sẽ kể cho bố mẹ." | 11-15 |

Đọc bằng `tin610` cho thẻ cả hai nhóm, `tin1115` cho thẻ chỉ có ở 11-15. Câu đáp lại ở 11-15 đổi "cháu" thành "mình" khi người nói là bạn trên mạng.

## 5. Kho câu `lines.json`

Mỗi loại chọn ngẫu nhiên, không lặp trong cùng một phiên.

### Chào đầu phiên

| Mã | 6-10 (`tin610`) | Mã | 11-15 (`tin1115`) |
|---|---|---|---|
| `hello_610_1` | {ten} dậy rồi kìa. Hôm nay đi cùng {ten} cả ngày luôn nhé? | `hello_1115_1` | Điện thoại của {ten} vừa sáng màn hình. Xem thử có gì không? |
| `hello_610_2` | Ơ, cậu đến rồi à! {ten} hôm nay có mấy chỗ hay lắm đấy. | `hello_1115_2` | Chào bạn. Hôm nay {ten} có vài chuyện cần bạn cho ý kiến đấy. |
| `hello_610_3` | Đợi cậu nãy giờ đấy. {ten} sắp ra khỏi nhà rồi kìa. | `hello_1115_3` | Đến đúng lúc ghê, {ten} vừa nhận được mấy tin nhắn lạ. |
| `hello_610_4` | Lại đây, mình đi cùng {ten} nào. | `hello_1115_4` | Sẵn sàng chưa? Mở điện thoại của {ten} xem nào. |

### Chào khi quay lại

| Mã | 6-10 | Mã | 11-15 |
|---|---|---|---|
| `back_610_1` | A, cậu về rồi! Thẻ của cậu tớ vẫn giữ nguyên đây. | `back_1115_1` | Bạn quay lại rồi đấy. Sổ tay vẫn còn nguyên nhé. |
| `back_610_2` | Lâu ghê mới gặp lại. Mình chơi tiếp chỗ hôm trước nhé. | `back_1115_2` | Chào, chơi tiếp chỗ hôm trước nhé. |
| `back_610_3` | Nhớ thẻ hôm bữa không? Hôm nay tìm thêm thẻ mới nhé. | `back_1115_3` | Lần trước bạn làm tốt đấy. Hôm nay khó hơn một chút. |

### Đến địa điểm mới

| Mã | Câu |
|---|---|
| `place_home` (`tin610`) | Ra ngõ nhà {ten} nào, xóm này ai cũng quen mặt {ten} hết. |
| `place_grandma` (`tin610`) | Đến nhà bà rồi. Hôm nay nhà bà có giỗ, đông vui lắm. |
| `place_park` (`tin610`) | Công viên đây rồi. Cầu trượt đông nghịt luôn. |
| `place_pool` (`tin610`) | Bể bơi mát ghê. Nhớ mang đủ đồ bơi nhé. |
| `place_school` (`tin610`) | Đến trường rồi. Lớp 3A của {ten} ở tầng hai. |
| `place_game` (`tin1115`) | Mở game lên nào, đội của {ten} đang đợi kìa. |
| `place_chat` (`tin1115`) | Có tin nhắn mới, xem cùng {ten} nhé. |
| `place_classgroup` (`tin1115`) | Nhóm chat lớp 8B đang ồn ào lắm. |
| `place_family` (`tin1115`) | Cuối tuần này {ten} về quê ăn giỗ. |

### Khen ngắn (phát ngay khi biết trẻ đạt, trước phần agent viết)

| Mã | 6-10 | Mã | 11-15 |
|---|---|---|---|
| `praise_610_1` | Đúng rồi đấy! | `praise_1115_1` | Chuẩn. |
| `praise_610_2` | Chuẩn! | `praise_1115_2` | Hợp lý đấy. |
| `praise_610_3` | Giỏi ghê! | `praise_1115_3` | Bạn xử lý ổn đấy. |
| `praise_610_4` | Ừ, đúng vậy đấy. | `praise_1115_4` | Đúng hướng rồi. |
| `praise_610_5` | {ten} an toàn rồi. | `praise_1115_5` | {ten} an toàn rồi. |
| `praise_610_6` | Cậu nhanh trí thật đấy. | `praise_1115_6` | Bình tĩnh mà chắc, được đấy. |

### Động viên ngắn (khi còn thiếu)

| Mã | 6-10 | Mã | 11-15 |
|---|---|---|---|
| `cheer_610_1` | Gần được rồi. | `cheer_1115_1` | Gần đủ rồi. |
| `cheer_610_2` | Đúng một phần rồi đấy. | `cheer_1115_2` | Đúng một phần đấy. |
| `cheer_610_3` | Ừ, thêm chút nữa thôi. | `cheer_1115_3` | Còn thiếu chút xíu thôi. |
| `cheer_610_4` | Không sao, mình nghĩ tiếp nhé. | `cheer_1115_4` | Không sao, mình nghĩ tiếp. |
| `cheer_610_5` | Cậu thử lại đi, tớ đợi. | `cheer_1115_5` | Thử lại lần nữa xem. |

### Nhận thẻ

| Mã | 6-10 | Mã | 11-15 |
|---|---|---|---|
| `card_610_1` | Thẻ mới cho cậu đây. | `card_1115_1` | Thêm một thẻ vào sổ tay. |
| `card_610_2` | Ôi, thẻ này đẹp ghê. Giữ lấy nhé. | `card_1115_2` | Thẻ mới đây, lúc nào mở lại cũng được. |
| `card_610_3` | Thêm thẻ nữa rồi. Sổ tay dày lên đấy. | `card_1115_3` | Bạn vừa nhận thêm một thẻ. |
| `card_610_4` | Đủ hai thẻ rồi, tớ lớn thêm một chút đấy! | `card_1115_4` | Đủ hai thẻ rồi, có đồ mới cho mình nữa đây. |

### Kết phiên

| Mã | 6-10 | Mã | 11-15 |
|---|---|---|---|
| `bye_610_1` | Hôm nay cậu giúp {ten} được nhiều lắm đấy. Mai chơi tiếp nhé! | `bye_1115_1` | Xong rồi. Hôm nay bạn giúp {ten} nhiều đấy. |
| `bye_610_2` | {ten} về nhà an toàn rồi. Cảm ơn cậu nhiều. | `bye_1115_2` | Hết chuyện hôm nay rồi. Hẹn lần sau. |
| `bye_610_3` | Mệt chưa? Nghỉ thôi, sổ tay tớ giữ cho. | `bye_1115_3` | Nghỉ thôi. Sổ tay vẫn ở đây khi nào cần. |

### Theo buổi và theo tiến độ

| Mã | Câu (`tin610`, trừ khi ghi khác) |
|---|---|
| `time_morning` | Sáng rồi, {ten} chuẩn bị đi học thôi. |
| `time_afternoon` | Chiều rồi, đi chơi một lát nhé. |
| `time_evening` | Tối rồi đấy, chơi thêm một màn nữa thôi nhé. |
| `progress_left_1` | Còn một chỗ nữa là xong hết bản đồ. |
| `progress_left_2` | Còn hai chỗ nữa thôi. |
| `progress_left_3` | Còn ba chỗ nữa, đi tiếp nhé. |
| `progress_left_4` | Còn bốn chỗ nữa, cậu muốn đi đâu trước? |
| `progress_all_610` | Xong hết bản đồ rồi. Giỏi ghê! |
| `progress_all_1115` (`tin1115`) | Mở hết các app rồi đấy. Xong cả hành trình. |

## 6. Câu điều khiển và câu chờ

| Mã | 6-10 (`tin610`) | Mã | 11-15 (`tin1115`) |
|---|---|---|---|
| `mic_howto_610` | Giữ nút này rồi nói nhé, nói xong thì thả tay ra. | `mic_howto_1115` | Giữ nút mic để nói, nói xong thì thả ra. |
| `mic_confirm_610` | Nghe được thế này, đúng chưa cậu? | `mic_confirm_1115` | Nghe được thế này, đúng chưa? |
| `mic_unclear_610` | Chưa nghe rõ lắm. Nói lại giúp tớ nhé? | `mic_unclear_1115` | Chưa nghe rõ, nói lại giúp mình nhé. |
| `mic_louder_610` | Nói to hơn chút nhé, tớ nghe không ra. | `mic_louder_1115` | Nói to hơn một chút nhé. |
| `mic_type_610` | Mạng hơi chậm, gõ giúp tớ nhé. | `mic_type_1115` | Mạng chậm quá, gõ giúp mình nhé. |
| `wait_610_1` | Để tớ nghĩ chút… | `wait_1115_1` | Đợi chút… |
| `wait_610_2` | Ừm… đang nghĩ đây. | `wait_1115_2` | Để xem nào… |
| `wait_610_3` | Chờ tớ một chút. | `wait_1115_3` | Một chút nhé. |
| `hint_offer_610` | Bí à? Bấm bóng đèn, tớ gợi ý cho. | `hint_offer_1115` | Cần gợi ý thì bấm bóng đèn. |

## 7. Mảnh ghép cho phản hồi và câu gợi ý

Phản hồi đọc lên ghép từ: câu khen hoặc động viên (mục 5) + mảnh "đã làm" + mảnh "còn thiếu" + câu agent viết (đọc lúc chơi). Chữ trên màn hình vẫn là đoạn đầy đủ agent viết.

### Hành động

| Hành động | Đã làm, 6-10 | Còn thiếu, 6-10 | Đã làm, 11-15 | Còn thiếu, 11-15 |
|---|---|---|---|---|
| A. Nói KHÔNG | `act_A_done_610`: Cậu nói không rồi đấy. | `act_A_miss_610`: Còn thiếu câu nói không thật rõ nữa. | `act_A_done_1115`: Bạn từ chối rõ ràng rồi. | `act_A_miss_1115`: Còn thiếu một câu từ chối thật rõ. |
| B. Rời đi | `act_B_done_610`: Cậu chạy ra chỗ đông người rồi. | `act_B_miss_610`: Nhớ chạy ra chỗ đông người nữa nhé. | `act_B_done_1115`: Bạn rời đi, hoặc chặn rồi. | `act_B_miss_1115`: Còn thiếu bước rời đi, hoặc chặn tài khoản. |
| C. Kể với người lớn | `act_C_done_610`: Cậu kể cho người lớn rồi. | `act_C_miss_610`: Nhớ kể cho người lớn nghe nữa nhé. | `act_C_done_1115`: Bạn đã kể với người lớn rồi. | `act_C_miss_1115`: Còn thiếu việc kể cho người lớn bạn tin. |
| Giữ bằng chứng | | | `act_proof_done_1115`: Nhớ chụp màn hình nữa, giỏi đấy. | `act_proof_miss_1115`: Nhớ chụp màn hình giữ lại làm bằng chứng. |
| Nhận ra bí mật xấu | `act_secret_done_610`: Cậu nhận ra đây là bí mật xấu rồi. | `act_secret_miss_610`: Bí mật mà làm mình sợ là bí mật xấu đấy. | `act_secret_done_1115`: Bạn nhận ra lời dặn giữ bí mật là dấu hiệu xấu rồi. | `act_secret_miss_1115`: Bị dặn đừng kể ai là dấu hiệu đáng lo đấy. |
| Không nói nhà ở đâu | `act_noaddr_done_610`: Cậu không nói nhà ở đâu, đúng rồi đấy. | `act_noaddr_miss_610`: Đừng nói nhà mình ở đâu nhé. | | |

### Người cụ thể (ghép sau "kể cho", "chạy tới chỗ")

`who_me` mẹ · `who_bo` bố · `who_ba` bà · `who_co_hanh` cô Hạnh · `who_bac_tam` bác Tâm · `who_co_thuy` cô Thủy · `who_thay_co` thầy cô. Mỗi mảnh chỉ là tên, đọc bằng `tin610` và `tin1115`.

### Câu gợi ý (nút bóng đèn)

Mỗi câu hỏi ngược, không đưa đáp án. Agent chọn câu theo hành động còn thiếu; chỉ khi trẻ nói lạc đề hẳn mới nhờ AI viết gợi ý mới.

| Mã | 6-10 (`tin610`) | 11-15 (`tin1115`) |
|---|---|---|
| `hint_A` | Lúc đó {ten} nói gì với người ta được nhỉ? | Nếu là {ten}, bạn sẽ nói gì để từ chối? |
| `hint_B` | Ở đó có chỗ nào đông người không nhỉ? | Bạn có cách nào thoát khỏi chuyện này không? |
| `hint_C` | Về nhà rồi, {ten} kể cho ai nghe được? | Ai là người lớn mà {ten} kể được? |
| `hint_proof` | | Trước khi chặn, có nên lưu lại gì không nhỉ? |
| `hint_secret` | Lời dặn đó làm {ten} thấy vui hay thấy lo? | Sao người ta lại dặn đừng nói với ai vậy nhỉ? |
| `hint_feel` | Lúc đó {ten} thấy sao? | Nếu là {ten}, bạn thấy thoải mái hay khó chịu? |
| `hint_who2` | Cô Hạnh về rồi thì còn ai ở trường nữa nhỉ? | Ngoài bố mẹ ra, bạn còn tin ai nữa? |
| `hint_family` | Bà thương {ten} thật, nhưng {ten} có bắt buộc phải chiều không nhỉ? | Người nhà thì có được làm mình khó chịu không? |
| `hint_friend` | | Nếu bạn bị chụp lén, bạn muốn mọi người làm gì? |

## 8. Lời nhân vật trong màn hội thoại (để sau)

Chưa có màn hội thoại nào trong kho. Khi Diệp soạn xong `dialogue`, mỗi câu người lạ đọc bằng giọng của nhân vật đó (`nguoi_la`, `co_lan`, `chu_hai`, `chu_toan`, `khoa`) và thêm vào mục này. Câu mẫu đã nghe thử:

- `nguoi_la`: Cháu là con mẹ Hương đúng không? Mẹ cháu đang ở viện với bà, nhờ chú qua đón. Lên xe nhanh đi, chú chở về.
- `co_lan`: Kẹo cô cho đó, cầm lấy đi. Chuyện cô ôm con lúc nãy, mình giữ riêng hai cô cháu thôi nhé, đừng kể mẹ.
- `khoa`: Ê, hôm qua leo rank đỉnh ghê! Tặng mày cái skin xịn nè. Nhắn riêng qua đây đi, đừng kể bố mẹ, người lớn không hiểu mấy chuyện này đâu.

## Đếm nhanh

| Nhóm | Số file (tính cả bản theo tên và nhóm tuổi) |
|---|---|
| 1. Câu an toàn | 14, trong đó 4 câu có `{ten}` nên thêm 4 → khoảng 18 |
| 2. Lời kể | 11 màn × 2 tên × (lời kể + câu hỏi) = 44 |
| 3. Thẻ quy tắc | 10 bản 6-10 + 11 bản 11-15 = 21 |
| 4. Thẻ chiêu | 8 |
| 5. Kho câu | khoảng 75, cộng bản theo tên → khoảng 110 |
| 6. Câu điều khiển | 18 |
| 7. Mảnh ghép, gợi ý | khoảng 60 |
| **Tổng** | **khoảng 279 file**, chừng 28 phút âm thanh |
