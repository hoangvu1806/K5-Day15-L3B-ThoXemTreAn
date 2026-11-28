"""Công cụ của agent GrowSafe. Mỗi công cụ một hàm có @tool, docstring ghi: tên · input · output · tác động ra ngoài.

Dữ liệu đọc từ data/scenarios.json và data/guidelines.json (mô tả ở data/DATA_CARD.md).
Không công cụ nào gửi gì ra ngoài: draft_parent_teacher_note chỉ tạo bản nháp chờ người lớn duyệt.
"""
import json
import os
import re
import time
import uuid

from tracing import tool, TOOLS  # noqa: F401

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
AGE_GROUPS = ("6-10", "11-15")

DRAFTS = []  # bản nháp gửi phụ huynh / giáo viên, chờ duyệt (chỉ nằm trong bộ nhớ)
MAX_DRAFTS = 500  # bản nháp đã trả về cho phiên của nó, giữ thêm chỉ để chống RAM tăng mãi


def _load(name):
    path = os.path.join(DATA_DIR, name)
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _norm_age(age_group):
    return age_group if age_group in AGE_GROUPS else AGE_GROUPS[0]


@tool
def get_scenario(age_group: str, topic: str = "") -> dict:
    """get_scenario — lấy một tình huống trong kho theo nhóm tuổi và chủ đề.
    Input: age_group ("6-10" hoặc "11-15"), topic (chủ đề, có thể để trống).
    Output: {"id", "age_group", "topic", "situation", "key_actions"} hoặc {"error"} nếu không có.
    Tác động ra ngoài: không (chỉ đọc)."""
    age = _norm_age(age_group)
    items = [s for s in _load("scenarios.json") if s.get("age_group") == age]
    if topic:
        items = [s for s in items if topic.lower() in (s.get("topic", "") + " " + s.get("situation", "")).lower()] or items
    if not items:
        return {"error": "không có tình huống cho nhóm tuổi %s" % age}
    return items[0]


@tool
def search_safety_guideline(age_group: str, query: str) -> list:
    """search_safety_guideline — tra quy tắc an toàn chuẩn (nguồn UNESCO, UNICEF) theo nhóm tuổi.
    Input: age_group ("6-10" hoặc "11-15"), query (từ khóa hoặc câu trả lời của trẻ).
    Output: tối đa 3 quy tắc {"code", "title", "rule", "source"}; danh sách rỗng nếu không tìm thấy.
    Tác động ra ngoài: không (chỉ đọc)."""
    age = _norm_age(age_group)
    words = {w for w in query.lower().split() if len(w) > 1}
    scored = []
    for g in _load("guidelines.json"):
        if age not in g.get("age_groups", AGE_GROUPS):
            continue
        hay = (g.get("title", "") + " " + g.get("rule", "") + " " + " ".join(g.get("keywords", []))).lower()
        scored.append((sum(1 for w in words if w in hay), g))
    scored.sort(key=lambda x: -x[0])
    hits = [g for score, g in scored if score > 0] or [g for _, g in scored]
    return [{k: g.get(k) for k in ("code", "title", "rule", "source")} for g in hits[:3]]


# ---------- So khớp từ khóa (đường dự phòng của vai Giám khảo, xem agent.judge) ----------

# Phủ định đứng ngay trước từ khóa: "con không kể", "em ko dám báo" thì không tính là đã làm.
_NEG_BEFORE = re.compile(r"(không|ko|k|chẳng|chả|đừng|chưa|hông)\s+((dám|muốn|thèm|cần|nên|được|phải|bao giờ)\s+)?$")
# Lựa chọn không an toàn: có thì kết luận chưa đúng, dù có kèm ý đúng.
UNSAFE = ["giữ bí mật", "giấu", "đi theo", "đi với chú", "đi với cô", "đi gặp", "lên xe", "gửi ảnh", "gửi một tấm",
          "gửi luôn", "ngồi im", "để yên", "để chú", "để bà", "để anh", "cứ để", "đồng ý", "dạ con đi", "con đi ạ",
          "không kể", "ko kể", "không nói với ai", "nhận quà", "nhận kẹo", "chia sẻ tiếp", "share", "thả haha",
          "chuyển tiền", "gửi thêm"]
_QUESTION = re.compile(r"\?\s*$|^(sao|vì sao|tại sao|có phải|thế|vậy|làm sao)\b", re.I)


def _hit_kw(low: str, kw: str) -> bool:
    """Có từ khóa và không bị phủ định ngay trước. Từ khóa tự chứa phủ định ("nói không") thì không kiểm phủ định."""
    kw = kw.lower()
    for m in re.finditer(re.escape(kw), low):
        before = low[max(0, m.start() - 16):m.start()]
        if kw.split()[0] in ("không", "ko", "đừng", "chẳng") or not _NEG_BEFORE.search(before):
            return True
    return False


def keyword_judge(key_actions: list, text: str) -> dict:
    """Chấm thô bằng từ khóa. Trả cùng hình dạng với agent.judge:
    {"ket_luan", "da_lam", "con_thieu", "ly_do", "nguon": "tu_khoa"} với da_lam / con_thieu là mã hành động."""
    low = (text or "").lower().strip()
    done, miss = [], []
    for a in key_actions:
        code = a.get("code") or a.get("action", "")
        (done if any(_hit_kw(low, k) for k in a.get("keywords", [])) else miss).append(code)
    unsafe = next((u for u in UNSAFE if _hit_kw(low, u)), None)
    words = len(low.split())
    if unsafe:
        verdict, why = "chua_dat", "trẻ chọn cách chưa an toàn (%s)" % unsafe
    elif not done and _QUESTION.search(low):
        verdict, why = "cau_hoi", "trẻ hỏi lại"
    elif not done and words <= 4:
        verdict, why = "hoi_lai", "câu trả lời quá ngắn hoặc chưa rõ"
    elif done and len(done) >= max(1, len(key_actions) - 1):
        verdict, why = "dat", "nêu đủ ý chính"
    elif done:
        verdict, why = "dat_mot_phan", "có hành động an toàn nhưng còn thiếu"
    else:
        verdict, why = "chua_dat", "chưa nêu hành động an toàn nào"
    return {"ket_luan": verdict, "da_lam": done, "con_thieu": miss, "ly_do": why, "nguon": "tu_khoa"}


@tool
def evaluate_child_response(scenario_id: str, text: str) -> dict:
    """evaluate_child_response — đối chiếu câu trả lời của trẻ với các hành động an toàn cần có của tình huống.
    Input: scenario_id, text (câu trả lời của trẻ).
    Output: {"scenario_id", "matched", "missing", "ket_luan"}: hành động trẻ đã nêu và còn thiếu (so khớp từ khóa,
    có xét phủ định), kết luận thô. Kết luận chính thức do vai Giám khảo đưa ra (agent.judge).
    Tác động ra ngoài: không (chấm trong phiên, không lưu điểm)."""
    scenario = next((s for s in _load("scenarios.json") if s.get("id") == scenario_id), None)
    if not scenario:
        return {"error": "không có tình huống %s" % scenario_id}
    actions = scenario.get("key_actions", [])
    j = keyword_judge(actions, text)
    label = {a.get("code"): a.get("action") for a in actions}
    return {"scenario_id": scenario_id, "matched": [label.get(c, c) for c in j["da_lam"]],
            "missing": [label.get(c, c) for c in j["con_thieu"]], "ket_luan": j["ket_luan"]}


@tool
def draft_parent_teacher_note(session_summary: str) -> dict:
    """draft_parent_teacher_note — soạn bản nháp gợi ý cho phụ huynh / giáo viên sau lượt chơi.
    Input: session_summary (tóm tắt lượt chơi, không chứa thông tin định danh của trẻ).
    Output: {"draft_id", "status": "cho_duyet", "note"}.
    Tác động ra ngoài: KHÔNG gửi. Chỉ lưu bản nháp trong bộ nhớ, người lớn duyệt rồi mới dùng."""
    draft = {"draft_id": "D" + uuid.uuid4().hex[:12], "status": "cho_duyet",
             "created_at": time.strftime("%Y-%m-%d %H:%M:%S"), "note": session_summary}
    DRAFTS.append(draft)
    del DRAFTS[:-MAX_DRAFTS]
    return draft
