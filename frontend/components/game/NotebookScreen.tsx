"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { RULE_CODES, TACTIC_CODES, owlStage, ui } from "@/lib/assets";
import { owlStage as stageOf } from "@/lib/local";
import { sound } from "@/lib/sound";
import { useGame } from "@/lib/store";
import type { RuleCard, TacticCard } from "@/lib/types";
import { TacticCardView } from "./DetectiveScreen";
import { RuleCardView } from "./RewardScreen";
import { Chunky, HelpButton, Modal, Pic } from "./ui";

function Empty({ width }: { width: number }) {
  return <div style={{ width, height: (width * 900) / 672 }}><Pic src={ui.slotEmpty} w={672} h={900} className="h-full w-full opacity-70" /></div>;
}

/** Sổ tay: thẻ quy tắc và thẻ chiêu đã nhận. Chạy trên máy, mất mạng vẫn mở được. */
export default function NotebookScreen() {
  const { saved, goHome, openMap, sessionId, draft, say } = useGame();
  const age = saved.profile?.age ?? "6-10";
  const p = saved.progress[age];
  const [tab, setTab] = useState<"rule" | "tactic">("rule");
  const [open, setOpen] = useState<{ rule?: RuleCard; tactic?: TacticCard } | null>(null);
  const rules = RULE_CODES(age);
  const tactics = TACTIC_CODES(age);
  const total = Object.keys(p.rules).length + Object.keys(p.tactics).length;

  const show = (o: { rule?: RuleCard; tactic?: TacticCard }) => {
    sound.play("flip");
    setOpen(o);
    say([{ file: o.rule?.voice ?? o.tactic?.voice ?? "" }]);
  };

  return (
    <div className="absolute inset-0">
      <Pic src={ui.notebookPage} w={1376} h={768} priority className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-x-6 top-4 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Chunky size="sm" color="var(--cream)" onClick={goHome}>Về nhà</Chunky>
          {sessionId && !draft && <Chunky size="sm" color="var(--mint)" onClick={openMap}>{age === "6-10" ? "Về bản đồ" : "Về điện thoại"}</Chunky>}
        </div>
        <div className="flex items-center gap-3">
          <Pic src={owlStage(stageOf(total))} w={640} h={640} className="h-[60px] w-[60px]" />
          <span className="font-display text-[22px] font-bold">{total} thẻ</span>
          <HelpButton />
        </div>
      </div>

      <div className="absolute left-1/2 top-[90px] flex -translate-x-1/2 gap-3">
        {(["rule", "tactic"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); sound.play("page"); }}
            className={clsx("h-[54px] rounded-full border-[4px] border-[var(--ink)] px-7 font-display text-[22px] font-extrabold",
              tab === t ? "bg-[var(--sun)] shadow-[0_5px_0_var(--ink)]" : "bg-white/80")}>
            {t === "rule" ? `Thẻ quy tắc · ${rules.filter((c) => c in p.rules).length}/${rules.length}` : `Thẻ chiêu · ${tactics.filter((c) => c in p.tactics).length}/${tactics.length}`}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
          className="absolute inset-x-[90px] bottom-[40px] top-[170px] flex flex-wrap content-start justify-center gap-x-5 gap-y-4">
          {tab === "rule"
            ? rules.map((code) => p.rules[code] ? (
              <motion.button key={code} whileHover={{ y: -8, rotate: -1 }} onClick={() => show({ rule: p.rules[code] })}>
                <RuleCardView rule={p.rules[code]} width={150} showText={false} />
                <p className="w-[150px] truncate text-center font-display text-[15px] font-bold">{p.rules[code].title}</p>
              </motion.button>
            ) : <div key={code}><Empty width={150} /><p className="text-center font-display text-[15px] font-bold text-[var(--ink-soft)]">?</p></div>)
            : tactics.map((code) => p.tactics[code] ? (
              <motion.button key={code} whileHover={{ y: -8, rotate: 1 }} onClick={() => show({ tactic: p.tactics[code] })}>
                <TacticCardView t={p.tactics[code]} width={150} />
              </motion.button>
            ) : <Empty key={code} width={150} />)}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <Modal onClose={() => setOpen(null)} z={60}>
            <motion.div initial={{ rotateY: 180 }} animate={{ rotateY: 0 }} transition={{ type: "spring", stiffness: 80, damping: 14 }} className="flex flex-col items-center gap-4">
              {open.rule ? <RuleCardView rule={open.rule} width={420} /> : open.tactic ? <TacticCardView t={open.tactic} width={420} /> : null}
              <Chunky size="md" color="var(--cream)" onClick={() => setOpen(null)}>Đóng</Chunky>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
