import type { AgeGroup, AnswerResponse, Draft, Gender, HelpContent, SessionResponse } from "./types";

const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:6161").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public status = 0) {
    super(message);
  }
}

async function post<T>(path: string, body: unknown, timeoutMs = 60000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      let detail = "";
      try {
        detail = (await res.json()).detail;
      } catch {}
      throw new ApiError(typeof detail === "string" && detail ? detail : "Máy chủ đang bận", res.status);
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("Không kết nối được máy chủ game");
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  start: (age_group: AgeGroup, gender: Gender) =>
    post<SessionResponse>("/api/session", { age_group, gender, dialogue_mode: "kich_ban" }),
  answer: (session_id: string, scenario_id: string, input: { choice_id?: string; text?: string }) =>
    post<AnswerResponse>("/api/answer", { session_id, scenario_id, ...input }),
  help: (session_id: string) => post<HelpContent>("/api/help", { session_id }, 8000),
  end: (session_id: string) => post<Draft>("/api/session/end", { session_id }),
};

/** Nội dung màn "Con cần giúp" khi mất mạng: nút này phải luôn chạy được. */
export const OFFLINE_HELP: HelpContent = {
  title: "Mình tạm dừng trò chơi nhé",
  message:
    "Điều con cảm thấy rất quan trọng, và con không có lỗi gì cả. Con hãy kể ngay cho bố mẹ, cô giáo hoặc một người lớn con tin tưởng.",
  hotline: "111",
  hotline_name: "Tổng đài quốc gia bảo vệ trẻ em",
  steps: [
    "Con không có lỗi gì cả.",
    "Con kể ngay với bố mẹ, cô giáo hoặc một người lớn con tin tưởng.",
    "Con hoặc người lớn gọi 111. Gọi miễn phí, cả ngày lẫn đêm.",
  ],
};
