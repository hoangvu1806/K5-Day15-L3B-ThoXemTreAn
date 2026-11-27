export type AgeGroup = "6-10" | "11-15";
export type Gender = "nam" | "nu" | "khong_noi";
export type CardKind = "body" | "secret" | "stranger" | "online";
export type ActionIcon = "say_no" | "leave" | "tell_adult" | "";
export type Result = "dat" | "chua_dat" | "hoi_lai" | "dung";

export interface Action {
  icon: ActionIcon;
  label: string;
}

export interface Scenario {
  id: string;
  age_group: AgeGroup;
  topic: string;
  title: string;
  situation: string;
  question: string;
  choices: { id: string; text: string }[];
  scene: { bg: string; npc: string; card: CardKind };
  key_actions: Action[];
}

export interface Progress {
  index: number;
  total: number;
  stars: number;
}

export interface RuleCard {
  text: string;
  card: CardKind;
  title: string;
}

export interface HelpContent {
  title: string;
  message: string;
  hotline: string;
  hotline_name: string;
  steps: string[];
}

export interface AnswerResponse {
  scenario_id: string;
  result: Result;
  feedback: string;
  answer_text?: string;
  stopped: string;
  attempts_left?: number;
  matched_actions?: Action[];
  missing_actions?: Action[];
  level_complete: boolean;
  stars?: number;
  rule_card?: RuleCard;
  correct_answer?: string;
  next_scenario?: Scenario | null;
  session_done?: boolean;
  progress?: Progress;
  help?: HelpContent;
}

export interface SessionResponse {
  session_id: string;
  age_group: AgeGroup;
  gender: Gender;
  dialogue_mode: string;
  scenario: Scenario;
  progress: Progress;
}

export interface Draft {
  draft_id: string;
  status: string;
  created_at: string;
  note: string;
  stars: number;
  max_stars: number;
  levels: { title: string; result: string; stars: number }[];
  badges: ("safe_hero" | "brave_no")[];
  stopped: string;
}
