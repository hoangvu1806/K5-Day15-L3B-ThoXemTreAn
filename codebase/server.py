"""API cho giao diện game. Chạy từ thư mục gốc repo:

    python -m uvicorn server:app --app-dir codebase --reload --port 6161

Hoặc: python codebase/server.py   (port lấy từ biến PORT, mặc định 6161)
Rồi mở http://127.0.0.1:6161/docs để thử.
Trace dùng biến toàn cục nên server xử lý tuần tự từng lượt (đủ cho demo, chưa dùng cho nhiều người cùng lúc).
"""
import asyncio

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import game
import tracing
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
    return {"ok": True, "model": "fake" if is_fake() else MODEL_NAME}


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


class SessionIn(BaseModel):
    age_group: str
    gender: str = ""                 # nam / nu / khong_noi, không bắt buộc
    dialogue_mode: str = "kich_ban"  # kich_ban (mặc định) hoặc ai_dong_vai (người lớn bật)


class AnswerIn(BaseModel):
    session_id: str
    scenario_id: str
    choice_id: str = ""
    text: str = ""


class SessionRef(BaseModel):
    session_id: str = ""


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
    return await _traced("api-session", game.start, body.age_group, body.gender, body.dialogue_mode)


@app.post("/api/answer")
async def session_answer(body: AnswerIn):
    return await _traced("api-answer", game.answer, body.session_id, body.scenario_id, body.choice_id, body.text)


@app.post("/api/help")
async def session_help(body: SessionRef):
    """Nút "Con cần giúp": dừng phiên, trả nội dung hướng dẫn và số 111. Không gọi model."""
    return game.help_session(body.session_id)


@app.post("/api/session/end")
async def session_end(body: SessionRef):
    """Kết phiên: bản nháp cho phụ huynh / giáo viên, trạng thái cho_duyet. Không gửi đi đâu."""
    return await _traced("api-end", game.end, body.session_id)


@app.get("/api/drafts")
def drafts():
    """Bản nháp gửi phụ huynh / giáo viên đang chờ duyệt. Không có endpoint nào tự gửi đi."""
    return DRAFTS


if __name__ == "__main__":
    import os
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT") or 6161))
