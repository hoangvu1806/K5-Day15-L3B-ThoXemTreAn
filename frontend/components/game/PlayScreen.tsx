"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { actionIcon, bg, card, kid, npc, owl, type KidMood, type OwlMood } from "@/lib/assets";
import { useGame } from "@/lib/store";
import type { ActionIcon, AnswerResponse, Scenario } from "@/lib/types";
import { Chunky, GroundShadow, HelpButton, Pic, ProgressTrail, SoundButtons, StarPill, Toast, WordReveal, useFitText } from "./ui";

const LETTER_COLORS = ["var(--sky)", "var(--peach)", "var(--lilac)"];
const CORE: { icon: Exclude<ActionIcon, "">; label: string }[] = [
  { icon: "say_no", label: "Nói KHÔNG" },
  { icon: "leave", label: "Rời đi" },
  { icon: "tell_adult", label: "Kể người lớn" },
];

/* ---------- Nhân vật trong cảnh ---------- */
function Scene({ scenario, mood, said }: { scenario: Scenario; mood: KidMood; said: string }) {
  const { age, gender } = useGame();
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
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}>
            <Pic src={npc("npc_online_avatar")} w={512} h={512} priority className="h-[150px] w-[150px]" />
          </motion.div>
          <p className="mt-1 font-display text-[20px] font-bold">Tin nhắn mới</p>
          <div className="mt-3 w-full space-y-3">
            <div className="h-[38px] w-[85%] rounded-[18px] rounded-bl-[4px] border-[3px] border-[var(--ink)] bg-white" />
            <div className="flex h-[44px] w-[62%] items-center justify-center gap-[6px] rounded-[18px] rounded-bl-[4px] border-[3px] border-[var(--ink)] bg-[var(--sky)]">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="h-[9px] w-[9px] rounded-full bg-[var(--ink)]" animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }} />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ x: -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 110, damping: 15 }}
        className="absolute bottom-[8px] h-[520px] w-[388px]" style={{ left: kidLeft }}>
        <GroundShadow width={230} className="bottom-[22px] left-[72px]" />
        <motion.div className="h-full w-full" animate={{ y: [0, -5, 0], scaleY: [1, 1.012, 1] }}
          transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }} style={{ transformOrigin: "50% 100%" }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={mood} className="h-full w-full" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}>
              <Pic src={kid(age, gender, mood)} w={672} h={900} priority className="h-full w-full" />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {said && (
          <motion.div key={said} initial={{ opacity: 0, scale: 0.6, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="panel-soft bubble bubble-down absolute w-[270px] origin-bottom-left px-5 py-3"
            style={{ left: kidLeft + 30, top: 128 }}>
            <p className="line-clamp-3 text-[18px] font-bold leading-snug">“{said}”</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- Khung tình huống ---------- */
function Story({ scenario, compact }: { scenario: Scenario; compact: boolean }) {
  const ref = useFitText<HTMLDivElement>(scenario.id + String(compact), 33, 15);
  const c = card[scenario.scene.card];
  return (
    <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 140, damping: 16 }}
      className="panel paper-grain flex min-h-0 flex-1 flex-col px-7 pb-5 pt-4">
      <div className="mb-2 flex shrink-0 items-center gap-3">
        <span className="flex items-center gap-2 rounded-full border-[3px] border-[var(--ink)] px-3 py-[2px] font-display text-[17px] font-bold" style={{ background: c.tint }}>
          <Pic src={c.icon} w={512} h={512} className="h-[26px] w-[26px]" />Tình huống
        </span>
        <span className="truncate font-display text-[24px] font-extrabold">{scenario.title}</span>
      </div>
      <div ref={ref} className="min-h-0 flex-1 overflow-hidden font-semibold leading-[1.42]">
        <p>{scenario.situation}</p>
        {scenario.question && (
          <p className="mt-[0.4em] font-display text-[1.1em] font-extrabold leading-[1.25] text-[var(--coral)]">{scenario.question}</p>
        )}
      </div>
    </motion.div>
  );
}

/* ---------- Khu trả lời: nút đáp án + tự gõ ---------- */
function Dock({ scenario }: { scenario: Scenario }) {
  const { submit, busy, age } = useGame();
  const [text, setText] = useState("");
  const [picked, setPicked] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const send = () => {
    const t = text.trim();
    if (!t || busy) return;
    setPicked("");
    void submit({ text: t });
  };

  return (
    <motion.div key="dock" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }} className="flex h-full flex-col justify-end gap-[10px]">
      {scenario.choices.map((ch, i) => (
        <motion.button key={ch.id} disabled={busy}
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07, type: "spring", stiffness: 200, damping: 20 }}
          onClick={() => { setPicked(ch.id); void submit({ choice_id: ch.id }); }}
          className={clsx("btn-chunky h-[64px] justify-start! gap-4 rounded-[22px]! pl-2 pr-5 text-left",
            busy && picked !== ch.id && "opacity-60")}
          style={{ ["--c" as string]: picked === ch.id ? "var(--sun)" : "var(--cream)" }}>
          <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border-[3px] border-[var(--ink)] font-display text-[24px] font-extrabold"
            style={{ background: LETTER_COLORS[i % 3] }}>{ch.id}</span>
          <span className={clsx("line-clamp-2 font-sans font-extrabold leading-[1.12]", ch.text.length > 60 ? "text-[18px]" : "text-[21px]")}>{ch.text}</span>
        </motion.button>
      ))}
      <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="mt-[4px] flex h-[64px] items-center gap-3 rounded-full border-[4px] border-[var(--ink)] bg-white pl-6 pr-[6px] shadow-[0_6px_0_rgba(74,47,34,0.9)] focus-within:ring-[6px] focus-within:ring-[var(--sky)]/70">
        <svg viewBox="0 0 24 24" className="h-[26px] w-[26px] shrink-0" fill="none" stroke="var(--ink-soft)" strokeWidth="2.6" strokeLinecap="round"><path d="M4 20l4-1 11-11-3-3L5 16z" /><path d="M14 6l3 3" /></svg>
        <input ref={input} value={text} onChange={(e) => setText(e.target.value)} maxLength={300} disabled={busy}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
          placeholder={age === "6-10" ? "Hoặc con tự gõ: con sẽ làm gì?" : "Hoặc em tự gõ cách em sẽ làm…"}
          className="h-full min-w-0 flex-1 bg-transparent text-[21px] font-bold text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)]/70" />
        <button type="submit" disabled={busy || !text.trim()} aria-label="Gửi"
          className="btn-chunky h-[48px] w-[64px] p-0" style={{ ["--c" as string]: text.trim() ? "var(--mint)" : "#eee6da" }}>
          <svg viewBox="0 0 24 24" className="h-[26px] w-[26px]" fill="var(--cream)" stroke="var(--ink)" strokeWidth="2.4" strokeLinejoin="round"><path d="M3 11.5L21 3l-6.5 18-3-7.5z" /></svg>
        </button>
      </motion.form>
    </motion.div>
  );
}

/* ---------- Bạn cú đang nghĩ ---------- */
function Thinking({ age }: { age: string }) {
  return (
    <motion.div key="thinking" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="relative flex h-full items-end">
      <motion.div animate={{ rotate: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 1.4 }} className="absolute bottom-[-14px] left-[-12px] z-10">
        <Pic src={owl("curious")} w={640} h={640} className="h-[220px] w-[220px]" />
      </motion.div>
      <div className="panel-soft bubble bubble-left relative mb-[40px] ml-[220px] flex h-[120px] flex-1 items-center gap-5 px-7">
        <p className="font-display text-[26px] font-bold">Mình đang đọc câu trả lời của {age === "6-10" ? "con" : "em"}</p>
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

/* ---------- Lời phản hồi của bạn cú ---------- */
const VERDICT: Record<string, { label: string; color: string; mood: OwlMood }> = {
  dat: { label: "Đúng rồi!", color: "var(--mint)", mood: "happy" },
  chua_dat: { label: "Gần được rồi", color: "var(--sun)", mood: "encourage" },
  hoi_lai: { label: "Kể rõ hơn nhé", color: "var(--sky)", mood: "curious" },
};

function Feedback({ scenario, r }: { scenario: Scenario; r: AnswerResponse }) {
  const { retry, claimCard, age } = useGame();
  const v = VERDICT[r.result] ?? VERDICT.chua_dat;
  const ref = useFitText<HTMLDivElement>(r.feedback, 25, 15);
  const has = new Set(scenario.key_actions.map((a) => a.icon));
  const got = new Set((r.matched_actions ?? []).map((a) => a.icon));
  const core = CORE.filter((c) => has.has(c.icon));
  const you = age === "6-10" ? "con" : "em";

  return (
    <motion.div key={"fb" + r.feedback} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 160, damping: 18 }} className="relative h-full">
      <motion.div initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.05 }}
        className="absolute bottom-[-18px] left-[-18px] z-10">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.2 }}>
          <Pic src={owl(v.mood)} w={640} h={640} className="h-[210px] w-[210px]" />
        </motion.div>
      </motion.div>

      <div className="panel-soft bubble bubble-left absolute bottom-0 left-[196px] right-0 top-0 flex flex-col py-4 pl-7 pr-5">
        <div className="flex shrink-0 items-center gap-3">
          <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.25, 1] }} transition={{ duration: 0.45 }}
            className="rounded-full border-[3px] border-[var(--ink)] px-4 py-[2px] font-display text-[22px] font-extrabold" style={{ background: v.color }}>
            {v.label}
          </motion.span>
          {!r.level_complete && r.result !== "hoi_lai" && (r.attempts_left ?? 0) > 0 && (
            <span className="text-[17px] font-bold text-[var(--ink-soft)]">{you} còn {r.attempts_left} lần thử</span>
          )}
        </div>
        <div ref={ref} className="mt-2 min-h-0 flex-1 overflow-hidden font-semibold leading-[1.4]">
          <WordReveal text={r.feedback} />
        </div>
        <div className="mt-2 flex shrink-0 items-end justify-between gap-3">
          <div className="flex gap-1">
            {core.map((c, i) => {
              const ok = got.has(c.icon);
              return (
                <motion.div key={c.icon} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 + i * 0.12 }}
                  className="relative flex w-[80px] flex-col items-center" title={c.label}>
                  <div className={clsx("rounded-full border-[3px] p-[2px]", ok ? "border-[var(--ink)] bg-[var(--mint)]" : "border-dashed border-[var(--ink-soft)]/70 bg-white/60")}>
                    <Pic src={actionIcon[c.icon]} w={512} h={512} className={clsx("h-[42px] w-[42px]", !ok && "opacity-45 grayscale")} />
                  </div>
                  <span className={clsx("mt-[3px] whitespace-nowrap font-display text-[14px] font-bold leading-none", ok ? "text-[var(--ink)]" : "text-[var(--ink-soft)]/80")}>{c.label}</span>
                  {ok && (
                    <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.12, type: "spring" }}
                      viewBox="0 0 24 24" className="absolute right-[8px] top-[-4px] h-[22px] w-[22px] rounded-full border-2 border-[var(--ink)] bg-[var(--mint-deep)] p-[2px]"
                      fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></motion.svg>
                  )}
                </motion.div>
              );
            })}
          </div>
          {r.level_complete ? (
            <Chunky size="md" color="var(--sun)" silent onClick={claimCard} className="shrink-0">Nhận thẻ quy tắc</Chunky>
          ) : (
            <Chunky size="md" color="var(--mint)" onClick={retry} className="shrink-0">
              {r.result === "hoi_lai" ? "Trả lời lại" : "Thử lại"}
            </Chunky>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function PlayScreen({ scenario }: { scenario: Scenario }) {
  const { progress, last: storeLast, busy: storeBusy, phase, scenario: current } = useGame();
  // Khi đã sang màn khác (màn này đang mờ dần), giữ khung trống thay vì hiện dữ liệu của màn mới.
  const live = current?.id === scenario.id;
  const last = live ? storeLast : null;
  const busy = live && storeBusy;
  const said = last?.answer_text ?? "";
  const mood: KidMood = busy || !last ? "idle" : last.result === "dat" ? "confident" : "unsure";
  const showFeedback = !!last && last.result !== "dung";
  const bottomH = showFeedback ? 330 : busy ? 290 : 290;

  return (
    <div className="absolute inset-0">
      <AnimatePresence initial={false}>
        <motion.div key={scenario.scene.bg} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
          <Pic src={bg(scenario.scene.bg)} w={1376} h={768} priority className="absolute inset-0 h-full w-full" />
        </motion.div>
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[900px] bg-gradient-to-r from-white/35 via-white/10 to-transparent" />

      <Scene scenario={scenario} mood={mood} said={said} />

      {/* HUD */}
      <div className="absolute inset-x-6 top-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StarPill stars={progress.stars} />
          <div className="panel-soft rounded-full! px-4 py-[7px]"><ProgressTrail index={progress.index} total={progress.total} size={40} /></div>
        </div>
        <div className="flex items-center gap-3"><SoundButtons /><HelpButton /></div>
      </div>
      <Toast />

      {/* Cột trái: tình huống + trả lời */}
      <div className="absolute bottom-[26px] left-[30px] top-[96px] z-10 flex w-[790px] flex-col gap-4">
        <Story scenario={scenario} compact={showFeedback} />
        <motion.div className="relative shrink-0" animate={{ height: bottomH }} transition={{ type: "spring", stiffness: 180, damping: 24 }}>
          <AnimatePresence mode="wait">
            {phase === "play" && busy ? <Thinking key="t" age={scenario.age_group} />
              : showFeedback && last ? <Feedback key="f" scenario={scenario} r={last} />
              : <Dock key={"d" + scenario.id} scenario={scenario} />}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
