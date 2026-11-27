"use client";

import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { useEffect } from "react";
import { card, owl, ui } from "@/lib/assets";
import { sound } from "@/lib/sound";
import { useGame } from "@/lib/store";
import type { RuleCard } from "@/lib/types";
import { Chunky, Pic } from "./ui";

/** Thẻ quy tắc dựng trên khung ảnh 672×900: biểu tượng nằm đúng vòng tròn, chữ nằm trong vùng kem. */
export function RuleCardView({ rule, width, showText = true }: { rule: RuleCard; width: number; showText?: boolean }) {
  const c = card[rule.card];
  const h = (width * 900) / 672;
  return (
    <div className="relative" style={{ width, height: h }}>
      <Pic src={c.frame} w={672} h={900} className="absolute inset-0 h-full w-full" />
      <div className="absolute" style={{ left: "39.6%", width: "20.8%", top: "10.4%", aspectRatio: "1" }}>
        <Pic src={c.icon} w={512} h={512} className="h-full w-full" />
      </div>
      {showText && (
        <div className="absolute flex flex-col items-center text-center" style={{ left: "20%", right: "20%", top: "31%", bottom: "17%" }}>
          <span className="font-display font-bold uppercase tracking-wide" style={{ fontSize: width * 0.045, color: "var(--ink-soft)" }}>{c.name}</span>
          <div className="my-[4%] h-[3px] w-[40%] rounded-full" style={{ background: c.tint }} />
          <p className="flex flex-1 items-center font-display font-extrabold leading-[1.18]" style={{ fontSize: width * (rule.text.length > 50 ? 0.066 : 0.075) }}>
            {rule.text}
          </p>
          <span className="font-semibold" style={{ fontSize: width * 0.038, color: "var(--ink-soft)" }}>{rule.title}</span>
        </div>
      )}
    </div>
  );
}

function Rays({ color }: { color: string }) {
  return (
    <motion.div className="absolute left-[400px] top-[384px] h-[1400px] w-[1400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
      animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
      style={{
        background: `repeating-conic-gradient(${color} 0deg 10deg, transparent 10deg 20deg)`,
        maskImage: "radial-gradient(circle, black 10%, transparent 55%)",
        WebkitMaskImage: "radial-gradient(circle, black 10%, transparent 55%)",
      }} />
  );
}

export default function RewardScreen() {
  const { reward, nextLevel, age } = useGame();

  useEffect(() => {
    if (!reward || reward.stars < 2) return;
    const t = setTimeout(() => {
      const opts = { particleCount: 70, spread: 75, startVelocity: 48, ticks: 220, scalar: 1.1,
        colors: ["#ffd45c", "#9fe3c4", "#ffb08f", "#9bd8f5", "#d6c1f7"], disableForReducedMotion: true };
      confetti({ ...opts, origin: { x: 0.2, y: 0.7 }, angle: 60 });
      confetti({ ...opts, origin: { x: 0.8, y: 0.7 }, angle: 120 });
    }, 650);
    return () => clearTimeout(t);
  }, [reward]);

  useEffect(() => {
    if (!reward) return;
    const timers = Array.from({ length: reward.stars }).map((_, i) => setTimeout(() => sound.play("select"), 1000 + i * 260));
    return () => timers.forEach(clearTimeout);
  }, [reward]);

  if (!reward) return null;
  const c = card[reward.rule.card];
  const you = age === "6-10" ? "Con" : "Em";
  const passed = !reward.correctAnswer;

  return (
    <motion.div className="absolute inset-0 z-30 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-[rgb(74_47_34/0.45)] backdrop-blur-[3px]" />
      <Rays color={c.tint} />

      <motion.div className="absolute left-[400px] top-[384px]" style={{ x: "-50%", y: "-50%", perspective: 1400 }}>
        <motion.div initial={{ rotateY: -200, scale: 0.3, y: 200 }} animate={{ rotateY: 0, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 70, damping: 12, mass: 1.1 }}
          style={{ transformStyle: "preserve-3d" }}
          className="drop-shadow-[0_24px_30px_rgba(74,47,34,0.45)]">
          <motion.div animate={{ y: [0, -10, 0], rotate: [-1.5, 1.5, -1.5] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1.2 }}>
            <RuleCardView rule={reward.rule} width={440} />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, type: "spring", stiffness: 120, damping: 16 }}
        className="panel paper-grain absolute right-[70px] top-1/2 flex w-[560px] -translate-y-1/2 flex-col items-center px-9 py-8 text-center">
        <p className="font-display text-[42px] font-extrabold leading-tight">
          {passed ? `${you} nhận được thẻ mới!` : "Mình cùng nhớ thẻ này nhé"}
        </p>
        <div className="mt-3 flex gap-3">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.9 + i * 0.26, type: "spring", stiffness: 300, damping: 12 }}>
              <Pic src={i < reward.stars ? ui.starOn : ui.starOff} w={512} h={512} className="h-[92px] w-[92px]" />
            </motion.div>
          ))}
        </div>

        {!passed && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
            className="mt-5 w-full rounded-[22px] border-[3px] border-dashed border-[var(--ink-soft)] bg-[var(--mint)]/30 px-5 py-3 text-left">
            <p className="font-display text-[19px] font-bold text-[var(--ink-soft)]">Cách an toàn là:</p>
            <p className="text-[21px] font-extrabold leading-snug">{reward.correctAnswer}</p>
          </motion.div>
        )}

        <div className="mt-6 flex w-full items-center gap-4">
          <Pic src={owl(passed ? "happy" : "encourage")} w={640} h={640} className="h-[110px] w-[110px] shrink-0" />
          <Chunky size="lg" color="var(--mint)" onClick={nextLevel} className="flex-1">
            {reward.next ? "Màn tiếp theo" : "Xem kết quả"}
          </Chunky>
        </div>
      </motion.div>
    </motion.div>
  );
}
