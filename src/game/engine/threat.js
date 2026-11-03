// @ts-nocheck
import { ENEMY_TILES } from '../config/enemies.js';
import {
  isValidCell,
  getEntityAt,
  findNearestFreeCell,
  getStatusStacks,
  simulateLungeTargetCell,
  getSortedEnemiesByInitiative
} from './state.js';

export function computeSingleEnemyTileHits(state, enemy, tileDef, context = null) {
  if (!enemy || enemy.hp <= 0 || !tileDef || !tileDef.pattern) return [];
  const hits = [];
  const origin = tileDef.lungeForward
    ? simulateLungeTargetCell(state, enemy, enemy.cell, enemy.facing, tileDef.lungeForward)
    : enemy.cell;
  const garlicPenalty = state.terrain[origin]?.type === 'garlic_cloud' ? 1 : 0;
  const empowerBonus = getStatusStacks(enemy, 'empower');
  const lordSynergyBonus =
    context && typeof context.synergy === 'number'
      ? context.synergy
      : !enemy.lordSynergy &&
          state.enemies?.some((e) => e.hp > 0 && e.lordSynergy && e.id !== enemy.id)
        ? 1
        : 0;
  const lookupEntity = (c) =>
    context?.occupancy ? context.occupancy.get(c) || null : getEntityAt(state, c);

  if (tileDef.projectileRange) {
    for (const p of tileDef.pattern) {
      const c = origin + enemy.facing * p.offset;
      if (!isValidCell(c, state)) continue;
      const dmg = Math.max(0, (p.dmg || 0) + empowerBonus - garlicPenalty + lordSynergyBonus);
      hits.push({
        cell: c,
        dmg,
        effects: p.effects || [],
        direction: enemy.facing,
        projectile: true
      });
      const blocker = lookupEntity(c);
      if (blocker && blocker.id !== enemy.id) break;
    }
  } else {
    for (const p of tileDef.pattern) {
      const c = origin + enemy.facing * p.offset;
      if (!isValidCell(c, state)) continue;
      const dmg = Math.max(0, (p.dmg || 0) + empowerBonus - garlicPenalty + lordSynergyBonus);
      hits.push({
        cell: c,
        dmg,
        effects: p.effects || [],
        direction: enemy.facing,
        projectile: false
      });
    }
  }
  return hits;
}

export function computeBoardThreats(state, hoveredEnemyId = null) {
  const cells = Array.from({ length: state.boardSize || 7 }, (_, idx) => ({
    cell: idx,
    totalDmg: 0,
    imminentDmg: 0,
    isArmedRed: false,
    isInspectReach: false,
    sources: [],
    inspectSources: [],
    nextTileSources: []
  }));

  const enemies = getSortedEnemiesByInitiative(state);
  const occupancy = new Map();
  const register = (ent) => {
    if (ent && ent.hp > 0) occupancy.set(ent.cell, ent);
  };
  register(state.hero);
  for (const e of state.enemies || []) register(e);
  for (const p of state.props || []) register(p);

  const lordIds = (state.enemies || [])
    .filter((e) => e.hp > 0 && e.lordSynergy)
    .map((e) => e.id);

  enemies.forEach((enemy, idx) => {
    const initiativeRank = idx + 1;
    const synergy = lordIds.some((id) => id !== enemy.id) ? 1 : 0;
    const ctx = { occupancy, synergy };
    const isArmed = enemy.queueState === 'ARMED_RED';
    const queue = enemy.actionQueue || [];

    const addQueueHits = (tileIds, { armed = false, imminent = false } = {}) => {
      let simCell = enemy.cell;
      let simEmpower = getStatusStacks(enemy, 'empower');
      for (const tileId of tileIds) {
        const def = ENEMY_TILES[tileId];
        if (!def) continue;
        if (def.selfEffect?.type === 'empower') {
          simEmpower += def.selfEffect.amount || 1;
        }
        const hits = computeSingleEnemyTileHits(
          state,
          {
            ...enemy,
            cell: simCell,
            statuses: { ...(enemy.statuses || {}), empower: simEmpower }
          },
          def,
          ctx
        );
        for (const h of hits) {
          const entry = cells[h.cell];
          entry.totalDmg += h.dmg;
          if (armed || imminent) entry.imminentDmg += h.dmg;
          if (armed) entry.isArmedRed = true;
          entry.sources.push({
            enemyId: enemy.id,
            enemyName: enemy.name,
            initiativeRank,
            tileId,
            tileName: def.name,
            isArmedRed: armed,
            countdown: armed ? 1 : enemy.countdown,
            dmg: h.dmg,
            direction: h.direction,
            effects: h.effects
          });
        }
        if (def.lungeForward) {
          simCell = simulateLungeTargetCell(
            state,
            { ...enemy, cell: simCell },
            simCell,
            enemy.facing,
            def.lungeForward
          );
        }
        if ((def.pattern || []).some((p) => (p.dmg || 0) > 0)) {
          simEmpower = 0;
        }
      }
    };

    if (isArmed && queue.length > 0) {
      addQueueHits(queue, { armed: true, imminent: true });
    } else if (queue.length > 0) {
      addQueueHits(queue, { armed: false, imminent: false });
    }

    if (hoveredEnemyId && enemy.id === hoveredEnemyId) {
      const poolTileIds = (enemy.actionPool || []).map((p) => p.tileId);
      for (const tileId of poolTileIds) {
        const def = ENEMY_TILES[tileId];
        if (def) {
          const hits = computeSingleEnemyTileHits(state, enemy, def, ctx);
          for (const h of hits) {
            cells[h.cell].isInspectReach = true;
            cells[h.cell].inspectSources.push({
              enemyId: enemy.id,
              enemyName: enemy.name,
              tileId,
              tileName: def.name,
              dmg: h.dmg,
              direction: h.direction,
              effects: h.effects
            });
          }
        }
      }
    }
  });

  return cells;
}

function computePreviewBonus(state, tile, slotIdx, simCtx) {
  let bonus = 0;
  if ((slotIdx === 2 || slotIdx === 3) && state.talismans?.includes('oak_splinter')) {
    bonus += 1;
  }
  if (!simCtx.firstAttackUsed && tile.type !== 'move' && state.talismans?.includes('brass_lantern')) {
    bonus += 1;
  }
  if ((simCtx.empower || 0) > 0 && (tile.dmg > 0 || bonus > 0)) {
    bonus += simCtx.empower;
  }
  return bonus;
}

function getPreviewTargetAt(state, cell, simCtx) {
  const ent = getEntityAt(state, cell);
  if (!ent || ent.entityType === 'hero' || simCtx?.deadIds?.has(ent.id)) return null;
  return ent;
}

function previewLeapDest(state, fromCell, facing, leapDist) {
  const dest = findNearestFreeCell(state, fromCell + facing * leapDist, facing, state.hero?.id);
  return dest === null ? fromCell : dest;
}

function simulatePreviewStep(state, tile, heroCell, heroFacing, isFirst, isLateSlot, slotIdx, simCtx = {}) {
  let newHeroCell = heroCell;
  let newHeroFacing = heroFacing;
  const hits = [];
  const prevEmpower = simCtx.empower || 0;
  const bonus = computePreviewBonus(state, tile, slotIdx, simCtx);
  simCtx.deadIds ||= new Set();

  if (tile.stepBackward) {
    const dest = heroCell - heroFacing * tile.stepBackward;
    if (isValidCell(dest, state) && !getPreviewTargetAt(state, dest, simCtx)) {
      newHeroCell = dest;
    }
    hits.push({
      cell: newHeroCell,
      dmg: 0,
      isMove: true,
      slotIndex: slotIdx,
      tileName: tile.name,
      effects: []
    });
  } else if (tile.id === 'domicile_inspection') {
    const adjCell = heroCell + heroFacing;
    const adjTarget = getPreviewTargetAt(state, adjCell, simCtx);
    if (adjTarget && adjTarget.entityType === 'enemy') {
      newHeroCell = adjCell;
    }
    if (isValidCell(adjCell, state)) {
      hits.push({
        cell: adjCell,
        dmg: 0,
        isMove: true,
        slotIndex: slotIdx,
        tileName: tile.name,
        effects: []
      });
    }
  } else if (tile.leapDistance) {
    const dest = previewLeapDest(state, heroCell, heroFacing, tile.leapDistance);
    newHeroCell = dest;
    hits.push({
      cell: dest,
      dmg: 0,
      isMove: true,
      slotIndex: slotIdx,
      tileName: tile.name,
      effects: []
    });
  } else if (tile.projectileRange) {
    for (const p of tile.pattern || []) {
      const c = heroCell + heroFacing * p.offset;
      if (!isValidCell(c, state)) continue;
      const dmg = (p.dmg || 0) + bonus;
      const target = getPreviewTargetAt(state, c, simCtx);
      hits.push({
        cell: c,
        dmg,
        isMove: false,
        slotIndex: slotIdx,
        tileName: tile.name,
        wouldKill: Boolean(target && target.hp <= dmg),
        effects: p.effects || []
      });
      if (target) {
        if (target.hp <= dmg) simCtx.deadIds.add(target.id);
        break;
      }
    }
  } else {
    for (const p of tile.pattern || []) {
      const c = heroCell + heroFacing * p.offset;
      if (!isValidCell(c, state)) continue;
      const dmg = (p.dmg || 0) + bonus;
      const target = getPreviewTargetAt(state, c, simCtx);
      hits.push({
        cell: c,
        dmg,
        isMove: Boolean(p.isMoveTarget),
        slotIndex: slotIdx,
        tileName: tile.name,
        wouldKill: Boolean(target && target.hp <= dmg),
        effects: p.effects || []
      });
      if (target && target.hp <= dmg) simCtx.deadIds.add(target.id);
    }
  }

  if (
    !tile.leapDistance &&
    ((tile.dmg || 0) > 0 || bonus > 0 || (tile.pattern || []).some((p) => (p.dmg || 0) > 0))
  ) {
    simCtx.firstAttackUsed = true;
    if (prevEmpower > 0 && ((tile.dmg || 0) > 0 || bonus > prevEmpower)) {
      simCtx.empower = Math.max(0, (simCtx.empower || 0) - prevEmpower);
    }
  }
  if (tile.selfEffect?.type === 'empower') {
    simCtx.empower = (simCtx.empower || 0) + (tile.selfEffect.amount || 1);
  }
  if (tile.selfFlipAfter) {
    newHeroFacing = -newHeroFacing;
  }
  if (tile.recoilBack) {
    const recoilCell = newHeroCell - newHeroFacing * tile.recoilBack;
    if (isValidCell(recoilCell, state) && !getPreviewTargetAt(state, recoilCell, simCtx)) {
      newHeroCell = recoilCell;
    }
  }

  return { newHeroCell, newHeroFacing, hits };
}

export function computePlayerQueuePreview(state, hoveredTileId = null) {
  if (!state.hero || state.hero.hp <= 0) {
    return {
      ghostCell: 0,
      ghostFacing: 1,
      targetedCells: [],
      hoveredCells: []
    };
  }
  let curCell = state.hero.cell;
  let curFacing = state.hero.facing;
  const simCtx = {
    firstAttackUsed: Boolean(state.firstAttackUsed),
    empower: getStatusStacks(state.hero, 'empower')
  };
  const targetedCells = [];
  const queuedTiles = state.queue
    .map((id) => state.hand.find((t) => t.instanceId === id))
    .filter(Boolean);

  queuedTiles.forEach((tile, idx) => {
    const res = simulatePreviewStep(
      state,
      tile,
      curCell,
      curFacing,
      idx === 0,
      idx >= 2,
      idx,
      simCtx
    );
    curCell = res.newHeroCell;
    curFacing = res.newHeroFacing;
    targetedCells.push(...res.hits);
  });

  const hoveredCells = [];
  if (hoveredTileId) {
    const hoveredTile = state.hand.find((t) => t.instanceId === hoveredTileId);
    if (hoveredTile) {
      const slotIdx = queuedTiles.length;
      const hoverCtx = { ...simCtx };
      const res = simulatePreviewStep(
        state,
        hoveredTile,
        curCell,
        curFacing,
        slotIdx === 0,
        slotIdx >= 2,
        slotIdx,
        hoverCtx
      );
      hoveredCells.push(...res.hits);
    }
  }

  return {
    ghostCell: curCell,
    ghostFacing: curFacing,
    heroMoved: curCell !== state.hero.cell || curFacing !== state.hero.facing,
    targetedCells,
    hoveredCells
  };
}
