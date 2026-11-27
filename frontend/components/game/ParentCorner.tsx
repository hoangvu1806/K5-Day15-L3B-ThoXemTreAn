"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { owl, ui } from "@/lib/assets";
import { sound } from "@/lib/sound";
import { useGame } from "@/lib/store";
import { Chunky, Modal, Pic, useFitText } from "./ui";

/** Góc phụ huynh (sau khoá người lớn): bản nháp do AI soạn, chỉ có nút sao chép, không có nút gửi. */
export default function ParentCorner({ onClose }: { onClose: () => void }) {
  const { draft, saved, wipeProgress, requestLock } = useGame();
  const [copied, setCopied] = useState(false);
  const ref = useFitText<HTMLDivElement>(draft?.note ?? "", 20, 13);
  const profile = saved.profile;

  return (
    <Modal onClose={onClose} z={60}>
      <div className="panel paper-grain relative flex h-[660px] w-[1000px] flex-col px-10 py-7">
        <div className="flex shrink-0 items-center gap-4">
          <Pic src={ui.parent} w={512} h={512} className="h-[62px] w-[62px]" />
          <div className="flex-1">
            <h3 className="font-display text-[34px] font-extrabold leading-none">Góc phụ huynh</h3>
            <p className="mt-1 text-[15px] font-bold text-[var(--ink-soft)]">Bản nháp do AI soạn · chờ bố mẹ, thầy cô đọc và tự quyết dùng thế nào</p>
          </div>
          <span className="rounded-full border-[3px] border-[var(--ink)] bg-[var(--lilac)] px-4 py-1 font-display text-[16px] font-bold">Bản nháp</span>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 gap-6">
          <div className="flex min-h-0 flex-1 flex-col rounded-[24px] border-[3px] border-[var(--ink)] bg-white px-6 py-5">
            {draft ? (
              <div ref={ref} className="min-h-0 flex-1 overflow-hidden whitespace-pre-line font-semibold leading-[1.5]">
                {draft.note.split("\n").filter(Boolean).map((line, i) => {
                  const m = line.match(/^(\*\*)?([^:*]{3,30}):(\*\*)?\s*(.*)$/);
                  return m ? (
                    <p key={i} className="mb-[0.5em]"><b className="font-display text-[1.05em] font-extrabold text-[var(--mint-deep)]">{m[2]}:</b> {m[4]}</p>
                  ) : <p key={i} className="mb-[0.5em]">{line.replace(/\*\*/g, "")}</p>;
                })}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center gap-4 text-center">
                <Pic src={owl("explain")} w={640} h={640} className="h-[110px] w-[110px]" />
                <p className="font-display text-[22px] font-bold">Chưa có bản nháp. Bản nháp có sau khi con chơi xong một phiên.</p>
              </div>
            )}
          </div>
          <div className="flex w-[300px] shrink-0 flex-col gap-2">
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
              <Chunky size="sm" color="#ffd6cc" onClick={() => requestLock("wipe", wipeProgress)}>Xoá tiến độ</Chunky>
            </div>
          </div>
        </div>

        <div className="mt-4 flex shrink-0 items-center gap-4">
          <Pic src={ui.privacy} w={512} h={512} className="h-[40px] w-[40px]" />
          <p className="flex-1 text-[14px] font-bold leading-snug text-[var(--ink-soft)]">Game không tự gửi bản nháp này đi đâu. Bản nháp không có tên, giới tính hay thông tin định danh của con. Khi con bấm nút mic để nói, giọng nói được gửi tới Google để chuyển thành chữ; game không lưu âm thanh, chỉ gửi chữ con đã xác nhận.</p>
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
