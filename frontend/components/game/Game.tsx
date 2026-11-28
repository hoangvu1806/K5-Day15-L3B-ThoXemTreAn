"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect } from "react";
import AccountPanel from "./AccountPanel";
import AskScreen from "./AskScreen";
import { bg, owl, preload, ui } from "@/lib/assets";
import { sound } from "@/lib/sound";
import { useGame, type Phase } from "@/lib/store";
import type { Scenario } from "@/lib/types";
import DetectiveScreen from "./DetectiveScreen";
import DoneScreen from "./DoneScreen";
import HandScreen from "./HandScreen";
import HelpScreen from "./HelpScreen";
import HomeScreen from "./HomeScreen";
import IntroScreen from "./IntroScreen";
import MapScreen from "./MapScreen";
import NotebookScreen from "./NotebookScreen";
import { ConfirmHome, ConfirmWipe, PauseMenu, SettingsPanel } from "./Overlays";
import ParentCorner from "./ParentCorner";
import PlayScreen from "./PlayScreen";
import RewardScreen from "./RewardScreen";
import SetupScreen from "./SetupScreen";
import Stage from "./Stage";
import { OfflineBanner } from "./ui";

const PAUSABLE: Phase[] = ["map", "intro", "play", "detective"];

function backdropFor(phase: Phase, sceneBg?: string) {
  if (phase === "profile" || phase === "home") return bg("bg_home_main");
  if (phase === "map") return ui.map610;
  if (phase === "intro") return bg("bg_map_journey");
  if (phase === "help") return ui.illusHelp;
  if (phase === "done") return ui.illusDone;
  if (phase === "notebook") return ui.notebookPage;
  if (phase === "hand" || phase === "ask") return bg("bg_living_room");
  return bg(sceneBg || "bg_home_main");
}

/** Màn đang rời đi giữ nguyên prop cũ, nên không bị đổi nội dung giữa lúc chuyển cảnh. */
function Screen({ view, scenario }: { view: Phase; scenario: Scenario | null }) {
  if (view === "profile") return <SetupScreen />;
  if (view === "home") return <HomeScreen />;
  if (view === "map") return <MapScreen />;
  if (view === "intro" && scenario) return <IntroScreen scenario={scenario} />;
  if (view === "play" && scenario) return <PlayScreen scenario={scenario} />;
  if (view === "detective") return <DetectiveScreen />;
  if (view === "help") return <HelpScreen />;
  if (view === "done") return <DoneScreen />;
  if (view === "notebook") return <NotebookScreen />;
  if (view === "hand") return <HandScreen />;
  if (view === "ask") return <AskScreen />;
  return null;
}

export default function Game() {
  const { hydrated, phase, scenario, overlay, saved, hydrate, setOverlay, setOnline } = useGame();
  const reduced = saved.settings.reducedMotion;

  useEffect(() => {
    hydrate();
    preload([bg("bg_map_journey"), owl("explain"), owl("curious"), owl("calm"), owl("think"), owl("listen"), ui.illusHelp, ui.help, ui.phone, ui.map610]);
    const warm = () => {
      sound.warm();
      window.removeEventListener("pointerdown", warm);
    };
    window.addEventListener("pointerdown", warm);
    // Nhạc nền bật ở lần bấm đầu tiên (trình duyệt chặn tự phát), không cần đăng nhập.
    const startMusic = () => sound.music(useGame.getState().saved.settings.music > 0);
    window.addEventListener("click", startMusic, { once: true, capture: true });
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("pointerdown", warm);
      window.removeEventListener("click", startMusic, { capture: true });
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [hydrate, setOnline]);

  // Phím Esc hay nút back của trình duyệt: mở menu tạm dừng, trang vẫn giữ nguyên.
  useEffect(() => {
    const pause = () => {
      const s = useGame.getState();
      if (PAUSABLE.includes(s.phase)) s.setOverlay(s.overlay === "pause" ? "" : "pause");
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") pause();
    };
    const pop = () => {
      window.history.pushState({ growsafe: true }, "");
      pause();
    };
    window.history.pushState({ growsafe: true }, "");
    window.addEventListener("keydown", key);
    window.addEventListener("popstate", pop);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("popstate", pop);
    };
  }, []);

  const view: Phase = phase === "reward" ? (scenario?.type === "hoi_thoai" ? "detective" : "play") : phase;
  const screenKey = view === "intro" ? "intro-" + scenario?.id : view;

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"}>
      <Stage backdrop={backdropFor(phase, scenario?.scene.bg)}>
        {hydrated && (
          <>
            <AnimatePresence mode="sync" initial={false}>
              <motion.div key={screenKey} className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.03, filter: "blur(6px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.985, filter: "blur(4px)" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                <Screen view={view} scenario={scenario} />
              </motion.div>
            </AnimatePresence>
            <AnimatePresence>{phase === "reward" && <RewardScreen key="reward" />}</AnimatePresence>
            <AnimatePresence>
              {overlay === "settings" && <SettingsPanel key="settings" />}
              {overlay === "pause" && <PauseMenu key="pause" />}
              {overlay === "confirmHome" && <ConfirmHome key="confirm" />}
              {overlay === "parent" && <ParentCorner key="parent" onClose={() => setOverlay("")} />}
              {overlay === "account" && <AccountPanel key="account" />}
              {overlay === "confirmWipe" && <ConfirmWipe key="confirmWipe" />}
            </AnimatePresence>
            <OfflineBanner />
          </>
        )}
      </Stage>
    </MotionConfig>
  );
}
