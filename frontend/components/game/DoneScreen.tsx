"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { badge, owlStage, ui } from "@/lib/assets";
import { owlStage as stageOf } from "@/lib/local";
import { sound } from "@/lib/sound";
import { useGame } from "@/lib/store";
import { RuleCardView } from "./RewardScreen";
import { Chunky, Pic, useFitText } from "./ui";

export default function DoneScreen() {
  const { progress, draft, saved, goHome, setOverlay } = useGame();
  const age = saved.profile?.age ?? "6-10";
  const p = saved.progress[age];
  const owned = Object.values(p.rules).slice(-6);
  const stage = stageOf(Object.keys(p.rules).length + Object.keys(p.tactics).length);
  const max = Math.max(1, progress.index) * 3;
  const byeRef = useFitText<HTMLParagraphElement>(draft?.bye?.text ?? "", 22, 14);

  useEffect(() => {
    if (saved.settings.reducedMotion) return;
    const end = Date.now() + 1600;
    const colors = ["#ffd45c", "#9fe3c4", "#ffb08f", "#9bd8f5", "#d6c1f7"];
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.6 }, colors, disableForReducedMotion: true });
      confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.6 }, colors, disableForReducedMotion: true });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [saved.settings.reducedMotion]);

  useEffect(() => {
    if (draft?.badges.length) {
      const t = setTimeout(() => sound.play("badge"), 1400);
      return () => clearTimeout(t);
    }
  }, [draft?.badges.length]);

  const leave = () => {
    useGame.setState({ sessionId: "", draft: null, map: [], progress: { index: 0, total: 5, stars: 0 } });
    goHome();
  };

  return (
    <div className="absolute inset-0">
      <Pic src={ui.illusDone} w={1376} h={768} priority className="absolute inset-0 h-full w-full" />
      <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} className="absolute bottom-[40px] left-[60px] flex items-end gap-2">
        <Pic src={owlStage(stage)} w={640} h={640} className="h-[220px] w-[220px]" />
        {draft?.bye?.text && <div className="panel-soft mb-[120px] w-[300px] px-5 py-3"><p ref={byeRef} className="max-h-[110px] overflow-hidden font-bold leading-snug">{draft.bye.text}</p></div>}
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 110, damping: 16, delay: 0.2 }}
        className="panel paper-grain absolute right-[48px] top-[60px] flex w-[620px] flex-col items-center px-9 pb-7 pt-6 text-center">
        <h2 className="font-display text-[52px] font-extrabold leading-none">Hoàn thành!</h2>
        <p className="mt-2 text-[20px] font-bold text-[var(--ink-soft)]">
          {age === "6-10" ? "Cậu đã tập nói KHÔNG, rời đi và kể với người lớn." : "Bạn đã xử lý xong các tình huống hôm nay."}
        </p>
        <div className="mt-4 flex items-center gap-3 rounded-full border-[4px] border-[var(--ink)] bg-[var(--sun)] py-1 pl-2 pr-6 shadow-[0_5px_0_var(--ink)]">
          <Pic src={ui.starOn} w={512} h={512} className="h-[52px] w-[52px]" />
          <span className="font-display text-[32px] font-extrabold">{progress.stars} / {max}</span>
        </div>
        <div className="mt-4 flex h-[140px] items-end justify-center">
          {owned.map((r, i) => {
            const mid = (owned.length - 1) / 2;
            return (
              <motion.div key={r.code} initial={{ y: 120, opacity: 0 }} animate={{ y: Math.abs(i - mid) * 8, opacity: 1, rotate: (i - mid) * 7 }}
                transition={{ delay: 0.5 + i * 0.12, type: "spring", stiffness: 160, damping: 14 }} whileHover={{ y: -24, scale: 1.12, zIndex: 10 }}
                className="-mx-[10px] origin-bottom drop-shadow-[0_6px_6px_rgba(74,47,34,0.3)]" title={r.text}>
                <RuleCardView rule={r} width={96} showText={false} />
              </motion.div>
            );
          })}
        </div>
        <AnimatePresence>
          {!!draft?.badges.length && (
            <div className="mt-3 flex flex-wrap justify-center gap-5">
              {draft.badges.map((b, i) => (
                <motion.div key={b} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 1.2 + i * 0.3, type: "spring", stiffness: 260, damping: 11 }} className="flex items-center gap-2">
                  <Pic src={badge[b].src} w={512} h={512} className="h-[64px] w-[64px]" />
                  <span className="max-w-[120px] text-left font-display text-[17px] font-bold leading-tight">{badge[b].label}</span>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
        <div className="mt-6 flex w-full gap-4">
          <Chunky size="md" color="var(--lilac)" className="flex-1 gap-2 whitespace-nowrap pl-3 text-[23px]!" silent
            onClick={() => setOverlay("parent")}>
            <Pic src={ui.parent} w={512} h={512} className="h-[44px] w-[44px]" />Góc phụ huynh
          </Chunky>
          <Chunky size="md" color="var(--mint)" className="flex-1" onClick={leave}>Về nhà</Chunky>
        </div>
      </motion.div>
    </div>
  );
}
