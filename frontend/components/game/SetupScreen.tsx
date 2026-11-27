"use client";

import clsx from "clsx";
import { motion } from "motion/react";
import { bg, owl, ui } from "@/lib/assets";
import { sound } from "@/lib/sound";
import { useGame } from "@/lib/store";
import type { AgeGroup, Gender } from "@/lib/types";
import { Chunky, Pic, SoundButtons, Toast } from "./ui";

const AGES: { id: AgeGroup; label: string; icon: string; color: string }[] = [
  { id: "6-10", label: "6 – 10 tuổi", icon: ui.age610, color: "var(--mint)" },
  { id: "11-15", label: "11 – 15 tuổi", icon: ui.age1115, color: "var(--sky)" },
];
const GENDERS: { id: Gender; label: string; icon: string }[] = [
  { id: "nam", label: "Nam", icon: ui.genderBoy },
  { id: "nu", label: "Nữ", icon: ui.genderGirl },
  { id: "khong_noi", label: "Không muốn nói", icon: ui.genderNeutral },
];

const pop = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

function Check() {
  return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}
      className="absolute -right-3 -top-3 flex h-[40px] w-[40px] items-center justify-center rounded-full border-[4px] border-[var(--ink)] bg-[var(--mint-deep)]">
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    </motion.div>
  );
}

function StepLabel({ n, children, hint }: { n: number; children: string; hint?: string }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <span className="flex h-[32px] w-[32px] items-center justify-center rounded-full border-[3px] border-[var(--ink)] bg-[var(--sun)] font-display text-[18px] font-extrabold">{n}</span>
      <span className="font-display text-[24px] font-bold">{children}</span>
      {hint && <span className="text-[16px] font-semibold text-[var(--ink-soft)]">{hint}</span>}
    </div>
  );
}

export default function SetupScreen() {
  const { age, gender, setAge, setGender, start, busy } = useGame();

  return (
    <div className="absolute inset-0">
      <Pic src={bg("bg_home_main")} w={1376} h={768} priority className="absolute inset-0 h-full w-full" />

      <Toast />

      {/* Bên trái: tên game + bạn cú chào */}
      <div className="absolute left-[56px] top-[46px] w-[600px]">
        <motion.div initial={{ opacity: 0, scale: 0.6, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 14 }} className="flex items-center gap-4">
          <Pic src={ui.logo} w={512} h={512} priority className="h-[118px] w-[118px] drop-shadow-[0_6px_0_rgba(74,47,34,0.25)]" />
          <div>
            <h1 className="text-outline font-display text-[92px] font-extrabold leading-[0.9] tracking-tight text-white">
              Grow<span className="text-[var(--sun)]">Safe</span>
            </h1>
            <p className="text-outline mt-1 font-display text-[28px] font-bold text-[var(--mint)]" style={{ WebkitTextStrokeWidth: 5 }}>
              Tập phản xạ tự bảo vệ
            </p>
          </div>
        </motion.div>

        <div className="relative mt-[36px] h-[440px]">
          <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, type: "spring", stiffness: 120, damping: 14 }}
            className="absolute bottom-0 left-0">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}>
              <Pic src={owl("welcome")} w={640} h={640} priority className="h-[330px] w-[330px]" />
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 18 }}
            className="panel-soft bubble bubble-left absolute left-[300px] top-[60px] w-[300px] origin-bottom-left px-6 py-5">
            <p className="font-display text-[25px] font-extrabold leading-snug">Chào con!<br />Mình là bạn cú.</p>
            <p className="mt-1 text-[19px] font-semibold leading-snug text-[var(--ink-soft)]">
              Cùng tập nói <b className="text-[var(--coral)]">KHÔNG</b>, rời đi và kể với người lớn tin cậy nhé!
            </p>
          </motion.div>
        </div>
      </div>

      {/* Bên phải: bố mẹ, thầy cô chọn giúp con */}
      <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.08, delayChildren: 0.2 }}
        className="panel paper-grain absolute right-[40px] top-[36px] flex w-[628px] flex-col px-8 pb-6 pt-5">
        <motion.div variants={pop} className="mb-2 flex items-center gap-3">
          <Pic src={ui.parent} w={512} h={512} className="h-[46px] w-[46px]" />
          <p className="flex-1 font-display text-[22px] font-bold text-[var(--ink-soft)]">Bố mẹ, thầy cô chọn giúp con</p>
          <SoundButtons />
        </motion.div>

        <motion.div variants={pop}>
          <StepLabel n={1}>Con mấy tuổi?</StepLabel>
          <div className="grid grid-cols-2 gap-4">
            {AGES.map((a) => {
              const on = age === a.id;
              return (
                <motion.button key={a.id} whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }}
                  onClick={() => { setAge(a.id); sound.play("select"); }}
                  className={clsx("relative flex h-[112px] items-center gap-3 rounded-[26px] border-[4px] border-[var(--ink)] px-4 text-left transition-colors",
                    on ? "shadow-[0_6px_0_var(--ink)]" : "bg-white/70 shadow-[0_3px_0_rgba(74,47,34,0.5)]")}
                  style={{ background: on ? a.color : undefined }}>
                  <Pic src={a.icon} w={512} h={512} className="h-[88px] w-[88px] shrink-0" />
                  <span className="whitespace-nowrap font-display text-[27px] font-extrabold leading-tight">{a.label}</span>
                  {on && <Check />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={pop} className="mt-[14px]">
          <StepLabel n={2} hint="(không bắt buộc)">Giới tính</StepLabel>
          <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-4">
            {GENDERS.map((g) => {
              const on = gender === g.id;
              return (
                <motion.button key={g.id} whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }}
                  onClick={() => { setGender(g.id); sound.play("select"); }}
                  className={clsx("relative flex h-[84px] items-center gap-2 rounded-[24px] border-[4px] border-[var(--ink)] px-3 transition-colors",
                    on ? "bg-[var(--sun)] shadow-[0_6px_0_var(--ink)]" : "bg-white/70 shadow-[0_3px_0_rgba(74,47,34,0.5)]")}>
                  <Pic src={g.icon} w={512} h={512} className="h-[56px] w-[56px] shrink-0" />
                  <span className="pr-3 font-display text-[19px] font-bold leading-[1.05]">{g.label}</span>
                  {on && <Check />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={pop} className="mt-[14px]">
          <StepLabel n={3}>Chế độ hội thoại</StepLabel>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative flex h-[60px] items-center gap-3 rounded-[22px] border-[4px] border-[var(--ink)] bg-[var(--mint)] px-3 shadow-[0_5px_0_var(--ink)]">
              <Pic src={ui.modeScript} w={512} h={512} className="h-[46px] w-[46px]" />
              <span className="font-display text-[20px] font-bold leading-tight">Kịch bản có sẵn</span>
              <Check />
            </div>
            <div className="relative flex h-[60px] items-center gap-3 rounded-[22px] border-[4px] border-dashed border-[var(--ink-soft)] bg-white/50 px-3 opacity-75"
              title="Chế độ AI đóng vai người lạ chưa mở trong bản này">
              <Pic src={ui.modeAi} w={512} h={512} className="h-[46px] w-[46px] grayscale-[0.4]" />
              <span className="font-display text-[20px] font-bold leading-tight text-[var(--ink-soft)]">AI đóng vai</span>
              <span className="absolute -right-2 -top-3 rotate-6 rounded-full border-[3px] border-[var(--ink)] bg-[var(--lilac)] px-3 py-[1px] font-display text-[15px] font-bold">Sắp có</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={pop} className="mt-5 flex items-center gap-5">
          <Chunky size="lg" color="var(--sun)" disabled={busy} silent onClick={() => { sound.play("select"); void start(); }} className="flex-1">
            {busy ? "Đang mở…" : "Bắt đầu chơi"}
            {!busy && (
              <motion.svg animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} viewBox="0 0 24 24" className="h-[34px] w-[34px]" fill="var(--cream)" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round">
                <path d="M7 4.5v15l12-7.5z" />
              </motion.svg>
            )}
          </Chunky>
        </motion.div>

        <motion.div variants={pop} className="mt-3 flex items-center gap-3 rounded-[20px] bg-[var(--mint)]/35 px-3 py-2">
          <Pic src={ui.privacy} w={512} h={512} className="h-[42px] w-[42px] shrink-0" />
          <p className="text-[16px] font-bold leading-snug text-[var(--ink-soft)]">Game không hỏi tên, không lưu thông tin của con. Bản nhận xét cuối phiên chỉ là bản nháp cho người lớn đọc.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
