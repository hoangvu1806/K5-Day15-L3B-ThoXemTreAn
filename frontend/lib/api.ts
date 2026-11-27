import type { AgeProgress } from "./local";
import type {
  AgeGroup, AnswerResponse, DetectiveResponse, Draft, Gender, HelpContent, HintResponse, LevelResponse, SessionResponse,
} from "./types";

export interface AccountResponse {
  username: string;
  token?: string;
  progress: Record<AgeGroup, AgeProgress>;
}

export const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:6161").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public status = 0) {
    super(message);
  }
}

async function post<T>(path: string, body: unknown, timeoutMs = 60000): Promise<T> {
  return send<T>("POST", path, body, timeoutMs);
}

async function send<T>(method: string, path: string, body: unknown, timeoutMs = 60000, token = ""): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  try {
    const res = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
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
  start: (age_group: AgeGroup, gender: Gender, cleared: { id: string; passed: boolean }[]) =>
    post<SessionResponse>("/api/session", { age_group, gender, cleared, dialogue_mode: "kich_ban", hour: new Date().getHours() }),
  level: (session_id: string, location: string) => post<LevelResponse>("/api/level", { session_id, location }),
  answer: (session_id: string, scenario_id: string, text: string) =>
    post<AnswerResponse>("/api/answer", { session_id, scenario_id, text }),
  hint: (session_id: string, scenario_id: string) => post<HintResponse>("/api/hint", { session_id, scenario_id }, 30000),
  detective: (session_id: string, scenario_id: string, text: string) =>
    post<DetectiveResponse>("/api/detective", { session_id, scenario_id, text }),
  help: (session_id: string) => post<HelpContent>("/api/help", { session_id }, 8000),
  end: (session_id: string) => post<Draft>("/api/session/end", { session_id }),
  /* Tài khoản (codebase/auth.py). progress là bản gọn từ compactProgress(). */
  register: (username: string, password: string, consent: boolean, progress: unknown) =>
    post<AccountResponse>("/api/auth/register", { username, password, consent, progress }, 15000),
  login: (username: string, password: string, progress: unknown) =>
    post<AccountResponse>("/api/auth/login", { username, password, progress }, 15000),
  logout: (token: string) => send<{ ok: boolean }>("POST", "/api/auth/logout", {}, 8000, token),
  me: (token: string) => send<AccountResponse>("GET", "/api/auth/me", undefined, 8000, token),
  sync: (token: string, progress: unknown) => send<AccountResponse>("PUT", "/api/progress", { progress }, 15000, token),
  /** Đọc to lời game vừa tạo ra. Server chỉ đọc chữ của game trong phiên, trả mp3. */
  async tts(session_id: string, text: string, role: string, timeoutMs = 4000): Promise<Blob> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(BASE + "/api/tts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id, text, role }), signal: ctrl.signal,
      });
      if (!res.ok) throw new ApiError("tts", res.status);
      return await res.blob();
    } finally {
      clearTimeout(timer);
    }
  },
};

/** Nội dung màn cần giúp khi mất mạng: nút này phải luôn chạy được. Viết riêng cho từng nhóm tuổi. */
export const OFFLINE_HELP: Record<AgeGroup, HelpContent> = {
  "6-10": {
    title: "Tớ ở đây với cậu",
    button: "Con cần giúp",
    message: "Tớ đây, có tớ rồi. Mình dừng chơi một chút nhé. Cái gì làm cậu sợ hay khó chịu thì kể ngay cho mẹ, bố, hay cô giáo nghe. Số 111 cũng gọi được, miễn phí.",
    voice: "safe_helpbtn_610",
    hotline: "111",
    hotline_name: "Tổng đài quốc gia bảo vệ trẻ em",
    steps: ["Cậu không có lỗi gì cả.", "Cậu kể ngay với mẹ, bố hoặc cô giáo.", "Cậu hoặc người lớn gọi 111. Miễn phí, cả ngày lẫn đêm."],
  },
  "11-15": {
    title: "Mình dừng game một chút",
    button: "Mình cần giúp",
    message: "Mình ở đây. Game dừng lại xíu nhé. Có chuyện gì đang làm bạn lo thì kể cho người lớn bạn tin, hoặc gọi số 111, miễn phí, lúc nào cũng gọi được. Không cần tự ôm một mình đâu.",
    voice: "safe_helpbtn_1115",
    hotline: "111",
    hotline_name: "Tổng đài quốc gia bảo vệ trẻ em",
    steps: ["Bạn không có lỗi gì cả.", "Kể với bố mẹ, thầy cô hoặc người lớn bạn tin.", "Bạn hoặc người lớn gọi 111. Miễn phí, cả ngày lẫn đêm."],
  },
};
