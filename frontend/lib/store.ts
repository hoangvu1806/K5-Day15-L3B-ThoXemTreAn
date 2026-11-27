"use client";

import { create } from "zustand";
import { api, ApiError, OFFLINE_HELP } from "./api";
import { bg, card, kid, npc, owl, preload, ui, type OwlMood } from "./assets";
import { progressLine, waitLine } from "./lines";
import {
  compactProgress, DEFAULT_SETTINGS, EMPTY, load, loadAccount, mergeProgress, owlStage, save, saveAccount, wipe,
  type Account, type AgeProgress, type Profile, type Saved, type Settings,
} from "./local";
import { sound } from "./sound";
import type {
  AgeGroup, AnswerResponse, AskChatMsg, ChatMsg, DetectiveResponse, DialogueTurn, Draft, HelpContent, Line, MapPlace,
  Progress, RuleCard, Scenario,
} from "./types";
import { voice, tinRole, type Clip } from "./voice";

export type Phase = "profile" | "home" | "map" | "intro" | "play" | "detective" | "reward" | "help" | "done" | "notebook" | "hand" | "ask";
export type Overlay = "" | "settings" | "pause" | "parent" | "confirmHome" | "confirmWipe" | "account";
export type SyncState = "idle" | "saving" | "saved" | "error";

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
  account: Account | null;
  sync: SyncState;
  authPrompt: string;
  afterAuth: (() => void) | null;
  askSessionId: string;
  askChat: AskChatMsg[];
  askChips: string[];
  askPrivacy: string;
  askRemaining: number;
  askMax: number;
  askMood: OwlMood;
  askEnded: boolean;

  hydrate: () => void;
  /** Trả "" nếu được, hoặc câu báo lỗi để hiện trên form. */
  register: (username: string, password: string, consent: boolean) => Promise<string>;
  login: (username: string, password: string) => Promise<string>;
  logout: () => void;
  syncNow: () => Promise<void>;
  setProfile: (p: Profile) => void;
  updateSettings: (s: Partial<Settings>) => void;
  setOverlay: (o: Overlay) => void;
  goHome: () => void;
  editProfile: () => void;
  playOn: () => Promise<void>;
  openMap: () => void;
  openLocation: (loc: string) => Promise<void>;
  beginLevel: () => void;
  submit: (text: string) => Promise<void>;
  askHint: () => Promise<void>;
  toDetectiveOrReward: () => void;
  submitDetective: (text: string) => Promise<void>;
  toReward: () => void;
  nextFromReward: () => void;
  retry: () => void;
  goNext: () => void;
  endSession: () => Promise<void>;
  openHelp: () => Promise<void>;
  openNotebook: () => void;
  openHand: () => void;
  openAsk: (fresh?: boolean) => Promise<void>;
  sendAsk: (text: string) => Promise<void>;
  replayAsk: () => void;
  closeAsk: () => void;
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
  if (get().account) scheduleSync(get);
}

/* Đồng bộ lên tài khoản: gom các thay đổi trong 1,5 giây thành một lần gọi. Lỗi mạng thì để lần sau. */
let syncTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSync(get: () => GameState) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void get().syncNow();
  }, 1500);
}

/** Gộp tiến độ server trả về vào máy (chỉ cộng thêm), lưu lại nếu có gì mới. */
function applyServer(get: () => GameState, set: (p: Partial<GameState>) => void, server: Record<AgeGroup, AgeProgress>) {
  const current = get().saved;
  const progress = mergeProgress(current.progress, server);
  if (JSON.stringify(progress) === JSON.stringify(current.progress)) return;
  const saved = { ...current, progress };
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
  account: null,
  sync: "idle",
  authPrompt: "",
  afterAuth: null,
  askSessionId: "",
  askChat: [],
  askChips: [],
  askPrivacy: "",
  askRemaining: 10,
  askMax: 10,
  askMood: "welcome",
  askEnded: false,

  hydrate() {
    const saved = load();
    saved.visits += 1;
    save(saved);
    applyLevels(saved.settings);
    voice.onSpeaking((on) => set({ speaking: on }));
    const age = saved.profile?.age ?? "6-10";
    const account = loadAccount();
    set({ hydrated: true, saved, account, phase: saved.profile ? "home" : "profile", help: OFFLINE_HELP[age] });
    // Đã đăng nhập từ trước: gửi tiến độ trên máy lên và lấy về thẻ nhận ở máy khác.
    if (account) void get().syncNow();
  },

  async register(username, password, consent) {
    try {
      const r = await api.register(username, password, consent, compactProgress(get().saved.progress));
      const account = { username: r.username, token: r.token ?? "" };
      const next = get().afterAuth;
      saveAccount(account);
      set({ account, sync: "saved", authPrompt: "", afterAuth: null, ...(next ? { overlay: "" } : {}) });
      applyServer(get, set, r.progress);
      sound.play("correct");
      next?.();
      return "";
    } catch (e) {
      return (e as Error).message;
    }
  },

  async login(username, password) {
    try {
      const r = await api.login(username, password, compactProgress(get().saved.progress));
      const account = { username: r.username, token: r.token ?? "" };
      const next = get().afterAuth;
      saveAccount(account);
      set({ account, sync: "saved", authPrompt: "", afterAuth: null, ...(next ? { overlay: "" } : {}) });
      applyServer(get, set, r.progress);
      sound.play("correct");
      next?.();
      return "";
    } catch (e) {
      return (e as Error).message;
    }
  },

  logout() {
    const account = get().account;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = null;
    saveAccount(null);
    set({ account: null, sync: "idle" });
    // Thẻ trên máy vẫn giữ; tài khoản vẫn giữ bản đã đồng bộ.
    if (account) api.logout(account.token).catch(() => {});
  },

  async syncNow() {
    const account = get().account;
    if (!account) return;
    set({ sync: "saving" });
    try {
      const r = await api.sync(account.token, compactProgress(get().saved.progress));
      if (get().account?.token !== account.token) return; // đã đăng xuất trong lúc chờ
      applyServer(get, set, r.progress);
      set({ sync: "saved" });
    } catch (e) {
      if ((e as ApiError).status === 401) {
        // Hết hạn đăng nhập: thoát tài khoản trên máy, thẻ vẫn còn trên máy.
        saveAccount(null);
        set({ account: null, sync: "idle" });
      } else set({ sync: "error" });
    }
  },

  setProfile(p) {
    const before = get().saved.profile;
    persist(get, set, (s) => {
      s.profile = p;
    });
    // Đổi nhóm tuổi hay giới tính thì phiên cũ không dùng tiếp được (tên nhân vật chính đổi).
    if (!before || before.age !== p.age || before.gender !== p.gender) {
      set({
        sessionId: "", map: [], progress: EMPTY_PROGRESS, scenario: null, draft: null,
        askSessionId: "", askChat: [], askChips: [], askEnded: false,
      });
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
    set({ overlay: o, ...(o !== "account" ? { authPrompt: "", afterAuth: null } : {}) });
  },

  editProfile() {
    sound.play("click");
    set({ phase: "profile", overlay: "", error: "" });
  },

  goHome() {
    voice.stop();
    set({ phase: "home", overlay: "", last: null, hint: "", detective: null, reward: null });
  },

  async playOn() {
    const { saved, sessionId, draft, account } = get();
    const profile = saved.profile;
    if (!profile) return set({ phase: "profile" });
    if (!account) {
      sound.play("open");
      return set({
        overlay: "account",
        authPrompt: "Đăng nhập hoặc tạo tài khoản để bắt đầu chơi cùng AI và lưu bộ thẻ nhé.",
        afterAuth: () => void get().playOn(),
      });
    }
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
      if ((e as ApiError).status === 401) {
        saveAccount(null);
        set({
          busy: false, account: null, sync: "idle", overlay: "account",
          authPrompt: "Phiên đăng nhập đã hết hạn, đăng nhập lại để chơi tiếp nhé.",
          afterAuth: () => void get().playOn(),
        });
      } else set({ busy: false, error: (e as Error).message });
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
      sound.play(r.result === "ghi_nhan" ? "receive" : r.result === "dat" ? "correct" : r.result === "hoi_lai" ? "curious" : "encourage");
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

  retry() {
    sound.play("click");
    voice.stop();
    set({ last: null, hint: "", reward: null });
  },

  // Kết quả từng màn (sao, thẻ) chỉ hiện ở cuối phiên, nên "Đi tiếp" bỏ qua màn nhận thẻ.
  goNext() {
    const { detective } = get();
    voice.stop();
    if (detective) {
      set({ phase: "detective" });
      get().say([{ tts: detective.question, role: tinRole(ageOf(get)) }]);
    } else get().nextFromReward();
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

  async openAsk(fresh = false) {
    const { saved, askSessionId, askEnded, sessionId, account } = get();
    const profile = saved.profile;
    if (!profile) return set({ phase: "profile" });
    if (!account) {
      sound.play("open");
      return set({
        overlay: "account",
        authPrompt: "Đăng nhập hoặc tạo tài khoản để trò chuyện trong Góc Tò Mò cùng Tin nhé.",
        afterAuth: () => void get().openAsk(fresh),
      });
    }
    voice.stop();
    if (!fresh && askSessionId && !askEnded) {
      voice.setSession(askSessionId);
      set({ phase: "ask", overlay: "", error: "" });
      return;
    }
    set({ busy: true, error: "" });
    sound.play("open");
    try {
      const r = await api.askStart(profile.age, profile.gender, sessionId);
      voice.setSession(r.ask_session_id);
      set({
        busy: false, phase: "ask", overlay: "",
        askSessionId: r.ask_session_id,
        askChat: [{ who: "tin", text: r.greeting }],
        askChips: r.chips,
        askPrivacy: r.privacy_notice,
        askRemaining: r.remaining,
        askMax: r.max_questions,
        askMood: "welcome",
        askEnded: false,
      });
      if (saved.settings.autoRead) get().say([{ tts: r.greeting, role: tinRole(profile.age) }]);
    } catch (e) {
      if ((e as ApiError).status === 401) {
        saveAccount(null);
        set({
          busy: false, account: null, sync: "idle", overlay: "account",
          authPrompt: "Phiên đăng nhập đã hết hạn, đăng nhập lại để mở Góc Tò Mò nhé.",
          afterAuth: () => void get().openAsk(fresh),
        });
      } else set({ busy: false, error: (e as Error).message });
    }
  },

  async sendAsk(text) {
    const { askSessionId, busy, askEnded, saved } = get();
    const t = text.trim();
    if (!askSessionId || busy || askEnded || !t) return;
    const age = ageOf(get);
    set({ busy: true, error: "", askMood: "think", askChat: [...get().askChat, { who: "kid", text: t }] });
    sound.play("send");
    try {
      const r = await api.askMessage(askSessionId, t);
      if (r.stopped === "nghi_xam_hai_that") {
        voice.stop();
        sound.duck(true);
        sound.play("calm");
        set({
          busy: false, phase: "help", help: r.help ?? OFFLINE_HELP[age],
          askEnded: true, askMood: "calm", askChips: [],
        });
        get().say([{ file: (r.help ?? OFFLINE_HELP[age]).voice || "" }]);
        return;
      }
      const chat = get().askChat.slice(0, -1).concat(
        { who: "kid", text: r.answer_text || t },
        { who: "tin", text: r.reply, topic: r.topic_title || undefined },
      );
      sound.play("receive");
      set({
        busy: false,
        askChat: chat,
        askChips: r.chips,
        askRemaining: r.remaining,
        askMood: r.mood || "explain",
        askEnded: r.ended,
      });
      if (saved.settings.autoRead) get().say([{ tts: r.reply, role: tinRole(age) }]);
    } catch (e) {
      set({ busy: false, askMood: "curious", error: (e as Error).message, askChat: get().askChat.slice(0, -1) });
    }
  },

  replayAsk() {
    const { askChat, askSessionId } = get();
    const lastTin = [...askChat].reverse().find((m) => m.who === "tin");
    if (!lastTin) return;
    if (askSessionId) voice.setSession(askSessionId);
    get().say([{ tts: lastTin.text, role: tinRole(ageOf(get)) }]);
  },

  closeAsk() {
    const { askSessionId, sessionId, askChat, draft } = get();
    voice.stop();
    if (sessionId) voice.setSession(sessionId);
    set({ phase: "home", overlay: "", error: "" });
    // Nếu trẻ chỉ dùng Hỏi Tin (chưa có bản nháp phiên chơi), cập nhật bản nháp ngắn theo chủ đề cho Góc phụ huynh.
    const asked = askChat.some((m) => m.who === "kid");
    if (askSessionId && asked && !draft) {
      api.askEnd(askSessionId).then((d) => {
        if (d?.note && !get().draft) set({ draft: d });
      }).catch(() => {});
    }
  },

  setHand(i, role) {
    const age = ageOf(get);
    persist(get, set, (s) => {
      s.progress[age].hand[i] = role;
    });
    sound.play("select");
  },

  wipeProgress() {
    // Đang đăng nhập thì thoát luôn, nếu không lần đồng bộ sau sẽ kéo thẻ từ tài khoản về lại máy.
    // Bản trong tài khoản không bị xoá.
    if (get().account) get().logout();
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
