"""Tài khoản cơ bản (tên đăng nhập + mật khẩu) để lưu bộ thẻ qua nhiều lần chơi, nhiều máy.

Lưu bằng SQLite (thư viện chuẩn), một file: biến GROWSAFE_DB, mặc định data/runtime/growsafe.db (đã có trong .gitignore).
Quyết định và cách sao lưu: docs/deploy-plan.md mục 1 và 5.

Chỉ lưu:
    users   tên đăng nhập, mật khẩu đã băm (hashlib.scrypt, salt riêng), lúc người lớn đồng ý
    logins  bản băm SHA-256 của token đăng nhập (không lưu token gốc), hạn dùng
    items   tiến độ dạng MÃ: màn đã qua, mã thẻ quy tắc, mã thẻ chiêu, vai trong "Bàn tay tin cậy"
Không lưu câu trả lời của trẻ, giới tính, bản nháp, email hay tên thật.
Nội dung thẻ không lưu: khi trả về, dựng lại từ data/ bằng game.rule_card / game.tactic_card.

Mọi truy vấn SQL nằm trong file này, muốn chuyển sang Postgres thì chỉ đổi ở đây.
"""
import hashlib
import hmac
import os
import re
import secrets
import sqlite3
import threading
import time
from contextlib import contextmanager

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel

import game

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.environ.get("GROWSAFE_DB") or os.path.join(ROOT, "data", "runtime", "growsafe.db")

AGE_GROUPS = ("6-10", "11-15")
HAND_SLOTS = 5
# Giữ khớp với TRUSTED_ROLES trong frontend/lib/local.ts. Chỉ nhận vai có sẵn để không ai lưu tên thật vào đây.
TRUSTED_ROLES = {"Mẹ", "Bố", "Bà", "Ông", "Cô chủ nhiệm", "Bác bảo vệ", "Cô y tế", "Anh chị lớn", "Cô chú trong nhà"}

USERNAME_RE = re.compile(r"^[a-z0-9_.]{3,20}$")
PASSWORD_MIN, PASSWORD_MAX = 8, 128
TOKEN_DAYS = 30
SCRYPT = {"n": 2 ** 14, "r": 8, "p": 1, "dklen": 32}

# Chặn dò mật khẩu: sai 5 lần trong 10 phút với cùng tên đăng nhập hoặc cùng IP thì khoá 10 phút (chỉ trong RAM).
FAIL_LIMIT, FAIL_WINDOW = 5, 600
_fails: dict = {}
_fails_lock = threading.Lock()

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY,
    username   TEXT NOT NULL UNIQUE,
    pw_hash    BLOB NOT NULL,
    salt       BLOB NOT NULL,
    created_at INTEGER NOT NULL,
    consent_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS logins (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS items (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    age     TEXT NOT NULL,
    kind    TEXT NOT NULL,      -- cleared | rule | tactic | hand
    code    TEXT NOT NULL,      -- mã màn, mã thẻ, hoặc số ô (hand)
    value   TEXT NOT NULL DEFAULT '',  -- cleared: '1' đạt / '0' đã chơi; hand: vai
    PRIMARY KEY (user_id, age, kind, code)
);
"""


# ---------- Kết nối ----------

@contextmanager
def _db():
    con = sqlite3.connect(DB_PATH, timeout=10)
    try:
        con.execute("PRAGMA foreign_keys = ON")
        with con:  # tự commit, lỗi thì rollback
            yield con
    finally:
        con.close()


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with _db() as con:
        con.execute("PRAGMA journal_mode = WAL")
        con.executescript(SCHEMA)


# ---------- Mật khẩu, token ----------

def _hash_password(password: str, salt: bytes) -> bytes:
    return hashlib.scrypt(password.encode("utf-8"), salt=salt, **SCRYPT)


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _new_login(con, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    now = int(time.time())
    con.execute("DELETE FROM logins WHERE expires_at < ?", (now,))
    con.execute("INSERT INTO logins VALUES (?, ?, ?)", (_token_hash(token), user_id, now + TOKEN_DAYS * 86400))
    return token


def _user_from_token(con, authorization: str):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Chưa đăng nhập")
    row = con.execute(
        "SELECT u.id, u.username FROM logins l JOIN users u ON u.id = l.user_id "
        "WHERE l.token_hash = ? AND l.expires_at >= ?",
        (_token_hash(authorization[7:].strip()), int(time.time()))).fetchone()
    if not row:
        raise HTTPException(401, "Phiên đăng nhập đã hết hạn, đăng nhập lại nhé")
    return row


def _too_many(keys) -> bool:
    now = time.time()
    with _fails_lock:
        for k in keys:
            recent = [t for t in _fails.get(k, []) if now - t < FAIL_WINDOW]
            _fails[k] = recent
            if len(recent) >= FAIL_LIMIT:
                return True
    return False


def _record_fail(keys):
    with _fails_lock:
        for k in keys:
            _fails.setdefault(k, []).append(time.time())


def _clear_fails(keys):
    with _fails_lock:
        for k in keys:
            _fails.pop(k, None)


# ---------- Tiến độ ----------

def _empty_progress():
    return {age: {"cleared": {}, "rules": {}, "tactics": {}, "hand": [""] * HAND_SLOTS} for age in AGE_GROUPS}


def _merge_progress(con, user_id: int, incoming: dict):
    """Gộp tiến độ máy gửi lên vào tài khoản: chỉ cộng thêm, không làm mất thẻ đã có.
    Bỏ qua mã không có trong data/. Ô "Bàn tay tin cậy": máy gửi lên có ít nhất một ô thì thay cả 5 ô."""
    if not isinstance(incoming, dict):
        return
    scenario_ids = {s.get("id") for s in game._scenarios()}
    guidelines = game._guidelines()
    for age in AGE_GROUPS:
        p = incoming.get(age)
        if not isinstance(p, dict):
            continue
        cleared = p.get("cleared") if isinstance(p.get("cleared"), dict) else {}
        for sid, passed in list(cleared.items())[:500]:
            if sid in scenario_ids:
                con.execute(
                    "INSERT INTO items VALUES (?, ?, 'cleared', ?, ?) ON CONFLICT DO UPDATE "
                    "SET value = MAX(value, excluded.value)", (user_id, age, sid, "1" if passed else "0"))
        rules = p.get("rules") if isinstance(p.get("rules"), dict) else {}
        for code in list(rules)[:200]:
            if game.rule_card(code, age, guidelines):
                con.execute("INSERT OR IGNORE INTO items VALUES (?, ?, 'rule', ?, '')", (user_id, age, code))
        tactics = p.get("tactics") if isinstance(p.get("tactics"), dict) else {}
        for code in list(tactics)[:200]:
            if game.tactic_card(code):
                con.execute("INSERT OR IGNORE INTO items VALUES (?, ?, 'tactic', ?, '')", (user_id, age, code))
        hand = p.get("hand")
        if isinstance(hand, list) and any(isinstance(r, str) and r in TRUSTED_ROLES for r in hand):
            for i in range(HAND_SLOTS):
                role = hand[i] if i < len(hand) and isinstance(hand[i], str) and hand[i] in TRUSTED_ROLES else ""
                con.execute("INSERT INTO items VALUES (?, ?, 'hand', ?, ?) ON CONFLICT DO UPDATE SET value = excluded.value",
                            (user_id, age, str(i), role))


def _load_progress(con, user_id: int) -> dict:
    out = _empty_progress()
    guidelines = game._guidelines()
    for age, kind, code, value in con.execute("SELECT age, kind, code, value FROM items WHERE user_id = ?", (user_id,)):
        if age not in out:
            continue
        p = out[age]
        if kind == "cleared":
            p["cleared"][code] = value == "1"
        elif kind == "rule":
            card = game.rule_card(code, age, guidelines)
            if card:
                p["rules"][code] = card
        elif kind == "tactic":
            card = game.tactic_card(code)
            if card:
                p["tactics"][code] = card
        elif kind == "hand" and code.isdigit() and int(code) < HAND_SLOTS:
            p["hand"][int(code)] = value
    return out


# ---------- API ----------

router = APIRouter(prefix="/api")


class Credentials(BaseModel):
    username: str
    password: str
    progress: dict = {}  # tiến độ đang có trên máy, gộp vào tài khoản ngay khi đăng nhập / đăng ký


class RegisterIn(Credentials):
    consent: bool = False  # người lớn đồng ý lưu bộ thẻ của con vào tài khoản


class ProgressIn(BaseModel):
    progress: dict


def _account(con, user_id: int, username: str, token: str = "") -> dict:
    out = {"username": username, "progress": _load_progress(con, user_id)}
    if token:
        out["token"] = token
    return out


def _clean_username(u: str) -> str:
    return (u or "").strip().lower()


@router.post("/auth/register")
def register(body: RegisterIn):
    username = _clean_username(body.username)
    if not USERNAME_RE.match(username):
        raise HTTPException(400, "Tên đăng nhập dài 3-20 ký tự, chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới")
    if not PASSWORD_MIN <= len(body.password) <= PASSWORD_MAX:
        raise HTTPException(400, "Mật khẩu cần ít nhất %d ký tự" % PASSWORD_MIN)
    if not body.consent:
        raise HTTPException(400, "Người lớn cần đồng ý trước khi tạo tài khoản")
    salt = secrets.token_bytes(16)
    now = int(time.time())
    with _db() as con:
        try:
            cur = con.execute("INSERT INTO users (username, pw_hash, salt, created_at, consent_at) VALUES (?, ?, ?, ?, ?)",
                              (username, _hash_password(body.password, salt), salt, now, now))
        except sqlite3.IntegrityError:
            raise HTTPException(409, "Tên đăng nhập này đã có người dùng")
        user_id = cur.lastrowid
        _merge_progress(con, user_id, body.progress)
        return _account(con, user_id, username, _new_login(con, user_id))


@router.post("/auth/login")
def login(body: Credentials, request: Request):
    username = _clean_username(body.username)
    keys = ("u:" + username, "ip:" + (request.client.host if request.client else ""))
    if _too_many(keys):
        raise HTTPException(429, "Sai quá nhiều lần, thử lại sau 10 phút")
    with _db() as con:
        row = con.execute("SELECT id, pw_hash, salt FROM users WHERE username = ?", (username,)).fetchone()
        # Không có tài khoản vẫn băm một lần, để thời gian trả lời không lộ tên nào đã có.
        ok = hmac.compare_digest(_hash_password(body.password[:PASSWORD_MAX], row[2] if row else b"x" * 16),
                                 row[1] if row else b"")
        if not row or not ok:
            _record_fail(keys)
            raise HTTPException(401, "Sai tên đăng nhập hoặc mật khẩu")
        _clear_fails(keys)
        _merge_progress(con, row[0], body.progress)
        return _account(con, row[0], username, _new_login(con, row[0]))


@router.post("/auth/logout")
def logout(authorization: str = Header(default="")):
    with _db() as con:
        if authorization.lower().startswith("bearer "):
            con.execute("DELETE FROM logins WHERE token_hash = ?", (_token_hash(authorization[7:].strip()),))
    return {"ok": True}


@router.get("/auth/me")
def me(authorization: str = Header(default="")):
    with _db() as con:
        user_id, username = _user_from_token(con, authorization)
        return _account(con, user_id, username)


@router.put("/progress")
def put_progress(body: ProgressIn, authorization: str = Header(default="")):
    """Đồng bộ tiến độ: gộp bản trên máy vào tài khoản, trả bản đã gộp để máy cập nhật lại."""
    with _db() as con:
        user_id, username = _user_from_token(con, authorization)
        _merge_progress(con, user_id, body.progress)
        return _account(con, user_id, username)


init_db()
