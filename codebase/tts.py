"""Đọc to (TTS) qua OpenRouter, endpoint POST /api/v1/audio/speech (cùng dạng API đọc của OpenAI, trả mp3).

docs/de-xuat-sprint-3.md mục 6 "Giọng nói":
- Trình duyệt không gọi thẳng OpenRouter; server.py làm trung gian để key không lộ ra giao diện.
- Chỉ đọc chữ của game (server.py kiểm chữ có nằm trong danh sách chữ game đã tạo ra cho phiên đó).
- Câu cố định đã đọc sẵn thành file trong frontend/public/assets/voice/. Ở đây chỉ đọc lời AI vừa viết
  và lời người lạ trong màn hội thoại. Lưu tạm theo mã băm của câu để câu lặp lại không gọi lại.
- Model và giọng theo data/voices.json. Chế độ giả (chưa có .env) thì không đọc, giao diện dùng giọng của trình duyệt.
Chỉ dùng thư viện chuẩn.
"""
import hashlib
import json
import os
import tempfile
import urllib.error
import urllib.request

from ai import API_KEY, is_fake

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = "https://openrouter.ai/api/v1/audio/speech"
CACHE_DIR = os.path.join(tempfile.gettempdir(), "growsafe_tts")
MAX_CHARS = 600
_mem = {}


class TTSError(Exception):
    pass


def _voices():
    with open(os.path.join(ROOT, "data", "voices.json"), encoding="utf-8") as f:
        return json.load(f)


def roles():
    return set(_voices().get("roles", {}))


def for_speech(text: str) -> str:
    """Số 111 đọc là "một một một" như các câu đã thu âm."""
    return text.replace("111", "một một một")


def synthesize(text: str, role: str) -> bytes:
    if is_fake() or not API_KEY:
        raise TTSError("Chưa nối model, dùng giọng của trình duyệt")
    cfg = _voices()
    r = cfg["roles"].get(role)
    if not r:
        raise TTSError("Không có vai giọng %s" % role)
    text = text.strip()[:MAX_CHARS]
    key = hashlib.sha256(("%s|%s|%s|%s" % (cfg["model"], r["voice"], r.get("instructions", ""), text)).encode()).hexdigest()
    if key in _mem:
        return _mem[key]
    path = os.path.join(CACHE_DIR, key + ".mp3")
    if os.path.exists(path):
        with open(path, "rb") as f:
            _mem[key] = f.read()
        return _mem[key]
    body = json.dumps({"model": cfg["model"], "input": for_speech(text), "voice": r["voice"],
                       "instructions": r.get("instructions", ""), "response_format": "mp3"}).encode()
    req = urllib.request.Request(URL, data=body, method="POST", headers={
        "Authorization": "Bearer " + API_KEY, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            audio = resp.read()
    except (urllib.error.URLError, TimeoutError) as e:
        raise TTSError("Gọi TTS lỗi: %s" % e)
    if not audio:
        raise TTSError("TTS trả về rỗng")
    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(path, "wb") as f:
        f.write(audio)
    _mem[key] = audio
    return audio
