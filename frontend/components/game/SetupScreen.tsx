"use client";

import clsx from "clsx";
import { motion } from "motion/react";
import { useState } from "react";
import { bg, kid, owl, ui } from "@/lib/assets";
import type { Profile } from "@/lib/local";
import { sound } from "@/lib/sound";
import { useGame } from "@/lib/store";
import type { AgeGroup, Gender } from "@/lib/types";
import { Chunky, Pic, Toast } from "./ui";

const AGES: { id: AgeGroup; label: string; icon: string; color: string }[] = [
  { id: "6-10", label: "6 – 10 tuổi", icon: ui.age610, color: "var(--mint)" },
  { id: "11-15", label: "11 – 15 tuổi", icon: ui.age1115, color: "var(--sky)" },
];
const NAMES: Record<AgeGroup, Record<Gender, string>> = { "6-10": { nam: "Bin", nu: "Na" }, "11-15": { nam: "Khôi", nu: "Mai" } };

const pop = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

function Check() {
  return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}
      className="absolute -right-3 -top-3 flex h-[36px] w-[36px] items-center justify-center rounded-full border-[4px] border-[var(--ink)] bg-[var(--mint-deep)]">
      <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    </motion.div>
  );
}

function StepLabel({ n, children, hint }: { n: number; children: string; hint?: string }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] border-[var(--ink)] bg-[var(--sun)] font-display text-[17px] font-extrabold">{n}</span>
      <span className="font-display text-[22px] font-bold">{children}</span>
      {hint && <span className="text-[15px] font-semibold text-[var(--ink-soft)]">{hint}</span>}
    </div>
  );
}

/** Tạo hồ sơ (người lớn làm). Không hỏi tên thật. Giới tính bắt buộc, chỉ để chọn nhân vật chính. */
export default function SetupScreen() {
  const { saved, setProfile, goHome } = useGame();
  const prev = saved.profile;
  const [age, setAge] = useState<AgeGroup>(prev?.age ?? "6-10");
  const [gender, setGender] = useState<Gender | "">(prev?.gender ?? "");

  const done = () => {
    if (!gender) return;
    const p: Profile = { age, gender };
    sound.play("select");
    setProfile(p);
  };

  return (
    <div className="absolute inset-0">
      <Pic src={bg("bg_home_main")} w={1376} h={768} priority className="absolute inset-0 h-full w-full" />
      <Toast />

      <div className="absolute left-[50px] top-[40px] w-[560px]">
        <div className="flex items-center gap-4">
          <Pic src={ui.logo} w={512} h={512} priority className="h-[108px] w-[108px]" />
          <div>
            <h1 className="text-outline font-display text-[84px] font-extrabold leading-[0.9] tracking-tight text-white">
              Grow<span className="text-[var(--sun)]">Safe</span>
            </h1>
            <p className="text-outline mt-1 font-display text-[26px] font-bold text-[var(--mint)]" style={{ WebkitTextStrokeWidth: 5 }}>Tập phản xạ tự bảo vệ</p>
          </div>
        </div>
        <div className="relative mt-[30px] h-[460px]">
          <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} className="absolute bottom-0 left-0">
            <Pic src={owl("welcome")} w={640} h={640} priority className="h-[260px] w-[260px]" />
          </motion.div>
          {gender && (
            <motion.div key={age + gender} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-0 left-[230px] h-[400px] w-[300px]">
              <Pic src={kid(age, gender, "idle")} w={672} h={900} className="h-full w-full" />
            </motion.div>
          )}
          <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
            className="panel-soft absolute left-[200px] top-0 w-[340px] px-6 py-4">
            <p className="font-display text-[22px] font-extrabold leading-snug">
              {gender ? `Cùng đi với ${NAMES[age][gender]} nhé!` : "Chào! Tớ là Tin, bạn cú dẫn đường."}
            </p>
          </motion.div>
        </div>
      </div>

      <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.07, delayChildren: 0.15 }}
        className="panel paper-grain absolute right-[36px] top-[28px] flex w-[660px] flex-col px-8 pb-5 pt-4">
        <motion.div variants={pop} className="mb-1 flex items-center gap-3">
          <Pic src={ui.parent} w={512} h={512} className="h-[42px] w-[42px]" />
          <p className="flex-1 font-display text-[21px] font-bold text-[var(--ink-soft)]">Bố mẹ, thầy cô tạo hồ sơ giúp con</p>
        </motion.div>

        <motion.div variants={pop}>
          <StepLabel n={1}>Con mấy tuổi?</StepLabel>
          <div className="grid grid-cols-2 gap-4">
            {AGES.map((a) => {
              const on = age === a.id;
              return (
                <motion.button key={a.id} whileTap={{ scale: 0.96 }} onClick={() => { setAge(a.id); sound.play("select"); }}
                  className={clsx("relative flex h-[92px] items-center gap-3 rounded-[24px] border-[4px] border-[var(--ink)] px-4",
                    on ? "shadow-[0_6px_0_var(--ink)]" : "bg-white/70")} style={{ background: on ? a.color : undefined }}>
                  <Pic src={a.icon} w={512} h={512} className="h-[72px] w-[72px] shrink-0" />
                  <span className="whitespace-nowrap font-display text-[25px] font-extrabold">{a.label}</span>
                  {on && <Check />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={pop} className="mt-3">
          <StepLabel n={2} hint="(để chọn nhân vật đi cùng)">Giới tính</StepLabel>
          <div className="grid grid-cols-2 gap-4">
            {(["nam", "nu"] as Gender[]).map((g) => {
              const on = gender === g;
              return (
                <motion.button key={g} whileTap={{ scale: 0.96 }} onClick={() => { setGender(g); sound.play("select"); }}
                  className={clsx("relative flex h-[76px] items-center gap-3 rounded-[22px] border-[4px] border-[var(--ink)] px-3",
                    on ? "bg-[var(--sun)] shadow-[0_6px_0_var(--ink)]" : "bg-white/70")}>
                  <Pic src={g === "nam" ? ui.genderBoy : ui.genderGirl} w={512} h={512} className="h-[54px] w-[54px] shrink-0" />
                  <span className="font-display text-[21px] font-bold leading-tight">{g === "nam" ? "Nam" : "Nữ"} · đi cùng {NAMES[age][g]}</span>
                  {on && <Check />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>


        <motion.div variants={pop} className="mt-3 flex items-center gap-4">
          {prev && <Chunky size="md" color="var(--cream)" onClick={goHome}>Huỷ</Chunky>}
          <Chunky size="lg" color="var(--sun)" disabled={!gender} silent onClick={done} className="flex-1">
            {gender ? "Xong, vào game" : "Chọn Nam hoặc Nữ nhé"}
          </Chunky>
        </motion.div>
        <motion.div variants={pop} className="mt-2 flex items-center gap-3 rounded-[18px] bg-[var(--mint)]/35 px-3 py-2">
          <Pic src={ui.privacy} w={512} h={512} className="h-[36px] w-[36px] shrink-0" />
          <p className="text-[14px] font-bold leading-snug text-[var(--ink-soft)]">Game không hỏi tên thật. Tiến độ và thẻ chỉ lưu trên máy này. Giới tính không gửi cho AI, không ghi vào bản nháp cho người lớn.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
