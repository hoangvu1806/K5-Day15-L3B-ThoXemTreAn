"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent, type ReactNode } from "react";
import { ui } from "@/lib/assets";
import { sound } from "@/lib/sound";
import { useGame } from "@/lib/store";
import { Chunky, Modal, Pic } from "./ui";

/**
 * Tài khoản cho người lớn (mở sau khoá phép tính): tên đăng nhập + mật khẩu, chỉ để lưu bộ thẻ qua nhiều máy.
 * Không email, không tên thật. Chưa đăng nhập vẫn chơi được, thẻ chỉ nằm trên máy này. Server: codebase/auth.py.
 */

const INPUT = "h-[56px] w-full rounded-[18px] border-[3px] border-[var(--ink)] bg-white px-4 text-[22px] font-bold outline-none focus:ring-[5px] focus:ring-[var(--sky)]/60";
const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-display text-[20px] font-bold">{label}</span>
      {children}
      {hint && <span className="text-[15px] font-bold text-[var(--ink-soft)]">{hint}</span>}
    </label>
  );
}

function AuthForm() {
  const { login, register } = useGame();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [consent, setConsent] = useState(false);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const switchTo = (m: "login" | "register") => {
    sound.play("select");
    setMode(m);
    setError("");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const u = username.trim().toLowerCase();
    if (mode === "register") {
      if (!USERNAME_RE.test(u)) return setError("Tên đăng nhập dài 3-20 ký tự, chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới");
      if (password.length < 8) return setError("Mật khẩu cần ít nhất 8 ký tự");
      if (password !== again) return setError("Hai lần nhập mật khẩu chưa giống nhau");
      if (!consent) return setError("Cần đồng ý ở ô bên dưới trước khi tạo tài khoản");
    } else if (!u || !password) return setError("Nhập tên đăng nhập và mật khẩu nhé");
    setBusy(true);
    setError("");
    const err = mode === "register" ? await register(u, password, consent) : await login(u, password);
    setBusy(false);
    if (err) {
      sound.play("encourage");
      setError(err);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex gap-2 self-center rounded-full bg-white/60 p-1">
        {(["login", "register"] as const).map((m) => (
          <button key={m} type="button" onClick={() => switchTo(m)}
            className={clsx("h-[48px] rounded-full px-6 font-display text-[20px] font-bold",
              mode === m ? "border-[3px] border-[var(--ink)] bg-[var(--sun)] shadow-[0_4px_0_var(--ink)]" : "")}>
            {m === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </button>
        ))}
      </div>

      <Field label="Tên đăng nhập" hint={mode === "register" ? "Đừng dùng tên thật của con. Ví dụ: nhacuabin, lop2a.co.lan" : undefined}>
        <input className={INPUT} value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20}
          autoComplete="username" autoCapitalize="none" spellCheck={false} />
      </Field>
      {/* Đăng ký xếp hai ô mật khẩu cạnh nhau để cả form vừa khung game cao 768px. */}
      <div className={clsx("grid items-start gap-4", mode === "register" ? "grid-cols-2" : "grid-cols-1")}>
      <Field label="Mật khẩu" hint={mode === "register" ? "Ít nhất 8 ký tự. Không có email nên quên mật khẩu thì không lấy lại được." : undefined}>
        <div className="relative">
          <input className={INPUT + " pr-[92px]"} type={show ? "text" : "password"} value={password}
            onChange={(e) => setPassword(e.target.value)} maxLength={128}
            autoComplete={mode === "register" ? "new-password" : "current-password"} />
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[16px] font-bold text-[var(--ink-soft)] underline">
            {show ? "Ẩn" : "Hiện"}
          </button>
        </div>
      </Field>
      {mode === "register" && (
        <Field label="Nhập lại mật khẩu">
          <input className={INPUT} type={show ? "text" : "password"} value={again} onChange={(e) => setAgain(e.target.value)}
            maxLength={128} autoComplete="new-password" />
        </Field>
      )}
      </div>
      {mode === "register" && (
          <label className="flex cursor-pointer items-start gap-3 rounded-[18px] bg-white/60 px-4 py-3">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-[24px] w-[24px] shrink-0 accent-[var(--mint-deep)]" />
            <span className="text-[16px] font-bold leading-snug">
              Tôi là phụ huynh hoặc giáo viên. Tôi đồng ý lưu bộ thẻ, các màn đã chơi và &quot;Bàn tay tin cậy&quot; của con vào tài khoản này.
              Game không lưu câu trả lời, giới tính hay tên thật của con.
            </span>
          </label>
      )}

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="alert" className="text-center text-[18px] font-bold text-[var(--coral)]">{error}</motion.p>
        )}
      </AnimatePresence>

      <Chunky type="submit" size="md" color="var(--mint)" disabled={busy} className="w-full">
        {busy ? "Đang gửi…" : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
      </Chunky>
    </form>
  );
}

function Signed() {
  const { account, sync, syncNow, logout, saved } = useGame();
  const cards = Object.values(saved.progress).reduce((n, p) => n + Object.keys(p.rules).length + Object.keys(p.tactics).length, 0);
  const status = { idle: "", saving: "Đang lưu…", saved: "Đã lưu vào tài khoản", error: "Chưa lưu được, sẽ thử lại khi có mạng" }[sync];
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-[20px] font-bold text-[var(--ink-soft)]">Đang đăng nhập</p>
      <p className="font-display text-[40px] font-extrabold leading-none">{account?.username}</p>
      <p className="text-[19px] font-bold">{cards} thẻ · {status}</p>
      <div className="flex w-full gap-3">
        <Chunky size="md" color="var(--sky)" className="flex-1" disabled={sync === "saving"} onClick={() => void syncNow()}>Lưu ngay</Chunky>
        <Chunky size="md" color="var(--cream)" className="flex-1" onClick={logout}>Đăng xuất</Chunky>
      </div>
      <p className="text-[15px] font-bold text-[var(--ink-soft)]">Đăng xuất thì thẻ vẫn còn trên máy này và trong tài khoản.</p>
    </div>
  );
}

export default function AccountPanel() {
  const { account, authPrompt, setOverlay } = useGame();
  const close = () => {
    sound.play("close");
    setOverlay("");
  };
  return (
    <Modal onClose={close} z={70}>
      <div className={clsx("panel paper-grain flex max-h-[736px] flex-col gap-3 overflow-y-auto px-10 py-5", account ? "w-[640px]" : "w-[880px]")}>
        <div className="flex items-center gap-4">
          <Pic src={ui.parent} w={512} h={512} className="h-[56px] w-[56px]" />
          <div className="flex-1">
            <h3 className="font-display text-[34px] font-extrabold leading-none">Tài khoản</h3>
            <p className="mt-1 text-[16px] font-bold text-[var(--ink-soft)]">Đăng nhập để chơi cùng AI và lưu bộ thẻ qua nhiều máy</p>
          </div>
          <Chunky size="sm" color="var(--cream)" onClick={close}>Đóng</Chunky>
        </div>
        {!account && authPrompt && (
          <div className="rounded-[18px] border-2 border-[var(--sky-deep)]/40 bg-[var(--sky)]/30 px-4 py-3 text-center text-[17px] font-bold text-[var(--ink)]">
            {authPrompt}
          </div>
        )}
        {account ? <Signed /> : <AuthForm />}
      </div>
    </Modal>
  );
}
