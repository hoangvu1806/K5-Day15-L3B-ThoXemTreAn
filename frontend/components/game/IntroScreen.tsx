"use client";

import { motion } from "motion/react";
import { bg, card, owl } from "@/lib/assets";
import { useGame } from "@/lib/store";
import type { Scenario } from "@/lib/types";
import { Chunky, Pic, TopBar, WordReveal } from "./ui";

export default function IntroScreen({ scenario }: { scenario: Scenario }) {
  const { progress, beginLevel, place, saved } = useGame();
  const age = saved.profile?.age ?? "6-10";
  const c = card[scenario.scene.card];
  const n = progress.index + 1;
  const dialogue = scenario.type === "hoi_thoai";
  const how = age === "6-10"
    ? dialogue ? "Có người nói chuyện với nhân vật của cậu. Cậu trả lời giúp nhé, nói hoặc gõ đều được." : "Cậu nghe chuyện, rồi nói hoặc gõ cách cậu sẽ làm. Bí thì bấm bóng đèn."
    : dialogue ? "Có người nhắn tin tới. Bạn trả lời thay nhân vật nhé, nói hoặc gõ đều được." : "Bạn đọc tình huống, rồi nói hoặc gõ cách bạn sẽ xử lý. Cần gợi ý thì bấm bóng đèn.";

  return (
    <div className="absolute inset-0">
      <Pic src={bg("bg_map_journey")} w={1376} h={768} priority className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/20" />
      <TopBar />

      <motion.div initial={{ opacity: 0, y: -120, rotate: 12 }} animate={{ opacity: 1, y: 0, rotate: -4 }}
        transition={{ type: "spring", stiffness: 120, damping: 13 }}
        className="absolute left-[96px] top-[150px] w-[560px] rounded-[18px] border-[4px] border-[var(--ink)] bg-white p-[14px] pb-[58px] shadow-[0_10px_0_rgba(74,47,34,0.85),0_24px_50px_rgba(74,47,34,0.25)]">
        <div className="absolute -top-[22px] left-1/2 h-[40px] w-[140px] -translate-x-1/2 rotate-[3deg] rounded-[6px] bg-[var(--sun)]/80 shadow-sm" />
        <Pic src={bg(scenario.scene.bg)} w={1376} h={768} priority className="aspect-[1376/768] w-full rounded-[10px] border-[3px] border-[var(--ink)]" />
        <p className="absolute bottom-[12px] left-0 right-0 text-center font-display text-[26px] font-bold">{scenario.title}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, type: "spring", stiffness: 140, damping: 16 }}
        className="panel paper-grain absolute right-[70px] top-[130px] flex w-[560px] flex-col items-start px-9 py-7">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border-[3px] border-[var(--ink)] bg-[var(--sun)] px-4 py-1 font-display text-[22px] font-extrabold">Màn {n} / {progress.total}</span>
          <span className="flex items-center gap-2 rounded-full border-[3px] border-[var(--ink)] px-3 py-1 font-display text-[18px] font-bold" style={{ background: c.tint }}>
            <Pic src={c.icon} w={512} h={512} className="h-[28px] w-[28px]" />{dialogue ? "Hội thoại" : c.name}
          </span>
          {scenario.draft && <span className="rounded-full border-[3px] border-[var(--ink)] bg-[var(--lilac)] px-3 py-1 font-display text-[16px] font-bold">Màn nháp, chờ duyệt</span>}
        </div>
        {place?.text && <p className="mt-4 text-[22px] font-bold italic leading-snug text-[var(--mint-deep)]"><WordReveal text={place.text} /></p>}
        <h2 className="mt-2 font-display text-[50px] font-extrabold leading-[1.02]">{scenario.title}</h2>
        {scenario.chain && <p className="mt-1 text-[17px] font-bold text-[var(--ink-soft)]">Chuỗi chuyện của Khoa · phần {scenario.chain_step}</p>}
        <p className="mt-3 text-[21px] font-semibold leading-snug text-[var(--ink-soft)]">{how}</p>
        <Chunky size="lg" color="var(--mint)" className="mt-6 self-stretch" onClick={beginLevel}>
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
