"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { bg, owlStage, ui } from "@/lib/assets";
import { owlStage as stageOf } from "@/lib/local";
import { useGame } from "@/lib/store";
import { Chunky, HelpButton, IconButton, Pic, Toast } from "./ui";

function Tile({ icon, label, onClick, color, delay }: { icon: ReactNode; label: string; onClick: () => void; color: string; delay: number }) {
  return (
    <motion.button initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: "spring", stiffness: 160, damping: 16 }}
      whileHover={{ y: -6 }} whileTap={{ scale: 0.95 }} onClick={onClick}
      className="flex h-[150px] w-[190px] flex-col items-center justify-center gap-2 rounded-[30px] border-[4px] border-[var(--ink)] shadow-[0_7px_0_var(--ink)]"
      style={{ background: color }}>
      {icon}
      <span className="font-display text-[22px] font-extrabold leading-tight">{label}</span>
    </motion.button>
  );
}

/** Màn hình chính: Tin đứng giữa, nút lớn "Chơi tiếp", các ô Bản đồ / Điện thoại, Sổ tay, Góc phụ huynh, Cài đặt. */
export default function HomeScreen() {
  const { saved, playOn, openNotebook, openHand, requestLock, setOverlay, busy, sessionId, draft, account } = useGame();
  const openAccount = () => requestLock("account", () => setOverlay("account"));
  const profile = saved.profile!;
  const age = profile.age;
  const p = saved.progress[age];
  const cards = Object.keys(p.rules).length + Object.keys(p.tactics).length;
  const stage = stageOf(cards);
  const back = saved.visits > 1 || Object.keys(p.cleared).length > 0;
  const name = age === "6-10" ? (profile.gender === "nam" ? "Bin" : "Na") : (profile.gender === "nam" ? "Khôi" : "Mai");

  return (
    <div className="absolute inset-0">
      <Pic src={bg("bg_home_main")} w={1376} h={768} priority className="absolute inset-0 h-full w-full" />
      <Toast />
      <div className="absolute inset-x-6 top-4 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pic src={ui.logo} w={512} h={512} className="h-[64px] w-[64px]" />
          <span className="text-outline font-display text-[44px] font-extrabold text-white">Grow<span className="text-[var(--sun)]">Safe</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Chunky size="sm" color={account ? "var(--mint)" : "var(--cream)"} onClick={openAccount} className="max-w-[260px]">
            <Pic src={ui.parent} w={512} h={512} className="h-[32px] w-[32px]" />
            <span className="truncate">{account ? account.username : "Tài khoản"}</span>
          </Chunky>
          <IconButton src={ui.settings} label="Cài đặt" onClick={() => setOverlay("settings")} />
          <HelpButton />
        </div>
      </div>

      <div className="absolute left-[70px] top-[120px] flex w-[560px] flex-col items-center">
        <motion.div className="relative" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
          <Pic src={owlStage(stage)} w={640} h={640} priority className="h-[360px] w-[360px]" />
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="panel-soft -mt-4 px-7 py-4 text-center">
          <p className="font-display text-[28px] font-extrabold leading-tight">
            {age === "6-10" ? (back ? "Cậu về rồi!" : "Chào cậu!") : (back ? "Bạn về rồi!" : "Chào bạn!")}
          </p>
          <p className="mt-1 text-[19px] font-bold text-[var(--ink-soft)]">
            {age === "6-10" ? `Hôm nay tớ với cậu đi cùng ${name} nhé.` : `Hôm nay bạn giúp ${name} một tay nhé.`} · {cards} thẻ · Tin nấc {stage}
          </p>
        </motion.div>
      </div>

      <div className="absolute right-[60px] top-[120px] flex w-[640px] flex-col items-center gap-6">
        <Chunky size="lg" color="var(--sun)" disabled={busy} onClick={() => void playOn()} className="h-[110px]! w-full text-[44px]!">
          {busy ? "Đang mở…" : sessionId && !draft ? "Chơi tiếp" : "Bắt đầu chơi"}
          <svg viewBox="0 0 24 24" className="h-[44px] w-[44px]" fill="var(--cream)" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round"><path d="M7 4.5v15l12-7.5z" /></svg>
        </Chunky>
        <div className="grid grid-cols-3 gap-5">
          <Tile delay={0.1} color="var(--mint)" label={age === "6-10" ? "Bản đồ" : "Điện thoại"} onClick={() => void playOn()}
            icon={<Pic src={age === "6-10" ? ui.map610 : ui.phoneFrame} w={age === "6-10" ? 1376 : 672} h={age === "6-10" ? 768 : 900} className="h-[70px] w-[110px] rounded-[10px]" />} />
          <Tile delay={0.17} color="var(--lilac)" label="Sổ tay" onClick={openNotebook}
            icon={<Pic src={ui.notebookCover} w={672} h={900} className="h-[78px] w-[60px]" />} />
          {age === "6-10" ? (
            <Tile delay={0.24} color="var(--peach)" label="Bàn tay tin cậy" onClick={openHand}
              icon={<span className="text-[60px] leading-none">✋</span>} />
          ) : (
            <Tile delay={0.24} color="var(--sky)" label="Cài đặt" onClick={() => setOverlay("settings")}
              icon={<Pic src={ui.settings} w={512} h={512} className="h-[70px] w-[70px]" />} />
          )}
          <Tile delay={0.31} color="var(--cream)" label="Góc phụ huynh" onClick={() => requestLock("parent", () => setOverlay("parent"))}
            icon={<Pic src={ui.parent} w={512} h={512} className="h-[70px] w-[70px]" />} />
          {age === "6-10" && (
            <Tile delay={0.38} color="var(--sky)" label="Cài đặt" onClick={() => setOverlay("settings")}
              icon={<Pic src={ui.settings} w={512} h={512} className="h-[70px] w-[70px]" />} />
          )}
        </div>
        <p className="flex items-center gap-2 text-[16px] font-bold text-[var(--ink-soft)]">
          <Pic src={ui.privacy} w={512} h={512} className="h-[30px] w-[30px]" />
          {account ? (
            <>Thẻ được lưu vào tài khoản {account.username}.</>
          ) : (
            <>Tiến độ và thẻ chỉ lưu trên máy này. <button onClick={openAccount} className="underline">Lưu vào tài khoản</button></>
          )}
        </p>
      </div>
    </div>
  );
}
