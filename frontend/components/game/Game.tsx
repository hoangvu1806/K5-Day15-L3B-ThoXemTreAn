"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { bg, owl, preload, ui } from "@/lib/assets";
import { sound } from "@/lib/sound";
import { useGame, type Phase } from "@/lib/store";
import type { Scenario } from "@/lib/types";
import DoneScreen from "./DoneScreen";
import HelpScreen from "./HelpScreen";
import IntroScreen from "./IntroScreen";
import PlayScreen from "./PlayScreen";
import RewardScreen from "./RewardScreen";
import SetupScreen from "./SetupScreen";
import Stage from "./Stage";

function backdropFor(phase: Phase, sceneBg?: string) {
  if (phase === "setup") return bg("bg_home_main");
  if (phase === "intro") return bg("bg_map_journey");
  if (phase === "help") return ui.illusHelp;
  if (phase === "done") return ui.illusDone;
  return bg(sceneBg || "bg_home_main");
}

/** Màn đang rời đi giữ nguyên prop cũ, nên không bị đổi nội dung giữa lúc chuyển cảnh. */
function Screen({ view, scenario }: { view: Phase; scenario: Scenario | null }) {
  if (view === "setup") return <SetupScreen />;
  if (view === "intro" && scenario) return <IntroScreen scenario={scenario} />;
  if (view === "play" && scenario) return <PlayScreen scenario={scenario} />;
  if (view === "help") return <HelpScreen />;
  if (view === "done") return <DoneScreen />;
  return null;
}

export default function Game() {
  const phase = useGame((s) => s.phase);
  const scenario = useGame((s) => s.scenario);

  useEffect(() => {
    preload([bg("bg_map_journey"), owl("explain"), owl("curious"), owl("calm"), ui.illusHelp, ui.help, ui.phone,
      ui.age610, ui.age1115, ui.genderBoy, ui.genderGirl, ui.genderNeutral]);
    const warm = () => {
      sound.warm();
      window.removeEventListener("pointerdown", warm);
    };
    window.addEventListener("pointerdown", warm);
    return () => window.removeEventListener("pointerdown", warm);
  }, []);

  // Màn chơi và màn nhận thẻ dùng chung cảnh, thẻ hiện đè lên trên.
  const screenKey = phase === "reward" ? "play" : phase === "intro" ? "intro-" + scenario?.id : phase;

  return (
    <Stage backdrop={backdropFor(phase, scenario?.scene.bg)}>
      <AnimatePresence mode="sync" initial={false}>
        <motion.div key={screenKey} className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.03, filter: "blur(6px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.985, filter: "blur(4px)" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <Screen view={phase === "reward" ? "play" : phase} scenario={scenario} />
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>{phase === "reward" && <RewardScreen key="reward" />}</AnimatePresence>
    </Stage>
  );
}
