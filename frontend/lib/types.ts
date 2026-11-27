export type AgeGroup = "6-10" | "11-15";
export type Gender = "nam" | "nu";
export type CardKind = "body" | "secret" | "stranger" | "online";
export type ActionIcon = "say_no" | "leave" | "tell_adult" | "";
export type Result = "dat" | "chua_dat" | "hoi_lai" | "dung" | "tiep" | "thoat_vai" | "ghi_nhan";

export interface Line {
  id: string;
  text: string;
  voice: string;
}

export interface Action {
  code: string;
  icon: ActionIcon;
  label: string;
}

export interface RuleCard {
  code: string;
  title: string;
  text: string;
  card: CardKind;
  voice: string;
}

export interface TacticCard {
  code: string;
  name: string;
  recognize: string;
  reply: string;
  voice: string;
}

export interface Scenario {
  id: string;
  age_group: AgeGroup;
  type: "mot_cau" | "hoi_thoai";
  topic: string;
  title: string;
  situation: string;
  question: string;
  scene: { bg: string; npc: string; card: CardKind };
  key_actions: Action[];
  location: string;
  tier: number;
  voice: { tell?: string; ask?: string };
  rule_cards: RuleCard[];
  draft: boolean;
  chain: string;
  chain_step: number;
  speaker?: { label: string; role: string; npc: string };
  max_turns?: number;
  cast?: CastMember[];
}

export interface CastMember {
  name: string;
  role: string;
  kind: "hero" | "npc" | "tin";
  npc?: string;
}

export interface MapScene {
  id: string;
  title: string;
  tier: number;
  type: string;
  open: boolean;
  draft: boolean;
}

export interface MapPlace {
  id: string;
  label: string;
  scenes: MapScene[];
}

export interface Progress {
  index: number;
  total: number;
  stars: number;
}

export interface HelpContent {
  title: string;
  button: string;
  message: string;
  voice: string;
  hotline: string;
  hotline_name: string;
  steps: string[];
}

export interface DialogueTurn {
  ended?: boolean;
  turn?: number;
  max_turns?: number;
  line?: string;
  speaker?: string;
  role?: string;
  branch?: string;
}

export interface VoicePlan {
  line?: string;
  pieces?: string[];
  tts?: boolean;
}

export interface AnswerResponse {
  scenario_id: string;
  mode: "mot_cau" | "hoi_thoai";
  result: Result;
  verdict?: string;
  feedback: string;
  answer_text?: string;
  stopped: string;
  voice?: VoicePlan;
  attempts_left?: number;
  can_retry?: boolean;
  matched_actions?: Action[];
  missing_actions?: Action[];
  tired?: boolean;
  rest_line?: Line;
  level_complete: boolean;
  stars?: number;
  rule_cards?: RuleCard[];
  card_line?: Line;
  correct_answer?: string;
  session_done?: boolean;
  suggest?: string;
  map?: MapPlace[];
  progress?: Progress;
  help?: HelpContent;
  dialogue?: DialogueTurn;
  detective?: { question: string };
}

export interface SessionResponse {
  session_id: string;
  age_group: AgeGroup;
  gender: Gender;
  name: string;
  map: MapPlace[];
  suggest: string;
  greeting: Line;
  time_line: Line | null;
  progress: Progress;
  show_drafts: boolean;
  help: HelpContent;
}

export interface LevelResponse {
  locked: boolean;
  message?: string;
  suggest?: string;
  map?: MapPlace[];
  scenario?: Scenario;
  place?: Line;
  progress?: Progress;
  dialogue?: DialogueTurn;
}

export interface HintResponse {
  hint: string;
  voice: string;
  used: boolean;
}

export interface DetectiveResponse {
  scenario_id: string;
  feedback: string;
  found: TacticCard[];
  missed: TacticCard[];
  all_found: boolean;
  session_done: boolean;
  map?: MapPlace[];
  suggest?: string;
  stopped?: string;
  help?: HelpContent;
}

export type Badge = "safe_hero" | "brave_no" | "detective" | "map_complete";

export interface Draft {
  draft_id: string;
  status: string;
  created_at: string;
  note: string;
  stars: number;
  max_stars: number;
  levels: { title: string; result: string; stars: number }[];
  badges: Badge[];
  stopped: string;
  bye?: Line;
}

export interface ChatMsg {
  who: "stranger" | "kid" | "tin";
  text: string;
}

export interface AskChatMsg {
  who: "kid" | "tin";
  text: string;
  topic?: string;
}

export interface AskStartResponse {
  ask_session_id: string;
  age_group: AgeGroup;
  greeting: string;
  privacy_notice: string;
  chips: string[];
  max_questions: number;
  remaining: number;
}

export interface AskMessageResponse {
  ask_session_id: string;
  reply: string;
  mood: "calm" | "curious" | "explain" | "happy";
  topic_id: string;
  topic_title: string;
  level: string;
  chips: string[];
  remaining: number;
  ended: boolean;
  stopped: string;
  help?: HelpContent;
  answer_text?: string;
}
