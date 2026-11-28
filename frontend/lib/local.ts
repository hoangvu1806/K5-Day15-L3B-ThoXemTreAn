"use client";

/**
 * Hồ sơ, cài đặt và tiến độ lưu trên máy này (localStorage).
 * Chỉ lưu: nhóm tuổi, giới tính (để chọn nhân vật chính),
 * mã màn đã xong, mã thẻ đã nhận, vai người lớn trong "Bàn tay tin cậy" (không lưu tên thật).
 * Nếu người lớn đăng nhập, tiến độ (không gồm hồ sơ, giới tính, cài đặt) được đồng bộ lên tài khoản.
 */
import type { AgeGroup, Draft, Gender, RuleCard, TacticCard } from "./types";

const KEY = "growsafe.v3";

export type Speed = "slow" | "normal" | "fast";
export type FontSize = "md" | "lg" | "xl";

export interface Settings {
  music: number;
  sfx: number;
  voice: number;
  speed: Speed;
  font: FontSize;
  autoRead: boolean;
  reducedMotion: boolean;
}

export interface Profile {
  age: AgeGroup;
  gender: Gender;
}

export interface AgeProgress {
  cleared: Record<string, boolean>;
  rules: Record<string, RuleCard>;
  tactics: Record<string, TacticCard>;
  hand: string[];
}

export interface Saved {
  profile: Profile | null;
  settings: Settings;
  progress: Record<AgeGroup, AgeProgress>;
  visits: number;
}

export const DEFAULT_SETTINGS: Settings = {
  music: 0.5, sfx: 0.8, voice: 1, speed: "normal", font: "md", autoRead: true, reducedMotion: false,
};

const emptyProgress = (): AgeProgress => ({ cleared: {}, rules: {}, tactics: {}, hand: ["", "", "", "", ""] });

export const EMPTY: Saved = {
  profile: null,
  settings: DEFAULT_SETTINGS,
  progress: { "6-10": emptyProgress(), "11-15": emptyProgress() },
  visits: 0,
};

export function load(): Saved {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return structuredClone(EMPTY);
    const data = JSON.parse(raw) as Partial<Saved>;
    return {
      profile: data.profile ?? null,
      settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
      progress: {
        "6-10": { ...emptyProgress(), ...(data.progress?.["6-10"] ?? {}) },
        "11-15": { ...emptyProgress(), ...(data.progress?.["11-15"] ?? {}) },
      },
      visits: data.visits ?? 0,
    };
  } catch {
    return structuredClone(EMPTY);
  }
}

export function save(data: Saved) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export function wipe() {
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(REPORTS_KEY);
  } catch {}
}

/* ---------- Lịch sử báo cáo cho Góc phụ huynh: chỉ nằm trên máy này, tách theo tài khoản ---------- */

const REPORTS_KEY = "growsafe.reports";
const MAX_REPORTS = 30; // mỗi tài khoản, bỏ bản cũ nhất

export interface Report extends Draft {
  id: string;
  kind: "game" | "ask";
  saved_at: number;
  age: AgeGroup;
}

function allReports(): Record<string, Report[]> {
  try {
    const data = JSON.parse(window.localStorage.getItem(REPORTS_KEY) || "{}");
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

/** Mới nhất đứng đầu. */
export function loadReports(owner: string): Report[] {
  const list = allReports()[owner];
  return Array.isArray(list) ? list.filter((r) => r?.id && r.note) : [];
}

/** Cùng id thì thay bản cũ (đóng Góc Tò Mò nhiều lần trong một phiên hỏi chỉ giữ một báo cáo). */
export function saveReport(owner: string, report: Report) {
  const all = allReports();
  all[owner] = [report, ...loadReports(owner).filter((r) => r.id !== report.id)].slice(0, MAX_REPORTS);
  try {
    window.localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
  } catch {}
}

/* ---------- Tài khoản (tuỳ chọn): chỉ để lưu bộ thẻ lên server, xem codebase/auth.py ---------- */

const AUTH_KEY = "growsafe.auth";

export interface Account {
  username: string;
  token: string;
}

export function loadAccount(): Account | null {
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    const a = raw ? (JSON.parse(raw) as Partial<Account>) : null;
    return a?.username && a.token ? { username: a.username, token: a.token } : null;
  } catch {
    return null;
  }
}

export function saveAccount(a: Account | null) {
  try {
    if (a) window.localStorage.setItem(AUTH_KEY, JSON.stringify(a));
    else window.localStorage.removeItem(AUTH_KEY);
  } catch {}
}

/** Bản gọn gửi lên server: chỉ mã màn, mã thẻ, vai. Server tự dựng lại nội dung thẻ. */
export function compactProgress(progress: Record<AgeGroup, AgeProgress>) {
  const out: Record<string, unknown> = {};
  for (const [age, p] of Object.entries(progress)) {
    out[age] = {
      cleared: p.cleared,
      rules: Object.fromEntries(Object.keys(p.rules).map((k) => [k, true])),
      tactics: Object.fromEntries(Object.keys(p.tactics).map((k) => [k, true])),
      hand: p.hand,
    };
  }
  return out;
}

/**
 * Gộp tiến độ từ tài khoản vào máy: thẻ và màn đã qua chỉ cộng thêm (không mất thẻ vừa nhận lúc đang đồng bộ).
 * "Bàn tay tin cậy" giữ bản trên máy, trừ khi máy chưa chọn ô nào.
 */
export function mergeProgress(local: Record<AgeGroup, AgeProgress>, server: Record<AgeGroup, AgeProgress>) {
  const out = structuredClone(local);
  for (const age of Object.keys(out) as AgeGroup[]) {
    const s = server?.[age];
    if (!s) continue;
    const p = out[age];
    for (const [id, passed] of Object.entries(s.cleared ?? {})) p.cleared[id] = (p.cleared[id] ?? false) || passed;
    p.rules = { ...(s.rules ?? {}), ...p.rules };
    p.tactics = { ...(s.tactics ?? {}), ...p.tactics };
    if (!p.hand.some(Boolean) && s.hand?.some(Boolean)) p.hand = [...s.hand];
  }
  return out;
}

/** Vai người lớn cho "Bàn tay tin cậy": chỉ chọn vai, không lưu tên thật. Giữ khớp TRUSTED_ROLES trong codebase/auth.py. */
export const TRUSTED_ROLES = ["Mẹ", "Bố", "Bà", "Ông", "Cô chủ nhiệm", "Bác bảo vệ", "Cô y tế", "Anh chị lớn", "Cô chú trong nhà"];

/** Tin lớn thêm một nấc sau mỗi 2 thẻ (de-xuat-tinh-nang.md mục 1). */
export const owlStage = (cards: number) => Math.min(4, 1 + Math.floor(cards / 2)) as 1 | 2 | 3 | 4;
