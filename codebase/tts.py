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
import subprocess
import tempfile
import threading
import urllib.error
import urllib.request
from collections import OrderedDict

from ai import API_KEY, is_fake

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = "https://openrouter.ai/api/v1/audio/speech"
CACHE_DIR = os.environ.get("GROWSAFE_TTS_CACHE") or os.path.join(tempfile.gettempdir(), "growsafe_tts")
MAX_CHARS = 600
MEM_ITEMS = int(os.environ.get("GROWSAFE_TTS_MEM_ITEMS") or 200)    # ~20-40KB mỗi câu mp3
DISK_ITEMS = int(os.environ.get("GROWSAFE_TTS_DISK_ITEMS") or 5000)
_mem = OrderedDict()
_mem_lock = threading.Lock()


def _recall(key):
    with _mem_lock:
        audio = _mem.get(key)
        if audio is not None:
            _mem.move_to_end(key)
        return audio


def _remember(key, audio):
    with _mem_lock:
        _mem[key] = audio
        _mem.move_to_end(key)
        while len(_mem) > MEM_ITEMS:
            _mem.popitem(last=False)


def prune_disk():
    """Xoá file cache cũ nhất khi vượt DISK_ITEMS."""
    try:
        files = [os.path.join(CACHE_DIR, f) for f in os.listdir(CACHE_DIR) if f.endswith(".mp3")]
    except FileNotFoundError:
        return
    if len(files) <= DISK_ITEMS:
        return
    files.sort(key=os.path.getmtime)
    for path in files[:len(files) - DISK_ITEMS]:
        try:
            os.remove(path)
        except OSError:
            pass


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


def _wav_to_mp3(wav: bytes) -> bytes:
    p = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-f", "wav", "-i", "pipe:0",
                       "-f", "mp3", "-codec:a", "libmp3lame", "-qscale:a", "4", "pipe:1"],
                       input=wav, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    return p.stdout


def synthesize(text: str, role: str) -> bytes:
    if is_fake() or not API_KEY:
        raise TTSError("Chưa nối model, dùng giọng của trình duyệt")
    cfg = _voices()
    r = cfg["roles"].get(role)
    if not r:
        raise TTSError("Không có vai giọng %s" % role)
    text = text.strip()[:MAX_CHARS]
    key = hashlib.sha256(("%s|%s|%s|%s" % (cfg["model"], r["voice"], r.get("instructions", ""), text)).encode()).hexdigest()
    cached = _recall(key)
    if cached is not None:
        return cached
    path = os.path.join(CACHE_DIR, key + ".mp3")
    if os.path.exists(path):
        with open(path, "rb") as f:
            audio = f.read()
        _remember(key, audio)
        return audio
    # Provider hiện chỉ trả pcm/wav, không còn mp3: xin wav rồi tự chuyển sang mp3 bằng ffmpeg.
    body = json.dumps({"model": cfg["model"], "input": for_speech(text), "voice": r["voice"],
                       "instructions": r.get("instructions", ""), "response_format": "wav"}).encode()
    req = urllib.request.Request(URL, data=body, method="POST", headers={
        "Authorization": "Bearer " + API_KEY, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            wav = resp.read()
    except (urllib.error.URLError, TimeoutError) as e:
        raise TTSError("Gọi TTS lỗi: %s" % e)
    if not wav:
        raise TTSError("TTS trả về rỗng")
    try:
        audio = _wav_to_mp3(wav)
    except (OSError, subprocess.SubprocessError) as e:
        raise TTSError("Chuyển wav sang mp3 lỗi (cần cài ffmpeg): %s" % e)
    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(path, "wb") as f:
        f.write(audio)
    _remember(key, audio)
    return audio
