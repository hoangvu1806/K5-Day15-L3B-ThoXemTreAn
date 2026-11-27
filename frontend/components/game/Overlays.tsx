"use client";

import clsx from "clsx";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { owl, ui } from "@/lib/assets";
import type { FontSize, Speed } from "@/lib/local";
import { sound } from "@/lib/sound";
import { useGame } from "@/lib/store";
import { Chunky, Modal, Pic } from "./ui";

/* ---------- Cài đặt (de-xuat-sprint-3.md mục 6) ---------- */
function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-4">
      <span className="w-[150px] font-display text-[21px] font-bold">{label}</span>
      <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="h-[14px] flex-1 cursor-pointer accent-[var(--mint-deep)]" aria-label={label} />
      <span className="w-[56px] text-right text-[18px] font-bold text-[var(--ink-soft)]">{value <= 0 ? "Tắt" : Math.round(value * 100) + "%"}</span>
    </label>
  );
}

function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-2">
      {options.map(([v, l]) => (
        <button key={v} onClick={() => { onChange(v); sound.play("select"); }}
          className={clsx("h-[46px] rounded-full border-[3px] border-[var(--ink)] px-4 font-display text-[18px] font-bold",
            value === v ? "bg-[var(--sun)] shadow-[0_4px_0_var(--ink)]" : "bg-white/70")}>
          {l}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => { onChange(!on); sound.play("toggle"); }}
      className={clsx("relative h-[40px] w-[74px] rounded-full border-[3px] border-[var(--ink)] transition-colors", on ? "bg-[var(--mint-deep)]" : "bg-[#e9e1d4]")}>
      <motion.span layout className="absolute top-[3px] h-[28px] w-[28px] rounded-full border-[3px] border-[var(--ink)] bg-white"
        style={{ left: on ? 38 : 4 }} />
    </button>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-display text-[21px] font-bold">{label}</span>
      {children}
    </div>
  );
}

export function SettingsPanel() {
  const { saved, updateSettings, setOverlay } = useGame();
  const s = saved.settings;
  const close = () => { sound.play("close"); setOverlay(""); };

  return (
    <Modal onClose={close} z={70}>
      <div className="panel paper-grain flex max-h-[720px] w-[860px] flex-col gap-4 px-10 py-7">
        <div className="flex items-center gap-4">
          <Pic src={ui.settings} w={512} h={512} className="h-[56px] w-[56px]" />
          <h3 className="flex-1 font-display text-[36px] font-extrabold">Cài đặt</h3>
          <Chunky size="sm" color="var(--cream)" onClick={close}>Đóng</Chunky>
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-4">
          <div className="col-span-2 flex flex-col gap-3 rounded-[22px] bg-white/60 px-5 py-4">
            <Slider label="Nhạc nền" value={s.music} onChange={(v) => updateSettings({ music: v })} />
            <Slider label="Hiệu ứng" value={s.sfx} onChange={(v) => updateSettings({ sfx: v })} />
            <Slider label="Giọng đọc" value={s.voice} onChange={(v) => updateSettings({ voice: v })} />
          </div>
          <Row label="Tốc độ đọc">
            <Seg<Speed> value={s.speed} onChange={(v) => updateSettings({ speed: v })} options={[["slow", "Chậm"], ["normal", "Vừa"], ["fast", "Nhanh"]]} />
          </Row>
          <Row label="Cỡ chữ">
            <Seg<FontSize> value={s.font} onChange={(v) => updateSettings({ font: v })} options={[["md", "Vừa"], ["lg", "Lớn"], ["xl", "Rất lớn"]]} />
          </Row>
          <Row label="Tự đọc to lời kể"><Toggle label="Tự đọc to lời kể" on={s.autoRead} onChange={(v) => updateSettings({ autoRead: v })} /></Row>
          <Row label="Giảm chuyển động"><Toggle label="Giảm chuyển động" on={s.reducedMotion} onChange={(v) => updateSettings({ reducedMotion: v })} /></Row>
        </div>

        <div className="mt-1 rounded-[22px] border-[3px] border-dashed border-[var(--ink)]/30 px-5 py-4">
          <div className="mb-2 flex items-center gap-3">
            <Pic src={ui.lock} w={512} h={512} className="h-[40px] w-[40px]" />
            <p className="font-display text-[22px] font-bold">Dành cho người lớn</p>
          </div>
          <div className="flex justify-end">
            <Chunky size="sm" color="#ffd6cc" onClick={() => setOverlay("confirmWipe")}>Xoá tiến độ trên máy này</Chunky>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Tạm dừng ---------- */
export function PauseMenu() {
  const { setOverlay, goHome } = useGame();
  return (
    <Modal onClose={() => setOverlay("")} z={70}>
      <div className="panel paper-grain flex w-[520px] flex-col items-center gap-4 px-10 py-8">
        <Pic src={owl("calm")} w={640} h={640} className="h-[130px] w-[130px]" />
        <h3 className="font-display text-[40px] font-extrabold">Tạm dừng</h3>
        <Chunky size="lg" color="var(--mint)" className="w-full" onClick={() => setOverlay("")}>Chơi tiếp</Chunky>
        <div className="flex w-full gap-3">
          <Chunky size="md" color="var(--sky)" className="flex-1" onClick={() => setOverlay("settings")}>Cài đặt</Chunky>
          <Chunky size="md" color="var(--cream)" className="flex-1" onClick={goHome}>Về nhà</Chunky>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Hỏi lại khi rời màn đang chơi ---------- */
export function ConfirmHome() {
  const { setOverlay, goHome } = useGame();
  return (
    <Modal onClose={() => setOverlay("")} z={70}>
      <div className="panel paper-grain flex w-[560px] flex-col items-center gap-4 px-10 py-8 text-center">
        <Pic src={owl("curious")} w={640} h={640} className="h-[120px] w-[120px]" />
        <h3 className="font-display text-[34px] font-extrabold leading-tight">Thoát màn này?</h3>
        <p className="text-[20px] font-bold text-[var(--ink-soft)]">Tiến độ màn này chưa lưu.</p>
        <div className="flex w-full gap-3">
          <Chunky size="md" color="var(--mint)" className="flex-1" onClick={() => setOverlay("")}>Ở lại</Chunky>
          <Chunky size="md" color="var(--cream)" className="flex-1" onClick={goHome}>Thoát</Chunky>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Xác nhận xoá tiến độ trên máy ---------- */
export function ConfirmWipe() {
  const { setOverlay, wipeProgress, account } = useGame();
  const close = () => { sound.play("close"); setOverlay(""); };
  return (
    <Modal onClose={close} z={85}>
      <div className="panel paper-grain flex w-[560px] flex-col items-center gap-4 px-10 py-8 text-center">
        <Pic src={owl("curious")} w={640} h={640} className="h-[116px] w-[116px]" />
        <h3 className="font-display text-[32px] font-extrabold leading-tight">Xoá tiến độ trên máy này?</h3>
        <p className="text-[19px] font-bold leading-snug text-[var(--ink-soft)]">
          {account
            ? `Thẻ và màn đã qua trên máy này sẽ bị xoá và đăng xuất khỏi ${account.username}. Thẻ đã lưu trong tài khoản vẫn giữ nguyên.`
            : "Toàn bộ màn đã qua, bộ thẻ và Bàn tay tin cậy trên máy này sẽ bị xoá."}
        </p>
        <div className="flex w-full gap-3">
          <Chunky size="md" color="var(--cream)" className="flex-1" onClick={close}>Huỷ</Chunky>
          <Chunky size="md" color="#ffd6cc" className="flex-1" onClick={wipeProgress}>Xoá tiến độ</Chunky>
        </div>
      </div>
    </Modal>
  );
}
