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
│   ├── nginx.conf                # Worker auto, gzip, JSON log có latency, limit_req, least_conn, resolver Docker
│   ├── default.conf.template     # Chỉ HTTP cổng 80 (lần đầu, để lấy chứng chỉ) + stub_status nội bộ 8081
│   ├── https.conf.example        # HTTPS 443 + chuyển 80 → 443, www → domain chính (chọn bằng NGINX_SITE)
│   └── snippets/                 # proxy.conf (header chung), locations.conf (route + rate limit dùng chung)
├── scripts/
│   ├── deploy.sh                 # Deploy theo git tag, tự rollback khi /health lỗi
│   └── backup.sh                 # Sao lưu SQLite ra ngoài volume, giữ 14 bản, tuỳ chọn rsync
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
| Cơ bản (Nginx + Certbot + Frontend + 1 API) | *(mặc định)* | ~450 MB | 1–2 vCPU / 2 GB RAM |
| Cơ bản + xem log realtime nhẹ (Dozzle) | `--profile logs` | ~580 MB | 2 vCPU / 2 GB RAM |
| Cơ bản + Full Giám sát (Prometheus + Loki + Grafana) | `--profile obs` | ~1.2 GB | 2 vCPU / 4 GB RAM |
| Đa replica API (2–4) + Postgres + Full Giám sát | `--profile scale --profile obs` | ~1.8–2.5 GB | 4 vCPU / 4–8 GB RAM |

## 3. Deploy lên VPS từ đầu

Chỉ có **một file env cần điền: `infra/.env.prod` trên VPS** (chép từ `env.prod.example`). File này bị `.gitignore` chặn (`.env.*`), không commit, không chép vào ảnh chụp hay log. File `.env` ở gốc repo chỉ dùng khi chạy dev trên máy, production không đọc file đó.

### Bước 0 — Trên máy của bạn: gắn tag phiên bản

VPS lấy code từ git theo tag, nên code phải được merge vào `main` và push trước:

```bash
git tag v0.4 && git push origin v0.4
```

Nên chạy `docker compose --env-file env.prod.example build` một lần trên máy để chắc hai image build được trước khi lên VPS.

### Bước 1 — Chuẩn bị VPS (chỉ làm một lần)

1. **DNS:** bản ghi A cho `@` và `www` trỏ về IP của VPS. Đợi `ping <DOMAIN>` ra đúng IP rồi mới làm bước 4.
2. **Cài Docker, tường lửa** (Ubuntu LTS):
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER          # đăng xuất rồi đăng nhập lại để có quyền docker
   sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable
   ```
   SSH: chỉ đăng nhập bằng key (`PasswordAuthentication no`, `PermitRootLogin no` trong `/etc/ssh/sshd_config`).
3. **Lấy code** về đúng `/opt/growsafe` (đường dẫn dùng trong cron ở mục 5):
   ```bash
   sudo mkdir -p /opt/growsafe && sudo chown $USER /opt/growsafe
   git clone <url-repo> /opt/growsafe
   chmod +x /opt/growsafe/infra/scripts/*.sh   # commit từ Windows có thể mất quyền chạy
   ```

### Bước 2 — Điền `infra/.env.prod`

```bash
cd /opt/growsafe/infra
cp env.prod.example .env.prod && chmod 600 .env.prod
nano .env.prod
```

| Biến | Điền gì | Bắt buộc |
|---|---|---|
| `DOMAIN` | domain thật, vd `canthansaulungkiabeiu.site` | có |
| `TLS_EMAIL` | email nhận cảnh báo chứng chỉ sắp hết hạn | có |
| `NGINX_SITE` | `default.conf.template` cho lần đầu; đổi thành `https.conf.example` ở bước 4 | có |
| `CORS_ORIGINS` | `https://<DOMAIN>,https://www.<DOMAIN>` | có |
| `API_KEY` | key OpenRouter. Đặt hạn mức chi tiêu tháng trên dashboard OpenRouter | có |
| `MODEL_NAME` | giữ mặc định, ghim phiên bản, không dùng alias "latest" | — |
| `GRAFANA_PASSWORD`, `POSTGRES_PASSWORD` | mật khẩu mạnh, **phải điền kể cả khi chưa bật** `obs`, `scale` (compose báo lỗi nếu trống) | có |
| `SAFE_MODE` | `0`. Công tắc khẩn, xem mục 5 | — |
| `GROWSAFE_AI_RATE_LIMIT` | số lượt gọi AI mỗi phút mỗi tài khoản, mặc định `30` | — |
| `API_REPLICAS`, `UVICORN_WORKERS` | **giữ `1`** cho đến khi xong Pha 1 trong `PLAN.md` | — |
| `NEXT_PUBLIC_API_URL` | để trống (frontend gọi `/api/*` cùng domain qua Nginx) | — |

`deploy.sh` từ chối chạy khi file còn giá trị mẫu (`replace-...`, `changeme`).

### Bước 3 — Chạy lần đầu (chỉ HTTP)

```bash
cd /opt/growsafe
git checkout v0.4
cd infra
docker compose --env-file .env.prod up -d --build
docker compose --env-file .env.prod ps                  # mọi service "healthy"
curl -fsS http://<DOMAIN>/health                         # {"ok": true, ...}
```

Muốn thêm công cụ xem log hoặc giám sát thì thêm profile vào lệnh `up` (xem bảng ở mục 2):
`--profile logs` (Dozzle) hoặc `--profile obs` (Prometheus, Loki, Grafana).

### Bước 4 — Lấy chứng chỉ và bật HTTPS

```bash
cd /opt/growsafe/infra
docker run --rm \
  -v infra_certbot_www:/var/www/certbot \
  -v infra_certbot_conf:/etc/letsencrypt \
  certbot/certbot:v2.11.0 certonly --webroot -w /var/www/certbot \
  -d <DOMAIN> -d www.<DOMAIN> \
  --email <TLS_EMAIL> --agree-tos --no-eff-email
```

Sửa `NGINX_SITE=https.conf.example` trong `.env.prod`, rồi:

```bash
docker compose --env-file .env.prod up -d nginx
curl -fsS https://<DOMAIN>/health
```

Tên volume `infra_certbot_*` lấy theo tên thư mục `infra/`. Chạy compose từ thư mục khác thì xem tên thật bằng `docker volume ls`.

Gia hạn tự động: service `certbot` thử `certbot renew` mỗi 12 giờ (chỉ gia hạn khi chứng chỉ còn dưới 30 ngày), Nginx tự reload mỗi 6 giờ để nhận chứng chỉ mới. Không cần cron riêng.

### Bước 5 — Bật sao lưu hằng đêm

```bash
crontab -e
# thêm dòng (BACKUP_REMOTE là tuỳ chọn, để đẩy bản sao ra ngoài VPS):
15 3 * * * BACKUP_REMOTE=backup@may-khac:/srv/growsafe/ /opt/growsafe/infra/scripts/backup.sh >> /var/log/growsafe-backup.log 2>&1
```

Chạy thử ngay một lần: `/opt/growsafe/infra/scripts/backup.sh`. Thư mục `/var/backups/growsafe` cần user hiện tại ghi được (`sudo mkdir -p /var/backups/growsafe && sudo chown $USER /var/backups/growsafe`).

### Các lần cập nhật sau

Trên máy: merge vào `main`, `git tag v0.5 && git push origin v0.5`. Trên VPS:

```bash
/opt/growsafe/infra/scripts/deploy.sh v0.5
```

Chi tiết những gì script làm và cách rollback: mục 5.

Kiểm tra trạng thái bất cứ lúc nào:

```bash
cd /opt/growsafe/infra
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
- **Cập nhật phiên bản mới:** merge vào `main`, gắn tag (vd `v0.4`), rồi trên VPS:
  ```bash
  infra/scripts/deploy.sh v0.4
  ```
  Script từ chối chạy khi `.env.prod` còn giá trị mẫu, sao lưu DB trước, build và chạy tag mới, đợi `/health` tối đa 90 giây; không lên thì tự quay lại bản đang chạy trước đó. Rollback tay: `infra/scripts/deploy.sh <tag cũ>`. Restart API làm mất phiên đang chơi, nên deploy giờ ít người chơi.
- **Sao lưu SQLite hằng đêm (cron trên VPS):**
  ```bash
  # crontab -e
  15 3 * * * BACKUP_REMOTE=backup@may-khac:/srv/growsafe/ /opt/growsafe/infra/scripts/backup.sh >> /var/log/growsafe-backup.log 2>&1
  ```
  Bản sao ra `/var/backups/growsafe` (ngoài volume Docker), giữ 14 bản, `BACKUP_REMOTE` (rsync) để đẩy ra ngoài VPS. Mỗi tháng thử khôi phục một bản.
- **Dọn bộ nhớ:** API tự dọn phiên không dùng quá `GROWSAFE_SESSION_TTL` giây (mặc định 2700 = 45 phút) mỗi 5 phút, giới hạn cache giọng đọc trong RAM (200 câu) và trên đĩa (5000 file).
- **Xem log nhanh trên terminal:**
  ```bash
  docker compose --env-file .env.prod logs -f --tail=100 api nginx
  ```

## 6. Kiểm tra bảo mật trước khi mở công khai

- [ ] Chỉ mở cổng `22`, `80`, `443` trên tường lửa VPS (`ufw`).
- [ ] Đặt hạn mức chi tiêu (monthly spend limit) ngay trên key OpenRouter.
- [ ] Đổi toàn bộ mật khẩu mẫu trong `infra/.env.prod` và `chmod 600 infra/.env.prod` (`deploy.sh` từ chối chạy khi còn giá trị mẫu; Grafana, Postgres không có mật khẩu là compose báo lỗi).
- [ ] Đặt `CORS_ORIGINS` trong `infra/.env.prod` đúng domain thật (không đặt thì API chỉ cho localhost dev).
- [ ] Nếu đặt Cloudflare phía trước: bật `real_ip_header CF-Connecting-IP` trong `nginx/nginx.conf`, không thì mọi người dùng chung IP của Cloudflare và giới hạn theo IP mất tác dụng.
- [ ] Giữ `API_REPLICAS=1` cho đến khi xong Pha 1 trong `PLAN.md`: phiên chơi vẫn nằm trong RAM của một tiến trình.
