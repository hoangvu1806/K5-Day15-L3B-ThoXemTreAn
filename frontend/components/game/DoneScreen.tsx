"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { owl, ui } from "@/lib/assets";
import { sound } from "@/lib/sound";
import { useGame } from "@/lib/store";
import { RuleCardView } from "./RewardScreen";
import { Chunky, Pic, SoundButtons, useFitText } from "./ui";

const BADGES = {
  safe_hero: { src: ui.badgeHero, label: "Siêu anh hùng an toàn" },
  brave_no: { src: ui.badgeNo, label: "Dũng cảm nói KHÔNG" },
};

function ParentCorner({ onClose }: { onClose: () => void }) {
  const draft = useGame((s) => s.draft);
  const [copied, setCopied] = useState(false);
  const ref = useFitText<HTMLDivElement>(draft?.note ?? "", 21, 13);

  return (
    <motion.div className="absolute inset-0 z-40 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-[rgb(74_47_34/0.45)] backdrop-blur-[3px]" onClick={onClose} />
      <motion.div initial={{ y: 60, scale: 0.94 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.96 }} transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="panel paper-grain relative flex h-[640px] w-[980px] flex-col px-10 py-7">
        <div className="flex shrink-0 items-center gap-4">
          <Pic src={ui.parent} w={512} h={512} className="h-[66px] w-[66px]" />
          <div className="flex-1">
            <h3 className="font-display text-[36px] font-extrabold leading-none">Góc phụ huynh</h3>
            <p className="mt-1 text-[16px] font-bold text-[var(--ink-soft)]">Bản nháp do AI soạn · chờ bố mẹ, thầy cô đọc và tự quyết dùng thế nào</p>
          </div>
          <span className="rounded-full border-[3px] border-[var(--ink)] bg-[var(--lilac)] px-4 py-1 font-display text-[17px] font-bold">Bản nháp</span>
        </div>

        <div className="mt-5 flex min-h-0 flex-1 gap-6">
          <div className="flex min-h-0 flex-1 flex-col rounded-[24px] border-[3px] border-[var(--ink)] bg-white px-6 py-5">
            {draft ? (
              <div ref={ref} className="min-h-0 flex-1 overflow-hidden whitespace-pre-line font-semibold leading-[1.5]">
                {draft.note.split("\n").map((line, i) => {
                  const m = line.match(/^(\*\*)?([^:*]{3,30}):(\*\*)?\s*(.*)$/);
                  return m ? (
                    <p key={i} className="mb-[0.5em]"><b className="font-display text-[1.05em] font-extrabold text-[var(--mint-deep)]">{m[2]}:</b> {m[4]}</p>
                  ) : (
                    <p key={i} className="mb-[0.5em]">{line.replace(/\*\*/g, "")}</p>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center gap-4">
                <motion.div animate={{ rotate: [-6, 6, -6] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                  <Pic src={owl("explain")} w={640} h={640} className="h-[120px] w-[120px]" />
                </motion.div>
                <p className="font-display text-[24px] font-bold">Bạn cú đang viết bản nháp…</p>
              </div>
            )}
          </div>

          <div className="flex w-[300px] shrink-0 flex-col gap-2">
            <p className="font-display text-[20px] font-bold">Kết quả từng màn</p>
            {(draft?.levels ?? []).map((l, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-[16px] border-[3px] border-[var(--ink)]/80 bg-white/80 px-3 py-[6px]">
                <span className="truncate text-[16px] font-bold">{l.title}</span>
                <span className="flex shrink-0">
                  {[0, 1, 2].map((s) => <Pic key={s} src={s < l.stars ? ui.starOn : ui.starOff} w={512} h={512} className="h-[22px] w-[22px]" />)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex shrink-0 items-center gap-4">
          <Pic src={ui.privacy} w={512} h={512} className="h-[44px] w-[44px]" />
          <p className="flex-1 text-[15px] font-bold leading-snug text-[var(--ink-soft)]">Game không tự gửi bản nháp này đi đâu. Bản nháp không có tên hay thông tin định danh của con.</p>
          <Chunky size="sm" color="var(--sky)" disabled={!draft} onClick={async () => {
            if (!draft) return;
            try { await navigator.clipboard.writeText(draft.note); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
          }}>{copied ? "Đã chép!" : "Sao chép"}</Chunky>
          <Chunky size="sm" color="var(--cream)" onClick={() => { sound.play("close"); onClose(); }}>Đóng</Chunky>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function DoneScreen() {
  const { cards, progress, draft, restart, age } = useGame();
  const [parent, setParent] = useState(false);
  const max = progress.total * 3;

  useEffect(() => {
    const end = Date.now() + 1600;
    const colors = ["#ffd45c", "#9fe3c4", "#ffb08f", "#9bd8f5", "#d6c1f7"];
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.6 }, colors, disableForReducedMotion: true });
      confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.6 }, colors, disableForReducedMotion: true });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  useEffect(() => {
    if (draft?.badges.length) {
      const t = setTimeout(() => sound.play("badge"), 1400);
      return () => clearTimeout(t);
    }
  }, [draft?.badges.length]);

  return (
    <div className="absolute inset-0">
      <Pic src={ui.illusDone} w={1376} h={768} priority className="absolute inset-0 h-full w-full" />
      <div className="absolute right-6 top-5 z-10"><SoundButtons /></div>

      <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 110, damping: 16, delay: 0.2 }}
        className="panel paper-grain absolute right-[48px] top-[92px] flex w-[620px] flex-col items-center px-9 pb-7 pt-6 text-center">
        <h2 className="font-display text-[54px] font-extrabold leading-none">Hoàn thành!</h2>
        <p className="mt-2 text-[20px] font-bold text-[var(--ink-soft)]">
          {age === "6-10" ? "Con đã tập nói KHÔNG, rời đi và kể với người lớn." : "Em đã tập xong các tình huống hôm nay."}
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-full border-[4px] border-[var(--ink)] bg-[var(--sun)] py-1 pl-2 pr-6 shadow-[0_5px_0_var(--ink)]">
          <Pic src={ui.starOn} w={512} h={512} className="h-[54px] w-[54px]" />
          <span className="font-display text-[34px] font-extrabold">{progress.stars} / {max}</span>
        </div>

        <div className="mt-4 flex h-[150px] items-end justify-center">
          {cards.map((r, i) => {
            const mid = (cards.length - 1) / 2;
            return (
              <motion.div key={i} initial={{ y: 120, opacity: 0, rotate: 0 }} animate={{ y: Math.abs(i - mid) * 8, opacity: 1, rotate: (i - mid) * 7 }}
                transition={{ delay: 0.5 + i * 0.12, type: "spring", stiffness: 160, damping: 14 }}
                whileHover={{ y: -24, scale: 1.12, zIndex: 10 }}
                className="-mx-[10px] origin-bottom drop-shadow-[0_6px_6px_rgba(74,47,34,0.3)]" title={r.text}>
                <RuleCardView rule={r} width={104} showText={false} />
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {!!draft?.badges.length && (
            <div className="mt-3 flex gap-6">
              {draft.badges.map((b, i) => (
                <motion.div key={b} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 1.2 + i * 0.3, type: "spring", stiffness: 260, damping: 11 }} className="flex items-center gap-2">
                  <Pic src={BADGES[b].src} w={512} h={512} className="h-[72px] w-[72px]" />
                  <span className="max-w-[140px] text-left font-display text-[18px] font-bold leading-tight">{BADGES[b].label}</span>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        <div className="mt-6 flex w-full gap-4">
          <Chunky size="md" color="var(--lilac)" className="flex-1 gap-2 whitespace-nowrap pl-3 text-[24px]!" onClick={() => { sound.play("open"); setParent(true); }} silent>
            <Pic src={ui.parent} w={512} h={512} className="h-[46px] w-[46px]" />Góc phụ huynh
          </Chunky>
          <Chunky size="md" color="var(--mint)" className="flex-1" onClick={restart}>Chơi lại</Chunky>
        </div>
      </motion.div>

      <AnimatePresence>{parent && <ParentCorner onClose={() => setParent(false)} />}</AnimatePresence>
    </div>
  );
}
