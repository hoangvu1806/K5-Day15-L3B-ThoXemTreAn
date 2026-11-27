# Kế hoạch deploy, bảo trì và bảo vệ production — GrowSafe AI

Bản nháp ngày 28/11, viết theo code hiện tại (`codebase/server.py`, `agent.py`, `guardrails.py`, `tools.py`). Code bây giờ mới là bản demo. File này ghi những gì phải làm trước khi cho người dùng thật chơi, và cách giữ cho bản chạy thật an toàn sau đó.

Nhóm tự chạy cả frontend lẫn backend trên một VPS cá nhân chạy Ubuntu, domain `canthansaulungkiabeiu.site`. Các lệnh trong file viết cho Ubuntu; nên dùng bản LTS để có cập nhật bảo mật lâu dài. Frontend game chưa nằm trong repo này, nên phần frontend dưới đây chỉ ghi chỗ đặt file.

## 0. Phải sửa trước khi có URL công khai

| # | Vấn đề | Chỗ trong code | Hậu quả | Cách sửa |
|---|---|---|---|---|
| 1 | `GET /api/drafts` không cần đăng nhập | `codebase/server.py`, hàm `drafts()` | Ai có URL cũng đọc được bản nháp nhận xét về mọi trẻ | Bỏ endpoint trả toàn bộ `DRAFTS`. Thay bằng `POST /api/session/end` (đã thiết kế trong `docs/game-flow.md`) chỉ trả bản nháp của đúng `session_id`, rồi xoá khỏi RAM. Muốn vậy bản nháp phải ghi `session_id` (hiện `draft_parent_teacher_note` chưa ghi) và `draft_id` phải đổi sang mã ngẫu nhiên, vì `"D%d" % (len(DRAFTS) + 1)` sẽ trùng mã khi đã xoá bớt |
| 2 | Không giới hạn số lượt gọi | `POST /api/chat` | Bị spam là cháy tiền key OpenRouter | Giới hạn ở Nginx (`limit_req`, vd 20 lượt mỗi phút mỗi IP), đặt hạn mức chi tiêu ngay trên key OpenRouter |
| 3 | CORS `allow_origins=["*"]` | `codebase/server.py`, dòng `add_middleware` | Trang web bất kỳ cũng gọi được API | Frontend và API cùng domain nên không cần CORS: bỏ middleware, hoặc chỉ cho `https://canthansaulungkiabeiu.site` |

Mấy giới hạn khác sẽ gặp ngay khi có vài người chơi cùng lúc:

- `_lock` trong `server.py` bắt mọi request xếp hàng, nên mỗi lúc chỉ một người chơi được. Lý do: `tracing.py` giữ trạng thái trong biến toàn cục.
- `DRAFTS` (trong `tools.py`) và session của `InMemoryRunner` (trong `agent.py`) chỉ nằm trong RAM và không có gì dọn, nên bộ nhớ cứ tăng. Cần dọn phiên và bản nháp quá 30 phút. Restart thì mất là chấp nhận được (xem mục 1).
- `server.py` bind `127.0.0.1`. Trên VPS giữ nguyên như vậy: chỉ Nginx gọi được backend, không mở cổng 6161 ra Internet.

## 1. Kiến trúc deploy trên VPS

```
Người dùng
   │ HTTPS (443)
   ▼
canthansaulungkiabeiu.site ── DNS bản ghi A → IP của VPS
   │
VPS ── Nginx (TLS Let's Encrypt, giới hạn lượt gọi)
        ├── /          → file tĩnh của game: /var/www/growsafe
        ├── /api/      → http://127.0.0.1:6161  (FastAPI, uvicorn 1 worker, systemd)
        └── /health    → http://127.0.0.1:6161/health
                             │
                             └── gọi ra OpenRouter
        phiên chơi, bản nháp: trong RAM của backend
        log, trace: trên đĩa VPS, chỉ bản đã che thông tin định danh
```

- **Một domain cho cả hai.** Game ở `https://canthansaulungkiabeiu.site/`, API ở `https://canthansaulungkiabeiu.site/api/`. Cùng domain nên trình duyệt không cần CORS, và chỉ cần một chứng chỉ TLS.
- **DNS:** bản ghi A cho `@` và `www` trỏ về IP của VPS. `www` chuyển hướng 301 về domain chính. Thêm bản ghi A cho `staging` nếu chạy staging trên cùng VPS.
- **Cài trên Ubuntu:** `apt install nginx python3-venv ufw fail2ban`, Certbot cài bằng `snap install --classic certbot`. Code cần Python 3.10 trở lên.
- **TLS:** Certbot lấy chứng chỉ Let's Encrypt cho Nginx (`certbot --nginx -d canthansaulungkiabeiu.site -d www.canthansaulungkiabeiu.site`), tự gia hạn bằng timer có sẵn. Bật chuyển HTTP → HTTPS và header HSTS.
- **Backend:** chạy bằng một service systemd, ví dụ `/etc/systemd/system/growsafe.service`:
  - user riêng `growsafe`, không có quyền sudo;
  - code ở `/opt/growsafe`, virtualenv ở `/opt/growsafe/.venv`, cài bằng `pip install -r requirements.txt`. Trên Ubuntu phải cài `python3-venv` trước, và không `pip install` thẳng vào Python của hệ thống;
  - lệnh `uvicorn server:app --app-dir codebase --host 127.0.0.1 --port 6161 --workers 1`;
  - `Restart=always` để tự chạy lại khi lỗi.
  - Chỉ 1 worker, vì phiên chơi và bản nháp nằm trong RAM của một tiến trình (request của một phiên phải về đúng tiến trình đó).
- **Frontend:** build ra file tĩnh rồi chép vào `/var/www/growsafe`. Nginx phục vụ thẳng, có cache cho ảnh và assets.
- **Phiên chơi và bản nháp: chỉ trong RAM.** Phiên chơi và bản nháp chỉ sống trong lúc chơi. Kết phiên, `POST /api/session/end` trả bản nháp về luôn để màn hình người lớn hiện ngay trên máy đang chơi. Người lớn đọc, tự chép hoặc tải về nếu muốn giữ; server không giữ lại. Đổi lại, restart backend giữa phiên thì phiên đó mất, trẻ chơi lại từ màn mới.
- **Tài khoản và bộ thẻ: SQLite** (quyết định 28/11, cho tính năng đăng nhập, nhánh `feature/auth`).
  - Code ở `codebase/auth.py`. Một file `/var/lib/growsafe/growsafe.db` (đặt `GROWSAFE_DB=/var/lib/growsafe/growsafe.db` trong `.env` hoặc file systemd), nằm ngoài thư mục code để deploy không đụng tới. Chủ sở hữu là user `growsafe`, quyền `600`. Bật `PRAGMA journal_mode=WAL`. Máy dev dùng `data/runtime/growsafe.db` (đã có trong `.gitignore`).
  - Chỉ lưu: tên đăng nhập, mật khẩu đã băm (`hashlib.scrypt`, salt riêng), phiên đăng nhập (chỉ lưu bản băm của token), mã các thẻ đã nhận. Không lưu câu trả lời của trẻ, giới tính, bản nháp. Không có email nên không có quên mật khẩu.
  - Màn đăng ký nhắc không dùng tên thật làm tên đăng nhập. Chưa đăng nhập vẫn chơi được, chỉ không lưu thẻ.
  - Vì sao không dùng Neon: một VPS, một tiến trình, dữ liệu rất nhỏ. SQLite không cần cài, không thêm mạng hay bên thứ ba giữ dữ liệu liên quan tới trẻ. Chuyển sang Postgres khi cần chạy nhiều server: mọi truy vấn gom trong một file `db.py` để đổi một chỗ.
- **Secrets:** `.env` nằm ở `/opt/growsafe/.env`, chủ sở hữu là user `growsafe`, quyền `600`. Không commit, không chép vào ảnh chụp hay log. `.gitignore` đã chặn `.env`.
- **Ba môi trường:**

  | Môi trường | Chạy ở đâu | Model | Key | Dùng để |
  |---|---|---|---|---|
  | dev | máy từng người | chế độ giả (`MODEL_PROVIDER` trống) | không cần | viết code, không tốn tiền |
  | staging | cùng VPS, `staging.canthansaulungkiabeiu.site`, cổng 6162, service riêng | model thật | key riêng, hạn mức thấp | chạy eval trước khi lên prod |
  | prod | VPS, `canthansaulungkiabeiu.site`, cổng 6161 | model thật | key riêng, có hạn mức và cảnh báo chi tiêu | người dùng thật |

  Staging nên đặt thêm HTTP basic auth ở Nginx để người ngoài không vào được.

## 2. Quy trình đưa thay đổi lên production

Với app này, đổi prompt, đổi model hay sửa kho tình huống đều nguy hiểm ngang đổi code. Mọi thay đổi phải qua eval:

1. Mở PR. CI (GitHub Actions) chạy `python run.py check` và test cho `guardrails.py` (các mẫu precheck, postcheck, `mask_pii`).
2. PR đụng tới `codebase/agent.py` (prompt `SYSTEM`), `codebase/ai.py` (model), `codebase/guardrails.py` hoặc `data/*.json` thì deploy lên staging, chạy `python run.py eval` rồi chấm.
3. Chỉ deploy prod khi đạt chuẩn ở `spec.md` §7: ≥ 80% tổng, 100% câu `tu_choi`, không câu nào trượt `dung_tuoi_khong_do_loi` hay `khong_lo_thong_tin_dinh_danh`. Trượt một câu `tu_choi` là không deploy.
4. Thêm hoặc sửa màn trong `data/scenarios.json` cần ít nhất một người duyệt nội dung (đặt bằng CODEOWNERS). Giữ đúng luật trong `docs/game-flow.md`: chỉ màn đã duyệt mới tới tay trẻ.
5. Ghim phiên bản model trong `MODEL_NAME`, không dùng alias kiểu "latest". Đổi model thì coi như một lần release mới và chạy lại eval từ đầu.
6. **Cách deploy lên VPS:** merge vào `main` rồi gắn tag (vd `v0.3`). Trên VPS chạy một script `deploy.sh` cố định:
   `git fetch --tags` → `git checkout v0.3` → `pip install -r requirements.txt` → `systemctl restart growsafe` → gọi `/health`, không trả `ok` thì tự quay lại tag cũ.
   Có thể để GitHub Actions SSH vào chạy script này, dùng một SSH key riêng chỉ được chạy `deploy.sh`.
7. **Rollback:** `deploy.sh <tag cũ>`. File SQLite nằm ngoài thư mục code nên không bị ghi đè. `deploy.sh` sao lưu file DB trước mỗi lần deploy. Đổi cấu trúc bảng thì chỉ thêm cột hoặc bảng, không xoá, để code của tag cũ vẫn đọc được.
8. Deploy vào giờ ít người chơi, vì restart làm mất phiên đang chơi.

## 3. Bảo vệ production khi đang chạy

### Bảo vệ VPS

- **SSH:** chỉ đăng nhập bằng key, tắt đăng nhập bằng mật khẩu và tắt đăng nhập thẳng bằng `root` (`PasswordAuthentication no`, `PermitRootLogin no`). Mỗi thành viên một key riêng, ai rời nhóm thì xoá key đó.
- **Tường lửa (`ufw`):** chỉ mở 22, 80, 443. Cổng 6161, 6162 không mở ra ngoài.
- **`fail2ban`** chặn IP dò mật khẩu SSH.
- **Cập nhật bảo mật tự động** bằng `unattended-upgrades` (có sẵn trên Ubuntu, bật bằng `dpkg-reconfigure unattended-upgrades`).
- **Nginx:** tắt hiện phiên bản (`server_tokens off`), giới hạn kích thước request (`client_max_body_size`, vd 16k cho `/api/`), timeout cho `/api/` khoảng 30 giây.
- **Tuỳ chọn:** đưa domain qua Cloudflare (bật proxy) để chặn bớt DDoS và giấu IP thật của VPS. Khi đó chỉ cho IP của Cloudflare vào cổng 80/443.
- **Điểm yếu cần biết:** chỉ có một VPS, VPS chết là game chết. Chấp nhận được cho demo và pilot. Ghi sẵn các bước dựng lại VPS (mục 5) để dựng máy mới trong khoảng 1 giờ.

### An toàn của trẻ

- Precheck hiện dùng regex. Nếu nó để lọt một câu trẻ kể chuyện bị xâm hại thật thì đó là lỗi đắt nhất của cả hệ thống. Cần thêm lớp nhận diện thứ hai bằng model (đã thiết kế trong `docs/game-flow.md`) và giữ nút "Con cần giúp" ở mọi màn.
- Mỗi tuần lấy mẫu trace (đã che thông tin định danh) để người trong nhóm đọc lại. Câu nào lọt thì thêm vào `eval/benchmark.csv` để lần eval sau tự bắt.
- Khi model lỗi hoặc OpenRouter sập: trả `SAFE_FALLBACK` hoặc lùi về kịch bản có sẵn. Không để trẻ thấy lỗi 500 giữa lúc đang kể chuyện. Nginx có trang lỗi riêng (thân thiện với trẻ, có số 111) cho lúc backend không chạy.
- Có công tắc khẩn: một biến môi trường kiểu `SAFE_MODE=1` trong `.env` để tắt phần AI trả lời tự do, chỉ chạy kịch bản có sẵn. Sửa `.env` rồi `systemctl restart growsafe` là bật.

### Dữ liệu

- Giữ nguyên nguyên tắc không thu tên, trường, địa chỉ, số điện thoại. `mask_pii` chạy trước khi gửi model và trước khi ghi log.
- Log truy cập của Nginx có IP người dùng. Giữ ngắn (vd 14 ngày bằng `logrotate`) hoặc cắt bớt IP.
- Trace của backend có hạn lưu (vd 30 ngày) rồi tự xoá. Giới tính chỉ nằm trong phiên chơi, không ghi ra file.
- Dữ liệu trẻ em ở Việt Nam chịu quy định về bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP và Luật Bảo vệ dữ liệu cá nhân). Xử lý dữ liệu của trẻ cần phụ huynh đồng ý, nên màn hình đầu do người lớn mở phải có bước đồng ý. Nếu VPS đặt ở nước ngoài thì còn thêm câu hỏi chuyển dữ liệu ra nước ngoài. *Nhóm chưa kiểm với người hiểu luật; phải kiểm trước khi chạy với người dùng thật.*
- Chọn nhà cung cấp model không dùng dữ liệu để huấn luyện (OpenRouter có tuỳ chọn này trong phần cài đặt privacy).

### Chi phí và lạm dụng

- Đặt hạn mức tháng trên key, báo khi dùng tới 50% và 80%. Lấy ngưỡng từ kịch bản "cao" trong `cost/cost-estimate.md` (bảng đó còn trống, điền sau khi chạy `python run.py simulate`).
- `MAX_LLM_CALLS = 6` trong `agent.py` đã chặn agent gọi model mãi không dừng. Thêm timeout cho mỗi request (vd 20 giây).

## 4. Giám sát

| Theo dõi | Cách làm | Báo động khi |
|---|---|---|
| `https://canthansaulungkiabeiu.site/health` | dịch vụ uptime bên ngoài (UptimeRobot, Better Stack…) gọi mỗi phút | không trả lời |
| Chứng chỉ TLS | cùng dịch vụ uptime | còn dưới 14 ngày |
| Tỉ lệ lỗi, độ trễ p95 của `/api/chat` | đọc từ log Nginx | lỗi > 2%, p95 > 8 giây *(tự ước tính)* |
| RAM, đĩa, CPU của VPS | `node_exporter` hoặc công cụ giám sát của nhà cung cấp VPS | RAM > 80%, đĩa > 80% |
| Số lượt `stopped = nghi_xam_hai_that` | đếm trong trace | tăng đột biến → người đọc lại ngay |
| Số lần postcheck phải thay câu | đếm trong trace | tăng → prompt hoặc model đang trôi |
| Token, chi phí mỗi ngày | trang quản lý của OpenRouter | lệch xa ước tính trong `cost/` |

## 5. Bảo trì định kỳ

- **Hàng tuần:** đọc mẫu trace, thêm câu thử từ lỗi gặp thật. Xem `journalctl -u growsafe` có lỗi lặp lại không.
- **Hàng tháng:**
  - cập nhật thư viện trong `requirements.txt` (`google-adk`, `litellm` đổi nhanh). Nâng phiên bản trên staging, chạy lại eval rồi mới lên prod;
  - cập nhật hệ điều hành những gói không tự cập nhật, khởi động lại VPS nếu cần (báo trước, vì mất phiên đang chơi);
  - rà danh sách SSH key và người có quyền vào VPS.
- **Khi đổi kho:** người duyệt nội dung đối chiếu lời dặn an toàn với nguồn của quy tắc trong `data/guidelines.json` (qua `guideline_codes` của màn). Trường `source` trong `data/scenarios.json` chỉ cho biết tình huống lấy từ đâu (11 màn: 3 từ phiếu khảo sát, 8 `tu_viet`).
- **Trước pilot:** `data/guidelines.json` còn ghi chú nguồn chưa kiểm (UNESCO "chưa kiểm số mục và link") và một nguồn UNICEF "CHƯA TÌM ĐƯỢC tài liệu cụ thể". Phải kiểm xong hoặc bỏ quy tắc đó trước khi trẻ thật chơi.
- **Gia hạn:** domain `canthansaulungkiabeiu.site` và VPS đều trả tiền theo kỳ. Ghi ngày hết hạn, bật tự gia hạn, giao một người theo dõi.
- **Sao lưu DB:** cron mỗi đêm chạy `sqlite3 /var/lib/growsafe/growsafe.db ".backup /var/backups/growsafe/growsafe-$(date +%F).db"`, giữ 14 bản gần nhất, rồi chép ra ngoài VPS (vd máy của một thành viên hoặc kho lưu trữ có mã hoá). Mỗi tháng thử khôi phục một bản để chắc bản sao lưu dùng được. Không dùng `cp` trên file đang chạy.
- **Sao lưu cấu hình:** lưu các file dựng lại máy: file Nginx, file systemd, `deploy.sh`. Nên để các file này trong repo (vd thư mục `deploy/`). `.env` không vào repo; người giữ key cất trong trình quản lý mật khẩu của nhóm.

## 6. Lộ trình

1. **Demo hackathon (28/11):** VPS, Nginx, HTTPS cho `canthansaulungkiabeiu.site`, backend chạy bằng systemd, khoá SSH và tường lửa. Sửa ít nhất lỗi 1 và 3 ở mục 0 trước khi đưa link ra ngoài.
2. **Pilot một lớp học:** sửa đủ 3 lỗi ở mục 0, trả bản nháp theo phiên rồi xoá khỏi RAM, dọn phiên cũ, giới hạn lượt gọi ở Nginx, staging có basic auth, eval trong CI, `deploy.sh` có tự rollback, bước phụ huynh đồng ý. Đăng nhập lưu bộ thẻ bằng SQLite, có cron sao lưu.
3. **Mở rộng:** bỏ `_lock` (chuyển trace sang `contextvars` trong bản production, vì `tracing.py` của khung hackathon không được sửa), thêm lớp nhận diện xâm hại bằng model, rồi mới bật chế độ AI đóng vai. Chỉ cân nhắc VPS thứ hai hoặc chuyển SQLite sang Postgres (vd Neon) khi một tiến trình không còn đủ tải.
