"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { bg, owl } from "@/lib/assets";
import { TRUSTED_ROLES } from "@/lib/local";
import { useGame } from "@/lib/store";
import { Chunky, HelpButton, Modal, Pic } from "./ui";

/** Vị trí 5 ngón tay (ngón cái → ngón út) trên hình bàn tay vẽ bằng SVG. */
const FINGERS = [
  { x: 120, y: 330, r: -48, h: 150 },
  { x: 225, y: 150, r: -14, h: 230 },
  { x: 330, y: 115, r: 0, h: 260 },
  { x: 432, y: 150, r: 12, h: 235 },
  { x: 520, y: 235, r: 26, h: 185 },
];

/**
 * Bàn tay tin cậy (6-10): mỗi ngón tay ghi một người lớn trẻ sẽ tìm khi cần.
 * Không dùng AI, chỉ lưu vai trên máy, không lưu tên thật. Luyện đúng chỗ phiếu khảo sát 18 kể: trẻ không biết tìm ai khi cô đã về.
 */
export default function HandScreen() {
  const { saved, setHand, goHome } = useGame();
  const hand = saved.progress[saved.profile?.age ?? "6-10"].hand;
  const [pick, setPick] = useState<number | null>(null);
  const filled = hand.filter(Boolean).length;

  return (
    <div className="absolute inset-0">
      <Pic src={bg("bg_living_room")} w={1376} h={768} priority className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[rgb(255_248_236/0.75)]" />
      <div className="absolute inset-x-6 top-4 z-40 flex items-center justify-between">
        <Chunky size="sm" color="var(--cream)" onClick={goHome}>Về nhà</Chunky>
        <HelpButton />
      </div>

      <div className="absolute left-[60px] top-[110px] w-[420px]">
        <Pic src={owl(filled === 5 ? "happy" : "explain")} w={640} h={640} className="h-[220px] w-[220px]" />
        <div className="panel-soft mt-2 px-6 py-4">
          <h2 className="font-display text-[34px] font-extrabold">Bàn tay tin cậy</h2>
          <p className="mt-1 text-[21px] font-bold leading-snug">
            Mỗi ngón tay là một người lớn cậu tìm được khi cần. Người này chưa giúp thì mình tìm người khác nhé.
          </p>
          <p className="mt-2 text-[18px] font-bold text-[var(--mint-deep)]">Đã có {filled}/5 người</p>
        </div>
      </div>

      <div className="absolute left-[560px] top-[110px] h-[640px] w-[680px]">
        <svg viewBox="0 0 680 640" className="absolute inset-0 h-full w-full">
          <path d="M150 380 Q130 600 330 620 Q560 620 560 420 L560 330 Q300 300 150 380 Z" fill="#ffd9b8" stroke="#4a2f22" strokeWidth="8" strokeLinejoin="round" />
          {FINGERS.map((f, i) => (
            <rect key={i} x={f.x - 42} y={f.y} width={84} height={f.h} rx={42} fill="#ffd9b8" stroke="#4a2f22" strokeWidth="8"
              transform={`rotate(${f.r} ${f.x} ${f.y + f.h})`} />
          ))}
        </svg>
        {FINGERS.map((f, i) => (
          <motion.button key={i} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} onClick={() => setPick(i)}
            className={clsx("absolute flex h-[64px] w-[150px] -translate-x-1/2 items-center justify-center rounded-full border-[4px] border-[var(--ink)] px-2 font-display text-[18px] font-extrabold leading-tight shadow-[0_4px_0_var(--ink)]",
              hand[i] ? "bg-[var(--mint)]" : "bg-white/90 text-[var(--ink-soft)]")}
            style={{ left: f.x, top: f.y + 20 }}>
            {hand[i] || "Chọn người"}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {pick !== null && (
          <Modal onClose={() => setPick(null)} z={60}>
            <div className="panel paper-grain flex w-[640px] flex-col gap-4 px-9 py-7">
              <h3 className="font-display text-[30px] font-extrabold">Ngón tay số {pick + 1}: cậu tìm ai?</h3>
              <div className="flex flex-wrap gap-3">
                {TRUSTED_ROLES.map((r) => (
                  <button key={r} onClick={() => { setHand(pick, r); setPick(null); }}
                    className={clsx("h-[56px] rounded-full border-[4px] border-[var(--ink)] px-5 font-display text-[21px] font-bold",
                      hand[pick] === r ? "bg-[var(--sun)]" : "bg-white")}>{r}</button>
                ))}
              </div>
              <p className="text-[15px] font-bold text-[var(--ink-soft)]">Chỉ chọn vai, không ghi tên thật. Lưu trên máy này thôi.</p>
              <div className="flex justify-end gap-3">
                {hand[pick] && <Chunky size="sm" color="var(--cream)" onClick={() => { setHand(pick, ""); setPick(null); }}>Bỏ trống</Chunky>}
                <Chunky size="sm" color="var(--mint)" onClick={() => setPick(null)}>Xong</Chunky>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
