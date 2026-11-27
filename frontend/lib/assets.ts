import type { ActionIcon, AgeGroup, CardKind, Gender } from "./types";

const A = "/assets";

export const STAGE_W = 1376;
export const STAGE_H = 768;

export const bg = (name: string) => `${A}/backgrounds/${name}.webp`;
export const npc = (name: string) => `${A}/characters/npcs/${name}.webp`;

export type OwlMood = "calm" | "curious" | "encourage" | "explain" | "happy" | "welcome";
export const owl = (mood: OwlMood) => `${A}/characters/narrator/narrator_${mood}.webp`;

export type KidMood = "idle" | "confident" | "unsure";
/** Chưa có ảnh bé trai: chọn Nam hoặc Không muốn nói thì dùng nhân vật trung tính. */
export const kid = (age: AgeGroup, gender: Gender, mood: KidMood) =>
  `${A}/characters/players/kid_${age === "6-10" ? "610" : "1115"}_${gender === "nu" ? "girl" : "neutral"}_${mood}.webp`;

export const ui = {
  logo: `${A}/ui/controls/logo_growsafe.webp`,
  help: `${A}/ui/controls/btn_help_icon.webp`,
  phone: `${A}/ui/controls/icon_phone_111.webp`,
  parent: `${A}/ui/controls/icon_parent_corner.webp`,
  tip: `${A}/ui/controls/icon_conversation_tip.webp`,
  nodeOn: `${A}/ui/controls/ui_progress_node.webp`,
  nodeOff: `${A}/ui/controls/ui_progress_node_empty.webp`,
  starOn: `${A}/ui/rewards/star_filled.webp`,
  starOff: `${A}/ui/rewards/star_empty.webp`,
  badgeHero: `${A}/ui/rewards/badge_safe_hero.webp`,
  badgeNo: `${A}/ui/rewards/badge_brave_no.webp`,
  privacy: `${A}/ui/setup/badge_privacy_safe.webp`,
  age610: `${A}/ui/setup/icon_age_610.webp`,
  age1115: `${A}/ui/setup/icon_age_1115.webp`,
  genderBoy: `${A}/ui/setup/icon_gender_boy.webp`,
  genderGirl: `${A}/ui/setup/icon_gender_girl.webp`,
  genderNeutral: `${A}/ui/setup/icon_gender_neutral.webp`,
  modeScript: `${A}/ui/setup/icon_mode_script.webp`,
  modeAi: `${A}/ui/setup/icon_mode_ai.webp`,
  illusHelp: `${A}/illustrations/illus_help_111.webp`,
  illusDone: `${A}/illustrations/illus_session_complete.webp`,
};

export const actionIcon: Record<Exclude<ActionIcon, "">, string> = {
  say_no: `${A}/ui/actions/icon_action_say_no.webp`,
  leave: `${A}/ui/actions/icon_action_leave.webp`,
  tell_adult: `${A}/ui/actions/icon_action_tell_adult.webp`,
};

export const card: Record<CardKind, { frame: string; icon: string; tint: string; name: string }> = {
  body: { frame: `${A}/ui/cards/card_frame_body.webp`, icon: `${A}/ui/cards/icon_rule_swimsuit.webp`, tint: "#7fd1ae", name: "Cơ thể của con" },
  secret: { frame: `${A}/ui/cards/card_frame_secret.webp`, icon: `${A}/ui/cards/icon_rule_secret.webp`, tint: "#c9a7f0", name: "Bí mật" },
  stranger: { frame: `${A}/ui/cards/card_frame_stranger.webp`, icon: `${A}/ui/cards/icon_rule_trusted_adults.webp`, tint: "#f7b267", name: "Người lớn tin cậy" },
  online: { frame: `${A}/ui/cards/card_frame_online.webp`, icon: `${A}/ui/cards/icon_rule_online_shield.webp`, tint: "#8fc9f4", name: "An toàn trên mạng" },
};

const cache = new Set<string>();
/** Tải trước ảnh để đổi cảnh không bị nháy. */
export function preload(urls: string[]) {
  if (typeof window === "undefined") return;
  for (const u of urls) {
    if (!u || cache.has(u)) continue;
    cache.add(u);
    const img = new window.Image();
    img.decoding = "async";
    img.src = u;
  }
}
