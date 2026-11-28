"""API cho giao diện game. Chạy từ thư mục gốc repo:

    python -m uvicorn server:app --app-dir codebase --reload --port 6161

Hoặc: python codebase/server.py   (port lấy từ biến PORT, mặc định 6161)
Rồi mở http://127.0.0.1:6161/docs để thử.
Các lượt chạy song song: mỗi request một lượt trace riêng (prod_trace.py), chỉ các request cùng một phiên mới xếp
hàng (store.py). Chạy nhiều worker / replica thì phải đặt REDIS_URL, và DATABASE_URL cho tài khoản.
Bật GROWSAFE_SHOW_DRAFT_SCENES=1 để nhóm chơi thử các màn chưa duyệt (duyet = false trong data/scenarios.json).
"""
import asyncio
import os
from concurrent.futures import ThreadPoolExecutor

import anyio
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

import agent
import ask
import auth
import game
import prod_trace
import store
import tracing
import tts
from agent import answer_async
from ai import MODEL_NAME, is_fake

prod_trace.install()
# Số luồng mỗi tiến trình cho phần gọi model / Redis chạy ngoài event loop
THREADS = int(os.environ.get("GROWSAFE_THREADS") or 64)

app = FastAPI(title="GrowSafe AI")
# CORS_ORIGINS: danh sách domain cách nhau bằng dấu phẩy. Không đặt (hoặc để trống) thì chỉ cho localhost dev,
# KHÔNG mở "*" vì server lưu token đăng nhập và bản nháp của trẻ. Cùng domain qua Nginx thì để trống NEXT_PUBLIC_API_URL
# ở frontend và server không cần CORS, nhưng vẫn giữ whitelist này để chạy riêng hai domain không bị hở.
_cors_env = os.environ.get("CORS_ORIGINS", "").strip()
_cors_origins = [o.strip() for o in _cors_env.split(",") if o.strip()] or [
    "http://localhost:3016", "http://127.0.0.1:3016"]
app.add_middleware(CORSMiddleware, allow_origins=_cors_origins, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)  # đăng ký, đăng nhập, đồng bộ bộ thẻ (SQLite, xem auth.py)


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
    tracing.begin("warm-up")
    try:
        await asyncio.to_thread(agent.warm_up)
    except Exception as e:  # không chặn server khi model chưa sẵn sàng
        print("warm-up lỗi: %s" % e)
    finally:
        tracing.end()


async def _cleanup_loop():
    while True:
        await asyncio.sleep(300)
        try:
            store.backend.prune()
            await asyncio.to_thread(tts.prune_disk)
        except Exception as e:  # dọn lỗi thì thử lại lượt sau, không làm chết server
            print("dọn bộ nhớ lỗi: %s" % e)


@app.on_event("startup")
async def _startup():
    anyio.to_thread.current_default_thread_limiter().total_tokens = THREADS  # endpoint và dependency kiểu def
    asyncio.get_running_loop().set_default_executor(ThreadPoolExecutor(max_workers=THREADS))
    app.state.tasks = [asyncio.create_task(_warm_up()), asyncio.create_task(_cleanup_loop())]


@app.get("/health")
def health():
    return {"ok": True, "model": "fake" if is_fake() else MODEL_NAME, "show_drafts": game.SHOW_DRAFTS}


@app.post("/api/chat", response_model=ChatOut)
async def chat(body: ChatIn, _user=Depends(auth.require_ai_user)):
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


async def _traced(name, user, sessions, fn, *args):
    """Chạy một lượt game: khoá các phiên liên quan, ghi trace, đổi lỗi thành lỗi HTTP.
    Hàm đồng bộ (có thể gọi model) chạy trong luồng riêng để không chặn event loop."""
    store.owner.set(str(user[0]))
    tracing.begin(name)
    try:
        async with store.unit(*sessions):
            if asyncio.iscoroutinefunction(fn):
                res = await fn(*args)
            else:
                res = await asyncio.to_thread(fn, *args)
    except (game.GameError, ask.AskError) as e:
        raise HTTPException(status_code=e.status, detail=str(e))
    except store.Busy:
        raise HTTPException(status_code=409, detail="Lượt trước chưa xong, đợi một chút rồi thử lại nhé")
    finally:
        summary, _ = tracing.end()
    if isinstance(res, dict):
        res = {**res, "usage": {k: summary[k] for k in ("model_calls", "tool_calls", "tokens_in", "tokens_out")}}
    return res


def _game(session_id):
    return [(game.SESSIONS, session_id)]


@app.post("/api/session")
async def session_start(body: SessionIn, user=Depends(auth.require_user)):
    return await _traced("api-session", user, [], game.start, body.age_group, body.gender,
                         [c.model_dump() for c in body.cleared], body.dialogue_mode, body.hour)


@app.post("/api/level")
async def session_level(body: LevelIn, user=Depends(auth.require_ai_user)):
    """Trẻ chọn một địa điểm trên bản đồ / một app trên điện thoại: Đạo diễn mở màn tiếp theo ở đó."""
    return await _traced("api-level", user, _game(body.session_id), game.open_level, body.session_id, body.location)


@app.post("/api/answer")
async def session_answer(body: AnswerIn, user=Depends(auth.require_ai_user)):
    return await _traced("api-answer", user, _game(body.session_id), game.answer, body.session_id,
                         body.scenario_id, body.text)


@app.post("/api/hint")
async def session_hint(body: HintIn, user=Depends(auth.require_ai_user)):
    """Nút "Gợi ý" (bóng đèn): một câu hỏi ngược, không đưa đáp án. Tối đa 1 gợi ý mỗi lượt."""
    return await _traced("api-hint", user, _game(body.session_id), game.hint, body.session_id, body.scenario_id)


@app.post("/api/detective")
async def session_detective(body: AnswerIn, user=Depends(auth.require_ai_user)):
    """Thám tử nhận chiêu sau màn hội thoại: trẻ kể lại người lạ đã dùng chiêu gì."""
    return await _traced("api-detective", user, _game(body.session_id), game.detective, body.session_id,
                         body.scenario_id, body.text)


@app.post("/api/help")
async def session_help(body: SessionRef):
    """Nút cần giúp: dừng phiên, trả nội dung hướng dẫn và số 111. Không gọi model, KHÔNG khoá auth.
    Kho phiên chậm hoặc mọi luồng đang bận thì vẫn trả nội dung 111 sau tối đa 2 giây."""
    try:
        return await asyncio.wait_for(asyncio.to_thread(game.help_session, body.session_id), 2)
    except asyncio.TimeoutError:
        return game.help_content()


@app.post("/api/session/end")
async def session_end(body: SessionRef, user=Depends(auth.require_ai_user)):
    """Kết phiên: bản nháp cho phụ huynh / giáo viên, trạng thái cho_duyet. Không gửi đi đâu."""
    return await _traced("api-end", user, _game(body.session_id), game.end, body.session_id)


@app.post("/api/ask/start")
async def ask_start(body: AskStartIn, user=Depends(auth.require_user)):
    """Mở phiên Góc Tò Mò: trẻ hỏi, Tin giải đáp giáo dục giới tính đúng trần tuổi."""
    return await _traced("api-ask-start", user, [], ask.start, body.age_group, body.gender, body.session_id)


@app.post("/api/ask/message")
async def ask_message(body: AskMessageIn, user=Depends(auth.require_ai_user)):
    """Trẻ gửi một câu hỏi trong Góc Tò Mò (qua precheck, phân loại chủ đề, trần tuổi, postcheck)."""
    return await _traced("api-ask-message", user, [(ask.ASK_SESSIONS, body.ask_session_id)], ask.message,
                         body.ask_session_id, body.text)


def _ask_draft(ask_session_id):
    return ask.draft_standalone(ask_session_id) or {"draft_id": "", "note": ""}


@app.post("/api/ask/end")
async def ask_end(body: AskEndIn, user=Depends(auth.require_user)):
    """Tạo bản nháp ngắn cho Góc phụ huynh sau phiên Góc Tò Mò (chỉ ghi chủ đề, không ghi nguyên văn câu trẻ hỏi)."""
    return await _traced("api-ask-end", user, [(ask.ASK_SESSIONS, body.ask_session_id)], _ask_draft,
                         body.ask_session_id)


@app.post("/api/tts")
def speak(body: TTSIn, _user=Depends(auth.require_ai_user)):
    """Đọc to lời game vừa tạo ra (lời Tin, lời người lạ). Không đọc chữ trẻ gõ hay nói."""
    session = game.SESSIONS.get(body.session_id)
    in_game = bool(session and body.text.strip() in session["spoken"])
    in_ask = ask.has_spoken(body.session_id, body.text)
    if not (in_game or in_ask):
        raise HTTPException(status_code=403, detail="Chỉ đọc chữ của game trong phiên này")
    if body.role not in tts.roles():
        raise HTTPException(status_code=400, detail="Không có vai giọng này")
    try:
        audio = tts.synthesize(body.text, body.role)
    except tts.TTSError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return Response(content=audio, media_type="audio/mpeg")


if __name__ == "__main__":
    import os
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT") or 6161))
