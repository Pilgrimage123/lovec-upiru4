import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";

import {
  ANIMATION_CONFIG,
  FALLBACK_DATA_URIS,
  type GridPos,
} from "./unitSpriteConfig";

export type { GridPos };

export interface FloatingCombatPopup {
  id: string;
  text: string;
  tone: "damage" | "heal" | "info";
}

export interface UnitSpriteHandle {
  /** Start/restore continuous subtle vertical breathing */
  playIdle: () => void;
  /** Smoothly interpolate grid coordinates with parabolic vertical hop, forward tilt & auto-flip */
  moveTo: (targetGridPos: GridPos) => Promise<void>;
  /** Wind up backward, lunge 60% toward target tile, hold 60ms hit-stop at apex, spring back */
  playAttack: (targetGridPos: GridPos) => Promise<void>;
  /** High-frequency horizontal shake, 120ms white/red silhouette flash, bottom squash + floating damage */
  playHit: (damageAmount: number, customLabel?: string) => Promise<void>;
  /** Shake violently, tint red, flatten/rotate onto side, and dissolve to opacity 0 */
  playDeath: () => Promise<void>;
  /** Reset unit state to upright full visibility and restart idle breathing */
  reset: () => Promise<void>;
}

export interface UnitSpriteProps {
  id: string;
  name?: string;
  spriteUrl: string;
  scale?: "hero" | "boss" | "human" | "small" | "beast" | "critter";
  gridPos: GridPos;
  facing: 1 | -1;
  isEnemy?: boolean;
  hp: number;
  maxHp: number;
  tileWidth?: number;
  tileHeight?: number;
  speedMultiplier?: number;
  isSelected?: boolean;
  onClick?: () => void;
  onFacingChange?: (newFacing: 1 | -1) => void;
}

function deterministicDelaySec(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 33 + id.charCodeAt(i)) >>> 0;
  }
  return (hash % 18) * 0.11;
}

function sleepMs(ms: number, speed = 1): Promise<void> {
  const effective = Math.max(8, Math.round(ms / Math.max(0.1, speed)));
  return new Promise((resolve) => setTimeout(resolve, effective));
}

// ============================================================================
// 4. REUSABLE <UnitSprite /> COMPONENT
// ============================================================================
export const UnitSprite = forwardRef<UnitSpriteHandle, UnitSpriteProps>(
  function UnitSprite(
    {
      id,
      name,
      spriteUrl,
      scale,
      gridPos,
      facing,
      isEnemy = false,
      hp,
      maxHp,
      tileWidth = ANIMATION_CONFIG.grid.tileWidth,
      tileHeight = ANIMATION_CONFIG.grid.tileHeight,
      speedMultiplier = 1,
      isSelected = false,
      onClick,
      onFacingChange,
    },
    ref
  ) {
    // Controls for grid translation (x, y in world pixels)
    const posControls = useAnimationControls();
    // Controls for the bottom-anchored sprite transform (hop y, rotate, scaleX, scaleY, opacity)
    const bodyControls = useAnimationControls();
    // Controls for the elliptical ground shadow
    const shadowControls = useAnimationControls();

    const [currentFacing, setCurrentFacing] = useState<1 | -1>(facing);
    const [flashMode, setFlashMode] = useState<"none" | "white" | "red">("none");
    const [isDead, setIsDead] = useState(hp <= 0);
    const [popups, setPopups] = useState<FloatingCombatPopup[]>([]);
    const [resolvedSrc, setResolvedSrc] = useState(spriteUrl);

    const currentGridRef = useRef<GridPos>(gridPos);
    const speedRef = useRef(speedMultiplier);
    speedRef.current = speedMultiplier;

    useEffect(() => {
      setResolvedSrc(spriteUrl);
    }, [spriteUrl]);

    useEffect(() => {
      setCurrentFacing(facing);
    }, [facing]);

    // Sync external gridPos updates when not mid-tween
    useEffect(() => {
      currentGridRef.current = { x: gridPos.x, y: gridPos.y };
      posControls.set({
        x: gridPos.x * tileWidth,
        y: gridPos.y * tileHeight,
      });
    }, [gridPos.x, gridPos.y, tileWidth, tileHeight, posControls]);

    const idleDelay = useMemo(() => deterministicDelaySec(id), [id]);

    const startIdleLoop = useCallback(() => {
      const spd = Math.max(0.25, speedRef.current);
      const dur = ANIMATION_CONFIG.idle.durationSec / spd;

      bodyControls.start({
        y: 0,
        rotate: 0,
        opacity: 1,
        scaleY: [...ANIMATION_CONFIG.idle.scaleY],
        scaleX: [...ANIMATION_CONFIG.idle.scaleX],
        transition: {
          scaleY: {
            duration: dur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: idleDelay,
          },
          scaleX: {
            duration: dur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: idleDelay,
          },
          y: { duration: 0.12 },
          rotate: { duration: 0.12 },
          opacity: { duration: 0.12 },
        },
      });

      shadowControls.start({
        scaleX: [1, 0.92, 1],
        scaleY: [1, 0.94, 1],
        opacity: [0.68, 0.54, 0.68],
        transition: {
          duration: dur,
          repeat: Infinity,
          ease: "easeInOut",
          delay: idleDelay,
        },
      });
    }, [bodyControls, shadowControls, idleDelay]);

    useEffect(() => {
      if (!isDead) {
        startIdleLoop();
      }
      return () => {
        bodyControls.stop();
        shadowControls.stop();
      };
    }, [isDead, startIdleLoop, bodyControls, shadowControls]);

    const spawnPopup = useCallback(
      (text: string, tone: FloatingCombatPopup["tone"] = "damage") => {
        const popupId = `${id}_pop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        setPopups((prev) => [...prev, { id: popupId, text, tone }]);
        const ttl = Math.round(
          (ANIMATION_CONFIG.floatingText.durationSec * 1000) /
            Math.max(0.25, speedRef.current)
        );
        setTimeout(() => {
          setPopups((prev) => prev.filter((p) => p.id !== popupId));
        }, ttl + 80);
      },
      [id]
    );

    // Expose async procedural animation triggers
    useImperativeHandle(
      ref,
      () => ({
        playIdle() {
          setIsDead(false);
          setFlashMode("none");
          startIdleLoop();
        },

        async moveTo(targetGridPos: GridPos) {
          const spd = Math.max(0.25, speedRef.current);
          const from = currentGridRef.current;
          const dx = targetGridPos.x - from.x;

          // Automatic horizontal flipping based on movement direction
          let nextFacing = currentFacing;
          if (dx !== 0) {
            nextFacing = dx > 0 ? 1 : -1;
            setCurrentFacing(nextFacing);
            onFacingChange?.(nextFacing);
          }

          const duration = ANIMATION_CONFIG.move.durationSec / spd;
          const hopH = ANIMATION_CONFIG.move.hopHeightPx;
          const tilt = ANIMATION_CONFIG.move.tiltDeg;

          bodyControls.stop();
          shadowControls.stop();

          const movePromise = posControls.start({
            x: targetGridPos.x * tileWidth,
            y: targetGridPos.y * tileHeight,
            transition: {
              duration,
              ease: [0.22, 1, 0.36, 1],
            },
          });

          const hopPromise = bodyControls.start({
            y: [0, -hopH * 0.3, -hopH, 0, 0],
            rotate: [0, tilt * 0.6, tilt, -tilt * 0.25, 0],
            scaleX: [
              1,
              ANIMATION_CONFIG.move.takeoffSquash.scaleX,
              0.95,
              ANIMATION_CONFIG.move.landingSquash.scaleX,
              1,
            ],
            scaleY: [
              1,
              ANIMATION_CONFIG.move.takeoffSquash.scaleY,
              1.06,
              ANIMATION_CONFIG.move.landingSquash.scaleY,
              1,
            ],
            transition: {
              duration,
              times: [0, 0.18, 0.48, 0.84, 1],
              ease: "easeOut",
            },
          });

          const shadowPromise = shadowControls.start({
            scaleX: [1, ANIMATION_CONFIG.move.shadowHopScale, 1.18, 1],
            scaleY: [1, ANIMATION_CONFIG.move.shadowHopScale, 0.9, 1],
            opacity: [0.68, ANIMATION_CONFIG.move.shadowHopOpacity, 0.78, 0.68],
            transition: {
              duration,
              times: [0, 0.48, 0.84, 1],
              ease: "easeOut",
            },
          });

          await Promise.all([movePromise, hopPromise, shadowPromise]);
          currentGridRef.current = targetGridPos;
          if (!isDead) startIdleLoop();
        },

        async playAttack(targetGridPos: GridPos) {
          const spd = Math.max(0.25, speedRef.current);
          const origin = currentGridRef.current;
          const deltaTilesX = targetGridPos.x - origin.x;
          const deltaTilesY = targetGridPos.y - origin.y;

          if (deltaTilesX !== 0) {
            const attackFacing: 1 | -1 = deltaTilesX > 0 ? 1 : -1;
            setCurrentFacing(attackFacing);
            onFacingChange?.(attackFacing);
          }

          const originPxX = origin.x * tileWidth;
          const originPxY = origin.y * tileHeight;
          const vectorPxX =
            deltaTilesX !== 0 || deltaTilesY !== 0
              ? deltaTilesX * tileWidth
              : currentFacing * tileWidth;
          const vectorPxY = deltaTilesY * tileHeight;

          bodyControls.stop();
          shadowControls.stop();

          // Phase 1: Anticipation wind-up slightly backward
          const windupDur = ANIMATION_CONFIG.attack.windupDurationSec / spd;
          await Promise.all([
            posControls.start({
              x: originPxX + vectorPxX * ANIMATION_CONFIG.attack.windupDistanceRatio,
              y: originPxY + vectorPxY * ANIMATION_CONFIG.attack.windupDistanceRatio,
              transition: { duration: windupDur, ease: "easeOut" },
            }),
            bodyControls.start({
              y: 0,
              rotate: ANIMATION_CONFIG.attack.windupRotateDeg,
              scaleX: ANIMATION_CONFIG.attack.windupScale.scaleX,
              scaleY: ANIMATION_CONFIG.attack.windupScale.scaleY,
              transition: { duration: windupDur, ease: "easeOut" },
            }),
            shadowControls.start({
              scaleX: 0.9,
              opacity: 0.75,
              transition: { duration: windupDur },
            }),
          ]);

          // Phase 2: Rapid lunge 60% of the way toward the target tile
          const lungeDur = ANIMATION_CONFIG.attack.lungeDurationSec / spd;
          await Promise.all([
            posControls.start({
              x: originPxX + vectorPxX * ANIMATION_CONFIG.attack.lungeDistanceRatio,
              y: originPxY + vectorPxY * ANIMATION_CONFIG.attack.lungeDistanceRatio,
              transition: { duration: lungeDur, ease: [0.08, 0.92, 0.18, 1] },
            }),
            bodyControls.start({
              y: -8,
              rotate: ANIMATION_CONFIG.attack.lungeRotateDeg,
              scaleX: ANIMATION_CONFIG.attack.lungeScale.scaleX,
              scaleY: ANIMATION_CONFIG.attack.lungeScale.scaleY,
              transition: { duration: lungeDur, ease: [0.08, 0.92, 0.18, 1] },
            }),
            shadowControls.start({
              scaleX: 1.26,
              scaleY: 0.72,
              opacity: 0.42,
              transition: { duration: lungeDur },
            }),
          ]);

          // Phase 3: Brief 60ms Hit-Stop pause at the apex!
          await sleepMs(ANIMATION_CONFIG.attack.hitStopMs, spd);

          // Phase 4: Spring back to origin tile
          await Promise.all([
            posControls.start({
              x: originPxX,
              y: originPxY,
              transition: {
                type: "spring",
                stiffness: ANIMATION_CONFIG.attack.springStiffness * spd,
                damping: ANIMATION_CONFIG.attack.springDamping,
              },
            }),
            bodyControls.start({
              y: 0,
              rotate: 0,
              scaleX: 1,
              scaleY: 1,
              transition: {
                type: "spring",
                stiffness: ANIMATION_CONFIG.attack.springStiffness * spd,
                damping: ANIMATION_CONFIG.attack.springDamping,
              },
            }),
            shadowControls.start({
              scaleX: 1,
              scaleY: 1,
              opacity: 0.68,
              transition: { duration: 0.16 / spd },
            }),
          ]);

          if (!isDead) startIdleLoop();
        },

        async playHit(damageAmount: number, customLabel?: string) {
          const spd = Math.max(0.25, speedRef.current);
          const origin = currentGridRef.current;
          const originPxX = origin.x * tileWidth;
          const originPxY = origin.y * tileHeight;
          const shake = ANIMATION_CONFIG.hit.shakeAmplitudePx;
          const duration = ANIMATION_CONFIG.hit.durationSec / spd;

          bodyControls.stop();
          shadowControls.stop();

          // Spawn floating combat text popup (-15 HP) that arcs upward and fades out
          const label = customLabel ?? `-${damageAmount} HP`;
          spawnPopup(label, "damage");

          // Silhouette Flash for 120ms (White -> Red -> None) on PNG pixels only
          setFlashMode("white");
          const whiteTimer = setTimeout(() => {
            setFlashMode("red");
          }, Math.max(20, Math.round(ANIMATION_CONFIG.hit.whiteFlashMs / spd)));

          const clearTimer = setTimeout(() => {
            setFlashMode("none");
          }, Math.max(40, Math.round(ANIMATION_CONFIG.hit.flashDurationMs / spd)));

          await Promise.all([
            posControls.start({
              x: [
                originPxX,
                originPxX - shake,
                originPxX + shake,
                originPxX - shake * 0.75,
                originPxX + shake * 0.55,
                originPxX - shake * 0.3,
                originPxX,
              ],
              y: originPxY,
              transition: { duration, ease: "easeOut" },
            }),
            bodyControls.start({
              y: [0, 2, -2, 0],
              rotate: [0, -6, 4, -2, 0],
              scaleX: [1, ANIMATION_CONFIG.hit.squashScaleX, 0.92, 1.04, 1],
              scaleY: [1, ANIMATION_CONFIG.hit.squashScaleY, 1.09, 0.97, 1],
              transition: {
                duration,
                times: [0, 0.2, 0.52, 0.78, 1],
                ease: [0.22, 1, 0.36, 1],
              },
            }),
            shadowControls.start({
              scaleX: [1, 1.28, 0.94, 1],
              scaleY: [1, 1.1, 0.96, 1],
              transition: { duration },
            }),
          ]);

          clearTimeout(whiteTimer);
          clearTimeout(clearTimer);
          setFlashMode("none");

          if (!isDead) startIdleLoop();
        },

        async playDeath() {
          const spd = Math.max(0.25, speedRef.current);
          const origin = currentGridRef.current;
          const originPxX = origin.x * tileWidth;
          const originPxY = origin.y * tileHeight;

          setIsDead(true);
          bodyControls.stop();
          shadowControls.stop();

          // Phase 1: Violent horizontal shake + crimson tint
          setFlashMode("red");
          const shakeDur = ANIMATION_CONFIG.death.shakeDurationSec / spd;
          await posControls.start({
            x: [
              originPxX,
              originPxX - 11,
              originPxX + 11,
              originPxX - 9,
              originPxX + 8,
              originPxX - 5,
              originPxX,
            ],
            y: originPxY,
            transition: { duration: shakeDur, ease: "linear" },
          });

          // Phase 2: Flatten/rotate onto side and dissolve to opacity 0
          const fallDur = ANIMATION_CONFIG.death.fallDurationSec / spd;
          await Promise.all([
            bodyControls.start({
              y: 12,
              rotate: ANIMATION_CONFIG.death.rotateDeg,
              scaleX: ANIMATION_CONFIG.death.flattenScaleX,
              scaleY: ANIMATION_CONFIG.death.flattenScaleY,
              opacity: 0,
              transition: { duration: fallDur, ease: "easeIn" },
            }),
            shadowControls.start({
              scaleX: 0.25,
              scaleY: 0.25,
              opacity: 0,
              transition: { duration: fallDur, ease: "easeOut" },
            }),
          ]);

          setFlashMode("none");
        },

        async reset() {
          setIsDead(false);
          setFlashMode("none");
          bodyControls.stop();
          shadowControls.stop();
          posControls.set({
            x: currentGridRef.current.x * tileWidth,
            y: currentGridRef.current.y * tileHeight,
          });
          bodyControls.set({
            y: 0,
            rotate: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
          });
          shadowControls.set({
            scaleX: 1,
            scaleY: 1,
            opacity: 0.68,
          });
          startIdleLoop();
        },
      }),
      [
        bodyControls,
        currentFacing,
        isDead,
        onFacingChange,
        posControls,
        shadowControls,
        spawnPopup,
        startIdleLoop,
        tileHeight,
        tileWidth,
      ]
    );

    // Silhouette Hit-Flash CSS filter: ONLY affects non-transparent PNG pixels
    const silhouetteFilter =
      flashMode === "white"
        ? "brightness(0) invert(1) drop-shadow(0 0 12px rgba(255,255,255,0.95))"
        : flashMode === "red"
        ? "brightness(1.8) sepia(1) hue-rotate(-50deg) saturate(7) drop-shadow(0 0 12px rgba(220,38,38,0.95))"
        : "drop-shadow(0 0 2px rgba(255,255,255,0.75)) drop-shadow(0 4px 6px rgba(0,0,0,0.85))";

    const hpPercent = Math.max(0, Math.min(100, Math.round((hp / Math.max(1, maxHp)) * 100)));

    const scaleMode =
      scale ||
      (id.includes("venca") || id.startsWith("hero") || !isEnemy
        ? "hero"
        : id.includes("lojz") ||
          id.includes("kamen") ||
          id.includes("cilka") ||
          id.includes("trpaslik") ||
          id.includes("smudla") ||
          name?.toLowerCase().includes("lojzíček") ||
          name?.toLowerCase().includes("cilka") ||
          name?.toLowerCase().includes("šmudla")
        ? "small"
        : id.includes("dagmar") || id.includes("sosak") || id.includes("drakula") || id.includes("nochtic") || id.includes("nochtic")
        ? "boss"
        : id.includes("vlkodav") || id.includes("buldok") || id.includes("divocak") || id.includes("prase")
        ? "beast"
        : id.includes("krysa") || id.includes("piskota")
        ? "critter"
        : "human");
    const spriteHeightPx =
      scaleMode === "boss"
        ? 125
        : scaleMode === "hero"
        ? 110
        : scaleMode === "human"
        ? 85
        : scaleMode === "beast"
        ? 52
        : scaleMode === "small"
        ? 44
        : scaleMode === "critter"
        ? 30
        : 85;
    const shadowWidthPx =
      scaleMode === "boss"
        ? 80
        : scaleMode === "hero"
        ? 84
        : scaleMode === "human"
        ? 54
        : scaleMode === "beast"
        ? 48
        : scaleMode === "small"
        ? 26
        : 48;

    return (
      <motion.div
        animate={posControls}
        initial={{
          x: gridPos.x * tileWidth,
          y: gridPos.y * tileHeight,
        }}
        onClick={onClick}
        style={{
          width: tileWidth,
          height: tileHeight,
        }}
        className={`absolute top-0 left-0 z-20 flex flex-col items-center justify-end pb-2 select-none ${
          onClick ? "cursor-pointer" : "pointer-events-none"
        }`}
      >
        {/* Floating Combat Text Popups (-15 HP) arcing upward */}
        <div className="pointer-events-none absolute -top-8 left-1/2 z-40 -translate-x-1/2">
          <AnimatePresence>
            {popups.map((popup) => (
              <motion.div
                key={popup.id}
                initial={{ opacity: 0, y: 8, x: 0, scale: 0.65 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: [8, -18, -36, ANIMATION_CONFIG.floatingText.arcHeightPx],
                  x: [0, 6, 11, ANIMATION_CONFIG.floatingText.arcDriftPx],
                  scale: [0.65, 1.22, 1.02, 0.88],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration:
                    ANIMATION_CONFIG.floatingText.durationSec /
                    Math.max(0.25, speedMultiplier),
                  ease: "easeOut",
                }}
                className={`whitespace-nowrap rounded-md border-2 border-stone-950 px-2 py-0.5 font-extrabold text-xs shadow-lg ${
                  popup.tone === "heal"
                    ? "bg-lime-600 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {popup.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Compact Overhead Health Bar & Nameplate (Never mirrored by facing!) */}
        <motion.div
          animate={{ opacity: isDead ? 0.25 : 1 }}
          className={`pointer-events-none z-30 mb-1 flex w-[92px] flex-col items-center rounded-md border px-1.5 py-0.5 shadow-md transition-colors ${
            isSelected
              ? "border-amber-300 bg-stone-900/95 ring-2 ring-amber-400/50"
              : "border-stone-800 bg-stone-950/90"
          }`}
        >
          <div className="flex w-full items-center justify-between gap-1 text-[10px] font-bold leading-tight text-amber-100">
            <span className="truncate">{name || id}</span>
            <span className="text-[9px] text-amber-400">
              {currentFacing === 1 ? "▶" : "◀"}
            </span>
          </div>
          <div className="relative mt-0.5 h-3 w-full overflow-hidden rounded bg-stone-800 border border-stone-950">
            <div
              className={`h-full transition-all duration-200 ${
                isEnemy ? "bg-red-600" : "bg-lime-500"
              }`}
              style={{ width: `${hpPercent}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white drop-shadow">
              {Math.max(0, hp)}/{maxHp}
            </span>
          </div>
        </motion.div>

        {/* Dynamic Elliptical Ground Shadow */}
        <motion.div
          animate={shadowControls}
          style={{ transformOrigin: "50% 50%", width: `${shadowWidthPx}px` }}
          className="pointer-events-none absolute bottom-1.5 h-3.5 rounded-full bg-black/75 blur-[1px]"
        />

        {/* Horizontal Flip Wrapper (facing: 1 or -1) anchored at bottom-center */}
        <div
          style={{
            transform: `scaleX(${currentFacing})`,
            transformOrigin: "50% 100%",
            height: `${spriteHeightPx}px`,
          }}
          className="relative z-10 flex w-auto max-w-[130px] items-end justify-center origin-bottom overflow-visible"
        >
          {/* Procedural Squash-and-Stretch + Hop + Lunge Body anchored at bottom-center */}
          <motion.img
            animate={bodyControls}
            src={resolvedSrc}
            alt={name || id}
            draggable={false}
            onError={() => {
              const fallback = isEnemy
                ? FALLBACK_DATA_URIS.enemyGoblin
                : FALLBACK_DATA_URIS.playerKnight;
              if (resolvedSrc !== fallback) {
                setResolvedSrc(fallback);
              }
            }}
            style={{
              transformOrigin: "50% 100%",
              imageRendering: "pixelated",
              filter: silhouetteFilter,
            }}
            className="h-full w-auto max-w-[150%] object-contain object-bottom origin-bottom select-none pointer-events-none"
          />
        </div>
      </motion.div>
    );
  }
);
