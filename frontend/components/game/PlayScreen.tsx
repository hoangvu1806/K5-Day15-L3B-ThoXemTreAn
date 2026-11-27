"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { bg, card, kid, npc, owl, ui, type KidMood, type OwlMood } from "@/lib/assets";
import { useGame } from "@/lib/store";
import type { AnswerResponse, Scenario } from "@/lib/types";
import Dock from "./Dock";
import { Chunky, GroundShadow, IconButton, Pic, Toast, TopBar, WordReveal, useFitText } from "./ui";

/* ---------- Nhân vật trong cảnh ---------- */
function Scene({ scenario, mood, said }: { scenario: Scenario; mood: KidMood; said: string }) {
  const profile = useGame((s) => s.saved.profile)!;
  const online = scenario.scene.npc === "npc_online_avatar";
  const hasNpc = !!scenario.scene.npc && !online;
  const kidLeft = hasNpc ? 790 : online ? 820 : 950;

  return (
    <>
      {hasNpc && (
        <motion.div key={scenario.scene.npc} initial={{ x: 220, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.15 }}
          className="absolute bottom-0 right-[-24px] h-[540px] w-[403px]">
          <motion.div className="h-full w-full" animate={{ rotate: [-0.8, 0.8, -0.8] }} transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
            style={{ transformOrigin: "50% 100%" }}>
            <Pic src={npc(scenario.scene.npc)} w={672} h={900} priority className="h-full w-full" />
          </motion.div>
        </motion.div>
      )}
      {online && (
        <motion.div initial={{ y: -60, opacity: 0, rotate: 6 }} animate={{ y: 0, opacity: 1, rotate: 3 }}
          transition={{ type: "spring", stiffness: 110, damping: 13, delay: 0.15 }}
          className="absolute right-[56px] top-[118px] flex h-[440px] w-[270px] flex-col items-center rounded-[40px] border-[5px] border-[var(--ink)] bg-[var(--cream)] px-4 pt-7 shadow-[0_10px_0_rgba(74,47,34,0.85)]">
          <div className="absolute top-[10px] h-[8px] w-[70px] rounded-full bg-[var(--ink)]/70" />
          <Pic src={npc("npc_online_avatar")} w={512} h={512} priority className="h-[150px] w-[150px]" />
          <p className="mt-1 font-display text-[20px] font-bold">Tin nhắn mới</p>
        </motion.div>
      )}
      <motion.div initial={{ x: -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 110, damping: 15 }}
        className="absolute bottom-[8px] h-[520px] w-[388px]" style={{ left: kidLeft }}>
        <GroundShadow width={230} className="bottom-[22px] left-[72px]" />
        <motion.div className="h-full w-full" animate={{ y: [0, -5, 0], scaleY: [1, 1.012, 1] }}
          transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }} style={{ transformOrigin: "50% 100%" }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={mood} className="h-full w-full" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Pic src={kid(profile.age, profile.gender, mood)} w={672} h={900} priority className="h-full w-full" />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
      <AnimatePresence>
        {said && (
          <motion.div key={said} initial={{ opacity: 0, scale: 0.6, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
            className="panel-soft absolute w-[270px] origin-bottom-left px-5 py-3" style={{ left: kidLeft + 30, top: 128 }}>
            <p className="line-clamp-3 text-[18px] font-bold leading-snug">“{said}”</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- Khung tình huống (màn một câu) ---------- */
function Story({ scenario, compact }: { scenario: Scenario; compact: boolean }) {
  const { replay } = useGame();
  const ref = useFitText<HTMLDivElement>(scenario.id + String(compact), 31, 15);
  const c = card[scenario.scene.card];
  return (
    <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 140, damping: 16 }}
      className="panel paper-grain flex min-h-0 flex-1 flex-col px-7 pb-4 pt-4">
      <div className="mb-2 flex shrink-0 items-center gap-3">
        <span className="flex items-center gap-2 rounded-full border-[3px] border-[var(--ink)] px-3 py-[2px] font-display text-[17px] font-bold" style={{ background: c.tint }}>
          <Pic src={c.icon} w={512} h={512} className="h-[26px] w-[26px]" />Tình huống
        </span>
        <span className="flex-1 truncate font-display text-[24px] font-extrabold">{scenario.title}</span>
        <IconButton src={ui.replay} label="Nghe lại" size={50} onClick={() => replay("story")} />
      </div>
      <div ref={ref} className="min-h-0 flex-1 overflow-hidden font-semibold leading-[1.42]">
        <p>{scenario.situation}</p>
        {scenario.question && <p className="mt-[0.4em] font-display text-[1.1em] font-extrabold leading-[1.25] text-[var(--coral)]">{scenario.question}</p>}
      </div>
    </motion.div>
  );
}

/* ---------- Khung chat (màn hội thoại với người lạ) ---------- */
function Chat({ scenario }: { scenario: Scenario }) {
  const { chat, replay, name } = useGame();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [chat.length]);
  const label = scenario.speaker?.label || "Người lạ trong trò chơi";
  return (
    <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}
      className="panel paper-grain flex min-h-0 flex-1 flex-col px-6 pb-3 pt-3">
      <div className="mb-2 flex shrink-0 items-center gap-3">
        <Pic src={ui.strangerTag} w={512} h={512} className="h-[40px] w-[40px]" />
        <span className="rounded-full border-[3px] border-[var(--ink)] bg-[var(--peach)] px-3 py-[1px] font-display text-[17px] font-bold">{label}</span>
        <span className="flex-1 truncate text-[16px] font-bold text-[var(--ink-soft)]">{scenario.age_group === "6-10" ? "Cậu" : "Bạn"} trả lời thay {name} · Tin luôn ở bên cạnh</span>
        <IconButton src={ui.replay} label="Nghe lại" size={46} onClick={() => replay("story")} />
      </div>
      <p className="mb-2 shrink-0 text-[18px] font-semibold leading-snug text-[var(--ink-soft)]">{scenario.situation}</p>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
        {chat.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={clsx("flex", m.who === "kid" ? "justify-end" : m.who === "tin" ? "justify-center" : "justify-start")}>
            <div className={clsx("max-w-[78%] rounded-[20px] border-[3px] border-[var(--ink)] px-4 py-2 text-[20px] font-bold leading-snug",
              m.who === "stranger" && "rounded-bl-[4px] bg-white", m.who === "kid" && "rounded-br-[4px] bg-[var(--sky)]",
              m.who === "tin" && "border-dashed bg-[var(--mint)]/60 text-[18px]")}>
              {m.who === "stranger" && <span className="block text-[13px] font-extrabold uppercase text-[var(--coral)]">{label}</span>}
              {m.who === "tin" && <span className="block text-[13px] font-extrabold uppercase text-[var(--mint-deep)]">Tin</span>}
              {m.text}
            </div>
          </motion.div>
        ))}
        <div ref={end} />
      </div>
    </motion.div>
  );
}

/* ---------- Tin đang nghĩ ---------- */
function Thinking() {
  const waiting = useGame((s) => s.waiting);
  return (
    <motion.div key="thinking" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative flex h-full items-end">
      <motion.div animate={{ rotate: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 1.4 }} className="absolute bottom-[-14px] left-[-12px] z-10">
        <Pic src={owl("think")} w={640} h={640} className="h-[200px] w-[200px]" />
      </motion.div>
      <div className="panel-soft relative mb-[40px] ml-[200px] flex h-[110px] flex-1 items-center gap-5 px-7">
        <p className="font-display text-[26px] font-bold">{waiting?.text ?? "Để tớ nghĩ chút…"}</p>
        <div className="flex gap-[7px]">
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="h-[13px] w-[13px] rounded-full bg-[var(--mint-deep)]" animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.14 }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- Lời phản hồi của Tin ---------- */
const VERDICT: Record<string, { label: string; color: string; mood: OwlMood }> = {
  dat: { label: "Đúng rồi!", color: "var(--mint)", mood: "happy" },
  chua_dat: { label: "Gần được rồi", color: "var(--sun)", mood: "encourage" },
  hoi_lai: { label: "Cùng xem lại nhé", color: "var(--sky)", mood: "curious" },
  thoat_vai: { label: "Dừng ở đây nhé", color: "var(--lilac)", mood: "calm" },
};

function Feedback({ r }: { r: AnswerResponse }) {
  const { goNext, retry, replay, endSession, detective } = useGame();
  // Màn một câu không báo đúng sai lúc chơi: kết quả chỉ có trong báo cáo cuối phiên.
  const quiet = r.mode === "mot_cau";
  const v = quiet ? { label: "", color: "", mood: "happy" as OwlMood } : VERDICT[r.result] ?? VERDICT.chua_dat;
  const ref = useFitText<HTMLDivElement>(r.feedback, 25, 15);
  const canRetry = quiet && !!r.can_retry && !r.stopped;
  const [rest, setRest] = useState(!!r.tired);

  return (
    <motion.div key={"fb" + r.feedback} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 160, damping: 18 }} className="relative h-full">
      <motion.div initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} className="absolute bottom-[-18px] left-[-18px] z-10">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.2 }}>
          <Pic src={owl(v.mood)} w={640} h={640} className="h-[200px] w-[200px]" />
        </motion.div>
      </motion.div>
      <div className="panel-soft absolute bottom-0 left-[186px] right-0 top-0 flex flex-col py-4 pl-7 pr-5">
        <div className="flex shrink-0 items-center gap-3">
          {v.label && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.25, 1] }} transition={{ duration: 0.45 }}
              className="rounded-full border-[3px] border-[var(--ink)] px-4 py-[2px] font-display text-[22px] font-extrabold" style={{ background: v.color }}>
              {v.label}
            </motion.span>
          )}
          <div className="flex-1" />
          <IconButton src={ui.replay} label="Nghe lại" size={44} onClick={() => replay("feedback")} />
        </div>
        <div ref={ref} className="mt-2 min-h-0 flex-1 overflow-hidden font-semibold leading-[1.4]">
          <WordReveal text={r.feedback} />
        </div>
        {rest ? (
          <div className="mt-2 flex shrink-0 items-center gap-3 rounded-[18px] bg-[var(--lilac)]/40 px-3 py-2">
            <p className="flex-1 text-[18px] font-bold leading-snug">{r.rest_line?.text ?? "Mệt chưa? Nghỉ chút nhé."}</p>
            <Chunky size="sm" color="var(--cream)" onClick={() => void endSession()}>Nghỉ thôi</Chunky>
            <Chunky size="sm" color="var(--mint)" onClick={() => setRest(false)}>Chơi tiếp</Chunky>
          </div>
        ) : (
          <div className="mt-2 flex shrink-0 items-center justify-end gap-3">
            {canRetry && (
              <Chunky size="md" color="var(--cream)" onClick={retry} className="shrink-0">Trả lời lại</Chunky>
            )}
            <Chunky size="md" color="var(--sun)" silent onClick={goNext} className="shrink-0">
              {detective ? "Làm thám tử" : "Đi tiếp"}
            </Chunky>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function PlayScreen({ scenario }: { scenario: Scenario }) {
  const { last: storeLast, busy: storeBusy, phase, scenario: current, submit } = useGame();
  const [listening, setListening] = useState(false);
  const live = current?.id === scenario.id;
  const last = live ? storeLast : null;
  const busy = live && storeBusy;
  const dialogue = scenario.type === "hoi_thoai";
  const said = dialogue ? "" : last?.answer_text ?? "";
  const mood: KidMood = busy || !last || last.result === "ghi_nhan" ? "idle" : last.result === "dat" ? "confident" : "unsure";
  // Hội thoại đang tiếp diễn (người lạ nói câu tiếp) thì vẫn hiện khu trả lời.
  const showFeedback = !!last && last.result !== "dung" && last.result !== "tiep";
  const bottomH = showFeedback ? 320 : 270;

  return (
    <div className="absolute inset-0">
      <AnimatePresence initial={false}>
        <motion.div key={scenario.scene.bg} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
          <Pic src={bg(scenario.scene.bg)} w={1376} h={768} priority className="absolute inset-0 h-full w-full" />
        </motion.div>
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[900px] bg-gradient-to-r from-white/35 via-white/10 to-transparent" />
      <Scene scenario={scenario} mood={mood} said={said} />
      {listening && (
        <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-[330px] top-[110px] z-20">
          <Pic src={owl("listen")} w={640} h={640} className="h-[150px] w-[150px]" />
        </motion.div>
      )}
      <TopBar midLevel={!last?.level_complete} />
      <Toast />

      <div className="absolute bottom-[22px] left-[30px] top-[92px] z-10 flex w-[790px] flex-col gap-3">
        {dialogue ? <Chat scenario={scenario} /> : <Story scenario={scenario} compact={showFeedback} />}
        <motion.div className="relative shrink-0" animate={{ height: bottomH }} transition={{ type: "spring", stiffness: 180, damping: 24 }}>
          <AnimatePresence mode="wait">
            {phase === "play" && busy ? <Thinking key="t" />
              : showFeedback && last ? <Feedback key="f" r={last} />
              : <Dock key={"d" + scenario.id} age={scenario.age_group} onSend={(t) => void submit(t)} onListen={setListening} />}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
