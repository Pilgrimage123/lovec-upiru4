import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ANIMATION_CONFIG,
  type GridPos,
  SPRITE_PRESETS,
} from "./unitSpriteConfig";
import {
  UnitSprite,
  type UnitSpriteHandle,
} from "./UnitSprite";

interface TacticalUnit {
  id: string;
  name: string;
  spriteUrl: string;
  scale?: "hero" | "boss" | "human" | "small" | "beast" | "critter";
  gridPos: GridPos;
  facing: 1 | -1;
  isEnemy: boolean;
  hp: number;
  maxHp: number;
  attackDmg: number;
}

const INITIAL_UNITS: TacticalUnit[] = [
  {
    id: "hero_venca_2d",
    name: "Venca Česnekáč",
    spriteUrl: SPRITE_PRESETS.vencaHunter,
    scale: "hero",
    gridPos: { x: 1, y: 1 },
    facing: 1,
    isEnemy: false,
    hp: 60,
    maxHp: 60,
    attackDmg: 15,
  },
  {
    id: "enemy_lojzicek",
    name: "Kluk Lojzíček",
    spriteUrl: SPRITE_PRESETS.enemyLojzicek,
    scale: "small",
    gridPos: { x: 3, y: 1 },
    facing: -1,
    isEnemy: true,
    hp: 20,
    maxHp: 20,
    attackDmg: 6,
  },
  {
    id: "enemy_goblin_1",
    name: "Upírka Cilka",
    spriteUrl: SPRITE_PRESETS.enemyVampireCilka,
    scale: "small",
    gridPos: { x: 4, y: 1 },
    facing: -1,
    isEnemy: true,
    hp: 35,
    maxHp: 35,
    attackDmg: 9,
  },
  {
    id: "enemy_goblin_2",
    name: "Dráb Halapartník",
    spriteUrl: SPRITE_PRESETS.enemyDrab,
    scale: "human",
    gridPos: { x: 4, y: 2 },
    facing: -1,
    isEnemy: true,
    hp: 45,
    maxHp: 45,
    attackDmg: 12,
  },
];

interface TacticalAnimationDemoProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TacticalAnimationDemo({
  isOpen,
  onClose,
}: TacticalAnimationDemoProps) {
  const [units, setUnits] = useState<TacticalUnit[]>(() =>
    INITIAL_UNITS.map((u) => ({ ...u, gridPos: { ...u.gridPos } }))
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string>("hero_venca_2d");
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [useFallbackPixelArt, setUseFallbackPixelArt] = useState<boolean>(false);
  const [combatLog, setCombatLog] = useState<string[]>([
    "⚔️ Klikni na zelené pole pro pohyb (Hop) nebo na nepřítele pro kompletní sekvenci (Move → Lunge 60% → 60ms Hit-Stop → Flash & Shake → Counter-Attack)!",
  ]);

  const spriteRefs = useRef<Record<string, UnitSpriteHandle | null>>({});

  const appendLog = useCallback((msg: string) => {
    setCombatLog((prev) => [msg, ...prev.slice(0, 7)]);
  }, []);

  // Listen for Escape key when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const getSpriteForUnit = (u: TacticalUnit) => {
    if (useFallbackPixelArt) {
      return u.isEnemy
        ? SPRITE_PRESETS.pixelGoblinFallback
        : SPRITE_PRESETS.pixelKnightFallback;
    }
    return u.spriteUrl;
  };

  const findAdjacentTileToward = (
    from: GridPos,
    target: GridPos,
    allUnits: TacticalUnit[],
    moverId: string
  ): GridPos => {
    const dist = Math.abs(target.x - from.x) + Math.abs(target.y - from.y);
    if (dist <= 1) return from;

    const candidates: GridPos[] = [
      { x: target.x - 1, y: target.y },
      { x: target.x + 1, y: target.y },
      { x: target.x, y: target.y - 1 },
      { x: target.x, y: target.y + 1 },
    ].filter(
      (p) =>
        p.x >= 0 &&
        p.x < ANIMATION_CONFIG.grid.cols &&
        p.y >= 0 &&
        p.y < ANIMATION_CONFIG.grid.rows &&
        !allUnits.some(
          (u) =>
            u.hp > 0 &&
            u.id !== moverId &&
            u.gridPos.x === p.x &&
            u.gridPos.y === p.y
        )
    );

    if (candidates.length === 0) return from;
    candidates.sort(
      (a, b) =>
        Math.abs(a.x - from.x) +
        Math.abs(a.y - from.y) -
        (Math.abs(b.x - from.x) + Math.abs(b.y - from.y))
    );
    return candidates[0];
  };

  // Full Turn-Based Execution: Player Move -> Attack -> Hit -> Enemy Counter-Attack
  const handleTileClick = async (tx: number, ty: number) => {
    if (isBusy) return;
    const player = units.find((u) => !u.isEnemy);
    if (!player || player.hp <= 0) {
      appendLog("💀 Venca padl! Klikni na Reset v panelu napravo.");
      return;
    }

    const clickedUnit = units.find(
      (u) => u.hp > 0 && u.gridPos.x === tx && u.gridPos.y === ty
    );

    // Clicking own unit selects it for debug panel
    if (clickedUnit && !clickedUnit.isEnemy) {
      setSelectedUnitId(clickedUnit.id);
      return;
    }

    setIsBusy(true);
    let currentUnits = units.map((u) => ({ ...u, gridPos: { ...u.gridPos } }));
    const heroHandle = spriteRefs.current[player.id];

    try {
      if (clickedUnit && clickedUnit.isEnemy) {
        setSelectedUnitId(clickedUnit.id);
        const enemyHandle = spriteRefs.current[clickedUnit.id];

        // 1. Move to adjacent tile if not already adjacent
        const approachPos = findAdjacentTileToward(
          player.gridPos,
          clickedUnit.gridPos,
          currentUnits,
          player.id
        );

        if (
          approachPos.x !== player.gridPos.x ||
          approachPos.y !== player.gridPos.y
        ) {
          const newFacing: 1 | -1 =
            approachPos.x >= player.gridPos.x ? 1 : -1;
          appendLog(
            `👣 ${player.name} doskočil na pole [${approachPos.x + 1}, ${approachPos.y + 1}]...`
          );
          await heroHandle?.moveTo(approachPos);
          currentUnits = currentUnits.map((u) =>
            u.id === player.id
              ? { ...u, gridPos: approachPos, facing: newFacing }
              : u
          );
          setUnits(currentUnits);
        }

        // 2. Attack Lunge (Wind-up -> 60% Lunge -> 60ms Hit-Stop -> Spring Back)
        appendLog(
          `⚔️ ${player.name} útočí na ${clickedUnit.name} (−${player.attackDmg} HP)!`
        );
        const attackFacing: 1 | -1 =
          clickedUnit.gridPos.x >= approachPos.x ? 1 : -1;
        currentUnits = currentUnits.map((u) =>
          u.id === player.id ? { ...u, facing: attackFacing } : u
        );
        setUnits(currentUnits);

        // Start attack and trigger target hit reaction right at the apex!
        const attackPromise = heroHandle?.playAttack(clickedUnit.gridPos);
        const newEnemyHp = Math.max(0, clickedUnit.hp - player.attackDmg);
        currentUnits = currentUnits.map((u) =>
          u.id === clickedUnit.id ? { ...u, hp: newEnemyHp } : u
        );
        setUnits(currentUnits);

        await Promise.all([
          attackPromise,
          enemyHandle?.playHit(player.attackDmg),
        ]);

        if (newEnemyHp <= 0) {
          appendLog(`💀 ${clickedUnit.name} je zlikvidován!`);
          await enemyHandle?.playDeath();
        }
      } else {
        // Click on empty tile -> Parabolic Hop Move
        if (tx === player.gridPos.x && ty === player.gridPos.y) {
          setIsBusy(false);
          return;
        }
        const newFacing: 1 | -1 = tx >= player.gridPos.x ? 1 : -1;
        appendLog(`👣 ${player.name} přeskočil na pole [${tx + 1}, ${ty + 1}].`);
        await heroHandle?.moveTo({ x: tx, y: ty });
        currentUnits = currentUnits.map((u) =>
          u.id === player.id
            ? { ...u, gridPos: { x: tx, y: ty }, facing: newFacing }
            : u
        );
        setUnits(currentUnits);
      }

      // 3. Enemy Counter-Attack Turn (Async Sequenced)
      const livingEnemies = currentUnits.filter((u) => u.isEnemy && u.hp > 0);
      for (const enemy of livingEnemies) {
        const heroNow = currentUnits.find((u) => !u.isEnemy);
        if (!heroNow || heroNow.hp <= 0) break;

        const enemyHandle = spriteRefs.current[enemy.id];
        const dist =
          Math.abs(heroNow.gridPos.x - enemy.gridPos.x) +
          Math.abs(heroNow.gridPos.y - enemy.gridPos.y);

        // Step 1 tile closer if out of melee reach
        let enemyPos = enemy.gridPos;
        if (dist > 1) {
          const stepX =
            enemy.gridPos.x + Math.sign(heroNow.gridPos.x - enemy.gridPos.x);
          const stepY =
            stepX !== enemy.gridPos.x
              ? enemy.gridPos.y
              : enemy.gridPos.y +
                Math.sign(heroNow.gridPos.y - enemy.gridPos.y);

          const occupied = currentUnits.some(
            (u) =>
              u.hp > 0 && u.gridPos.x === stepX && u.gridPos.y === stepY
          );
          if (!occupied) {
            enemyPos = { x: stepX, y: stepY };
            const stepFacing: 1 | -1 =
              stepX <= enemy.gridPos.x ? -1 : 1;
            await enemyHandle?.moveTo(enemyPos);
            currentUnits = currentUnits.map((u) =>
              u.id === enemy.id
                ? { ...u, gridPos: enemyPos, facing: stepFacing }
                : u
            );
            setUnits(currentUnits);
          }
        }

        const newDist =
          Math.abs(heroNow.gridPos.x - enemyPos.x) +
          Math.abs(heroNow.gridPos.y - enemyPos.y);

        if (newDist <= 2) {
          appendLog(
            `🧛 ${enemy.name} vrací úder postavě ${heroNow.name} (−${enemy.attackDmg} HP)!`
          );
          const nextHeroHp = Math.max(0, heroNow.hp - enemy.attackDmg);
          currentUnits = currentUnits.map((u) =>
            u.id === heroNow.id ? { ...u, hp: nextHeroHp } : u
          );
          setUnits(currentUnits);

          await Promise.all([
            enemyHandle?.playAttack(heroNow.gridPos),
            heroHandle?.playHit(enemy.attackDmg),
          ]);

          if (nextHeroHp <= 0) {
            appendLog(`💀 ${heroNow.name} padl v boji!`);
            await heroHandle?.playDeath();
          }
        }
      }
    } finally {
      setIsBusy(false);
    }
  };

  // Debug Panel Triggers for Selected Unit
  const selectedUnit =
    units.find((u) => u.id === selectedUnitId) || units[0];

  const triggerDebugIdle = () => {
    const handle = spriteRefs.current[selectedUnit.id];
    handle?.playIdle();
    appendLog(`🔄 [Debug] ${selectedUnit.name}: Idle dýchání (squash & stretch).`);
  };

  const triggerDebugHop = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const handle = spriteRefs.current[selectedUnit.id];
      const candidates: GridPos[] = [
        { x: selectedUnit.gridPos.x + selectedUnit.facing, y: selectedUnit.gridPos.y },
        { x: selectedUnit.gridPos.x - selectedUnit.facing, y: selectedUnit.gridPos.y },
        { x: selectedUnit.gridPos.x, y: (selectedUnit.gridPos.y + 1) % ANIMATION_CONFIG.grid.rows },
      ].filter(
        (p) =>
          p.x >= 0 &&
          p.x < ANIMATION_CONFIG.grid.cols &&
          p.y >= 0 &&
          p.y < ANIMATION_CONFIG.grid.rows &&
          !units.some((u) => u.hp > 0 && u.gridPos.x === p.x && u.gridPos.y === p.y)
      );
      const targetPos = candidates[0] || selectedUnit.gridPos;
      appendLog(
        `🐇 [Debug] ${selectedUnit.name}: Parabolický skok na [${targetPos.x + 1}, ${targetPos.y + 1}].`
      );
      await handle?.moveTo(targetPos);
      setUnits((prev) =>
        prev.map((u) =>
          u.id === selectedUnit.id ? { ...u, gridPos: targetPos } : u
        )
      );
    } finally {
      setIsBusy(false);
    }
  };

  const triggerDebugAttack = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const handle = spriteRefs.current[selectedUnit.id];
      const target =
        units.find((u) => u.id !== selectedUnit.id && u.hp > 0) || {
          gridPos: {
            x: Math.min(
              ANIMATION_CONFIG.grid.cols - 1,
              Math.max(0, selectedUnit.gridPos.x + selectedUnit.facing)
            ),
            y: selectedUnit.gridPos.y,
          },
        };
      appendLog(
        `⚡ [Debug] ${selectedUnit.name}: Nápřah → Výpad 60% → 60ms Hit-Stop → Pružina zpět.`
      );
      await handle?.playAttack(target.gridPos);
    } finally {
      setIsBusy(false);
    }
  };

  const triggerDebugHit = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const handle = spriteRefs.current[selectedUnit.id];
      const dmg = 15;
      appendLog(
        `💥 [Debug] ${selectedUnit.name}: 120ms Silhouette Flash + Shake + Squash (−${dmg} HP).`
      );
      setUnits((prev) =>
        prev.map((u) =>
          u.id === selectedUnit.id
            ? { ...u, hp: Math.max(1, u.hp - dmg) }
            : u
        )
      );
      await handle?.playHit(dmg);
    } finally {
      setIsBusy(false);
    }
  };

  const triggerDebugDeath = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const handle = spriteRefs.current[selectedUnit.id];
      appendLog(
        `💀 [Debug] ${selectedUnit.name}: Třes → Rudý tón → Pád na bok → Rozplynutí.`
      );
      setUnits((prev) =>
        prev.map((u) => (u.id === selectedUnit.id ? { ...u, hp: 0 } : u))
      );
      await handle?.playDeath();
    } finally {
      setIsBusy(false);
    }
  };

  const triggerResetAll = async () => {
    setIsBusy(true);
    try {
      const fresh = INITIAL_UNITS.map((u) => ({
        ...u,
        gridPos: { ...u.gridPos },
      }));
      setUnits(fresh);
      await Promise.all(
        fresh.map((u) => spriteRefs.current[u.id]?.reset())
      );
      appendLog("✨ Všechny jednotky a pozice byly zresetovány.");
    } finally {
      setIsBusy(false);
    }
  };

  if (!isOpen) return null;

  const { cols, rows, tileWidth, tileHeight } = ANIMATION_CONFIG.grid;
  const boardWidth = cols * tileWidth;
  const boardHeight = rows * tileHeight;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-y-auto rounded-2xl border-4 border-amber-900/90 bg-stone-950 p-3 sm:p-4 text-amber-50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/50 pb-3">
          <div>
            <h2 className="font-serif text-base sm:text-xl font-black tracking-wide text-amber-300">
              🎬 2D Procedurální Animační Systém & Taktická Laboratoř (6×4)
            </h2>
            <p className="text-[11px] sm:text-xs text-stone-400">
              Framer Motion + Tailwind CSS · Silhouette Hit-Flash · Bottom-Anchored Squash & Stretch · 60ms Hit-Stop · Dynamický stín
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setUseFallbackPixelArt((v) => !v)}
              className="rounded-lg border border-amber-700/70 bg-stone-900 px-2.5 py-1.5 text-xs font-bold text-amber-200 hover:bg-stone-800"
            >
              {useFallbackPixelArt
                ? "🎨 Sprity: Pixel SVG"
                : "🧄 Sprity: Lovec upírů PNG"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border-2 border-red-800 bg-red-950/80 px-2.5 py-1.5 text-xs font-black text-red-200 hover:bg-red-900"
            >
              ✖ Zavřít
            </button>
          </div>
        </div>

        {/* Main Content: 6x4 Tactical Grid + Debug Control Panel */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left: 6x4 Playable Tactical Grid */}
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-stone-800 bg-stone-900/70 p-2.5 sm:p-4 lg:col-span-8">
            <div className="mb-2 flex w-full flex-wrap items-center justify-between gap-1 text-xs text-stone-300">
              <span>
                🟢 <strong>Klikni na dlaždici</strong> = Skok (MoveTo) · 🔴{" "}
                <strong>Klikni na nepřítele</strong> = Útok + Odveta
              </span>
              <span className="font-mono text-amber-400">
                {isBusy ? "⏳ Probíhá async sekvence..." : "✅ Připraveno"}
              </span>
            </div>

            <div className="w-full overflow-x-auto py-2 flex justify-start sm:justify-center">
              <div
                style={{ width: boardWidth, height: boardHeight }}
                className="relative shrink-0 rounded-xl border-4 border-stone-950 bg-stone-900 shadow-inner"
              >
                {/* 6x4 Grid Cells */}
                <div
                  style={{
                    gridTemplateColumns: `repeat(${cols}, ${tileWidth}px)`,
                    gridTemplateRows: `repeat(${rows}, ${tileHeight}px)`,
                  }}
                  className="grid h-full w-full"
                >
                  {Array.from({ length: rows * cols }, (_, idx) => {
                    const x = idx % cols;
                    const y = Math.floor(idx / cols);
                    const isDark = (x + y) % 2 === 1;
                    const occupant = units.find(
                      (u) =>
                        u.hp > 0 && u.gridPos.x === x && u.gridPos.y === y
                    );
                    const isEnemyTile = Boolean(occupant && occupant.isEnemy);
                    const isPlayerTile = Boolean(occupant && !occupant.isEnemy);

                    return (
                      <button
                        key={`${x}-${y}`}
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleTileClick(x, y)}
                        className={`group relative flex flex-col justify-between border border-stone-800/80 p-1.5 text-left transition-colors ${
                          isDark ? "bg-stone-800/75" : "bg-stone-800/40"
                        } ${
                          isEnemyTile
                            ? "hover:border-red-500 hover:bg-red-950/40"
                            : isPlayerTile
                            ? "border-amber-500/60 bg-amber-950/20"
                            : "hover:border-lime-400/70 hover:bg-lime-950/25"
                        }`}
                      >
                        <span className="font-mono text-[10px] font-bold text-stone-500 group-hover:text-stone-300">
                          [{x + 1},{y + 1}]
                        </span>
                        {isEnemyTile && (
                          <span className="self-end rounded bg-red-900/80 px-1 text-[9px] font-extrabold text-red-200 opacity-0 transition-opacity group-hover:opacity-100">
                            ⚔️ ÚTOK
                          </span>
                        )}
                        {!occupant && (
                          <span className="self-end rounded bg-lime-900/70 px-1 text-[9px] font-bold text-lime-200 opacity-0 transition-opacity group-hover:opacity-100">
                            👣 SKOK
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Unit Sprites Layer */}
                {units.map((u) => (
                  <UnitSprite
                    key={u.id}
                    ref={(instance) => {
                      spriteRefs.current[u.id] = instance;
                    }}
                    id={u.id}
                    name={u.name}
                    spriteUrl={getSpriteForUnit(u)}
                    scale={u.scale}
                    gridPos={u.gridPos}
                    facing={u.facing}
                    isEnemy={u.isEnemy}
                    hp={u.hp}
                    maxHp={u.maxHp}
                    tileWidth={tileWidth}
                    tileHeight={tileHeight}
                    speedMultiplier={speedMultiplier}
                    isSelected={selectedUnitId === u.id}
                    onClick={() => handleTileClick(u.gridPos.x, u.gridPos.y)}
                    onFacingChange={(nextFacing) => {
                      setUnits((prev) =>
                        prev.map((item) =>
                          item.id === u.id
                            ? { ...item, facing: nextFacing }
                            : item
                        )
                      );
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Combat Sequence Log */}
            <div className="mt-3 w-full rounded-lg border border-stone-800 bg-stone-950 p-2.5">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                📜 Záznam sekvence (Async Turn State Machine)
              </div>
              <div className="h-[72px] overflow-y-auto space-y-1 font-mono text-xs text-stone-300">
                {combatLog.slice(0, 4).map((entry, idx) => (
                  <div
                    key={idx}
                    className={idx === 0 ? "font-bold text-amber-200" : "opacity-70"}
                  >
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Live Debug Control Panel */}
          <div className="flex flex-col justify-between rounded-xl border-2 border-stone-800 bg-stone-900/90 p-4 lg:col-span-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-300">
                  🎛️ Debug Ovládací Panel
                </h3>
                <p className="text-xs text-stone-400">
                  Otestuj jednotlivé procedurální animace na vybrané jednotce.
                </p>
              </div>

              {/* Unit Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-300">
                  Vybraná jednotka pro test:
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {units.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUnitId(u.id)}
                      className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-left text-xs font-bold transition-all ${
                        selectedUnitId === u.id
                          ? "border-amber-400 bg-amber-950/60 text-amber-200"
                          : "border-stone-700 bg-stone-800/70 text-stone-300 hover:bg-stone-800"
                      }`}
                    >
                      <span>
                        {u.isEnemy ? "🧛 " : "🧄 "}
                        {u.name}
                      </span>
                      <span className="font-mono text-[11px]">
                        {u.hp}/{u.maxHp} HP
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Individual Animation Triggers */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-300">
                  Imperativní spouštěče (useImperativeHandle):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={triggerDebugIdle}
                    className="rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-xs font-bold text-amber-100 hover:border-amber-400 hover:bg-stone-700 disabled:opacity-50"
                  >
                    🌬️ Idle (Dech)
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={triggerDebugHop}
                    className="rounded-lg border border-lime-800 bg-lime-950/60 px-3 py-2 text-xs font-bold text-lime-200 hover:border-lime-400 hover:bg-lime-900/60 disabled:opacity-50"
                  >
                    🐇 Hop (moveTo)
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={triggerDebugAttack}
                    className="rounded-lg border border-amber-700 bg-amber-950/60 px-3 py-2 text-xs font-bold text-amber-200 hover:border-amber-400 hover:bg-amber-900/60 disabled:opacity-50"
                  >
                    ⚔️ Attack (Lunge)
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={triggerDebugHit}
                    className="rounded-lg border border-red-800 bg-red-950/60 px-3 py-2 text-xs font-bold text-red-200 hover:border-red-400 hover:bg-red-900/60 disabled:opacity-50"
                  >
                    💥 Hit (Flash)
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={triggerDebugDeath}
                    className="rounded-lg border border-purple-800 bg-purple-950/60 px-3 py-2 text-xs font-bold text-purple-200 hover:border-purple-400 hover:bg-purple-900/60 disabled:opacity-50"
                  >
                    💀 Death (Pád)
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={triggerResetAll}
                    className="rounded-lg border border-sky-700 bg-sky-950/70 px-3 py-2 text-xs font-bold text-sky-200 hover:border-sky-400 hover:bg-sky-900/70 disabled:opacity-50"
                  >
                    🔄 Reset Všech
                  </button>
                </div>
              </div>

              {/* Live Speed Multiplier Slider */}
              <div className="space-y-1.5 rounded-lg border border-stone-800 bg-stone-950/80 p-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-stone-300">⚡ Rychlost animací:</span>
                  <span className="font-mono text-amber-400">
                    {speedMultiplier.toFixed(2)}×
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.5}
                  step={0.25}
                  value={speedMultiplier}
                  onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-stone-500">
                  <span>0.5× (Slow-Mo)</span>
                  <span>1.0×</span>
                  <span>2.5× (Turbo)</span>
                </div>
              </div>
            </div>

            {/* Physics Config Summary */}
            <div className="mt-4 rounded-lg border border-stone-800 bg-stone-950/90 p-3 text-[11px] text-stone-400">
              <div className="mb-1 font-bold text-amber-300">
                📐 Aktivní ANIMATION_CONFIG (v hlavní hře i 2D aréně):
              </div>
              <ul className="space-y-0.5 font-mono text-[10px]">
                <li>• Idle: scaleY [1, 1.05, 1], scaleX [1, 0.97, 1]</li>
                <li>• Lunge: 60% cílové vzdálenosti + 60ms Hit-Stop</li>
                <li>• Hit: 120ms Silhouette Flash + Squash (1.25×, 0.8×)</li>
                <li>• Anchor: origin-bottom (50% 100%) + eliptický stín</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
