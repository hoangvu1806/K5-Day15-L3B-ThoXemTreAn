"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { bg, owl, ui, type OwlMood } from "@/lib/assets";
import { sound } from "@/lib/sound";
import { useGame } from "@/lib/store";
import Dock from "./Dock";
import { Chunky, HelpButton, IconButton, Pic, Toast } from "./ui";

/** Chế độ Góc Tò Mò: trẻ hỏi đáp giáo dục giới tính đúng trần tuổi với Tin, có chip gợi ý và mic. */
export default function AskScreen() {
  const {
    saved, askChat, askChips, askPrivacy, askRemaining, askMax, askMood, askEnded, busy,
    sendAsk, replayAsk, closeAsk, openAsk, setOverlay,
  } = useGame();
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const age = saved.profile?.age ?? "6-10";
  const used = Math.max(0, askMax - askRemaining);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [askChat.length, busy]);

  const displayMood: OwlMood = listening ? "listen" : busy ? "think" : askMood;

  return (
    <div className="absolute inset-0">
      <Pic src={bg("bg_living_room")} w={1376} h={768} priority className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[#fffaf0]/35" />
      <Toast />

      {/* Thanh trên cùng */}
      <div className="absolute inset-x-6 top-4 z-40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <IconButton src={ui.home} label="Về màn hình chính" onClick={closeAsk} />
          <div className="panel-soft flex h-[58px] items-center gap-3 rounded-full! px-5">
            <Pic src={ui.tip} w={512} h={512} className="h-[38px] w-[38px]" />
            <span className="font-display text-[24px] font-extrabold leading-none">Góc Tò Mò</span>
            <span className="rounded-full bg-[var(--sky)]/60 px-3 py-1 font-display text-[16px] font-extrabold">
              {used}/{askMax} câu
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <IconButton src={ui.settings} label="Cài đặt" onClick={() => setOverlay("settings")} />
          <HelpButton />
        </div>
      </div>

      {/* Nội dung chính: trái là Tin + ghi chú riêng tư, phải là khung chat + chip gợi ý + Dock */}
      <div className="absolute inset-x-7 bottom-6 top-[92px] flex gap-6">
        {/* Cột trái: Tin */}
        <div className="flex w-[340px] shrink-0 flex-col items-center justify-between py-2">
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ y: busy ? [0, -12, 0] : [0, -7, 0] }}
              transition={{ repeat: Infinity, duration: busy ? 1.1 : 3, ease: "easeInOut" }}
              className="relative"
            >
              <Pic src={owl(displayMood)} w={640} h={640} priority className="h-[310px] w-[310px]" />
            </motion.div>
            <div className="-mt-3 flex items-center gap-3">
              <div className="panel-soft rounded-full! px-5 py-2 text-center">
                <span className="font-display text-[20px] font-extrabold">
                  {listening
                    ? (age === "6-10" ? "Tớ đang nghe…" : "Mình đang nghe…")
                    : busy
                      ? (age === "6-10" ? "Đợi tớ nghĩ xíu…" : "Đợi mình chút nhé…")
                      : (age === "6-10" ? "Cậu cứ hỏi tớ nhé!" : "Bạn cứ hỏi mình nhé!")}
                </span>
              </div>
              <IconButton src={ui.replay} label="Nghe lại câu trả lời của Tin" size={54} disabled={busy} onClick={replayAsk} />
            </div>
          </div>

          <div className="panel-soft flex w-full items-start gap-3 px-4 py-3">
            <Pic src={ui.privacy} w={512} h={512} className="mt-0.5 h-[36px] w-[36px] shrink-0" />
            <p className="text-[15px] font-bold leading-snug text-[var(--ink-soft)]">{askPrivacy}</p>
          </div>
        </div>

        {/* Cột phải: Khung hội thoại + chip gợi ý + ô nhập */}
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="panel flex min-h-0 flex-1 flex-col bg-white/95! p-5">
            <div ref={scrollRef} className="parent-scroll min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
              {askChat.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className={`flex ${m.who === "kid" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[84%] rounded-[24px] border-[3px] border-[var(--ink)] px-5 py-3.5 shadow-[0_4px_0_rgba(74,47,34,0.85)] ${
                      m.who === "kid" ? "rounded-br-[8px] bg-[var(--sky)]/65" : "rounded-bl-[8px] bg-[var(--cream)]"
                    }`}
                  >
                    {m.topic && (
                      <p className="mb-1 font-display text-[14px] font-extrabold text-[var(--mint-deep)]">{m.topic}</p>
                    )}
                    <p className="text-[20px] font-bold leading-[1.48] text-[var(--ink)]">{m.text}</p>
                  </div>
                </motion.div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="rounded-[24px] rounded-bl-[8px] border-[3px] border-[var(--ink)] bg-[var(--cream)] px-5 py-3 text-[19px] font-bold text-[var(--ink-soft)]">
                    {age === "6-10" ? "Tin đang suy nghĩ…" : "Tin đang tìm câu trả lời…"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chip câu hỏi gợi ý đã duyệt: ngắn gọn, nằm gọn 1 hàng */}
          {askChips.length > 0 && !askEnded && (
            <div className="flex shrink-0 items-center gap-2 overflow-x-auto pb-1">
              {askChips.slice(0, 3).map((q) => (
                <motion.button
                  key={q}
                  type="button"
                  disabled={busy}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    sound.play("select");
                    void sendAsk(q);
                  }}
                  className="shrink-0 whitespace-nowrap rounded-full border-[3px] border-[var(--ink)] bg-[var(--paper)] px-3.5 py-1.5 text-[15.5px] font-extrabold text-[var(--ink)] shadow-[0_3px_0_var(--ink)] transition hover:bg-[var(--sun)]/50 disabled:opacity-50"
                >
                  {q}
                </motion.button>
              ))}
            </div>
          )}

          {/* Ô nhập (mic + gõ) hoặc thanh kết phiên */}
          <div className="h-[138px] shrink-0">
            {askEnded ? (
              <div className="panel-soft flex h-full items-center justify-between gap-4 px-6">
                <p className="font-display text-[22px] font-extrabold">
                  {age === "6-10" ? "Hôm nay cậu hỏi rất nhiều câu hay rồi!" : "Phiên hỏi đáp hôm nay xong rồi nhé!"}
                </p>
                <div className="flex shrink-0 gap-3">
                  <Chunky size="sm" color="var(--mint)" onClick={() => void openAsk(true)}>Hỏi phiên mới</Chunky>
                  <Chunky size="sm" color="var(--cream)" onClick={closeAsk}>Về màn hình chính</Chunky>
                </div>
              </div>
            ) : (
              <Dock
                age={age}
                onSend={(t) => void sendAsk(t)}
                allowHint={false}
                onListen={setListening}
                placeholder={age === "6-10" ? "Hoặc cậu gõ câu hỏi ở đây…" : "Hoặc bạn gõ câu hỏi ở đây…"}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
