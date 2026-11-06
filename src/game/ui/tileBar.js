// @ts-nocheck
import { STARTING_LOADOUTS } from '../config/loadouts.js';
import { isHeroAlive } from '../engine/state.js';
import { getAssetUrl } from './assets.js';
import { showTooltip, hideTooltip } from './tooltips.js';
import { czechTurns } from '../config/strings.cs.js';
import { TILE_TAGS } from '../config/tiles.js';

export function renderTileBar(container, state, callbacks = {}) {
  if (!container || !state) return;

  const canStepLeft = canHeroMoveDir(state, -1);
  const canStepRight = canHeroMoveDir(state, 1);
  const isVenca = state.hero?.hunterId === 'venca' || state.hero?.hunterId === 'classic' || state.hero?.kind === 'venca';
  const inGarlic = Boolean(isVenca && state.terrain[state.hero.cell]?.type === 'garlic_cloud');
  const hasQueued = state.queue.length > 0;

  const hero = state.hero || {};
  const hunterKey = hero.hunterId || hero.kind || 'classic';
  const loadout =
    STARTING_LOADOUTS[hunterKey] ||
    Object.values(STARTING_LOADOUTS).find((l) => l.hunterId === hunterKey) ||
    STARTING_LOADOUTS.classic;
  const bumpName = loadout?.bumpName || 'Krok do nepřítele';
  const bumpCd = hero.bumpCooldown || 0;
  const bumpOnCd = bumpCd > 0;

  const tilesHtml = state.hand
    .map((tile, idx) => {
      const hotkey = idx + 1;
      const iconUrl = getAssetUrl(tile.icon, tile.name);
      const onCd = tile.currentCooldown > 0;
      const inQ = tile.inQueue;
      const queueSlotIdx = state.queue.indexOf(tile.instanceId);
      const disabled = onCd || inQ || state.queue.length >= state.maxQueueSlots || state.status !== 'playing';

      const rangeText = formatTileRangeLabel(tile);
      const badges = [];
      if (tile.quick) badges.push('<span class="tile-tag tile-tag-quick">⚡ Rychlovka</span>');
      if (tile.resonance) badges.push('<span class="tile-tag tile-tag-resonance">✨ Rezonance</span>');
      if (tile.tags && Array.isArray(tile.tags)) {
        for (const tId of tile.tags) {
          const tInfo = TILE_TAGS[tId];
          if (tInfo) badges.push(`<span class="tile-tag tile-tag-family" style="border-color:${tInfo.color};">${tInfo.icon} ${tInfo.name}</span>`);
        }
      }

      const heroFury = state.hero?.currentFury || 0;
      const furyBonus = heroFury > 0 && (tile.dmg || 0) > 0 ? Math.round((tile.dmg || 0) * (heroFury / 100)) : 0;
      const dmgHtml = furyBonus > 0
        ? `⚔️ ${tile.dmg} <span style="color:#2ecc71; font-weight:bold;">(+${furyBonus})</span>`
        : `⚔️ ${tile.dmg ?? 0}`;

      return `
        <button type="button"
                class="player-tile-card ${onCd ? 'tile-on-cooldown' : ''} ${inQ ? 'tile-in-queue' : ''}"
                data-tile-instance="${tile.instanceId}"
                ${disabled ? 'disabled' : ''}>
          <div class="tile-card-top">
            <span class="tile-hotkey">[${hotkey}]</span>
            <span class="tile-cd-stat" title="Chladnutí destičky">⏳ ${onCd ? `${tile.currentCooldown}/${tile.maxCooldown}` : `${tile.maxCooldown}t`}</span>
          </div>
          <div class="tile-card-art">
            <img src="${iconUrl}" alt="${tile.name}" class="tile-art-img" referrerpolicy="no-referrer" />
            ${
              onCd
                ? `<div class="tile-cooldown-overlay" aria-label="Chladne ještě ${tile.currentCooldown} ${czechTurns(tile.currentCooldown)}">
                     <span class="cd-number">${tile.currentCooldown}</span>
                     <span class="cd-label">${czechTurns(tile.currentCooldown)}</span>
                   </div>`
                : ''
            }
            ${
              inQ
                ? `<div class="tile-queued-overlay">
                     <span>#${queueSlotIdx + 1}</span>
                   </div>`
                : ''
            }
          </div>
          <div class="tile-card-name" title="${tile.name}"><span>${tile.name}</span></div>
          <div class="tile-card-metrics">
            <span class="tile-metric-dmg">${dmgHtml}</span>
            <span class="tile-metric-range">📏 ${rangeText}</span>
          </div>
          <div class="tile-card-tags">${badges.slice(0, 2).join('')}</div>
        </button>
      `;
    })
    .join('');

  let executeBtnClass = 'btn-action btn-execute-main';
  let executeBtnTitle = 'Nejprve vlož destičky do fronty (1 tah za destičku)';

  if (!hasQueued) {
    executeBtnClass += ' btn-execute-disabled';
  } else {
    executeBtnClass += ' btn-execute-combo btn-execute-ready btn-combo-primed';
    executeBtnTitle = 'Okamžitý odpal! Kliknutím nebo Mezerníkem ihned provedeš všechny destičky ve frontě!';
  }

  const executeBtnText = `🔥 <span class="btn-label-full">ODPÁLIT KOMBO</span><span class="btn-label-short">ODPÁLIT</span> <span class="exec-count">(${state.queue.length}/${state.maxQueueSlots})</span> <kbd>Space</kbd>`;

  container.innerHTML = `
    <div class="action-maneuver-bar ${bumpOnCd ? 'maneuver-bar-cooling' : 'maneuver-bar-ready'}" title="${loadout?.bumpDesc || 'Manévr při kroku do sousedního nepřítele'}">
      <span class="maneuver-tag">👢 ${bumpName}</span>
      <span class="maneuver-status-badge ${bumpOnCd ? 'status-cooling' : 'status-ready'}">${bumpOnCd ? `⏳ Chladne (${bumpCd} ${czechTurns(bumpCd)})` : '⚔️ Připraven k úderu'}</span>
    </div>
    <div class="bottom-battle-dock">
      <div class="action-controls-row">
        <button type="button" class="btn-action btn-act-move" id="btn-act-left" ${!canStepLeft ? 'disabled' : ''} title="Krok vlevo (Klávesa A nebo ⬅)">
          ⬅ <span class="btn-label-full">Krok vlevo</span><span class="btn-label-short">Vlevo</span> <kbd>A</kbd>
        </button>
        <button type="button" class="btn-action btn-act-utility ${inGarlic ? 'btn-action-free' : ''}" id="btn-act-turn" title="${inGarlic ? 'Otočit čelem vzad (ZDARMA v česneku! Klávesa W)' : 'Otočit čelem vzad (Klávesa W)'}">
          🔄 <span>Otočit</span>${inGarlic ? '<span class="garlic-free-tag" title="Otočení zdarma v česneku">0t</span>' : ''} <kbd>W</kbd>
        </button>
        <button type="button" class="btn-action btn-act-utility" id="btn-act-wait" title="Vyčkat 1 tah a zkrátit Chladnutí (Klávesa S)">
          ⏳ <span>Čekat</span> <kbd>S</kbd>
        </button>
        <button type="button" class="btn-action btn-act-move" id="btn-act-right" ${!canStepRight ? 'disabled' : ''} title="Krok vpravo (Klávesa D nebo ➡)">
          <span class="btn-label-full">Krok vpravo</span><span class="btn-label-short">Vpravo</span> ➡ <kbd>D</kbd>
        </button>
        <button type="button" class="btn-action btn-preview-toggle ${callbacks.isComboPreviewActive ? 'btn-preview-active' : ''}" id="btn-act-preview-toggle" ${!hasQueued ? 'disabled' : ''} title="Taktický náhled dopadu komba na Bojiště (vhodné pro mobily a dotykové displeje)">
          👁️ <span>Náhled</span>
        </button>
        <button type="button" class="${executeBtnClass}" id="btn-act-execute" ${!hasQueued ? 'disabled' : ''} title="${executeBtnTitle}">
          ${executeBtnText}
        </button>
      </div>

      <div class="tile-hand-Dock">
        <div class="tile-hand-strip">
          ${tilesHtml}
        </div>
      </div>
    </div>
  `;

  container.querySelector('#btn-act-left')?.addEventListener('click', () => callbacks.onStep?.(-1));
  container.querySelector('#btn-act-right')?.addEventListener('click', () => callbacks.onStep?.(1));
  container.querySelector('#btn-act-turn')?.addEventListener('click', () => callbacks.onTurn?.());
  container.querySelector('#btn-act-wait')?.addEventListener('click', () => callbacks.onWait?.());
  const execBtn = container.querySelector('#btn-act-execute');
  execBtn?.addEventListener('click', () => callbacks.onExecuteQueue?.());
  execBtn?.addEventListener('mouseenter', () => callbacks.onHoverExecute?.(true));
  execBtn?.addEventListener('mouseleave', () => callbacks.onHoverExecute?.(false));

  const previewToggleBtn = container.querySelector('#btn-act-preview-toggle');
  previewToggleBtn?.addEventListener('click', () => callbacks.onToggleComboPreview?.());

  const isHoverCapable =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  container.querySelectorAll('[data-tile-instance]').forEach((btn) => {
    const instanceId = btn.getAttribute('data-tile-instance');
    const tile = state.hand.find((t) => t.instanceId === instanceId);
    if (!tile) return;

    btn.addEventListener('click', () => {
      hideTooltip();
      callbacks.onHoverTile?.(null);
      callbacks.onSelectTile?.(instanceId);
    });

    btn.addEventListener('mouseenter', (ev) => {
      if (!isHoverCapable) return;
      callbacks.onHoverTile?.(instanceId);
      showTooltip(buildTileTooltipHtml(tile, state?.hero), ev.clientX, ev.clientY);
    });

    btn.addEventListener('mouseleave', () => {
      if (!isHoverCapable) return;
      callbacks.onHoverTile?.(null);
      hideTooltip();
    });
  });
}

function canHeroMoveDir(state, dir) {
  if (!state.hero || !isHeroAlive(state.hero) || state.status !== 'playing') return false;
  const limit = state.boardSize || 7;
  const nextCell = state.hero.cell + dir;
  if (!Number.isInteger(nextCell) || nextCell < 0 || nextCell >= limit) return false;
  const enemyOcc = state.enemies.find((e) => e.hp > 0 && e.cell === nextCell);
  if (enemyOcc) {
    return (state.hero.bumpCooldown || 0) <= 0;
  }
  const propOcc = state.props.find((p) => p.hp > 0 && p.cell === nextCell);
  return !propOcc;
}

function formatTileRangeLabel(tile) {
  if (tile.id === 'domicile_inspection') return 'Prohození (1)';
  if (tile.stepBackward) return 'Úskok vzad';
  if (tile.leapDistance) return `Skok ${tile.leapDistance}`;
  if (tile.projectileRange) return `Střela 1–${tile.projectileRange}`;
  if (!tile.pattern || tile.pattern.length === 0) return 'Na místě';
  const offsets = tile.pattern.map((p) => p.offset).sort((a, b) => a - b);
  if (offsets.length === 1) {
    if (offsets[0] === 1) return 'Vpřed 1';
    if (offsets[0] === -1) return 'Vzad 1';
    return offsets[0] > 0 ? `Vpřed ${offsets[0]}` : `Vzad ${Math.abs(offsets[0])}`;
  }
  if (offsets.length === 2 && offsets[0] === -1 && offsets[1] === 1) {
    return 'Kolem sebe (1)';
  }
  if (offsets.every((o) => o > 0)) {
    return `Vpřed ${Math.min(...offsets)}–${Math.max(...offsets)}`;
  }
  return `Pole ${offsets.map((o) => (o > 0 ? `+${o}` : `${o}`)).join(', ')}`;
}

export function buildTileTooltipHtml(tile, hero = null) {
  const heroFury = hero?.currentFury || 0;
  const furyBonus = heroFury > 0 && (tile.dmg || 0) > 0 ? Math.round((tile.dmg || 0) * (heroFury / 100)) : 0;
  const tagPills = (tile.tags || [])
    .map((t) =>
      TILE_TAGS[t]
        ? `<span style="display:inline-block;padding:1px 6px;margin:2px 4px 2px 0;border-radius:4px;background:#451a03;border:1px solid #fbbf24;font-size:0.78em;color:#fffbeb;font-weight:800;">${TILE_TAGS[t].icon} ${TILE_TAGS[t].name}</span>`
        : ''
    )
    .filter(Boolean)
    .join('');

  return `
    <div class="tt-title">${tile.name}</div>
    <div class="tt-stat-row">
      ⚔️ DMG: <strong style="color:#ffffff;">${tile.dmg ?? 0}</strong>${furyBonus > 0 ? ` <span style="color:#4ade80; font-weight:800;">(+${furyBonus} Rozlícení)</span>` : ''} · ⏳ CD: <strong style="color:#ffffff;">${tile.maxCooldown} ${czechTurns(tile.maxCooldown)}</strong>
      ${tile.quick ? ' · ⚡ <strong style="color:#fde047;">Rychlovka (0t)</strong>' : ''}
    </div>
    ${tagPills ? `<div style="margin-bottom:6px;">${tagPills}</div>` : ''}
    <div class="tt-desc">${tile.description}</div>
    ${tile.resonance ? `<div class="tt-bonus">✨ <strong>${tile.resonance.description}</strong></div>` : ''}
    ${tile.flavor ? `<div class="tt-flavor">${tile.flavor}</div>` : ''}
  `;
}
