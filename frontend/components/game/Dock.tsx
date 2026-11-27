"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ui } from "@/lib/assets";
import { HINT_OFFER, MIC } from "@/lib/lines";
import { sound } from "@/lib/sound";
import { speechSupported, useSpeechInput, type SpeechError } from "@/lib/speech";
import { useGame } from "@/lib/store";
import type { AgeGroup } from "@/lib/types";
import { Chunky, IconButton, Pic } from "./ui";

/**
 * Khu trả lời: nút mic lớn (bấm để bật, bấm lần nữa để tắt), ô gõ, nút "Gợi ý". Không có nút đáp án (de-xuat-tinh-nang.md mục 4.3).
 * Nói xong, chữ nghe được hiện ra để trẻ bấm "Đúng rồi" (gửi) hoặc "Nói lại", sửa tay cũng được.
 * Bước xác nhận là bắt buộc: máy nghe nhầm "con không đi" thành "con đi" là đảo ngược nghĩa câu trả lời.
 */
export default function Dock({ age, onSend, allowHint = true, onListen }: {
  age: AgeGroup; onSend: (text: string) => void; allowHint?: boolean; onListen?: (on: boolean) => void;
}) {
  const { busy, askHint, hint, say } = useGame();
  const [text, setText] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [micBlocked, setMicBlocked] = useState(false);
  const [note, setNote] = useState("");
  const input = useRef<HTMLInputElement>(null);
  // Nói và gõ luôn hiện cùng lúc; trẻ chọn cách nào cũng được. Trình duyệt không hỗ trợ nhận giọng thì chỉ còn ô gõ.
  const micOn = speechSupported() && !micBlocked;
  const youSay = age === "6-10" ? "cậu" : "bạn";

  const onFinal = useCallback((t: string) => {
    setConfirm(t);
    say([{ file: MIC.confirm[age].voice }]);
  }, [age, say]);
  const onError = useCallback((code: Exclude<SpeechError, "">) => {
    if (code === "not-allowed") {
      // Bị từ chối quyền mic: ẩn nút mic, chuyển sang ô gõ, không dừng game.
      setMicBlocked(true);
      setNote(age === "6-10" ? "Mic chưa được bật. Cậu gõ giúp tớ nhé." : "Mic chưa được bật, bạn gõ nhé.");
      setTimeout(() => input.current?.focus(), 50);
      return;
    }
    const line = code === "network" ? MIC.type[age] : code === "no-speech" ? MIC.louder[age] : MIC.unclear[age];
    setNote(line.text);
    say([{ file: line.voice }]);
  }, [age, say]);
  const sp = useSpeechInput(onFinal, onError);

  useEffect(() => onListen?.(sp.listening), [sp.listening, onListen]);

  const send = (t: string) => {
    const v = t.trim();
    if (!v || busy) return;
    setText("");
    setConfirm(null);
    setNote("");
    onSend(v);
  };

  const press = () => {
    if (busy) return;
    setNote("");
    setConfirm(null);
    sound.play("micOn");
    sp.start();
  };
  const release = () => {
    if (!sp.listening) return;
    sound.play("micOff");
    sp.stop();
  };
  const toggle = () => (sp.listening ? release() : press());

  return (
    <motion.div key="dock" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }} className="flex h-full flex-col justify-end gap-3">
      <AnimatePresence>
        {(hint || note) && !confirm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="panel-soft flex items-center gap-3 px-5 py-3">
            <Pic src={ui.hint} w={512} h={512} className="h-[40px] w-[40px] shrink-0" />
            <p className="flex-1 text-[21px] font-bold leading-snug">{note || hint}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {confirm !== null ? (
          <motion.div key="confirm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="panel-soft flex flex-col gap-3 px-5 py-4">
            <p className="font-display text-[20px] font-bold text-[var(--ink-soft)]">{MIC.confirm[age].text}</p>
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} maxLength={300} aria-label="Chữ đã nghe được"
              className="h-[56px] rounded-[18px] border-[3px] border-[var(--ink)] bg-white px-4 text-[22px] font-bold outline-none focus:ring-[5px] focus:ring-[var(--sky)]/60" />
            <div className="flex gap-3">
              <Chunky size="md" color="var(--mint)" className="flex-1" onClick={() => send(confirm)} disabled={!confirm.trim() || busy}>Đúng rồi</Chunky>
              <Chunky size="md" color="var(--cream)" className="flex-1" onClick={() => { setConfirm(null); press(); }}>Nói lại</Chunky>
            </div>
          </motion.div>
        ) : (
          <motion.div key="input" className="flex items-end gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {micOn && (
              <div className="relative flex flex-col items-center">
                <AnimatePresence>
                  {sp.listening && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="panel-soft absolute bottom-[132px] left-0 w-[520px] px-5 py-3 text-[22px] font-bold">
                      {sp.interim || (age === "6-10" ? "Tớ đang nghe…" : "Mình đang nghe…")}
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.button aria-label={MIC.howto[age].text} title={MIC.howto[age].text} disabled={busy}
                  aria-pressed={sp.listening} onClick={toggle} onContextMenu={(e) => e.preventDefault()}
                  animate={sp.listening ? { scale: [1, 1.08, 1] } : { scale: 1 }} transition={sp.listening ? { repeat: Infinity, duration: 0.9 } : {}}
                  className="h-[124px] w-[124px] touch-none rounded-full disabled:opacity-50">
                  <Pic src={sp.listening ? ui.micRec : ui.micIdle} w={512} h={512} className="h-full w-full drop-shadow-[0_6px_0_rgba(74,47,34,0.35)]" />
                </motion.button>
                <span className="mt-1 whitespace-nowrap font-display text-[15px] font-bold text-[var(--ink-soft)]">{sp.listening ? "Bấm để dừng" : "Bấm để nói"}</span>
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); send(text); }}
              className="flex h-[70px] flex-1 items-center gap-3 rounded-full border-[4px] border-[var(--ink)] bg-white pl-6 pr-[6px] shadow-[0_6px_0_rgba(74,47,34,0.9)] focus-within:ring-[6px] focus-within:ring-[var(--sky)]/70">
              <svg viewBox="0 0 24 24" className="h-[26px] w-[26px] shrink-0" fill="none" stroke="var(--ink-soft)" strokeWidth="2.6" strokeLinecap="round"><path d="M4 20l4-1 11-11-3-3L5 16z" /><path d="M14 6l3 3" /></svg>
              <input ref={input} value={text} onChange={(e) => setText(e.target.value)} maxLength={300} disabled={busy}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); send(text); } }}
                placeholder={micOn ? `Hoặc ${youSay} gõ ở đây…` : `${youSay === "cậu" ? "Cậu" : "Bạn"} gõ cách ${youSay} sẽ làm…`}
                className="h-full min-w-0 flex-1 bg-transparent text-[22px] font-bold text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)]/70" />
              <button type="submit" disabled={busy || !text.trim()} aria-label="Gửi"
                className="btn-chunky h-[52px] w-[66px] p-0" style={{ ["--c" as string]: text.trim() ? "var(--mint)" : "#eee6da" }}>
                <svg viewBox="0 0 24 24" className="h-[26px] w-[26px]" fill="var(--cream)" stroke="var(--ink)" strokeWidth="2.4" strokeLinejoin="round"><path d="M3 11.5L21 3l-6.5 18-3-7.5z" /></svg>
              </button>
            </form>
            {allowHint && (
              <div className="flex flex-col items-center">
                <IconButton src={ui.hint} label={HINT_OFFER[age].text} size={70} disabled={busy || !!hint} onClick={() => void askHint()} />
                <span className="mt-1 font-display text-[15px] font-bold text-[var(--ink-soft)]">Gợi ý</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
