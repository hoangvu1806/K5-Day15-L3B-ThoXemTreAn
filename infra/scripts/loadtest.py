"""Load test: N người chơi cùng lúc, mỗi người chơi lặp lại trọn một phiên. Chỉ dùng thư viện chuẩn.

Chạy trong mạng compose để đi thẳng vào các replica (qua Nginx thì một IP bị giới hạn lượt gọi):
    infra/scripts/compose.sh run --rm --no-deps -T api python - --base http://api:6161 < infra/scripts/loadtest.py

Trước khi chạy: đặt GROWSAFE_REGISTER_LIMIT=1000 (mọi tài khoản thử tạo từ một IP) và nên đặt MODEL_PROVIDER=fake
để không tốn tiền model. Tài khoản thử có tên lt_*, xoá sau khi đo. Không chạy lên bản đang có người chơi.
"""
import argparse
import json
import random
import threading
import time
import urllib.error
import urllib.request
import uuid

args = argparse.ArgumentParser()
args.add_argument("--base", default="http://127.0.0.1:6161")
args.add_argument("--users", type=int, default=50)
args.add_argument("--seconds", type=int, default=120)
args.add_argument("--think", type=float, default=2.5, help="nghỉ giữa hai lượt (giây), giữ dưới 30 lượt/phút mỗi người")
args = args.parse_args()

lock = threading.Lock()
times, errors = [], []


def call(path, body, token="", ok=(200,)):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(args.base + path, json.dumps(body).encode(), headers)
    t = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            status, raw = r.status, r.read()
    except urllib.error.HTTPError as e:
        status, raw = e.code, e.read()
    except Exception as e:
        status, raw = 0, str(e).encode()
    with lock:
        times.append((path, time.perf_counter() - t))
        if status not in ok:
            errors.append((path, status, raw[:200].decode("utf-8", "replace")))
    if status not in ok:
        raise RuntimeError(path)
    return json.loads(raw) if status == 200 and raw[:1] in (b"{", b"[") else {}


def player(end):
    time.sleep(random.random() * args.think)
    try:
        token = call("/api/auth/register", {"username": "lt_" + uuid.uuid4().hex[:12], "password": "loadtest-123",
                                            "consent": True})["token"]
    except RuntimeError:
        return

    def step(path, body, ok=(200,)):
        time.sleep(args.think * (0.8 + 0.4 * random.random()))
        return call(path, body, token, ok)

    while time.time() < end:
        try:
            s = step("/api/session", {"age_group": random.choice(["6-10", "11-15"]), "gender": random.choice(["nam", "nu"])})
            sid, place = s["session_id"], s["suggest"]
            lv = step("/api/level", {"session_id": sid, "location": place})
            scen = lv["scenario"]["id"]
            hint = step("/api/hint", {"session_id": sid, "scenario_id": scen})
            step("/api/answer", {"session_id": sid, "scenario_id": scen, "text": "con nói không rồi về kể mẹ"})
            q = step("/api/ask/start", {"age_group": s["age_group"], "gender": s["gender"], "session_id": sid})
            step("/api/ask/message", {"ask_session_id": q["ask_session_id"], "text": "vùng kín là gì"})
            # chế độ giả trả 503 (dùng giọng trình duyệt), vẫn chứng tỏ tìm thấy phiên: sai phiên thì là 403
            step("/api/tts", {"session_id": sid, "text": hint["hint"]}, ok=(200, 503))
            step("/api/ask/end", {"ask_session_id": q["ask_session_id"]})
            step("/api/session/end", {"session_id": sid})
        except (RuntimeError, KeyError) as e:
            if isinstance(e, KeyError):
                with lock:
                    errors.append(("flow", 0, "thiếu khoá %s" % e))
            time.sleep(args.think)


end = time.time() + args.seconds
threads = [threading.Thread(target=player, args=(end,)) for _ in range(args.users)]
for t in threads:
    t.start()
for t in threads:
    t.join()

print("%d người, %ds: %d request, %d lỗi" % (args.users, args.seconds, len(times), len(errors)))
for path in sorted({p for p, _ in times}):
    v = sorted(d for p, d in times if p == path)
    print("  %-22s n=%-5d p50=%.2fs p95=%.2fs max=%.2fs" % (path, len(v), v[len(v) // 2], v[int(len(v) * 0.95)], v[-1]))
for e in errors[:10]:
    print("  lỗi:", e)
raise SystemExit(1 if errors or not times else 0)
