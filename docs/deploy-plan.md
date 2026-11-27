# Kế hoạch deploy, bảo trì và bảo vệ production — GrowSafe AI

Bản nháp ngày 27/11, viết theo code hiện tại (`codebase/server.py`, `agent.py`, `guardrails.py`, `tools.py`). Code bây giờ mới là bản demo. File này ghi những gì phải làm trước khi cho người dùng thật chơi, và cách giữ cho bản chạy thật an toàn sau đó.

Frontend game chưa nằm trong repo này, nên phần frontend dưới đây chỉ là gợi ý.

## 0. Phải sửa trước khi có URL công khai

| # | Vấn đề | Chỗ trong code | Hậu quả | Cách sửa |
|---|---|---|---|---|
| 1 | `GET /api/drafts` không cần đăng nhập | `codebase/server.py`, hàm `drafts()` | Ai có URL cũng đọc được bản nháp nhận xét về mọi trẻ | Bỏ endpoint trả toàn bộ `DRAFTS`. Thay bằng `POST /api/session/end` (đã thiết kế trong `docs/game-flow.md`) chỉ trả bản nháp của đúng `session_id`, rồi xoá khỏi RAM. Muốn vậy bản nháp phải ghi `session_id` (hiện `draft_parent_teacher_note` chưa ghi) và `draft_id` phải đổi sang mã ngẫu nhiên, vì `"D%d" % (len(DRAFTS) + 1)` sẽ trùng mã khi đã xoá bớt |
| 2 | Không giới hạn số lượt gọi | `POST /api/chat` | Bị spam là cháy tiền key OpenRouter | Giới hạn theo IP / phiên (vd 20 lượt mỗi phút), đặt hạn mức chi tiêu ngay trên key OpenRouter |
| 3 | CORS `allow_origins=["*"]` | `codebase/server.py`, dòng `add_middleware` | Trang web bất kỳ cũng gọi được API | Chỉ cho domain của frontend game |

Mấy giới hạn khác sẽ gặp ngay khi có vài người chơi cùng lúc:

- `_lock` trong `server.py` bắt mọi request xếp hàng, nên mỗi lúc chỉ một người chơi được. Lý do: `tracing.py` giữ trạng thái trong biến toàn cục.
- `DRAFTS` (trong `tools.py`) và session của `InMemoryRunner` (trong `agent.py`) chỉ nằm trong RAM và không có gì dọn, nên bộ nhớ cứ tăng. Cần dọn phiên và bản nháp quá 30 phút. Restart thì mất là chấp nhận được (xem mục 1).
- `server.py` chạy trực tiếp thì bind `127.0.0.1`. Lên container phải đổi sang `0.0.0.0`.

## 1. Kiến trúc deploy

```
[Game frontend, file tĩnh]  →  [FastAPI backend, container]  →  OpenRouter
  Cloudflare Pages / Vercel       Cloud Run / Render / Fly.io
                                  region Singapore cho gần VN
                                  phiên chơi, bản nháp: trong RAM
                                  log, trace: chỉ bản đã che thông tin định danh
```

- **Không dùng DB.** Phiên chơi và bản nháp chỉ sống trong RAM, trong lúc chơi. Kết phiên, API (`POST /api/session/end`, chưa làm) trả bản nháp về luôn để màn hình người lớn hiện ngay trên máy đang chơi. Người lớn đọc, tự chép hoặc tải về nếu muốn giữ; server không giữ lại gì. Cách này cũng hợp nguyên tắc "thu ít dữ liệu nhất": không có kho dữ liệu về trẻ nào để lộ. Đổi lại, restart server giữa phiên thì phiên đó mất, trẻ chơi lại từ màn mới.
- **Backend:** Dockerfile chạy `uvicorn server:app --app-dir codebase --host 0.0.0.0 --port $PORT`. Chạy 1 instance, đặt min-instances = 1 để trẻ không phải chờ khởi động nguội. Vì trạng thái nằm trong RAM nên không chạy nhiều instance được (request của một phiên phải về đúng instance đó); 1 instance đủ cho demo và pilot.
- **Secrets:** `API_KEY` để trong secret manager của nền tảng deploy, không đưa vào image hay repo. `.gitignore` đã chặn `.env`.
- **Ba môi trường:**

  | Môi trường | Model | Key | Dùng để |
  |---|---|---|---|
  | dev | chế độ giả (`MODEL_PROVIDER` trống) | không cần | viết code, không tốn tiền |
  | staging | model thật | key riêng, hạn mức thấp | chạy eval trước khi lên prod |
  | prod | model thật | key riêng, có hạn mức và cảnh báo chi tiêu | người dùng thật |

## 2. Quy trình đưa thay đổi lên production

Với app này, đổi prompt, đổi model hay sửa kho tình huống đều nguy hiểm ngang đổi code. Mọi thay đổi phải qua eval:

1. Mở PR. CI chạy `python run.py check` và test cho `guardrails.py` (các mẫu precheck, postcheck, `mask_pii`).
2. PR đụng tới `codebase/agent.py` (prompt `SYSTEM`), `codebase/ai.py` (model), `codebase/guardrails.py` hoặc `data/*.json` thì chạy `python run.py eval` trên staging rồi chấm.
3. Chỉ deploy khi đạt chuẩn ở `spec.md` §7: ≥ 80% tổng, 100% câu `tu_choi`, không câu nào trượt `dung_tuoi_khong_do_loi` hay `khong_lo_thong_tin_dinh_danh`. Trượt một câu `tu_choi` là không deploy.
4. Thêm hoặc sửa màn trong `data/scenarios.json` cần ít nhất một người duyệt nội dung (đặt bằng CODEOWNERS). Giữ đúng luật trong `docs/game-flow.md`: chỉ màn đã duyệt mới tới tay trẻ.
5. Ghim phiên bản model trong `MODEL_NAME`, không dùng alias kiểu "latest". Đổi model thì coi như một lần release mới và chạy lại eval từ đầu.
6. Mỗi lần deploy gắn tag, giữ image cũ để rollback bằng một lệnh.

## 3. Bảo vệ production khi đang chạy

### An toàn của trẻ

- Precheck hiện dùng regex. Nếu nó để lọt một câu trẻ kể chuyện bị xâm hại thật thì đó là lỗi đắt nhất của cả hệ thống. Cần thêm lớp nhận diện thứ hai bằng model (đã thiết kế trong `docs/game-flow.md`) và giữ nút "Con cần giúp" ở mọi màn.
- Mỗi tuần lấy mẫu trace (đã che thông tin định danh) để người trong nhóm đọc lại. Câu nào lọt thì thêm vào `eval/benchmark.csv` để lần eval sau tự bắt.
- Khi model lỗi hoặc OpenRouter sập: trả `SAFE_FALLBACK` hoặc lùi về kịch bản có sẵn. Không để trẻ thấy lỗi 500 giữa lúc đang kể chuyện.
- Có công tắc khẩn: một biến môi trường kiểu `SAFE_MODE=1` để tắt phần AI trả lời tự do, chỉ chạy kịch bản có sẵn, bật được ngay khi có sự cố.

### Dữ liệu

- Giữ nguyên nguyên tắc không thu tên, trường, địa chỉ, số điện thoại. `mask_pii` chạy trước khi gửi model và trước khi ghi log.
- Trace và log có hạn lưu (vd 30 ngày) rồi tự xoá. Giới tính chỉ nằm trong phiên chơi, không ghi ra file.
- Dữ liệu trẻ em ở Việt Nam chịu quy định về bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP và Luật Bảo vệ dữ liệu cá nhân). Xử lý dữ liệu của trẻ cần phụ huynh đồng ý, nên màn hình đầu do người lớn mở phải có bước đồng ý. *Nhóm chưa kiểm với người hiểu luật; phải kiểm trước khi chạy với người dùng thật.*
- Chọn nhà cung cấp model không dùng dữ liệu để huấn luyện (OpenRouter có tuỳ chọn này trong phần cài đặt privacy).

### Chi phí và lạm dụng

- Đặt hạn mức tháng trên key, báo khi dùng tới 50% và 80%. Lấy ngưỡng từ kịch bản "cao" trong `cost/cost-estimate.md` (bảng đó còn trống, điền sau khi chạy `python run.py simulate`).
- `MAX_LLM_CALLS = 6` trong `agent.py` đã chặn agent gọi model mãi không dừng. Thêm timeout cho mỗi request (vd 20 giây).

## 4. Giám sát

| Theo dõi | Báo động khi |
|---|---|
| `/health` (đã có) | không trả lời, kiểm mỗi phút |
| Tỉ lệ lỗi, độ trễ p95 của `/api/chat` | lỗi > 2%, p95 > 8 giây *(tự ước tính)* |
| Số lượt `stopped = nghi_xam_hai_that` | tăng đột biến → người đọc lại ngay |
| Số lần postcheck phải thay câu | tăng → prompt hoặc model đang trôi |
| Token, chi phí mỗi ngày | lệch xa ước tính trong `cost/` |

## 5. Bảo trì định kỳ

- **Hàng tuần:** đọc mẫu trace, thêm câu thử từ lỗi gặp thật.
- **Hàng tháng:** cập nhật thư viện trong `requirements.txt` (`google-adk`, `litellm` đổi nhanh). Nâng phiên bản trên staging, chạy lại eval rồi mới lên prod.
- **Khi đổi kho:** người duyệt nội dung đối chiếu lời dặn an toàn với nguồn của quy tắc trong `data/guidelines.json` (qua `guideline_codes` của màn). Trường `source` trong `data/scenarios.json` chỉ cho biết tình huống lấy từ đâu (11 màn: 3 từ phiếu khảo sát, 8 `tu_viet`).
- **Trước pilot:** `data/guidelines.json` còn ghi chú nguồn chưa kiểm (UNESCO "chưa kiểm số mục và link") và một nguồn UNICEF "CHƯA TÌM ĐƯỢC tài liệu cụ thể". Phải kiểm xong hoặc bỏ quy tắc đó trước khi trẻ thật chơi.

## 6. Lộ trình

1. **Demo hackathon (28/11):** chạy local hoặc một instance có token đơn giản.
2. **Pilot một lớp học:** sửa 3 lỗi ở mục 0, trả bản nháp theo phiên rồi xoá khỏi RAM, dọn phiên cũ, giới hạn lượt gọi, eval trong CI, bước phụ huynh đồng ý. Vẫn không dùng DB.
3. **Mở rộng:** bỏ `_lock` (chuyển trace sang `contextvars` trong bản production, vì `tracing.py` của khung hackathon không được sửa), thêm lớp nhận diện xâm hại bằng model, rồi mới bật chế độ AI đóng vai. Chỉ cân nhắc DB khi một instance không còn đủ tải hoặc phụ huynh cần xem lại bản nháp trên máy khác.
