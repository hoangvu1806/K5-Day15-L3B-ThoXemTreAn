"use client";

import Image from "next/image";
import clsx from "clsx";
import { motion } from "motion/react";
import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { ui } from "@/lib/assets";
import { sound } from "@/lib/sound";
import { useGame } from "@/lib/store";

/* ---------- Ảnh: giữ đúng tỉ lệ gốc, không crop ---------- */
export function Pic({
  src, w, h, alt = "", className, style, priority,
}: { src: string; w: number; h: number; alt?: string; className?: string; style?: CSSProperties; priority?: boolean }) {
  return (
    <Image src={src} width={w} height={h} alt={alt} unoptimized priority={priority} draggable={false}
      className={clsx("select-none object-contain", className)} style={style} />
  );
}

/* ---------- Nút ---------- */
export function Chunky({
  children, color = "var(--sun)", className, onClick, disabled, size = "md", type = "button", silent, style,
}: {
  children: ReactNode; color?: string; className?: string; onClick?: () => void; disabled?: boolean;
  size?: "sm" | "md" | "lg"; type?: "button" | "submit"; silent?: boolean; style?: CSSProperties;
}) {
  const pad = size === "lg" ? "h-[84px] px-12 text-[34px]" : size === "sm" ? "h-[52px] px-6 text-[20px]" : "h-[66px] px-8 text-[26px]";
  return (
    <button type={type} disabled={disabled} className={clsx("btn-chunky", pad, className)}
      style={{ ["--c" as string]: color, ...style }}
      onPointerEnter={() => !disabled && sound.play("hover")}
      onClick={() => {
        if (!silent) sound.play("click");
        onClick?.();
      }}>
      {children}
    </button>
  );
}

/* ---------- Tự co cỡ chữ cho vừa khung: không tràn, không thanh cuộn ---------- */
export function useFitText<T extends HTMLElement>(key: unknown, max: number, min: number) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let s = max;
      el.style.fontSize = s + "px";
      while (s > min && el.scrollHeight > el.clientHeight + 1) {
        s -= 1;
        el.style.fontSize = s + "px";
      }
    };
    fit();
    let alive = true;
    document.fonts?.ready.then(() => alive && fit());
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [key, max, min]);
  return ref;
}

/* ---------- Chữ hiện dần từng từ (bố cục giữ nguyên từ đầu nên không giật) ---------- */
export function WordReveal({ text, delay = 0, step = 0.028 }: { text: string; delay?: number; step?: number }) {
  const words = text.split(/(\s+)/);
  return (
    <>
      {words.map((w, i) =>
        /^\s+$/.test(w) ? (
          <span key={i}>{w}</span>
        ) : (
          <motion.span key={i} className="inline-block" initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: delay + i * step * 0.5, duration: 0.28, ease: "easeOut" }}>
            {w}
          </motion.span>
        ),
      )}
    </>
  );
}

/* ---------- Thanh tiến độ: các nút tròn nối bằng đường chấm ---------- */
export function ProgressTrail({ index, total, size = 46 }: { index: number; total: number; size?: number }) {
  return (
    <div className="flex items-center">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < index;
        const current = i === index;
        return (
          <div key={i} className="flex items-center">
            {i > 0 && (
              <div className="mx-[2px] h-[6px] w-[22px] rounded-full"
                style={{ background: done ? "var(--mint-deep)" : "repeating-linear-gradient(90deg, var(--ink-soft) 0 6px, transparent 6px 11px)", opacity: done ? 1 : 0.5 }} />
            )}
            <motion.div animate={current ? { scale: [1, 1.12, 1] } : { scale: 1 }}
              transition={current ? { repeat: Infinity, duration: 1.6, ease: "easeInOut" } : {}}
              className="relative" style={{ width: size, height: size }}>
              <Pic src={done ? ui.nodeOn : ui.nodeOff} w={512} h={512} className="h-full w-full" />
              {current && <div className="absolute -inset-[5px] rounded-full border-[4px] border-dashed border-white/90" />}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

export function StarPill({ stars }: { stars: number }) {
  return (
    <div className="panel-soft flex h-[58px] items-center gap-2 rounded-full! pl-2 pr-5">
      <Pic src={ui.starOn} w={512} h={512} className="h-[44px] w-[44px]" />
      <motion.span key={stars} initial={{ scale: 1.6, color: "#f2a93b" }} animate={{ scale: 1, color: "#4a2f22" }}
        className="font-display text-[28px] font-extrabold leading-none">
        {stars}
      </motion.span>
    </div>
  );
}

/* ---------- Nút âm thanh (vẽ SVG cùng nét viền nâu) ---------- */
function RoundIcon({ onClick, label, children, active = true }: { onClick: () => void; label: string; children: ReactNode; active?: boolean }) {
  return (
    <button aria-label={label} title={label} onClick={onClick}
      className="btn-chunky h-[58px] w-[58px] p-0" style={{ ["--c" as string]: active ? "var(--cream)" : "#e9e1d4" }}>
      <svg viewBox="0 0 32 32" className="h-[30px] w-[30px]" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

export function SoundButtons() {
  const { muted, music, toggleMute, toggleMusic } = useGame();
  return (
    <div className="flex gap-3">
      <RoundIcon label={music ? "Tắt nhạc nền" : "Bật nhạc nền"} onClick={toggleMusic} active={music}>
        <path d="M12 23V8l13-3v15" fill={music ? "var(--sun)" : "none"} />
        <circle cx="9" cy="23" r="3.5" fill="var(--cream)" />
        <circle cx="22" cy="20" r="3.5" fill="var(--cream)" />
        {!music && <path d="M5 5l22 22" stroke="var(--coral)" />}
      </RoundIcon>
      <RoundIcon label={muted ? "Bật âm thanh" : "Tắt âm thanh"} onClick={toggleMute} active={!muted}>
        <path d="M5 12h5l7-6v20l-7-6H5z" fill="var(--mint)" />
        {muted ? <path d="M21 12l7 8M28 12l-7 8" stroke="var(--coral)" /> : <><path d="M21 11c2 2.5 2 7.5 0 10" /><path d="M25 7c4 4.5 4 13.5 0 18" /></>}
      </RoundIcon>
    </div>
  );
}

/* ---------- Nút "Con cần giúp": luôn hiện, luôn chạy được kể cả khi mất mạng ---------- */
export function HelpButton() {
  const openHelp = useGame((s) => s.openHelp);
  return (
    <motion.button aria-label="Con cần giúp" onClick={() => void openHelp()}
      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
      className="btn-chunky h-[62px] gap-2 pl-2 pr-6 text-[22px]" style={{ ["--c" as string]: "#ffd6cc" }}>
      <Pic src={ui.help} w={512} h={512} className="h-[50px] w-[50px]" />
      Con cần giúp
    </motion.button>
  );
}

/* ---------- Thông báo lỗi nhẹ nhàng ---------- */
export function Toast() {
  const { error, clearError } = useGame();
  if (!error) return null;
  return (
    <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      className="panel absolute left-1/2 top-[96px] z-50 flex -translate-x-1/2 items-center gap-4 rounded-full! px-6 py-3">
      <span className="text-[20px] font-bold">Ôi, {error.charAt(0).toLowerCase() + error.slice(1)}. Mình thử lại nhé!</span>
      <Chunky size="sm" color="var(--mint)" onClick={clearError}>Được</Chunky>
    </motion.div>
  );
}

/* ---------- Bóng mờ dưới chân nhân vật ---------- */
export function GroundShadow({ width, className }: { width: number; className?: string }) {
  return <div className={clsx("absolute rounded-[50%]", className)} style={{ width, height: width * 0.14, background: "radial-gradient(closest-side, rgb(74 47 34 / 0.28), transparent)" }} />;
}
