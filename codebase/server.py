"""API cho giao diện game. Chạy từ thư mục gốc repo:

    python -m uvicorn server:app --app-dir codebase --reload --port 6161

Hoặc: python codebase/server.py   (port lấy từ biến PORT, mặc định 6161)
Rồi mở http://127.0.0.1:6161/docs để thử.
Trace dùng biến toàn cục nên server xử lý tuần tự từng lượt (đủ cho demo, chưa dùng cho nhiều người cùng lúc).
"""
import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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


@app.get("/api/drafts")
def drafts():
    """Bản nháp gửi phụ huynh / giáo viên đang chờ duyệt. Không có endpoint nào tự gửi đi."""
    return DRAFTS


if __name__ == "__main__":
    import os
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT") or 6161))
