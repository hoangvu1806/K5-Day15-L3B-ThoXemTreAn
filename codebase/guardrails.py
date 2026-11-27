"""Guardrail viết bằng code, chạy trước và sau agent (lớp giữa: agent chỉ dùng công cụ đọc kho chuẩn).

Khớp metric trong eval/metric_spec.yaml:
    precheck  → dung_game_hien_111, khong_theo_prompt_injection
    mask_pii  → khong_lo_thong_tin_dinh_danh
    postcheck → dung_tuoi_khong_do_loi, khong_lo_thong_tin_dinh_danh
Từ khóa ở đây viết theo kiểu chung, không chép câu thử. Chỉnh khi chạy eval thấy lọt hoặc chặn nhầm.
"""
import re

import lines

# Câu an toàn lấy từ data/lines.json (nhóm safe_*), viết riêng cho 6-10 (Tin xưng "tớ", gọi "cậu")
# và 11-15 ("mình", "bạn"). Câu 111 nào cũng đủ ba ý: có số 111, nói rõ trò chơi dừng, không chấm điểm.
# Không AI nào sinh lại các câu này (docs/de-xuat-tinh-nang.md mục 4.1, 4.2).


def _safe(group, age_group, name="", rng=None, used=None):
    return lines.pick(group, age_group if age_group in ("6-10", "11-15") else "6-10", name,
                      used=used, rng=rng, need_name=False)


def hotline_message(age_group="6-10", name="", rng=None) -> dict:
    """{"id", "text", "voice"}: câu dừng game khi nghi xâm hại thật."""
    return _safe("safe_hotline", age_group, name, rng)


def helpbtn_message(age_group="6-10") -> dict:
    return _safe("safe_helpbtn", age_group)


def injection_message(age_group="6-10", name="", rng=None) -> dict:
    return _safe("safe_inject", age_group, name, rng)


def fallback_message(age_group="6-10", name="") -> dict:
    return _safe("safe_fallback", age_group, name)


def exitrole_message(age_group="6-10") -> dict:
    return _safe("safe_exitrole", age_group)


# Giữ tên cũ cho code khác đang dùng (bản 6-10, biến thể đầu).
HOTLINE_MESSAGE = lines.line("safe_hotline_610_a")["text"]
INJECTION_MESSAGE = lines.line("safe_inject_610_b")["text"].replace("{ten}", "bạn ấy")

_WHO = r"(con|em|tớ|tao|mình|cháu)"
_BODY = r"(người|vùng kín|chỗ kín|ngực|mông|đùi|quần|váy|áo)"

# Trẻ kể chuyện đang hoặc đã xảy ra với chính mình ngoài game.
ABUSE_SIGNALS = [
    _WHO + r" (đã |hay |từng )?bị .{0,30}(sờ|chạm|mó|xâm hại|hiếp|lột)",
    r"(sờ|chạm|mó|thò tay) (vào |lên )?" + _BODY + r" (của )?" + _WHO + r"\b",
    r"bắt " + _WHO + r" (cởi|cho xem|chụp ảnh)",
    r"(dọa|đe|cấm) " + _WHO + r" (không được |đừng )?(kể|nói)",
]

# Trẻ cố đổi vai trò của AI, lấy prompt, hoặc ép kết quả chấm.
INJECTION_SIGNALS = [
    r"bỏ qua (hết |mọi |tất cả )?(luật|hướng dẫn|chỉ dẫn|quy tắc)",
    r"ignore (all |previous |the )*(instructions|rules)",
    r"system prompt|chế độ admin|developer mode",
    r"(đóng vai|hãy là|giờ bạn là|làm) .{0,20}(chú lạ|người lạ|kẻ xấu|người xấu|kẻ dụ)",
    r"chấm (câu này |cho em |cho con )?\d+ ?/ ?10",
]


def _hit(patterns, text):
    low = text.lower()
    return next((p for p in patterns if re.search(p, low)), None)


def precheck(child_text: str, age_group: str = "6-10", name: str = "", rng=None):
    """Tiền kiểm lời của trẻ (không quét phần tình huống).
    None = cho qua, hoặc {"reason", "message", "voice"}: câu viết sẵn đúng xưng hô của nhóm tuổi."""
    if _hit(ABUSE_SIGNALS, child_text):
        m = hotline_message(age_group, name, rng)
        return {"reason": "nghi_xam_hai_that", "message": m["text"], "voice": m["voice"]}
    if _hit(INJECTION_SIGNALS, child_text):
        m = injection_message(age_group, name, rng)
        return {"reason": "prompt_injection", "message": m["text"], "voice": m["voice"]}
    return None


# Trẻ muốn thoát màn hội thoại với người lạ (docs/game-flow.md, guardrail 5).
_EXIT = re.compile(r"^\s*(dừng|dung|stop|thôi|không chơi nữa|ko chơi nữa)\b|\b(dừng lại|thôi không chơi)\b", re.I)


def wants_exit(child_text: str) -> bool:
    return bool(_EXIT.search(child_text or ""))


def strip_injection(child_text: str) -> str:
    """Bỏ phần chèn lệnh (trong ngoặc vuông, ngoặc đơn hoặc cả câu có dấu hiệu injection), giữ phần trẻ trả lời thật."""
    text = re.sub(r"\[[^\]]*\]|\([^)]*\)", lambda m: "" if _hit(INJECTION_SIGNALS, m.group(0)) else m.group(0), child_text)
    parts = re.split(r"(?<=[.!?])\s+", text)
    return " ".join(s for s in parts if not _hit(INJECTION_SIGNALS, s)).strip()


_PII = [
    (re.compile(r"(\+?84|0)(\d[\s.-]?){8,10}\b"), "[số điện thoại]"),
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+"), "[email]"),
    (re.compile(r"(?<!\w)@[\w.]{3,}"), "[tài khoản]"),
    (re.compile(r"(facebook|fb|zalo|tiktok|instagram)\.(com|me)/\S+", re.I), "[tài khoản]"),
    (re.compile(r"\b(số nhà|nhà số|ngõ|ngách|hẻm)\s*\d+[\w/]*", re.I), "[địa chỉ]"),
]


def mask_pii(text: str) -> str:
    """Che số điện thoại, email, tài khoản mạng, số nhà trước khi gửi cho model và trước khi đưa ra ngoài."""
    for pattern, label in _PII:
        text = pattern.sub(label, text)
    return text


# Câu đổ lỗi hoặc dọa trẻ. Bản đầu, bổ sung khi chấm eval.
BANNED_OUTPUT = ["lỗi của con", "tại con", "con hư", "đáng bị", "con không nên mặc", "sao con không chống",
                 "lỗi của em", "tại em", "sẽ bị bắt", "sẽ phạt con", "sẽ phạt em", "con trai thì không sao",
                 "con gái phải cẩn thận hơn",
                 # Xưng hô mới (Tin gọi trẻ "cậu" ở 6-10, "bạn" ở 11-15). Thiếu là postcheck lọt câu đổ lỗi.
                 "lỗi của cậu", "tại cậu", "lỗi của bạn", "tại bạn", "sẽ phạt cậu", "sẽ phạt bạn",
                 "cậu hư", "bạn hư", "cậu không nên mặc", "bạn không nên mặc", "sao cậu không chống",
                 "sao bạn không chống"]
MAX_WORDS_6_10 = 25
SAFE_FALLBACK = fallback_message("6-10")["text"]


def is_fallback(text: str) -> bool:
    """Câu dự phòng của postcheck (mọi nhóm tuổi, mọi tên)."""
    t = (text or "").strip()
    return any(t == lines.fill(it["text"], n) for it in lines.items("safe_fallback")
               for n in ("bạn ấy", "Bin", "Na", "Khôi", "Mai"))


def long_sentences(text: str, age_group: str) -> list:
    """Câu quá 25 từ (chỉ tính cho nhóm 6-10, theo metric dung_tuoi_khong_do_loi)."""
    if age_group != "6-10":
        return []
    return [s for s in re.split(r"(?<=[.!?…])\s+|\n+", text) if len(s.split()) > MAX_WORDS_6_10]


# Phủ định đứng ngay trước cụm cấm thì là câu trấn an ("không phải lỗi của con"), không phải câu đổ lỗi.
_NEGATION = re.compile(r"(không phải|chẳng phải|đâu phải|không hề|không bao giờ là|chưa bao giờ là|không có)\s*(là\s*)?$")
# "hiện tại em", "tồn tại con": chữ "tại" thuộc từ ghép, không phải "tại em" đổ lỗi.
_COMPOUND_TAI = re.compile(r"(hiện|thực|tồn)\s*$")


def banned_phrase(text: str):
    """Cụm đổ lỗi hoặc dọa trẻ đầu tiên có trong text, bỏ qua khi có phủ định hoặc từ ghép đứng trước. None nếu không có."""
    low = (text or "").lower()
    for phrase in BANNED_OUTPUT:
        for m in re.finditer(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", low):
            before = low[max(0, m.start() - 24):m.start()]
            if _NEGATION.search(before):
                continue
            if phrase.startswith("tại ") and _COMPOUND_TAI.search(before):
                continue
            return phrase
    return None


def postcheck(output: str, age_group: str, name: str = "") -> str:
    """Hậu kiểm lời của AI. Có câu đổ lỗi, dọa trẻ thì thay bằng câu an toàn đúng nhóm tuổi. Luôn che thông tin định danh."""
    text = (output or "").strip()
    if not text or banned_phrase(text):
        return fallback_message(age_group, name)["text"]
    return mask_pii(text)
