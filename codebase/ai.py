"""Nối model — chỗ DUY NHẤT trong bản chạy thử gọi model AI.

Hợp đồng (giữ nguyên để khung đo được token):
    call_model(system: str, user: str) -> dict với 4 khoá
        "text":       str   chữ model trả về
        "model":      str   tên model đã gọi (để tra giá ở bảng giá model)
        "tokens_in":  int   số token vào, lấy từ trường usage trong phản hồi API — KHÔNG ước lượng
        "tokens_out": int   số token ra, gồm cả token suy luận / suy nghĩ nếu API tính riêng
    @model_call (từ tracing.py) tự ghi mỗi lần gọi vào trace.

GrowSafe gọi model theo hai đường, cả hai đều đi qua @model_call:
    1. Agent ADK (agent.py) gọi model qua adk_model() → LiteLlm → OpenRouter.
       Sau mỗi lần model trả lời, callback trong agent.py gọi record_adk_call() để ghi token vào trace.
    2. call_model() gọi thẳng LiteLLM, dùng cho bước phụ (vd hậu kiểm) và cho chế độ giả.

Chế độ giả (MODEL_PROVIDER để trống hoặc =fake): trả câu giả, token 0, không cần cài thư viện nào.
Không dán API key vào file này — điền ở .env.
"""
import os

from tracing import model_call

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_env(path=os.path.join(ROOT, ".env")):
    """Đọc file .env (KEY=VALUE mỗi dòng) vào biến môi trường, không ghi đè biến đã có. Khung — không cần sửa."""
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env()
MODEL_PROVIDER = (os.environ.get("MODEL_PROVIDER") or "fake").strip().lower()
MODEL_NAME = (os.environ.get("MODEL_NAME") or "").strip()
API_KEY = (os.environ.get("API_KEY") or "").strip()
TEMPERATURE = float(os.environ.get("MODEL_TEMPERATURE") or 0.3)
MODEL_TIMEOUT = float(os.environ.get("MODEL_TIMEOUT") or 20)  # giây cho mỗi lần gọi model


def is_fake() -> bool:
    return MODEL_PROVIDER in ("", "fake")


def litellm_model_id() -> str:
    """Mã model theo cách LiteLLM hiểu. OpenRouter cần tiền tố openrouter/ (vd openrouter/<hãng>/<model>)."""
    if not MODEL_NAME:
        raise RuntimeError("Chưa điền MODEL_NAME trong .env")
    if MODEL_PROVIDER == "openrouter" and not MODEL_NAME.startswith("openrouter/"):
        return "openrouter/" + MODEL_NAME
    return MODEL_NAME


def adk_model():
    """Model cho agent ADK: bọc LiteLLM để gọi OpenRouter."""
    from google.adk.models.lite_llm import LiteLlm
    if not API_KEY:
        raise RuntimeError("Chưa điền API_KEY trong .env")
    return LiteLlm(model=litellm_model_id(), api_key=API_KEY, temperature=TEMPERATURE, timeout=MODEL_TIMEOUT)


@model_call
def record_adk_call(model: str, text: str, tokens_in: int, tokens_out: int) -> dict:
    """Ghi một lần gọi model do ADK thực hiện vào trace. Token lấy từ usage_metadata của phản hồi."""
    return {"text": text, "model": model, "tokens_in": int(tokens_in or 0), "tokens_out": int(tokens_out or 0)}


@model_call
def call_model(system: str, user: str) -> dict:
    if is_fake():
        last = (user.strip().splitlines() or [""])[-1]
        return {"text": "[câu trả lời giả — chưa nối model] " + last[:60], "model": "fake", "tokens_in": 0, "tokens_out": 0}

    import litellm
    resp = litellm.completion(
        model=litellm_model_id(),
        api_key=API_KEY,
        temperature=TEMPERATURE,
        timeout=MODEL_TIMEOUT,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
    )
    usage = resp.usage  # completion_tokens của OpenRouter đã gồm token suy luận
    return {
        "text": resp.choices[0].message.content or "",
        "model": resp.model or MODEL_NAME,
        "tokens_in": int(usage.prompt_tokens or 0),
        "tokens_out": int(usage.completion_tokens or 0),
    }
