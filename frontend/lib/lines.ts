/**
 * Câu điều khiển và câu chờ chạy ngay trên máy, không cần server (chép từ data/lines.json, đã thu âm).
 * Mã câu là tên file giọng đọc trong /assets/voice/.
 */
import type { AgeGroup, Line } from "./types";

type Pair = Record<AgeGroup, Line>;

const pair = (key: string, t610: string, t1115: string): Pair => ({
  "6-10": { id: `${key}_610`, text: t610, voice: `${key}_610` },
  "11-15": { id: `${key}_1115`, text: t1115, voice: `${key}_1115` },
});

export const MIC = {
  howto: pair("mic_howto", "Giữ nút này rồi nói nhé, nói xong thì thả tay ra.", "Giữ nút mic để nói, nói xong thì thả ra."),
  confirm: pair("mic_confirm", "Nghe được thế này, đúng chưa cậu?", "Nghe được thế này, đúng chưa?"),
  unclear: pair("mic_unclear", "Chưa nghe rõ lắm. Nói lại giúp tớ nhé?", "Chưa nghe rõ, nói lại giúp mình nhé."),
  louder: pair("mic_louder", "Nói to hơn chút nhé, tớ nghe không ra.", "Nói to hơn một chút nhé."),
  type: pair("mic_type", "Mạng hơi chậm, gõ giúp tớ nhé.", "Mạng chậm quá, gõ giúp mình nhé."),
};

export const HINT_OFFER = pair("hint_offer", "Bí à? Bấm bóng đèn, tớ gợi ý cho.", "Cần gợi ý thì bấm bóng đèn.");

const WAIT: Record<AgeGroup, Line[]> = {
  "6-10": [
    { id: "wait_610_1", text: "Để tớ nghĩ chút…", voice: "wait_610_1" },
    { id: "wait_610_2", text: "Ừm… đang nghĩ đây.", voice: "wait_610_2" },
    { id: "wait_610_3", text: "Chờ tớ một chút.", voice: "wait_610_3" },
  ],
  "11-15": [
    { id: "wait_1115_1", text: "Đợi chút…", voice: "wait_1115_1" },
    { id: "wait_1115_2", text: "Để xem nào…", voice: "wait_1115_2" },
    { id: "wait_1115_3", text: "Một chút nhé.", voice: "wait_1115_3" },
  ],
};
export const waitLine = (age: AgeGroup) => WAIT[age][Math.floor(Math.random() * WAIT[age].length)];

/** Câu theo tiến độ trên bản đồ. */
export function progressLine(age: AgeGroup, left: number): Line | null {
  if (left <= 0) {
    const id = age === "6-10" ? "progress_all_610" : "progress_all_1115";
    return { id, voice: id, text: age === "6-10" ? "Xong hết bản đồ rồi. Giỏi ghê!" : "Mở hết các app rồi đấy. Xong cả hành trình." };
  }
  if (age !== "6-10" || left > 4) return null;
  const text = ["", "Còn một chỗ nữa là xong hết bản đồ.", "Còn hai chỗ nữa thôi.", "Còn ba chỗ nữa, đi tiếp nhé.",
    "Còn bốn chỗ nữa, cậu muốn đi đâu trước?"][left];
  return { id: `progress_left_${left}`, voice: `progress_left_${left}`, text };
}

/** Xưng hô của Tin (de-xuat-tinh-nang.md mục 4.1). */
export const you = (age: AgeGroup) => (age === "6-10" ? "cậu" : "bạn");
export const me = (age: AgeGroup) => (age === "6-10" ? "tớ" : "mình");
export const helpLabel = (age: AgeGroup) => (age === "6-10" ? "Con cần giúp" : "Mình cần giúp");

const ONES = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
/** Số bằng chữ (0–99), dùng cho khoá người lớn. */
export function numberWords(n: number): string {
  if (n < 10) return ONES[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  const tens = t === 1 ? "mười" : ONES[t] + " mươi";
  if (u === 0) return tens;
  const unit = u === 1 && t > 1 ? "mốt" : u === 5 ? "lăm" : u === 4 && t > 1 ? "tư" : ONES[u];
  return tens + " " + unit;
}
