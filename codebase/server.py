"""API cho giao diện game. Chạy từ thư mục gốc repo:

    python -m uvicorn server:app --app-dir codebase --reload --port 6161

Hoặc: python codebase/server.py   (port lấy từ biến PORT, mặc định 6161)
Rồi mở http://127.0.0.1:6161/docs để thử.
Trace dùng biến toàn cục nên server xử lý tuần tự từng lượt (đủ cho demo, chưa dùng cho nhiều người cùng lúc).
Bật GROWSAFE_SHOW_DRAFT_SCENES=1 để nhóm chơi thử các màn chưa duyệt (duyet = false trong data/scenarios.json).
"""
import asyncio

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

import game
import tracing
import tts
from agent import answer_async
from ai import MODEL_NAME, is_fake
from tools import DRAFTS

app = FastAPI(title="GrowSafe AI")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
_lock = asyncio.Lock()


class ChatIn(BaseModel):
    text: str
    session_id: str = ""
    age_group: str = ""    # "6-10" hoặc "11-15"; để trống thì đoán từ text
    scenario_id: str = ""  # mã màn trong data/scenarios.json


class ChatOut(BaseModel):
    output: str
    session_id: str
    stopped: str = ""
    usage: dict = {}


@app.get("/health")
def health():
    return {"ok": True, "model": "fake" if is_fake() else MODEL_NAME, "show_drafts": game.SHOW_DRAFTS}


@app.post("/api/chat", response_model=ChatOut)
async def chat(body: ChatIn):
    async with _lock:
        tracing.begin("api")
        try:
            res = await answer_async(body.text, body.session_id, body.age_group, body.scenario_id)
        finally:
            summary, _ = tracing.end()
    return ChatOut(output=res["output"], session_id=res["session_id"], stopped=res.get("stopped", ""),
                   usage={k: summary[k] for k in ("model_calls", "tool_calls", "tokens_in", "tokens_out")})


class Cleared(BaseModel):
    id: str
    passed: bool = False


class SessionIn(BaseModel):
    age_group: str
    gender: str                      # nam / nu (bắt buộc: chọn tên nhân vật chính Bin/Na, Khôi/Mai)
    cleared: list[Cleared] = []      # màn đã xong, lưu trên máy của trẻ
    dialogue_mode: str = "kich_ban"  # ai_dong_vai chưa bật
    hour: int | None = None          # giờ trên máy, để chọn câu theo buổi


class LevelIn(BaseModel):
    session_id: str
    location: str


class AnswerIn(BaseModel):
    session_id: str
    scenario_id: str
    text: str = ""  # chữ trẻ gõ, hoặc chữ chuyển từ giọng nói đã được trẻ xác nhận. Server không nhận âm thanh


class HintIn(BaseModel):
    session_id: str
    scenario_id: str


class SessionRef(BaseModel):
    session_id: str = ""


class TTSIn(BaseModel):
    session_id: str
    text: str
    role: str = "tin610"


async def _traced(name, fn, *args):
    """Chạy một lượt game trong trace, đổi GameError thành lỗi HTTP."""
    async with _lock:
        tracing.begin(name)
        try:
            res = fn(*args)
            if asyncio.iscoroutine(res):
                res = await res
        except game.GameError as e:
            raise HTTPException(status_code=e.status, detail=str(e))
        finally:
            summary, _ = tracing.end()
    if isinstance(res, dict):
        res = {**res, "usage": {k: summary[k] for k in ("model_calls", "tool_calls", "tokens_in", "tokens_out")}}
    return res


@app.post("/api/session")
async def session_start(body: SessionIn):
    return await _traced("api-session", game.start, body.age_group, body.gender,
                         [c.model_dump() for c in body.cleared], body.dialogue_mode, body.hour)


@app.post("/api/level")
async def session_level(body: LevelIn):
    """Trẻ chọn một địa điểm trên bản đồ / một app trên điện thoại: Đạo diễn mở màn tiếp theo ở đó."""
    return await _traced("api-level", game.open_level, body.session_id, body.location)


@app.post("/api/answer")
async def session_answer(body: AnswerIn):
    return await _traced("api-answer", game.answer, body.session_id, body.scenario_id, body.text)


@app.post("/api/hint")
async def session_hint(body: HintIn):
    """Nút "Gợi ý" (bóng đèn): một câu hỏi ngược, không đưa đáp án. Tối đa 1 gợi ý mỗi lượt."""
    return await _traced("api-hint", game.hint, body.session_id, body.scenario_id)


@app.post("/api/detective")
async def session_detective(body: AnswerIn):
    """Thám tử nhận chiêu sau màn hội thoại: trẻ kể lại người lạ đã dùng chiêu gì."""
    return await _traced("api-detective", game.detective, body.session_id, body.scenario_id, body.text)


@app.post("/api/help")
async def session_help(body: SessionRef):
    """Nút cần giúp: dừng phiên, trả nội dung hướng dẫn và số 111. Không gọi model."""
    return game.help_session(body.session_id)


@app.post("/api/session/end")
async def session_end(body: SessionRef):
    """Kết phiên: bản nháp cho phụ huynh / giáo viên, trạng thái cho_duyet. Không gửi đi đâu."""
    return await _traced("api-end", game.end, body.session_id)


@app.post("/api/tts")
async def speak(body: TTSIn):
    """Đọc to lời game vừa tạo ra (lời Tin, lời người lạ). Không đọc chữ trẻ gõ hay nói."""
    session = game.SESSIONS.get(body.session_id)
    if not session or body.text.strip() not in session["spoken"]:
        raise HTTPException(status_code=403, detail="Chỉ đọc chữ của game trong phiên này")
    if body.role not in tts.roles():
        raise HTTPException(status_code=400, detail="Không có vai giọng này")
    try:
        audio = await asyncio.to_thread(tts.synthesize, body.text, body.role)
    except tts.TTSError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return Response(content=audio, media_type="audio/mpeg")


@app.get("/api/drafts")
def drafts():
    """Bản nháp gửi phụ huynh / giáo viên đang chờ duyệt. Không có endpoint nào tự gửi đi."""
    return DRAFTS


if __name__ == "__main__":
    import os
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT") or 6161))
