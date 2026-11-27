"use client";

/**
 * Đọc to (docs/de-xuat-sprint-3.md mục 6 "Giọng nói").
 * - Câu cố định đã đọc sẵn thành file trong /assets/voice/<mã>.mp3.
 * - Lời AI vừa viết và lời người lạ: gọi POST /api/tts qua server (server giữ key).
 * - TTS lỗi hoặc chậm quá 4 giây: dùng speechSynthesis của trình duyệt (giọng vi). Máy không có giọng Việt thì chỉ hiện chữ.
 * Chữ luôn hiện trên màn hình dù có đọc hay không. Không bao giờ đọc lại chữ trẻ gõ hay nói.
 */
import { Howl } from "howler";
import { api } from "./api";
import { sound } from "./sound";

export type Clip = { file: string } | { tts: string; role: string } | { pause: number };

const RATE = { slow: 0.88, normal: 1, fast: 1.15 } as const;

let gen = 0;
let current: Howl | null = null;
let level = 1;
let rate: number = RATE.normal;
let sessionId = "";
const listeners = new Set<(on: boolean) => void>();
const urlCache = new Map<string, string>();

function emit(on: boolean) {
  listeners.forEach((f) => f(on));
}

function playHowl(src: string, my: number, format?: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    if (my !== gen) return resolve(false);
    const h = new Howl({ src: [src], volume: level, rate, format, html5: false });
    current = h;
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      resolve(ok);
    };
    h.once("end", () => finish(true));
    h.once("loaderror", () => finish(false));
    h.once("playerror", () => finish(false));
    h.once("stop", () => finish(true));
    h.play();
  });
}

function viVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  return window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith("vi")) ?? null;
}

function browserSay(text: string, my: number): Promise<boolean> {
  return new Promise((resolve) => {
    const v = viVoice();
    if (!v || my !== gen) return resolve(false);
    const u = new SpeechSynthesisUtterance(text.replace(/111/g, "một một một"));
    u.voice = v;
    u.lang = v.lang;
    u.rate = rate;
    u.volume = level;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    window.speechSynthesis.speak(u);
  });
}

async function playTts(text: string, role: string, my: number) {
  const key = role + "|" + text;
  try {
    let url = urlCache.get(key);
    if (!url) {
      const blob = await api.tts(sessionId, text, role);
      url = URL.createObjectURL(blob);
      urlCache.set(key, url);
    }
    if (await playHowl(url, my, ["mp3"])) return true;
  } catch {}
  return browserSay(text, my);
}

export const voice = {
  setSession(id: string) {
    sessionId = id;
  },
  setLevels(o: { volume: number; speed: keyof typeof RATE }) {
    level = o.volume;
    rate = RATE[o.speed];
    current?.volume(level);
  },
  stop() {
    gen++;
    current?.stop();
    current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    sound.duck(false);
    emit(false);
  },
  /** Phát lần lượt các đoạn; gọi lần mới thì dừng lượt cũ. */
  async play(clips: Clip[]) {
    voice.stop();
    const my = ++gen;
    if (level <= 0) return;
    const list = clips.filter((c) => ("file" in c ? !!c.file : "tts" in c ? !!c.tts.trim() : true));
    if (!list.length) return;
    sound.duck(true);
    emit(true);
    for (const c of list) {
      if (my !== gen) return;
      if ("pause" in c) await new Promise((r) => setTimeout(r, c.pause));
      else if ("file" in c) await playHowl(`/assets/voice/${c.file}.mp3`, my);
      else await playTts(c.tts, c.role, my);
    }
    if (my === gen) {
      sound.duck(false);
      emit(false);
    }
  },
  onSpeaking(fn: (on: boolean) => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export const tinRole = (age: string, calm = false) => (calm ? "tin_calm" : "tin") + (age === "6-10" ? "610" : "1115");
