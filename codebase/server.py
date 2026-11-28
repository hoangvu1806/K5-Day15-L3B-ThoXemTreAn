"""API cho giao diện game. Chạy từ thư mục gốc repo:

    python -m uvicorn server:app --app-dir codebase --reload --port 6161

Hoặc: python codebase/server.py   (port lấy từ biến PORT, mặc định 6161)
Rồi mở http://127.0.0.1:6161/docs để thử.
Trace dùng biến toàn cục nên server xử lý tuần tự từng lượt (đủ cho demo, chưa dùng cho nhiều người cùng lúc).
Bật GROWSAFE_SHOW_DRAFT_SCENES=1 để nhóm chơi thử các màn chưa duyệt (duyet = false trong data/scenarios.json).
"""
import asyncio
import os
import time

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

import agent
import ask
import auth
import game
import tracing
import tts
from agent import answer_async
from ai import MODEL_NAME, is_fake

app = FastAPI(title="GrowSafe AI")
# CORS_ORIGINS: danh sách domain cách nhau bằng dấu phẩy. Không đặt (hoặc để trống) thì chỉ cho localhost dev,
# KHÔNG mở "*" vì server lưu token đăng nhập và bản nháp của trẻ. Cùng domain qua Nginx thì để trống NEXT_PUBLIC_API_URL
# ở frontend và server không cần CORS, nhưng vẫn giữ whitelist này để chạy riêng hai domain không bị hở.
_cors_env = os.environ.get("CORS_ORIGINS", "").strip()
_cors_origins = [o.strip() for o in _cors_env.split(",") if o.strip()] or [
    "http://localhost:3016", "http://127.0.0.1:3016"]
app.add_middleware(CORSMiddleware, allow_origins=_cors_origins, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)  # đăng ký, đăng nhập, đồng bộ bộ thẻ (SQLite, xem auth.py)
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


async def _warm_up():
    async with _lock:
        tracing.begin("warm-up")
        try:
            await asyncio.to_thread(agent.warm_up)
        except Exception as e:  # không chặn server khi model chưa sẵn sàng
            print("warm-up lỗi: %s" % e)
        finally:
            tracing.end()


SESSION_TTL = int(os.environ.get("GROWSAFE_SESSION_TTL") or 45 * 60)
CLEANUP_EVERY = 300


def _purge_sessions(now: float) -> int:
    """Chạy trên event loop, không await giữa chừng, nên không đụng với các lượt đang xử lý."""
    removed = 0
    for store in (game.SESSIONS, ask.ASK_SESSIONS):
        for sid in [sid for sid, s in store.items() if now - s.get("touched", 0) > SESSION_TTL]:
            del store[sid]
            removed += 1
    return removed


async def _cleanup_loop():
    while True:
        await asyncio.sleep(CLEANUP_EVERY)
        try:
            removed = _purge_sessions(time.time())
            auth.prune_counters()
            await asyncio.to_thread(tts.prune_disk)
            if removed:
                print("đã dọn %d phiên quá %d phút" % (removed, SESSION_TTL // 60))
        except Exception as e:  # dọn lỗi thì thử lại lượt sau, không làm chết server
            print("dọn bộ nhớ lỗi: %s" % e)


@app.on_event("startup")
async def _startup():
    asyncio.create_task(_warm_up())
    asyncio.create_task(_cleanup_loop())


@app.get("/health")
def health():
    return {"ok": True, "model": "fake" if is_fake() else MODEL_NAME, "show_drafts": game.SHOW_DRAFTS}


@app.post("/api/chat", response_model=ChatOut)
async def chat(body: ChatIn, _user=Depends(auth.require_ai_user)):
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


class AskStartIn(BaseModel):
    age_group: str = "6-10"
    gender: str = "nam"
    session_id: str = ""


class AskMessageIn(BaseModel):
    ask_session_id: str
    text: str = ""


class AskEndIn(BaseModel):
    ask_session_id: str


async def _traced(name, fn, *args):
    """Chạy một lượt game trong trace, đổi GameError thành lỗi HTTP."""
    async with _lock:
        tracing.begin(name)
        try:
            res = fn(*args)
            if asyncio.iscoroutine(res):
                res = await res
        except (game.GameError, ask.AskError) as e:
            raise HTTPException(status_code=e.status, detail=str(e))
        finally:
            summary, _ = tracing.end()
    if isinstance(res, dict):
        res = {**res, "usage": {k: summary[k] for k in ("model_calls", "tool_calls", "tokens_in", "tokens_out")}}
    return res


@app.post("/api/session")
async def session_start(body: SessionIn, _user=Depends(auth.require_user)):
    return await _traced("api-session", game.start, body.age_group, body.gender,
                         [c.model_dump() for c in body.cleared], body.dialogue_mode, body.hour)


@app.post("/api/level")
async def session_level(body: LevelIn, _user=Depends(auth.require_ai_user)):
    """Trẻ chọn một địa điểm trên bản đồ / một app trên điện thoại: Đạo diễn mở màn tiếp theo ở đó."""
    return await _traced("api-level", game.open_level, body.session_id, body.location)


@app.post("/api/answer")
async def session_answer(body: AnswerIn, _user=Depends(auth.require_ai_user)):
    return await _traced("api-answer", game.answer, body.session_id, body.scenario_id, body.text)


@app.post("/api/hint")
async def session_hint(body: HintIn, _user=Depends(auth.require_ai_user)):
    """Nút "Gợi ý" (bóng đèn): một câu hỏi ngược, không đưa đáp án. Tối đa 1 gợi ý mỗi lượt."""
    return await _traced("api-hint", game.hint, body.session_id, body.scenario_id)


@app.post("/api/detective")
async def session_detective(body: AnswerIn, _user=Depends(auth.require_ai_user)):
    """Thám tử nhận chiêu sau màn hội thoại: trẻ kể lại người lạ đã dùng chiêu gì."""
    return await _traced("api-detective", game.detective, body.session_id, body.scenario_id, body.text)


@app.post("/api/help")
async def session_help(body: SessionRef):
    """Nút cần giúp: dừng phiên, trả nội dung hướng dẫn và số 111. Không gọi model, KHÔNG khoá auth."""
    return game.help_session(body.session_id)


@app.post("/api/session/end")
async def session_end(body: SessionRef, _user=Depends(auth.require_ai_user)):
    """Kết phiên: bản nháp cho phụ huynh / giáo viên, trạng thái cho_duyet. Không gửi đi đâu."""
    return await _traced("api-end", game.end, body.session_id)


@app.post("/api/ask/start")
async def ask_start(body: AskStartIn, _user=Depends(auth.require_user)):
    """Mở phiên Góc Tò Mò: trẻ hỏi, Tin giải đáp giáo dục giới tính đúng trần tuổi."""
    return await _traced("api-ask-start", ask.start, body.age_group, body.gender, body.session_id)


@app.post("/api/ask/message")
async def ask_message(body: AskMessageIn, _user=Depends(auth.require_ai_user)):
    """Trẻ gửi một câu hỏi trong Góc Tò Mò (qua precheck, phân loại chủ đề, trần tuổi, postcheck)."""
    return await _traced("api-ask-message", ask.message, body.ask_session_id, body.text)


@app.post("/api/ask/end")
async def ask_end(body: AskEndIn, _user=Depends(auth.require_user)):
    """Tạo bản nháp ngắn cho Góc phụ huynh sau phiên Góc Tò Mò (chỉ ghi chủ đề, không ghi nguyên văn câu trẻ hỏi)."""
    return ask.draft_standalone(body.ask_session_id) or {"draft_id": "", "note": ""}


@app.post("/api/tts")
async def speak(body: TTSIn, _user=Depends(auth.require_ai_user)):
    """Đọc to lời game vừa tạo ra (lời Tin, lời người lạ). Không đọc chữ trẻ gõ hay nói."""
    session = game.SESSIONS.get(body.session_id)
    in_game = bool(session and body.text.strip() in session["spoken"])
    in_ask = ask.has_spoken(body.session_id, body.text)
    if not (in_game or in_ask):
        raise HTTPException(status_code=403, detail="Chỉ đọc chữ của game trong phiên này")
    if body.role not in tts.roles():
        raise HTTPException(status_code=400, detail="Không có vai giọng này")
    try:
        audio = await asyncio.to_thread(tts.synthesize, body.text, body.role)
    except tts.TTSError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return Response(content=audio, media_type="audio/mpeg")


if __name__ == "__main__":
    import os
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT") or 6161))
