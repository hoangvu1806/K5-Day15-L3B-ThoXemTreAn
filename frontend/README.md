# Giao diện game GrowSafe

Bản đang chạy: https://canthansaulungkiabeiu.site/ (build bằng `infra/Dockerfile.frontend`).

Next.js 16 + Tailwind 4. Game chạy hoàn toàn phía trình duyệt và gọi API của `codebase/server.py`.

## Chạy

```
# 1. API (ở thư mục gốc repo, cần .env đã nối model; không có .env thì chạy chế độ giả)
python -m pip install -r requirements.txt
python codebase/server.py            # http://127.0.0.1:6161

# 2. Giao diện
cd frontend
npm install
npm run dev                          # http://localhost:3016
```

API ở địa chỉ khác thì đặt `NEXT_PUBLIC_API_URL` (xem `.env.example`).

## Cấu trúc

| File | Làm gì |
|---|---|
| `components/game/Stage.tsx` | Sân khấu cố định 1376×768, đúng tỉ lệ ảnh nền, co giãn đều theo màn hình. Phần thừa lấp bằng ảnh nền làm mờ. Không crop, không thanh cuộn. Màn dọc trên điện thoại hiện lời nhắc xoay ngang |
| `components/game/Game.tsx` | Ráp các màn, lớp phủ (Cài đặt, Tạm dừng, Tài khoản, Góc phụ huynh, xác nhận xoá tiến độ). Phím Esc / nút back của trình duyệt mở menu tạm dừng. Theo dõi mất mạng |
| `components/game/SetupScreen.tsx` | Hồ sơ (người lớn làm): nhóm tuổi, giới tính Nam/Nữ (chọn nhân vật Bin/Na, Khôi/Mai) |
| `components/game/HomeScreen.tsx` | Màn hình chính: Tin lớn dần theo số thẻ, "Chơi tiếp", Bản đồ / Điện thoại, Sổ tay, Góc Tò Mò, Bàn tay tin cậy, Góc phụ huynh, Cài đặt |
| `components/game/AskScreen.tsx` | Góc Tò Mò: trẻ hỏi, Tin giải đáp giáo dục giới tính đúng trần tuổi, chip câu hỏi gợi ý, mic, tối đa 10 câu |
| `components/game/AccountPanel.tsx` | Đăng nhập / tạo tài khoản cho người lớn (có ô đồng ý), đồng bộ bộ thẻ, đăng xuất. Cần đăng nhập để gọi AI |
| `components/game/MapScreen.tsx` | Bản đồ 6-10 (5 địa điểm, sáng đèn khi xong) và điện thoại 11-15 (app có chấm đỏ khi còn màn chưa chơi). Tin gợi ý nơi đi tiếp |
| `components/game/IntroScreen.tsx` | Giới thiệu màn, câu đến địa điểm mới |
| `components/game/PlayScreen.tsx` | Tình huống hoặc khung chat người lạ (nhãn "Người lạ trong trò chơi"), nhân vật, lời nhận xét của Tin (không báo đúng sai), "Trả lời lại" / "Đi tiếp", nghe lại |
| `components/game/Dock.tsx` | Khu trả lời: mic bấm để bật, bấm lần nữa để tắt + bước xác nhận chữ, ô gõ, nút Gợi ý. Không có nút đáp án |
| `components/game/DetectiveScreen.tsx` | Thám tử nhận chiêu sau màn hội thoại, thẻ chiêu |
| `components/game/RewardScreen.tsx` | Lật thẻ quy tắc, sao, Tin lớn thêm nấc (chỉ ở cuối phiên) |
| `components/game/NotebookScreen.tsx` | Sổ tay: thẻ quy tắc và thẻ chiêu đã nhận, mất mạng vẫn mở |
| `components/game/HandScreen.tsx` | Bàn tay tin cậy (6-10): 5 ngón tay, mỗi ngón một vai người lớn, không dùng AI |
| `components/game/HelpScreen.tsx` | Màn cần giúp viết riêng cho từng nhóm tuổi, gọi 111. Mất mạng vẫn hiện được |
| `components/game/DoneScreen.tsx` | Kết phiên, huy hiệu, câu chào tạm biệt |
| `components/game/ParentCorner.tsx` | Góc phụ huynh: bản nháp `cho_duyet` (kết quả từng màn, mục "Cần người lớn lưu ý"), chỉ sao chép, không gửi; đổi hồ sơ, xoá tiến độ |
| `components/game/Overlays.tsx` | Cài đặt (3 thanh âm lượng, tốc độ đọc, cỡ chữ, tự đọc to, giảm chuyển động), Tạm dừng, xác nhận về nhà, xác nhận xoá tiến độ. Khoá phép tính đã bỏ |
| `lib/store.ts` | Trạng thái game (zustand) |
| `lib/api.ts` | Gọi `/api/session`, `/api/level`, `/api/answer`, `/api/hint`, `/api/detective`, `/api/help`, `/api/session/end`, `/api/ask/*`, `/api/tts`, `/api/auth/*`, `/api/progress` (gửi token đăng nhập) |
| `lib/local.ts` | Hồ sơ, cài đặt, tiến độ, thẻ, token đăng nhập lưu trong `localStorage`; tiến độ dạng mã được đồng bộ vào tài khoản khi đã đăng nhập |
| `lib/voice.ts` | Đọc to: file đã thu âm, TTS qua server, lùi về giọng trình duyệt |
| `lib/speech.ts` | Nhận giọng (Web Speech API, `vi-VN`, bấm để bật / tắt) |
| `lib/sound.ts` | Hiệu ứng và nhạc nền (howler), âm lượng theo cài đặt |
| `lib/assets.ts` | Đường dẫn assets theo tên trong `data/scenarios.json` |

Thư viện: `motion` (chuyển cảnh, nhân vật), `howler` (âm thanh), `canvas-confetti` (pháo giấy), `zustand` (trạng thái), `clsx`. Font Baloo 2 và Nunito (có tiếng Việt) qua `next/font`.

Ảnh còn thiếu theo `docs/de-xuat-sprint-3.md` mục 7 (chú Toàn, cô Thủy, bác sĩ, anh họ, người lạ áo shipper, `hand_trusted_5`, `sfx_mic_on/off`): đang dùng ảnh tạm, bàn tay vẽ bằng SVG, tiếng bật/tắt có sẵn.
