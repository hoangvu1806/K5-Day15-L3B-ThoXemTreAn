# Canvas: ThoXemTreAn (Track F)

| # | Dòng | Nhóm điền |
|---|---|---|
| 1 | Track + lát cắt dự kiến | Track F. **GrowSafe AI**, game tình huống giáo dục giới tính và tự bảo vệ cho trẻ, chơi cùng con |
| 2 | Người dùng chính (một vai cụ thể — không phải "học viên nói chung") | Người chơi là trẻ 6-10 tuổi và 11-15 tuổi. Phụ huynh, giáo viên đi kèm: đọc bản tổng kết sau mỗi lượt chơi để nói chuyện tiếp với trẻ. |
| 3 | Pain một câu: ai — đang làm gì — vướng đâu — hậu quả | Phụ huynh và giáo viên muốn dạy trẻ về giới tính, cách tự bảo vệ nhưng ngại mở lời và không biết nói sao cho hợp tuổi, còn trẻ chỉ nghe dặn suông nên nhanh quên, gặp chuyện thật thì lúng túng hoặc bị người xấu dắt mũi. |
| 4 | Bằng chứng đầu — CP1: giả thuyết + nguồn sẽ kiểm · CP2: số đầu tiên + 1 trích dẫn | **CP1, giả thuyết trước khi hỏi:** ≥2/3 phụ huynh hoặc giáo viên kể được ít nhất một lần lúng túng khi giải thích chuyện giới tính cho trẻ, hoặc không biết trẻ sẽ phản ứng ra sao nếu bị dụ giữ bí mật. **Nguồn sẽ kiểm:** phỏng vấn ≥3 phụ huynh hoặc giáo viên ngoài nhóm, thêm khảo sát nhanh hoặc đọc câu hỏi công khai trong các nhóm cha mẹ (ẩn danh). **CP2, số đầu tiên:** khảo sát 20 phiếu hợp lệ, 18/20 (90%) thấy ngại hoặc không biết nói sao cho hợp tuổi, hoặc không chắc trẻ sẽ kể lại khi bị dặn giữ bí mật. Khó nhất là không biết dùng từ cho hợp tuổi (12/20). Trích dẫn: "Đến lúc tôi hỏi 1 em lúc tan học, cô về rồi, em tìm ai? thì em ấy ngồi nghĩ mãi." (phiếu 18, giáo viên). **Phỏng vấn:** 2/3 phụ huynh gặp vướng mắc (P1 bí khi con hỏi vặn và nghĩ bé sẽ giấu quà; P2 nghĩ bé chỉ hiểu sơ sơ; P3 gần như không vướng). Phỏng vấn qua tin nhắn Zalo và Messenger, cả 3 đều có con 6-10 tuổi. Trích dẫn: "bé cx hiểu sơ sơ thôi, kiểu ba mẹ dặn thì nghe theo, chứ chắc ko hiểu sâu đâu" (P2, phụ huynh có con 9 tuổi). Chi tiết: `evidence/summary.md`, `evidence/interviews/`. |
| 5 | **Lát cắt MỘT CÂU** (1 người dùng · 1 việc · 1 quyết định AI · 1 kết quả) | Trẻ chọn một tình huống về ranh giới cơ thể trong game rồi gõ cách mình xử lý, AI đối chiếu với tài liệu chuẩn của đúng nhóm tuổi (có guardrail chặn đầu vào và soát đầu ra) để chấm phản xạ, chỉ lại chỗ sai và soạn bản nháp gợi ý cho phụ huynh hoặc giáo viên duyệt. |
| 6 | AI tự làm đến đâu + 1 dòng lý do: sai thì ai chịu gì | Trong lúc chơi, AI tự dẫn tình huống, chấm câu trả lời và giảng lại. Bản tóm tắt thì phụ huynh hoặc giáo viên duyệt, rồi họ tự quyết nói chuyện với trẻ thế nào. Lý do: nội dung nhạy cảm, nói sai hay lệch tuổi là trẻ sợ hoặc hiểu nhầm, nên AI bị khóa bằng guardrail (thấy dấu hiệu xâm hại thật thì dừng game, hiện tổng đài 111) và không tự gửi đánh giá cho ai. |
| 7 | Phân công có tên | Đỗ Hoàng Vũ và Vũ Quang Minh: thiết kế agent, guardrail, kho tình huống theo độ tuổi. Hoàng Minh Diệp và Trần Thị Hà Anh: thu bằng chứng từ người dùng thật, viết bộ câu thử và metric. |
| — | *(CP2)* Đã đổi gì so với CP1 | Bằng chứng đầu gồm khảo sát 20 phiếu và phỏng vấn 3 phụ huynh qua tin nhắn. Khảo sát cho thấy vướng chính là không biết chọn từ hợp tuổi (12/20), còn ngại thì ít hơn dự đoán (6/20), nên metric bắt AI dùng tên đúng, câu ngắn và gọi tên người cụ thể trẻ tìm được. Trẻ trả lời bằng cách bấm đáp án hoặc tự gõ. Thêm metric không lộ thông tin định danh (5/20 phiếu lo nhất chuyện này). Sửa nguồn của kho quy tắc: quy tắc vùng đồ bơi lấy từ Council of Europe và NSPCC, bỏ quy tắc 5 ngón tay vì chưa có nguồn. Thêm thiết kế chế độ AI đóng vai người lạ do người lớn bật, có guardrail, làm sau CP2 (`docs/game-flow.md`). |

---

# Track F: GrowSafe AI, game tình huống giáo dục giới tính và tự bảo vệ cho trẻ

**Lĩnh vực.** Giáo dục giới tính và kỹ năng tự bảo vệ cho trẻ em, trẻ vị thành niên, có phụ huynh và giáo viên cùng theo dõi.

**Pain.** Phụ huynh và giáo viên muốn dạy trẻ về ranh giới cơ thể và phòng tránh xâm hại nhưng ngại, khó chọn chữ cho đúng tuổi, và không biết trẻ thật sự phản ứng thế nào. Trẻ thì chỉ học lý thuyết một chiều, nên bị dụ dỗ ngoài đời hay trên mạng là lúng túng.

**Insight từ người dùng thật.** Khảo sát 20 phiếu và phỏng vấn 3 phụ huynh cho thấy người lớn không thiếu tài liệu: trường, sách, kênh của bác sĩ đều có. Cái thiếu là cách biết trẻ hiểu thật chưa, như P2 nói bé "hiểu sơ sơ thôi, kiểu ba mẹ dặn thì nghe theo". Cả 3 phụ huynh đều muốn bản tóm tắt cho biết bé hiểu phần nào, còn hổng chỗ nào. Chi tiết: `evidence/summary.md`.

**Người dùng.** Trẻ 6-10 tuổi và 11-15 tuổi chơi trực tiếp, phụ huynh và giáo viên đi kèm. Nhóm liên hệ trực tiếp được phụ huynh có con nhỏ, giáo viên và học sinh quen để hỏi và cho chơi thử trong hai ngày.

**Data.** Nhóm tự soạn kho tình huống và quy tắc chuẩn trong `data/`, viết lại ngắn theo tài liệu công khai: quy tắc vùng đồ bơi theo Council of Europe (The Underwear Rule) và NSPCC (PANTS), các ý về đồng thuận, riêng tư, an toàn trên mạng theo UNESCO (International technical guidance on sexuality education, 2018), cùng Tổng đài 111. Không dùng "quy tắc 5 ngón tay" vì chưa có nguồn. Nguồn từng quy tắc và chỗ còn chưa kiểm link: `data/DATA_CARD.md`. Không thu thập, không lưu thông tin cá nhân của trẻ.

**Lát cắt.** Trẻ chọn một tình huống trong game rồi gõ hoặc chat cách mình xử lý. AI đối chiếu với tài liệu chuẩn của đúng nhóm tuổi, qua 3 lớp guardrail, để chấm phản xạ, chỉ lại chỗ sai và soạn bản nháp phản hồi cho phụ huynh hoặc giáo viên duyệt.

**Công cụ của agent.** `get_scenario(age_group, topic)` (đọc), `search_safety_guideline(age_group, query)` (đọc), `evaluate_child_response(scenario_id, text)` (đọc, chấm trong phiên), `draft_parent_teacher_note(session_summary)` (chỉ tạo bản nháp, không tự gửi đi).

**Bộ câu thử.** Khoảng 20-30 câu. Câu thường là trẻ trả lời đúng hoặc sai theo từng độ tuổi. Câu khó là trẻ trả lời cụt lủn, ấp úng vì sợ bị mắng, hoặc hỏi vặn lại. Câu từ chối gồm nội dung 18+, đòi chẩn đoán bệnh, và tình huống nghi bị xâm hại thật phải dừng game, chỉ số 111. Thêm ít nhất 2 câu thử prompt injection.

**Persona chi phí.** Ít: chơi 1-2 lần mỗi tuần cùng bố mẹ. Vừa: học sinh tự chơi 4-6 lần mỗi tháng. Nhiều: lớp học hoặc câu lạc bộ kỹ năng sống cho chơi nhiều lượt mỗi tuần.

**Bẫy.** Dễ ôm quá nhiều chủ đề cho mọi lứa tuổi rồi không làm xong cái nào. Để AI trả lời tự do không bám tài liệu chuẩn thì dễ dùng chữ lệch tuổi, thậm chí đổ lỗi cho nạn nhân. Và có nguy cơ không phỏng vấn đủ người dùng thật ngoài nhóm.

**An toàn.** 3 lớp guardrail: soát đầu vào, chỉ cho công cụ đọc kho chuẩn, soát giọng điệu đầu ra theo tuổi. AI không đóng vai kẻ xấu khi trẻ đòi. Vai người lạ chỉ có ở chế độ AI đóng vai do người lớn bật, chỉ dùng chiêu có trong kho và qua kiểm duyệt từng câu (`docs/game-flow.md`). AI không chẩn đoán y khoa, không giữ dữ liệu định danh của trẻ. Thấy dấu hiệu xâm hại thật thì dừng game ngay và hướng dẫn gọi tổng đài `111`.
