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


# Từ ngữ không phù hợp trong lời trẻ: không chặn game, chỉ ghi lại để báo cáo cuối phiên cảnh báo người lớn.
# Bản đầu, nhóm bổ sung khi duyệt báo cáo. Chữ viết tắt so khớp nguyên từ để tránh bắt nhầm.
INAPPROPRIATE = {
    "chửi thề": ["địt", "đéo", "đ*o", "đụ", "đù má", "đm", "dm", "đmm", "dmm", "đcm", "dcm", "đkm", "dkm", "vcl", "vkl",
                 "vl", "vãi lồn", "clgt", "cmm", "con mẹ mày", "mẹ mày", "bố mày", "má mày", "chó má", "khốn nạn",
                 "fuck", "shit", "bitch"],
    "từ ngữ tình dục, thô tục": ["lồn", "cặc", "buồi", "dái", "chịch", "nện nhau", "làm tình", "sex", "porn", "nứng",
                                 "thủ dâm", "bú cu", "cu to"],
    "xúc phạm, miệt thị": ["thằng ngu", "con ngu", "óc chó", "đồ chó", "con điếm", "đĩ", "pê đê", "bê đê", "thằng đần",
                           "mày chết đi", "đi chết đi"],
}
_INAPPROPRIATE_RE = {k: re.compile(r"(?<!\w)(%s)(?!\w)" % "|".join(re.escape(w) for w in v), re.I)
                     for k, v in INAPPROPRIATE.items()}


def inappropriate(text: str) -> dict:
    """{nhóm: [từ đã gặp]} cho lời của trẻ. Rỗng nếu không có."""
    found = {}
    for kind, pattern in _INAPPROPRIATE_RE.items():
        words = sorted({m.group(1).lower() for m in pattern.finditer(text or "")})
        if words:
            found[kind] = words
    return found


_BULLET = re.compile(r"^\s*(?:[-*•–—]|\d+[.)])\s+", re.M)
_SPACED_DASH = re.compile(r"\s+[-–—]+\s+|\s*[–—]\s*")


def deslop(text: str) -> str:
    """Bỏ dấu hiệu văn máy: gạch đầu dòng, gạch ngang chen giữa câu, dấu chấm phẩy, in đậm markdown.
    Giữ gạch nối trong chữ như 6-10, khoa_lv99."""
    text = text.replace("**", "").replace("__", "")
    text = _BULLET.sub("", text)
    text = _SPACED_DASH.sub(", ", text)
    text = re.sub(r"\s*;\s*", ", ", text)
    text = re.sub(r",\s*([.!?])", r"\1", text)
    return re.sub(r"[ \t]{2,}", " ", text).strip()


def postcheck(output: str, age_group: str, name: str = "") -> str:
    """Hậu kiểm lời của AI. Có câu đổ lỗi, dọa trẻ thì thay bằng câu an toàn đúng nhóm tuổi. Luôn che thông tin định danh."""
    text = (output or "").strip()
    if not text or banned_phrase(text):
        return fallback_message(age_group, name)["text"]
    return mask_pii(deslop(text))


# ---------- Guardrail riêng cho chế độ Hỏi Tin (giáo dục giới tính) ----------

# Chặn đầu vào đòi nội dung 18+/khiêu dâm, cách quan hệ tình dục, hoặc kê đơn thuốc trước khi gọi model.
ASK_PORN_SIGNALS = [
    r"(web|trang|link|kênh|app|phim|clip|video).{0,25}(18\+|người lớn|sex|khiêu dâm|porn|hentai|jav|nóng|cởi truồng|khỏa thân)",
    r"(xem|tìm|chỉ|cho xin).{0,20}(phim người lớn|phim sex|phim 18\+|ảnh nóng|ảnh khỏa thân|ảnh nude|porn|hentai)",
    r"(cách|hướng dẫn|làm sao để).{0,25}(làm tình|quan hệ tình dục|thủ dâm|đút vào|làm chuyện ấy|làm chuyện người lớn)",
    r"(tả|kể chi tiết|mô tả).{0,25}(làm tình|quan hệ tình dục|phim 18\+|chuyện ấy)",
]

ASK_MEDICAL_SIGNALS = [
    r"(uống|mua|dùng|bôi)\s+thuốc\s+(gì|nào)",
    r"(kê đơn|chẩn đoán|bị bệnh gì|uống paracetamol|uống kháng sinh)",
]

# Chặn đầu ra mở thêm cửa (URL, tên web/app, xúi tự tìm trên mạng), kê thuốc, hoặc dùng từ lóng/thô tục.
ASK_FORBIDDEN_OUTPUT = [
    re.compile(r"https?://|www\.|\.(com|vn|net|org|tv|xxx)\b", re.I),
    re.compile(r"(lên|vào|tìm trên|tra trên|xem trên)\s+(google|youtube|tiktok|facebook|mạng|internet|web)", re.I),
    re.compile(r"(uống|mua|dùng)\s+(thuốc\s+giảm\s+đau|paracetamol|ibuprofen|panadol|kháng\s+sinh|thuốc\s+tránh\s+thai)", re.I),
    re.compile(r"(tư thế|màn dạo đầu|lên đỉnh|cực khoái|xuất tinh vào|đút dương vật|đưa dương vật)", re.I),
]

# Riêng nhóm 6-10 trong Hỏi Tin: không dùng từ giải phẫu trực diện, dùng cách nói dịu nhẹ ("vùng riêng tư", "chỗ đồ bơi che", "trong bụng mẹ").
ASK_FORBIDDEN_6_10 = re.compile(
    r"\b(dương vật|âm hộ|âm đạo|tinh hoàn|tinh trùng|tử cung|bộ phận sinh dục|xuất tinh|mộng tinh|kinh nguyệt|quan hệ tình dục)\b",
    re.I,
)

_ADULT_REF = re.compile(
    r"\b(mẹ|bố|ba|bố mẹ|ba mẹ|thầy|cô giáo|cô y tế|nhân viên y tế|bác sĩ|người lớn|anh chị|111)\b", re.I
)


def ask_input_block(text: str):
    """Kiểm nhanh đầu vào chế độ Hỏi Tin: '18_plus' | 'medical' | None."""
    if _hit(ASK_PORN_SIGNALS, text or ""):
        return "18_plus"
    if _hit(ASK_MEDICAL_SIGNALS, text or ""):
        return "medical"
    return None


def has_adult_ref(text: str) -> bool:
    return bool(_ADULT_REF.search(text or ""))


def ask_postcheck(output: str, age_group: str, fallback: str, require_adult: bool = False) -> str:
    """Hậu kiểm riêng cho Hỏi Tin: chặn đổ lỗi, dọa, link/xúi tìm mạng, kê thuốc, từ thô tục, từ giải phẫu quá thẳng với 6-10."""
    text = (output or "").strip()
    if not text or banned_phrase(text) or inappropriate(text):
        return fallback
    cleaned = mask_pii(deslop(text))
    if any(p.search(cleaned) for p in ASK_FORBIDDEN_OUTPUT):
        return fallback
    if age_group == "6-10" and ASK_FORBIDDEN_6_10.search(cleaned):
        return fallback
    if require_adult and not has_adult_ref(cleaned):
        return fallback
    if age_group == "6-10" and long_sentences(cleaned, age_group):
        return fallback
    return cleaned
