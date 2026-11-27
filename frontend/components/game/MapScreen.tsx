"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { MAP_610, app, bg, owl, pin, ui } from "@/lib/assets";
import { useGame } from "@/lib/store";
import type { MapPlace } from "@/lib/types";
import { Chunky, Pic, Toast, TopBar, WordReveal } from "./ui";

function placeState(p: MapPlace, cleared: Record<string, boolean>) {
  const done = p.scenes.every((s) => s.id in cleared);
  const fresh = p.scenes.some((s) => s.open && !(s.id in cleared));
  const drafts = p.scenes.some((s) => s.draft);
  return { done, fresh, drafts };
}

function Arrow() {
  return (
    <motion.div className="absolute -top-[54px] left-1/2 -translate-x-1/2" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
      <svg viewBox="0 0 24 24" className="h-[44px] w-[44px]" fill="var(--sun)" stroke="var(--ink)" strokeWidth="2.4" strokeLinejoin="round"><path d="M12 21L4 11h5V3h6v8h5z" /></svg>
    </motion.div>
  );
}

function Map610() {
  const { map, suggest, saved, openLocation, busy } = useGame();
  const cleared = saved.progress["6-10"].cleared;
  return (
    <>
      <Pic src={ui.map610} w={1376} h={768} priority className="absolute inset-0 h-full w-full" />
      {map.map((p, i) => {
        const pos = MAP_610[p.id];
        if (!pos) return null;
        const st = placeState(p, cleared);
        return (
          <motion.button key={p.id} disabled={busy} onClick={() => void openLocation(p.id)}
            initial={{ scale: 0, y: -40 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 220, damping: 14 }}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
            className="absolute flex w-[150px] -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: pos.x, top: pos.y }}>
            {suggest === p.id && <Arrow />}
            <div className="relative h-[120px] w-[120px]">
              {st.done && <motion.div className="absolute inset-[-14px] rounded-full bg-[var(--sun)]/50 blur-[14px]" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} />}
              <Pic src={pin(p.id, st.done)} w={512} h={512} className="relative h-full w-full drop-shadow-[0_6px_0_rgba(74,47,34,0.35)]" />
              {st.fresh && <span className="absolute right-[6px] top-[6px] h-[22px] w-[22px] rounded-full border-[3px] border-white bg-[var(--coral)]" />}
            </div>
            <span className="panel-soft -mt-2 rounded-full! px-4 py-[2px] font-display text-[20px] font-extrabold">{p.label}</span>
            {st.drafts && <span className="mt-1 rounded-full bg-[var(--lilac)] px-2 text-[13px] font-bold">có màn nháp</span>}
          </motion.button>
        );
      })}
    </>
  );
}

function Phone1115() {
  const { map, suggest, saved, openLocation, busy, name } = useGame();
  const cleared = saved.progress["11-15"].cleared;
  const inPhone = map.filter((p) => p.id !== "family");
  const outside = map.find((p) => p.id === "family");
  return (
    <>
      <Pic src={bg("bg_teen_desk")} w={1376} h={768} priority className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-white/20" />
      <motion.div initial={{ y: 80, opacity: 0, rotate: -3 }} animate={{ y: 0, opacity: 1, rotate: -2 }} transition={{ type: "spring", stiffness: 120, damping: 15 }}
        className="absolute left-[150px] top-[96px] h-[650px] w-[485px]">
        <Pic src={ui.phoneFrame} w={672} h={900} priority className="absolute inset-0 h-full w-full" />
        <div className="absolute left-[16%] right-[16%] top-[12%] flex flex-col items-center">
          <p className="font-display text-[44px] font-extrabold leading-none">{new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</p>
          <p className="mt-1 font-display text-[18px] font-bold text-[var(--ink-soft)]">Điện thoại của {name}</p>
          <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5">
            {inPhone.map((p, i) => {
              const st = placeState(p, cleared);
              return (
                <motion.button key={p.id} disabled={busy} onClick={() => void openLocation(p.id)}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.25 + i * 0.08, type: "spring" }}
                  whileTap={{ scale: 0.9 }} className="relative flex w-[120px] flex-col items-center">
                  {suggest === p.id && <Arrow />}
                  <div className={clsx("relative h-[96px] w-[96px] rounded-[26px]", st.done && "ring-[5px] ring-[var(--sun)]")}>
                    <Pic src={app(p.id)} w={512} h={512} className="h-full w-full" />
                    {st.fresh && <span className="absolute -right-1 -top-1 h-[24px] w-[24px] rounded-full border-[3px] border-white bg-[var(--coral)]" />}
                  </div>
                  <span className="mt-1 text-center font-display text-[17px] font-bold leading-tight">{p.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
      {outside && (() => {
        const st = placeState(outside, cleared);
        return (
          <motion.button disabled={busy} onClick={() => void openLocation(outside.id)} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }} whileHover={{ y: -4 }}
            className={clsx("panel-soft absolute left-[680px] top-[560px] flex items-center gap-3 px-5 py-3", st.done && "ring-[5px] ring-[var(--sun)]")}>
            {suggest === outside.id && <Arrow />}
            <Pic src={app("family")} w={512} h={512} className="h-[70px] w-[70px]" />
            <span className="text-left font-display text-[22px] font-extrabold leading-tight">{outside.label}<br /><span className="text-[15px] text-[var(--ink-soft)]">ngoài điện thoại</span></span>
            {st.fresh && <span className="h-[20px] w-[20px] rounded-full bg-[var(--coral)]" />}
          </motion.button>
        );
      })()}
    </>
  );
}

export default function MapScreen() {
  const { saved, mapLine, endSession, progress, busy, showDrafts } = useGame();
  const age = saved.profile?.age ?? "6-10";
  const owlPos = age === "6-10" ? "left-[470px] bottom-[10px]" : "left-[690px] bottom-[250px]";

  return (
    <div className="absolute inset-0">
      {age === "6-10" ? <Map610 /> : <Phone1115 />}
      <TopBar />
      <Toast />

      <div className={clsx("absolute z-20 flex items-end", owlPos)}>
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.6 }}>
          <Pic src={owl(busy ? "think" : "explain")} w={640} h={640} className="h-[170px] w-[170px]" />
        </motion.div>
        <AnimatePresence mode="wait">
          {mapLine?.text && (
            <motion.div key={mapLine.text} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="panel-soft mb-[70px] w-[360px] px-5 py-3">
              <p className="text-[20px] font-bold leading-snug"><WordReveal text={mapLine.text} /></p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-[22px] right-[26px] z-20 flex flex-col items-end gap-2">
        {showDrafts && <span className="rounded-full bg-[var(--lilac)] px-3 py-1 text-[14px] font-bold">Đang bật màn nháp để nhóm duyệt</span>}
        {progress.index > 0 && (
          <Chunky size="sm" color="var(--cream)" onClick={() => void endSession()}>Nghỉ thôi</Chunky>
        )}
      </div>
    </div>
  );
}
