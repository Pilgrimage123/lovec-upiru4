// @ts-nocheck
let keydownHandler = null;

export function initKeyboardInput(callbacks = {}) {
  if (keydownHandler) {
    window.removeEventListener("keydown", keydownHandler);
  }
  keydownHandler = (e) => {
    if (e.key === "Escape" || e.key === "Esc") {
      e.preventDefault();
      callbacks.onEscape?.();
      return;
    }
    if (callbacks.isInputLocked?.()) return;
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    const key = e.key.toLowerCase();
    if (key === "a" || e.key === "ArrowLeft") {
      e.preventDefault();
      callbacks.onStep?.(-1);
    } else if (key === "d" || e.key === "ArrowRight") {
      e.preventDefault();
      callbacks.onStep?.(1);
    } else if (key === "w" || e.key === "ArrowUp") {
      e.preventDefault();
      callbacks.onTurn?.();
    } else if (key === "s" || e.key === "ArrowDown") {
      e.preventDefault();
      callbacks.onWait?.();
    } else if (e.code === "Space") {
      e.preventDefault();
      callbacks.onExecuteQueue?.();
    } else if (e.key === "Backspace") {
      if (e.repeat) return;
      e.preventDefault();
      callbacks.onPopQueue?.();
    } else if (/^[1-9]$/.test(e.key)) {
      e.preventDefault();
      const idx = Number(e.key) - 1;
      callbacks.onHotkeyTile?.(idx);
    } else if (key === "f1" || e.key === "F1") {
      e.preventDefault();
      callbacks.onOpenRules?.();
    }
  };
  window.addEventListener("keydown", keydownHandler);
}
