"use client";

import { create } from "zustand";
import { api, ApiError, OFFLINE_HELP } from "./api";
import { bg, card, kid, npc, owl, preload, ui } from "./assets";
import { sound } from "./sound";
import type { AgeGroup, AnswerResponse, Draft, Gender, HelpContent, Progress, RuleCard, Scenario } from "./types";

export type Phase = "setup" | "intro" | "play" | "reward" | "help" | "done";

interface Reward {
  rule: RuleCard;
  stars: number;
  correctAnswer: string;
  next: Scenario | null;
}

interface GameState {
  phase: Phase;
  age: AgeGroup;
  gender: Gender;
  sessionId: string;
  scenario: Scenario | null;
  progress: Progress;
  last: AnswerResponse | null;
  reward: Reward | null;
  cards: RuleCard[];
  help: HelpContent;
  draft: Draft | null;
  busy: boolean;
  error: string;
  muted: boolean;
  music: boolean;

  setAge: (a: AgeGroup) => void;
  setGender: (g: Gender) => void;
  start: () => Promise<void>;
  beginLevel: () => void;
  submit: (input: { choice_id?: string; text?: string }) => Promise<void>;
  retry: () => void;
  claimCard: () => void;
  nextLevel: () => void;
  openHelp: () => Promise<void>;
  loadDraft: () => Promise<void>;
  restart: () => void;
  toggleMute: () => void;
  toggleMusic: () => void;
  clearError: () => void;
}

function preloadScenario(s: Scenario | null | undefined, age: AgeGroup, gender: Gender) {
  if (!s) return;
  preload([bg(s.scene.bg), s.scene.npc ? npc(s.scene.npc) : "", card[s.scene.card].frame, card[s.scene.card].icon,
    kid(age, gender, "idle"), kid(age, gender, "confident"), kid(age, gender, "unsure")]);
}

const EMPTY_PROGRESS: Progress = { index: 0, total: 5, stars: 0 };

export const useGame = create<GameState>((set, get) => ({
  phase: "setup",
  age: "6-10",
  gender: "khong_noi",
  sessionId: "",
  scenario: null,
  progress: EMPTY_PROGRESS,
  last: null,
  reward: null,
  cards: [],
  help: OFFLINE_HELP,
  draft: null,
  busy: false,
  error: "",
  muted: false,
  music: true,

  setAge: (age) => set({ age }),
  setGender: (gender) => set({ gender }),

  async start() {
    const { age, gender, music } = get();
    set({ busy: true, error: "" });
    sound.music(music);
    try {
      const r = await api.start(age, gender);
      preloadScenario(r.scenario, age, gender);
      preload([owl("happy"), owl("encourage"), owl("curious"), owl("explain"), ui.illusDone, ui.starOn]);
      set({ sessionId: r.session_id, scenario: r.scenario, progress: r.progress, phase: "intro", busy: false,
        last: null, reward: null, cards: [], draft: null });
      sound.play("start");
    } catch (e) {
      set({ busy: false, error: (e as Error).message });
    }
  },

  beginLevel() {
    set({ phase: "play", last: null });
  },

  async submit(input) {
    const { sessionId, scenario, busy, age, gender } = get();
    if (!scenario || busy) return;
    set({ busy: true, error: "" });
    sound.play("send");
    try {
      const r = await api.answer(sessionId, scenario.id, input);
      if (r.stopped === "nghi_xam_hai_that") {
        sound.duck(true);
        sound.play("calm");
        set({ busy: false, phase: "help", help: r.help ?? OFFLINE_HELP, last: r });
        return;
      }
      sound.play(r.result === "dat" ? "correct" : r.result === "hoi_lai" ? "curious" : "encourage");
      const next: Partial<GameState> = { busy: false, last: r };
      if (r.progress) next.progress = r.progress;
      if (r.level_complete && r.rule_card) {
        next.reward = { rule: r.rule_card, stars: r.stars ?? 1, correctAnswer: r.correct_answer ?? "", next: r.next_scenario ?? null };
        preloadScenario(r.next_scenario, age, gender);
      }
      set(next);
    } catch (e) {
      const err = e as ApiError;
      set({ busy: false, error: err.message });
    }
  },

  retry() {
    sound.play("click");
    set({ last: null });
  },

  claimCard() {
    const { reward } = get();
    if (!reward) return;
    sound.play("card");
    set((s) => ({ phase: "reward", cards: [...s.cards, reward.rule] }));
  },

  nextLevel() {
    const { reward } = get();
    sound.play("click");
    if (reward?.next) {
      set({ scenario: reward.next, reward: null, last: null, phase: "intro" });
    } else {
      set({ phase: "done", reward: null });
      sound.play("complete");
      void get().loadDraft();
    }
  },

  async openHelp() {
    const { sessionId } = get();
    sound.duck(true);
    sound.play("calm");
    set({ phase: "help", busy: false });
    if (!sessionId) return;
    try {
      const help = await api.help(sessionId);
      set({ help });
    } catch {
      set({ help: OFFLINE_HELP });
    }
  },

  async loadDraft() {
    const { sessionId, draft } = get();
    if (!sessionId || draft) return;
    try {
      set({ draft: await api.end(sessionId) });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  restart() {
    sound.duck(false);
    sound.play("click");
    set({ phase: "setup", sessionId: "", scenario: null, progress: EMPTY_PROGRESS, last: null, reward: null,
      cards: [], draft: null, error: "", busy: false, help: OFFLINE_HELP });
  },

  toggleMute() {
    const muted = !get().muted;
    sound.mute(muted);
    set({ muted });
  },

  toggleMusic() {
    const music = !get().music;
    sound.music(music);
    sound.play("toggle");
    set({ music });
  },

  clearError: () => set({ error: "" }),
}));
