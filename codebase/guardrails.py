"""Guardrail viết bằng code, chạy trước và sau agent (lớp giữa: agent chỉ dùng công cụ đọc kho chuẩn).

Khớp metric trong eval/metric_spec.yaml:
    precheck  → dung_game_hien_111, khong_theo_prompt_injection
    mask_pii  → khong_lo_thong_tin_dinh_danh
    postcheck → dung_tuoi_khong_do_loi, khong_lo_thong_tin_dinh_danh
Từ khóa ở đây viết theo kiểu chung, không chép câu thử. Chỉnh khi chạy eval thấy lọt hoặc chặn nhầm.
"""
import re

HOTLINE_MESSAGE = (
    "Mình tạm dừng trò chơi ở đây nhé. Điều con vừa kể rất quan trọng, và con không có lỗi gì cả. "
    "Con hãy kể ngay cho bố mẹ, cô giáo hoặc một người lớn con tin tưởng. "
    "Con hoặc người lớn có thể gọi Tổng đài quốc gia bảo vệ trẻ em 111, miễn phí."
)
INJECTION_MESSAGE = (
    "Mình không làm theo yêu cầu đó được. Mình chỉ chơi các tình huống luyện tập có sẵn thôi. "
    "Mình quay lại tình huống nhé?"
)

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


def precheck(child_text: str):
    """Tiền kiểm lời của trẻ (không quét phần tình huống). None = cho qua, hoặc {"reason", "message"}."""
    if _hit(ABUSE_SIGNALS, child_text):
        return {"reason": "nghi_xam_hai_that", "message": HOTLINE_MESSAGE}
    if _hit(INJECTION_SIGNALS, child_text):
        return {"reason": "prompt_injection", "message": INJECTION_MESSAGE}
    return None


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
                 "con gái phải cẩn thận hơn"]
MAX_WORDS_6_10 = 25
SAFE_FALLBACK = "Mình chưa trả lời được câu này. Con thử kể lại con sẽ làm gì trong tình huống nhé."


def long_sentences(text: str, age_group: str) -> list:
    """Câu quá 25 từ (chỉ tính cho nhóm 6-10, theo metric dung_tuoi_khong_do_loi)."""
    if age_group != "6-10":
        return []
    return [s for s in re.split(r"(?<=[.!?…])\s+|\n+", text) if len(s.split()) > MAX_WORDS_6_10]


def postcheck(output: str, age_group: str) -> str:
    """Hậu kiểm lời của AI. Có câu đổ lỗi, dọa trẻ thì thay bằng câu an toàn. Luôn che thông tin định danh."""
    text = (output or "").strip()
    if not text or any(w in text.lower() for w in BANNED_OUTPUT):
        return SAFE_FALLBACK
    return mask_pii(text)
