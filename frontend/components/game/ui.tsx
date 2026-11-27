"use client";

import Image from "next/image";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { ui } from "@/lib/assets";
import { helpLabel } from "@/lib/lines";
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

/** Nút tròn dùng ảnh có sẵn (Nhà, Tạm dừng, Cài đặt, Nghe lại, Gợi ý). */
export function IconButton({ src, label, onClick, size = 58, disabled, active }: {
  src: string; label: string; onClick: () => void; size?: number; disabled?: boolean; active?: boolean;
}) {
  return (
    <motion.button aria-label={label} title={label} disabled={disabled} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}
      onPointerEnter={() => sound.play("hover")} onClick={onClick}
      className={clsx("relative shrink-0 rounded-full disabled:opacity-40", active && "ring-[5px] ring-[var(--sun)]")}
      style={{ width: size, height: size }}>
      <Pic src={src} w={512} h={512} className="h-full w-full drop-shadow-[0_4px_0_rgba(74,47,34,0.35)]" />
    </motion.button>
  );
}

/* ---------- Cỡ chữ theo cài đặt ---------- */
export function useFontScale() {
  const font = useGame((s) => s.saved.settings.font);
  return font === "xl" ? 1.3 : font === "lg" ? 1.15 : 1;
}

/* ---------- Tự co cỡ chữ cho vừa khung: không tràn, không thanh cuộn ---------- */
export function useFitText<T extends HTMLElement>(key: unknown, max: number, min: number) {
  const ref = useRef<T>(null);
  const scale = useFontScale();
  const top = Math.round(max * scale);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let s = top;
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
  }, [key, top, min]);
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

/* ---------- Nút cần giúp: luôn hiện, luôn chạy được kể cả khi mất mạng ---------- */
export function HelpButton() {
  const openHelp = useGame((s) => s.openHelp);
  const age = useGame((s) => s.saved.profile?.age ?? "6-10");
  const label = helpLabel(age);
  return (
    <motion.button aria-label={label} onClick={() => void openHelp()}
      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
      className="btn-chunky relative z-[80] h-[62px] gap-2 pl-2 pr-6 text-[22px]" style={{ ["--c" as string]: "#ffd6cc" }}>
      <Pic src={ui.help} w={512} h={512} className="h-[50px] w-[50px]" />
      {label}
    </motion.button>
  );
}

/**
 * Thanh trên cùng ở mọi màn chơi (de-xuat-sprint-3.md mục 6):
 * trái: Nhà (hỏi lại nếu đang giữa màn), Tạm dừng · giữa: tiến độ · phải: Cài đặt, nút cần giúp.
 */
export function TopBar({ midLevel = false, center }: { midLevel?: boolean; center?: ReactNode }) {
  const { progress, setOverlay, goHome } = useGame();
  return (
    <div className="absolute inset-x-6 top-4 z-40 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <IconButton src={ui.home} label="Về màn hình chính" onClick={() => (midLevel ? setOverlay("confirmHome") : goHome())} />
        <IconButton src={ui.pause} label="Tạm dừng" onClick={() => setOverlay("pause")} />
        <StarPill stars={progress.stars} />
      </div>
      <div className="flex items-center">
        {center ?? <div className="panel-soft rounded-full! px-4 py-[7px]"><ProgressTrail index={progress.index} total={progress.total} size={40} /></div>}
      </div>
      <div className="flex items-center gap-3">
        <IconButton src={ui.settings} label="Cài đặt" onClick={() => setOverlay("settings")} />
        <HelpButton />
      </div>
    </div>
  );
}

/* ---------- Thông báo lỗi nhẹ nhàng ---------- */
export function Toast() {
  const { error, clearError } = useGame();
  if (!error) return null;
  return (
    <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      className="panel absolute left-1/2 top-[96px] z-[90] flex -translate-x-1/2 items-center gap-4 rounded-full! px-6 py-3">
      <span className="text-[20px] font-bold">Ôi, {error.charAt(0).toLowerCase() + error.slice(1)}. Mình thử lại nhé!</span>
      <Chunky size="sm" color="var(--mint)" onClick={clearError}>Được</Chunky>
    </motion.div>
  );
}

/** Mất mạng: hiện băng thông báo, vẫn cho mở Sổ tay và Bàn tay tin cậy. */
export function OfflineBanner() {
  const online = useGame((s) => s.online);
  return (
    <AnimatePresence>
      {!online && (
        <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
          className="absolute inset-x-0 bottom-0 z-[95] flex h-[48px] items-center justify-center gap-3 bg-[var(--sun)] font-display text-[20px] font-bold">
          Mất mạng rồi. Sổ tay và Bàn tay tin cậy vẫn mở được. Nút cần giúp vẫn chạy.
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Bóng mờ dưới chân nhân vật ---------- */
export function GroundShadow({ width, className }: { width: number; className?: string }) {
  return <div className={clsx("absolute rounded-[50%]", className)} style={{ width, height: width * 0.14, background: "radial-gradient(closest-side, rgb(74 47 34 / 0.28), transparent)" }} />;
}

/* ---------- Lớp phủ có nền mờ ---------- */
export function Modal({ children, onClose, z = 60 }: { children: ReactNode; onClose?: () => void; z?: number }) {
  return (
    <motion.div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: z }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-[rgb(74_47_34/0.45)] backdrop-blur-[3px]" onClick={onClose} />
      <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }} className="relative">
        {children}
      </motion.div>
    </motion.div>
  );
}
