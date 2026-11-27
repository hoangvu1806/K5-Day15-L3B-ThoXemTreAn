"use client";

import { Howl, Howler } from "howler";

const A = "/assets/audio";
const FILES = {
  click: `${A}/ui/ui_click.mp3`,
  hover: `${A}/ui/ui_hover.mp3`,
  select: `${A}/ui/ui_select.mp3`,
  open: `${A}/ui/ui_open.mp3`,
  close: `${A}/ui/ui_close.mp3`,
  toggle: `${A}/ui/ui_toggle.mp3`,
  send: `${A}/ui/ui_chat_send.mp3`,
  receive: `${A}/ui/ui_chat_receive.mp3`,
  correct: `${A}/feedback/sfx_correct.mp3`,
  curious: `${A}/feedback/sfx_curious.mp3`,
  encourage: `${A}/feedback/sfx_encourage.mp3`,
  calm: `${A}/feedback/sfx_help_calm.mp3`,
  start: `${A}/jingles/jingle_start.mp3`,
  card: `${A}/jingles/jingle_card_unlock.mp3`,
  badge: `${A}/jingles/jingle_badge_win.mp3`,
  complete: `${A}/jingles/jingle_session_complete.mp3`,
  // Chưa có sfx_mic_on / sfx_mic_off riêng (de-xuat-sprint-3.md mục 7, P0): tạm dùng tiếng bật/tắt có sẵn.
  micOn: `${A}/ui/ui_toggle.mp3`,
  micOff: `${A}/ui/ui_close.mp3`,
  page: `${A}/ui/ui_open.mp3`,
  flip: `${A}/ui/ui_select.mp3`,
  light: `${A}/jingles/jingle_card_unlock.mp3`,
} as const;

export type Sfx = keyof typeof FILES;

const BASE_VOL: Partial<Record<Sfx, number>> = { hover: 0.25, click: 0.5, select: 0.55, toggle: 0.5, micOn: 0.5, micOff: 0.4 };
const MUSIC_MAX = 0.22;

const sfx: Partial<Record<Sfx, Howl>> = {};
let music: Howl | null = null;
let sfxLevel = 0.8;
let musicLevel = 0.5;
let musicOn = true;
let ducked = false;

function get(name: Sfx) {
  if (!sfx[name]) sfx[name] = new Howl({ src: [FILES[name]], volume: BASE_VOL[name] ?? 0.7, preload: true });
  return sfx[name]!;
}

function musicTarget() {
  return musicOn ? MUSIC_MAX * musicLevel * (ducked ? 0.25 : 1) : 0;
}

export const sound = {
  play(name: Sfx) {
    if (typeof window === "undefined" || sfxLevel <= 0) return;
    try {
      const h = get(name);
      const id = h.play();
      h.volume((BASE_VOL[name] ?? 0.7) * sfxLevel, id);
    } catch {}
  },
  /** Nhạc nền nhỏ, chỉ bật sau lần bấm đầu tiên (trình duyệt chặn tự phát). */
  music(on: boolean) {
    if (typeof window === "undefined") return;
    musicOn = on && musicLevel > 0;
    if (!music) music = new Howl({ src: ["/assets/the_mountain-children-483305.mp3"], loop: true, volume: 0 });
    if (musicOn) {
      if (!music.playing()) music.play();
      music.fade(music.volume(), musicTarget(), 1200);
    } else if (music.playing()) {
      music.fade(music.volume(), 0, 400);
      setTimeout(() => music?.pause(), 420);
    }
  },
  /** Hạ nhạc nền khi Tin nói, khi tạm dừng hoặc ở màn cần giúp. */
  duck(down: boolean) {
    ducked = down;
    if (music?.playing()) music.fade(music.volume(), musicTarget(), 500);
  },
  setLevels(levels: { music: number; sfx: number }) {
    sfxLevel = levels.sfx;
    const was = musicLevel;
    musicLevel = levels.music;
    if (music?.playing()) music.volume(musicTarget());
    if (was <= 0 && musicLevel > 0 && musicOn === false) sound.music(true);
    if (musicLevel <= 0) sound.music(false);
  },
  mute(m: boolean) {
    Howler.mute(m);
  },
  warm() {
    (["click", "select", "send", "receive", "correct", "encourage", "curious", "card"] as Sfx[]).forEach(get);
  },
};
