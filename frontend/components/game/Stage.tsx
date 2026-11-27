"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { STAGE_H, STAGE_W, owl } from "@/lib/assets";
import { Pic } from "./ui";

/**
 * Sân khấu cố định 1376×768 (đúng tỉ lệ ảnh nền), co giãn đều theo khung trình duyệt.
 * Không crop ảnh nền, không méo, không thanh cuộn. Phần thừa hai bên lấp bằng chính ảnh nền làm mờ.
 */
export default function Stage({ backdrop, children }: { backdrop: string; children: ReactNode }) {
  const [box, setBox] = useState({ scale: 0, vw: 0, vh: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const vv = window.visualViewport;
      const vw = vv?.width ?? window.innerWidth;
      const vh = vv?.height ?? window.innerHeight;
      const pad = Math.min(vw, vh) < 600 ? 12 : 24;
      const availW = Math.max(200, vw - pad * 2);
      const availH = Math.max(200, vh - pad * 2);
      setBox({ scale: Math.min(availW / STAGE_W, availH / STAGE_H), vw, vh });
    };
    measure();
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, []);

  const { scale, vw, vh } = box;
  const gap = Math.max(vw - STAGE_W * scale, vh - STAGE_H * scale);
  const framed = gap > 28;
  const portrait = vw > 0 && vh > vw && vw < 900;

  return (
    <div className="fixed inset-0 overflow-clip">
      {/* Lấp khoảng thừa: ảnh nền phóng to + làm mờ */}
      <AnimatePresence>
        <motion.div key={backdrop} className="absolute inset-[-60px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
          style={{ backgroundImage: `url(${backdrop})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(28px) saturate(1.15) brightness(1.02)" }} />
      </AnimatePresence>
      <div className="absolute inset-0 bg-white/15" />

      <div className="absolute left-1/2 top-1/2 overflow-clip"
        style={{
          width: STAGE_W, height: STAGE_H,
          transform: `translate(-50%, -50%) scale(${scale || 0.001})`,
          opacity: scale ? 1 : 0,
          borderRadius: framed ? 28 : 0,
          boxShadow: framed ? "0 0 0 5px rgb(74 47 34 / 0.9), 0 30px 80px rgb(74 47 34 / 0.35)" : "none",
          transition: "opacity .3s ease",
        }}>
        {children}
      </div>

      {portrait && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[var(--letterbox)]/95 p-8 text-center backdrop-blur">
          <motion.div animate={{ rotate: [0, -90, -90, 0] }} transition={{ repeat: Infinity, duration: 2.6, times: [0, 0.35, 0.75, 1] }}
            className="flex h-[150px] w-[92px] items-center justify-center rounded-[22px] border-[5px] border-[var(--ink)] bg-white">
            <Pic src={owl("welcome")} w={640} h={640} className="h-[80px] w-[80px]" />
          </motion.div>
          <p className="font-display text-[28px] font-extrabold leading-tight text-[var(--ink)]">Xoay ngang màn hình<br />để chơi nhé!</p>
        </div>
      )}
    </div>
  );
}
