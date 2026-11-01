// @ts-nocheck
import { createRng } from './rng.js';
import { getHeroTileDefinition } from '../config/tiles.js';
import { ENEMY_TILES, ENEMIES, getEntityIchorType } from '../config/enemies.js';
import { PROPS, TERRAIN_PRESETS } from '../config/terrain.js';
import { ENCOUNTERS } from '../config/encounters.js';
import { STRINGS } from '../config/strings.cs.js';

let nextEntitySeq = 1;
export function genEntityId(prefix = 'ent') {
  return `${prefix}_${nextEntitySeq++}`;
}

export function isValidCell(cell, state) {
  const size = state?.boardSize || 7;
  return Number.isInteger(cell) && cell >= 0 && cell < size;
}

export function getAllLivingEntities(state) {
  const list = [];
  if (state.hero && state.hero.hp > 0) list.push(state.hero);
  for (const e of state.enemies) {
    if (e.hp > 0) list.push(e);
  }
  for (const p of state.props) {
    if (p.hp > 0) list.push(p);
  }
  return list;
}

export function getEntityAt(state, cell) {
  if (!isValidCell(cell, state)) return null;
  if (state.hero && state.hero.hp > 0 && state.hero.cell === cell) return state.hero;
  for (const e of state.enemies) {
    if (e.hp > 0 && e.cell === cell) return e;
  }
  for (const p of state.props) {
    if (p.hp > 0 && p.cell === cell) return p;
  }
  return null;
}

export const getEntityAtCell = getEntityAt;

export function assertBoardInvariants(state) {
  const seen = new Map();
  const living = getAllLivingEntities(state);
  for (const ent of living) {
    if (!isValidCell(ent.cell, state)) {
      throw new Error(`Invariant porušen: entita ${ent.id} je mimo bojiště na poli ${ent.cell}`);
    }
    if (seen.has(ent.cell)) {
      const other = seen.get(ent.cell);
      throw new Error(`Invariant porušen: dvě entity (${other.id}, ${ent.id}) stojí na stejném poli ${ent.cell}`);
    }
    seen.set(ent.cell, ent);
  }
  return true;
}

export function findNearestFreeCell(state, desiredCell, preferredDir = 1, ignoreEntityId = null) {
  const size = state?.boardSize || 7;
  const clamped = Math.max(0, Math.min(size - 1, desiredCell));
  const isOccupied = (c) => {
    const ent = getEntityAt(state, c);
    return Boolean(ent && (!ignoreEntityId || ent.id !== ignoreEntityId));
  };
  if (!isOccupied(clamped)) return clamped;
  const dir = Math.sign(preferredDir) || 1;
  for (let dist = 1; dist < size; dist++) {
    const forward = clamped + dir * dist;
    const backward = clamped - dir * dist;
    if (isValidCell(forward, state) && !isOccupied(forward)) return forward;
    if (isValidCell(backward, state) && !isOccupied(backward)) return backward;
  }
  return null;
}

export function hasStatus(entity, statusId) {
  return Boolean(entity && entity.hp > 0 && entity.statuses && (entity.statuses[statusId] || 0) > 0);
}

export function getStatusStacks(entity, statusId) {
  if (!entity || entity.hp <= 0 || !entity.statuses) return 0;
  return Math.max(0, entity.statuses[statusId] || 0);
}

export function consumeStatus(entity, statusId, amount = 1) {
  if (!entity || !entity.statuses || !entity.statuses[statusId]) return 0;
  const consumed = Math.min(entity.statuses[statusId], amount);
  entity.statuses[statusId] -= consumed;
  if (entity.statuses[statusId] <= 0) {
    delete entity.statuses[statusId];
  }
  return consumed;
}

export function addStatus(entity, statusId, amount = 1, events = []) {
  if (!entity || entity.hp <= 0 || !statusId || statusId === 'stagger') return;
  entity.statuses ||= {};
  entity.statuses[statusId] = (entity.statuses[statusId] || 0) + amount;
  if (statusId === 'shield') {
    entity.statuses.shieldTurnsLeft = 1;
  }
  events.push({
    type: 'status_added',
    targetId: entity.id,
    cell: entity.cell,
    statusId,
    amount: entity.statuses[statusId]
  });
}

export function findEntityById(state, id) {
  if (!id) return null;
  if (state.hero?.id === id) return state.hero;
  return state.enemies.find((e) => e.id === id) || state.props.find((p) => p.id === id) || null;
}

export function applyEnrageToBoss(boss) {
  const tileId = boss.enrageTile;
  if (!tileId) return false;
  const def = ENEMY_TILES[tileId];
  const maxCd = def?.cooldown ?? def?.delay ?? 2;
  boss.actionPool ||= [];
  const existing = boss.actionPool.find((p) => p.tileId === tileId);
  if (existing) {
    existing.currentCooldown = 0;
    existing.maxCooldown ||= maxCd;
  } else {
    boss.actionPool.push({ tileId, maxCooldown: maxCd, currentCooldown: 0 });
  }
  if (
    boss.queueState === 'ARMED_RED' ||
    (boss.actionQueue ||= []).includes(tileId) ||
    boss.actionQueue.length >= (boss.comboCapacity || 3)
  ) {
    return false;
  }
  boss.actionQueue.push(tileId);
  boss.queueState = 'QUEUING_GRAY';
  return true;
}

export function findMirrorSwapCandidate(state, boss) {
  const candidates = [
    ...state.props.filter((p) => p.hp > 0 && p.kind === 'barrel'),
    ...state.enemies.filter((e) => e.hp > 0 && e.id !== boss.id && e.kind === 'netopyr')
  ];
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => Math.abs(a.cell - boss.cell) - Math.abs(b.cell - boss.cell));
  return candidates[0];
}

export function clearCorpses(state) {
  if (!state) return;
  for (const e of state.enemies || []) delete e.corpse;
  for (const p of state.props || []) delete p.corpse;
}

export function resolveEntityDeath(state, target, opts = {}, events = []) {
  if (!target || target.deathResolved) return;
  target.deathResolved = true;
  events.push({
    type: 'death',
    targetId: target.id,
    targetName: target.name,
    entityType: target.entityType,
    cell: target.cell,
    reason: opts.reason || 'damage',
    ichor: target.ichor || null
  });

  if (target.entityType === 'prop' && target.kind === 'barrel') {
    events.push({
      type: 'barrel_break',
      cell: target.cell,
      text: 'Sud s kyselým zelím se rozletěl na třísky!'
    });
    events.push({
      type: 'log',
      text: `🛢️ Sud s kyselým zelím na poli ${target.cell + 1} explodoval v gejzíru šťávy!`
    });
  } else if (target.entityType === 'prop' && target.kind === 'holy_font') {
    events.push({ type: 'holy_font_shatter', cell: target.cell });
    events.push({
      type: 'log',
      text: '💦 Kamenná kropenka se roztříštila! Gejzír svěcené vody zasáhl okolní nemrtvé za 2 DMG a vytvořil posvěcenou louži!'
    });
    state.terrain[target.cell] = { type: 'holy_water_puddle', duration: 3 };
    events.push({ type: 'terrain_spawn', terrainType: 'holy_water_puddle', cell: target.cell });
    for (const c of [target.cell - 1, target.cell, target.cell + 1]) {
      if (isValidCell(c, state)) {
        const enemy = state.enemies.find((e) => e.hp > 0 && e.cell === c);
        if (enemy) {
          dealDamage(state, enemy, 4, { reason: 'holy_font_shatter', type: 'holy' }, events);
        }
      }
    }
  } else if (target.entityType === 'enemy') {
    state.stats.enemiesKilled = (state.stats.enemiesKilled || 0) + 1;
    events.push({
      type: 'log',
      text: `💀 ${target.name} se s hlasitým zaklením poroučel do věčných lovišť!`
    });
  } else if (target.entityType === 'hero') {
    events.push({
      type: 'log',
      text: '⚰️ Venca Česnekáč padl! Upíři a noční stvůry dnes zvítězili.'
    });
  }
  target.corpse = true;
}

export function triggerCellTerrainOnEnter(state, entity, cell, events = []) {
  if (!entity || entity.hp <= 0 || !isValidCell(cell, state)) return;
  const terr = state.terrain[cell];
  if (!terr || terr.type === 'none') return;
  if (entity.flying && terr.type !== 'spikes') return;

  if (terr.type === 'pit') {
    events.push({
      type: 'pit_fall',
      targetId: entity.id,
      cell,
      text: `${entity.name} zahučel do bezedné propasti!`
    });
    events.push({
      type: 'log',
      text: `🕳️ ${entity.name} spadl do propasti na poli ${cell + 1}! Okamžitá smrt!`
    });
    entity.hp = 0;
    resolveEntityDeath(state, entity, { reason: 'pit' }, events);
  } else if (terr.type === 'spikes') {
    events.push({ type: 'terrain_trigger', terrainType: 'spikes', cell, targetId: entity.id });
    events.push({
      type: 'log',
      text: `🗡️ ${entity.name} naběhl na naostřené kůly na poli ${cell + 1} (4 DMG)!`
    });
    dealDamage(state, entity, 4, { reason: 'spikes' }, events);
  } else if (terr.type === 'holy_water_puddle' && entity.entityType === 'enemy') {
    events.push({ type: 'terrain_trigger', terrainType: 'holy_water_puddle', cell, targetId: entity.id });
    events.push({
      type: 'log',
      text: `🔥 ${entity.name} vstoupil do posvěcené louže a škvaří se (1 DMG)!`
    });
    dealDamage(state, entity, 2, { reason: 'holy_water_puddle', type: 'holy' }, events);
  } else if (terr.type === 'plank_intact') {
    state.terrain[cell] = { type: 'plank_cracked' };
    events.push({ type: 'plank_crack', cell, targetId: entity.id });
    events.push({
      type: 'log',
      text: `🪵 Prohnilé prkno na poli ${cell + 1} pod vahou postavy ${entity.name} zlověstně zapraskalo!`
    });
  } else if (terr.type === 'plank_cracked') {
    state.terrain[cell] = { type: 'none' };
    events.push({ type: 'plank_collapse', cell, targetId: entity.id });
    events.push({
      type: 'log',
      text: `💥 Prkno na poli ${cell + 1} se prolomilo! ${entity.name} utržil 4 DMG!`
    });
    dealDamage(state, entity, 4, { reason: 'plank_collapse' }, events);
  }
}

export function dealDamage(state, target, rawAmount, opts = {}, events = []) {
  if (!target || target.hp <= 0 || rawAmount <= 0) return 0;
  let dmg = rawAmount;

  if (
    target.entityType === 'enemy' &&
    target.frontShield &&
    opts.type === 'direct' &&
    typeof opts.attackerCell === 'number' &&
    Math.sign(opts.attackerCell - target.cell) === target.facing
  ) {
    events.push({
      type: 'blocked_front_shield',
      targetId: target.id,
      cell: target.cell,
      text: `${target.name} vykryl přímý úder zepředu svým štítem!`
    });
    events.push({
      type: 'log',
      text: `🛡️ ${target.name} odrazil útok zepředu! Musíš na něj zezadu, odhozením nebo ho otočit stříkačkou.`
    });
    return 0;
  }

  if (target.statuses?.shield > 0) {
    const sh = target.statuses.shield;
    const absorbed = Math.min(sh, dmg);
    target.statuses.shield -= absorbed;
    if (target.statuses.shield <= 0) {
      delete target.statuses.shield;
      delete target.statuses.shieldTurnsLeft;
    }
    dmg -= absorbed;
    events.push({
      type: 'shield_blocked',
      targetId: target.id,
      cell: target.cell,
      absorbed,
      shieldRemaining: target.statuses?.shield || 0,
      text: `${target.name} pohltil ${absorbed} DMG štítem! (Zbývá ${target.statuses?.shield || 0} Štítu)`
    });
    events.push({
      type: 'log',
      text: `🛡️ Štít postavy ${target.name} pohltil ${absorbed} DMG! (Zbývá ${target.statuses?.shield || 0} Štítu)`
    });
    if (dmg <= 0) return 0;
  }

  target.hp = Math.max(0, target.hp - dmg);
  events.push({
    type: 'damage',
    targetId: target.id,
    targetName: target.name,
    cell: target.cell,
    amount: dmg,
    remainingHp: target.hp,
    attackerId: opts.attackerId || null,
    attackerCell: typeof opts.attackerCell === 'number' ? opts.attackerCell : null,
    reason: opts.reason || 'attack',
    ichor: target.ichor || null,
    entityType: target.entityType || null,
    fatal: target.hp <= 0
  });

  if (target.bloodThorns && !opts.reflected && opts.attackerId && opts.attackerId !== target.id) {
    const attacker = findEntityById(state, opts.attackerId);
    if (attacker && attacker.hp > 0 && attacker.id !== target.id) {
      events.push({
        type: 'log',
        text: `🌹 Krajkové trny ${target.name} šlehly útočníka za 1 DMG!`
      });
      dealDamage(
        state,
        attacker,
        1,
        {
          reason: 'blood_thorns',
          reflected: true,
          attackerId: target.id,
          attackerCell: target.cell,
          type: 'thorns'
        },
        events
      );
    }
  }

  if (
    target.entityType === 'enemy' &&
    target.isBoss &&
    target.hp > 0 &&
    !target.enraged &&
    target.hp <= Math.floor(target.maxHp / 2) &&
    target.enrageTile
  ) {
    target.enraged = true;
    const queued = applyEnrageToBoss(target);
    events.push({
      type: 'boss_enrage',
      targetId: target.id,
      cell: target.cell,
      tileId: target.enrageTile,
      queued
    });
    events.push({
      type: 'log',
      text: queued
        ? `⚡ ${target.name} zuří a přidává do své fronty novou zákeřnou destičku!`
        : `⚡ ${target.name} zuří!`
    });
  }

  if (
    target.entityType === 'enemy' &&
    target.mirrorCloak &&
    target.hp > 0 &&
    opts.isComboHit &&
    typeof opts.attackerCell === 'number'
  ) {
    const dir = Math.sign(target.cell - opts.attackerCell);
    if (target.lastComboHitDir === dir) {
      const swapPartner = findMirrorSwapCandidate(state, target);
      if (swapPartner) {
        const oldBossCell = target.cell;
        const oldPartnerCell = swapPartner.cell;
        target.cell = oldPartnerCell;
        swapPartner.cell = oldBossCell;
        target.lastComboHitDir = null;
        events.push({
          type: 'swap',
          entityAId: target.id,
          entityBId: swapPartner.id,
          cellA: oldPartnerCell,
          cellB: oldBossCell
        });
        events.push({
          type: 'log',
          text: `🪞 Zrcadlový plášť! ${target.name} si v dýmu prohodil místo s entitou ${swapPartner.name}!`
        });
        triggerCellTerrainOnEnter(state, target, oldPartnerCell, events);
        if (swapPartner.hp > 0) {
          triggerCellTerrainOnEnter(state, swapPartner, oldBossCell, events);
        }
      }
    } else {
      target.lastComboHitDir = dir;
    }
  }

  if (target.hp <= 0) {
    resolveEntityDeath(state, target, opts, events);
  }
  return dmg;
}

export function getHitBlockType(events, startIdx) {
  for (let i = events.length - 1; i >= startIdx; i--) {
    const t = events[i]?.type;
    if (t === 'shield_blocked') return 'shield';
    if (t === 'blocked_front_shield') return 'front';
    if (t === 'damage') return null;
  }
  return null;
}

export function shouldApplySecondaryEffect(blockType, effectType) {
  if (!blockType) return true;
  if (blockType === 'shield') return false;
  return blockType !== 'front' || effectType === 'push' || effectType === 'flip_target';
}

export function pushEntity(state, target, direction, distance, events = []) {
  if (!target || target.hp <= 0 || distance <= 0 || !direction) return;
  const dir = Math.sign(direction);
  const bootBonus = state.talismans?.includes('hobnailed_boots') ? 1 : 0;
  const collisionDmg = 2 + (target.entityType === 'hero' ? 0 : bootBonus);

  for (let step = 0; step < distance && target.hp > 0; step++) {
    const nextCell = target.cell + dir;
    if (!isValidCell(nextCell, state)) {
      events.push({
        type: 'collision_wall',
        targetId: target.id,
        cell: target.cell,
        direction: dir
      });
      events.push({
        type: 'log',
        text: `🧱 ${target.name} narazil hlavou do hradní zdi (${collisionDmg} DMG)!`
      });
      dealDamage(state, target, collisionDmg, { reason: 'wall_collision' }, events);
      break;
    }

    const blocker = getEntityAt(state, nextCell);
    if (blocker) {
      if (blocker.entityType === 'prop' && blocker.kind === 'barrel') {
        events.push({
          type: 'collision_barrel',
          targetId: target.id,
          barrelId: blocker.id,
          cell: nextCell
        });
        events.push({
          type: 'log',
          text: `🛢️ ${target.name} vletěl přímo do sudu s kyselým zelím! Sud praská (4 DMG + Zmatení)!`
        });
        dealDamage(state, blocker, blocker.hp, { reason: 'barrel_smash' }, events);
        dealDamage(
          state,
          target,
          4 + (target.entityType === 'hero' ? 0 : bootBonus),
          { reason: 'barrel_smash' },
          events
        );
        if (target.hp > 0) addStatus(target, 'confusion', 1, events);
        if (blocker.hp <= 0 && target.hp > 0 && !getEntityAt(state, nextCell)) {
          const from = target.cell;
          target.cell = nextCell;
          events.push({ type: 'push_move', targetId: target.id, from, to: nextCell });
          triggerCellTerrainOnEnter(state, target, nextCell, events);
        }
        break;
      }

      if (blocker.entityType === 'prop' && blocker.kind === 'holy_font') {
        events.push({
          type: 'collision_font',
          targetId: target.id,
          fontId: blocker.id,
          cell: nextCell
        });
        events.push({
          type: 'log',
          text: `💦 ${target.name} vší silou narazil do kamenné kropenky! Kropenka se tříští na kusy!`
        });
        dealDamage(state, blocker, blocker.hp, { reason: 'font_smash' }, events);
        dealDamage(state, target, collisionDmg, { reason: 'font_smash' }, events);
        if (blocker.hp <= 0 && target.hp > 0 && !getEntityAt(state, nextCell)) {
          const from = target.cell;
          target.cell = nextCell;
          events.push({ type: 'push_move', targetId: target.id, from, to: nextCell });
          triggerCellTerrainOnEnter(state, target, nextCell, events);
        }
        break;
      }

      events.push({
        type: 'collision_entity',
        pushedId: target.id,
        blockerId: blocker.id,
        cell: nextCell
      });
      const quote = STRINGS.collisionQuotes[0];
      const blockerDmg = 2 + (blocker.entityType === 'hero' ? 0 : bootBonus);
      const dmgDesc =
        collisionDmg === blockerDmg
          ? `oba ${collisionDmg} DMG`
          : `${target.name} ${collisionDmg} DMG, ${blocker.name} ${blockerDmg} DMG`;
      events.push({
        type: 'log',
        text: `💥 Srážka! ${target.name} vrazil do postavy ${blocker.name} (${dmgDesc})! ${quote}`
      });
      dealDamage(state, target, collisionDmg, { reason: 'entity_collision' }, events);
      dealDamage(state, blocker, blockerDmg, { reason: 'entity_collision' }, events);
      break;
    }

    const from = target.cell;
    target.cell = nextCell;
    events.push({ type: 'push_move', targetId: target.id, from, to: nextCell });
    triggerCellTerrainOnEnter(state, target, nextCell, events);
  }
  assertBoardInvariants(state);
}

export function pullEntityTowardCell(state, target, sourceCell, events = []) {
  if (!target || target.hp <= 0) return;
  const dir = Math.sign(sourceCell - target.cell);
  if (dir === 0) return;
  while (Math.abs(target.cell - sourceCell) > 1 && target.hp > 0) {
    const nextCell = target.cell + dir;
    if (!isValidCell(nextCell, state) || getEntityAt(state, nextCell)) break;
    const from = target.cell;
    target.cell = nextCell;
    events.push({ type: 'pull_move', targetId: target.id, from, to: nextCell });
    triggerCellTerrainOnEnter(state, target, nextCell, events);
  }
  assertBoardInvariants(state);
}

export function getEnemyStepBlockReason(state, enemy, targetCell) {
  if (!isValidCell(targetCell, state)) return 'wall';
  if (getEntityAt(state, targetCell)) return 'occupied';
  if (!enemy?.flying && state.terrain[targetCell]?.type === 'pit') return 'pit';
  return null;
}

export function formatBlockedStepLog(enemy, targetCell, reason) {
  if (reason === 'pit') return `🕳️ ${enemy.name} se zarazil před propastí na poli ${targetCell + 1}.`;
  if (reason === 'wall') return `🧱 ${enemy.name} chtěl popojít, ale narazil do hradní zdi.`;
  return `🚧 ${enemy.name} chtěl popojít, ale pole je obsazené.`;
}

export function canEnemyStepTo(state, enemy, targetCell) {
  return getEnemyStepBlockReason(state, enemy, targetCell) === null;
}

export function simulateLungeTargetCell(state, enemy, startCell, facing, lungeDist) {
  let cur = startCell;
  const dir = Math.sign(facing) || 1;
  for (let i = 0; i < (lungeDist || 0); i++) {
    const next = cur + dir;
    if (getEnemyStepBlockReason(state, enemy, next)) break;
    cur = next;
  }
  return cur;
}

export function wouldEnemyTileHitTargetCell(state, enemy, tileDef, fromCell, facing, targetCell) {
  if (!tileDef || !tileDef.pattern || tileDef.pattern.length === 0) return false;
  const origin = tileDef.lungeForward
    ? simulateLungeTargetCell(state, enemy, fromCell, facing, tileDef.lungeForward)
    : fromCell;
  if (tileDef.projectileRange) {
    for (const p of tileDef.pattern) {
      const c = origin + facing * p.offset;
      if (!isValidCell(c, state)) break;
      if (c === targetCell) return true;
      const blocker = getEntityAt(state, c);
      if (blocker && blocker.id !== enemy.id) break;
    }
    return false;
  }
  return (tileDef.pattern || []).some((p) => origin + facing * p.offset === targetCell);
}

export function planEnemyNextAction(state, enemy) {
  if (!enemy || enemy.hp <= 0 || !state.hero || state.hero.hp <= 0) {
    enemy.nextAction = null;
    return;
  }
  if (enemy.queueState === 'ARMED_RED') {
    enemy.nextAction = { type: 'execute_queue' };
    return;
  }
  const heroCell = state.hero.cell;
  const delta = heroCell - enemy.cell;
  const desiredFacing = Math.sign(delta) || enemy.facing;

  if (desiredFacing !== enemy.facing && heroCell !== enemy.cell) {
    enemy.nextAction = { type: 'turn', dir: desiredFacing };
    return;
  }

  const readyPool = (enemy.actionPool || []).filter(
    (p) => p.currentCooldown === 0 && !(enemy.actionQueue || []).includes(p.tileId)
  );
  const hittingTiles = readyPool.filter((p) => {
    const def = ENEMY_TILES[p.tileId];
    return wouldEnemyTileHitTargetCell(state, enemy, def, enemy.cell, enemy.facing, heroCell);
  });

  if (hittingTiles.length > 0) {
    const chosen = hittingTiles[0];
    const cap = enemy.comboCapacity || 2;
    if ((enemy.actionQueue || []).length < cap) {
      enemy.nextAction = { type: 'queue_tile', tileId: chosen.tileId };
      return;
    }
    enemy.queueState = 'ARMED_RED';
    enemy.nextAction = { type: 'execute_queue' };
    return;
  }

  if (
    (enemy.actionQueue || []).some((tileId) => {
      const def = ENEMY_TILES[tileId];
      return wouldEnemyTileHitTargetCell(state, enemy, def, enemy.cell, enemy.facing, heroCell);
    }) &&
    (enemy.archetype === 'fodder' || (enemy.actionQueue || []).length >= (enemy.comboCapacity || 2))
  ) {
    enemy.queueState = 'ARMED_RED';
    enemy.nextAction = { type: 'execute_queue' };
    return;
  }

  const dist = Math.abs(delta);
  if (enemy.archetype === 'ranged' && dist <= 1 && canEnemyStepTo(state, enemy, enemy.cell - enemy.facing)) {
    enemy.nextAction = { type: 'step', dir: -enemy.facing, reason: 'retreat' };
    return;
  }
  if (dist > 1 && canEnemyStepTo(state, enemy, enemy.cell + enemy.facing)) {
    enemy.nextAction = { type: 'step', dir: enemy.facing, reason: 'advance' };
    return;
  }

  const supportTile = readyPool.find((p) => {
    const def = ENEMY_TILES[p.tileId];
    return (
      def &&
      (def.type === 'nápřah' || def.type === 'štít' || def.type === 'léčení' || def.type === 'přivolání')
    );
  });
  if (supportTile && (enemy.actionQueue || []).length < (enemy.comboCapacity || 2)) {
    enemy.nextAction = { type: 'queue_tile', tileId: supportTile.tileId };
  } else if ((enemy.actionQueue || []).length > 0) {
    enemy.queueState = 'ARMED_RED';
    enemy.nextAction = { type: 'execute_queue' };
  } else {
    enemy.nextAction = { type: 'idle' };
  }
}

export function checkArmingCondition(state, enemy, events = []) {
  if (enemy.queueState === 'ARMED_RED' || !enemy.actionQueue || enemy.actionQueue.length === 0) return;
  let shouldArm = false;
  const cap = enemy.comboCapacity || 2;
  const remainingReady = (enemy.actionPool || []).filter(
    (p) => p.currentCooldown === 0 && !enemy.actionQueue.includes(p.tileId)
  );
  if (
    enemy.actionQueue.length >= cap ||
    (enemy.archetype === 'fodder' && enemy.actionQueue.length >= 1) ||
    remainingReady.length === 0
  ) {
    shouldArm = true;
  }
  if (shouldArm) {
    enemy.queueState = 'ARMED_RED';
    enemy.nextAction = { type: 'execute_queue' };
    events.push({
      type: 'enemy_armed',
      enemyId: enemy.id,
      enemyName: enemy.name,
      cell: enemy.cell
    });
    events.push({
      type: 'log',
      text: `🚨 ${enemy.name} zčervenal. Máš ještě jednu normální akci, než odpálí útok!`
    });
  }
}

export function refreshAllEnemyIntents(state) {
  if (!state || !state.enemies) return;
  for (const e of state.enemies) {
    if (e.hp > 0) refreshSingleEnemyIntent(state, e);
  }
}

export function refreshSingleEnemyIntent(state, enemy) {
  if (!enemy || enemy.hp <= 0) return;
  planEnemyNextAction(state, enemy);
  checkArmingCondition(state, enemy, []);
  planEnemyNextAction(state, enemy);
  enemy.countdown = enemy.queueState === 'ARMED_RED' ? 1 : 2;
}

export function spawnEnemyEntity(enemyId, cell, facing = -1) {
  const def = ENEMIES[enemyId];
  if (!def) throw new Error(`Neznámý nepřítel: ${enemyId}`);
  const pool = (def.actionPool || []).map((tId) => {
    const tDef = ENEMY_TILES[tId];
    return {
      tileId: tId,
      maxCooldown: tDef?.cooldown ?? tDef?.delay ?? 2,
      currentCooldown: 0
    };
  });
  return {
    id: genEntityId(enemyId),
    kind: enemyId,
    entityType: 'enemy',
    name: def.name,
    givenName: def.givenName || def.name,
    epithet: def.epithet || '',
    bodyScale: def.bodyScale || (def.flying ? 'flyer' : def.isBoss ? 'boss' : 'human'),
    sprite: def.sprite,
    maxHp: def.maxHp,
    hp: def.maxHp,
    cell,
    facing,
    flying: Boolean(def.flying),
    ichor: getEntityIchorType(enemyId, 'enemy', def.name),
    frontShield: Boolean(def.frontShield),
    isElite: Boolean(def.isElite),
    isBoss: Boolean(def.isBoss),
    mirrorCloak: Boolean(def.mirrorCloak),
    bloodThorns: Boolean(def.bloodThorns),
    lordSynergy: Boolean(def.lordSynergy || def.corporateSynergy),
    enrageTile: def.enrageTile || null,
    enraged: false,
    archetype: def.archetype || 'fodder',
    comboCapacity: def.comboCapacity || (def.isBoss || def.isElite ? 3 : 2),
    queueState: 'EMPTY',
    actionQueue: [],
    actionPool: pool,
    nextAction: null,
    countdown: 2,
    statuses: {},
    bloodStains: [],
    flavor: def.flavor || ''
  };
}

export function spawnPropEntity(propType, cell) {
  const def = PROPS[propType] || PROPS.barrel;
  return {
    id: genEntityId(propType),
    kind: propType,
    entityType: 'prop',
    name: def.name,
    givenName:
      propType === 'barrel'
        ? 'Sud'
        : propType === 'holy_font'
          ? 'Kropenka'
          : propType === 'mirror'
            ? 'Zrcadlo'
            : def.name,
    epithet:
      propType === 'barrel'
        ? 'Kyselé zelí'
        : propType === 'holy_font'
          ? 'Svěcená voda'
          : propType === 'mirror'
            ? 'Pravda'
            : '',
    bodyScale: 'prop',
    sprite: def.icon,
    maxHp: def.maxHp,
    hp: def.maxHp,
    cell,
    facing: 1,
    flying: false,
    destructible: Boolean(def.destructible),
    reflectsProjectiles: Boolean(def.reflectsProjectiles),
    statuses: {}
  };
}

export function createBattleState(opts = {}) {
  const seed = opts.seed || 'VENCA-1899';
  const rng = opts.rng || createRng(seed);
  const enc = ENCOUNTERS[opts.encounterId || 'tutorial_1'] || ENCOUNTERS.tutorial_1;
  const curseLevel = Math.max(0, Math.min(5, Number(opts.curseLevel) || 0));
  const talismans = [...(opts.talismans || [])];
  const maxQueueSlots = talismans.includes('wet_kerchief') ? 4 : 3;
  const hunterId = opts.hunterId || opts.loadoutId || 'venca';
  const heroMaxHp =
    opts.heroMaxHp || (hunterId === 'dragoun' ? 24 : hunterId === 'zlodejka' ? 14 : 20);
  const heroHp = Math.min(heroMaxHp, opts.heroHp ?? heroMaxHp);

  const defaultDecks = {
    honza: [
      { id: 'flail_sweep', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'plum_bun', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'heavy_windup', upgradeLevel: 0, permanentCdReduction: 0 }
    ],
    dragoun: [
      { id: 'dragoon_sabre', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'dragoon_pistol', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'cavalry_parry', upgradeLevel: 0, permanentCdReduction: 0 }
    ],
    zlodejka: [
      { id: 'stiletto_stab', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'glass_shards', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'shadow_slip', upgradeLevel: 0, permanentCdReduction: 0 }
    ],
    venca: [
      { id: 'oak_stake', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'garlic_belch', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'holy_syringe', upgradeLevel: 0, permanentCdReduction: 0 }
    ]
  };

  const hand = (opts.deck || defaultDecks[hunterId] || defaultDecks.venca).map((card, idx) => {
    const def = getHeroTileDefinition(card.id, card.upgradeLevel || 0);
    const cdRed = card.permanentCdReduction || 0;
    return {
      ...def,
      instanceId: `tile_${idx}_${card.id}`,
      upgradeLevel: card.upgradeLevel || 0,
      permanentCdReduction: cdRed,
      maxCooldown: Math.max(1, def.cooldown - cdRed),
      currentCooldown: 0,
      inQueue: false
    };
  });

  const boardSize = enc.boardSize || 7;
  const terrain = Array.from({ length: boardSize }, () => ({ type: 'none' }));

  const hunterMeta = {
    honza: { name: 'Hloupý Honza', givenName: 'Honza', epithet: 'Selský silák' },
    dragoun: { name: 'Rittmeister Jaromír', givenName: 'Jaromír', epithet: 'Vysloužilý dragoun' },
    zlodejka: { name: 'Káča Pavučina', givenName: 'Káča', epithet: 'Úskočná zlodějka' },
    venca: { name: 'Venca Česnekáč', givenName: 'Venca', epithet: 'Česnekáč' },
    classic: { name: 'Venca Česnekáč', givenName: 'Venca', epithet: 'Česnekáč' }
  };
  const hInfo = hunterMeta[hunterId] || hunterMeta.venca;

  const hero = {
    id: `hero_${hunterId}`,
    kind: hunterId === 'classic' ? 'venca' : hunterId,
    hunterId: hunterId === 'classic' ? 'venca' : hunterId,
    entityType: 'hero',
    name: hInfo.name,
    givenName: hInfo.givenName,
    epithet: hInfo.epithet,
    bodyScale: 'hero',
    sprite:
      hunterId === 'honza'
        ? 'enemy.sedlak_stit'
        : hunterId === 'dragoun'
        ? 'enemy.halapartnik'
        : hunterId === 'zlodejka'
        ? 'enemy.vrhac_nozu'
        : 'hero.idle',
    maxHp: heroMaxHp,
    hp: heroHp,
    cell: enc.heroCell ?? 2,
    facing: enc.heroFacing ?? 1,
    flying: false,
    ichor: 'red',
    bumpCooldown: 0,
    statuses: {},
    bloodStains: []
  };

  const enemies = (enc.initialEnemies || []).map((spec) => {
    const ent = spawnEnemyEntity(spec.enemyId, spec.cell, spec.facing ?? -1);
    if (curseLevel >= 3 && (enc.isElite || ent.isElite)) {
      ent.statuses = ent.statuses || {};
      ent.statuses.shield = (ent.statuses.shield || 0) + 1;
    }
    if (
      curseLevel >= 5 &&
      (enc.isBoss || ent.id.includes('drakula') || ent.id.includes('dracula'))
    ) {
      ent.maxHp = Math.ceil(ent.maxHp * 1.25);
      ent.hp = ent.maxHp;
      ent.statuses = ent.statuses || {};
      ent.statuses.empower = (ent.statuses.empower || 0) + 1;
    }
    return ent;
  });

  const occupiedCells = new Set([hero.cell, ...enemies.map((e) => e.cell)]);
  const props = [];
  if (enc.props) {
    for (const pSpec of enc.props) {
      if (!occupiedCells.has(pSpec.cell)) {
        props.push(spawnPropEntity(pSpec.type, pSpec.cell));
        occupiedCells.add(pSpec.cell);
      }
    }
  }
  if (enc.terrain) {
    for (const tSpec of enc.terrain) {
      if (tSpec.cell >= 0 && tSpec.cell < boardSize) {
        terrain[tSpec.cell] = { type: tSpec.type, duration: tSpec.duration || 0 };
      }
    }
  }
  if (!enc.props && !enc.terrain) {
    const preset = rng.pick(TERRAIN_PRESETS);
    if (preset) {
      for (const pSpec of preset.props || []) {
        if (!occupiedCells.has(pSpec.cell)) {
          props.push(spawnPropEntity(pSpec.type, pSpec.cell));
          occupiedCells.add(pSpec.cell);
        }
      }
      for (const tSpec of preset.terrain || []) {
        if (tSpec.cell !== hero.cell && !occupiedCells.has(tSpec.cell)) {
          terrain[tSpec.cell] = { type: tSpec.type, duration: tSpec.duration || 0 };
        }
      }
    }
  }

  if (talismans.includes('garlic_braid')) {
    terrain[hero.cell] = { type: 'garlic_cloud', duration: 2 };
  }

  const reinforcements = (enc.reinforcements || []).map((r, idx) => ({
    id: `reinf_${idx}`,
    turnsRemaining: Math.max(1, r.turnDelay - (curseLevel >= 1 ? 1 : 0)),
    gateCell: r.gateCell,
    enemyId: r.enemyId,
    spawned: false
  }));

  const state = {
    seed,
    rng,
    encounterId: enc.id,
    encounterName: enc.name,
    boardSize,
    act: enc.act || 1,
    isTutorial: Boolean(enc.isTutorial),
    isElite: Boolean(enc.isElite),
    isBoss: Boolean(enc.isBoss),
    curseLevel,
    goldReward: enc.goldReward || 18,
    turn: 1,
    status: 'playing',
    maxQueueSlots,
    talismans,
    firstAttackUsed: false,
    lastTurnAspergillumTurn: -99,
    hero,
    enemies,
    props,
    terrain,
    hand,
    queue: [],
    reinforcements,
    cellBlood: {},
    log: [`⚔️ Bitva začíná: ${enc.name}! Venca si odplivl a pozvedl krucifix.`],
    stats: {
      turnsTaken: 0,
      damageDealt: 0,
      friendlyFireCount: 0,
      enemiesKilled: 0,
      combosExecuted: 0
    }
  };

  const initEvents = [];
  for (const ent of [state.hero, ...state.enemies, ...state.props]) {
    if (ent && ent.hp > 0) {
      triggerCellTerrainOnEnter(state, ent, ent.cell, initEvents);
    }
  }
  for (const ev of initEvents) {
    if (ev.type === 'log' && ev.text) {
      state.log.push(ev.text);
    }
  }

  refreshAllEnemyIntents(state);
  assertBoardInvariants(state);
  return state;
}

export function getSortedEnemiesByInitiative(state) {
  return state.enemies.filter((e) => e.hp > 0).sort((a, b) => a.cell - b.cell);
}

export const getLivingEnemiesLeftToRight = getSortedEnemiesByInitiative;
