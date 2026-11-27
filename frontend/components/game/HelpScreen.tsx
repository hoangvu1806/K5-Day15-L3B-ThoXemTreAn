"use client";

import { motion } from "motion/react";
import { owl, ui } from "@/lib/assets";
import { useGame } from "@/lib/store";
import { Chunky, Pic } from "./ui";

/** Tông màu dịu, không gây sợ. Không có nút "chơi tiếp": phiên đã dừng, chỉ người lớn mở lại từ đầu. */
export default function HelpScreen() {
  const { help, restart } = useGame();

  return (
    <div className="absolute inset-0">
      <Pic src={ui.illusHelp} w={1376} h={768} priority className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#fff8ec]/95 via-[#fff8ec]/55 to-transparent" />

      <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 90, damping: 18 }}
        className="panel paper-grain absolute left-[56px] top-1/2 flex w-[640px] -translate-y-1/2 flex-col px-10 py-8">
        <div className="flex items-center gap-4">
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
            <Pic src={owl("calm")} w={640} h={640} className="h-[110px] w-[110px]" />
          </motion.div>
          <h2 className="font-display text-[36px] font-extrabold leading-[1.08]">{help.title}</h2>
        </div>

        <ol className="mt-5 space-y-3">
          {help.steps.map((s, i) => (
            <motion.li key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.25 }}
              className="flex items-center gap-4">
              <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full border-[3px] border-[var(--ink)] bg-[var(--mint)] font-display text-[22px] font-extrabold">{i + 1}</span>
              <span className="text-[23px] font-bold leading-snug">{s}</span>
            </motion.li>
          ))}
        </ol>

        <motion.a href={`tel:${help.hotline}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.1 }}
          className="btn-chunky mt-7 h-[104px] justify-start! gap-5 rounded-[30px]! pl-4 pr-8" style={{ ["--c" as string]: "var(--mint)" }}>
          <motion.div animate={{ rotate: [0, -10, 10, -6, 0] }} transition={{ repeat: Infinity, duration: 2.4, repeatDelay: 1.2 }}>
            <Pic src={ui.phone} w={512} h={512} className="h-[80px] w-[80px]" />
          </motion.div>
          <div className="text-left">
            <p className="font-display text-[50px] font-extrabold leading-none">Gọi {help.hotline}</p>
            <p className="mt-1 font-sans text-[17px] font-bold text-[var(--ink-soft)]">{help.hotline_name} · miễn phí</p>
          </div>
        </motion.a>

        <div className="mt-6 flex items-center justify-between gap-4 border-t-[3px] border-dashed border-[var(--ink)]/25 pt-4">
          <p className="text-[16px] font-bold leading-snug text-[var(--ink-soft)]">Dành cho người lớn: ngồi cạnh con,<br />lắng nghe, không trách con.</p>
          <Chunky size="sm" color="var(--cream)" onClick={restart}>Về màn đầu</Chunky>
        </div>
      </motion.div>
    </div>
  );
}
