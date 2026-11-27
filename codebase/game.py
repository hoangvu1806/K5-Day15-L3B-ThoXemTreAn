"""Phiên chơi của game GrowSafe: chọn màn, chấm nút đáp án, gọi agent khi trẻ tự gõ, tính sao, kết phiên.

server.py gọi vào đây. Luồng chấm lời tự gõ vẫn đi qua agent.answer_async (precheck → mask_pii → agent → postcheck),
nên giao diện và bộ câu thử dùng chung một luồng.

Phiên chỉ nằm trong bộ nhớ, không lưu tên hay thông tin định danh. Giới tính chỉ dùng để lọc màn,
không gửi cho model, không ghi vào bản nháp cho phụ huynh.
"""
import random
import uuid

from agent import answer_async
from ai import call_model, is_fake
from guardrails import HOTLINE_MESSAGE, SAFE_FALLBACK, mask_pii, postcheck
from tools import _load, draft_parent_teacher_note, evaluate_child_response
from tracing import note

MAX_LEVELS = 5
MAX_ATTEMPTS = 2
GENDERS = ("nam", "nu", "khong_noi")

SESSIONS = {}

# Ba hành động an toàn trong kho được đánh dấu "A:", "B:", "C:" ở đầu key_actions[].action.
ACTION_ICONS = {"A": "say_no", "B": "leave", "C": "tell_adult"}

CHOICE_SYSTEM = """Bạn là bạn cú dẫn truyện của trò chơi GrowSafe giúp trẻ tập phản xạ tự bảo vệ.
Trẻ vừa bấm một đáp án có sẵn. Code đã chấm đáp án đúng hay chưa đúng, bạn KHÔNG chấm lại.
Viết lời phản hồi 2-3 câu: khen điều đúng, hoặc nhẹ nhàng chỉ ra hành động an toàn còn thiếu dựa trên quy tắc được cho.
Khi nhắc kể với người lớn thì gọi tên người cụ thể: mẹ, bố, cô giáo, bác bảo vệ.
Xưng "mình", gọi trẻ là "con" (6-10) hoặc "em" (11-15). Ấm áp, không dọa, không đổ lỗi cho trẻ.
Nhóm 6-10: mỗi câu không quá 20 từ. Không bịa quy tắc ngoài phần được cho. Chỉ trả về lời phản hồi."""

NOTE_SYSTEM = """Bạn soạn bản nháp ngắn gửi phụ huynh hoặc giáo viên sau một phiên chơi GrowSafe.
Dựa đúng vào kết quả được cho, viết 3 phần, mỗi phần 1-2 câu, giữ nguyên tiêu đề:
Con làm tốt:
Con còn lúng túng:
Gợi ý mở lời:
Phần "Gợi ý mở lời" là một câu người lớn có thể hỏi con, ví dụ "Nếu có ai dặn con giữ bí mật làm con sợ, con sẽ kể với ai?".
Không nhắc tên, giới tính, trường, địa chỉ của trẻ. Không chẩn đoán, không kết luận trẻ đã bị xâm hại. Chỉ trả về bản nháp."""


class GameError(Exception):
    """Lỗi do yêu cầu sai (mã phiên, mã màn). server.py đổi thành HTTP 400/404."""

    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


# ---------- Dữ liệu ----------

def _scenarios():
    return _load("scenarios.json")


def _scenario(scenario_id):
    return next((s for s in _scenarios() if s.get("id") == scenario_id), None)


def _rules(scenario):
    ids = set(scenario.get("rule_ids", []))
    return [g for g in _load("guidelines.json") if g.get("code") in ids]


def _action_label(action):
    """'A: nói KHÔNG' → ('say_no', 'nói KHÔNG')."""
    head, sep, rest = action.partition(":")
    if sep and head.strip() in ACTION_ICONS:
        return ACTION_ICONS[head.strip()], rest.strip()
    return "", action.strip()


def _actions(labels):
    return [{"icon": icon, "label": label} for icon, label in map(_action_label, labels)]


def public_scenario(s):
    """Màn gửi cho giao diện. Không có cờ `correct` của đáp án để trẻ không xem được đáp án qua mạng."""
    return {
        "id": s["id"],
        "age_group": s["age_group"],
        "topic": s.get("topic", ""),
        "title": s.get("tieu_de", ""),
        "situation": s.get("tinh_huong") or s.get("situation", ""),
        "question": s.get("cau_hoi", ""),
        "choices": [{"id": c["id"], "text": c["text"]} for c in s.get("choices", [])],
        "scene": s.get("scene", {}),
        "key_actions": _actions([a.get("action", "") for a in s.get("key_actions", [])]),
    }


# ---------- Phiên ----------

def _get(session_id):
    session = SESSIONS.get(session_id)
    if not session:
        raise GameError("Không tìm thấy phiên chơi. Mở lại game nhé.", 404)
    return session


def _candidates(session):
    played = {r["scenario_id"] for r in session["results"]}
    return [s for s in _scenarios()
            if s.get("age_group") == session["age_group"]
            and session["gender"] in s.get("genders", GENDERS)
            and s.get("type", "mot_cau") == "mot_cau"
            and s.get("choices")
            and s["id"] not in played]


def _pick_next(session):
    """Ưu tiên chủ đề trẻ còn yếu (màn chưa đạt hoặc đạt ở lần 2), rồi tới chủ đề chưa chơi."""
    items = _candidates(session)
    if not items:
        return None
    weak = {r["topic"] for r in session["results"] if r["stars"] < 3}
    done = {r["topic"] for r in session["results"]}
    rng = random.Random(session["id"] + str(len(session["results"])))
    for pool in ([s for s in items if s.get("topic") in weak],
                 [s for s in items if s.get("topic") not in done],
                 items):
        if pool:
            return rng.choice(pool)
    return None


def _progress(session):
    return {"index": len(session["results"]), "total": session["total"],
            "stars": sum(r["stars"] for r in session["results"])}


def start(age_group, gender="", dialogue_mode="kich_ban"):
    if age_group not in ("6-10", "11-15"):
        raise GameError("age_group phải là 6-10 hoặc 11-15")
    gender = gender if gender in GENDERS else "khong_noi"
    session = {"id": uuid.uuid4().hex, "age_group": age_group, "gender": gender,
               "dialogue_mode": "kich_ban" if dialogue_mode != "ai_dong_vai" else "ai_dong_vai",
               "results": [], "current": None, "attempts": 0, "stopped": "", "draft": None}
    session["total"] = min(MAX_LEVELS, len(_candidates(session)))
    first = _pick_next(session)
    if not first:
        raise GameError("Kho chưa có màn cho nhóm tuổi này", 404)
    session["current"] = first["id"]
    SESSIONS[session["id"]] = session
    note("mở phiên: nhóm tuổi %s, %d màn" % (age_group, session["total"]))
    return {"session_id": session["id"], "age_group": age_group, "gender": gender,
            "dialogue_mode": session["dialogue_mode"], "scenario": public_scenario(first),
            "progress": _progress(session)}


# ---------- Chấm ----------

def _choice_feedback(session, scenario, choice):
    fallback = choice.get("feedback") or ("Đúng rồi!" if choice["correct"] else "Mình thử lại nhé.")
    if is_fake():
        return fallback
    rules = "\n".join("- %s: %s" % (g["title"], g["rule"]) for g in _rules(scenario))
    user = ("Nhóm tuổi: %s\nTình huống: %s\nTrẻ bấm: %s\nKết quả của code: %s\n"
            "Hành động an toàn cần có: %s\nQuy tắc:\n%s") % (
        session["age_group"], scenario.get("situation", ""), choice["text"],
        "ĐÚNG" if choice["correct"] else "CHƯA ĐÚNG",
        "; ".join(scenario.get("y_can_co", [])), rules)
    try:
        text = call_model(CHOICE_SYSTEM, user)["text"].strip()
    except Exception as e:  # model lỗi: dùng câu viết sẵn trong kho
        note("model lỗi khi viết phản hồi nút đáp án: %s" % e)
        return fallback
    out = postcheck(text, session["age_group"])
    if not text or out == SAFE_FALLBACK:  # postcheck chặn: dùng câu viết sẵn của đáp án, đúng xưng hô và đúng ý
        note("postcheck chặn phản hồi nút đáp án, dùng câu viết sẵn")
        return fallback
    return out


def _verdict(scenario, text):
    """Kết quả cho lời tự gõ: dat / chua_dat / hoi_lai, dựa trên evaluate_child_response."""
    ev = evaluate_child_response(scenario["id"], text)
    matched, missing = ev.get("matched", []), ev.get("missing", [])
    total = len(matched) + len(missing)
    if not matched and len(text.split()) <= 4:
        return "hoi_lai", matched, missing
    need = max(1, total - 1)  # thiếu tối đa một ý vẫn tính là đạt
    return ("dat" if len(matched) >= need else "chua_dat"), matched, missing


def _finish_level(session, scenario, result, matched):
    attempts = session["attempts"]
    stars = (3 if attempts == 1 else 2) if result == "dat" else 1
    session["results"].append({"scenario_id": scenario["id"], "topic": scenario.get("topic", ""),
                               "title": scenario.get("tieu_de", ""), "result": result,
                               "stars": stars, "attempts": attempts, "matched": matched})
    nxt = _pick_next(session) if len(session["results"]) < session["total"] else None
    session["current"] = nxt["id"] if nxt else None
    session["attempts"] = 0
    correct = next((c["text"] for c in scenario.get("choices", []) if c.get("correct")), "")
    return {"level_complete": True, "stars": stars,
            "rule_card": {"text": scenario.get("rule_card", ""), "card": scenario.get("scene", {}).get("card", "body"),
                          "title": scenario.get("tieu_de", "")},
            "correct_answer": "" if result == "dat" else correct,
            "next_scenario": public_scenario(nxt) if nxt else None,
            "session_done": nxt is None}


async def answer(session_id, scenario_id, choice_id="", text=""):
    session = _get(session_id)
    if session["stopped"]:
        raise GameError("Phiên chơi đã dừng")
    if scenario_id != session["current"]:
        raise GameError("Màn này không phải màn đang chơi")
    scenario = _scenario(scenario_id)
    if not scenario:
        raise GameError("Không có màn %s" % scenario_id, 404)
    base = {"scenario_id": scenario_id, "stopped": "", "level_complete": False}

    if choice_id:
        choice = next((c for c in scenario.get("choices", []) if c["id"] == choice_id), None)
        if not choice:
            raise GameError("Không có đáp án %s" % choice_id)
        result = "dat" if choice["correct"] else "chua_dat"
        matched = [a["action"] for a in scenario.get("key_actions", [])] if choice["correct"] else []
        missing = [] if choice["correct"] else [a["action"] for a in scenario.get("key_actions", [])]
        feedback = _choice_feedback(session, scenario, choice)
        answer_text = choice["text"]
    else:
        text = (text or "").strip()[:500]
        if not text:
            raise GameError("Con chưa gõ gì cả")
        situation = scenario.get("situation", "")
        res = await answer_async("Nhóm tuổi: %s | Tình huống: %s | Trẻ trả lời: %s" % (
            session["age_group"], situation, text), session_id, session["age_group"], scenario_id)
        if res.get("stopped") == "nghi_xam_hai_that":
            session["stopped"] = "nghi_xam_hai_that"
            return {**base, "result": "dung", "feedback": res["output"], "stopped": "nghi_xam_hai_that",
                    "help": help_content()}
        if res.get("stopped"):  # chèn lệnh, đòi đổi vai: không tính lượt, cho trả lời lại
            return {**base, "result": "hoi_lai", "feedback": res["output"], "attempts_left": MAX_ATTEMPTS - session["attempts"],
                    "matched_actions": [], "missing_actions": [], "answer_text": mask_pii(text)}
        result, matched, missing = _verdict(scenario, text)
        feedback = res["output"]
        answer_text = mask_pii(text)
        if result == "hoi_lai":
            return {**base, "result": "hoi_lai", "feedback": feedback, "attempts_left": MAX_ATTEMPTS - session["attempts"],
                    "matched_actions": [], "missing_actions": [], "answer_text": answer_text}

    session["attempts"] += 1
    out = {**base, "result": result, "feedback": feedback, "answer_text": answer_text,
           "attempts_left": MAX_ATTEMPTS - session["attempts"],
           "matched_actions": _actions(matched), "missing_actions": _actions(missing)}
    if result == "dat" or session["attempts"] >= MAX_ATTEMPTS:
        out.update(_finish_level(session, scenario, result, matched))
    out["progress"] = _progress(session)
    return out


# ---------- Con cần giúp, kết phiên ----------

def help_content():
    return {
        "title": "Mình tạm dừng trò chơi nhé",
        "message": HOTLINE_MESSAGE,
        "hotline": "111",
        "hotline_name": "Tổng đài quốc gia bảo vệ trẻ em",
        "steps": ["Con không có lỗi gì cả.",
                  "Con kể ngay với bố mẹ, cô giáo hoặc một người lớn con tin tưởng.",
                  "Con hoặc người lớn gọi 111. Gọi miễn phí, cả ngày lẫn đêm."],
    }


def help_session(session_id):
    session = SESSIONS.get(session_id)
    if session:
        session["stopped"] = session["stopped"] or "con_can_giup"
        note("trẻ bấm nút Con cần giúp, dừng phiên")
    return help_content()


def _note_fallback(session):
    good = [r["title"] for r in session["results"] if r["result"] == "dat"]
    weak = [r["title"] for r in session["results"] if r["result"] != "dat" or r["stars"] < 3]
    return ("Con làm tốt: %s.\nCon còn lúng túng: %s.\nGợi ý mở lời: \"Nếu có ai dặn con giữ bí mật làm con sợ, "
            "con sẽ kể với ai?\"") % (", ".join(good) or "con đã thử hết các màn", ", ".join(weak) or "chưa thấy chỗ nào")


def end(session_id):
    session = _get(session_id)
    if session["draft"]:
        return session["draft"]
    lines = ["Nhóm tuổi: %s" % session["age_group"]]
    for r in session["results"]:
        lines.append("- Màn \"%s\" (chủ đề %s): %s, %d sao, %d lần thử%s" % (
            r["title"], r["topic"], "đạt" if r["result"] == "dat" else "chưa đạt", r["stars"], r["attempts"],
            ("; làm được: " + ", ".join(r["matched"])) if r["matched"] else ""))
    if session["stopped"]:
        lines.append("- Phiên dừng sớm vì trẻ bấm nút Con cần giúp hoặc kể điều cần người lớn chú ý.")
    summary = "\n".join(lines)
    text = ""
    if not is_fake():
        try:
            text = postcheck(call_model(NOTE_SYSTEM, summary)["text"], "11-15")
        except Exception as e:
            note("model lỗi khi soạn bản nháp: %s" % e)
    if not text or text.startswith("Mình chưa trả lời"):
        text = _note_fallback(session)
    draft = draft_parent_teacher_note(mask_pii(text))
    stars = sum(r["stars"] for r in session["results"])
    passed = sum(1 for r in session["results"] if r["result"] == "dat")
    badges = []
    if passed and passed == len(session["results"]):
        badges.append("safe_hero")
    if any(any(a.startswith("A:") for a in r["matched"]) for r in session["results"]):
        badges.append("brave_no")
    session["draft"] = {**draft, "stars": stars, "max_stars": 3 * max(1, len(session["results"])),
                        "levels": [{k: r[k] for k in ("title", "result", "stars")} for r in session["results"]],
                        "badges": badges, "stopped": session["stopped"]}
    return session["draft"]
