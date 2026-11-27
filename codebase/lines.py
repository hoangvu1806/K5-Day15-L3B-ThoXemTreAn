"""Kho câu viết sẵn (data/lines.json) và tên nhân vật chính.

Câu viết sẵn có nhiều biến thể, chọn ngẫu nhiên, không lặp trong cùng một phiên (docs/de-xuat-tinh-nang.md mục 4.2).
Nhóm safe_* (câu 111, câu từ chối, câu dự phòng) do người viết và duyệt, không AI nào sinh lại.
"""
import json
import os
import random

DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "lines.json")
_cache = {}


def _data():
    if "d" not in _cache:
        with open(DATA, encoding="utf-8") as f:
            _cache["d"] = json.load(f)
    return _cache["d"]


def main_name(age_group: str, gender: str) -> str:
    """Bin / Na (6-10), Khôi / Mai (11-15). Giới tính chỉ dùng ở đây, không gửi cho model."""
    names = _data()["names"].get(age_group) or _data()["names"]["6-10"]
    return names.get(gender) or names["nam"]


def name_slug(name: str) -> str:
    return _data()["slugs"].get(name, "")


def fill(text: str, name: str) -> str:
    return (text or "").replace("{ten}", name or "bạn ấy")


def items(group: str, age_group: str = "", prefix: str = ""):
    out = []
    for it in _data()["groups"].get(group, []):
        if prefix and not it["id"].startswith(prefix):
            continue
        if age_group and it.get("age") and it["age"] != age_group:
            continue
        out.append(it)
    return out


def get(line_id: str):
    for group in _data()["groups"].values():
        for it in group:
            if it["id"] == line_id:
                return it
    return None


def voice_id(item: dict, name: str = "") -> str:
    """Mã file giọng đọc trong frontend/public/assets/voice/. Câu có {ten} có hậu tố theo tên."""
    if not item:
        return ""
    slug = name_slug(name) if item.get("per_name") else ""
    if item.get("per_name") and not slug:
        return ""
    return item["id"] + ("_" + slug if slug else "")


def pick(group: str, age_group: str = "", name: str = "", used=None, rng=None, prefix: str = "",
         need_name: bool = True) -> dict:
    """Chọn một câu, tránh các mã trong `used` (set, được cập nhật). Trả {"id", "text", "voice"}.
    need_name=False: ưu tiên biến thể không có {ten} (khi không biết tên nhân vật, vd lúc chạy eval)."""
    rng = rng or random
    pool = items(group, age_group, prefix)
    if not need_name and not name:
        pool = [it for it in pool if not it.get("per_name")] or pool
    if used is not None:
        fresh = [it for it in pool if it["id"] not in used]
        pool = fresh or pool
    if not pool:
        return {"id": "", "text": "", "voice": ""}
    it = rng.choice(pool)
    if used is not None:
        used.add(it["id"])
    return {"id": it["id"], "text": fill(it["text"], name), "voice": voice_id(it, name)}


def line(line_id: str, name: str = "") -> dict:
    it = get(line_id)
    if not it:
        return {"id": line_id, "text": "", "voice": ""}
    return {"id": it["id"], "text": fill(it["text"], name), "voice": voice_id(it, name)}


def age_code(age_group: str) -> str:
    return "610" if age_group == "6-10" else "1115"
