import { useEffect, useState } from "react";
import { startGame, startNewRun, appState } from "@/game/main.js";
import { openRulesModal, openCastleArchiveModal } from "@/game/ui/modal.js";
import { toggleFullscreen } from "@/game/ui/fullscreen.js";
import { TacticalAnimationDemo } from "@/components/TacticalAnimationDemo";
import { TitleScreen } from "@/components/TitleScreen";
import { OrientationPrompt } from "@/components/OrientationPrompt";
import "@/game/styles/main.css";
import "@/game/styles/board.css";
import "@/game/styles/ui.css";
import "@/game/styles/animations.css";

export function Home() {
  const [isAnimLabOpen, setIsAnimLabOpen] = useState(false);
  const [screen, setScreen] = useState<"title" | "game">("title");
  const [selectedHunterId, setSelectedHunterId] = useState<string>(
    () => appState?.metaStats?.selectedLoadout || "classic"
  );

  useEffect(() => {
    void startGame();
  }, []);

  useEffect(() => {
    const handleGlobalFullscreenKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName || document.activeElement?.tagName || "";
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        void toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleGlobalFullscreenKey);
    return () => window.removeEventListener("keydown", handleGlobalFullscreenKey);
  }, []);

  useEffect(() => {
    const handleOpenLab = () => setIsAnimLabOpen(true);
    const handleOpenTitle = () => {
      setSelectedHunterId(appState?.metaStats?.selectedLoadout || "classic");
      setScreen("title");
    };

    window.addEventListener("open-animation-lab", handleOpenLab);
    window.addEventListener("open-title-screen", handleOpenTitle);

    return () => {
      window.removeEventListener("open-animation-lab", handleOpenLab);
      window.removeEventListener("open-title-screen", handleOpenTitle);
    };
  }, []);

  const handleStartHunt = (hunterId: string, seed: string) => {
    setSelectedHunterId(hunterId);
    setScreen("game");
    startNewRun(seed, hunterId);
  };

  const handleOpenRules = () => {
    const modalRoot = document.getElementById("modal-root");
    if (modalRoot) openRulesModal(modalRoot);
  };

  const handleOpenArchive = () => {
    const modalRoot = document.getElementById("modal-root");
    if (modalRoot) {
      openCastleArchiveModal(
        modalRoot,
        appState,
        () => {
          if (appState?.metaStats?.selectedLoadout) {
            setSelectedHunterId(appState.metaStats.selectedLoadout);
          }
        },
        (loadoutId) => {
          appState.metaStats.selectedLoadout = loadoutId;
          setSelectedHunterId(loadoutId);
        }
      );
    }
  };

  return (
    <>
      <div id="loading-overlay" className="loading-overlay">
        <div className="loading-box">
          <h1>🧄 LOVEC UPÍRŮ</h1>
          <p>Chystám dubové kolíky, hasičskou stříkačku a arzenál lovců...</p>
          <div className="loading-bar-track">
            <div id="loading-progress-fill" className="loading-bar-fill" />
          </div>
          <div id="loading-progress-text">Inicializuji hradní kroniku...</div>
        </div>
      </div>

      {screen === "title" && (
        <TitleScreen
          onStartHunt={handleStartHunt}
          onOpenRules={handleOpenRules}
          onOpenArchive={handleOpenArchive}
          initialHunterId={selectedHunterId}
          initialSeed={appState?.settings?.currentSeed || "VENCA-1899"}
        />
      )}

      <div id="app-shell" className={screen === "title" ? "hidden" : ""}>
        <header id="hud-root" />
        <main id="center-stage" />
        <section id="bottom-root" />
        <footer id="log-root" />
      </div>

      <div id="modal-root" className="hidden" />

      <TacticalAnimationDemo
        isOpen={isAnimLabOpen}
        onClose={() => setIsAnimLabOpen(false)}
      />

      <OrientationPrompt />
    </>
  );
}
