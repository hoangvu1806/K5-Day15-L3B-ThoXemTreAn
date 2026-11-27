"use client";

import { AnimatePresence, motion } from "motion/react";
import { bg, owl, tacticIcon, ui } from "@/lib/assets";
import { useGame } from "@/lib/store";
import type { TacticCard } from "@/lib/types";
import Dock from "./Dock";
import { Chunky, Pic, Toast, TopBar, WordReveal } from "./ui";

/** Thẻ chiêu: mặt sau chỉ có cách nhận ra và một câu đáp lại, không tả cách dụ. */
export function TacticCardView({ t, width = 210, found = true }: { t: TacticCard; width?: number; found?: boolean }) {
  const h = (width * 900) / 672;
  return (
    <div className="relative" style={{ width, height: h }}>
      <Pic src={ui.tacticBack} w={672} h={900} className="absolute inset-0 h-full w-full" />
      <div className="absolute left-1/2 top-[9%] -translate-x-1/2" style={{ width: width * 0.36, height: width * 0.36 }}>
        <Pic src={tacticIcon(t.code)} w={512} h={512} className={found ? "h-full w-full" : "h-full w-full opacity-60 grayscale"} />
      </div>
      <div className="absolute flex flex-col items-center text-center" style={{ left: "13%", right: "13%", top: "40%", bottom: "9%" }}>
        <p className="font-display font-extrabold leading-tight" style={{ fontSize: width * 0.075 }}>{t.name}</p>
        <p className="mt-[4%] font-semibold leading-snug" style={{ fontSize: width * 0.055 }}>{t.recognize}</p>
        <p className="mt-auto font-display font-bold italic leading-snug text-[var(--mint-deep)]" style={{ fontSize: width * 0.058 }}>“{t.reply}”</p>
      </div>
    </div>
  );
}

/** Thám tử nhận chiêu: hết màn hội thoại, trẻ tự kể người lạ đã dùng chiêu gì (de-xuat-tinh-nang.md mục 2). */
export default function DetectiveScreen() {
  const { detective, scenario, submitDetective, toReward, busy } = useGame();
  if (!detective || !scenario) return null;
  const r = detective.result;
  const age = scenario.age_group;

  return (
    <div className="absolute inset-0">
      <Pic src={bg(scenario.scene.bg)} w={1376} h={768} priority className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[rgb(255_248_236/0.7)]" />
      <TopBar />
      <Toast />

      <div className="absolute left-[40px] top-[100px] flex w-[420px] flex-col items-center">
        <motion.div animate={{ rotate: [-3, 3, -3] }} transition={{ repeat: Infinity, duration: 3 }}>
          <Pic src={owl(busy ? "think" : r ? (r.found.length ? "happy" : "explain") : "curious")} w={640} h={640} className="h-[260px] w-[260px]" />
        </motion.div>
        <div className="panel-soft mt-2 w-full px-6 py-4">
          <p className="font-display text-[15px] font-extrabold uppercase tracking-wide text-[var(--coral)]">Thám tử nhận chiêu</p>
          <p className="mt-1 text-[22px] font-bold leading-snug">{detective.question}</p>
        </div>
      </div>

      <div className="absolute bottom-[28px] left-[490px] right-[40px] top-[100px] flex flex-col gap-4">
        <AnimatePresence mode="wait">
          {!r ? (
            <motion.div key="ask" className="flex flex-1 flex-col justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="panel paper-grain mb-4 px-6 py-4 text-[20px] font-semibold leading-snug text-[var(--ink-soft)]">
                {age === "6-10" ? "Cậu kể bằng lời của cậu nhé. Không nhớ cũng không sao, Tin sẽ chỉ lại." : "Bạn kể bằng lời của bạn. Không nhớ cũng không sao, Tin sẽ chỉ lại."}
              </p>
              <div className="h-[200px]"><Dock age={age} allowHint={false} onSend={(t) => void submitDetective(t)} /></div>
            </motion.div>
          ) : (
            <motion.div key="res" className="flex flex-1 flex-col gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="panel-soft px-6 py-4 text-[21px] font-bold leading-snug"><WordReveal text={r.feedback} /></div>
              <div className="flex flex-1 items-start gap-4 overflow-hidden">
                {r.found.map((t, i) => (
                  <motion.div key={t.code} initial={{ rotateY: -180, scale: 0.4 }} animate={{ rotateY: 0, scale: 1 }} transition={{ delay: 0.2 + i * 0.2, type: "spring" }}>
                    <TacticCardView t={t} />
                    <p className="mt-1 text-center font-display text-[16px] font-bold text-[var(--mint-deep)]">Thẻ mới!</p>
                  </motion.div>
                ))}
                {r.missed.map((t) => (
                  <div key={t.code} className="opacity-90">
                    <TacticCardView t={t} found={false} />
                    <p className="mt-1 text-center font-display text-[16px] font-bold text-[var(--ink-soft)]">Lần sau nhận ra nhé</p>
                  </div>
                ))}
              </div>
              <Chunky size="lg" color="var(--sun)" onClick={toReward} silent className="self-end">Nhận thẻ quy tắc</Chunky>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
