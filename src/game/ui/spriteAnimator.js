// @ts-nocheck
/**
 * Modular Procedural 2D Sprite Animation Controller for Lovec upírů.
 * Brings static transparent PNG sprites (Hunters, Vampires, Beasts, Bosses)
 * to life using procedural squash-and-stretch, parabolic hops, 60% target lunges
 * with 60ms hit-stop pauses, 120ms silhouette hit-flashes, and dynamic ground shadows.
 */

export const ANIMATION_CONFIG = {
  idle: {
    scaleY: [1, 1.05, 1],
    scaleX: [1, 0.97, 1],
    durationSec: 2.35
  },
  move: {
    hopHeightPx: 26,
    leapHeightPx: 44,
    tiltDeg: 9,
    durationMs: 360,
    leapDurationMs: 380,
    takeoffScale: { x: 0.91, y: 1.09 },
    apexScale: { x: 0.95, y: 1.06 },
    landingSquash: { x: 1.16, y: 0.86 },
    shadowHopScale: 0.58,
    shadowHopOpacity: 0.28
  },
  attack: {
    windupPx: -15,
    windupRotateDeg: -8,
    windupScale: { x: 0.92, y: 1.08 },
    windupMs: 95,
    lungeDistanceRatio: 0.6,
    maxLungePx: 190,
    minLungePx: 42,
    lungeRotateDeg: 10,
    lungeScale: { x: 1.14, y: 0.9 },
    lungeMs: 85,
    hitStopMs: 60,
    recoverMs: 175
  },
  hit: {
    flashDurationMs: 120,
    whiteFlashMs: 65,
    redFlashMs: 55,
    shakeAmplitudePx: 9,
    squashScale: { x: 1.25, y: 0.8 },
    durationMs: 360
  },
  death: {
    shakeMs: 180,
    fallMs: 460,
    totalMs: 640,
    rotateDeg: -84,
    flattenScale: { x: 1.12, y: 0.68 }
  },
  floatingText: {
    arcHeightPx: 54,
    arcDriftPx: 14,
    durationMs: 920
  }
};

function isReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function scaleDuration(ms, speedMultiplier = 1) {
  if (speedMultiplier === 0) return 0;
  if (isReducedMotion()) return Math.min(60, ms);
  return Math.max(16, Math.round(ms / (speedMultiplier || 1)));
}

function waitMs(ms, speedMultiplier = 1) {
  const effective = scaleDuration(ms, speedMultiplier);
  if (effective <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, effective));
}

function getEntityElements(container, entityId) {
  if (!container || !entityId) return null;
  const entityEl = container.querySelector(`#entity-dom-${entityId}`);
  if (!entityEl) return null;
  const flipWrapper = entityEl.querySelector('.sprite-flip-wrapper');
  const spriteImg = entityEl.querySelector('.entity-sprite-img');
  const shadowEl = entityEl.querySelector('.entity-ground-shadow');
  return { entityEl, flipWrapper, spriteImg, shadowEl };
}

function getEntityFacing(entityEl, explicitFacing) {
  if (explicitFacing === 1 || explicitFacing === -1) return explicitFacing;
  if (!entityEl) return 1;
  return entityEl.querySelector('.facing-left') ? -1 : 1;
}

/**
 * Smoothly interpolates grid coordinates while applying a parabolic vertical hop,
 * forward tilt, squash-and-stretch on takeoff/landing, and dynamic ground shadow shrinking.
 */
export async function animateUnitMoveTo(container, ev, animSpeed = 1) {
  const els = getEntityElements(container, ev.entityId);
  const isLeap = ev.type === 'leap';
  const baseMs = isLeap ? ANIMATION_CONFIG.move.leapDurationMs : ANIMATION_CONFIG.move.durationMs;
  const durationMs = scaleDuration(baseMs, animSpeed);

  const fromIdx = ev.from ?? ev.fromCell;
  const toIdx = ev.to ?? ev.toCell;

  if (!els || !els.entityEl || !els.spriteImg || durationMs <= 0) {
    await waitMs(baseMs, animSpeed);
    return;
  }

  const { entityEl, flipWrapper, spriteImg, shadowEl } = els;
  const facing = getEntityFacing(entityEl, ev.facing);
  const moveDir = fromIdx !== undefined && toIdx !== undefined && toIdx !== fromIdx
    ? Math.sign(toIdx - fromIdx)
    : facing;
  const isBackwards = moveDir !== 0 && moveDir !== facing;

  // Automatic or synchronized facing flip on wrapper
  if (flipWrapper && ev.facing && ev.autoFlip) {
    flipWrapper.style.transform = `scaleX(${ev.facing === -1 ? -1 : 1})`;
  }

  let deltaX = 0;
  if (fromIdx !== undefined && toIdx !== undefined && fromIdx !== toIdx) {
    const fromCellEl = container.querySelector(`.board-cell[data-cell-index="${fromIdx}"]`);
    const toCellEl = container.querySelector(`.board-cell[data-cell-index="${toIdx}"]`);
    if (fromCellEl && toCellEl) {
      const fromRect = fromCellEl.getBoundingClientRect();
      const toRect = toCellEl.getBoundingClientRect();
      deltaX = toRect.left - fromRect.left;
    }
  }

  const hopH = isLeap ? ANIMATION_CONFIG.move.leapHeightPx : ANIMATION_CONFIG.move.hopHeightPx;
  const tilt = (isBackwards ? -1 : 1) * ANIMATION_CONFIG.move.tiltDeg;
  const { takeoffScale, apexScale, landingSquash, shadowHopScale, shadowHopOpacity } = ANIMATION_CONFIG.move;

  entityEl.classList.add('entity-animating-move');
  spriteImg.classList.add(isLeap ? 'anim-leap' : isBackwards ? 'anim-walk-back' : 'anim-walk');

  const animations = [];

  if (typeof entityEl.animate === 'function' && deltaX !== 0) {
    animations.push(
      entityEl.animate(
        [
          { transform: 'translate3d(0px, 0px, 0px)' },
          { transform: `translate3d(${deltaX * 0.5}px, 0px, 0px)`, offset: 0.48 },
          { transform: `translate3d(${deltaX}px, 0px, 0px)` }
        ],
        {
          duration: durationMs,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards'
        }
      )
    );
  }

  if (typeof spriteImg.animate === 'function') {
    animations.push(
      spriteImg.animate(
        [
          { transform: 'translateY(0px) rotate(0deg) scale(1, 1)', offset: 0 },
          {
            transform: `translateY(-${Math.round(hopH * 0.25)}px) rotate(${tilt * 0.6}deg) scale(${takeoffScale.x}, ${takeoffScale.y})`,
            offset: 0.18
          },
          {
            transform: `translateY(-${hopH}px) rotate(${tilt}deg) scale(${apexScale.x}, ${apexScale.y})`,
            offset: 0.48
          },
          {
            transform: `translateY(0px) rotate(${-tilt * 0.3}deg) scale(${landingSquash.x}, ${landingSquash.y})`,
            offset: 0.82
          },
          { transform: 'translateY(0px) rotate(0deg) scale(1, 1)', offset: 1 }
        ],
        {
          duration: durationMs,
          easing: 'ease-out'
        }
      )
    );
  }

  if (shadowEl && typeof shadowEl.animate === 'function') {
    animations.push(
      shadowEl.animate(
        [
          { transform: 'translateX(-50%) scale(1, 1)', opacity: 0.68, offset: 0 },
          {
            transform: `translateX(-50%) scale(${shadowHopScale}, ${shadowHopScale})`,
            opacity: shadowHopOpacity,
            offset: 0.48
          },
          { transform: 'translateX(-50%) scale(1.18, 0.9)', opacity: 0.78, offset: 0.82 },
          { transform: 'translateX(-50%) scale(1, 1)', opacity: 0.68, offset: 1 }
        ],
        {
          duration: durationMs,
          easing: 'ease-out'
        }
      )
    );
  }

  await waitMs(baseMs, animSpeed);

  animations.forEach((a) => {
    try {
      a.cancel();
    } catch {
      // ignore
    }
  });

  entityEl.classList.remove('entity-animating-move');
  spriteImg.classList.remove('anim-leap', 'anim-walk', 'anim-walk-back');

  if (toIdx !== undefined) {
    const destStage = container.querySelector(`#cell-stage-${toIdx}`);
    if (destStage && entityEl.parentElement !== destStage) {
      destStage.appendChild(entityEl);
    }
  }
}

/**
 * Attack Lunge with Anticipation Wind-up, 60% Target Lunge, 60ms Hit-Stop at Apex, and Spring Recovery.
 */
export async function animateUnitAttack(container, options = {}, animSpeed = 1) {
  const { attackerId, fromCell, targetCell, isRanged = false } = options;
  const els = getEntityElements(container, attackerId);
  if (!els || !els.entityEl || !els.spriteImg || animSpeed === 0) {
    return;
  }

  const { entityEl, spriteImg, shadowEl } = els;
  const facing = getEntityFacing(entityEl, options.facing);

  // Compute pixel distance toward target cell
  let lungeVectorX = facing * 56;
  if (fromCell !== undefined && targetCell !== undefined && fromCell !== targetCell) {
    const fromCellEl = container.querySelector(`.board-cell[data-cell-index="${fromCell}"]`);
    const toCellEl = container.querySelector(`.board-cell[data-cell-index="${targetCell}"]`);
    if (fromCellEl && toCellEl) {
      const fromRect = fromCellEl.getBoundingClientRect();
      const toRect = toCellEl.getBoundingClientRect();
      const rawDelta = toRect.left - fromRect.left;
      const sign = Math.sign(rawDelta) || facing;
      const mag = Math.min(
        ANIMATION_CONFIG.attack.maxLungePx,
        Math.max(ANIMATION_CONFIG.attack.minLungePx, Math.abs(rawDelta) * ANIMATION_CONFIG.attack.lungeDistanceRatio)
      );
      lungeVectorX = sign * (isRanged ? mag * 0.32 : mag);
    }
  } else if (isRanged) {
    lungeVectorX = facing * 22;
  }

  const windupWorldX = -Math.sign(lungeVectorX || facing) * Math.abs(ANIMATION_CONFIG.attack.windupPx);

  const windupMs = scaleDuration(ANIMATION_CONFIG.attack.windupMs, animSpeed);
  const lungeMs = scaleDuration(ANIMATION_CONFIG.attack.lungeMs, animSpeed);
  const hitStopMs = scaleDuration(ANIMATION_CONFIG.attack.hitStopMs, animSpeed);
  const recoverMs = scaleDuration(ANIMATION_CONFIG.attack.recoverMs, animSpeed);
  const totalMs = windupMs + lungeMs + hitStopMs + recoverMs;

  if (totalMs <= 0) return;

  const t1 = windupMs / totalMs;
  const t2 = (windupMs + lungeMs) / totalMs;
  const t3 = (windupMs + lungeMs + hitStopMs) / totalMs;

  entityEl.classList.add('entity-animating-attack');
  spriteImg.classList.add(isRanged ? 'anim-shoot' : 'anim-lunge');

  const { windupRotateDeg, windupScale, lungeRotateDeg, lungeScale } = ANIMATION_CONFIG.attack;
  const animations = [];

  if (typeof entityEl.animate === 'function') {
    animations.push(
      entityEl.animate(
        [
          { transform: 'translate3d(0px, 0px, 0px)', offset: 0 },
          { transform: `translate3d(${windupWorldX}px, 0px, 0px)`, offset: t1, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
          { transform: `translate3d(${lungeVectorX}px, -6px, 0px)`, offset: t2, easing: 'cubic-bezier(0.08, 0.92, 0.18, 1)' },
          // 60ms Hit-Stop freeze at apex!
          { transform: `translate3d(${lungeVectorX}px, -6px, 0px)`, offset: t3 },
          { transform: 'translate3d(-4px, 0px, 0px)', offset: Math.min(0.94, t3 + (1 - t3) * 0.65) },
          { transform: 'translate3d(0px, 0px, 0px)', offset: 1 }
        ],
        {
          duration: totalMs,
          easing: 'ease-out'
        }
      )
    );
  }

  if (typeof spriteImg.animate === 'function') {
    animations.push(
      spriteImg.animate(
        [
          { transform: 'rotate(0deg) scale(1, 1)', offset: 0 },
          {
            transform: `rotate(${windupRotateDeg}deg) scale(${windupScale.x}, ${windupScale.y})`,
            offset: t1
          },
          {
            transform: `rotate(${lungeRotateDeg}deg) scale(${lungeScale.x}, ${lungeScale.y})`,
            offset: t2
          },
          // Hit-stop hold at apex
          {
            transform: `rotate(${lungeRotateDeg}deg) scale(${lungeScale.x * 1.03}, ${lungeScale.y * 0.97})`,
            offset: t3
          },
          { transform: 'rotate(-2deg) scale(0.96, 1.04)', offset: Math.min(0.93, t3 + (1 - t3) * 0.65) },
          { transform: 'rotate(0deg) scale(1, 1)', offset: 1 }
        ],
        {
          duration: totalMs,
          easing: 'ease-out'
        }
      )
    );
  }

  if (shadowEl && typeof shadowEl.animate === 'function') {
    animations.push(
      shadowEl.animate(
        [
          { transform: 'translateX(-50%) scale(1, 1)', opacity: 0.68, offset: 0 },
          { transform: 'translateX(-50%) scale(0.88, 0.95)', opacity: 0.75, offset: t1 },
          { transform: 'translateX(-50%) scale(1.25, 0.72)', opacity: 0.42, offset: t2 },
          { transform: 'translateX(-50%) scale(1.25, 0.72)', opacity: 0.42, offset: t3 },
          { transform: 'translateX(-50%) scale(1, 1)', opacity: 0.68, offset: 1 }
        ],
        {
          duration: totalMs,
          easing: 'ease-out'
        }
      )
    );
  }

  // Wait until apex + hit-stop so damage lands right as the strike connects!
  await waitMs(
    ANIMATION_CONFIG.attack.windupMs + ANIMATION_CONFIG.attack.lungeMs + ANIMATION_CONFIG.attack.hitStopMs,
    animSpeed
  );

  // Clean up classes after spring recovery finishes
  const cleanupDelay = scaleDuration(ANIMATION_CONFIG.attack.recoverMs, animSpeed);
  setTimeout(() => {
    entityEl.classList.remove('entity-animating-attack');
    spriteImg.classList.remove('anim-lunge', 'anim-shoot');
  }, cleanupDelay);
}

/**
 * Hit Reaction: High-frequency horizontal shake, 120ms white/red CSS silhouette flash
 * (only on non-transparent PNG pixels), bottom-anchored squash (scaleY: 0.8, scaleX: 1.25).
 */
export async function animateUnitHit(container, targetId, _amount = 1, animSpeed = 1) {
  const els = getEntityElements(container, targetId);
  if (!els || !els.entityEl || !els.spriteImg || animSpeed === 0) {
    await waitMs(ANIMATION_CONFIG.hit.durationMs, animSpeed);
    return;
  }

  const { entityEl, spriteImg, shadowEl } = els;
  const durationMs = scaleDuration(ANIMATION_CONFIG.hit.durationMs, animSpeed);
  const flashWhiteMs = scaleDuration(ANIMATION_CONFIG.hit.whiteFlashMs, animSpeed);
  const flashTotalMs = scaleDuration(ANIMATION_CONFIG.hit.flashDurationMs, animSpeed);

  // 1. Silhouette Hit-Flash (White -> Crimson -> Normal) strictly on PNG pixels
  spriteImg.classList.remove('silhouette-flash-white', 'silhouette-flash-red');
  spriteImg.classList.add('silhouette-flash-white', 'anim-hurt');

  setTimeout(() => {
    if (spriteImg.isConnected) {
      spriteImg.classList.remove('silhouette-flash-white');
      spriteImg.classList.add('silhouette-flash-red');
    }
  }, flashWhiteMs);

  setTimeout(() => {
    if (spriteImg.isConnected) {
      spriteImg.classList.remove('silhouette-flash-white', 'silhouette-flash-red');
    }
  }, flashTotalMs);

  const shake = ANIMATION_CONFIG.hit.shakeAmplitudePx;
  const { squashScale } = ANIMATION_CONFIG.hit;

  // 2. High-frequency horizontal shake on entity container
  if (typeof entityEl.animate === 'function') {
    entityEl.animate(
      [
        { transform: 'translate3d(0px, 0px, 0px)', offset: 0 },
        { transform: `translate3d(-${shake}px, 0px, 0px)`, offset: 0.12 },
        { transform: `translate3d(${shake}px, 0px, 0px)`, offset: 0.25 },
        { transform: `translate3d(-${Math.round(shake * 0.75)}px, 0px, 0px)`, offset: 0.38 },
        { transform: `translate3d(${Math.round(shake * 0.6)}px, 0px, 0px)`, offset: 0.52 },
        { transform: `translate3d(-${Math.round(shake * 0.35)}px, 0px, 0px)`, offset: 0.68 },
        { transform: 'translate3d(2px, 0px, 0px)', offset: 0.84 },
        { transform: 'translate3d(0px, 0px, 0px)', offset: 1 }
      ],
      {
        duration: durationMs,
        easing: 'ease-out'
      }
    );
  }

  // 3. Bottom-anchored squash-and-stretch (scaleY: 0.8, scaleX: 1.25)
  if (typeof spriteImg.animate === 'function') {
    spriteImg.animate(
      [
        { transform: 'scale(1, 1) rotate(0deg)', offset: 0 },
        { transform: `scale(${squashScale.x}, ${squashScale.y}) rotate(-5deg)`, offset: 0.2 },
        { transform: 'scale(0.92, 1.09) rotate(3deg)', offset: 0.52 },
        { transform: 'scale(1.04, 0.97) rotate(-1deg)', offset: 0.78 },
        { transform: 'scale(1, 1) rotate(0deg)', offset: 1 }
      ],
      {
        duration: durationMs,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }
    );
  }

  if (shadowEl && typeof shadowEl.animate === 'function') {
    shadowEl.animate(
      [
        { transform: 'translateX(-50%) scale(1, 1)', offset: 0 },
        { transform: 'translateX(-50%) scale(1.28, 1.1)', offset: 0.22 },
        { transform: 'translateX(-50%) scale(1, 1)', offset: 1 }
      ],
      {
        duration: durationMs,
        easing: 'ease-out'
      }
    );
  }

  await waitMs(ANIMATION_CONFIG.hit.durationMs, animSpeed);
  spriteImg.classList.remove('anim-hurt', 'silhouette-flash-white', 'silhouette-flash-red');
}

/**
 * Death Animation: Shake violently, tint crimson red, flatten/rotate onto its side,
 * and dissolve to opacity: 0.
 */
export async function animateUnitDeath(container, targetId, isHero = false, animSpeed = 1) {
  const els = getEntityElements(container, targetId);
  if (!els || !els.entityEl || !els.spriteImg || animSpeed === 0) {
    await waitMs(ANIMATION_CONFIG.death.totalMs, animSpeed);
    return;
  }

  const { entityEl, spriteImg, shadowEl } = els;
  const totalMs = scaleDuration(ANIMATION_CONFIG.death.totalMs, animSpeed);
  spriteImg.classList.add('anim-death', 'silhouette-flash-red');

  if (typeof entityEl.animate === 'function') {
    entityEl.animate(
      [
        { transform: 'translate3d(0px, 0px, 0px)', offset: 0 },
        { transform: 'translate3d(-10px, 0px, 0px)', offset: 0.08 },
        { transform: 'translate3d(10px, 0px, 0px)', offset: 0.16 },
        { transform: 'translate3d(-8px, 0px, 0px)', offset: 0.24 },
        { transform: 'translate3d(7px, 0px, 0px)', offset: 0.32 },
        { transform: 'translate3d(0px, 0px, 0px)', offset: 0.42 },
        { transform: 'translate3d(0px, 8px, 0px)', offset: 1 }
      ],
      {
        duration: totalMs,
        easing: 'ease-in-out'
      }
    );
  }

  if (!isHero && typeof spriteImg.animate === 'function') {
    const { rotateDeg, flattenScale } = ANIMATION_CONFIG.death;
    spriteImg.animate(
      [
        {
          transform: 'translateY(0px) rotate(0deg) scale(1, 1)',
          opacity: 1,
          filter: 'brightness(0) invert(1) drop-shadow(0 0 12px #ffffff)',
          offset: 0
        },
        {
          transform: 'translateY(-6px) rotate(-12deg) scale(1.12, 0.88)',
          opacity: 1,
          filter: 'brightness(1.5) sepia(1) hue-rotate(-50deg) saturate(7) drop-shadow(0 0 14px #dc2626)',
          offset: 0.26
        },
        {
          transform: `translateY(14px) rotate(${rotateDeg}deg) scale(${flattenScale.x}, ${flattenScale.y})`,
          opacity: 0.72,
          filter: 'brightness(0.9) sepia(1) hue-rotate(-50deg) saturate(5)',
          offset: 0.68
        },
        {
          transform: `translateY(22px) rotate(${rotateDeg}deg) scale(${flattenScale.x * 0.9}, ${flattenScale.y * 0.65})`,
          opacity: 0,
          filter: 'brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(4)',
          offset: 1
        }
      ],
      {
        duration: totalMs,
        easing: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
        fill: 'forwards'
      }
    );
  }

  if (shadowEl && typeof shadowEl.animate === 'function') {
    shadowEl.animate(
      [
        { transform: 'translateX(-50%) scale(1, 1)', opacity: 0.68, offset: 0 },
        { transform: 'translateX(-50%) scale(1.35, 0.85)', opacity: 0.5, offset: 0.5 },
        { transform: 'translateX(-50%) scale(0.3, 0.3)', opacity: 0, offset: 1 }
      ],
      {
        duration: totalMs,
        easing: 'ease-out',
        fill: 'forwards'
      }
    );
  }

  await waitMs(ANIMATION_CONFIG.death.totalMs, animSpeed);
  spriteImg.classList.remove('silhouette-flash-red');
}
