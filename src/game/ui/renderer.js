// @ts-nocheck
import { BOARD_SIZE, ANIMATION_TIMINGS } from '../config/constants.js';
import { STATUSES } from '../config/statuses.js';
import { TERRAIN_TYPES } from '../config/terrain.js';
import { STRINGS, czechTurns } from '../config/strings.cs.js';
import { detectResonances } from '../engine/combo.js';
import { simulateComboImpact } from '../engine/simulation.js';
import { getSortedEnemiesByInitiative } from '../engine/state.js';
import { computeBoardThreats, computePlayerQueuePreview } from '../engine/threat.js';
import { getAssetUrl } from './assets.js';
import { renderEnemyIntentStripHtml, buildEnemyTooltipHtml } from './enemyIntent.js';
import { renderCellThreatAndPreviewHtml } from './threatOverlay.js';
import { showTooltip, hideTooltip } from './tooltips.js';
import { SFX } from './audio.js';
import {
  spawnBloodBurst,
  renderCellGroundBloodHtml,
  renderSpriteBloodHtml,
  recordEntityHitBlood
} from './blood.js';
import { ENCOUNTERS } from '../config/encounters.js';
import { ENEMIES } from '../config/enemies.js';
import { getEncounterTheme } from '../config/themes.js';
import {
  animateUnitMoveTo,
  animateUnitAttack,
  animateUnitHit,
  animateUnitDeath
} from './spriteAnimator.js';
import { spawnComicBubble } from './comicBubbles.js';
import { getHunterDialogue, getEnemyDialogue } from '../config/dialogues.js';

export function sleep(ms, speedMultiplier = 1) {
  if (speedMultiplier === 0) return Promise.resolve();
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const effectiveMs = reducedMotion ? Math.min(80, ms) : Math.round(ms / (speedMultiplier || 1));
  return new Promise((resolve) => setTimeout(resolve, effectiveMs));
}

const HUNTER_SPRITE_PRESETS = {
  venca: {
    idle: ['/assets/characters/venca_idle.png'],
    attack: ['/assets/characters/venca_attack.png'],
    hurt: ['/assets/characters/venca_hurt.png'],
    dead: ['/assets/characters/venca_dead.png']
  },
  classic: {
    idle: ['/assets/characters/venca_idle.png'],
    attack: ['/assets/characters/venca_attack.png'],
    hurt: ['/assets/characters/venca_hurt.png'],
    dead: ['/assets/characters/venca_dead.png']
  },
  honza: {
    idle: ['/assets/enemies/sedlak_stit.png'],
    attack: ['/assets/enemies/sedlak_stit.png'],
    hurt: ['/assets/enemies/sedlak_stit.png'],
    dead: ['/assets/characters/venca_dead.png']
  },
  dragoun: {
    idle: ['/assets/enemies/halapartnik.png'],
    attack: ['/assets/enemies/halapartnik.png'],
    hurt: ['/assets/enemies/halapartnik.png'],
    dead: ['/assets/characters/venca_dead.png']
  },
  zlodejka: {
    idle: ['/assets/enemies/vrhac_nozu.png'],
    attack: ['/assets/enemies/vrhac_nozu.png'],
    hurt: ['/assets/enemies/vrhac_nozu.png'],
    dead: ['/assets/characters/venca_dead.png']
  }
};

function getHeroFrames(pose) {
  const hId = currentRenderState?.hero?.hunterId || 'venca';
  const pack = HUNTER_SPRITE_PRESETS[hId] || HUNTER_SPRITE_PRESETS.venca;
  return pack[pose] || pack.idle;
}

// Hero animation pose timers and state
let heroPoseTimer = null;
let heroPoseLocked = false;
let heroPoseEpoch = 0;

function heroSprite(container) {
  return container?.querySelector?.('.hero-sprite') || null;
}

function isHeroEntity(container, entityId) {
  if (!entityId || !container) return false;
  if (entityId.startsWith('hero_')) return true;
  const el = container.querySelector(`#entity-dom-${entityId}`);
  return Boolean(el && el.classList.contains('entity-hero'));
}

function clearHeroPoseTimer() {
  if (heroPoseTimer) {
    clearTimeout(heroPoseTimer);
    heroPoseTimer = null;
  }
}

function isHeroDead(container) {
  const img = heroSprite(container);
  return Boolean(img && (img.dataset.pose === 'dead' || img.getAttribute('src')?.includes('dead')));
}

function setHeroPose(container, pose, frame = 0) {
  const img = heroSprite(container);
  if (!img) return;
  if (isHeroDead(container) && pose !== 'dead') return;
  const frames = getHeroFrames(pose);
  const next = frames[frame % frames.length];
  img.dataset.pose = pose;
  if (img.getAttribute('src') !== next) img.src = next;
}

function startHeroIdle(container, force = false) {
  if (isHeroDead(container)) return;
  if (!force && heroPoseLocked) return;
  heroPoseEpoch += 1;
  clearHeroPoseTimer();
  heroPoseLocked = false;
  setHeroPose(container, 'idle', 0);
}

function scheduleHeroIdle(container, delayMs, animSpeed = 1) {
  if (isHeroDead(container)) return;
  clearHeroPoseTimer();
  const effectiveDelay = animSpeed === 0 ? 0 : Math.round(delayMs / (animSpeed || 1));
  heroPoseTimer = setTimeout(() => {
    if (!isHeroDead(container)) {
      heroPoseLocked = false;
      setHeroPose(container, 'idle', 0);
    }
  }, effectiveDelay);
}

export async function playHeroPose(container, pose, ms, animSpeed) {
  const frames = getHeroFrames(pose);
  if (!heroSprite(container) || isHeroDead(container)) return;
  const epoch = heroPoseEpoch;
  heroPoseLocked = true;
  clearHeroPoseTimer();
  const steps = Math.max(1, frames.length);
  const slice = Math.max(90, Math.round(ms / steps));
  for (let i = 0; i < steps; i++) {
    if (epoch !== heroPoseEpoch || !heroSprite(container) || isHeroDead(container)) return;
    setHeroPose(container, pose, i);
    await sleep(slice, animSpeed);
  }
  if (!isHeroDead(container)) {
    scheduleHeroIdle(container, 80, animSpeed);
  }
}

let currentRenderState = null;

export function renderBattleBoard(container, state, uiState = {}, callbacks = {}) {
  if (!container || !state) return;
  currentRenderState = state;

  const hoveredEnemyId = uiState.hoveredEnemyId || null;
  const hoveredTileId = uiState.hoveredTileId || null;

  const isPreviewMode = Boolean(
    uiState.comboPreviewActive ||
    uiState.hoveredExecute ||
    (typeof uiState.hoveredQueueSlot === 'number' && uiState.hoveredQueueSlot >= 0)
  );
  const simPreview = isPreviewMode && (state.queue || []).length > 0
    ? simulateComboImpact(state)
    : null;

  const threats = computeBoardThreats(state, hoveredEnemyId);
  const queuePreview = computePlayerQueuePreview(state, hoveredTileId);
  const sortedEnemies = getSortedEnemiesByInitiative(state);
  const initiativeMap = new Map();
  sortedEnemies.forEach((e, i) => initiativeMap.set(e.id, i + 1));

  const boardSize = state.boardSize || BOARD_SIZE;
  const currentEncounter = (ENCOUNTERS && state.encounterId && ENCOUNTERS[state.encounterId]) || ENCOUNTERS?.tutorial_1 || null;
  const theme = getEncounterTheme(currentEncounter);

  // Gate reinforcement indicators on the end cells
  const leftGateReinf = state.reinforcements.find((r) => !r.spawned && r.gateCell === 0);
  const rightGateReinf = state.reinforcements.find((r) => !r.spawned && r.gateCell === boardSize - 1);

  // Build Hero Queue Bar (3 or 4 slots above the battlefield)
  const queueSlotsHtml = Array.from({ length: state.maxQueueSlots }, (_, slotIdx) => {
    const instanceId = state.queue[slotIdx];
    const tile = instanceId ? state.hand.find((t) => t.instanceId === instanceId) : null;
    const roleLabel = `Slot #${slotIdx + 1}`;

    if (!tile) {
      return `
        <div class="queue-slot queue-slot-empty" data-slot-index="${slotIdx}">
          <div class="queue-slot-header">
            <span class="queue-slot-role">${roleLabel}</span>
          </div>
          <div class="queue-slot-content">
            <span class="queue-slot-placeholder">Prázdný slot</span>
          </div>
        </div>
      `;
    }

    const iconUrl = getAssetUrl(tile.icon, tile.name);
    return `
      <div class="queue-slot queue-slot-filled"
           draggable="true"
           data-slot-index="${slotIdx}"
           data-instance-id="${tile.instanceId}"
           title="Destička ve frontě komba. Přetažením myší změníš pořadí. Kliknutím na ✖ vrátíš do zásoby.">
        <div class="queue-slot-header">
          <span class="queue-slot-role">${roleLabel}</span>
          <div class="queue-reorder-arrows">
            ${slotIdx > 0 ? `<button type="button" class="btn-slot-move btn-slot-move-left" data-move-slot="${slotIdx}" data-move-dir="-1" title="Posunout doleva">◀</button>` : ''}
            ${slotIdx < state.queue.length - 1 ? `<button type="button" class="btn-slot-move btn-slot-move-right" data-move-slot="${slotIdx}" data-move-dir="1" title="Posunout doprava">▶</button>` : ''}
          </div>
          <button type="button" class="btn-slot-remove" data-remove-queue-slot="${slotIdx}" title="Vrátit destičku do zásoby (zdarma)">✖</button>
        </div>
        <div class="queue-slot-content">
          <img src="${iconUrl}" alt="${tile.name}" class="queue-slot-icon" referrerpolicy="no-referrer" />
          <span class="queue-slot-name">${tile.name}</span>
          <span class="drag-handle" title="Uchop myší a přetáhni">⠿</span>
        </div>
      </div>
    `;
  }).join('');

  // Build the cells of the 1D arena
  const cellsHtml = Array.from({ length: boardSize }, (_, cellIdx) => {
    const terrainObj = state.terrain[cellIdx] || { type: 'none' };
    const terrainDef = TERRAIN_TYPES[terrainObj.type] || TERRAIN_TYPES.none;
    const cellThreat = threats[cellIdx];
    const isThreatened = cellThreat && cellThreat.sources.length > 0;
    const isArmedRed = Boolean(cellThreat && cellThreat.isArmedRed);
    const isInspectReach = Boolean(cellThreat && cellThreat.isInspectReach);
    const isImminent = cellThreat && cellThreat.sources.some((s) => s.countdown <= 1);
    const isNextThreat = cellThreat && cellThreat.nextTileSources.length > 0;
    const isPlayerTargeted =
      queuePreview.targetedCells.some((h) => h.cell === cellIdx) ||
      queuePreview.hoveredCells.some((h) => h.cell === cellIdx);

    const entity = livingEntityAt(state, cellIdx) || corpseAt(state, cellIdx);

    const gateHtml = renderGateBannerHtml(cellIdx, leftGateReinf, rightGateReinf, boardSize);
    const overlayHtml = renderCellThreatAndPreviewHtml(cellIdx, cellThreat, queuePreview, state, simPreview);
    const impact = simPreview?.impactMap?.[entity?.id] || null;
    const entityHtml = entity
      ? renderEntityOnCellHtml(entity, initiativeMap.get(entity.id), impact)
      : '';

    return `
      <div class="board-cell
                  terrain-${terrainObj.type}
                  ${isArmedRed ? 'cell-armed-red-targeted' : ''}
                  ${isInspectReach ? 'cell-inspect-range' : ''}
                  ${isThreatened ? 'cell-threatened' : ''}
                  ${isImminent ? 'cell-threatened-imminent' : ''}
                  ${isNextThreat ? 'cell-threatened-next' : ''}
                  ${isPlayerTargeted ? 'cell-player-targeted' : ''}"
           data-cell-index="${cellIdx}"
           data-terrain-type="${terrainObj.type}">
        <div class="cell-index-label"><span class="cell-index-word">Pole </span>${cellIdx + 1}</div>
        ${gateHtml}
        <div class="cell-overlay-zone">
          ${overlayHtml}
        </div>
        <div class="cell-ground-blood-zone" aria-hidden="true">
          ${renderCellGroundBloodHtml(state.cellBlood?.[cellIdx] || cellIdx, state)}
        </div>
        <div class="cell-entity-stage" id="cell-stage-${cellIdx}">
          ${entityHtml}
        </div>
        ${renderTerrainDecalHtml(terrainObj, terrainDef)}
        <div class="cell-slab-bevel"></div>
      </div>
    `;
  }).join('');

  const tutorialHintHtml = state.isTutorial
    ? `<div class="tutorial-banner">
         <span class="tutorial-icon">🎓</span>
         <span class="tutorial-text">${STRINGS.tutorialHints[(state.turn - 1) % STRINGS.tutorialHints.length]}</span>
       </div>`
    : '';

  const queueTiles = (state.queue || []).map((id) => (state.hand || []).find((t) => t.instanceId === id)).filter(Boolean);
  const activeResonances = detectResonances(queueTiles);
  const resonancesHtml = activeResonances.length > 0
    ? `<div class="hero-queue-resonances">${activeResonances.map((r) => `<span class="queue-resonance-pill" title="${r.description}">✨ ${r.icon} <strong>${r.name}</strong></span>`).join('')}</div>`
    : '';

  container.innerHTML = `
    ${tutorialHintHtml}
    <div class="hero-queue-panel">
      <div class="hero-queue-label">
        <div class="hero-queue-title-row">
          <strong>⚡ Fronta komba</strong>
          ${resonancesHtml}
        </div>
        <span class="hero-queue-hint">(1 tah vložení · Odpálení okamžité!)</span>
      </div>
      <div class="hero-queue-slots" style="--queue-slots: ${state.maxQueueSlots};">
        ${queueSlotsHtml}
      </div>
    </div>

    <div class="battlefield-1d-stage ${theme.cssClass}" id="battlefield-stage" style="--board-size: ${boardSize};">
      <div class="battlefield-backdrop-layer" id="battlefield-backdrop">
        <img src="${theme.image}" alt="${theme.name}" class="battlefield-backdrop-img" onerror="this.style.display='none'" />
        <div class="battlefield-backdrop-vignette" style="background: ${theme.vignette};"></div>
      </div>
      <div class="battlefield-stone-track" id="battlefield-stone-track" style="grid-template-columns: repeat(${boardSize}, minmax(0, 1fr));">
        ${cellsHtml}
      </div>
      <canvas class="blood-fx-layer" id="blood-fx-canvas" aria-hidden="true"></canvas>
      <div class="battlefield-foreground-layer" id="battlefield-foreground">
        <div class="foreground-vignette"></div>
        <div class="foreground-atmosphere-particles">
          <span class="mote mote-1"></span>
          <span class="mote mote-2"></span>
          <span class="mote mote-3"></span>
          <span class="mote mote-4"></span>
          <span class="mote mote-5"></span>
          <span class="mote mote-6"></span>
        </div>
      </div>
    </div>
  `;

  // Wire combo queue drag-and-drop reordering
  let draggedSlotIdx = null;

  container.querySelectorAll('.queue-slot').forEach((slotEl) => {
    const slotIdx = Number(slotEl.getAttribute('data-slot-index'));

    slotEl.addEventListener('mouseenter', () => {
      callbacks.onHoverQueueSlot?.(slotIdx);
    });
    slotEl.addEventListener('mouseleave', () => {
      callbacks.onHoverQueueSlot?.(null);
    });

    slotEl.addEventListener('dragstart', (e) => {
      if (e.target instanceof Element && e.target.closest('button')) {
        e.preventDefault();
        return;
      }
      if (!slotEl.classList.contains('queue-slot-filled')) {
        e.preventDefault();
        return;
      }
      draggedSlotIdx = slotIdx;
      e.dataTransfer.setData('text/plain', String(slotIdx));
      e.dataTransfer.effectAllowed = 'move';
      slotEl.classList.add('is-dragging');
    });

    slotEl.addEventListener('dragend', () => {
      draggedSlotIdx = null;
      slotEl.classList.remove('is-dragging');
      container.querySelectorAll('.queue-slot').forEach((s) => s.classList.remove('drag-over-target'));
    });

    slotEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedSlotIdx !== null && draggedSlotIdx !== slotIdx && slotIdx < state.queue.length) {
        slotEl.classList.add('drag-over-target');
      }
    });

    slotEl.addEventListener('dragleave', () => {
      slotEl.classList.remove('drag-over-target');
    });

    slotEl.addEventListener('drop', (e) => {
      e.preventDefault();
      slotEl.classList.remove('drag-over-target');
      const fromIdx = draggedSlotIdx !== null ? draggedSlotIdx : Number(e.dataTransfer.getData('text/plain'));
      if (
        Number.isInteger(fromIdx) &&
        fromIdx >= 0 &&
        fromIdx !== slotIdx &&
        slotIdx < state.queue.length
      ) {
        callbacks.onReorderQueue?.(fromIdx, slotIdx);
      }
    });
  });

  // Wire reorder arrow buttons (◀ / ▶)
  container.querySelectorAll('[data-move-slot]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentIdx = Number(btn.getAttribute('data-move-slot'));
      const dir = Number(btn.getAttribute('data-move-dir'));
      const targetIdx = currentIdx + dir;
      if (targetIdx >= 0 && targetIdx < state.queue.length) {
        callbacks.onReorderQueue?.(currentIdx, targetIdx);
      }
    });
  });

  // Wire queue removal clicks (✖)
  container.querySelectorAll('[data-remove-queue-slot]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const slotIdx = Number(btn.getAttribute('data-remove-queue-slot'));
      callbacks.onRemoveQueueSlot?.(slotIdx);
    });
  });

  // Wire enemy hover + touch click for next-tile range preview + tooltip
  container.querySelectorAll('[data-enemy-id]').forEach((el) => {
    const enemyId = el.getAttribute('data-enemy-id');
    const enemy = state.enemies.find((e) => e.id === enemyId);
    if (!enemy) return;
    const rank = initiativeMap.get(enemy.id) || 1;

    el.addEventListener('mouseenter', (ev) => {
      callbacks.onHoverEnemy?.(enemyId);
      showTooltip(buildEnemyTooltipHtml(enemy, rank), ev.clientX, ev.clientY);
    });

    el.addEventListener('mouseleave', () => {
      callbacks.onHoverEnemy?.(null);
      hideTooltip();
    });

    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const r = el.getBoundingClientRect();
      callbacks.onHoverEnemy?.(enemyId);
      showTooltip(buildEnemyTooltipHtml(enemy, rank), r.left + r.width / 2, r.top, true);
    });
  });

  // Wire terrain tooltips on floor decals
  container.querySelectorAll('.terrain-decal-wrapper').forEach((floorEl) => {
    const cellEl = floorEl.closest('[data-terrain-type]');
    const tType = cellEl?.getAttribute('data-terrain-type');
    if (!tType || tType === 'none') return;
    const def = TERRAIN_TYPES[tType];
    if (!def) return;
    const cellIdx = Number(cellEl.getAttribute('data-cell-index'));
    const terrainObj = state.terrain[cellIdx];
    const durationInfo = terrainObj?.duration
      ? `<div class="tt-meta" style="color:#b45309;font-weight:800;margin:2px 0;">⏳ Zbývá: <strong>${terrainObj.duration} ${czechTurns(terrainObj.duration)}</strong></div>`
      : '';
    const html = `<div class="tt-title"><strong>${def.name}</strong></div>${durationInfo}<div class="tt-desc">${def.description}</div>`;
    floorEl.addEventListener('mouseenter', (ev) => {
      showTooltip(html, ev.clientX, ev.clientY);
    });
    floorEl.addEventListener('mouseleave', hideTooltip);
    floorEl.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const r = floorEl.getBoundingClientRect();
      showTooltip(html, r.left + r.width / 2, r.top, true);
    });
  });

  // Wire gate portal tooltips
  container.querySelectorAll('.diegetic-gate-portal').forEach((gateEl) => {
    const side = gateEl.getAttribute('data-gate-side');
    const isLeft = side === 'left';
    const reinf = isLeft ? leftGateReinf : rightGateReinf;
    const gateName = isLeft ? 'Levá hradní brána' : 'Pravá hradní brána';
    let tooltipHtml = `<div class="tt-title">🚪 <strong>${gateName}</strong></div>`;
    if (reinf) {
      const enemyDef = ENEMIES?.[reinf.enemyId] || null;
      const enemyName = enemyDef?.name || 'Upíří posila';
      tooltipHtml += `<div class="tt-meta" style="color:#b91c1c;font-weight:800;margin:3px 0;">⚠️ Příchod posily za <strong>${reinf.turnsRemaining} ${czechTurns(reinf.turnsRemaining)}</strong></div><div class="tt-desc">Zpoza brány se blíží: <strong>${enemyName}</strong> (Max HP: ${enemyDef?.maxHp || '?'}).</div>`;
    } else {
      tooltipHtml += `<div class="tt-desc" style="color:#57402a;">V této bráně je momentálně klid. Žádná posila se neblíží.</div>`;
    }
    gateEl.addEventListener('mouseenter', (ev) => {
      showTooltip(tooltipHtml, ev.clientX, ev.clientY);
    });
    gateEl.addEventListener('mouseleave', hideTooltip);
    gateEl.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const r = gateEl.getBoundingClientRect();
      showTooltip(tooltipHtml, r.left + r.width / 2, r.top, true);
    });
  });

  if (state.hero && state.hero.hp > 0) {
    startHeroIdle(container);
  } else {
    setHeroPose(container, 'dead', 0);
  }

  // Comic bubble banter at the beginning of a fresh battle
  if (!state._battleIntroSpoken && state.status === 'playing' && state.hero && state.hero.hp > 0) {
    state._battleIntroSpoken = true;
    const heroHId = state.hero.hunterId || state.hero.kind || 'ponocny';
    const heroCry = getHunterDialogue(heroHId, 'battle_cries');
    spawnComicBubble(container, state.hero.cell, heroCry.text, 'battle_cry', {
      speaker: heroCry.speaker,
      icon: heroCry.icon,
      facing: state.hero.facing,
      delayMs: 250,
      durationMs: 3200
    });

    const livingEnemies = (state.enemies || []).filter((e) => e.hp > 0);
    const bossOrLeader = livingEnemies.find((e) => e.isBoss) || livingEnemies[0];
    if (bossOrLeader) {
      const enemyCry = getEnemyDialogue(bossOrLeader.id, 'battle_cries');
      spawnComicBubble(container, bossOrLeader.cell, enemyCry.text, 'threat', {
        speaker: enemyCry.speaker || bossOrLeader.name,
        icon: enemyCry.icon || '🧛',
        facing: bossOrLeader.facing,
        delayMs: 1600,
        durationMs: 3200
      });
    }
  }
}

function renderGateBannerHtml(cellIdx, leftReinf, rightReinf, boardSize = BOARD_SIZE) {
  if (cellIdx !== 0 && cellIdx !== boardSize - 1) return '';

  const isLeft = cellIdx === 0;
  const reinf = isLeft ? leftReinf : rightReinf;
  const sideClass = isLeft ? 'gate-portal-left' : 'gate-portal-right';
  const label = isLeft ? 'Levá brána' : 'Pravá brána';

  let reinfContent = '';
  let warningClass = '';

  if (reinf) {
    const isImminent = reinf.turnsRemaining <= 1;
    warningClass = isImminent ? 'gate-status-imminent' : 'gate-status-pending';
    const enemyDef = ENEMIES?.[reinf.enemyId] || null;
    const enemyName = enemyDef?.name || 'Upír';
    const tagText = isImminent ? 'POZOR!' : `${reinf.turnsRemaining}t`;

    reinfContent = `
      <div class="gate-reinf-indicator ${isImminent ? 'is-imminent' : ''}"
           title="Posila: ${enemyName} (za ${reinf.turnsRemaining} ${czechTurns(reinf.turnsRemaining)})">
        ${isImminent ? '<span class="gate-vampire-eyes">👀</span>' : ''}
        <span class="gate-reinf-pill">⚠️ ${tagText}</span>
      </div>
    `;
  }

  return `
    <div class="diegetic-gate-portal ${sideClass} ${warningClass}" data-gate-side="${isLeft ? 'left' : 'right'}">
      <div class="gate-arch-frame">
        <div class="gate-iron-grate"></div>
        ${reinf ? '<div class="gate-ominous-glow"></div>' : ''}
      </div>
      <div class="gate-label-strip">
        <span class="gate-icon">🚪</span>
        <span class="gate-name">${label}</span>
      </div>
      ${reinfContent}
    </div>
  `;
}

export function getEntityBodyScale(entity) {
  if (!entity) return 'human';
  if (entity.bodyScale) return entity.bodyScale;
  if (entity.entityType === 'hero' || entity.id?.startsWith('hero') || entity.hunterId) return 'hero';
  if (entity.entityType === 'prop' || entity.id?.startsWith('barrel') || entity.id?.startsWith('prop')) return 'prop';
  if (entity.flying) return 'flyer';
  if (entity.isBoss || entity.archetype === 'boss') return 'boss';
  const id = (entity.id || '').toLowerCase();
  const kind = (entity.kind || '').toLowerCase();
  const name = (entity.name || '').toLowerCase();
  const given = (entity.givenName || '').toLowerCase();
  if (
    id.includes('lojz') || id.includes('kamen') ||
    id.includes('cilka') ||
    id.includes('trpaslik') || id.includes('smudla') ||
    kind.includes('lojz') || kind.includes('kamen') ||
    kind.includes('cilka') ||
    kind.includes('trpaslik') || kind.includes('smudla') ||
    name.includes('lojzíček') || name.includes('cilka') || name.includes('šmudla') ||
    given.includes('lojzíček') || given.includes('cilka') || given.includes('šmudla')
  ) {
    return 'small';
  }
  if (id.includes('krysa') || id.includes('piskota') || name.includes('piškota') || kind.includes('krysa')) return 'critter';
  if (
    id.includes('divocak') || id.includes('vlkodav') || id.includes('buldok') || id.includes('prase') ||
    kind.includes('divocak') || kind.includes('vlkodav') || kind.includes('buldok') || kind.includes('prase') ||
    name.includes('pes') || name.includes('vlk') || name.includes('kanec') || name.includes('pašík')
  ) {
    return 'beast';
  }
  return 'human';
}

function renderEntityOnCellHtml(entity, initiativeRank = 1, impact = null) {
  const givenName = entity.givenName || entity.name;
  const epithet = entity.epithet || '';
  const bodyScale = getEntityBodyScale(entity);
  const heroClass = entity.entityType === 'hero' ? 'hero-sprite' : '';
  const gait = gaitFor(entity, bodyScale);
  const spriteKey = entity.hp <= 0 && entity.entityType === 'hero' ? 'hero.dead' : entity.sprite;
  const spriteUrl = getAssetUrl(spriteKey, entity.name);
  const hpPercent = Math.max(0, Math.min(100, Math.round((entity.hp / entity.maxHp) * 100)));

  let previewLeft = 0;
  let previewWidth = 0;
  let previewSkullHtml = '';
  const threatensPostCombo = Boolean(impact && impact.threatensHeroPostCombo);

  if (impact) {
    if (impact.dmgTaken > 0) {
      const remainingHp = Math.max(0, entity.hp - impact.dmgTaken);
      previewLeft = Math.max(0, Math.min(100, Math.round((remainingHp / entity.maxHp) * 100)));
      previewWidth = Math.max(0, hpPercent - previewLeft);
    }
    if (impact.isLethal) {
      previewSkullHtml = `<span class="preview-skull-badge" title="Tento cíl bude v průběhu komba zlikvidován! (0 HP)">💀</span>`;
    }
  }

  const statusesHtml = Object.entries(entity.statuses || {})
    .filter(([, val]) => val > 0)
    .map(([statusId, val]) => {
      const st = STATUSES[statusId];
      if (!st) return '';
      return `<span class="status-chip" title="${st.name}: ${st.description}">${st.badge}${val > 1 ? val : ''}</span>`;
    })
    .join('');

  const intentStripHtml =
    entity.entityType === 'enemy' ? renderEnemyIntentStripHtml(entity, initiativeRank) : '';

  const facingArrow =
    entity.entityType === 'prop'
      ? '🛢️'
      : entity.facing === 1
      ? '<span class="facing-indicator facing-right" title="Směr pohledu: Vpravo">▶</span>'
      : '<span class="facing-indicator facing-left" title="Směr pohledu: Vlevo">◀</span>';

  // CRITICAL RULE: transform: scaleX(facing) ONLY on .sprite-flip-wrapper!
  // HP bar, numbers, initiative, intent icons, and queue slots NEVER mirror!
  const scaleXVal = entity.entityType === 'prop' ? 1 : entity.facing === -1 ? -1 : 1;

  return `
    <div class="entity-container entity-${entity.entityType}"
         id="entity-dom-${entity.id}"
         data-entity-id="${entity.id}"
         data-cur-hp="${entity.hp}"
         data-max-hp="${entity.maxHp}"
         ${entity.entityType === 'enemy' ? `data-enemy-id="${entity.id}"` : ''}>
      ${intentStripHtml}

      <div class="entity-hud-top">
        <div class="entity-nameplate" title="${entity.name}">
          ${epithet ? `<div class="entity-epithet">${epithet}</div>` : ''}
          <div class="entity-name-row">
            ${entity.facing === -1 && entity.entityType !== 'prop' ? facingArrow : ''}
            <span class="entity-given">${givenName}</span>
            ${entity.facing === 1 && entity.entityType !== 'prop' ? facingArrow : ''}
          </div>
        </div>
        <div class="entity-hp-bar-outer" title="Zdraví: ${entity.hp}/${entity.maxHp} HP${(entity.statuses?.shield || 0) > 0 ? ` · Štít: ${entity.statuses.shield}` : ''}">
          <div class="entity-hp-bar-inner hp-${entity.entityType}" style="width: ${hpPercent}%"></div>
          <div class="entity-hp-bar-preview" style="left: ${previewLeft}%; width: ${previewWidth}%;"></div>
          <span class="entity-hp-text">${impact && impact.dmgTaken > 0 ? `${Math.max(0, entity.hp - impact.dmgTaken)}/${entity.maxHp}` : `${entity.hp}/${entity.maxHp}`}${previewSkullHtml}</span>
          ${(entity.statuses?.shield || 0) > 0 ? `<span class="entity-shield-pill" title="Aktivní Štít: ${entity.statuses.shield}">🛡️${entity.statuses.shield}</span>` : ''}
        </div>
      </div>

      <div class="entity-floating-badges">
        <div class="enemy-threat-warning-post-combo ${threatensPostCombo ? '' : 'hidden'}">⚠️ OHROŽUJE!</div>
        ${statusesHtml ? `<div class="entity-status-row">${statusesHtml}</div>` : ''}
      </div>

      <div class="sprite-flip-wrapper scale-${bodyScale}" style="transform: scaleX(${scaleXVal});">
        <div class="entity-ground-shadow shadow-${gait}" style="--idle-delay: -${idleDelaySec(entity.id)}s" aria-hidden="true"></div>
        <img src="${spriteUrl}"
             alt="${entity.name}"
             draggable="false"
             class="entity-sprite-img gait-${gait} ${heroClass} ${entity.flying ? 'sprite-flying' : ''}"
             style="--idle-delay: -${idleDelaySec(entity.id)}s"
             referrerpolicy="no-referrer" />
        ${renderSpriteBloodHtml(entity, currentRenderState)}
      </div>
    </div>
  `;
}

function livingEntityAt(state, cellIdx) {
  if (state.hero && state.hero.hp > 0 && state.hero.cell === cellIdx) return state.hero;
  return (
    state.enemies.find((e) => e.hp > 0 && e.cell === cellIdx) ||
    state.props.find((p) => p.hp > 0 && p.cell === cellIdx) ||
    null
  );
}

function corpseAt(state, cellIdx) {
  if (livingEntityAt(state, cellIdx)) return null;
  if (state.hero && state.hero.hp <= 0 && state.hero.cell === cellIdx) return state.hero;
  return (
    state.enemies.find((e) => e.corpse && e.hp <= 0 && e.cell === cellIdx) ||
    state.props.find((p) => p.corpse && p.hp <= 0 && p.cell === cellIdx) ||
    null
  );
}

export function refreshBoardOverlays(container, state, uiState = {}) {
  if (!container || !state) return false;
  const cells = container.querySelectorAll('.board-cell');
  if (!cells.length) return false;

  const hoveredEnemyId = uiState.hoveredEnemyId || null;
  const hoveredTileId = uiState.hoveredTileId || null;
  const isPreviewMode = Boolean(
    uiState.comboPreviewActive ||
    uiState.hoveredExecute ||
    (typeof uiState.hoveredQueueSlot === 'number' && uiState.hoveredQueueSlot >= 0)
  );
  const simPreview = isPreviewMode && (state.queue || []).length > 0
    ? simulateComboImpact(state)
    : null;

  const threats = computeBoardThreats(state, hoveredEnemyId);
  const queuePreview = computePlayerQueuePreview(state, hoveredTileId);

  cells.forEach((cellEl) => {
    const cellIdx = Number(cellEl.getAttribute('data-cell-index'));
    const cellThreat = threats[cellIdx];
    const isThreatened = Boolean(cellThreat && cellThreat.sources.length > 0);
    const isArmedRed = Boolean(cellThreat && cellThreat.isArmedRed);
    const isInspectReach = Boolean(cellThreat && cellThreat.isInspectReach);
    const isImminent = Boolean(cellThreat && cellThreat.sources.some((s) => s.countdown <= 1));
    const isNextThreat = Boolean(cellThreat && cellThreat.nextTileSources.length > 0);
    const isPlayerTargeted = Boolean(
      queuePreview.targetedCells.some((h) => h.cell === cellIdx) ||
        queuePreview.hoveredCells.some((h) => h.cell === cellIdx)
    );

    cellEl.classList.toggle('cell-armed-red-targeted', isArmedRed);
    cellEl.classList.toggle('cell-inspect-range', isInspectReach);
    cellEl.classList.toggle('cell-threatened', isThreatened);
    cellEl.classList.toggle('cell-threatened-imminent', isImminent);
    cellEl.classList.toggle('cell-threatened-next', isNextThreat);
    cellEl.classList.toggle('cell-player-targeted', isPlayerTargeted);

    const overlay = cellEl.querySelector('.cell-overlay-zone');
    if (overlay) {
      overlay.innerHTML = renderCellThreatAndPreviewHtml(cellIdx, cellThreat, queuePreview, state, simPreview);
    }

    // Update entity HP preview bar & post-combo warning in-place without destroying sprite DOM
    const entityEl = cellEl.querySelector('.entity-container[data-entity-id]');
    if (entityEl) {
      const entityId = entityEl.getAttribute('data-entity-id');
      const curHp = Number(entityEl.getAttribute('data-cur-hp') || 0);
      const maxHp = Math.max(1, Number(entityEl.getAttribute('data-max-hp') || 1));
      const hpPercent = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));
      const impact = simPreview?.impactMap?.[entityId] || null;

      const previewBar = entityEl.querySelector('.entity-hp-bar-preview');
      const hpText = entityEl.querySelector('.entity-hp-text');
      const warnEl = entityEl.querySelector('.enemy-threat-warning-post-combo');

      if (previewBar) {
        if (impact && impact.dmgTaken > 0) {
          const remainingHp = Math.max(0, curHp - impact.dmgTaken);
          const remainingPercent = Math.max(0, Math.min(100, Math.round((remainingHp / maxHp) * 100)));
          const dmgWidthPercent = Math.max(0, hpPercent - remainingPercent);
          previewBar.style.left = `${remainingPercent}%`;
          previewBar.style.width = `${dmgWidthPercent}%`;
        } else {
          previewBar.style.width = '0%';
        }
      }

      if (hpText) {
        const displayHp = impact && impact.dmgTaken > 0 ? Math.max(0, curHp - impact.dmgTaken) : curHp;
        const skull = impact && impact.isLethal ? `<span class="preview-skull-badge">💀</span>` : '';
        hpText.innerHTML = `${displayHp}/${maxHp}${skull}`;
      }

      if (warnEl) {
        warnEl.classList.toggle('hidden', !(impact && impact.threatensHeroPostCombo));
      }
    }
  });

  return true;
}

function gaitFor(entity, bodyScale = null) {
  if (!entity) return 'human';
  const scale = bodyScale || getEntityBodyScale(entity);
  if (entity.entityType === 'hero') return 'hero';
  if (entity.entityType === 'prop' || scale === 'prop') return 'prop';
  if (entity.flying || scale === 'flyer') return 'flyer';
  if (scale === 'critter') return 'critter';
  if (scale === 'beast') return 'beast';
  if (scale === 'small') return 'small';
  if (scale === 'boss' || entity.isBoss) return 'boss';
  if (entity.kind === 'zombie_hynek' || entity.kind === 'kostlivec_fabian') return 'undead';
  return 'human';
}

function idleDelaySec(id) {
  let hash = 0;
  const text = String(id || '');
  for (let i = 0; i < text.length; i++) hash = (hash * 33 + text.charCodeAt(i)) >>> 0;
  return ((hash % 24) / 10).toFixed(1);
}

function renderTerrainDecalHtml(terrainObj, terrainDef) {
  if (!terrainObj || terrainObj.type === 'none') {
    return `
      <div class="cell-floor-stone">
        <div class="floor-stone-cap"></div>
      </div>
    `;
  }

  const durationBadge = typeof terrainObj.duration === 'number'
    ? `<span class="terrain-duration-tag" title="Zbývá ${terrainObj.duration} ${czechTurns(terrainObj.duration)}">${terrainObj.duration}t</span>`
    : '';

  let decalGfx = '';
  switch (terrainObj.type) {
    case 'holy_water_puddle':
      decalGfx = `
        <div class="decal-holy-puddle">
          <svg class="puddle-svg" viewBox="0 0 100 36">
            <ellipse cx="50" cy="18" rx="46" ry="15" fill="rgba(56, 189, 248, 0.45)" stroke="#38bdf8" stroke-width="1.5" />
            <ellipse cx="44" cy="15" rx="30" ry="9" fill="rgba(254, 240, 138, 0.35)" />
            <path d="M25 15 Q35 12 55 14" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.8" fill="none" />
          </svg>
          <span class="decal-icon">💧</span>
          ${durationBadge}
        </div>
      `;
      break;

    case 'garlic_cloud':
      decalGfx = `
        <div class="decal-garlic-cloud">
          <div class="garlic-cloud-puff"></div>
          <span class="decal-icon">🧄</span>
          ${durationBadge}
        </div>
      `;
      break;

    case 'spikes':
      decalGfx = `
        <div class="decal-spikes">
          <svg class="spikes-svg" viewBox="0 0 100 40">
            <polygon points="12,38 20,4 28,38" fill="#52525b" stroke="#18181b" stroke-width="1.5"/>
            <polygon points="18,12 20,4 24,12" fill="#dc2626"/>
            <polygon points="36,38 46,2 56,38" fill="#71717a" stroke="#18181b" stroke-width="1.5"/>
            <polygon points="44,10 46,2 50,10" fill="#dc2626"/>
            <polygon points="64,38 74,6 84,38" fill="#52525b" stroke="#18181b" stroke-width="1.5"/>
            <polygon points="72,14 74,6 78,14" fill="#dc2626"/>
          </svg>
          <span class="decal-icon-mini">🗡️</span>
        </div>
      `;
      break;

    case 'pit':
      decalGfx = `
        <div class="decal-pit">
          <svg class="pit-svg" viewBox="0 0 100 40">
            <ellipse cx="50" cy="20" rx="46" ry="16" fill="#050305" stroke="#450a0a" stroke-width="2"/>
            <ellipse cx="50" cy="20" rx="36" ry="10" fill="#000000"/>
            <path d="M15 20 Q50 28 85 20" stroke="#7f1d1d" stroke-width="1" fill="none" opacity="0.6"/>
          </svg>
          <span class="decal-icon-mini">🕳️</span>
        </div>
      `;
      break;

    case 'plank_intact':
      decalGfx = `
        <div class="decal-plank decal-plank-intact">
          <svg class="plank-svg" viewBox="0 0 100 34">
            <rect x="4" y="6" width="92" height="22" rx="3" fill="#854d0e" stroke="#451a03" stroke-width="2"/>
            <line x1="8" y1="12" x2="92" y2="12" stroke="#a16207" stroke-width="1.5"/>
            <line x1="8" y1="20" x2="92" y2="20" stroke="#713f12" stroke-width="1.5"/>
            <circle cx="12" cy="17" r="2" fill="#1c1917"/>
            <circle cx="88" cy="17" r="2" fill="#1c1917"/>
          </svg>
          <span class="decal-icon-mini">🪵</span>
        </div>
      `;
      break;

    case 'plank_cracked':
      decalGfx = `
        <div class="decal-plank decal-plank-cracked">
          <svg class="plank-svg" viewBox="0 0 100 34">
            <rect x="4" y="6" width="92" height="22" rx="3" fill="#713f12" stroke="#451a03" stroke-width="2"/>
            <path d="M38 6 L44 18 L40 28" stroke="#000000" stroke-width="3" fill="none"/>
            <path d="M60 6 L56 16 L62 28" stroke="#000000" stroke-width="3" fill="none"/>
            <circle cx="12" cy="17" r="2" fill="#1c1917"/>
            <circle cx="88" cy="17" r="2" fill="#1c1917"/>
          </svg>
          <span class="decal-icon-mini">⚠️</span>
        </div>
      `;
      break;

    default:
      decalGfx = `<span class="terrain-decal-simple">${terrainDef?.name || ''}</span>`;
  }

  return `
    <div class="cell-floor-stone terrain-decal-wrapper terrain-type-${terrainObj.type}"
         tabindex="0"
         role="note"
         aria-label="${terrainDef?.name || ''}">
      ${decalGfx}
    </div>
  `;
}

function getProjectileIcon(ev) {
  if (ev.tileId === 'holy_syringe') return '💉';
  if (ev.tileId === 'silver_crucifix_beam') return '✝️';
  if (ev.tileId === 'rosary_slap') return '📿';
  if (ev.tileId === 'tax_stamp_shot') return '💮';
  if (ev.tileId === 'accountant_curse') return '📜';
  if (ev.tileId === 'bone_chuck') return '🦴';
  if (ev.tileId === 'rat_gnaw') return '🐀';
  if (ev.tileId === 'miasma_waft') return '☣️';
  if (ev.enemyId) {
    const id = String(ev.enemyId);
    if (id.includes('urednik')) return '💮';
    if (id.includes('ucetni')) return '📜';
    if (id.includes('fabian') || id.includes('kostlivec')) return '🦴';
    if (id.includes('felcar')) return '☣️';
    if (id.includes('netopyr')) return '🦇';
  }
  return '🎯';
}

async function playProjectileFly(container, fromCellIdx, toCellIdx, icon = '🎯', animSpeed = 1) {
  if (fromCellIdx === undefined || toCellIdx === undefined || fromCellIdx === toCellIdx || animSpeed === 0) {
    return;
  }
  const fromCell = container.querySelector(`.board-cell[data-cell-index="${fromCellIdx}"]`);
  const toCell = container.querySelector(`.board-cell[data-cell-index="${toCellIdx}"]`);
  if (!fromCell || !toCell) return;

  const rFrom = fromCell.getBoundingClientRect();
  const rTo = toCell.getBoundingClientRect();

  const startX = rFrom.left + rFrom.width / 2;
  const startY = rFrom.top + rFrom.height * 0.42;
  const targetX = rTo.left + rTo.width / 2;
  const targetY = rTo.top + rTo.height * 0.42;

  const flipX = targetX > startX ? -1 : 1;
  const flyEl = document.createElement('div');
  flyEl.className = 'flying-projectile';
  flyEl.textContent = icon;
  flyEl.style.left = `${startX}px`;
  flyEl.style.top = `${startY}px`;
  flyEl.style.transform = `translate(-50%, -50%) scale(${0.6 * flipX}, 0.6)`;
  flyEl.style.opacity = '0';
  document.body.appendChild(flyEl);

  const durationMs = Math.max(90, Math.round(180 / (animSpeed || 1)));

  void flyEl.offsetWidth;
  flyEl.style.transition = `transform ${durationMs}ms cubic-bezier(0.2, 0.8, 0.4, 1), opacity 80ms ease-out`;
  flyEl.style.opacity = '1';
  flyEl.style.transform = `translate(calc(-50% + ${targetX - startX}px), calc(-50% + ${targetY - startY}px)) scale(${1.15 * flipX}, 1.15)`;

  await sleep(180, animSpeed);
  flyEl.style.opacity = '0';
  setTimeout(() => flyEl.remove(), 100);
}

async function playEntityMove(container, ev, animSpeed = 1) {
  await animateUnitMoveTo(container, ev, animSpeed);
}

export async function playEngineEvents(container, events, animSpeed = 1, state = null) {
  if (!container || !events || events.length === 0) return;
  const activeState = state || currentRenderState;

  for (const ev of events) {
    switch (ev.type) {
      case 'move':
      case 'leap':
        SFX.step();
        await playEntityMove(container, ev, animSpeed);
        break;

      case 'push_move':
      case 'pull_move':
        SFX.step();
        await playEntityMove(
          container,
          {
            entityId: ev.targetId,
            from: ev.from,
            to: ev.to,
            type: ev.type
          },
          animSpeed
        );
        break;

      case 'swap': {
        SFX.swap();
        const entA = ev.entityAId || activeState?.hero?.id || 'hero_venca';
        const entB = ev.entityBId || ev.enemyId;
        const swapCell = ev.cellA ?? ev.heroTo ?? ev.enemyFrom;
        triggerSpriteAnim(container, entA, 'anim-leap');
        if (entB) triggerSpriteAnim(container, entB, 'anim-leap');
        if (swapCell !== undefined) {
          spawnFloatingBadgeOnCell(container, swapCell, '🤸 PŘESKOK!', 'float-info');
        }
        await sleep(ANIMATION_TIMINGS.MOVE_MS, animSpeed);
        break;
      }

      case 'turn':
        SFX.turn();
        if (ev.free) {
          spawnFloatingBadgeOnEntity(container, ev.entityId, '🧄 OTOČKA ZDARMA', 'float-heal');
        }
        await sleep(90, animSpeed);
        break;

      case 'queue_insert':
        SFX.queueInsert();
        await sleep(90, animSpeed);
        break;

      case 'queue_remove':
        SFX.queueRemove();
        break;

      case 'friendly_fire':
        SFX.friendlyFire();
        spawnFloatingBadgeOnCell(container, ev.cell, '🧛‍♂️💥 FRIENDLY FIRE!', 'float-friendly');
        await sleep(180, animSpeed);
        break;

      case 'step':
        SFX.step();
        await playEntityMove(container, ev, animSpeed);
        break;

      case 'hero_bump':
        SFX.hit();
        setHeroPose(container, 'attack', 0);
        scheduleHeroIdle(container, 280, animSpeed);
        await animateUnitAttack(
          container,
          {
            attackerId: activeState?.hero?.id || 'hero_venca',
            fromCell: activeState?.hero?.cell,
            targetCell: ev.cell
          },
          animSpeed
        );
        break;

      case 'tile_start':
        if (ev.isStrike && ev.heroId) {
          heroPoseLocked = true;
          setHeroPose(container, 'attack', 0);
          scheduleHeroIdle(container, 320, animSpeed);
        }
        break;

      case 'strike_vfx':
        await animateUnitAttack(
          container,
          {
            attackerId: activeState?.hero?.id || 'hero_venca',
            fromCell: ev.from,
            targetCell: ev.cell
          },
          animSpeed
        );
        break;

      case 'projectile_vfx':
        if (!ev.reflected) {
          void animateUnitAttack(
            container,
            {
              attackerId: activeState?.hero?.id || 'hero_venca',
              fromCell: ev.from,
              targetCell: ev.to,
              isRanged: true
            },
            animSpeed
          );
        }
        await playProjectileFly(container, ev.from, ev.to, getProjectileIcon(ev), animSpeed);
        break;

      case 'enemy_strike_vfx':
        await animateUnitAttack(
          container,
          {
            attackerId: ev.enemyId,
            fromCell: ev.from,
            targetCell: ev.cell
          },
          animSpeed
        );
        break;

      case 'enemy_projectile_vfx':
        if (!ev.reflected) {
          void animateUnitAttack(
            container,
            {
              attackerId: ev.enemyId,
              fromCell: ev.from,
              targetCell: ev.to,
              isRanged: true
            },
            animSpeed
          );
        }
        await playProjectileFly(container, ev.from, ev.to, getProjectileIcon(ev), animSpeed);
        break;

      case 'damage': {
        SFX.hit();

        // Dynamically update target HP bar in DOM immediately
        const damagedEl = container.querySelector(`#entity-dom-${ev.targetId}`);
        if (damagedEl && ev.remainingHp !== undefined) {
          const hpInnerEl = damagedEl.querySelector('.entity-hp-bar-inner');
          const hpTextEl = damagedEl.querySelector('.entity-hp-text');
          if (hpInnerEl && hpTextEl) {
            const parts = (hpTextEl.textContent || '').split('/');
            const maxHp = Number(parts[1]) || Math.max(1, ev.remainingHp);
            const curHp = Math.max(0, ev.remainingHp);
            hpTextEl.textContent = `${curHp}/${maxHp}`;
            hpInnerEl.style.width = `${Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)))}%`;
          }
        }

        if (isHeroEntity(container, ev.targetId)) {
          if ((ev.remainingHp ?? 1) > 0) {
            heroPoseLocked = true;
            setHeroPose(container, 'hurt', 0);
            scheduleHeroIdle(container, 360, animSpeed);
          }
        }
        if (ev.ichor) {
          recordEntityHitBlood(activeState, {
            targetId: ev.targetId,
            attackerId: ev.attackerId,
            cell: ev.cell,
            attackerCell: ev.attackerCell,
            amount: ev.amount,
            ichor: ev.ichor,
            reason: ev.reason,
            fatal: ev.fatal || ev.remainingHp <= 0
          });
          spawnBloodBurst(container, {
            cell: ev.cell,
            ichor: ev.ichor,
            amount: ev.amount,
            reason: ev.reason,
            attackerCell: ev.attackerCell,
            fatal: ev.fatal || ev.remainingHp <= 0,
            targetId: ev.targetId,
            attackerId: ev.attackerId,
            state: activeState,
            animSpeed
          });
        }
        spawnFloatingBadgeOnCell(container, ev.cell, `−${ev.amount} HP`, 'float-dmg');
        if (ev.attackerId && isHeroEntity(container, ev.attackerId) && !isHeroEntity(container, ev.targetId)) {
          const heroImg = heroSprite(container);
          if (heroImg?.dataset.pose !== 'attack') {
            heroPoseLocked = true;
            setHeroPose(container, 'attack', 0);
            scheduleHeroIdle(container, 280, animSpeed);
          }
        }
        await animateUnitHit(container, ev.targetId, ev.amount, animSpeed);
        break;
      }

      case 'blocked_front_shield':
      case 'shield_blocked':
        SFX.collision();
        spawnFloatingBadgeOnCell(container, ev.cell, '🛡️ VYKRYTO!', 'float-info');
        await sleep(160, animSpeed);
        break;

      case 'collision_wall':
      case 'collision_entity':
      case 'collision_barrel':
        SFX.collision();
        spawnFloatingBadgeOnCell(container, ev.cell, '💥 KOLIZE!', 'float-dmg');
        await sleep(180, animSpeed);
        break;

      case 'holy_font_shatter':
        SFX.collision();
        spawnFloatingBadgeOnCell(container, ev.cell, '💦 KROPENKA ROZTŘÍŠTĚNA!', 'float-heal');
        await sleep(220, animSpeed);
        break;

      case 'projectile_reflect':
        SFX.shield();
        spawnFloatingBadgeOnCell(container, ev.cell, '🪞 ODRAZ STŘELY!', 'float-status');
        await sleep(180, animSpeed);
        break;

      case 'barrel_break':
        SFX.collision();
        spawnFloatingBadgeOnCell(container, ev.cell, '🛢️ SUD ROZBIT!', 'float-dmg');
        await sleep(180, animSpeed);
        break;

      case 'pit_fall':
        SFX.death();
        spawnFloatingBadgeOnCell(container, ev.cell, '🕳️ PROPAST!', 'float-dmg');
        await sleep(220, animSpeed);
        break;

      case 'plank_collapse':
        SFX.collision();
        spawnFloatingBadgeOnCell(container, ev.cell, '💥 PROLOMENÍ!', 'float-dmg');
        await sleep(180, animSpeed);
        break;

      case 'status_added':
        if (ev.statusId === 'stun') {
          SFX.bell();
          spawnFloatingBadgeOnCell(container, ev.cell, '🔔 OMRÁČENÍ!', 'float-warn');
        }
        break;

      case 'heal': {
        const healedEl = container.querySelector(`#entity-dom-${ev.targetId}`);
        const newHp = ev.remainingHp ?? ev.hp;
        if (healedEl && newHp !== undefined) {
          const hpInnerEl = healedEl.querySelector('.entity-hp-bar-inner');
          const hpTextEl = healedEl.querySelector('.entity-hp-text');
          if (hpInnerEl && hpTextEl) {
            const parts = (hpTextEl.textContent || '').split('/');
            const maxHp = Number(parts[1]) || Math.max(1, newHp);
            const curHp = Math.min(maxHp, newHp);
            hpTextEl.textContent = `${curHp}/${maxHp}`;
            hpInnerEl.style.width = `${Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)))}%`;
          }
        }
        const targetCell = ev.cell ?? activeState?.hero?.cell;
        if (targetCell !== undefined) {
          spawnFloatingBadgeOnCell(container, targetCell, `+${ev.amount} HP`, 'float-heal');
        }
        await sleep(140, animSpeed);
        break;
      }

      case 'svunk':
      case 'momentum':
        SFX.friendlyFire();
        spawnFloatingBadgeOnEntity(
          container,
          activeState?.hero?.id || 'hero_venca',
          `⚡ ŠVUNK! (−${ev.reduction} Chladnutí)`,
          'float-heal'
        );
        await sleep(220, animSpeed);
        break;

      case 'death': {
        SFX.death();
        const deadEl = container.querySelector(`#entity-dom-${ev.targetId}`);
        if (deadEl) {
          const hpInnerEl = deadEl.querySelector('.entity-hp-bar-inner');
          const hpTextEl = deadEl.querySelector('.entity-hp-text');
          if (hpInnerEl) hpInnerEl.style.width = '0%';
          if (hpTextEl) {
            const max = hpTextEl.textContent?.split('/')?.[1] || '0';
            hpTextEl.textContent = `0/${max}`;
          }
        }
        const isHero = isHeroEntity(container, ev.targetId);
        if (isHero) {
          heroPoseLocked = true;
          clearHeroPoseTimer();
          setHeroPose(container, 'dead', 0);
          const hWords = getHunterDialogue(activeState?.hero?.hunterId || activeState?.hero?.kind, 'last_words');
          spawnComicBubble(container, ev.cell, hWords.text, 'last_words', {
            speaker: hWords.speaker,
            icon: hWords.icon,
            facing: activeState?.hero?.facing || 1,
            durationMs: 3400
          });
        } else {
          const eWords = getEnemyDialogue(ev.targetId, 'last_words');
          spawnComicBubble(container, ev.cell, eWords.text, 'last_words', {
            speaker: eWords.speaker || ev.targetName,
            icon: eWords.icon || '💀',
            facing: -1,
            durationMs: 2900
          });
        }
        if (ev.ichor) {
          recordEntityHitBlood(activeState, {
            targetId: ev.targetId,
            cell: ev.cell,
            amount: 6,
            ichor: ev.ichor,
            reason: 'death',
            fatal: true
          });
          spawnBloodBurst(container, {
            cell: ev.cell,
            ichor: ev.ichor,
            amount: 6,
            reason: 'death',
            fatal: true,
            targetId: ev.targetId,
            state: activeState,
            animSpeed
          });
        }
        await animateUnitDeath(container, ev.targetId, isHero, animSpeed);
        break;
      }

      case 'enemy_queue_firing':
        spawnFloatingBadgeOnCell(container, ev.cell, '🚨 ODPALUJE FRONTU!', 'float-warn');
        await sleep(180, animSpeed);
        break;

      case 'comic_bubble':
        spawnComicBubble(container, ev.cell, ev.text, ev.variant || 'quip', {
          speaker: ev.speaker,
          icon: ev.icon,
          facing: ev.facing ?? 1,
          durationMs: ev.durationMs,
          delayMs: ev.delayMs || 0
        });
        await sleep(140, animSpeed);
        break;

      default:
        break;
    }
  }
}

function triggerSpriteAnim(container, entityId, className) {
  if (!entityId) return;
  const el = container.querySelector(`#entity-dom-${entityId} .entity-sprite-img`);
  if (!el) return;
  el.classList.remove('anim-walk', 'anim-walk-back', 'anim-lunge', 'anim-shoot', 'anim-leap', 'anim-hurt');
  if (className !== 'anim-death') el.classList.remove('anim-death');
  void el.offsetWidth;
  el.classList.add(className);
  if (className === 'anim-death') return;
  const cleanup = () => el.classList.remove(className);
  el.addEventListener('animationend', cleanup, { once: true });
}

function spawnFloatingBadgeOnEntity(container, entityId, text, variantClass) {
  const el = container.querySelector(`#entity-dom-${entityId}`);
  if (!el) return;
  const cellEl = el.closest('.board-cell');
  if (!cellEl) return;
  const idx = Number(cellEl.getAttribute('data-cell-index') || 0);
  spawnFloatingBadgeOnCell(container, idx, text, variantClass);
}

function spawnFloatingBadgeOnCell(container, cellIdx, text, variantClass = 'float-dmg') {
  const cell = container.querySelector(`.board-cell[data-cell-index="${cellIdx}"]`);
  if (!cell) return;
  const badge = document.createElement('div');
  badge.className = `floating-combat-text floating-combat-text-fixed ${variantClass}`;
  badge.textContent = text;
  const r = cell.getBoundingClientRect();
  badge.style.left = `${r.left + r.width / 2}px`;
  badge.style.top = `${r.top + r.height * 0.36}px`;
  document.body.appendChild(badge);
  setTimeout(() => badge.remove(), 950);
}
