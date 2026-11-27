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
npm run dev                          # http://localhost:3000
```

API ở địa chỉ khác thì đặt `NEXT_PUBLIC_API_URL` (xem `.env.example`).

## Cấu trúc

| File | Làm gì |
|---|---|
| `components/game/Stage.tsx` | Sân khấu cố định 1376×768, đúng tỉ lệ ảnh nền, co giãn đều theo màn hình. Phần thừa lấp bằng ảnh nền làm mờ. Không crop, không thanh cuộn. Màn dọc trên điện thoại hiện lời nhắc xoay ngang |
| `components/game/SetupScreen.tsx` | Người lớn chọn nhóm tuổi, giới tính (không bắt buộc), chế độ hội thoại |
| `components/game/IntroScreen.tsx` | Giới thiệu màn trên bản đồ hành trình |
| `components/game/PlayScreen.tsx` | Tình huống, nhân vật, nút đáp án, ô tự gõ, lời phản hồi của bạn cú, chip 3 hành động an toàn |
| `components/game/RewardScreen.tsx` | Lật thẻ quy tắc, sao, cách an toàn khi chưa đạt |
| `components/game/HelpScreen.tsx` | "Con cần giúp": dừng game, hướng dẫn, gọi 111. Mất mạng vẫn hiện được |
| `components/game/DoneScreen.tsx` | Kết phiên, huy hiệu, thẻ đã nhận, Góc phụ huynh (bản nháp `cho_duyet`, chỉ sao chép, không gửi) |
| `lib/store.ts` | Trạng thái game (zustand) |
| `lib/api.ts` | Gọi 4 endpoint `/api/session`, `/api/answer`, `/api/help`, `/api/session/end` |
| `lib/sound.ts` | Âm thanh và nhạc nền (howler) |
| `lib/assets.ts` | Đường dẫn assets theo tên trong `data/scenarios.json` (`scene.bg`, `scene.npc`, `scene.card`) |

Thư viện: `motion` (chuyển cảnh, nhân vật), `howler` (âm thanh), `canvas-confetti` (pháo giấy), `zustand` (trạng thái), `clsx`. Font Baloo 2 và Nunito (có tiếng Việt) qua `next/font`.

Chưa có ảnh nhân vật bé trai: chọn Nam hoặc Không muốn nói thì dùng nhân vật trung tính.
