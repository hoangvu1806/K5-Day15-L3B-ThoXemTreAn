# Kế hoạch Production, Đa luồng & Giám sát — GrowSafe AI

Tài liệu này là lộ trình chuyển GrowSafe AI từ bản demo hackathon sang bản **production chịu tải nhiều người dùng đồng thời**, có cân bằng tải, tối ưu tốc độ/chi phí và đầy đủ theo dõi (log, request, latency, chi phí token, cảnh báo an toàn).

---

## 1. Nút thắt cũ và cách đã xử lý

| # | Nút thắt | Đã xử lý |
|---|---|---|
| 1 | `asyncio.Lock` ép mọi request xếp hàng | Bỏ. `codebase/prod_trace.py` tách trace theo request, `codebase/store.py` khoá theo từng phiên |
| 2 | Gọi model đồng bộ chặn event loop | Chạy trong `asyncio.to_thread`, mỗi lần gọi tối đa `MODEL_TIMEOUT` (20 giây) |
| 3 | Phiên, bản nháp, rate limit trong RAM | Chuyển sang Redis, phiên TTL 45 phút |
| 4 | SQLite ghi đồng thời | Dùng PostgreSQL khi có `DATABASE_URL` |

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

## 3. Lộ trình triển khai

### Đã làm
- Chạy nhiều replica và worker: Redis, PostgreSQL, bỏ khoá toàn cục, timeout model.
- Nginx `limit_req` theo IP (ngưỡng cho cả lớp học sau một NAT), giới hạn theo tài khoản ở backend, miễn trừ `/api/help`.
- Frontend `output: "standalone"`.

### Tiếp theo
1. Chạy stack 2 x 2 sau Nginx, restart một replica, load test 50 người, đo RAM.
2. Metric và log có cấu trúc trong FastAPI (`/metrics`): token, độ trễ từng vai, sự kiện an toàn, số lần postcheck phải thay câu.
3. Cache MP3 của `/api/tts` ở Redis nếu volume dùng chung không đủ.
4. Sao lưu mã hoá ra ngoài server, Cloudflare Proxy trước VPS.

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

## 5. Checklist trước khi mở cho nhiều người

- [x] Đã bỏ `_lock` và tách trace bằng `contextvars`.
- [x] Phiên, bản nháp, rate limit lưu trong Redis.
- [x] `auth.py` dùng được PostgreSQL (`DATABASE_URL`).
- [ ] Load test 50 người trong 2 phút: p95, không lỗi, RAM ổn định.
- [ ] Restart một replica trong lúc chơi, phiên không mất.
- [ ] `python run.py eval` với model thật đạt chuẩn `spec.md` §7.
- [ ] Đã thử khôi phục bản sao lưu DB ít nhất 1 lần.
