"""Công cụ của agent GrowSafe. Mỗi công cụ một hàm có @tool, docstring ghi: tên · input · output · tác động ra ngoài.

Dữ liệu đọc từ data/scenarios.json và data/guidelines.json (mô tả ở data/DATA_CARD.md).
Hai file hiện chỉ có vài dòng MẪU để luồng chạy được — Diệp thay bằng kho tình huống thật.
Không công cụ nào gửi gì ra ngoài: draft_parent_teacher_note chỉ tạo bản nháp chờ người lớn duyệt.
"""
import json
import os
import time

from tracing import tool, TOOLS  # noqa: F401

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
AGE_GROUPS = ("6-10", "11-15")

DRAFTS = []  # bản nháp gửi phụ huynh / giáo viên, chờ duyệt (chỉ nằm trong bộ nhớ)


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
    return [{k: g.get(k) for k in ("code", "title", "rule", "source")} for _, g in scored[:3]]


@tool
def evaluate_child_response(scenario_id: str, text: str) -> dict:
    """evaluate_child_response — đối chiếu câu trả lời của trẻ với các hành động an toàn cần có của tình huống.
    Input: scenario_id, text (câu trả lời của trẻ).
    Output: {"scenario_id", "matched", "missing"}: hành động trẻ đã nêu và còn thiếu (so khớp từ khóa, thô).
    Tác động ra ngoài: không (chấm trong phiên, không lưu điểm)."""
    scenario = next((s for s in _load("scenarios.json") if s.get("id") == scenario_id), None)
    if not scenario:
        return {"error": "không có tình huống %s" % scenario_id}
    low = text.lower()
    matched, missing = [], []
    for action in scenario.get("key_actions", []):
        hit = any(k.lower() in low for k in action.get("keywords", []))
        (matched if hit else missing).append(action.get("action"))
    return {"scenario_id": scenario_id, "matched": matched, "missing": missing}


@tool
def draft_parent_teacher_note(session_summary: str) -> dict:
    """draft_parent_teacher_note — soạn bản nháp gợi ý cho phụ huynh / giáo viên sau lượt chơi.
    Input: session_summary (tóm tắt lượt chơi, không chứa thông tin định danh của trẻ).
    Output: {"draft_id", "status": "cho_duyet", "note"}.
    Tác động ra ngoài: KHÔNG gửi. Chỉ lưu bản nháp trong bộ nhớ, người lớn duyệt rồi mới dùng."""
    draft = {"draft_id": "D%d" % (len(DRAFTS) + 1), "status": "cho_duyet",
             "created_at": time.strftime("%Y-%m-%d %H:%M:%S"), "note": session_summary}
    DRAFTS.append(draft)
    return draft
