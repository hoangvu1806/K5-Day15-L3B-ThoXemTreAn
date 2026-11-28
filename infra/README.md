# GrowSafe AI — Hạ tầng Production (`infra/`)

Thư mục này chứa toàn bộ cấu hình Docker Compose, Dockerfile tối ưu image, Reverse Proxy (**Nginx**), và bộ giám sát (Prometheus, Nginx Exporter, Loki, Promtail, Grafana, Dozzle) để chạy GrowSafe AI trên production.

> Xem lộ trình tối ưu đa luồng, tách session sang Redis và mở rộng nhiều replica trong [`PLAN.md`](./PLAN.md).

## 1. Cấu trúc thư mục

```text
infra/
├── docker-compose.yml            # Stack đầy đủ, chia profile: cơ bản / logs / obs / scale
├── Dockerfile.api                # Multi-stage python:3.12-slim + uv + ffmpeg tối giản (~300MB)
├── Dockerfile.frontend           # Multi-stage node:22-alpine cho Next.js 16
├── env.prod.example              # Mẫu biến môi trường production (chép thành .env.prod)
├── nginx/
│   ├── nginx.conf                # Worker auto, gzip, JSON log có latency, limit_req, least_conn
│   ├── default.conf.template     # Cấu hình HTTP cổng 80 + stub_status nội bộ 8081 + cache assets
│   └── https.conf.example        # Mẫu bật HTTPS 443 sau khi lấy chứng chỉ Certbot Let's Encrypt
├── prometheus/
│   └── prometheus.yml            # Thu thập metric từ Nginx Exporter, FastAPI (/metrics) và VPS
├── loki/
│   ├── loki-config.yml           # Lưu log nén, tự xóa sau 7 ngày
│   └── promtail-config.yml       # Gom log JSON từ mọi container Docker
├── grafana/
│   └── provisioning/datasources/datasources.yml  # Tự nối sẵn Prometheus + Loki
├── PLAN.md                       # Kế hoạch scale đa luồng, Redis, Postgres, Observability
└── README.md                     # Hướng dẫn vận hành nhanh
```

## 2. Yêu cầu VPS tối thiểu

| Chế độ chạy | Profile | RAM ước tính | Khuyến nghị VPS |
|---|---|---:|---|
| Cơ bản (Nginx + Frontend + 1 API + Redis) | *(mặc định)* | ~520 MB | 1–2 vCPU / 2 GB RAM |
| Cơ bản + xem log realtime nhẹ (Dozzle) | `--profile logs` | ~580 MB | 2 vCPU / 2 GB RAM |
| Cơ bản + Full Giám sát (Prometheus + Loki + Grafana) | `--profile obs` | ~1.2 GB | 2 vCPU / 4 GB RAM |
| Đa replica API (2–4) + Postgres + Full Giám sát | `--profile scale --profile obs` | ~1.8–2.5 GB | 4 vCPU / 4–8 GB RAM |

## 3. Khởi chạy nhanh & Bật HTTPS (Certbot)

```bash
cd infra

# 1. Tạo file biến môi trường thật (KHÔNG commit .env.prod)
cp env.prod.example .env.prod
nano .env.prod   # Điền DOMAIN, TLS_EMAIL, API_KEY, mật khẩu Grafana/Postgres

# 2. Chạy stack cơ bản
docker compose --env-file .env.prod up -d --build

# Hoặc chạy kèm xem log nhẹ (Dozzle)
docker compose --env-file .env.prod --profile logs up -d --build

# Hoặc chạy đủ giám sát (Prometheus + Loki + Grafana + Nginx Exporter)
docker compose --env-file .env.prod --profile obs up -d --build
```

**Bật HTTPS với Certbot (trên VPS thật đã trỏ DNS `DOMAIN`):**

```bash
# Lấy chứng chỉ lần đầu qua webroot dùng chung với Nginx
docker run --rm \
  -v infra_certbot_www:/var/www/certbot \
  -v infra_certbot_conf:/etc/letsencrypt \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d canthansaulungkiabeiu.site -d www.canthansaulungkiabeiu.site \
  --email admin@canthansaulungkiabeiu.site --agree-tos --no-eff-email

# Chuyển sang cấu hình HTTPS 443 và reload Nginx
cp nginx/https.conf.example nginx/default.conf.template
docker compose --env-file .env.prod restart nginx
```

Kiểm tra trạng thái:

```bash
docker compose --env-file .env.prod ps
curl -fsS https://<DOMAIN>/health
```

## 4. Truy cập Dashboard & Log an toàn (KHÔNG mở port ra Internet)

Cả **Grafana** (`127.0.0.1:3001`) lẫn **Dozzle** (`127.0.0.1:8080`) đều chỉ bind `127.0.0.1`. Mở từ máy cá nhân bằng SSH tunnel:

```bash
# Xem Grafana (Metrics + Logs JSON của Nginx với request_time/upstream_time) tại http://localhost:3001
ssh -L 3001:127.0.0.1:3001 user@<IP_VPS>

# Hoặc xem Dozzle (Realtime Logs) tại http://localhost:8080
ssh -L 8080:127.0.0.1:8080 user@<IP_VPS>
```

## 5. Công tắc khẩn & Vận hành hằng ngày

- **Bật chế độ an toàn `SAFE_MODE=1`** (tắt AI tự do ở Góc Tò Mò khi OpenRouter có sự cố):
  Sửa `SAFE_MODE=1` trong `infra/.env.prod`, rồi chạy:
  ```bash
  docker compose --env-file .env.prod up -d api
  ```
- **Cập nhật phiên bản mới (ít gián đoạn nhất):**
  ```bash
  git pull origin main
  docker compose --env-file .env.prod build api frontend
  docker compose --env-file .env.prod up -d --no-deps api frontend
  ```
- **Sao lưu SQLite hằng đêm (cron trên VPS):**
  ```bash
  docker compose --env-file .env.prod exec -T api \
    python -c "import sqlite3; src=sqlite3.connect('/var/lib/growsafe/growsafe.db'); dst=sqlite3.connect('/var/lib/growsafe/backup.db'); src.backup(dst); dst.close(); src.close()"
  ```
- **Xem log nhanh trên terminal:**
  ```bash
  docker compose --env-file .env.prod logs -f --tail=100 api nginx
  ```

## 6. Kiểm tra bảo mật trước khi mở công khai

- [ ] Chỉ mở cổng `22`, `80`, `443` trên tường lửa VPS (`ufw`).
- [ ] Đặt hạn mức chi tiêu (monthly spend limit) ngay trên key OpenRouter.
- [ ] Đổi toàn bộ mật khẩu mẫu trong `infra/.env.prod` và `chmod 600 infra/.env.prod`.
- [ ] Trong `codebase/server.py`, thu hẹp CORS `allow_origins` về đúng `https://<DOMAIN>` (hoặc bỏ CORS khi chạy chung domain qua Nginx).
