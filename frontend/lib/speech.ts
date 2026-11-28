"use client";

/**
 * Nhận giọng (STT) bằng Web Speech API của trình duyệt, lang = "vi-VN", không cần key.
 * - Bấm để nói (continuous: false): bấm nút thì start(), bấm lần nữa thì stop(); ngừng nói thì trình duyệt tự dừng.
 * - interimResults: chữ hiện dần trong lúc nói. Thả nút xong, chữ chốt hiện ra để trẻ bấm "Đúng rồi" hoặc "Nói lại".
 *   Chỉ chữ đã xác nhận mới gửi lên server, đi qua precheck và mask_pii như chữ gõ. Server không nhận âm thanh.
 * - Bấm mic thì xin quyền bằng getUserMedia trước, để hộp hỏi quyền hiện ra ở mọi trình duyệt có mic.
 * - Opera, Brave… có API nhưng không gọi được dịch vụ nhận giọng: báo "service" để giao diện nói rõ và chuyển sang gõ.
 * - Trên Chrome, âm thanh được gửi tới máy chủ Google để chuyển thành chữ (ghi ở spec.md §9). Nút mic hiện cùng ô gõ
 *   lúc trả lời; không có lựa chọn bật/tắt trong menu.
 */
import { useCallback, useEffect, useRef, useState } from "react";

type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function ctor(): (new () => Rec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const speechSupported = () => !!ctor();

/**
 * not-allowed: quyền mic bị chặn · insecure: trang không chạy HTTPS · no-mic: không có hoặc không mở được mic
 * service: trình duyệt này không nhận giọng được · network: mất mạng tới dịch vụ nhận giọng
 */
export type SpeechError = "not-allowed" | "insecure" | "no-mic" | "service" | "network" | "no-speech" | "other" | "";

type Code = Exclude<SpeechError, "">;

/** Quá lâu không có chữ, lỗi hay kết thúc nào: trình duyệt nhận lệnh rồi im lặng. */
const SILENT_MS = 12000;

function limitedBrowser() {
  const n = navigator as Navigator & { brave?: unknown };
  return /\bOPR\/|\bOpera\b/.test(n.userAgent) || !!n.brave;
}

/** Hỏi quyền mic rồi nhả ngay: âm thanh do SpeechRecognition tự thu. Trả mã lỗi, "" là dùng được. */
async function askMic(): Promise<SpeechError> {
  if (!window.isSecureContext) return "insecure";
  if (!navigator.mediaDevices?.getUserMedia) return "";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return "";
  } catch (e) {
    const name = (e as DOMException).name;
    return name === "NotAllowedError" || name === "SecurityError" ? "not-allowed" : "no-mic";
  }
}

function errorCode(error: string): SpeechError {
  if (error === "aborted") return "";
  if (error === "not-allowed") return "not-allowed";
  if (error === "audio-capture") return "no-mic";
  if (error === "service-not-allowed" || error === "language-not-supported") return "service";
  if (error === "network") return limitedBrowser() ? "service" : "network";
  if (error === "no-speech") return "no-speech";
  return "other";
}

export function useSpeechInput(onFinal: (text: string) => void, onError?: (code: Code) => void) {
  const rec = useRef<Rec | null>(null);
  const turn = useRef(0);        // đổi số là bỏ lượt đang chạy: sự kiện đến muộn của nó bị lờ đi
  const holding = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const finalRef = useRef(onFinal);
  const errorRef = useRef(onError);
  useEffect(() => {
    finalRef.current = onFinal;
    errorRef.current = onError;
  }, [onFinal, onError]);

  const release = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    holding.current = false;
    setListening(false);
  }, []);

  const cancel = useCallback(() => {
    turn.current += 1;
    try {
      rec.current?.abort();
    } catch {}
    rec.current = null;
    release();
    setInterim("");
  }, [release]);

  useEffect(() => () => cancel(), [cancel]);

  const start = useCallback(async () => {
    const C = ctor();
    if (!C || holding.current) return;
    holding.current = true;
    const mine = ++turn.current;
    rec.current = null;
    setInterim("");
    setListening(true);

    const fail = (code: Code) => {
      release();
      errorRef.current?.(code);
    };
    const blocked = await askMic();
    if (turn.current !== mine) return; // đã bấm dừng hoặc rời màn trong lúc chờ cấp quyền
    if (blocked) return fail(blocked);

    let fin = "";
    let heard = "";
    let failed = false;
    const watch = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (turn.current !== mine) return;
        if (heard) return rec.current?.stop();
        cancel();
        errorRef.current?.("service");
      }, SILENT_MS);
    };
    const r = new C();
    r.lang = "vi-VN";
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      if (turn.current !== mine) return;
      let done = "";
      let mid = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) done += res[0].transcript;
        else mid += res[0].transcript;
      }
      if (done) fin = done;
      heard = (done + " " + mid).trim();
      setInterim(heard);
      watch();
    };
    r.onerror = (e) => {
      const code = errorCode(e.error);
      if (turn.current !== mine || !code) return;
      failed = true;
      errorRef.current?.(code);
    };
    r.onend = () => {
      if (turn.current !== mine) return;
      release();
      // Có trình duyệt kết thúc mà chưa chốt chữ: lấy chữ tạm, trẻ vẫn phải xác nhận trước khi gửi.
      const text = (fin || heard).trim();
      if (text) finalRef.current(text);
      else if (!failed) errorRef.current?.("no-speech");
    };
    rec.current = r;
    try {
      r.start();
      watch();
    } catch {
      fail("other");
    }
  }, [cancel, release]);

  const stop = useCallback(() => {
    if (!rec.current) return cancel(); // còn đang chờ cấp quyền
    try {
      rec.current.stop();
    } catch {}
  }, [cancel]);

  return { listening, interim, start, stop, cancel };
}
