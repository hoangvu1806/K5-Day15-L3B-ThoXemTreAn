"use client";

import { motion } from "motion/react";
import { bg, card, owl } from "@/lib/assets";
import { useGame } from "@/lib/store";
import type { Scenario } from "@/lib/types";
import { Chunky, HelpButton, Pic, ProgressTrail, SoundButtons, StarPill } from "./ui";

export default function IntroScreen({ scenario }: { scenario: Scenario }) {
  const { progress, beginLevel, age } = useGame();
  const c = card[scenario.scene.card];
  const n = progress.index + 1;

  return (
    <div className="absolute inset-0">
      <Pic src={bg("bg_map_journey")} w={1376} h={768} priority className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/20" />

      <div className="absolute inset-x-6 top-5 flex items-center justify-between">
        <StarPill stars={progress.stars} />
        <div className="panel-soft rounded-full! px-5 py-2"><ProgressTrail index={progress.index} total={progress.total} /></div>
        <div className="flex items-center gap-3"><SoundButtons /><HelpButton /></div>
      </div>

      {/* Ảnh cảnh màn chơi kiểu ảnh polaroid ghim trên bản đồ */}
      <motion.div initial={{ opacity: 0, y: -120, rotate: 12 }} animate={{ opacity: 1, y: 0, rotate: -4 }}
        transition={{ type: "spring", stiffness: 120, damping: 13 }}
        className="absolute left-[96px] top-[150px] w-[560px] rounded-[18px] border-[4px] border-[var(--ink)] bg-white p-[14px] pb-[58px] shadow-[0_10px_0_rgba(74,47,34,0.85),0_24px_50px_rgba(74,47,34,0.25)]">
        <div className="absolute -top-[22px] left-1/2 h-[40px] w-[140px] -translate-x-1/2 rotate-[3deg] rounded-[6px] bg-[var(--sun)]/80 shadow-sm" />
        <Pic src={bg(scenario.scene.bg)} w={1376} h={768} priority className="aspect-[1376/768] w-full rounded-[10px] border-[3px] border-[var(--ink)]" />
        <p className="absolute bottom-[12px] left-0 right-0 text-center font-display text-[26px] font-bold">{scenario.title}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, type: "spring", stiffness: 140, damping: 16 }}
        className="panel paper-grain absolute right-[70px] top-[150px] flex w-[560px] flex-col items-start px-9 py-8">
        <div className="flex items-center gap-3">
          <span className="rounded-full border-[3px] border-[var(--ink)] bg-[var(--sun)] px-4 py-1 font-display text-[22px] font-extrabold">Màn {n} / {progress.total}</span>
          <span className="flex items-center gap-2 rounded-full border-[3px] border-[var(--ink)] px-3 py-1 font-display text-[18px] font-bold" style={{ background: c.tint }}>
            <Pic src={c.icon} w={512} h={512} className="h-[28px] w-[28px]" />{c.name}
          </span>
        </div>
        <h2 className="mt-4 font-display text-[52px] font-extrabold leading-[1.02]">{scenario.title}</h2>
        <p className="mt-3 text-[21px] font-semibold leading-snug text-[var(--ink-soft)]">
          {age === "6-10" ? "Con đọc tình huống, rồi bấm cách con sẽ làm. Con cũng có thể tự gõ câu trả lời." : "Em đọc tình huống, rồi chọn cách em sẽ làm. Em cũng có thể tự gõ câu trả lời của mình."}
        </p>
        <Chunky size="lg" color="var(--mint)" className="mt-7 self-stretch" onClick={beginLevel}>
          Vào màn chơi
          <svg viewBox="0 0 24 24" className="h-[34px] w-[34px]" fill="var(--cream)" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round"><path d="M7 4.5v15l12-7.5z" /></svg>
        </Chunky>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 120 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, type: "spring", stiffness: 160, damping: 14 }}
        className="absolute bottom-[-18px] right-[600px]">
        <motion.div animate={{ rotate: [-3, 3, -3] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} style={{ transformOrigin: "50% 90%" }}>
          <Pic src={owl("explain")} w={640} h={640} className="h-[250px] w-[250px]" />
        </motion.div>
      </motion.div>
    </div>
  );
}
