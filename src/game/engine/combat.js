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
import { getHunterDialogue } from '../config/dialogues.js';

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
    events.push({ type: 'log', text: `🔄 ${enemy.name} se otočil směrem k postavě ${hero.givenName || hero.name}.` });
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
      events.push({ type: 'heal', targetId: target.id, cell: target.cell, amount: actualHealed, remainingHp: target.hp });
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
      text: `🗡️ ${enemy.name} nechal vyrazit kůly přímo pod nohama postavy ${hero.givenName || hero.name} (pole ${hero.cell + 1})!`
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
  const targetHadOkolkovano = Boolean(target.statuses?.okolkovano > 0);
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

  if (tile.id === 'gov_stake_1884' && targetHadOkolkovano) {
    tile.currentCooldown = Math.max(0, tile.currentCooldown - 1);
    events.push({
      type: 'log',
      text: `📑 Erární kolík: Cíl měl stav [OKOLKOVÁNO]! Chladnutí destičky sníženo o 1 (nyní: ${tile.currentCooldown}).`
    });
  }

  if (tile.delayEnemyCountdown && target.entityType === 'enemy' && target.hp > 0) {
    target.countdown = (target.countdown || 1) + tile.delayEnemyCountdown;
    events.push({
      type: 'log',
      text: `💮 Mosazné razítko: Žádost ZAMÍTNUTA! Akce postavy ${target.name} odložena o ${tile.delayEnemyCountdown} tah (odpočet: ${target.countdown}).`
    });
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
      events.push({ type: 'heal', targetId: hero.id, cell: hero.cell, amount: healed, hp: hero.hp, remainingHp: hero.hp });
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

  if (tile.id === 'domicile_inspection' && hero.hp > 0) {
    const adjCell = hero.cell + hero.facing;
    const targetEnemy = state.enemies.find((e) => e.hp > 0 && e.cell === adjCell);
    if (targetEnemy) {
      const heroFrom = hero.cell;
      const enemyFrom = targetEnemy.cell;
      hero.cell = enemyFrom;
      targetEnemy.cell = heroFrom;
      targetEnemy.facing = hero.facing;
      addStatus(targetEnemy, 'okolkovano', 1, events);
      events.push({
        type: 'swap',
        entityAId: hero.id,
        entityBId: targetEnemy.id,
        cellA: enemyFrom,
        cellB: heroFrom,
        heroFrom,
        heroTo: enemyFrom,
        enemyId: targetEnemy.id,
        enemyFrom,
        enemyTo: heroFrom
      });
      triggerCellTerrainOnEnter(state, hero, enemyFrom, events);
      triggerCellTerrainOnEnter(state, targetEnemy, heroFrom, events);
      events.push({
        type: 'log',
        text: `📋 Kontrola domovského listu! Revident Ignác Šiml si prohodil místo s ${targetEnemy.name}, otočil ho zády k sobě a nalepil [OKOLKOVÁNO]!`
      });
      assertBoardInvariants(state);
    } else {
      events.push({
        type: 'log',
        text: `📋 Kontrola domovského listu: Před revidentem nestojí žádný nepřítel!`
      });
    }
  }

  if (tile.leapDistance) {
    const fromCell = hero.cell;
    const hName = hero.givenName || hero.name;
    if (tile.leaveGarlicCloud) {
      if (state.terrain[fromCell]?.type !== 'pit') {
        state.terrain[fromCell] = { type: 'garlic_cloud', duration: 2 };
      }
      events.push({ type: 'terrain_spawn', terrainType: 'garlic_cloud', cell: fromCell });
      events.push({
        type: 'log',
        text: `🧄 ${hName} zanechal na poli ${fromCell + 1} štiplavý Česnekový oblak!`
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
        text: `🤸 ${tile.name}: ${hName} přeskočil z pole ${fromCell + 1} na pole ${dest + 1}!`
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
            text: `🐸 Pivní žába: ${hName} získal po přemetu Štít!`
          });
        }
      }
    }
  } else if (tile.stepBackward && hero.hp > 0) {
    const hName = hero.givenName || hero.name;
    const dest = hero.cell - hero.facing * tile.stepBackward;
    if (isValidCell(dest, state) && !getEntityAt(state, dest)) {
      const from = hero.cell;
      hero.cell = dest;
      events.push({ type: 'step', entityId: hero.id, from, to: dest, facing: hero.facing });
      events.push({
        type: 'log',
        text: `🏃 ${tile.name}: ${hName} uskočil z pole ${from + 1} vzad na pole ${dest + 1}!`
      });
      triggerCellTerrainOnEnter(state, hero, dest, events);
    } else {
      events.push({ type: 'log', text: `🚫 ${tile.name}: Pole za lovcem (${hName}) je zablokováno!` });
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
      const burstCount = tile.burstHits || 1;
      for (let b = 0; b < burstCount; b++) {
        if (hitTarget.hp <= 0) break;
        if (b > 0) {
          events.push({
            type: 'projectile_vfx',
            from: hero.cell,
            to: endCell ?? hero.cell,
            facing: hero.facing,
            tileId: tile.id
          });
          events.push({
            type: 'log',
            text: `🏹 Rotační salva #${b + 1}: Další stříbrná šipka zasáhla cíl (${hitTarget.name})!`
          });
        }
        resolveHeroHitOnTarget(state, tile, hitStep, hitTarget, bonusInfo, comboLength, events);
      }
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
          if (state.terrain[c]?.type !== 'pit') {
            state.terrain[c] = { type: 'garlic_cloud', duration: 2 };
          }
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
      text: `🔄 ${hero.givenName || hero.name} se po ráně otočil čelem ${hero.facing === 1 ? 'vpravo ▶' : 'vlevo ◀'}.`
    });
  }

  if (tile.recoilBack && hero.hp > 0) {
    const dest = hero.cell - hero.facing * tile.recoilBack;
    if (isValidCell(dest, state) && !getEntityAt(state, dest)) {
      const from = hero.cell;
      hero.cell = dest;
      events.push({ type: 'step', entityId: hero.id, from, to: dest, facing: hero.facing });
      events.push({
        type: 'log',
        text: `🏃 Zpětný ráz: ${hero.givenName || hero.name} byl odhozen o ${tile.recoilBack} pole vzad na pole ${dest + 1}!`
      });
      triggerCellTerrainOnEnter(state, hero, dest, events);
    } else {
      events.push({
        type: 'log',
        text: `🧱 Zpětný ráz: Pole za lovcem (${hero.givenName || hero.name}) je zablokováno!`
      });
    }
  }

  if (tile.reloadRangedTiles && hero.hp > 0) {
    for (const t of state.hand) {
      if (t.type === 'ranged' && t.currentCooldown > 0) {
        t.currentCooldown = Math.max(0, t.currentCooldown - tile.reloadRangedTiles);
      }
    }
    events.push({
      type: 'log',
      text: `⚙️ Natažení rumpálu: Chladnutí střeleckých destiček zkráceno o ${tile.reloadRangedTiles}!`
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
      { type: 'log', text: `🔔 ${hero.givenName || hero.name} je omráčený a vynechává akci!` }
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
  if (state.hero && (state.hero.summonCooldown || 0) > 0) {
    if (state.hero.justSummonedThisTurn) {
      delete state.hero.justSummonedThisTurn;
    } else {
      state.hero.summonCooldown = Math.max(0, state.hero.summonCooldown - cdTick);
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
    if (terr && typeof terr.duration === 'number') {
      if (terr.type === 'holy_water_puddle') {
        for (const enemy of state.enemies) {
          if (enemy.hp > 0 && enemy.cell === i && !enemy.flying) {
            events.push({
              type: 'log',
              text: `💧 ${enemy.name} stojí v posvěcené louži a škvaří se (2 DMG)!`
            });
            dealDamage(state, enemy, 2, { reason: 'holy_water_puddle', type: 'holy' }, events);
          }
        }
      }
      terr.duration -= 1;
      if (terr.duration <= 0) {
        const expiredType = terr.type;
        state.terrain[i] = { type: 'none' };
        events.push({ type: 'terrain_expire', terrainType: expiredType, cell: i });
      }
    }
  }

  processReinforcements(state, events);
  state.turn += 1;
  checkBattleEnd(state, events);
  assertBoardInvariants(state);
  return events;
}

export function resolveHeroBump(state, hero, enemy, dir, targetCell, hunterId, events = []) {
  hero.justBumpedThisTurn = true;
  events.push({
    type: 'hero_bump',
    hunterId,
    targetId: enemy.id,
    cell: targetCell,
    dir
  });
  const bumpQuip = getHunterDialogue(hunterId, 'threats');
  if (bumpQuip?.text) {
    events.push({
      type: 'comic_bubble',
      cell: hero.cell,
      text: bumpQuip.text,
      variant: 'threat',
      speaker: bumpQuip.speaker,
      icon: bumpQuip.icon,
      facing: hero.facing,
      durationMs: 2500
    });
  }
  if (hunterId === 'honza') {
    hero.bumpCooldown = 3;
    dealDamage(state, enemy, 2, { reason: 'honza_bump', attackerId: hero.id }, events);
    if (enemy.hp > 0) {
      pushEntity(state, enemy, dir, 1, events);
    }
    const vacated = !getEntityAt(state, targetCell);
    if (vacated && hero.hp > 0) {
      const from = hero.cell;
      hero.cell = targetCell;
      events.push({ type: 'move', entityId: hero.id, from, to: targetCell, facing: hero.facing });
      triggerCellTerrainOnEnter(state, hero, targetCell, events);
    }
    events.push({
      type: 'log',
      text: vacated
        ? `🔨 Selský beran! Honza vrazil do ${enemy.name} plnou vahou (2 DMG), odhodil ho a obsadil jeho pole!`
        : `🔨 Selský beran! Honza vrazil do ${enemy.name} plnou vahou (2 DMG) a přimáčkl ho k překážce!`
    });
  } else if (hunterId === 'dragoun') {
    hero.bumpCooldown = 3;
    dealDamage(state, enemy, 2, { reason: 'dragoon_bump', attackerId: hero.id }, events);
    if (enemy.hp > 0) {
      pushEntity(state, enemy, dir, 1, events);
      addStatus(enemy, 'stun', 1, events);
    }
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
      entityAId: hero.id,
      entityBId: enemy.id,
      cellA: targetCell,
      cellB: from,
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
  } else if (hunterId === 'ponocny') {
    hero.bumpCooldown = 4;
    dealDamage(state, enemy, 3, { reason: 'ponocny_bump', attackerId: hero.id }, events);
    if (enemy.hp > 0) {
      pushEntity(state, enemy, dir, 1, events);
      addStatus(enemy, 'stun', 1, events);
    }
    events.push({
      type: 'log',
      text: `🏮 Zarazení ratištěm! Ponocný Bartoloměj zarazil kované ratiště halapartny do ${enemy.name} (3 DMG), odhodil ho a omráčil!`
    });
  } else if (hunterId === 'silak') {
    hero.bumpCooldown = 3;
    dealDamage(state, enemy, 3, { reason: 'silak_bump', attackerId: hero.id }, events);
    if (enemy.hp > 0) {
      pushEntity(state, enemy, dir, 2, events);
    }
    events.push({
      type: 'log',
      text: `🏋️ Cirkusový přehoz! Silák Gustav popadl ${enemy.name} za opasek, praštil s ním o dlažbu za 3 DMG a odmrštil ho o 2 pole!`
    });
  } else if (hunterId === 'anglicanka') {
    hero.bumpCooldown = 2;
    dealDamage(state, enemy, 2, { reason: 'anglicanka_bump', attackerId: hero.id }, events);
    enemy.facing = dir;
    events.push({ type: 'turn', entityId: enemy.id, facing: enemy.facing });
    events.push({
      type: 'log',
      text: `🫖 Klepnutí slunečníkem! Lady Gwendolyn klepla ${enemy.name} stříbrnou špicí přes prsty za 2 DMG a otočila ho zády: „Zády k dámě se sice nestojí, ale aspoň nekoušete!“`
    });
  } else if (hunterId === 'helsing') {
    hero.bumpCooldown = 2;
    dealDamage(state, enemy, 2, { reason: 'helsing_bump', attackerId: hero.id }, events);
    if (enemy.hp > 0) {
      pushEntity(state, enemy, dir, 1, events);
    }
    events.push({
      type: 'log',
      text: `🏹 Úder pažbou kuše! Profesor Gabriel van Helsing udeřil ${enemy.name} okovanou pažbou za 2 DMG a odhodil ho!`
    });
  } else if (hunterId === 'revident') {
    hero.bumpCooldown = 2;
    dealDamage(state, enemy, 1, { reason: 'revident_bump', attackerId: hero.id }, events);
    if (enemy.hp > 0) {
      pushEntity(state, enemy, dir, 1, events);
      addStatus(enemy, 'okolkovano', 1, events);
    }
    events.push({
      type: 'log',
      text: `📑 Třísknutí deskami spisů! C. k. vrchní revident Ignác Šiml vrazil do ${enemy.name} fasciklem (1 DMG), odhodil ho a orazítkoval [OKOLKOVÁNO]!`
    });
  } else {
    hero.bumpCooldown = 3;
    pushEntity(state, enemy, dir, 1, events);
    const cloudCell = enemy.hp > 0 ? enemy.cell : targetCell;
    if (state.terrain[cloudCell]?.type !== 'pit') {
      state.terrain[cloudCell] = { type: 'garlic_cloud', duration: 2 };
    }
    events.push({ type: 'terrain_spawn', terrainType: 'garlic_cloud', cell: cloudCell });
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
  const hName = hero.givenName || hero.name || 'Venca';
  const confused = hasStatus(hero, 'confusion');
  if (confused) {
    dir = state.rng.nextFloat() < 0.5 ? -1 : 1;
    consumeStatus(hero, 'confusion', 1);
    events.push({
      type: 'log',
      text: `🌀 ${hName} má v hlavě motolici a vykročil náhodným směrem!`
    });
  }

  const targetCell = hero.cell + dir;
  if (!isValidCell(targetCell, state)) {
    if (confused) {
      events.push({
        type: 'log',
        text: `🧱 Zmatený ${hName} narazil do hradní zdi a ztratil tah.`
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
    events.push({ type: 'log', text: `👣 ${hName} popošel na pole ${targetCell + 1}.` });
    triggerCellTerrainOnEnter(state, hero, targetCell, events);
  } else if (occupant.entityType === 'enemy') {
    if ((hero.bumpCooldown || 0) > 0) {
      events.push({
        type: 'invalid_action',
        reason: `Manévr Krok do nepřítele ještě chladne (zbývá ${hero.bumpCooldown} ${czechTurns(hero.bumpCooldown)})!`
      });
      return { ok: false, events };
    }
    const hunterId = hero.hunterId || hero.kind || 'venca';
    resolveHeroBump(state, hero, occupant, dir, targetCell, hunterId, events);
  } else if (confused) {
    events.push({
      type: 'log',
      text: `🧱 Zmatený ${hName} se zamotal do překážky a ztratil tah.`
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
  const hName = hero.givenName || hero.name || 'Venca';
  hero.facing = -hero.facing;
  const inGarlic = state.terrain[hero.cell]?.type === 'garlic_cloud';
  events.push({ type: 'turn', entityId: hero.id, facing: hero.facing, free: inGarlic });

  if (hero.hunterId === 'revident') {
    const summonCd = hero.summonCooldown || 0;
    const targetCell = hero.cell + hero.facing * 2;
    const midCell = hero.cell + hero.facing;
    if (summonCd <= 0 && isValidCell(targetCell, state)) {
      const targetEnemy = state.enemies.find((e) => e.hp > 0 && e.cell === targetCell);
      const midEnt = getEntityAt(state, midCell);
      if (targetEnemy && !midEnt) {
        targetEnemy.cell = midCell;
        events.push({
          type: 'pull_move',
          targetId: targetEnemy.id,
          from: targetCell,
          to: midCell
        });
        addStatus(targetEnemy, 'okolkovano', 1, events);
        hero.summonCooldown = 2;
        hero.justSummonedThisTurn = true;
        events.push({
          type: 'official_summons',
          heroId: hero.id,
          targetId: targetEnemy.id,
          cell: midCell
        });
        events.push({
          type: 'log',
          text: `📑 Úřední předvolání! C. k. vrchní revident Ignác Šiml spatřil nepřítele (${targetEnemy.name}) ve vzdálenosti 2 polí, zdarma si ho přitáhl k přepážce a nalepil [OKOLKOVÁNO]!`
        });
        triggerCellTerrainOnEnter(state, targetEnemy, midCell, events);
        assertBoardInvariants(state);
      }
    }
  }

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
    text: `🔄 ${hName} se otočil čelem ${hero.facing === 1 ? 'vpravo ▶' : 'vlevo ◀'}.`
  });
  return { ok: true, freeTurn: false, events };
}

export function waitHero(state) {
  const events = [];
  if (state.status !== 'playing' || state.hero.hp <= 0) return { ok: false, events };
  const stunRes = consumeHeroStunIfPresent(state);
  if (stunRes) return stunRes;

  const hName = state.hero?.givenName || state.hero?.name || 'Venca';
  const extraCd = state.talismans?.includes('pocket_watch') ? 1 : 0;
  events.push({ type: 'wait', entityId: state.hero.id });
  events.push({
    type: 'log',
    text:
      extraCd > 0
        ? `⏳ ${hName} vyčkává a natahuje dědovy cibule (Chladnutí −2).`
        : `⏳ ${hName} si upravil výstroj a vyčkává (1 tah).`
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
  const comboShout = getHunterDialogue(hunterId, 'combo_cries');
  if (comboShout?.text) {
    events.push({
      type: 'comic_bubble',
      cell: hero.cell,
      text: comboShout.text,
      variant: 'battle_cry',
      speaker: comboShout.speaker,
      icon: comboShout.icon,
      facing: hero.facing,
      durationMs: 3000
    });
  }
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
      text: '💥 Kavaleristická salva! Rittmeister Jaromír vypálil kartáčovou salvu a zkrátil Chladnutí destiček!'
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
  } else if (hunterId === 'ponocny') {
    addStatus(hero, 'shield', 6, events);
    events.push({
      type: 'log',
      text: '🔔 Půlnoční vartování! Odbila dvanáctá hodina! Ponocný získal +6 Štít a smetl obě pole před sebou za 5 DMG!'
    });
    for (const e of state.enemies) {
      if (e.hp > 0) {
        const offset = (e.cell - hero.cell) * hero.facing;
        if (offset === 1 || offset === 2) {
          dealDamage(state, e, 5, { reason: 'ponocny_combo3', attackerId: hero.id }, events);
        }
      }
    }
  } else if (hunterId === 'silak') {
    addStatus(hero, 'shield', 5, events);
    events.push({
      type: 'log',
      text: '🏋️ Litinové finále! Silák Gustav se rozkročil, získal +5 Štít a mrštil obří činku po nepřátelích!'
    });
    let nearestInLine = null;
    let minDistance = 999;
    for (const e of state.enemies) {
      if (e.hp > 0 && Math.sign(e.cell - hero.cell) === hero.facing) {
        const dist = Math.abs(e.cell - hero.cell);
        if (dist < minDistance) {
          minDistance = dist;
          nearestInLine = e;
        }
      }
    }
    if (nearestInLine) {
      dealDamage(state, nearestInLine, 6, { reason: 'silak_combo3', attackerId: hero.id }, events);
      addStatus(nearestInLine, 'stun', 1, events);
    }
  } else if (hunterId === 'anglicanka') {
    hero.hp = Math.min(hero.maxHp || 18, hero.hp + 4);
    addStatus(hero, 'shield', 4, events);
    events.push({
      type: 'heal',
      targetId: hero.id,
      cell: hero.cell,
      amount: 4,
      hp: hero.hp,
      remainingHp: hero.hp
    });
    events.push({
      type: 'log',
      text: '🫖 Čaj o páté! Lady Gwendolyn si dopřála doušek Earl Grey (+4 HP, +4 Štít) a vařící čaj opařil nepřátele v dohledu!'
    });
    for (const e of state.enemies) {
      if (e.hp > 0 && Math.sign(e.cell - hero.cell) === hero.facing) {
        dealDamage(state, e, 3, { reason: 'anglicanka_combo3', attackerId: hero.id }, events);
        addStatus(e, 'bleed', 2, events);
      }
    }
  } else if (hunterId === 'helsing') {
    events.push({
      type: 'log',
      text: '🏹 Kruhový rotační rozptyl! Profesor Gabriel van Helsing roztočil multishot mechanismus a zasáhl nepřátele stříbrnou salvou!'
    });
    for (const e of state.enemies) {
      if (e.hp > 0) {
        dealDamage(state, e, 4, { reason: 'helsing_combo3', attackerId: hero.id }, events);
        addStatus(e, 'bleed', 2, events);
      }
    }
  } else if (hunterId === 'revident') {
    addStatus(hero, 'shield', 3, events);
    events.push({
      type: 'log',
      text: '📑 Finanční exekuce! C. k. vrchní revident Ignác Šiml získal +3 Štít a zahájil daňovou kontrolu všech nočních monster!'
    });
    for (const e of state.enemies) {
      if (e.hp > 0) {
        if (hasStatus(e, 'okolkovano')) {
          dealDamage(state, e, 3, { reason: 'revident_combo3', attackerId: hero.id }, events);
        }
        addStatus(e, 'okolkovano', 1, events);
      }
    }
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
