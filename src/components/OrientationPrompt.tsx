import { useEffect, useState } from "react";
import { Smartphone, Maximize2, X } from "lucide-react";
import { toggleFullscreen } from "@/game/ui/fullscreen.js";

const SESSION_KEY = "lovec_dismiss_portrait_hint";

export function OrientationPrompt() {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const checkOrientation = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Mobile portrait: narrow screen where height exceeds width
      const isPortrait = vh > vw && vw <= 640;
      setIsPortraitMobile(isPortrait);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  if (!isPortraitMobile || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore storage errors
    }
  };

  return (
    <div
      className="fixed inset-x-3 bottom-3 z-[9000] pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200"
      role="region"
      aria-label="Doporučení otočení obrazovky"
    >
      <div className="max-w-md mx-auto rounded-xl border-2 border-[#d4af37] bg-gradient-to-r from-[#1c0f08]/95 via-[#2a160c]/95 to-[#1c0f08]/95 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.85)] backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg border border-[#b89552] bg-[#140a05] flex items-center justify-center shrink-0 text-[#fae094]">
            <Smartphone className="w-5 h-5 rotate-90 text-[#d4af37] animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-serif font-black text-xs sm:text-sm uppercase tracking-wider text-[#fae094]">
                Doporučeno hrát na šířku
              </h3>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-stone-400 hover:text-[#fae094] p-0.5 cursor-pointer"
                aria-label="Zavřít doporučení"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-[#ebd8a7]/90 leading-snug mt-0.5">
              Pro maximální přehled nad 1D bojištěm i destičkami otočte telefon
              horizontálně.
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="px-2.5 py-1 rounded-md border border-[#d4af37] bg-[#381e0f] hover:bg-[#4c2915] text-[#fae094] text-[11px] font-serif font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Maximize2 className="w-3 h-3 text-[#d4af37]" />
                <span>Celá obrazovka</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="px-2.5 py-1 rounded-md border border-[#6e5233] bg-[#1a0e07] hover:bg-[#28150c] text-[#ebd8a7] text-[11px] font-serif font-bold cursor-pointer transition-colors"
              >
                Pokračovat na výšku
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
