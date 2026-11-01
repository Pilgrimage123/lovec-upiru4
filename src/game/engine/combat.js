// @ts-nocheck
import { ENEMY_TILES } from '../config/enemies.js';
import { STRINGS, czechTurns } from '../config/strings.cs.js';
import {
  isValidCell,
  getEntityAt,
  findNearestFreeCell,
  assertBoardInvariants,
  hasStatus,
  getStatusStacks,
  consumeStatus,
  addStatus,
  dealDamage,
  getHitBlockType,
  shouldApplySecondaryEffect,
  pushEntity,
  pullEntityTowardCell,
  triggerCellTerrainOnEnter,
  getEnemyStepBlockReason,
  formatBlockedStepLog,
  simulateLungeTargetCell,
  planEnemyNextAction,
  checkArmingCondition,
  refreshSingleEnemyIntent,
  spawnEnemyEntity,
  getSortedEnemiesByInitiative
} from './state.js';
import { applyResonances } from './combo.js';

export function computeHeroTileBonus(state, tile, slotIdx) {
  let dmgBonus = 0;
  if ((slotIdx === 2 || slotIdx === 3) && state.talismans?.includes('oak_splinter')) {
    dmgBonus += 1;
  }
  if (!state.firstAttackUsed && tile.type !== 'move' && state.talismans?.includes('brass_lantern')) {
    dmgBonus += 1;
  }
  if (hasStatus(state.hero, 'empower') && (tile.dmg > 0 || dmgBonus > 0)) {
    dmgBonus += getStatusStacks(state.hero, 'empower');
  }
  return { dmgBonus };
}

export function checkSvunkBonus(state, comboLength, events = []) {
  if (comboLength < 2) {
    delete state._livingEnemiesBeforeCombo;
    delete state._firstComboTileInstanceId;
    return false;
  }
  const livingNow = state.enemies.filter((e) => e.hp > 0).length;
  const before = state._livingEnemiesBeforeCombo ?? livingNow;
  const kills = Math.max(0, before - livingNow);
  delete state._livingEnemiesBeforeCombo;
  const firstTileId = state._firstComboTileInstanceId;
  delete state._firstComboTileInstanceId;

  if (kills <= 0) return false;

  const firstTile = (state.hand || []).find((t) => t.instanceId === firstTileId);
  if (!firstTile) return false;

  const reduction = comboLength;
  firstTile.currentCooldown = Math.max(0, firstTile.currentCooldown - reduction);
  events.push({
    type: 'svunk',
    instanceId: firstTile.instanceId,
    tileName: firstTile.name,
    reduction,
    newCooldown: firstTile.currentCooldown
  });
  events.push({
    type: 'log',
    text: `⚡ ŠVUNK! Padl upír v kombu – otevírací destička „${firstTile.name}“ chytila švunk a zkrátila Chladnutí o ${reduction} (zbývá: ${firstTile.currentCooldown})!`
  });
  return true;
}

export function checkMomentumBonus(state, comboLength, events = []) {
  return checkSvunkBonus(state, comboLength, events);
}

export function resolveEnemyStepOrIntentAction(state, enemy, action, events) {
  if (!action) return;
  if (action.type === 'turn') {
    enemy.facing = action.dir;
    events.push({ type: 'turn', entityId: enemy.id, facing: enemy.facing });
    events.push({
      type: 'log',
      text: `🔄 ${enemy.name} se otočil ${enemy.facing === 1 ? 'vpravo ▶' : 'vlevo ◀'}.`
    });
  } else if (action.type === 'step') {
    let dir = action.dir;
    if (hasStatus(enemy, 'confusion')) {
      consumeStatus(enemy, 'confusion', 1);
      dir = state.rng.nextFloat() < 0.5 ? -1 : 1;
      events.push({
        type: 'log',
        text: `🌀 Zmatený ${enemy.name} vrávorá náhodným směrem!`
      });
    }
    const targetCell = enemy.cell + dir;
    const blockReason = getEnemyStepBlockReason(state, enemy, targetCell);
    if (blockReason) {
      events.push({
        type: 'enemy_step_blocked',
        enemyId: enemy.id,
        from: enemy.cell,
        blockedCell: targetCell
      });
      events.push({ type: 'log', text: formatBlockedStepLog(enemy, targetCell, blockReason) });
    } else {
      const from = enemy.cell;
      enemy.cell = targetCell;
      events.push({ type: 'move', entityId: enemy.id, from, to: targetCell, facing: enemy.facing });
      events.push({ type: 'log', text: `👣 ${enemy.name} popošel na pole ${targetCell + 1}.` });
      triggerCellTerrainOnEnter(state, enemy, targetCell, events);
    }
  } else if (action.type === 'queue_tile') {
    const tileId = action.tileId;
    const def = ENEMY_TILES[tileId];
    enemy.actionQueue ||= [];
    enemy.actionQueue.push(tileId);
    enemy.queueState = 'QUEUING_GRAY';
    events.push({
      type: 'enemy_queue_tile',
      enemyId: enemy.id,
      tileId,
      tileName: def?.name || tileId,
      slotIndex: enemy.actionQueue.length - 1
    });
    events.push({
      type: 'log',
      text: `📥 ${enemy.name} připravil do komba „${def?.name || tileId}“ (slot #${enemy.actionQueue.length}).`
    });
  } else if (action.type === 'arm') {
    enemy.queueState = 'ARMED_RED';
    events.push({ type: 'enemy_armed', enemyId: enemy.id, cell: enemy.cell });
    events.push({
      type: 'log',
      text: `🚨 ${enemy.name} zčervenal. Máš ještě jednu normální akci, než odpálí kombo!`
    });
  }
}

export function resolveEnemyHitOnTarget(
  state,
  enemy,
  tileDef,
  patternStep,
  target,
  empowerBonus,
  garlicPenalty,
  events
) {
  const isFriendlyFire = target.entityType === 'enemy';
  const keyringBonus = isFriendlyFire && state.talismans?.includes('sexton_keyring') ? 1 : 0;
  const lordBonus =
    enemy.entityType === 'enemy' &&
    !enemy.lordSynergy &&
    state.enemies.some((e) => e.hp > 0 && e.lordSynergy && e.id !== enemy.id)
      ? 1
      : 0;
  const totalDmg = Math.max(
    0,
    (patternStep.dmg || 0) + empowerBonus - garlicPenalty + keyringBonus + lordBonus
  );

  let blockType = null;
  let dealt = 0;
  if (totalDmg > 0) {
    const beforeIdx = events.length;
    dealt = dealDamage(
      state,
      target,
      totalDmg,
      {
        type: 'direct',
        attackerId: enemy.id,
        attackerCell: enemy.cell,
        reason: tileDef.id
      },
      events
    );
    blockType = getHitBlockType(events, beforeIdx);
    if (tileDef.lifesteal && dealt > 0 && enemy.hp > 0) {
      const healed = Math.min(enemy.maxHp - enemy.hp, tileDef.lifesteal);
      if (healed > 0) {
        enemy.hp += healed;
        events.push({ type: 'heal', targetId: enemy.id, cell: enemy.cell, amount: healed });
      }
    }
  }

  if (!blockType && totalDmg > 0) {
    if (isFriendlyFire) {
      state.stats.friendlyFireCount = (state.stats.friendlyFireCount || 0) + 1;
      const quote = state.rng.pick(STRINGS.friendlyFireQuotes) || STRINGS.friendlyFireQuotes[0];
      events.push({
        type: 'friendly_fire',
        attackerId: enemy.id,
        attackerName: enemy.name,
        targetId: target.id,
        targetName: target.name,
        cell: target.cell,
        amount: dealt
      });
      events.push({
        type: 'log',
        text: `🧛‍♂️💥 FRIENDLY FIRE! ${enemy.name} zasáhl vlastního kumpána (${target.name})! ${quote}`
      });
    } else {
      events.push({
        type: 'log',
        text: `⚔️ ${enemy.name} zasáhl cíl ${target.name} akcí „${tileDef.name}“ (${dealt} DMG)!`
      });
    }
  }

  const pushDir = Math.sign(target.cell - enemy.cell) || enemy.facing;
  for (const eff of patternStep.effects || []) {
    if (target.hp <= 0) break;
    if (shouldApplySecondaryEffect(blockType, eff.type)) {
      if (eff.type === 'push') {
        pushEntity(state, target, pushDir, eff.distance || 1, events);
      } else if (eff.type === 'bleed') {
        addStatus(target, 'bleed', eff.amount || 2, events);
      } else if (eff.type === 'confusion') {
        addStatus(target, 'confusion', eff.amount || 1, events);
      } else if (eff.type === 'stun') {
        addStatus(target, 'stun', eff.amount || 1, events);
      }
    }
  }
}

export function executeEnemyQueuedTile(state, enemy, tileDef, events = []) {
  const hero = state.hero;
  events.push({
    type: 'enemy_action_start',
    enemyId: enemy.id,
    enemyName: enemy.name,
    cell: enemy.cell,
    tileId: tileDef.id,
    tileName: tileDef.name,
    tileType: tileDef.type
  });

  if (tileDef.type === 'otočení') {
    enemy.facing = Math.sign(hero.cell - enemy.cell) || enemy.facing;
    events.push({ type: 'turn', entityId: enemy.id, facing: enemy.facing });
    events.push({ type: 'log', text: `🔄 ${enemy.name} se otočil směrem k Vencovi.` });
    return;
  }

  if (tileDef.type === 'krok') {
    const faceDir = Math.sign(hero.cell - enemy.cell) || enemy.facing;
    enemy.facing = faceDir;
    events.push({ type: 'turn', entityId: enemy.id, facing: enemy.facing });
    let moveDir = faceDir;
    if (tileDef.retreatIfClose && Math.abs(hero.cell - enemy.cell) <= 1) {
      moveDir = -faceDir;
    }
    if (hasStatus(enemy, 'confusion')) {
      consumeStatus(enemy, 'confusion', 1);
      moveDir = state.rng.nextFloat() < 0.5 ? -1 : 1;
      events.push({ type: 'log', text: `🌀 Zmatený ${enemy.name} vrávorá náhodným směrem!` });
    }
    const targetCell = enemy.cell + moveDir;
    const blockReason = getEnemyStepBlockReason(state, enemy, targetCell);
    if (blockReason) {
      events.push({
        type: 'enemy_step_blocked',
        enemyId: enemy.id,
        from: enemy.cell,
        blockedCell: targetCell
      });
      events.push({ type: 'log', text: formatBlockedStepLog(enemy, targetCell, blockReason) });
      return;
    }
    const from = enemy.cell;
    enemy.cell = targetCell;
    events.push({ type: 'move', entityId: enemy.id, from, to: targetCell, facing: enemy.facing });
    triggerCellTerrainOnEnter(state, enemy, targetCell, events);
    return;
  }

  if (tileDef.type === 'nápřah' || tileDef.type === 'štít') {
    if (tileDef.selfEffect) {
      addStatus(enemy, tileDef.selfEffect.type, tileDef.selfEffect.amount || 1, events);
    }
    events.push({ type: 'log', text: `💢 ${enemy.name} použil „${tileDef.name}“!` });
    return;
  }

  if (tileDef.type === 'léčení' && tileDef.supportAllies) {
    const allies = state.enemies.filter((e) => e.hp > 0 && e.id !== enemy.id);
    const target =
      allies.length > 0
        ? allies.sort((a, b) => Math.abs(a.cell - enemy.cell) - Math.abs(b.cell - enemy.cell))[0]
        : enemy;
    const healAmt = tileDef.healAmount || 1;
    const prevHp = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + healAmt);
    const actualHealed = target.hp - prevHp;
    if (actualHealed > 0) {
      events.push({ type: 'heal', targetId: target.id, cell: target.cell, amount: actualHealed });
    }
    if (tileDef.empowerAmount) {
      addStatus(target, 'empower', tileDef.empowerAmount, events);
    }
    events.push({
      type: 'log',
      text: `💉 ${enemy.name} provedla „${tileDef.name}“ na postavu ${target.name} (+${actualHealed} HP, +Zesílení)!`
    });
    return;
  }

  if (tileDef.summonEnemyId) {
    const freeGate = [0, (state.boardSize || 7) - 1].find((c) => !getEntityAt(state, c));
    if (freeGate !== undefined) {
      const facing = freeGate === 0 ? 1 : -1;
      const spawned = spawnEnemyEntity(tileDef.summonEnemyId, freeGate, facing);
      state.enemies.push(spawned);
      triggerCellTerrainOnEnter(state, spawned, freeGate, events);
      if (spawned.hp > 0) refreshSingleEnemyIntent(state, spawned);
      events.push({ type: 'spawn', enemy: structuredClone(spawned), cell: freeGate });
      events.push({
        type: 'log',
        text: `🦇 ${enemy.name} přivolal posilu: ${spawned.name} na bráně ${freeGate + 1}!`
      });
    }
    if (!tileDef.pattern || tileDef.pattern.length === 0) return;
  }

  if (tileDef.spawnSpikesAtHero && hero?.hp > 0 && isValidCell(hero.cell, state)) {
    state.terrain[hero.cell] = { type: 'spikes' };
    events.push({ type: 'terrain_spawn', terrainType: 'spikes', cell: hero.cell });
    events.push({
      type: 'log',
      text: `🗡️ ${enemy.name} nechal vyrazit kůly přímo pod Vencou (pole ${hero.cell + 1})!`
    });
    if (!hero.flying) {
      dealDamage(
        state,
        hero,
        4,
        { reason: 'spikes', attackerId: enemy.id, attackerCell: enemy.cell, type: 'terrain' },
        events
      );
      if (hero.hp <= 0) return;
    }
  }

  if (tileDef.lungeForward) {
    const dest = simulateLungeTargetCell(state, enemy, enemy.cell, enemy.facing, tileDef.lungeForward);
    while (enemy.cell !== dest && enemy.hp > 0) {
      const next = enemy.cell + enemy.facing;
      const from = enemy.cell;
      enemy.cell = next;
      events.push({ type: 'move', entityId: enemy.id, from, to: next, facing: enemy.facing });
      triggerCellTerrainOnEnter(state, enemy, next, events);
    }
    if (enemy.hp <= 0) return;
  }

  const garlicPenalty = state.terrain[enemy.cell]?.type === 'garlic_cloud' ? 1 : 0;
  const empowerBonus = getStatusStacks(enemy, 'empower');

  if (tileDef.projectileRange) {
    let hitTarget = null;
    let hitStep = null;
    let endCell = enemy.cell;
    for (const p of tileDef.pattern || []) {
      const c = enemy.cell + enemy.facing * p.offset;
      if (!isValidCell(c, state)) break;
      endCell = c;
      const ent = getEntityAt(state, c);
      if (ent && ent.id !== enemy.id) {
        hitTarget = ent;
        hitStep = p;
        break;
      }
    }
    events.push({
      type: 'enemy_projectile_vfx',
      enemyId: enemy.id,
      from: enemy.cell,
      to: endCell,
      facing: enemy.facing
    });

    if (hitTarget && (hitTarget.kind === 'mirror' || hitTarget.reflectsProjectiles)) {
      events.push({
        type: 'projectile_reflect',
        mirrorId: hitTarget.id,
        cell: endCell,
        fromFacing: enemy.facing,
        toFacing: -enemy.facing,
        tileId: tileDef.id
      });
      events.push({
        type: 'log',
        text: `🪞 Hradní zrcadlo pravdy odrazilo nepřátelskou střelu „${tileDef.name}“ o 180° zpět!`
      });
      const reflDir = -enemy.facing;
      let reflTarget = null;
      let reflEndCell = endCell;
      for (let dist = 1; dist <= (tileDef.projectileRange || 4); dist++) {
        const c = endCell + reflDir * dist;
        if (!isValidCell(c, state)) break;
        reflEndCell = c;
        const ent = getEntityAt(state, c);
        if (ent && ent.id !== hitTarget.id) {
          reflTarget = ent;
          break;
        }
      }
      events.push({
        type: 'enemy_projectile_vfx',
        enemyId: enemy.id,
        from: endCell,
        to: reflEndCell,
        facing: reflDir,
        reflected: true
      });
      if (reflTarget && hitStep) {
        resolveEnemyHitOnTarget(
          state,
          enemy,
          tileDef,
          hitStep,
          reflTarget,
          empowerBonus,
          garlicPenalty,
          events
        );
      } else {
        events.push({ type: 'log', text: '💨 Odražená střela nikoho nezasáhla.' });
      }
    } else if (hitTarget && hitStep) {
      resolveEnemyHitOnTarget(
        state,
        enemy,
        tileDef,
        hitStep,
        hitTarget,
        empowerBonus,
        garlicPenalty,
        events
      );
    } else {
      events.push({
        type: 'log',
        text: `💨 ${enemy.name} vystřelil „${tileDef.name}“, ale trefil jen holou zeď.`
      });
    }
  } else {
    let hitAny = false;
    const hitIds = new Set();
    for (const p of tileDef.pattern || []) {
      const c = enemy.cell + enemy.facing * p.offset;
      if (!isValidCell(c, state)) continue;
      events.push({ type: 'enemy_strike_vfx', enemyId: enemy.id, from: enemy.cell, cell: c });
      const ent = getEntityAt(state, c);
      if (ent && ent.id !== enemy.id && !hitIds.has(ent.id)) {
        hitAny = true;
        hitIds.add(ent.id);
        resolveEnemyHitOnTarget(
          state,
          enemy,
          tileDef,
          p,
          ent,
          empowerBonus,
          garlicPenalty,
          events
        );
      }
    }
    if (!hitAny && (tileDef.pattern || []).length > 0) {
      events.push({
        type: 'log',
        text: `💨 ${enemy.name} promáchl akcí „${tileDef.name}“ do prázdna!`
      });
    }
  }

  if (enemy.statuses?.empower) {
    delete enemy.statuses.empower;
  }
}

export function computeEnemyQueueTargetedCells(state, enemy) {
  if (!enemy || !enemy.actionQueue || enemy.actionQueue.length === 0) return [];
  const cells = new Set();
  let curCell = enemy.cell;
  const facing = enemy.facing;
  for (const tileId of enemy.actionQueue) {
    const def = ENEMY_TILES[tileId];
    if (!def) continue;
    let origin = curCell;
    if (def.lungeForward) {
      const dest = simulateLungeTargetCell(state, enemy, curCell, facing, def.lungeForward);
      if (dest !== curCell) {
        origin = dest;
        curCell = dest;
      }
    }
    if (def.projectileRange) {
      for (const p of def.pattern || []) {
        const c = origin + facing * p.offset;
        if (!isValidCell(c, state)) break;
        cells.add(c);
        const blocker = getEntityAt(state, c);
        if (blocker && blocker.id !== enemy.id) break;
      }
    } else {
      for (const p of def.pattern || []) {
        const c = origin + facing * p.offset;
        if (isValidCell(c, state)) cells.add(c);
      }
    }
  }
  return Array.from(cells).sort((a, b) => a - b);
}

export function resolveEnemyPhase(state, events = []) {
  if (!state.hero || state.hero.hp <= 0) return events;
  const enemies = getSortedEnemiesByInitiative(state);
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || state.hero.hp <= 0) continue;
    if (hasStatus(enemy, 'stun')) {
      consumeStatus(enemy, 'stun', 1);
      events.push({
        type: 'enemy_stun_skipped',
        enemyId: enemy.id,
        enemyName: enemy.name,
        cell: enemy.cell
      });
      events.push({
        type: 'log',
        text: `🔔 ${enemy.name} je omráčený a vynechává akci!`
      });
    } else {
      if (!enemy.nextAction && enemy.queueState !== 'ARMED_RED') {
        planEnemyNextAction(state, enemy);
        checkArmingCondition(state, enemy, []);
      }
      if (enemy.actionPool) {
        for (const p of enemy.actionPool) {
          if (!enemy.actionQueue?.includes(p.tileId) && p.currentCooldown > 0) {
            p.currentCooldown = Math.max(0, p.currentCooldown - 1);
          }
        }
      }
      if (
        (enemy.queueState === 'ARMED_RED' || enemy.countdown <= 1) &&
        (enemy.actionQueue || []).length > 0
      ) {
        const targetedCells = computeEnemyQueueTargetedCells(state, enemy);
        events.push({
          type: 'enemy_queue_firing',
          enemyId: enemy.id,
          enemyName: enemy.name,
          cell: enemy.cell,
          queue: [...enemy.actionQueue],
          targetedCells
        });
        if (enemy.hp > 0 && !hasStatus(enemy, 'stun')) {
          events.push({
            type: 'enemy_queue_execution_start',
            enemyId: enemy.id,
            enemyName: enemy.name,
            cell: enemy.cell,
            queue: [...enemy.actionQueue]
          });
          events.push({
            type: 'log',
            text: `⚡ ${enemy.name} odpálil celou frontu akcí (${enemy.actionQueue.length} ${enemy.actionQueue.length === 1 ? 'destička' : 'destičky'})!`
          });
          const queueCopy = [...enemy.actionQueue];
          for (const tileId of queueCopy) {
            if (enemy.hp <= 0 || state.hero.hp <= 0) break;
            const def = ENEMY_TILES[tileId];
            if (def) {
              executeEnemyQueuedTile(state, enemy, def, events);
              const poolEntry = enemy.actionPool?.find((p) => p.tileId === tileId);
              if (poolEntry) poolEntry.currentCooldown = poolEntry.maxCooldown;
            }
          }
        } else if (enemy.hp <= 0) {
          events.push({
            type: 'log',
            text: `💀 ${enemy.name} byl zlikvidován reakcí ještě před provedením své fronty!`
          });
        }
        enemy.actionQueue = [];
        enemy.queueState = 'EMPTY';
      } else if (enemy.nextAction) {
        resolveEnemyStepOrIntentAction(state, enemy, enemy.nextAction, events);
      }

      if (enemy.hp > 0 && state.hero.hp > 0) {
        checkArmingCondition(state, enemy, events);
        planEnemyNextAction(state, enemy);
        enemy.countdown = enemy.queueState === 'ARMED_RED' ? 1 : 2;
      }
    }
  }
  assertBoardInvariants(state);
  return events;
}

export function resolveHeroHitOnTarget(
  state,
  tile,
  patternStep,
  target,
  bonusInfo,
  comboLength,
  events
) {
  const hero = state.hero;
  const pushDir = Math.sign(target.cell - hero.cell) || hero.facing;
  const isBackstab = Boolean(
    patternStep.backstabDmg && target.entityType === 'enemy' && target.facing === hero.facing
  );
  const baseDmg = isBackstab ? patternStep.backstabDmg : patternStep.dmg || 0;
  if (isBackstab) {
    events.push({
      type: 'log',
      text: `🗡️ Zákeřný bod ze zálohy do zad postavy ${target.name} (${patternStep.backstabDmg} DMG)!`
    });
  }
  const totalDmg = Math.max(0, baseDmg + bonusInfo.dmgBonus);
  let blockType = null;
  if (totalDmg > 0) {
    const beforeIdx = events.length;
    const dealt = dealDamage(
      state,
      target,
      totalDmg,
      {
        type: 'direct',
        attackerId: hero.id,
        attackerCell: hero.cell,
        isComboHit: comboLength >= 2,
        reason: tile.id
      },
      events
    );
    blockType = getHitBlockType(events, beforeIdx);
    state.stats.damageDealt = (state.stats.damageDealt || 0) + dealt;
  }

  const allEffects = [
    ...(patternStep.effects || []),
    ...(isBackstab && patternStep.backstabEffects ? patternStep.backstabEffects : [])
  ];
  for (const eff of allEffects) {
    if (target.hp <= 0) break;
    if (shouldApplySecondaryEffect(blockType, eff.type)) {
      switch (eff.type) {
        case 'push': {
          const bonusPush = state.comboResonanceBonusPush || 0;
          pushEntity(state, target, pushDir, (eff.distance || 1) + bonusPush, events);
          break;
        }
        case 'dispel_empower':
          if (target.statuses?.empower) {
            delete target.statuses.empower;
            events.push({ type: 'status_cleared', targetId: target.id, status: 'empower' });
            events.push({
              type: 'log',
              text: `🧄 ${target.name} ztratil Zesílení (česnek mu vzal sílu)!`
            });
          }
          break;
        case 'pull':
          pullEntityTowardCell(state, target, hero.cell, events);
          break;
        case 'flip_target':
          if (target.entityType === 'enemy') {
            target.facing = -target.facing;
            events.push({ type: 'turn', entityId: target.id, facing: target.facing });
            events.push({
              type: 'log',
              text: `🔄 ${target.name} byl otočen čelem vzad!`
            });
          }
          break;
        case 'stun':
          addStatus(target, 'stun', eff.amount || 1, events);
          break;
        case 'bleed':
          addStatus(target, 'bleed', eff.amount || 2, events);
          break;
        case 'confusion':
          addStatus(target, 'confusion', eff.amount || 1, events);
          break;
      }
    }
  }
}

export function executeHeroTileEffect(state, tile, slotIdx, comboLength, events = []) {
  if (!state.hero || state.hero.hp <= 0 || !tile) return;
  const bonusInfo = computeHeroTileBonus(state, tile, slotIdx);
  const hero = state.hero;
  const prevEmpower = hero.statuses?.empower || 0;

  events.push({
    type: 'tile_start',
    tileId: tile.id,
    instanceId: tile.instanceId,
    tileName: tile.name,
    slotIndex: slotIdx,
    heroId: hero.id,
    isStrike: tile.type === 'attack' || (tile.dmg || 0) > 0
  });

  if (tile.selfEffect) {
    addStatus(hero, tile.selfEffect.type, tile.selfEffect.amount || 1, events);
  }

  if (tile.healAmount) {
    const missing = (hero.maxHp || 20) - hero.hp;
    const healed = Math.min(tile.healAmount, missing);
    if (healed > 0) {
      hero.hp += healed;
      events.push({ type: 'heal', targetId: hero.id, amount: healed, hp: hero.hp });
      events.push({
        type: 'log',
        text: `🥟 ${hero.name} si zakousl do buchty a vyléčil se o ${healed} HP!`
      });
    }
    const overflow = tile.healAmount - healed;
    if (overflow > 0) {
      addStatus(hero, 'shield', overflow, events);
      events.push({
        type: 'log',
        text: `🛡️ Zbytek buchty dodal postavě ${hero.name} +${overflow} Štítu!`
      });
    }
  }

  if (tile.shieldAmount) {
    addStatus(hero, 'shield', tile.shieldAmount, events);
    events.push({ type: 'log', text: `🛡️ ${hero.name} získal +${tile.shieldAmount} Štítu!` });
  }

  if (tile.cureStatus && hero.statuses?.[tile.cureStatus]) {
    delete hero.statuses[tile.cureStatus];
    events.push({ type: 'status_cleared', targetId: hero.id, status: tile.cureStatus });
    events.push({ type: 'log', text: `✨ ${hero.name} se zbavil stavu ${tile.cureStatus}!` });
  }

  if (tile.leapDistance) {
    const fromCell = hero.cell;
    if (tile.leaveGarlicCloud) {
      state.terrain[fromCell] = { type: 'garlic_cloud', duration: 2 };
      events.push({ type: 'terrain_spawn', terrainType: 'garlic_cloud', cell: fromCell });
      events.push({
        type: 'log',
        text: `🧄 Venca zanechal na poli ${fromCell + 1} štiplavý Česnekový oblak!`
      });
    }
    const dest = findNearestFreeCell(
      state,
      hero.cell + hero.facing * tile.leapDistance,
      hero.facing,
      hero.id
    );
    if (dest !== null && dest !== hero.cell) {
      hero.cell = dest;
      events.push({ type: 'leap', entityId: hero.id, from: fromCell, to: dest });
      events.push({
        type: 'log',
        text: `🤸 ${tile.name}: Venca přeskočil z pole ${fromCell + 1} na pole ${dest + 1}!`
      });
      triggerCellTerrainOnEnter(state, hero, dest, events);
      if (state.talismans?.includes('beer_frog')) {
        const dir = Math.sign(dest - fromCell);
        let jumpedOverSomething = false;
        if (dir) {
          for (let c = fromCell + dir; c !== dest; c += dir) {
            if (getEntityAt(state, c)) {
              jumpedOverSomething = true;
              break;
            }
          }
        }
        if (jumpedOverSomething) {
          addStatus(hero, 'shield', 1, events);
          events.push({
            type: 'log',
            text: '🐸 Pivní žába: Venca získal po přemetu Štít!'
          });
        }
      }
    }
  } else if (tile.stepBackward && hero.hp > 0) {
    const dest = hero.cell - hero.facing * tile.stepBackward;
    if (isValidCell(dest, state) && !getEntityAt(state, dest)) {
      const from = hero.cell;
      hero.cell = dest;
      events.push({ type: 'step', entityId: hero.id, from, to: dest, facing: hero.facing });
      events.push({
        type: 'log',
        text: `🏃 ${tile.name}: Venca uskočil z pole ${from + 1} vzad na pole ${dest + 1}!`
      });
      triggerCellTerrainOnEnter(state, hero, dest, events);
    } else {
      events.push({ type: 'log', text: `🚫 ${tile.name}: Pole za Vencou je zablokováno!` });
    }
  } else if (tile.projectileRange) {
    let hitTarget = null;
    let hitStep = null;
    let endCell = null;
    for (const p of tile.pattern || []) {
      const c = hero.cell + hero.facing * p.offset;
      if (!isValidCell(c, state)) break;
      endCell = c;
      const ent = getEntityAt(state, c);
      if (ent && ent.id !== hero.id) {
        hitTarget = ent;
        hitStep = p;
        break;
      }
    }
    events.push({
      type: 'projectile_vfx',
      from: hero.cell,
      to: endCell ?? hero.cell,
      facing: hero.facing,
      tileId: tile.id
    });

    if (hitTarget && (hitTarget.kind === 'mirror' || hitTarget.reflectsProjectiles)) {
      events.push({
        type: 'projectile_reflect',
        mirrorId: hitTarget.id,
        cell: endCell,
        fromFacing: hero.facing,
        toFacing: -hero.facing,
        tileId: tile.id
      });
      events.push({
        type: 'log',
        text: `🪞 Hradní zrcadlo pravdy odrazilo střelu „${tile.name}“ o 180° zpět!`
      });
      const reflDir = -hero.facing;
      let reflTarget = null;
      let reflEndCell = endCell;
      for (let dist = 1; dist <= (tile.projectileRange || 4); dist++) {
        const c = endCell + reflDir * dist;
        if (!isValidCell(c, state)) break;
        reflEndCell = c;
        const ent = getEntityAt(state, c);
        if (ent && ent.id !== hitTarget.id) {
          reflTarget = ent;
          break;
        }
      }
      events.push({
        type: 'projectile_vfx',
        from: endCell,
        to: reflEndCell,
        facing: reflDir,
        tileId: tile.id,
        reflected: true
      });
      if (reflTarget && hitStep) {
        resolveHeroHitOnTarget(state, tile, hitStep, reflTarget, bonusInfo, comboLength, events);
      } else {
        events.push({
          type: 'log',
          text: '💨 Odražená střela prolétla chodbou a nikoho nezasáhla.'
        });
      }
    } else if (hitTarget && hitStep) {
      resolveHeroHitOnTarget(state, tile, hitStep, hitTarget, bonusInfo, comboLength, events);
    } else {
      events.push({ type: 'tile_whiff', tileId: tile.id, cell: endCell ?? hero.cell });
      events.push({
        type: 'log',
        text: `💨 ${tile.name} prolétla prázdnou chodbou naprázdno.`
      });
    }
  } else {
    let hitAny = false;
    const hitIds = new Set();
    for (const p of tile.pattern || []) {
      const c = hero.cell + hero.facing * p.offset;
      if (!isValidCell(c, state)) continue;
      events.push({ type: 'strike_vfx', from: hero.cell, cell: c, tileId: tile.id });
      for (const eff of p.effects || []) {
        if (eff.type === 'spawn_spikes') {
          state.terrain[c] = { type: 'spikes' };
          events.push({ type: 'terrain_spawn', terrainType: 'spikes', cell: c });
          events.push({
            type: 'log',
            text: `🗡️ Z podlahy na poli ${c + 1} vyrazily naostřené kůly!`
          });
        } else if (eff.type === 'spawn_garlic_target') {
          state.terrain[c] = { type: 'garlic_cloud', duration: 2 };
          events.push({ type: 'terrain_spawn', terrainType: 'garlic_cloud', cell: c });
        }
      }
      const ent = getEntityAt(state, c);
      if (ent && ent.id !== hero.id && !hitIds.has(ent.id)) {
        hitAny = true;
        hitIds.add(ent.id);
        resolveHeroHitOnTarget(state, tile, p, ent, bonusInfo, comboLength, events);
      }
    }
    if (!hitAny && (tile.pattern || []).length > 0) {
      events.push({ type: 'tile_whiff', tileId: tile.id, cell: hero.cell + hero.facing });
      events.push({ type: 'log', text: `💨 ${tile.name} promáchla do prázdného vzduchu.` });
    }
  }

  if (
    !tile.leapDistance &&
    ((tile.dmg || 0) > 0 ||
      bonusInfo.dmgBonus > 0 ||
      (tile.pattern || []).some((p) => (p.dmg || 0) > 0))
  ) {
    state.firstAttackUsed = true;
    if (prevEmpower > 0 && ((tile.dmg || 0) > 0 || bonusInfo.dmgBonus > prevEmpower) && hero.statuses?.empower) {
      const rem = hero.statuses.empower - prevEmpower;
      if (rem > 0) hero.statuses.empower = rem;
      else delete hero.statuses.empower;
    }
  }

  if (tile.selfFlipAfter && hero.hp > 0) {
    hero.facing = -hero.facing;
    events.push({ type: 'turn', entityId: hero.id, facing: hero.facing, free: true });
    events.push({
      type: 'log',
      text: `🔄 Venca se po ráně otočil čelem ${hero.facing === 1 ? 'vpravo ▶' : 'vlevo ◀'}.`
    });
  }

  assertBoardInvariants(state);
}

export function processReinforcements(state, events = []) {
  if (!state.reinforcements || state.reinforcements.length === 0) return events;
  for (const r of state.reinforcements) {
    if (!r.spawned) {
      r.turnsRemaining = Math.max(0, r.turnsRemaining - 1);
      if (r.turnsRemaining <= 0) {
        const gateCell = r.gateCell === 0 ? 0 : (state.boardSize || 7) - 1;
        if (getEntityAt(state, gateCell)) {
          r.turnsRemaining = 1;
          events.push({ type: 'spawn_delayed', gateCell, enemyId: r.enemyId });
          events.push({
            type: 'log',
            text: `🚪 Brána na poli ${gateCell + 1} je ucpaná! Posila se opožďuje o 1 tah.`
          });
        } else {
          r.spawned = true;
          const facing = gateCell === 0 ? 1 : -1;
          const spawned = spawnEnemyEntity(r.enemyId, gateCell, facing);
          state.enemies.push(spawned);
          triggerCellTerrainOnEnter(state, spawned, gateCell, events);
          if (spawned.hp > 0) refreshSingleEnemyIntent(state, spawned);
          events.push({ type: 'spawn', enemy: structuredClone(spawned), cell: gateCell });
          events.push({
            type: 'log',
            text: `🚪 Z brány na poli ${gateCell + 1} vtrhla na bojiště posila: ${spawned.name}!`
          });
        }
      }
    }
  }
  assertBoardInvariants(state);
  return events;
}

export function checkBattleEnd(state, events = []) {
  if (state.hero.hp <= 0) {
    state.status = 'lost';
    events.push({ type: 'battle_lost' });
    return 'lost';
  }
  const anyLivingEnemies = state.enemies.some((e) => e.hp > 0);
  const anyPendingReinforcements = state.reinforcements.some((r) => !r.spawned);
  if (!anyLivingEnemies && !anyPendingReinforcements) {
    state.status = 'won';
    events.push({ type: 'battle_won' });
    return 'won';
  }
  return 'playing';
}

export function consumeHeroStunIfPresent(state) {
  const hero = state?.hero;
  if (!hero || hero.hp <= 0 || !(hero.statuses?.stun > 0)) return null;
  hero.statuses.stun -= 1;
  if (hero.statuses.stun <= 0) delete hero.statuses.stun;
  return {
    ok: true,
    stunned: true,
    events: [
      { type: 'hero_stun_skipped', targetId: hero.id, cell: hero.cell },
      { type: 'log', text: '🔔 Venca je omráčený a vynechává akci!' }
    ]
  };
}

export function advanceTurnAfterPlayerAction(state, events = [], extraCdReduction = 0) {
  state.stats.turnsTaken = (state.stats.turnsTaken || 0) + 1;
  const cdTick = 1 + extraCdReduction;
  for (const tile of state.hand) {
    if (!tile.inQueue && tile.currentCooldown > 0) {
      if (tile.justPlayedInCombo) {
        delete tile.justPlayedInCombo;
        continue;
      }
      tile.currentCooldown = Math.max(0, tile.currentCooldown - cdTick);
    }
  }
  if (state.hero && (state.hero.bumpCooldown || 0) > 0) {
    if (state.hero.justBumpedThisTurn) {
      delete state.hero.justBumpedThisTurn;
    } else {
      state.hero.bumpCooldown = Math.max(0, state.hero.bumpCooldown - cdTick);
    }
  }

  if (checkBattleEnd(state, events) !== 'playing') return events;
  resolveEnemyPhase(state, events);
  if (checkBattleEnd(state, events) !== 'playing') return events;

  const actors = [state.hero, ...state.enemies.filter((e) => e.hp > 0)];
  for (const ent of actors) {
    if (ent.hp > 0 && hasStatus(ent, 'bleed')) {
      events.push({ type: 'log', text: `🩸 ${ent.name} krvácí (1 DMG).` });
      dealDamage(state, ent, 1, { reason: 'bleed' }, events);
      consumeStatus(ent, 'bleed', 1);
    }
  }
  if (checkBattleEnd(state, events) !== 'playing') return events;

  // 1. All leftover shield completely expires at the end of the enemy round
  for (const ent of actors) {
    if (ent.hp > 0 && ent.statuses?.shield > 0) {
      const expired = ent.statuses.shield;
      delete ent.statuses.shield;
      delete ent.statuses.shieldTurnsLeft;
      events.push({ type: 'shield_expired', targetId: ent.id, cell: ent.cell, amount: expired });
    }
  }

  // 2. Next round begins: All actors with Defense receive their fresh Shield
  for (const ent of actors) {
    if (ent.hp > 0 && (ent.defense || 0) > 0) {
      ent.statuses = ent.statuses || {};
      ent.statuses.shield = ent.defense;
      events.push({ type: 'shield_granted', targetId: ent.id, cell: ent.cell, amount: ent.defense });
    }
  }

  for (let i = 0; i < state.terrain.length; i++) {
    const terr = state.terrain[i];
    if (terr && terr.type === 'garlic_cloud' && typeof terr.duration === 'number') {
      terr.duration -= 1;
      if (terr.duration <= 0) {
        state.terrain[i] = { type: 'none' };
        events.push({ type: 'terrain_expire', terrainType: 'garlic_cloud', cell: i });
      }
    }
  }

  processReinforcements(state, events);
  state.turn += 1;
  checkBattleEnd(state, events);
  assertBoardInvariants(state);
  return events;
}

export function resolveHeroBump(state, hero, enemy, dir, targetCell, hunterId, events) {
  hero.justBumpedThisTurn = true;
  events.push({
    type: 'hero_bump',
    hunterId,
    targetId: enemy.id,
    cell: targetCell,
    dir
  });
  if (hunterId === 'honza') {
    hero.bumpCooldown = 3;
    pushEntity(state, enemy, dir, 1, events);
    const from = hero.cell;
    hero.cell = targetCell;
    events.push({ type: 'move', entityId: hero.id, from, to: targetCell, facing: hero.facing });
    triggerCellTerrainOnEnter(state, hero, targetCell, events);
    dealDamage(state, enemy, 2, { reason: 'honza_bump', attackerId: hero.id }, events);
    events.push({
      type: 'log',
      text: `🔨 Selský beran! Honza vrazil do ${enemy.name} plnou vahou (2 DMG), odhodil ho a obsadil jeho pole!`
    });
  } else if (hunterId === 'dragoun') {
    hero.bumpCooldown = 3;
    dealDamage(state, enemy, 2, { reason: 'dragoon_bump', attackerId: hero.id }, events);
    pushEntity(state, enemy, dir, 1, events);
    addStatus(enemy, 'stun', 1, events);
    events.push({
      type: 'log',
      text: `⚔️ Úder těžkým jílcem! Rittmeister Jaromír udeřil ${enemy.name} mosazným jílcem (2 DMG), odhodil ho a omráčil!`
    });
  } else if (hunterId === 'zlodejka') {
    hero.bumpCooldown = 2;
    const from = hero.cell;
    hero.cell = targetCell;
    enemy.cell = from;
    enemy.facing = dir;
    events.push({
      type: 'swap',
      heroFrom: from,
      heroTo: targetCell,
      enemyId: enemy.id,
      enemyFrom: targetCell,
      enemyTo: from
    });
    triggerCellTerrainOnEnter(state, hero, targetCell, events);
    triggerCellTerrainOnEnter(state, enemy, from, events);
    events.push({
      type: 'log',
      text: `🧤 Kapsářská záměna! Káča Pavučina podklouzla ${enemy.name} pod nohama, prohodila si s ním místo a otočila ho zády k sobě!`
    });
  } else {
    hero.bumpCooldown = 3;
    pushEntity(state, enemy, dir, 1, events);
    state.terrain[enemy.cell] = { type: 'garlic_cloud', duration: 2 };
    events.push({ type: 'terrain_spawn', terrainType: 'garlic_cloud', cell: enemy.cell });
    events.push({
      type: 'log',
      text: `🧄 Česnekové žduchnutí! Venca vrazil do ${enemy.name} česnekovým pupkem, odhodil ho a zamořil jeho pole česnekem!`
    });
  }
}

export function stepHero(state, direction) {
  const events = [];
  if (state.status !== 'playing' || state.hero.hp <= 0) return { ok: false, events };
  const stunRes = consumeHeroStunIfPresent(state);
  if (stunRes) return stunRes;

  let dir = Math.sign(direction);
  if (!dir) return { ok: false, events };
  const hero = state.hero;
  const confused = hasStatus(hero, 'confusion');
  if (confused) {
    dir = state.rng.nextFloat() < 0.5 ? -1 : 1;
    consumeStatus(hero, 'confusion', 1);
    events.push({
      type: 'log',
      text: '🌀 Venca má v hlavě motolici a vykročil náhodným směrem!'
    });
  }

  const targetCell = hero.cell + dir;
  if (!isValidCell(targetCell, state)) {
    if (confused) {
      events.push({
        type: 'log',
        text: '🧱 Zmatený Venca narazil do hradní zdi a ztratil tah.'
      });
      return { ok: true, events };
    }
    events.push({ type: 'invalid_action', reason: 'Tam už je hradní zeď!' });
    return { ok: false, events };
  }

  const occupant = getEntityAt(state, targetCell);
  if (!occupant) {
    const from = hero.cell;
    hero.cell = targetCell;
    events.push({ type: 'move', entityId: hero.id, from, to: targetCell, facing: hero.facing });
    events.push({ type: 'log', text: `👣 Venca popošel na pole ${targetCell + 1}.` });
    triggerCellTerrainOnEnter(state, hero, targetCell, events);
  } else if (occupant.entityType === 'enemy') {
    if ((hero.bumpCooldown || 0) > 0) {
      events.push({
        type: 'invalid_action',
        reason: `Manévr nárazu ještě chladne (zbývá ${hero.bumpCooldown} ${czechTurns(hero.bumpCooldown)})!`
      });
      return { ok: false, events };
    }
    const hunterId = hero.hunterId || hero.kind || 'venca';
    resolveHeroBump(state, hero, occupant, dir, targetCell, hunterId, events);
  } else if (confused) {
    events.push({
      type: 'log',
      text: '🧱 Zmatený Venca se zamotal do překážky a ztratil tah.'
    });
    return { ok: true, events };
  } else {
    events.push({
      type: 'invalid_action',
      reason: 'Pole je obsazené – krokem se přes nikoho nedá přeskočit!'
    });
    return { ok: false, events };
  }

  assertBoardInvariants(state);
  return { ok: true, events };
}

export function turnHero(state) {
  const events = [];
  if (state.status !== 'playing' || state.hero.hp <= 0) return { ok: false, events };
  const stunRes = consumeHeroStunIfPresent(state);
  if (stunRes) return stunRes;

  const hero = state.hero;
  hero.facing = -hero.facing;
  const inGarlic = state.terrain[hero.cell]?.type === 'garlic_cloud';
  events.push({ type: 'turn', entityId: hero.id, facing: hero.facing, free: inGarlic });

  if (
    state.talismans?.includes('holy_aspergillum') &&
    state.turn - (state.lastTurnAspergillumTurn ?? -99) >= 2
  ) {
    const frontEnt = getEntityAt(state, hero.cell + hero.facing);
    if (frontEnt && frontEnt.entityType === 'enemy') {
      state.lastTurnAspergillumTurn = state.turn;
      dealDamage(
        state,
        frontEnt,
        1,
        {
          type: 'direct',
          attackerId: hero.id,
          attackerCell: hero.cell,
          reason: 'aspergillum'
        },
        events
      );
      events.push({
        type: 'log',
        text: `💦 Farářův kropáč při otočce postříkal svěcenou vodou postavu ${frontEnt.name} (1 DMG)!`
      });
    }
  }

  if (inGarlic) {
    events.push({
      type: 'log',
      text: '🧄 Otočení v Česnekovém oblaku je ZDARMA (nestojí tah)!'
    });
    return { ok: true, freeTurn: true, events };
  }
  events.push({
    type: 'log',
    text: `🔄 Venca se otočil čelem ${hero.facing === 1 ? 'vpravo ▶' : 'vlevo ◀'}.`
  });
  return { ok: true, freeTurn: false, events };
}

export function waitHero(state) {
  const events = [];
  if (state.status !== 'playing' || state.hero.hp <= 0) return { ok: false, events };
  const stunRes = consumeHeroStunIfPresent(state);
  if (stunRes) return stunRes;

  const extraCd = state.talismans?.includes('pocket_watch') ? 1 : 0;
  events.push({ type: 'wait', entityId: state.hero.id });
  events.push({
    type: 'log',
    text:
      extraCd > 0
        ? '⏳ Venca vyčkává a natahuje dědovy cibule (Chladnutí −2).'
        : '⏳ Venca si upravil klobouk a vyčkává (1 tah).'
  });
  return { ok: true, extraCd, events };
}

export function insertTileIntoQueue(state, instanceId) {
  const events = [];
  if (state.status !== 'playing' || state.hero.hp <= 0) return { ok: false, events };
  const stunRes = consumeHeroStunIfPresent(state);
  if (stunRes) return stunRes;

  if (state.queue.length >= state.maxQueueSlots) {
    events.push({ type: 'invalid_action', reason: 'Fronta akcí už je plná!' });
    return { ok: false, events };
  }
  const tile = state.hand.find((t) => t.instanceId === instanceId);
  if (!tile) return { ok: false, events };
  if (tile.inQueue) {
    events.push({ type: 'invalid_action', reason: 'Tato destička už je ve frontě!' });
    return { ok: false, events };
  }
  if (tile.currentCooldown > 0) {
    events.push({
      type: 'invalid_action',
      reason: `Destička „${tile.name}“ ještě chladne (${tile.currentCooldown} ${czechTurns(tile.currentCooldown)})!`
    });
    return { ok: false, events };
  }

  const isQuick = Boolean(tile.quick);
  tile.inQueue = true;
  state.queue.push(tile.instanceId);
  events.push({
    type: 'queue_insert',
    instanceId: tile.instanceId,
    tileName: tile.name,
    slotIndex: state.queue.length - 1,
    isQuick
  });
  events.push({
    type: 'log',
    text: isQuick
      ? `📥 Destička „${tile.name}“ vložena do fronty jako RYCHLOVKA (slot #${state.queue.length}). Nestojí žádný tah!`
      : `📥 Destička „${tile.name}“ vložena do fronty (slot #${state.queue.length}). Spotřebován 1 tah.`
  });
  return { ok: true, freeTurn: isQuick, events };
}

export function removeTileFromQueue(state, slotOrInstance) {
  const events = [];
  if (state.status !== 'playing' || state.hero.hp <= 0) return { ok: false, events };
  const idx =
    typeof slotOrInstance === 'number'
      ? slotOrInstance
      : state.queue.indexOf(slotOrInstance);
  if (idx < 0 || idx >= state.queue.length) return { ok: false, events };

  const [removedId] = state.queue.splice(idx, 1);
  const tile = state.hand.find((t) => t.instanceId === removedId);
  if (tile) tile.inQueue = false;
  events.push({ type: 'queue_remove', instanceId: removedId, tileName: tile?.name || '' });
  events.push({
    type: 'log',
    text: `📤 Destička „${tile?.name || removedId}“ vrácena z fronty do zásoby (zdarma).`
  });
  return { ok: true, freeTurn: true, events };
}

export function reorderQueue(state, fromIdx, toIdx) {
  const events = [];
  if (state.status !== 'playing' || state.hero.hp <= 0) return { ok: false, events };
  if (fromIdx === toIdx) return { ok: true, events };
  if (
    fromIdx < 0 ||
    fromIdx >= state.queue.length ||
    toIdx < 0 ||
    toIdx >= state.queue.length
  ) {
    return { ok: false, events };
  }
  const [movedId] = state.queue.splice(fromIdx, 1);
  state.queue.splice(toIdx, 0, movedId);
  const tile = state.hand.find((t) => t.instanceId === movedId);
  events.push({
    type: 'queue_reorder',
    fromIndex: fromIdx,
    toIndex: toIdx,
    instanceId: movedId,
    tileName: tile?.name || ''
  });
  events.push({
    type: 'log',
    text: `🔀 Přerovnáno kombo: „${tile?.name || 'Destička'}“ přesunuta na pozici #${toIdx + 1} (bez ceny tahu).`
  });
  return { ok: true, freeTurn: true, events };
}

export function executeSingleQueueSlot(
  state,
  instanceId,
  slotIdx,
  comboLength,
  nextInstanceId = null
) {
  const events = [];
  const tile = state.hand.find((t) => t.instanceId === instanceId);
  if (!tile) return events;

  if (slotIdx === 0) {
    state._livingEnemiesBeforeCombo = state.enemies.filter((e) => e.hp > 0).length;
    state._firstComboTileInstanceId = instanceId;
    for (const e of state.enemies) {
      e.lastComboHitDir = null;
    }
    const queuedTiles = (state.queue || [])
      .map((id) => state.hand.find((t) => t.instanceId === id))
      .filter(Boolean);
    applyResonances(state, queuedTiles, events);

    if (comboLength >= 3 && state.talismans?.includes('notary_stamp')) {
      for (const e of state.enemies) {
        if (e.hp > 0) {
          dealDamage(state, e, 1, { reason: 'notary_stamp' }, events);
        }
      }
      events.push({
        type: 'log',
        text: '💮 Falešné obecní razítko: Plné kombo udělilo všem upírům 1 DMG z úředního výnosu!'
      });
    }
  }

  executeHeroTileEffect(state, tile, slotIdx, comboLength, events);
  tile.inQueue = false;
  tile.currentCooldown = tile.maxCooldown;
  tile.justPlayedInCombo = true;

  if (tile.resonance?.nextTileCdReduction && nextInstanceId) {
    const nextTile = state.hand.find((t) => t.instanceId === nextInstanceId);
    if (nextTile) {
      nextTile.pendingResonanceReduction =
        (nextTile.pendingResonanceReduction || 0) + tile.resonance.nextTileCdReduction;
      events.push({
        type: 'resonance_triggered',
        fromTileId: tile.id,
        toTileId: nextTile.id,
        reduction: tile.resonance.nextTileCdReduction
      });
      events.push({
        type: 'log',
        text: `✨ Rezonance! „${nextTile.name}“ bude mít po odehrání Chladnutí kratší o ${tile.resonance.nextTileCdReduction}!`
      });
    }
  }

  if (tile.pendingResonanceReduction) {
    tile.currentCooldown = Math.max(
      0,
      tile.currentCooldown - tile.pendingResonanceReduction
    );
    delete tile.pendingResonanceReduction;
  }

  return events;
}

export function resolveHunterCombo3Bonus(state, hero, events) {
  const hunterId = hero.hunterId || hero.kind || 'venca';
  events.push({ type: 'hunter_combo3', hunterId, heroId: hero.id });
  if (hunterId === 'honza') {
    addStatus(hero, 'shield', 6, events);
    events.push({
      type: 'log',
      text: '💪 Selský hněv! Honza získal +6 Štít a mocnou rázovou vlnou zasáhl okolí za 4 DMG!'
    });
    for (const e of state.enemies) {
      if (e.hp > 0 && Math.abs(e.cell - hero.cell) <= 1) {
        dealDamage(state, e, 4, { reason: 'honza_combo3', attackerId: hero.id }, events);
      }
    }
  } else if (hunterId === 'dragoun') {
    events.push({
      type: 'log',
      text: '💥 Kavaleristická salva! Rittmeister Jaromír vypálil kartáčovou salvu a zkrátil chladnutí destiček!'
    });
    for (const e of state.enemies) {
      if (e.hp > 0 && Math.sign(e.cell - hero.cell) === hero.facing) {
        dealDamage(state, e, 4, { reason: 'dragoon_combo3', attackerId: hero.id }, events);
      }
    }
    for (const t of state.hand) {
      if (t.currentCooldown > 0) {
        t.currentCooldown = Math.max(0, t.currentCooldown - 1);
      }
    }
    if ((hero.bumpCooldown || 0) > 0) {
      hero.bumpCooldown = Math.max(0, hero.bumpCooldown - 1);
    }
  } else if (hunterId === 'zlodejka') {
    addStatus(hero, 'shield', 4, events);
    hero.bumpCooldown = 0;
    events.push({
      type: 'log',
      text: '💨 Pavučinový únik! Káča získala +4 Štít a okamžitě obnovila manévr záměny!'
    });
  } else {
    addStatus(hero, 'shield', 4, events);
    events.push({
      type: 'log',
      text: '🧄 Česneková aura! Venca získal +4 Štít a omámil okolní upíry česnekovým odérem!'
    });
    for (const e of state.enemies) {
      if (e.hp > 0 && Math.abs(e.cell - hero.cell) === 1) {
        addStatus(e, 'confusion', 1, events);
      }
    }
  }
}

export function finalizeComboAndAdvanceTurn(state, comboLength) {
  const events = [];
  state.queue = [];
  if (comboLength >= 2) {
    state.stats.combosExecuted = (state.stats.combosExecuted || 0) + 1;
  }
  if (comboLength >= 3 && state.hero && state.hero.hp > 0) {
    resolveHunterCombo3Bonus(state, state.hero, events);
  }
  delete state.comboResonanceBonusPush;
  checkSvunkBonus(state, comboLength, events);
  advanceTurnAfterPlayerAction(state, events);
  return events;
}
