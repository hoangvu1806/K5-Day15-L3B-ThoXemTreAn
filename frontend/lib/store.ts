"use client";

import { create } from "zustand";
import { api, ApiError, OFFLINE_HELP } from "./api";
import { bg, card, kid, npc, owl, preload, ui } from "./assets";
import { progressLine, waitLine } from "./lines";
import { DEFAULT_SETTINGS, EMPTY, load, owlStage, save, wipe, type Profile, type Saved, type Settings } from "./local";
import { sound } from "./sound";
import type {
  AgeGroup, AnswerResponse, ChatMsg, DetectiveResponse, DialogueTurn, Draft, HelpContent, Line, MapPlace, Progress,
  RuleCard, Scenario,
} from "./types";
import { voice, tinRole, type Clip } from "./voice";

export type Phase = "profile" | "home" | "map" | "intro" | "play" | "detective" | "reward" | "help" | "done" | "notebook" | "hand";
export type Overlay = "" | "settings" | "pause" | "parent" | "confirmHome";
export type LockPurpose = "parent" | "profile" | "wipe";

interface Reward {
  cards: RuleCard[];
  newRule: RuleCard | null;
  stars: number;
  correctAnswer: string;
  cardLine: Line | null;
  stageUp: boolean;
  sessionDone: boolean;
}

interface DetectiveState {
  question: string;
  result: DetectiveResponse | null;
}

interface GameState {
  hydrated: boolean;
  saved: Saved;
  phase: Phase;
  overlay: Overlay;
  lock: LockPurpose | null;
  lockThen: (() => void) | null;
  sessionId: string;
  name: string;
  map: MapPlace[];
  suggest: string;
  mapLine: Line | null;
  showDrafts: boolean;
  progress: Progress;
  scenario: Scenario | null;
  place: Line | null;
  chat: ChatMsg[];
  dialogue: DialogueTurn | null;
  last: AnswerResponse | null;
  hint: string;
  reward: Reward | null;
  detective: DetectiveState | null;
  help: HelpContent;
  draft: Draft | null;
  busy: boolean;
  waiting: Line | null;
  error: string;
  online: boolean;
  speaking: boolean;
  muted: boolean;

  hydrate: () => void;
  setProfile: (p: Profile) => void;
  updateSettings: (s: Partial<Settings>) => void;
  setOverlay: (o: Overlay) => void;
  requestLock: (purpose: LockPurpose, then: () => void) => void;
  unlock: () => void;
  cancelLock: () => void;
  goHome: () => void;
  playOn: () => Promise<void>;
  openMap: () => void;
  openLocation: (loc: string) => Promise<void>;
  beginLevel: () => void;
  submit: (text: string) => Promise<void>;
  askHint: () => Promise<void>;
  retry: () => void;
  toDetectiveOrReward: () => void;
  submitDetective: (text: string) => Promise<void>;
  toReward: () => void;
  nextFromReward: () => void;
  endSession: () => Promise<void>;
  openHelp: () => Promise<void>;
  openNotebook: () => void;
  openHand: () => void;
  setHand: (i: number, role: string) => void;
  wipeProgress: () => void;
  replay: (what: "story" | "feedback" | "hint") => void;
  say: (clips: Clip[]) => void;
  toggleMute: () => void;
  setOnline: (on: boolean) => void;
  clearError: () => void;
}

const EMPTY_PROGRESS: Progress = { index: 0, total: 5, stars: 0 };

function persist(get: () => GameState, set: (p: Partial<GameState>) => void, mut: (s: Saved) => void) {
  const saved = structuredClone(get().saved);
  mut(saved);
  save(saved);
  set({ saved });
}

function applyLevels(s: Settings) {
  sound.setLevels({ music: s.music, sfx: s.sfx });
  voice.setLevels({ volume: s.voice, speed: s.speed });
}

function ageOf(get: () => GameState): AgeGroup {
  return get().saved.profile?.age ?? "6-10";
}

function cardCount(saved: Saved, age: AgeGroup) {
  const p = saved.progress[age];
  return Object.keys(p.rules).length + Object.keys(p.tactics).length;
}

function preloadScenario(s: Scenario | null | undefined, profile: Profile | null) {
  if (!s || !profile) return;
  preload([bg(s.scene.bg), s.scene.npc ? npc(s.scene.npc) : "", card[s.scene.card].frame, card[s.scene.card].icon,
    kid(profile.age, profile.gender, "idle"), kid(profile.age, profile.gender, "confident"), kid(profile.age, profile.gender, "unsure")]);
}

function storyClips(s: Scenario, age: AgeGroup): Clip[] {
  if (s.voice.tell) return [{ file: s.voice.tell }, { pause: 300 }, { file: s.voice.ask ?? "" }];
  return [{ tts: s.situation + " " + s.question, role: tinRole(age) }];
}

function feedbackClips(r: AnswerResponse, age: AgeGroup): Clip[] {
  const v = r.voice ?? {};
  const head: Clip[] = v.line ? [{ file: v.line }] : [];
  const pieces: Clip[] = (v.pieces ?? []).map((file) => ({ file }));
  if (r.stopped) return head.length ? head : [{ tts: r.feedback, role: tinRole(age, true) }];
  if (v.tts && r.feedback) {
    // Câu khen / động viên phát ngay, rồi đọc đoạn Tin vừa viết (TTS). TTS lỗi thì lùi về giọng trình duyệt.
    return [...head, { tts: r.feedback, role: tinRole(age) }];
  }
  return [...head, ...pieces];
}

export const useGame = create<GameState>((set, get) => ({
  hydrated: false,
  saved: EMPTY,
  phase: "profile",
  overlay: "",
  lock: null,
  lockThen: null,
  sessionId: "",
  name: "",
  map: [],
  suggest: "",
  mapLine: null,
  showDrafts: false,
  progress: EMPTY_PROGRESS,
  scenario: null,
  place: null,
  chat: [],
  dialogue: null,
  last: null,
  hint: "",
  reward: null,
  detective: null,
  help: OFFLINE_HELP["6-10"],
  draft: null,
  busy: false,
  waiting: null,
  error: "",
  online: true,
  speaking: false,
  muted: false,

  hydrate() {
    const saved = load();
    saved.visits += 1;
    save(saved);
    applyLevels(saved.settings);
    voice.onSpeaking((on) => set({ speaking: on }));
    const age = saved.profile?.age ?? "6-10";
    set({ hydrated: true, saved, phase: saved.profile ? "home" : "profile", help: OFFLINE_HELP[age] });
  },

  setProfile(p) {
    const before = get().saved.profile;
    persist(get, set, (s) => {
      s.profile = p;
    });
    // Đổi nhóm tuổi hay giới tính thì phiên cũ không dùng tiếp được (tên nhân vật chính đổi).
    if (!before || before.age !== p.age || before.gender !== p.gender) {
      set({ sessionId: "", map: [], progress: EMPTY_PROGRESS, scenario: null, draft: null });
    }
    set({ phase: "home", help: OFFLINE_HELP[p.age] });
  },

  updateSettings(patch) {
    persist(get, set, (s) => {
      s.settings = { ...DEFAULT_SETTINGS, ...s.settings, ...patch };
    });
    applyLevels(get().saved.settings);
  },

  setOverlay(o) {
    if (o) sound.play("open");
    sound.duck(o === "pause");
    set({ overlay: o });
  },

  requestLock(purpose, then) {
    sound.play("open");
    set({ lock: purpose, lockThen: then });
  },
  unlock() {
    const then = get().lockThen;
    set({ lock: null, lockThen: null });
    then?.();
  },
  cancelLock() {
    sound.play("close");
    set({ lock: null, lockThen: null });
  },

  goHome() {
    voice.stop();
    set({ phase: "home", overlay: "", last: null, hint: "", detective: null, reward: null });
  },

  async playOn() {
    const { saved, sessionId, draft } = get();
    const profile = saved.profile;
    if (!profile) return set({ phase: "profile" });
    if (sessionId && !draft) return get().openMap();
    set({ busy: true, error: "" });
    sound.music(saved.settings.music > 0);
    try {
      const cleared = Object.entries(saved.progress[profile.age].cleared).map(([id, passed]) => ({ id, passed }));
      const r = await api.start(profile.age, profile.gender, cleared);
      voice.setSession(r.session_id);
      preload([owl("happy"), owl("encourage"), owl("curious"), owl("explain"), owl("think"), owl("listen"), ui.illusDone, ui.starOn]);
      set({ sessionId: r.session_id, name: r.name, map: r.map, suggest: r.suggest, progress: r.progress,
        showDrafts: r.show_drafts, help: r.help, phase: "map", busy: false, draft: null, scenario: null, mapLine: r.greeting });
      sound.play("start");
      get().say([{ file: r.greeting.voice }, ...(r.time_line ? [{ pause: 250 }, { file: r.time_line.voice }] as Clip[] : [])]);
    } catch (e) {
      set({ busy: false, error: (e as Error).message });
    }
  },

  openMap() {
    const { saved, map } = get();
    const age = ageOf(get);
    const cleared = saved.progress[age].cleared;
    const left = map.filter((p) => !p.scenes.every((s) => s.id in cleared)).length;
    const line = progressLine(age, left);
    set({ phase: "map", overlay: "", scenario: null, last: null, hint: "", mapLine: line ?? get().mapLine });
    if (line) get().say([{ file: line.voice }]);
  },

  async openLocation(loc) {
    const { sessionId, busy, saved } = get();
    if (!sessionId || busy) return;
    set({ busy: true, error: "" });
    sound.play("select");
    try {
      const r = await api.level(sessionId, loc);
      if (r.locked || !r.scenario) {
        set({ busy: false, mapLine: { id: "", text: r.message ?? "", voice: "" }, suggest: r.suggest ?? get().suggest, map: r.map ?? get().map });
        get().say([{ tts: r.message ?? "", role: tinRole(ageOf(get)) }]);
        return;
      }
      preloadScenario(r.scenario, saved.profile);
      const chat: ChatMsg[] = r.dialogue?.line ? [{ who: "stranger", text: r.dialogue.line }] : [];
      set({ busy: false, scenario: r.scenario, place: r.place ?? null, progress: r.progress ?? get().progress,
        dialogue: r.dialogue ?? null, chat, last: null, hint: "", reward: null, detective: null, phase: "intro" });
      if (r.place?.voice) get().say([{ file: r.place.voice }]);
    } catch (e) {
      set({ busy: false, error: (e as Error).message });
    }
  },

  beginLevel() {
    const { scenario, saved, dialogue } = get();
    set({ phase: "play", last: null, hint: "" });
    if (!scenario) return;
    const age = scenario.age_group;
    const clips: Clip[] = saved.settings.autoRead ? storyClips(scenario, age) : [];
    if (dialogue?.line) clips.push({ pause: 400 }, { tts: dialogue.line, role: dialogue.role ?? "nguoi_la" });
    get().say(clips);
  },

  async submit(text) {
    const { sessionId, scenario, busy, saved } = get();
    const t = text.trim();
    if (!scenario || busy || !t) return;
    const age = scenario.age_group;
    const w = waitLine(age);
    set({ busy: true, error: "", hint: "", waiting: w,
      chat: scenario.type === "hoi_thoai" ? [...get().chat, { who: "kid", text: t }] : get().chat });
    sound.play("send");
    get().say([{ file: w.voice }]);
    try {
      const r = await api.answer(sessionId, scenario.id, t);
      if (r.stopped === "nghi_xam_hai_that") {
        voice.stop();
        sound.duck(true);
        sound.play("calm");
        set({ busy: false, waiting: null, phase: "help", help: r.help ?? OFFLINE_HELP[age], last: r });
        get().say([{ file: (r.help ?? OFFLINE_HELP[age]).voice || r.voice?.line || "" }]);
        return;
      }
      const next: Partial<GameState> = { busy: false, waiting: null, last: r };
      if (r.progress) next.progress = r.progress;
      if (r.map) next.map = r.map;
      if (r.suggest !== undefined) next.suggest = r.suggest;
      if (r.answer_text && scenario.type === "hoi_thoai") {
        const chat = get().chat.slice(0, -1).concat({ who: "kid", text: r.answer_text });
        if (r.dialogue && !r.dialogue.ended && r.dialogue.line) chat.push({ who: "stranger", text: r.dialogue.line });
        if (r.feedback) chat.push({ who: "tin", text: r.feedback });
        next.chat = chat;
        if (r.dialogue && !r.dialogue.ended) next.dialogue = r.dialogue;
      }
      if (r.result === "tiep") {
        sound.play("receive");
        set(next);
        const clips: Clip[] = r.feedback ? [{ tts: r.feedback, role: tinRole(age) }] : [];
        if (r.dialogue?.line) clips.push({ tts: r.dialogue.line, role: r.dialogue.role ?? "nguoi_la" });
        get().say(clips);
        return;
      }
      sound.play(r.result === "dat" ? "correct" : r.result === "hoi_lai" ? "curious" : "encourage");
      if (r.level_complete) {
        const profile = saved.profile!;
        const owned = saved.progress[profile.age].rules;
        const cards = r.rule_cards ?? [];
        const fresh = cards.find((c) => !(c.code in owned)) ?? null;
        const before = owlStage(cardCount(get().saved, profile.age));
        persist(get, set, (s) => {
          const p = s.progress[profile.age];
          p.cleared[scenario.id] = (p.cleared[scenario.id] ?? false) || r.result === "dat";
          if (fresh) p.rules[fresh.code] = fresh;
        });
        const after = owlStage(cardCount(get().saved, profile.age));
        next.reward = { cards, newRule: fresh ?? cards[0] ?? null, stars: r.stars ?? 1, correctAnswer: r.correct_answer ?? "",
          cardLine: r.card_line ?? null, stageUp: after > before, sessionDone: !!r.session_done };
        if (r.detective) next.detective = { question: r.detective.question, result: null };
      }
      set(next);
      get().say(feedbackClips(r, age));
    } catch (e) {
      const err = e as ApiError;
      set({ busy: false, waiting: null, error: err.message, chat: scenario.type === "hoi_thoai" ? get().chat.slice(0, -1) : get().chat });
    }
  },

  async askHint() {
    const { sessionId, scenario, busy, hint } = get();
    if (!scenario || busy || hint) return;
    set({ busy: true });
    sound.play("select");
    try {
      const r = await api.hint(sessionId, scenario.id);
      const text = r.used ? (scenario.age_group === "6-10" ? "Lượt này tớ gợi ý rồi đấy. Cậu thử nghĩ tiếp nhé." : "Lượt này mình gợi ý rồi. Bạn thử nghĩ tiếp nhé.") : r.hint;
      set({ busy: false, hint: text });
      get().say(r.voice ? [{ file: r.voice }] : [{ tts: text, role: tinRole(scenario.age_group) }]);
    } catch (e) {
      set({ busy: false, error: (e as Error).message });
    }
  },

  retry() {
    sound.play("click");
    const { last } = get();
    const restart = last?.dialogue?.restart;
    if (restart?.line) {
      set({ last: null, hint: "", dialogue: restart, chat: [{ who: "stranger", text: restart.line }] });
      get().say([{ tts: restart.line, role: restart.role ?? "nguoi_la" }]);
      return;
    }
    set({ last: null });
  },

  toDetectiveOrReward() {
    const { detective } = get();
    if (detective) {
      set({ phase: "detective" });
      get().say([{ tts: detective.question, role: tinRole(ageOf(get)) }]);
    } else get().toReward();
  },

  async submitDetective(text) {
    const { sessionId, scenario, busy, detective, saved } = get();
    if (!scenario || !detective || busy) return;
    set({ busy: true, error: "" });
    sound.play("send");
    try {
      const r = await api.detective(sessionId, scenario.id, text);
      if (r.stopped === "nghi_xam_hai_that") {
        voice.stop();
        set({ busy: false, phase: "help", help: r.help ?? OFFLINE_HELP[scenario.age_group] });
        get().say([{ file: r.help?.voice ?? "" }]);
        return;
      }
      const age = saved.profile!.age;
      const before = owlStage(cardCount(get().saved, age));
      persist(get, set, (s) => {
        for (const t of r.found) s.progress[age].tactics[t.code] = t;
      });
      const after = owlStage(cardCount(get().saved, age));
      const reward = get().reward;
      set({ busy: false, detective: { ...detective, result: r }, map: r.map ?? get().map,
        reward: reward ? { ...reward, stageUp: reward.stageUp || after > before } : reward });
      sound.play(r.found.length ? "card" : "encourage");
      get().say([{ tts: r.feedback, role: tinRole(age) }]);
    } catch (e) {
      set({ busy: false, error: (e as Error).message });
    }
  },

  toReward() {
    const { reward } = get();
    if (!reward) return get().openMap();
    if (!reward.newRule) return get().nextFromReward();
    sound.play("card");
    set({ phase: "reward" });
    const clips: Clip[] = [];
    if (reward.cardLine?.voice) clips.push({ file: reward.cardLine.voice });
    if (reward.newRule) clips.push({ pause: 300 }, { file: reward.newRule.voice });
    get().say(clips);
  },

  nextFromReward() {
    const { reward } = get();
    sound.play("click");
    set({ reward: null, detective: null, last: null, scenario: null });
    if (reward?.sessionDone) void get().endSession();
    else get().openMap();
  },

  async endSession() {
    const { sessionId, draft, progress } = get();
    voice.stop();
    if (!sessionId || progress.index === 0) {
      set({ phase: "home", sessionId: "" });
      return;
    }
    set({ phase: "done", overlay: "" });
    sound.play("complete");
    if (draft) return;
    try {
      const d = await api.end(sessionId);
      set({ draft: d });
      if (d.bye?.voice) get().say([{ pause: 800 }, { file: d.bye.voice }]);
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  async openHelp() {
    const { sessionId } = get();
    const age = ageOf(get);
    voice.stop();
    sound.duck(true);
    sound.play("calm");
    const offline = OFFLINE_HELP[age];
    set({ phase: "help", busy: false, overlay: "", help: offline });
    get().say([{ file: offline.voice }]);
    if (!sessionId) return;
    try {
      const help = await api.help(sessionId);
      set({ help });
    } catch {}
  },

  openNotebook() {
    sound.play("page");
    voice.stop();
    set({ phase: "notebook", overlay: "" });
  },

  openHand() {
    sound.play("page");
    voice.stop();
    set({ phase: "hand", overlay: "" });
  },

  setHand(i, role) {
    const age = ageOf(get);
    persist(get, set, (s) => {
      s.progress[age].hand[i] = role;
    });
    sound.play("select");
  },

  wipeProgress() {
    wipe();
    voice.stop();
    const saved = structuredClone(EMPTY);
    saved.profile = get().saved.profile;
    saved.settings = get().saved.settings;
    save(saved);
    set({ saved, sessionId: "", map: [], draft: null, progress: EMPTY_PROGRESS, overlay: "" });
  },

  replay(what) {
    const { scenario, last, hint, dialogue } = get();
    if (!scenario) return;
    const age = scenario.age_group;
    if (what === "story") {
      const clips = storyClips(scenario, age);
      if (dialogue?.line) clips.push({ pause: 300 }, { tts: dialogue.line, role: dialogue.role ?? "nguoi_la" });
      get().say(clips);
    } else if (what === "feedback" && last) get().say(feedbackClips(last, age));
    else if (what === "hint" && hint) get().say([{ tts: hint, role: tinRole(age) }]);
  },

  say(clips) {
    void voice.play(clips);
  },

  toggleMute() {
    const muted = !get().muted;
    sound.mute(muted);
    if (muted) voice.stop();
    set({ muted });
  },

  setOnline: (online) => set({ online }),
  clearError: () => set({ error: "" }),
}));
