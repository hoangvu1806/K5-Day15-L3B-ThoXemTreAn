"use client";

import clsx from "clsx";
import { motion } from "motion/react";
import { useState } from "react";
import { owl, ui } from "@/lib/assets";
import { loadReports } from "@/lib/local";
import { sound } from "@/lib/sound";
import { useGame } from "@/lib/store";
import { Chunky, Modal, Pic } from "./ui";

const when = (t: number) => new Date(t).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Góc phụ huynh: các bản nháp do AI soạn (mới nhất đứng đầu), chỉ có nút sao chép, không có nút gửi. */
export default function ParentCorner({ onClose }: { onClose: () => void }) {
  // useGame() theo dõi cả kho: vừa soạn xong báo cáo thì màn này vẽ lại và đọc lịch sử mới.
  const { saved, account, setOverlay } = useGame();
  const reports = account ? loadReports(account.username) : [];
  const [picked, setPicked] = useState("");
  const draft = reports.find((r) => r.id === picked) ?? reports[0];
  const [copied, setCopied] = useState(false);
  const profile = saved.profile;

  return (
    <Modal onClose={onClose} z={60}>
      <div className="panel paper-grain relative flex h-[680px] w-[1240px] flex-col px-9 py-6">
        <div className="flex shrink-0 items-center gap-4">
          <Pic src={ui.parent} w={512} h={512} className="h-[62px] w-[62px]" />
          <div className="flex-1">
            <h3 className="font-display text-[34px] font-extrabold leading-none">Góc phụ huynh</h3>
            <p className="mt-1 text-[15px] font-bold text-[var(--ink-soft)]">Bản nháp do AI soạn · chờ bố mẹ, thầy cô đọc và tự quyết dùng thế nào</p>
          </div>
          <span className="rounded-full border-[3px] border-[var(--ink)] bg-[var(--lilac)] px-4 py-1 font-display text-[16px] font-bold">Bản nháp</span>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 gap-5">
          <div className="flex w-[200px] shrink-0 flex-col gap-2">
            <p className="font-display text-[19px] font-bold">Các lần trước</p>
            <div className="parent-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {reports.map((r) => (
                <button key={r.id} type="button" aria-pressed={r.id === draft?.id}
                  onClick={() => { sound.play("select"); setPicked(r.id); setCopied(false); }}
                  className={clsx("w-full rounded-[16px] border-[3px] border-[var(--ink)]/80 px-3 py-2 text-left",
                    r.id === draft?.id ? "bg-[var(--sun)]" : "bg-white/80")}>
                  <span className="block font-display text-[16px] font-bold leading-tight">{when(r.saved_at)}</span>
                  <span className="block text-[13px] font-bold text-[var(--ink-soft)]">
                    {r.kind === "ask" ? "Góc Tò Mò" : `${r.levels.length} màn`} · {r.age} tuổi
                  </span>
                </button>
              ))}
              {!reports.length && (
                <p className="text-[14px] font-bold leading-snug text-[var(--ink-soft)]">
                  {account ? "Chưa có phiên nào hoàn thành." : "Đăng nhập để xem báo cáo của tài khoản trên máy này."}
                </p>
              )}
            </div>
            {!account && <Chunky size="sm" color="var(--mint)" onClick={() => setOverlay("account")}>Đăng nhập</Chunky>}
          </div>
          <div className="flex min-h-0 flex-1 flex-col rounded-[24px] border-[3px] border-[var(--ink)] bg-white px-6 py-5">
            {draft ? (
              <div className="parent-scroll min-h-0 flex-1 space-y-3.5 overflow-y-auto pr-2 text-[17.5px] font-semibold leading-[1.65] text-[var(--ink)]">
                {draft.note.split("\n").map((s) => s.trim()).filter(Boolean).map((line, i) => {
                  const clean = line.replace(/\*\*/g, "");
                  const isAlert = /thô tục|không phù hợp|cần người lớn lưu ý|tổng đài 111/i.test(clean);
                  const m = clean.match(/^([^:]{3,30}):\s*(.*)$/);
                  if (isAlert) {
                    return (
                      <p key={i} className="rounded-[16px] border-2 border-[var(--coral)]/45 bg-[#fff2ee] px-4 py-3 text-[var(--ink)]">
                        {m ? <><b className="font-display text-[1.03em] font-extrabold text-[var(--coral)]">{m[1]}:</b> {m[2]}</> : clean}
                      </p>
                    );
                  }
                  return m ? (
                    <p key={i}><b className="font-display text-[1.03em] font-extrabold text-[var(--mint-deep)]">{m[1]}:</b> {m[2]}</p>
                  ) : (
                    <p key={i}>{clean}</p>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center gap-4 text-center">
                <Pic src={owl("explain")} w={640} h={640} className="h-[110px] w-[110px]" />
                <p className="font-display text-[22px] font-bold">Chưa có bản nháp. Bản nháp có sau khi con chơi xong một phiên.</p>
              </div>
            )}
          </div>
          <div className="flex w-[260px] shrink-0 flex-col gap-2">
            <p className="font-display text-[19px] font-bold">Kết quả từng màn</p>
            {(draft?.levels ?? []).map((l, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-[16px] border-[3px] border-[var(--ink)]/80 bg-white/80 px-3 py-[6px]">
                <span className="truncate text-[15px] font-bold">{l.title}</span>
                <span className="flex shrink-0">
                  {[0, 1, 2].map((s) => <Pic key={s} src={s < l.stars ? ui.starOn : ui.starOff} w={512} h={512} className="h-[20px] w-[20px]" />)}
                </span>
              </div>
            ))}
            <div className="mt-auto flex flex-col gap-2 rounded-[18px] border-[3px] border-dashed border-[var(--ink)]/30 p-3">
              <p className="text-[15px] font-bold">Hồ sơ: {profile?.age} tuổi · {profile?.gender === "nu" ? "Nữ" : "Nam"}</p>
              <Chunky size="sm" color="var(--sky)" onClick={() => { onClose(); useGame.setState({ phase: "profile" }); }}>Đổi hồ sơ</Chunky>
              <Chunky size="sm" color="#ffd6cc" onClick={() => setOverlay("confirmWipe")}>Xoá tiến độ</Chunky>
            </div>
          </div>
        </div>

        <div className="mt-4 flex shrink-0 items-center gap-4">
          <Pic src={ui.privacy} w={512} h={512} className="h-[40px] w-[40px]" />
          <p className="flex-1 text-[14px] font-bold leading-snug text-[var(--ink-soft)]">Game không tự gửi bản nháp này đi đâu, lịch sử chỉ lưu trên máy này. Bản nháp không có tên, giới tính hay thông tin định danh của con. Khi con bấm nút mic để nói, giọng nói được gửi tới Google để chuyển thành chữ; game không lưu âm thanh, chỉ gửi chữ con đã xác nhận.</p>
          <Chunky size="sm" color="var(--sky)" disabled={!draft} onClick={async () => {
            if (!draft) return;
            try { await navigator.clipboard.writeText(draft.note); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
          }}>{copied ? "Đã chép!" : "Sao chép"}</Chunky>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Chunky size="sm" color="var(--cream)" onClick={() => { sound.play("close"); onClose(); }}>Đóng</Chunky>
          </motion.div>
        </div>
      </div>
    </Modal>
  );
}
