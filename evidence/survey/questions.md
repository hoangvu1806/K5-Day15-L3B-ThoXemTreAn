# Khảo sát phụ huynh / giáo viên — bộ câu hỏi và cách thu

- **Người thu:** Hoàng Minh Diệp
- **Form:** Google Form, tạo bằng [`create_form.gs`](create_form.gs). Ẩn danh: không thu email, không bắt đăng nhập, không giới hạn 1 lượt.
- **Kênh gửi:** Zalo, Messenger (tin nhắn và nhóm của người quen là phụ huynh, giáo viên)
- **Mở:** 17:40 Thứ Sáu 27/11/2026 · **Chốt:** 18:30 Thứ Sáu 27/11/2026
- **Thu được:** 21 phiếu · hợp lệ 20 · loại 1 (phiếu 20: trả lời đùa cợt, xem cột `ghi_chu` trong `results.csv`)
- **Dữ liệu:** [`results.csv`](results.csv) (đã bỏ email vì form không thu; đã ẩn một câu trả lời phản cảm ở phiếu 20) · **Cách đếm:** `python evidence/survey/count.py`

## Lời mở đầu trên form

> Khảo sát ngắn khoảng 2 phút của nhóm sinh viên, giúp chúng tôi làm một trò chơi nhỏ dạy trẻ 6–15 tuổi cách giữ an toàn cho cơ thể.
> Ẩn danh, không cần đăng nhập. Vui lòng không ghi tên bạn hay tên trẻ.

## Câu hỏi (giữ nguyên câu)

| # | Câu hỏi | Kiểu | Lựa chọn |
|---|---|---|---|
| 1 | Bạn là | Chọn một + Khác | Phụ huynh · Giáo viên · Cả hai · Khác |
| 2 | Trẻ (con hoặc học sinh của bạn) bao nhiêu tuổi? | Chọn nhiều | Dưới 6 · 6–10 · 11–15 · Trên 15 |
| 3 | Khi dạy trẻ những điều như "không ai được chạm vào vùng đồ bơi của con" hay "không đi theo người lạ", bạn thấy thế nào? | Chọn một | Dễ nói · Hơi ngại nhưng vẫn nói · Không biết nói sao cho hợp tuổi · Chưa dạy bao giờ |
| 4 | Điều gì làm bạn thấy khó nhất? | Chọn tối đa 2 | Không biết dùng từ nào cho hợp tuổi · Thấy ngại · Không có tài liệu đáng tin · Trẻ nghe xong là quên · Không có thời gian · Không thấy khó |
| 5 | Bạn có từng hỏi thử trẻ "nếu… thì con làm gì?" để xem trẻ đã hiểu chưa? | Chọn một | Có, thường xuyên · Thỉnh thoảng · Chưa bao giờ |
| 6 | Nếu có người cho trẻ quà rồi dặn "đừng kể với bố mẹ nhé", bạn có chắc trẻ sẽ kể lại với bạn không? | Chọn một | Chắc chắn sẽ kể · Chắc là kể, nhưng không chắc lắm · Không biết |
| 7 | Có một trò chơi 5 phút: trẻ chọn cách xử lý một tình huống, được giải thích chỗ chưa đúng, còn bạn nhận được gợi ý để nói chuyện tiếp với trẻ. Bạn sẽ cho trẻ chơi bao lâu một lần? | Chọn một | Không cho chơi · Vài lần mỗi tháng · 1–2 lần mỗi tuần · Dùng cho cả lớp, nhiều lượt mỗi tuần |
| 8 | Bạn lo nhất điều gì ở trò chơi như vậy? | Chọn một + Khác | Nội dung không hợp tuổi · Lộ thông tin của trẻ · Trẻ chơi một mình, không ai giải thích thêm · Không lo gì · Khác |
| 9 | Có lần nào trẻ hỏi một câu về cơ thể khiến bạn không biết trả lời sao không? Lúc đó bạn đã nói gì? | Đoạn văn, không bắt buộc | — |

## Giới hạn cần biết khi đọc số

- Form ẩn danh nên nhóm **không kiểm được** từng người có ở ngoài nhóm hay không. Nhóm chỉ gửi cho người quen là phụ huynh, giáo viên, các bạn học viên.
- 3/20 phiếu hợp lệ có vai "Khác" (người thân có cháu nhỏ, gia sư, chú/bác). 6/20 phiếu có trẻ dưới 6 tuổi, ngoài nhóm tuổi của game. Vì vậy `count.py` in thêm số riêng cho trẻ 6–15 tuổi.
