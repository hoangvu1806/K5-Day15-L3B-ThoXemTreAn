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
} as const;

export type Sfx = keyof typeof FILES;

const VOLUME: Partial<Record<Sfx, number>> = { hover: 0.25, click: 0.5, select: 0.55, toggle: 0.5 };

let sfx: Partial<Record<Sfx, Howl>> = {};
let music: Howl | null = null;

function get(name: Sfx) {
  if (!sfx[name]) sfx[name] = new Howl({ src: [FILES[name]], volume: VOLUME[name] ?? 0.7, preload: true });
  return sfx[name]!;
}

export const sound = {
  play(name: Sfx) {
    if (typeof window === "undefined") return;
    try {
      get(name).play();
    } catch {}
  },
  /** Nhạc nền nhỏ, chỉ bật sau lần bấm đầu tiên (trình duyệt chặn tự phát). */
  music(on: boolean) {
    if (typeof window === "undefined") return;
    if (!music) music = new Howl({ src: ["/assets/the_mountain-children-483305.mp3"], loop: true, volume: 0 });
    if (on) {
      if (!music.playing()) music.play();
      music.fade(music.volume(), 0.18, 1200);
    } else if (music.playing()) {
      music.fade(music.volume(), 0, 400);
      setTimeout(() => music?.pause(), 420);
    }
  },
  /** Hạ nhạc nền khi mở màn "Con cần giúp" hoặc khi người dẫn truyện nói. */
  duck(down: boolean) {
    if (music?.playing()) music.fade(music.volume(), down ? 0.05 : 0.18, 500);
  },
  mute(m: boolean) {
    Howler.mute(m);
  },
  warm() {
    (["click", "select", "send", "receive", "correct", "encourage", "curious", "card"] as Sfx[]).forEach(get);
  },
  reset() {
    sfx = {};
  },
};
