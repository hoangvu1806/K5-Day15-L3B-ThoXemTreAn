# Kế hoạch Production, Đa luồng & Giám sát — GrowSafe AI

Tài liệu này là lộ trình chuyển GrowSafe AI từ bản demo hackathon sang bản **production chịu tải nhiều người dùng đồng thời**, có cân bằng tải, tối ưu tốc độ/chi phí và đầy đủ theo dõi (log, request, latency, chi phí token, cảnh báo an toàn).

---

## 1. Phân tích nút thắt trong codebase hiện tại

Trước khi nâng `API_REPLICAS > 1` hoặc `UVICORN_WORKERS > 1`, cần nắm rõ 4 giới hạn hiện tại:

| # | Nút thắt trong code hiện tại | Vị trí | Ảnh hưởng khi nhiều user | Giải pháp chuẩn |
|---|---|---|---|---|
| 1 | `asyncio.Lock` (`_lock`) ép mọi request xếp hàng tuần tự | `codebase/server.py` | 10 người bấm cùng lúc → người thứ 10 chờ 20–40 giây | Tách trace sang `contextvars` (không sửa `tracing.py` của khung eval, bọc bằng lớp production riêng) và bỏ `_lock` |
| 2 | Gọi `litellm.completion` đồng bộ trên thread chính | `codebase/ai.py`, `codebase/agent.py`, `codebase/ask.py` | Chặn event loop của Uvicorn khi chờ OpenRouter | Dùng `litellm.acompletion` hoặc bọc `asyncio.to_thread` + đặt `timeout=20s` |
| 3 | Session, Draft & Rate limit nằm trong RAM tiến trình | `game.SESSIONS`, `ask.ASK_SESSIONS`, `tools.DRAFTS`, `auth._rates` | Không chạy được ≥ 2 replica; restart là mất phiên; để lâu tăng RAM | Chuyển sang **Redis** (có sẵn trong `docker-compose.yml`) với TTL 45 phút |
| 4 | SQLite ghi đồng thời từ nhiều container | `codebase/auth.py` | Dễ gặp `database is locked` khi scale nhiều replica | Giữ SQLite WAL ở Pha 0 (1 replica); chuyển `auth.py` sang **PostgreSQL** (`--profile scale`) ở Pha 2 |

---

## 2. Kiến trúc tổng thể & Cân bằng tải

```text
Người dùng (Trình duyệt)
   │  HTTPS / HTTP2 (443)
   ▼
[Nginx Reverse Proxy + limit_req]
   ├── /assets/*, /_next/static/*  → Cache 1 năm (immutable) + nén gzip
   ├── /                           → frontend:3016 (Next.js)
   ├── /api/help                   → Không áp limit_req (luôn mở cho nút 111)
   ├── /api/auth/*                 → limit_req 10r/m → api:6161
   ├── /api/*, /health             → limit_req 30r/m + least_conn → api-1, api-2, ... (6161)
   └── /metrics                    → Chặn 403 từ Internet (chỉ Prometheus nội bộ đọc)
```

**Vì sao chọn `least_conn` cho AI API?**
- Request `/api/answer` hoặc `/api/ask/message` có thời gian xử lý rất không đều (từ 0,2s nếu bị precheck chặn đến 5–8s nếu gọi 2–3 bước LLM).
- Thuật toán `least_conn` luôn đẩy request mới vào replica đang rảnh nhất, tránh tình trạng 1 replica kẹt hàng đợi trong khi replica khác ngồi không.

---

## 3. Lộ trình triển khai theo 3 pha

### Pha 0 — Lên sóng ngay trên 1 VPS (10–30 user đồng thời, không cần sửa code lõi)
- Dùng ngay `infra/docker-compose.yml` với `API_REPLICAS=1`, `UVICORN_WORKERS=1`, SQLite WAL gắn volume `growsafe_data`.
- Nginx bật `gzip`, `limit_req` theo IP (`api_limit` 30r/m, `auth_limit` 10r/m, miễn trừ `/api/help` 111), cache 1 năm cho `/assets/*`, xuất **JSON access log** có sẵn `request_time` và `upstream_response_time`.
- Bật `--profile logs` (Dozzle) hoặc `--profile obs` (Nginx Exporter + Loki đọc JSON log của Nginx → đã có ngay biểu đồ **RPS, Status 2xx/4xx/5xx, Latency p50/p95/p99** từng endpoint mà chưa cần sửa code backend!).
- Thu hẹp CORS trong `codebase/server.py` về đúng `https://<DOMAIN>`.

### Pha 1 — Mở khóa đa luồng thật & Giảm chi phí/độ trễ (50–300 user đồng thời)
1. **Bỏ `_lock`, chạy async song song:**
   - Tạo module `codebase/prod_trace.py` dùng `contextvars.ContextVar` cho `server.py` (giữ nguyên `tracing.py` cho `run.py eval` / `simulate`).
   - Chuyển các lệnh gọi `call_model(...)` trong `game.py` và `ask.py` sang `await asyncio.to_thread(...)` (hoặc `litellm.acompletion`) với timeout cứng `20s`.
   - Gắn `httpx` connection pooling & giới hạn semaphore OpenRouter nếu cần.
2. **Đưa trạng thái phiên & chống spam sang Redis (`redis://redis:6379/0`):**
   - `session:{id}` và `ask:{id}` lưu JSON với TTL **45 phút** (tự dọn bộ nhớ).
   - Rate limit (`require_ai_user`, `register`, `login` brute-force) dùng Redis `INCR` + `EXPIRE` để dùng chung giữa mọi replica.
   - **Cache MP3 cho `/api/tts`:** key `tts:{role}:{sha256(text)}`, TTL 24 giờ → câu đọc lặp lại trả trong **< 20ms**, không tốn thêm phí OpenRouter TTS & CPU `ffmpeg`.
3. **Gắn Metrics + Structured Log vào FastAPI:**
   - Thêm `prometheus-fastapi-instrumentator` vào `requirements.txt` → mở `/metrics` nội bộ.
   - Xuất 4 metric nghiệp vụ:
     - `growsafe_llm_tokens_total{role, direction}` — theo dõi token & chi phí USD realtime.
     - `growsafe_llm_duration_seconds{role}` — tách độ trễ Giám khảo / Tin / Góc Tò Mò / TTS.
     - `growsafe_safety_events_total{kind}` — đếm `nghi_xam_hai_that`, `prompt_injection`, `18_plus`, `over_ceiling`.
     - `growsafe_postcheck_fallback_total{surface}` — cảnh báo sớm nếu model bắt đầu trả lệch chuẩn.
   - Log JSON chuẩn hóa ra `stdout` (đã qua `mask_pii`, tuyệt đối không log câu gốc của trẻ) để Promtail đẩy sang Loki.
4. **Tối ưu image Frontend siêu nhẹ (tùy chọn):**
   - Bật `output: "standalone"` (giảm image frontend từ ~220MB xuống ~110MB) hoặc `output: "export"` để Nginx serve file tĩnh trực tiếp (0MB RAM Node.js).

### Pha 2 — Mở rộng ngang nhiều Replica & High Availability (300–2.000+ user đồng thời)
- Bật `--profile scale` để chuyển `codebase/auth.py` sang **PostgreSQL 16** (đã gom toàn bộ SQL trong 1 file `auth.py` nên đổi rất gọn).
- Tăng `API_REPLICAS=2..4` trong `infra/.env.prod`, Nginx cân bằng tải `least_conn` qua upstream `growsafe_api` (nhớ dùng `resolver 127.0.0.11` hoặc reload Nginx khi thay đổi số replica).
- Tách cron backup tự động (`pg_dump` nén + đẩy sang S3/Backblaze B2 mã hóa, giữ 14 ngày).
- Đặt **Cloudflare Proxy** trước VPS để chống DDoS tầng L7, cache toàn bộ `/assets/*` ở edge toàn cầu và giấu IP thật của VPS.

---

## 4. Ngưỡng cảnh báo (Alerting) đề xuất trong Grafana

| Chỉ số | Ngưỡng cảnh báo | Hành động |
|---|---|---|
| Tỉ lệ lỗi `5xx` trên `/api/*` | > 2% trong 5 phút | Kiểm tra trạng thái OpenRouter; cân nhắc bật `SAFE_MODE=1` |
| Latency `p95` của `/api/answer` hoặc `/api/ask/message` | > 8 giây trong 5 phút | Kiểm tra timeout OpenRouter, xem có nghẽn `_lock`/worker không |
| Số lần `429 Rate Limit` tăng đột biến | > 50 lần / 5 phút | Kiểm tra bot spam ở log Nginx, siết IP tại firewall/Cloudflare |
| Số sự kiện `postcheck_fallback` tăng đột biến | > 10% tổng lượt | Model upstream có thể vừa thay đổi hành vi → chạy lại `python run.py eval` |
| Sự kiện `nghi_xam_hai_that` (111) | Tăng bất thường | Rà soát mẫu trace (đã che PII) xem có bắt nhầm regex không |
| RAM / Disk VPS | > 80% | Kiểm tra retention Prometheus/Loki hoặc tăng cấu hình VPS |

---

## 5. Checklist trước khi bật `API_REPLICAS > 1`

- [ ] Đã bỏ `_lock` và tách trace bằng `contextvars`.
- [ ] `SESSIONS`, `ASK_SESSIONS`, `DRAFTS`, rate-limit đã lưu trong Redis.
- [ ] `auth.py` đã chuyển sang PostgreSQL (`DATABASE_URL`).
- [ ] Đã chạy load test ngắn (k6 / Locust: 50 VU đồng thời trong 2 phút) kiểm tra p95, lỗi 0%, RAM ổn định.
- [ ] Đã test khôi phục bản sao lưu DB ít nhất 1 lần.
