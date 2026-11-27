"use client";

/**
 * Hồ sơ, cài đặt và tiến độ chỉ lưu trên máy này (localStorage), không gửi lên server, không gắn tên hay tài khoản.
 * Chỉ lưu: nhóm tuổi, giới tính (để chọn nhân vật chính),
 * mã màn đã xong, mã thẻ đã nhận, vai người lớn trong "Bàn tay tin cậy" (không lưu tên thật).
 */
import type { AgeGroup, Gender, RuleCard, TacticCard } from "./types";

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
  } catch {}
}

/** Vai người lớn cho "Bàn tay tin cậy": chỉ chọn vai, không lưu tên thật. */
export const TRUSTED_ROLES = ["Mẹ", "Bố", "Bà", "Ông", "Cô chủ nhiệm", "Bác bảo vệ", "Cô y tế", "Anh chị lớn", "Cô chú trong nhà"];

/** Tin lớn thêm một nấc sau mỗi 2 thẻ (de-xuat-tinh-nang.md mục 1). */
export const owlStage = (cards: number) => Math.min(4, 1 + Math.floor(cards / 2)) as 1 | 2 | 3 | 4;
