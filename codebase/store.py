"""Trạng thái dùng chung giữa các tiến trình: phiên chơi, phiên Góc Tò Mò, bản nháp, bộ đếm chống spam.

Có REDIS_URL thì lưu ở Redis (chạy nhiều worker / replica). Không có thì lưu trong RAM của tiến trình,
để dev, eval và simulate chạy được mà không cần cài gì. Hai đường đều mã hoá JSON như nhau.

Phiên được sửa trong một "lượt" (unit): server khoá đúng phiên của request, game.py / ask.py đọc và sửa dict
như thường, hết lượt thì ghi lại. Lượt lỗi thì không ghi gì. Đọc ngoài lượt chỉ nhận bản sao, sửa không lưu.
"""
import asyncio
import contextvars
import json
import os
import random
import threading
import time
import uuid
from contextlib import asynccontextmanager

REDIS_URL = (os.environ.get("REDIS_URL") or "").strip()
SESSION_TTL = int(os.environ.get("GROWSAFE_SESSION_TTL") or 45 * 60)
LOCK_TTL = 150   # đủ cho một lượt có vài lần gọi model; tiến trình chết thì khoá tự nhả
LOCK_WAIT = 60
PREFIX = "gs:"

owner = contextvars.ContextVar("growsafe_owner", default="")   # tài khoản của request đang xử lý
_unit = contextvars.ContextVar("growsafe_unit", default=None)


class Busy(Exception):
    """Phiên đang được request khác xử lý quá lâu."""


# ---------- Mã hoá ----------

def _encode_extra(value):
    if isinstance(value, set):
        return {"__set__": sorted(value)}
    if isinstance(value, random.Random):
        version, state, gauss = value.getstate()
        return {"__rng__": [version, list(state), gauss]}
    raise TypeError("Không lưu được kiểu %s vào phiên" % type(value).__name__)


def _decode_extra(obj):
    if "__set__" in obj:
        return set(obj["__set__"])
    if "__rng__" in obj:
        version, state, gauss = obj["__rng__"]
        rng = random.Random()
        rng.setstate((version, tuple(state), gauss))
        return rng
    return obj


def dumps(value) -> str:
    return json.dumps(value, ensure_ascii=False, default=_encode_extra)


def loads(raw):
    return json.loads(raw, object_hook=_decode_extra)


# ---------- Nơi lưu ----------

class MemoryBackend:
    def __init__(self):
        self._data = {}      # key -> (giá trị, hết hạn)
        self._hits = {}      # key -> (các mốc thời gian, cửa sổ)
        self._mutex = threading.Lock()

    def get(self, key):
        with self._mutex:
            item = self._data.get(key)
            if item and item[1] < time.time():
                del self._data[key]
                return None
            return item[0] if item else None

    def set(self, key, value, ttl):
        with self._mutex:
            self._data[key] = (value, time.time() + ttl)

    def add(self, key, value, ttl) -> bool:
        with self._mutex:
            item = self._data.get(key)
            if item and item[1] >= time.time():
                return False
            self._data[key] = (value, time.time() + ttl)
            return True

    def delete_if(self, key, value):
        with self._mutex:
            if self._data.get(key, (None,))[0] == value:
                del self._data[key]

    def _recent(self, key, window):
        return [t for t in self._hits.get(key, ([], 0))[0] if time.time() - t < window]

    def hit(self, key, limit, window) -> bool:
        with self._mutex:
            recent = self._recent(key, window)
            ok = len(recent) < limit
            if ok:
                recent.append(time.time())
            self._hits[key] = (recent, window)
            return ok

    def count(self, key, window) -> int:
        with self._mutex:
            return len(self._recent(key, window))

    def record(self, key, window):
        with self._mutex:
            self._hits[key] = (self._recent(key, window) + [time.time()], window)

    def clear(self, key):
        with self._mutex:
            self._hits.pop(key, None)

    def prune(self):
        now = time.time()
        with self._mutex:
            for k in [k for k, (_, exp) in self._data.items() if exp < now]:
                del self._data[k]
            for k in [k for k, (ts, window) in self._hits.items() if not ts or now - ts[-1] > window]:
                del self._hits[k]


class RedisBackend:
    # Cửa sổ trượt bằng sorted set. Lấy giờ của Redis để các replica không lệch đồng hồ.
    _HIT = """
    local t = redis.call('TIME')
    local now = t[1] * 1000000 + t[2]
    redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now - ARGV[2] * 1000000)
    if tonumber(ARGV[1]) >= 0 and redis.call('ZCARD', KEYS[1]) >= tonumber(ARGV[1]) then return 0 end
    redis.call('ZADD', KEYS[1], now, ARGV[3])
    redis.call('EXPIRE', KEYS[1], ARGV[2])
    return 1
    """
    _COUNT = """
    local t = redis.call('TIME')
    local now = t[1] * 1000000 + t[2]
    redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now - ARGV[1] * 1000000)
    return redis.call('ZCARD', KEYS[1])
    """
    _DELETE_IF = "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0"

    def __init__(self, url=None, client=None):
        if client is None:
            import redis
            client = redis.Redis.from_url(url, decode_responses=True, socket_timeout=5, socket_connect_timeout=5,
                                          health_check_interval=30)
        self.r = client

    def get(self, key):
        return self.r.get(PREFIX + key)

    def set(self, key, value, ttl):
        self.r.set(PREFIX + key, value, ex=ttl)

    def add(self, key, value, ttl) -> bool:
        return bool(self.r.set(PREFIX + key, value, ex=ttl, nx=True))

    def delete_if(self, key, value):
        self.r.eval(self._DELETE_IF, 1, PREFIX + key, value)

    def hit(self, key, limit, window) -> bool:
        return bool(self.r.eval(self._HIT, 1, PREFIX + key, limit, window, uuid.uuid4().hex))

    def count(self, key, window) -> int:
        return int(self.r.eval(self._COUNT, 1, PREFIX + key, window))

    def record(self, key, window):
        self.r.eval(self._HIT, 1, PREFIX + key, -1, window, uuid.uuid4().hex)

    def clear(self, key):
        self.r.delete(PREFIX + key)

    def prune(self):
        pass  # Redis tự xoá theo TTL


backend = RedisBackend(REDIS_URL) if REDIS_URL else MemoryBackend()


# ---------- Phiên ----------

class Sessions:
    """Dùng như dict {mã phiên: phiên}. on_load chỉnh phiên mỗi lần đọc lên."""

    def __init__(self, kind, on_load=None):
        self.kind = kind
        self.on_load = on_load

    def _key(self, sid):
        return "%s:%s" % (self.kind, sid)

    def get(self, sid, default=None):
        if not sid:
            return default
        key = self._key(sid)
        unit = _unit.get()
        if unit is not None and key in unit["loaded"]:
            return unit["loaded"][key]
        raw = backend.get(key)
        if raw is None:
            return default
        value = loads(raw)
        if self.on_load:
            self.on_load(value)
        if unit is not None and key in unit["locked"]:
            unit["loaded"][key] = value
        return value

    def __setitem__(self, sid, value):
        key = self._key(sid)
        unit = _unit.get()
        if unit is None:
            backend.set(key, dumps(value), SESSION_TTL)
        else:
            unit["loaded"][key] = value


async def _acquire(key, token):
    deadline = time.monotonic() + LOCK_WAIT
    delay = 0.02
    while not await asyncio.to_thread(backend.add, "lock:" + key, token, LOCK_TTL):
        if time.monotonic() > deadline:
            raise Busy()
        await asyncio.sleep(delay)
        delay = min(delay * 2, 0.25)


def _commit(loaded):
    for key, value in loaded.items():
        backend.set(key, dumps(value), SESSION_TTL)


@asynccontextmanager
async def unit(*sessions):
    """async with unit((game.SESSIONS, sid)): ... — khoá các phiên nêu ra, ghi lại khi khối chạy xong không lỗi."""
    keys = sorted(store._key(sid) for store, sid in sessions if sid)
    token = uuid.uuid4().hex
    held = []
    try:
        for key in keys:
            await _acquire(key, token)
            held.append(key)
        state = {"locked": set(keys), "loaded": {}}
        reset = _unit.set(state)
        try:
            yield
            await asyncio.to_thread(_commit, state["loaded"])
        finally:
            _unit.reset(reset)
    finally:
        for key in held:
            await asyncio.to_thread(backend.delete_if, "lock:" + key, token)


# ---------- Giá trị phụ, bản nháp ----------

def put(key, value, ttl=SESSION_TTL):
    backend.set(key, dumps(value), ttl)


def fetch(key, default=None):
    raw = backend.get(key)
    return default if raw is None else loads(raw)
