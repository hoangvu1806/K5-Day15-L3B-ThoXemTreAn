# Giao diện game GrowSafe

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
| `components/game/Game.tsx` | Ráp các màn, lớp phủ (Cài đặt, Tạm dừng, khoá người lớn, Góc phụ huynh). Phím Esc / nút back của trình duyệt mở menu tạm dừng. Theo dõi mất mạng |
| `components/game/SetupScreen.tsx` | Hồ sơ (người lớn làm): nhóm tuổi, giới tính Nam/Nữ (chọn nhân vật Bin/Na, Khôi/Mai) |
| `components/game/HomeScreen.tsx` | Màn hình chính: Tin lớn dần theo số thẻ, "Chơi tiếp", Bản đồ / Điện thoại, Sổ tay, Bàn tay tin cậy, Góc phụ huynh, Cài đặt |
| `components/game/MapScreen.tsx` | Bản đồ 6-10 (5 địa điểm, sáng đèn khi xong) và điện thoại 11-15 (app có chấm đỏ khi còn màn chưa chơi). Tin gợi ý nơi đi tiếp |
| `components/game/IntroScreen.tsx` | Giới thiệu màn, câu đến địa điểm mới |
| `components/game/PlayScreen.tsx` | Tình huống hoặc khung chat người lạ (nhãn "Người lạ trong trò chơi"), nhân vật, lời phản hồi của Tin, nghe lại |
| `components/game/Dock.tsx` | Khu trả lời: mic giữ để nói + bước xác nhận chữ, ô gõ, nút Gợi ý. Không có nút đáp án |
| `components/game/DetectiveScreen.tsx` | Thám tử nhận chiêu sau màn hội thoại, thẻ chiêu |
| `components/game/RewardScreen.tsx` | Lật thẻ quy tắc, sao, Tin lớn thêm nấc |
| `components/game/NotebookScreen.tsx` | Sổ tay: thẻ quy tắc và thẻ chiêu đã nhận, mất mạng vẫn mở |
| `components/game/HandScreen.tsx` | Bàn tay tin cậy (6-10): 5 ngón tay, mỗi ngón một vai người lớn, không dùng AI |
| `components/game/HelpScreen.tsx` | Màn cần giúp viết riêng cho từng nhóm tuổi, gọi 111. Mất mạng vẫn hiện được |
| `components/game/DoneScreen.tsx` | Kết phiên, huy hiệu, câu chào tạm biệt |
| `components/game/ParentCorner.tsx` | Góc phụ huynh (sau khoá người lớn): bản nháp `cho_duyet`, chỉ sao chép, không gửi; đổi hồ sơ, bật/tắt mic, xoá tiến độ |
| `components/game/Overlays.tsx` | Cài đặt (3 thanh âm lượng, tốc độ đọc, cỡ chữ, tự đọc to, giảm chuyển động), Tạm dừng, khoá người lớn (phép tính đọc bằng chữ) |
| `lib/store.ts` | Trạng thái game (zustand) |
| `lib/api.ts` | Gọi `/api/session`, `/api/level`, `/api/answer`, `/api/hint`, `/api/detective`, `/api/help`, `/api/session/end`, `/api/tts` |
| `lib/local.ts` | Hồ sơ, cài đặt, tiến độ, thẻ lưu trong `localStorage` (không gửi lên server) |
| `lib/voice.ts` | Đọc to: file đã thu âm, TTS qua server, lùi về giọng trình duyệt |
| `lib/speech.ts` | Nhận giọng (Web Speech API, `vi-VN`, giữ để nói) |
| `lib/sound.ts` | Hiệu ứng và nhạc nền (howler), âm lượng theo cài đặt |
| `lib/assets.ts` | Đường dẫn assets theo tên trong `data/scenarios.json` |

Thư viện: `motion` (chuyển cảnh, nhân vật), `howler` (âm thanh), `canvas-confetti` (pháo giấy), `zustand` (trạng thái), `clsx`. Font Baloo 2 và Nunito (có tiếng Việt) qua `next/font`.

Ảnh còn thiếu theo `docs/de-xuat-sprint-3.md` mục 7 (chú Toàn, cô Thủy, bác sĩ, anh họ, người lạ áo shipper, `hand_trusted_5`, `sfx_mic_on/off`): đang dùng ảnh tạm, bàn tay vẽ bằng SVG, tiếng bật/tắt có sẵn.
