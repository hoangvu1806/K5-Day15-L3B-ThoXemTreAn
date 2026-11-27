"use client";

/**
 * Nhận giọng (STT) bằng Web Speech API của trình duyệt, lang = "vi-VN", không cần key.
 * - Bấm để nói (continuous: false): bấm nút thì start(), bấm lần nữa thì stop(); ngừng nói thì trình duyệt tự dừng.
 * - interimResults: chữ hiện dần trong lúc nói. Thả nút xong, chữ chốt hiện ra để trẻ bấm "Đúng rồi" hoặc "Nói lại".
 *   Chỉ chữ đã xác nhận mới gửi lên server, đi qua precheck và mask_pii như chữ gõ. Server không nhận âm thanh.
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

export type SpeechError = "not-allowed" | "network" | "no-speech" | "other" | "";

export function useSpeechInput(onFinal: (text: string) => void, onError?: (code: Exclude<SpeechError, "">) => void) {
  const rec = useRef<Rec | null>(null);
  const finalText = useRef("");
  const holding = useRef(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const finalRef = useRef(onFinal);
  const errorRef = useRef(onError);
  useEffect(() => {
    finalRef.current = onFinal;
    errorRef.current = onError;
  }, [onFinal, onError]);

  useEffect(() => () => rec.current?.abort(), []);

  const start = useCallback(() => {
    const C = ctor();
    if (!C || holding.current) return;
    holding.current = true;
    finalText.current = "";
    setInterim("");
    const r = new C();
    r.lang = "vi-VN";
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      let fin = "";
      let mid = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) fin += res[0].transcript;
        else mid += res[0].transcript;
      }
      if (fin) finalText.current = fin;
      setInterim((fin + " " + mid).trim());
    };
    r.onerror = (e) => {
      const code = e.error === "not-allowed" || e.error === "service-not-allowed" ? "not-allowed"
        : e.error === "network" ? "network" : e.error === "no-speech" ? "no-speech" : e.error === "aborted" ? "" : "other";
      if (code) errorRef.current?.(code);
    };
    r.onend = () => {
      holding.current = false;
      setListening(false);
      const text = (finalText.current || "").trim();
      if (text) finalRef.current(text);
    };
    rec.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      holding.current = false;
      errorRef.current?.("other");
    }
  }, []);

  const stop = useCallback(() => {
    try {
      rec.current?.stop();
    } catch {}
  }, []);

  const cancel = useCallback(() => {
    holding.current = false;
    finalText.current = "";
    try {
      rec.current?.abort();
    } catch {}
    setListening(false);
    setInterim("");
  }, []);

  return { listening, interim, start, stop, cancel };
}
