import type { ActionIcon, AgeGroup, CardKind, Gender } from "./types";

const A = "/assets";

export const STAGE_W = 1376;
export const STAGE_H = 768;

export const bg = (name: string) => `${A}/backgrounds/${name}.webp`;
export const npc = (name: string) => `${A}/characters/npcs/${name}.webp`;

export type OwlMood = "calm" | "curious" | "encourage" | "explain" | "happy" | "welcome" | "listen" | "think" | "phone";
export const owl = (mood: OwlMood) => `${A}/characters/narrator/narrator_${mood}.webp`;
/** Tin lớn dần theo số thẻ đã nhận. */
export const owlStage = (stage: 1 | 2 | 3 | 4) => `${A}/characters/narrator/owl_stage_${stage}.webp`;

export type KidMood = "idle" | "confident" | "unsure";
/** Nhân vật chính: Bin / Na (6-10), Khôi / Mai (11-15). */
export const kid = (age: AgeGroup, gender: Gender, mood: KidMood) =>
  `${A}/characters/players/kid_${age === "6-10" ? "610" : "1115"}_${gender === "nu" ? "girl" : "boy"}_${mood}.webp`;

export const ui = {
  logo: `${A}/ui/controls/logo_growsafe.webp`,
  help: `${A}/ui/controls/btn_help_icon.webp`,
  phone: `${A}/ui/controls/icon_phone_111.webp`,
  parent: `${A}/ui/controls/icon_parent_corner.webp`,
  tip: `${A}/ui/controls/icon_conversation_tip.webp`,
  strangerTag: `${A}/ui/controls/tag_stranger_game.webp`,
  lock: `${A}/ui/controls/icon_lock_adult.webp`,
  home: `${A}/ui/controls/btn_home.webp`,
  settings: `${A}/ui/controls/btn_settings.webp`,
  pause: `${A}/ui/controls/btn_pause.webp`,
  back: `${A}/ui/controls/btn_back.webp`,
  replay: `${A}/ui/controls/btn_replay_voice.webp`,
  hint: `${A}/ui/controls/btn_hint.webp`,
  micIdle: `${A}/ui/controls/btn_mic_idle.webp`,
  micRec: `${A}/ui/controls/btn_mic_recording.webp`,
  nodeOn: `${A}/ui/controls/ui_progress_node.webp`,
  nodeOff: `${A}/ui/controls/ui_progress_node_empty.webp`,
  starOn: `${A}/ui/rewards/star_filled.webp`,
  starOff: `${A}/ui/rewards/star_empty.webp`,
  privacy: `${A}/ui/setup/badge_privacy_safe.webp`,
  age610: `${A}/ui/setup/icon_age_610.webp`,
  age1115: `${A}/ui/setup/icon_age_1115.webp`,
  genderBoy: `${A}/ui/setup/icon_gender_boy.webp`,
  genderGirl: `${A}/ui/setup/icon_gender_girl.webp`,
  modeScript: `${A}/ui/setup/icon_mode_script.webp`,
  modeAi: `${A}/ui/setup/icon_mode_ai.webp`,
  illusHelp: `${A}/illustrations/illus_help_111.webp`,
  illusDone: `${A}/illustrations/illus_session_complete.webp`,
  map610: `${A}/backgrounds/map_610_day.webp`,
  phoneFrame: `${A}/ui/map/phone_frame_1115.webp`,
  notebookCover: `${A}/ui/notebook/notebook_cover.webp`,
  notebookPage: `${A}/ui/notebook/notebook_page.webp`,
  slotEmpty: `${A}/ui/notebook/card_slot_empty.webp`,
  tacticBack: `${A}/ui/cards/card_back_tactic.webp`,
};

export const badge = {
  safe_hero: { src: `${A}/ui/rewards/badge_safe_hero.webp`, label: "Siêu anh hùng an toàn" },
  brave_no: { src: `${A}/ui/rewards/badge_brave_no.webp`, label: "Dũng cảm nói KHÔNG" },
  detective: { src: `${A}/ui/rewards/badge_detective.webp`, label: "Thám tử" },
  map_complete: { src: `${A}/ui/rewards/badge_map_complete.webp`, label: "Sáng cả bản đồ" },
} as const;

export const pin = (place: string, on: boolean) => `${A}/ui/map/map_pin_${place}_${on ? "on" : "off"}.webp`;
export const app = (place: string) => `${A}/ui/map/app_${place}.webp`;

/** Vị trí địa điểm trên bản đồ 6-10 (toạ độ trên ảnh 1376×768). */
export const MAP_610: Record<string, { x: number; y: number }> = {
  home: { x: 225, y: 470 },
  grandma: { x: 360, y: 205 },
  park: { x: 725, y: 285 },
  pool: { x: 1090, y: 250 },
  school: { x: 1110, y: 520 },
};

export const actionIcon: Record<Exclude<ActionIcon, "">, string> = {
  say_no: `${A}/ui/actions/icon_action_say_no.webp`,
  leave: `${A}/ui/actions/icon_action_leave.webp`,
  tell_adult: `${A}/ui/actions/icon_action_tell_adult.webp`,
};

export const card: Record<CardKind, { frame: string; icon: string; tint: string; name: string }> = {
  body: { frame: `${A}/ui/cards/card_frame_body.webp`, icon: `${A}/ui/cards/icon_rule_swimsuit.webp`, tint: "#7fd1ae", name: "Cơ thể của mình" },
  secret: { frame: `${A}/ui/cards/card_frame_secret.webp`, icon: `${A}/ui/cards/icon_rule_secret.webp`, tint: "#c9a7f0", name: "Bí mật" },
  stranger: { frame: `${A}/ui/cards/card_frame_stranger.webp`, icon: `${A}/ui/cards/icon_rule_trusted_adults.webp`, tint: "#f7b267", name: "Người lớn tin cậy" },
  online: { frame: `${A}/ui/cards/card_frame_online.webp`, icon: `${A}/ui/cards/icon_rule_online_shield.webp`, tint: "#8fc9f4", name: "An toàn trên mạng" },
};

/** Biểu tượng riêng của từng thẻ quy tắc. R01, R03, R05, R08 dùng biểu tượng chung của khung thẻ. */
const RULE_ICON: Record<string, string> = {
  R01: `${A}/ui/cards/icon_rule_swimsuit.webp`,
  R03: `${A}/ui/cards/icon_rule_secret.webp`,
  R05: `${A}/ui/cards/icon_rule_trusted_adults.webp`,
  R08: `${A}/ui/cards/icon_rule_online_shield.webp`,
};
export const ruleIcon = (code: string) => RULE_ICON[code] ?? `${A}/ui/cards/icon_rule_${code}.webp`;
export const tacticIcon = (code: string) => `${A}/ui/cards/icon_tactic_${code}.webp`;

/** Thẻ quy tắc trong sổ tay theo nhóm tuổi (R12 không làm thẻ, R11 chỉ có ở 11-15). */
export const RULE_CODES = (age: AgeGroup) =>
  ["R01", "R02", "R03", "R04", "R05", "R06", "R07", "R08", "R09", "R10", ...(age === "11-15" ? ["R11"] : [])];
export const TACTIC_CODES = (age: AgeGroup) =>
  ["gia_quen_bo_me", "giuc_gap", "noi_me_gap_chuyen", "cho_qua", "dan_bi_mat",
    ...(age === "11-15" ? ["hua_vat_pham", "ep_bang_tinh_cam", "ru_gap_rieng"] : [])];

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
