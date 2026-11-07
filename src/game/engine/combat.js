// @ts-nocheck
import { ENEMY_TILES, ENEMIES } from '../config/enemies.js';
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
  getSortedEnemiesByInitiative,
  genEntityId,
  isVampireEntity,
  isHumanEntity,
  resolveEntityDeath,
  isHeroAlive,
  applyHealToEntity,
  getEnemyTacticalRole,
  getTacticalRoleMeta,
  selectSmartReinforcementGate,
  lockAndTelegraphReinforcement
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
  let furyBonus = 0;
  const rawFury = state.hero?.currentFury || 0;
  const heroFury = Math.max(-50, rawFury);
  const baseDamage = tile.dmg ?? (tile.pattern && tile.pattern[0]?.dmg) ?? 0;
  if (heroFury !== 0 && (baseDamage > 0 || tile.type === 'attack')) {
    furyBonus = Math.round(baseDamage * (heroFury / 100));
    dmgBonus += furyBonus;
  }
  return { dmgBonus, furyBonus };
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

  const reduction = comboLength;
  const firstTile = (state.hand || []).find((t) => t.instanceId === firstTileId);
  if (firstTile) {
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
  }

  if (state.hero && (state.hero.bumpCooldown || 0) > 0) {
    state.hero.bumpCooldown = Math.max(0, state.hero.bumpCooldown - reduction);
    events.push({
      type: 'log',
      text: `⚡ ŠVUNK! Manévr Krok do nepřítele chytil švunk a zkrátil Chladnutí o ${reduction} (zbývá: ${state.hero.bumpCooldown})!`
    });
  }
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
      events.push({
        type: 'enemy_confusion_skipped',
        enemyId: enemy.id,
        enemyName: enemy.name,
        cell: enemy.cell
      });
      events.push({
        type: 'log',
        text: `❓ ${enemy.name} má nad hlavou otazník, zmateně stojí a vynechává tah!`
      });
      return;
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
  const baseDmg = patternStep.dmg || 0;
  const enemyFury = enemy.currentFury || 0;
  const furyBonus = enemyFury > 0 && baseDmg > 0 ? Math.round(baseDmg * (enemyFury / 100)) : 0;
  const isFromBehind = target.facing === enemy.facing;
  const isConfused = Boolean(target.statuses?.confusion > 0);
  const isSneakAttack = isFromBehind || isConfused;
  const sneakBonusPct = isSneakAttack ? (enemy.backstabBonus || 50) : 0;
  const sneakDmg = isSneakAttack && baseDmg > 0 ? Math.round(baseDmg * (sneakBonusPct / 100)) : 0;
  const totalDmg = Math.max(
    0,
    baseDmg + furyBonus + sneakDmg + empowerBonus - garlicPenalty + keyringBonus + lordBonus
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
        text: `🧛‍♂️💥 PŘÁTELSKÁ PALBA! ${enemy.name} zasáhl vlastního kumpána (${target.name})! ${quote}`
      });
    } else {
      const sneakText = isSneakAttack ? ` [🗡️ Zákeřný úder ${isFromBehind ? 'do zad' : 'v omámení'} +${sneakBonusPct}%]` : '';
      events.push({
        type: 'log',
        text: `⚔️ ${enemy.name} zasáhl cíl ${target.name} akcí „${tileDef.name}“ (${dealt} DMG)${sneakText}!`
      });
    }
  }

  const pushDir = Math.sign(target.cell - enemy.cell) || enemy.facing;
  for (const eff of patternStep.effects || []) {
    if (target.hp <= 0) break;
    if (shouldApplySecondaryEffect(blockType, eff.type)) {
      if (eff.type === 'push') {
        pushEntity(state, target, pushDir, eff.distance || 1, events, { pusher: enemy });
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
    const smartGate = selectSmartReinforcementGate(state, {
      enemyId: tileDef.summonEnemyId,
      gatePref: enemy.cell <= Math.floor((state.boardSize || 7) / 2) ? (state.boardSize || 7) - 1 : 0
    });
    const freeGate = !smartGate.isBlocked
      ? smartGate.gateCell
      : [0, (state.boardSize || 7) - 1].find((c) => !getEntityAt(state, c));
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
      // Panský rozkaz: sero (enemy)
      if ((state.roomOrder?.id === 'sero' || state.roomOrder === 'sero') && p.offset > 3) break;
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
  if (!state.hero || !isHeroAlive(state.hero)) return events;
  const enemies = getSortedEnemiesByInitiative(state);
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || !isHeroAlive(state.hero)) continue;
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
    } else if (hasStatus(enemy, 'confusion')) {
      consumeStatus(enemy, 'confusion', 1);
      events.push({
        type: 'enemy_confusion_skipped',
        enemyId: enemy.id,
        enemyName: enemy.name,
        cell: enemy.cell
      });
      events.push({
        type: 'log',
        text: `❓ ${enemy.name} má nad hlavou otazník, zmateně stojí a vynechává tah!`
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
            if (enemy.hp <= 0 || !isHeroAlive(state.hero)) break;
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

      if (enemy.hp > 0 && isHeroAlive(state.hero)) {
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
  const isFromBehind = target.entityType === 'enemy' && target.facing === hero.facing;
  const isConfused = target.entityType === 'enemy' && Boolean(target.statuses?.confusion > 0);
  const isSneakAttack = isFromBehind || isConfused;
  const isBackstab = isSneakAttack;

  const rawBaseDmg = patternStep.dmg || 0;
  let baseDmg = rawBaseDmg;
  let sneakBonusDmg = 0;

  if (isSneakAttack) {
    if (patternStep.backstabDmg) {
      baseDmg = patternStep.backstabDmg;
      events.push({
        type: 'log',
        text: `🗡️ Zákeřný bod ze zálohy do postavy ${target.name} (${patternStep.backstabDmg} DMG)!`
      });
    } else {
      const sneakPct = hero.backstabBonus || 50;
      sneakBonusDmg = Math.round(rawBaseDmg * (sneakPct / 100));
      const reasonText = isConfused && isFromBehind
        ? 'do zad zmateného cíle (❓)'
        : isConfused
        ? 'do zmateného cíle (❓)'
        : 'do zad';
      events.push({
        type: 'log',
        text: `🗡️ Zákeřný úder ${reasonText} (${target.name}) za +${sneakBonusDmg} DMG (+${sneakPct} %)!`
      });
    }
  }
  let humanBonus = 0;
  if (tile.id === 'falcon_claw' && isHumanEntity(target)) {
    humanBonus = 2;
    events.push({
      type: 'log',
      text: `🦅 Sokolí spár! Cíl (${target.name}) je člověk – kritická slabina za +2 DMG!`
    });
  }

  let dragounBonus = 0;
  let armorIgnore = 0;
  if (hero.hunterId === 'dragoun' && (hero.movedThisTurn || Boolean(hero.statuses?.kavalirsky_naprah))) {
    dragounBonus = 2;
    armorIgnore = 1;
    if (hero.statuses?.kavalirsky_naprah) {
      consumeStatus(hero, 'kavalirsky_naprah', 1);
    }
    events.push({
      type: 'log',
      text: `⚔️ Kavalírský nápřah! Útočný výpad z pohybu proráží formaci (+2 DMG, ignoruje 1 Brnění)!`
    });
  }

  let helsingBonus = 0;
  if (hero.hunterId === 'helsing' && Math.abs(target.cell - hero.cell) >= 2 && Boolean(target.statuses?.bleed > 0)) {
    helsingBonus = 2;
    tile.currentCooldown = Math.max(0, (tile.currentCooldown || 0) - 1);
    events.push({
      type: 'log',
      text: `🏹 Lovec trofejí! Přesný zásah krvácejícího cíle na dálku do slabiny (+2 DMG, −1 Chladnutí)!`
    });
  }

  const targetHadOkolkovano = Boolean(target.statuses?.okolkovano > 0);
  let revidentBonus = 0;
  if (hero.hunterId === 'revident' && targetHadOkolkovano) {
    revidentBonus = 1;
    addStatus(hero, 'shield', 1, events);
    events.push({
      type: 'log',
      text: `📑 C. k. daňová kontrola! Zásah okolkovaného poplatníka (+1 DMG, +1 Štít z úředního krytí)!`
    });
  }

  let zabojBonus = 0;
  const targetInGarlic = state.terrain[target.cell]?.type === 'garlic_cloud';
  if (hero.hunterId === 'zaboj' && (isConfused || targetInGarlic)) {
    zabojBonus = 2;
    addStatus(hero, 'shield', 2, events);
    hero.currentFury = (hero.currentFury || 0) + 5;
    events.push({
      type: 'fury_changed',
      heroId: hero.id,
      delta: 5,
      currentFury: hero.currentFury
    });
    events.push({
      type: 'log',
      text: `🪕 Rukopisný zápal! Vlastenecké nadšení při úderu do ${isConfused ? 'zmateného cíle' : 'česnekového oblaku'} (+2 DMG, +2 Štít, +5 % Rozlícení)!`
    });
  }

  if (tile.reduceTargetFury && target.entityType === 'enemy') {
    const furyDrop = tile.reduceTargetFury;
    target.currentFury = Math.max(-50, (target.currentFury || 0) - furyDrop);
    events.push({
      type: 'log',
      text: `🏮 Půlnoční lucerna: Světlo zchladilo běsnění postavy ${target.name} (−${furyDrop} % Rozlícení, nyní: ${target.currentFury} %)!`
    });
  }

  const calculatedDmg = baseDmg + sneakBonusDmg + bonusInfo.dmgBonus + humanBonus + dragounBonus + helsingBonus + revidentBonus + zabojBonus;
  const totalDmg = (rawBaseDmg > 0 || baseDmg > 0) ? Math.max(1, calculatedDmg) : Math.max(0, calculatedDmg);
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
        reason: tile.id,
        ignoreArmor: armorIgnore
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
          pushEntity(state, target, pushDir, (eff.distance || 1) + bonusPush, events, { pusher: hero });
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
  if (!state.hero || !isHeroAlive(state.hero) || !tile) return;
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
    const healed = applyHealToEntity(state, hero, tile.healAmount, events);
    if (healed > 0) {
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

  if (tile.type === 'move' || tile.leapDistance) {
    hero.movedThisTurn = true;
    // Panský rozkaz: zakaz_ustupu
    if ((state.roomOrder?.id === 'zakaz_ustupu' || state.roomOrder === 'zakaz_ustupu') && dir !== hero.facing) {
      hero.bumpCooldown = (hero.bumpCooldown || 0) + 1;
      events.push({
        type: 'log',
        text: '📜 Panský zákaz ústupu! Krok vzad vyčerpává a prodlužuje Chladnutí manévru o 1!'
      });
    }
  }

  if (typeof tile.furyChange === 'number') {
    hero.currentFury = Math.max(-50, (hero.currentFury || 0) + tile.furyChange);
    events.push({
      type: 'fury_changed',
      heroId: hero.id,
      delta: tile.furyChange,
      currentFury: hero.currentFury
    });
    if (tile.furyChange > 0) {
      events.push({
        type: 'log',
        text: `💢 ${hero.name} se rozohnil o +${tile.furyChange} % Rozlícení (nyní ${hero.currentFury > 0 ? '+' : ''}${hero.currentFury} % v boji)!`
      });
    } else {
      events.push({
        type: 'log',
        text: `🧊 ${hero.name} zchladil svou horkou krev o ${tile.furyChange} % Rozlícení (nyní ${hero.currentFury > 0 ? '+' : ''}${hero.currentFury} %)! ${hero.currentFury < 0 ? 'Nastalo Zchlazení 🧊.' : ''}`
      });
    }
  }

  if (tile.convertFuryToShield && (hero.currentFury || 0) > 0) {
    const furySpent = hero.currentFury;
    const shieldGained = Math.floor(furySpent / (tile.furyPerShield || 5));
    hero.currentFury = 0;
    if (shieldGained > 0) {
      addStatus(hero, 'shield', shieldGained, events);
      events.push({
        type: 'log',
        text: `🫖 Noblesní sebeovládání! Lady Gwendolyn přetavila ${furySpent} % hněvu na +${shieldGained} chladnokrevného Štítu!`
      });
    }
  }

  if (tile.cureStatus && hero.statuses?.[tile.cureStatus]) {
    delete hero.statuses[tile.cureStatus];
    events.push({ type: 'status_cleared', targetId: hero.id, status: tile.cureStatus });
    events.push({ type: 'log', text: `✨ ${hero.name} se zbavil stavu ${tile.cureStatus}!` });
  }

  if (tile.id === 'domicile_inspection' && isHeroAlive(hero)) {
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

  if (tile.lungeForward && isHeroAlive(hero)) {
    const nextCell = hero.cell + hero.facing * tile.lungeForward;
    if (isValidCell(nextCell, state) && !getEntityAt(state, nextCell)) {
      const from = hero.cell;
      hero.cell = nextCell;
      hero.movedThisTurn = true;
      if (hero.hunterId === 'dragoun') {
        addStatus(hero, 'kavalirsky_naprah', 1, events);
      }
      events.push({
        type: 'move',
        entityId: hero.id,
        from,
        to: nextCell,
        facing: hero.facing
      });
      events.push({
        type: 'log',
        text: `🐎 Výpad šavlí! ${hero.name} vyrazil vpřed na pole ${nextCell + 1}!`
      });
      triggerCellTerrainOnEnter(state, hero, nextCell, events);
      assertBoardInvariants(state);
    }
  }

  if (tile.isLobbed) {
    const hName = hero.givenName || hero.name;
    const lobDist = tile.lobDistance || 3;
    const rawTarget = hero.cell + hero.facing * lobDist;
    const impactCell = Math.max(0, Math.min(state.boardSize - 1, rawTarget));

    events.push({
      type: 'lobbed_projectile_vfx',
      from: hero.cell,
      to: impactCell,
      facing: hero.facing,
      tileId: tile.id
    });
    events.push({
      type: 'log',
      text: `💣 ${tile.name}: ${hName} mrštil granát obloukem na pole ${impactCell + 1}!`
    });

    const radiusCells = [impactCell - 1, impactCell, impactCell + 1].filter((c) => isValidCell(c, state));
    for (const c of radiusCells) {
      if (state.terrain[c]?.type !== 'pit') {
        state.terrain[c] = { type: 'garlic_cloud', duration: tile.cloudDuration || 2 };
        events.push({ type: 'terrain_spawn', terrainType: 'garlic_cloud', cell: c });
      }
      const ent = getEntityAt(state, c);
      if (ent && ent.id !== hero.id && ent.entityType !== 'hero') {
        addStatus(ent, 'confusion', 1, events);
        if (ent.isTorpid) {
          dealDamage(state, ent, 2, { reason: 'garlic_grenade', isFinisher: true, canFinishVampires: true }, events);
        }
      }
    }
  } else if (tile.leapDistance) {
    const fromCell = hero.cell;
    const hName = hero.givenName || hero.name;
    if (tile.leaveGarlicCloudRadius1 || tile.id === 'skok_pres_kozu' || tile.id === 'belly_vault') {
      for (const c of [fromCell - 1, fromCell, fromCell + 1]) {
        if (isValidCell(c, state) && state.terrain[c]?.type !== 'pit') {
          state.terrain[c] = { type: 'garlic_cloud', duration: tile.cloudDuration || 2 };
          events.push({ type: 'terrain_spawn', terrainType: 'garlic_cloud', cell: c });
        }
      }
      events.push({
        type: 'log',
        text: `🧄 ${hName} provedl ladný skok a na výchozím poli zanechal široký Česnekový oblak!`
      });
    } else if (tile.leaveGarlicCloud) {
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
  } else if (tile.stepBackward && isHeroAlive(hero)) {
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
      // Panský rozkaz: sero (hero)
      if ((state.roomOrder?.id === 'sero' || state.roomOrder === 'sero') && p.offset > 3) break;
      const c = hero.cell + hero.facing * p.offset;
      if (!isValidCell(c, state)) break;
      endCell = c;
      const ent = getEntityAt(state, c);
      if (ent && ent.id !== hero.id && ent.entityType !== 'hero') {
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

  if (tile.selfFlipAfter && isHeroAlive(hero)) {
    hero.facing = -hero.facing;
    events.push({ type: 'turn', entityId: hero.id, facing: hero.facing, free: true });
    events.push({
      type: 'log',
      text: `🔄 ${hero.givenName || hero.name} se po ráně otočil čelem ${hero.facing === 1 ? 'vpravo ▶' : 'vlevo ◀'}.`
    });
  }

  if (tile.recoilBack && isHeroAlive(hero)) {
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

  if (tile.reloadRangedTiles && isHeroAlive(hero)) {
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
  const boardSize = state.boardSize || 7;
  const maxActiveEnemies = state.maxActiveEnemies || 4;

  // Track already-locked gates among imminent reinforcements
  const reservedGates = new Set();
  for (const r of state.reinforcements) {
    if (!r.spawned && r.isLocked && typeof r.lockedGateCell === 'number') {
      reservedGates.add(r.lockedGateCell);
    }
  }

  // Stage 1: Hybrid Pacing — Early Board-Clear Acceleration
  const activeEnemiesAtStart = (state.enemies || []).filter((e) => e.hp > 0 || e.isTorpid);
  if (activeEnemiesAtStart.length === 0) {
    const nextWave = state.reinforcements
      .filter((r) => !r.spawned)
      .sort((a, b) => a.turnsRemaining - b.turnsRemaining)[0];
    if (nextWave && nextWave.turnsRemaining > 2) {
      const oldTurns = nextWave.turnsRemaining;
      nextWave.turnsRemaining = 2; // Will tick down to 1 (imminent) in Stage 2
      nextWave.accelerated = true;
      events.push({
        type: 'spawn_accelerated',
        reinfId: nextWave.id,
        previousTurns: oldTurns,
        turnsRemaining: 1
      });
      events.push({
        type: 'log',
        text: `📯 Bojiště vyčištěno! Velitel nočních posil zatroubil k okamžitému přesunu – další vlna dorazí už příští tah!`
      });
    }
  }

  // Stage 2, 3, 4: Tick countdowns, Lock & Telegraph at <= 2 turns, and Spawn or Reroute at <= 0
  for (const r of state.reinforcements) {
    if (r.spawned) continue;

    const currentActiveCount = (state.enemies || []).filter((e) => e.hp > 0 || e.isTorpid).length;

    // Overcrowding Cap: if corridor has >= maxActiveEnemies and wave is about to spawn, hold at 1t
    if (currentActiveCount >= maxActiveEnemies && r.turnsRemaining <= 1) {
      r.turnsRemaining = 1;
      r.heldByCap = true;
      if (!r.isLocked) {
        lockAndTelegraphReinforcement(state, r, reservedGates, events, { emitLog: false });
      }
      events.push({
        type: 'spawn_crowded_hold',
        reinfId: r.id,
        gateCell: r.gateCell,
        enemyId: r.enemyId,
        activeEnemies: currentActiveCount
      });
      events.push({
        type: 'log',
        text: `⏳ Chodba je přeplněná (${currentActiveCount} nepřátelé v boji) – posila u brány vyčkává na uvolnění prostoru.`
      });
      continue;
    }

    r.heldByCap = false;
    r.turnsRemaining = Math.max(0, r.turnsRemaining - 1);

    // Stage 3: Lock & Telegraph when entering the 1-2 turn window
    if (r.turnsRemaining <= 2 && !r.isLocked) {
      lockAndTelegraphReinforcement(state, r, reservedGates, events, {
        emitLog: r.turnsRemaining > 0
      });
    }

    // Stage 4: Arrival & Smart Blocked-Gate Rerouting
    if (r.turnsRemaining <= 0) {
      if (!r.isLocked) {
        lockAndTelegraphReinforcement(state, r, reservedGates, events, {
          emitEvents: false,
          emitLog: false
        });
      }

      let targetGate =
        typeof r.lockedGateCell === 'number'
          ? r.lockedGateCell
          : r.gateCell === 0
          ? 0
          : boardSize - 1;

      const blocker = getEntityAt(state, targetGate);
      if (blocker) {
        const altGate = targetGate === 0 ? boardSize - 1 : 0;
        const altBlocker = getEntityAt(state, altGate);
        const enemyDef = ENEMIES[r.enemyId] || {};
        const altIsLethalPit =
          state.terrain?.[altGate]?.type === 'pit' && !enemyDef.flying;
        const canReroute =
          r.allowReroute !== false && !altBlocker && !altIsLethalPit;

        if (canReroute) {
          const fromGate = targetGate;
          targetGate = altGate;
          r.gateCell = altGate;
          r.lockedGateCell = altGate;
          r.rerouted = true;
          r.lockReason = 'rerouted_blocked_gate';
          r.lockReasonLabel = 'Obchvat zatarasené brány';
          events.push({
            type: 'spawn_rerouted',
            reinfId: r.id,
            fromGate,
            toGate: altGate,
            enemyId: r.enemyId
          });
          events.push({
            type: 'log',
            text: `🔄 Brána na poli ${fromGate + 1} byla zatarasena! Posila (${enemyDef.name || r.enemyId}) oběhla chodbou a vyráží z opačné brány na poli ${altGate + 1}!`
          });
        } else {
          r.turnsRemaining = 1;
          events.push({ type: 'spawn_delayed', gateCell: targetGate, enemyId: r.enemyId });
          events.push({
            type: 'log',
            text: `🚪 Brána na poli ${targetGate + 1} je ucpaná! Posila se opožďuje o 1 tah.`
          });
          continue;
        }
      }

      r.spawned = true;
      const facing = targetGate === 0 ? 1 : -1;
      const spawned = spawnEnemyEntity(r.enemyId, targetGate, facing);
      state.enemies.push(spawned);
      triggerCellTerrainOnEnter(state, spawned, targetGate, events);
      if (spawned.hp > 0) refreshSingleEnemyIntent(state, spawned);
      const roleMeta = getTacticalRoleMeta(r.tacticalRole || getEnemyTacticalRole(spawned));
      events.push({
        type: 'spawn',
        enemy: structuredClone(spawned),
        cell: targetGate,
        tacticalRole: r.tacticalRole,
        rerouted: Boolean(r.rerouted),
        accelerated: Boolean(r.accelerated)
      });
      events.push({
        type: 'log',
        text: `🚪 Z brány na poli ${targetGate + 1} vtrhla na bojiště posila: ${spawned.name} [${roleMeta.icon} ${roleMeta.shortLabel}]!`
      });
    }
  }

  assertBoardInvariants(state);
  return events;
}

export function checkBattleEnd(state, events = []) {
  if (!isHeroAlive(state.hero)) {
    state.status = 'lost';
    events.push({ type: 'battle_lost' });
    return 'lost';
  }
  const anyLivingEnemies = state.enemies.some((e) => e.hp > 0 || e.isTorpid);
  const anyPendingReinforcements = state.reinforcements.some((r) => !r.spawned);
  if (!anyLivingEnemies && !anyPendingReinforcements) {
    state.status = 'won';
    if (state.hero && state.hero.hp <= 0 && isHeroAlive(state.hero)) {
      state.hero.hp = 1;
      state.hero.isReaperActive = false;
      delete state.hero.reaperCountdown;
      events.push({
        type: 'reaper_cleared',
        targetId: state.hero.id,
        cell: state.hero.cell,
        hp: 1,
        text: `🕯️ Vítězství zahnalo Zubatou! ${state.hero.name} vyvázl s 1 HP.`
      });
      events.push({
        type: 'log',
        text: `🕯️ Vítězství zahnalo Zubatou! Všichni nepřátelé padli – ${state.hero.name} se vyškrábal z hrobu a jeho zdraví je stabilizováno na 1 HP.`
      });
    }
    events.push({ type: 'battle_won' });
    return 'won';
  }
  return 'playing';
}

export function consumeHeroStunIfPresent(state) {
  const hero = state?.hero;
  if (!hero || !isHeroAlive(hero) || !(hero.statuses?.stun > 0)) return null;
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

export function consumeHeroConfusionIfPresent(state) {
  const hero = state?.hero;
  if (!hero || !isHeroAlive(hero) || !(hero.statuses?.confusion > 0)) return null;
  hero.statuses.confusion -= 1;
  if (hero.statuses.confusion <= 0) delete hero.statuses.confusion;
  const events = [
    { type: 'hero_confusion_skipped', targetId: hero.id, cell: hero.cell },
    { type: 'log', text: `❓ ${hero.givenName || hero.name} má nad hlavou otazník, zmateně stojí a vynechává tah!` }
  ];
  return {
    ok: true,
    confused: true,
    events
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

  if (state.heroStartedTurnInReaper && state.hero?.isReaperActive && state.hero.hp <= 0) {
    state.hero.persistence = (state.hero.persistence || 5) - 1;
    const countdown = state.hero.persistence + state.hero.hp;
    state.hero.reaperCountdown = countdown;
    events.push({
      type: 'reaper_decay',
      targetId: state.hero.id,
      cell: state.hero.cell,
      persistence: state.hero.persistence,
      reaperCountdown: countdown,
      text: `⏳ Zubatá utahuje smyčku! Verva klesá na ${state.hero.persistence} (Odpočet: ${countdown})`
    });
    events.push({
      type: 'log',
      text: `⏳ Zubatá utahuje smyčku! Verva lovce klesá na ${state.hero.persistence} (Odpočet Zubaté: ${countdown}).`
    });
    if (countdown <= 0) {
      state.hero.deathResolved = true;
      state.hero.isReaperActive = false;
      resolveEntityDeath(state, state.hero, { reason: 'reaper_decay' }, events);
      checkBattleEnd(state, events);
      return events;
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
    if (ent.hp > 0 && ent.entityType === 'hero' && ent.hunterId === 'ponocny') {
      let lanternTargets = 0;
      for (const e of state.enemies) {
        if (e.hp > 0) {
          const offset = (e.cell - ent.cell) * ent.facing;
          if (offset === 1 || offset === 2) {
            lanternTargets++;
          }
        }
      }
      if (lanternTargets > 0) {
        ent.statuses = ent.statuses || {};
        ent.statuses.shield = (ent.statuses.shield || 0) + lanternTargets;
        events.push({
          type: 'shield_granted',
          targetId: ent.id,
          cell: ent.cell,
          amount: lanternTargets,
          reason: 'ponocny_lantern_passive'
        });
        events.push({
          type: 'log',
          text: `🏮 Zákaz nočního vycházení! Lucerna ponocného odhalila noční havěť (${lanternTargets}) – Bartoloměj získává +${lanternTargets} Štít navíc!`
        });
      }
    }
  }

  // 3. Next round begins: All actors accumulate their Bojové rozlícení
  for (const ent of actors) {
    if (ent.hp > 0 && (ent.fury || 0) > 0) {
      ent.currentFury = (ent.currentFury || 0) + ent.fury;
      events.push({
        type: 'fury_accumulated',
        targetId: ent.id,
        cell: ent.cell,
        furyAdded: ent.fury,
        currentFury: ent.currentFury
      });
      if (ent.entityType === 'hero') {
        if (ent.currentFury > 0) {
          events.push({
            type: 'log',
            text: `💢 Bojové rozlícení! ${ent.name} se rozlítil o +${ent.fury} % (celkem +${ent.currentFury} % v boji)!`
          });
        } else if (ent.currentFury < 0) {
          events.push({
            type: 'log',
            text: `🧊 Zchlazení! ${ent.name} se probouzí z letargie (+${ent.fury} %; zbývá zchlazení ${ent.currentFury} %)!`
          });
        } else {
          events.push({
            type: 'log',
            text: `⚖️ ${ent.name} vyrovnal své Rozlícení na 0 %!`
          });
        }
      }
    }
  }

  if (state.hero) {
    state.hero.movedThisTurn = false;
  }

  // Tick Butler lifespan
  for (let i = state.props.length - 1; i >= 0; i--) {
    const p = state.props[i];
    if (p.kind === 'komornik' && typeof p.durationRounds === 'number') {
      p.durationRounds -= 1;
      if (p.durationRounds <= 0) {
        events.push({
          type: 'komornik_expire',
          cell: p.cell,
          id: p.id
        });
        events.push({
          type: 'log',
          text: `☕ Komorník Archibald se uctivě uklání: „Váš čaj byl podán, milady.“ a v obláčku prachu mizí.`
        });
        state.props.splice(i, 1);
      }
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
      } else if (terr.type === 'garlic_cloud') {
        for (const enemy of state.enemies) {
          if ((enemy.hp > 0 || enemy.isTorpid) && enemy.cell === i) {
            const isVamp = isVampireEntity(enemy);
            const dmg = isVamp ? 2 : 1;
            events.push({
              type: 'log',
              text: `🧄 ${enemy.name} stojí v česnekovém oblaku (${dmg} DMG${isVamp ? ' – upír trpí dvojnásob!' : ''})!`
            });
            dealDamage(state, enemy, dmg, { reason: 'garlic_cloud', isFinisher: true, canFinishVampires: true }, events);
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

  for (const enemy of state.enemies) {
    if (enemy.isTorpid) {
      enemy.torporTurnsLeft = (enemy.torporTurnsLeft || 2) - 1;
      if (enemy.statuses?.torpor) enemy.statuses.torpor = enemy.torporTurnsLeft;
      if (enemy.torporTurnsLeft <= 0) {
        enemy.isTorpid = false;
        delete enemy.statuses?.torpor;
        enemy.hp = Math.max(1, Math.floor(enemy.maxHp / 2));
        events.push({
          type: 'vampire_revive',
          targetId: enemy.id,
          targetName: enemy.name,
          cell: enemy.cell,
          hp: enemy.hp
        });
        events.push({
          type: 'log',
          text: `🩸 ${enemy.name} se zvedá ze země a s vyceněnými tesáky opět povstává do boje s ${enemy.hp} HP!`
        });
      }
    }
  }

  processReinforcements(state, events);
  state.turn += 1;
  // Panský rozkaz: cesnek (Česnekový průvan z kuchyní)
  if (state.roomOrder?.id === 'cesnek' || state.roomOrder === 'cesnek') {
    if (state.turn > 1 && (state.turn - 1) % 3 === 0) {
      const gates = [0, state.boardSize - 1];
      for (const g of gates) {
        state.terrain[g] = { type: 'garlic_cloud', duration: 2 };
        events.push({
          type: 'terrain_spawned',
          cell: g,
          terrainType: 'garlic_cloud',
          duration: 2
        });
      }
      events.push({
        type: 'log',
        text: '🧄 Česnekový průvan z panských kuchyní zamořil brány štiplavým oblakem!'
      });
    }
  }
  state.heroStartedTurnInReaper = Boolean(state.hero?.isReaperActive && state.hero.hp <= 0);
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
  const rawFury = hero.currentFury || 0;
  const heroFury = Math.max(-50, rawFury);
  const isFromBehind = enemy.facing === hero.facing;
  const isConfused = Boolean(enemy.statuses?.confusion > 0);
  const isSneak = isFromBehind || isConfused;
  const sneakPct = isSneak ? (hero.backstabBonus || 50) : 0;
  const totalBonusPct = heroFury + sneakPct;
  const getBumpDmg = (base) => {
    const calculated = base + Math.round(base * (totalBonusPct / 100));
    return base > 0 ? Math.max(1, calculated) : 0;
  };

  if (hunterId === 'honza') {
    hero.bumpCooldown = 3;
    const dmg = getBumpDmg(2);
    dealDamage(state, enemy, dmg, { reason: 'honza_bump', attackerId: hero.id }, events);
    if (enemy.hp > 0) {
      pushEntity(state, enemy, dir, 1, events, { pusher: hero });
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
        ? `🔨 Selský beran! Honza vrazil do ${enemy.name} plnou vahou (${dmg} DMG), odhodil ho a obsadil jeho pole!`
        : `🔨 Selský beran! Honza vrazil do ${enemy.name} plnou vahou (${dmg} DMG) a přimáčkl ho k překážce!`
    });
  } else if (hunterId === 'dragoun') {
    hero.bumpCooldown = 3;
    const dmg = getBumpDmg(2);
    dealDamage(state, enemy, dmg, { reason: 'dragoon_bump', attackerId: hero.id }, events);
    if (enemy.hp > 0) {
      pushEntity(state, enemy, dir, 1, events, { pusher: hero });
      addStatus(enemy, 'confusion', 1, events);
    }
    events.push({
      type: 'log',
      text: `⚔️ Úder těžkým jílcem! Rittmeister Jaromír udeřil ${enemy.name} mosazným jílcem (${dmg} DMG), odhodil ho a uvrhl do Zmatení (❓)!`
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
    hero.bumpCooldown = 3;
    const dmg = getBumpDmg(3);
    dealDamage(state, enemy, dmg, { reason: 'ponocny_bump', attackerId: hero.id }, events);
    if (enemy.hp > 0) {
      pushEntity(state, enemy, dir, 1, events, { pusher: hero });
      addStatus(enemy, 'confusion', 1, events);
    }
    events.push({
      type: 'log',
      text: `🏮 Zarazení ratištěm! Ponocný Bartoloměj zarazil kované ratiště halapartny do ${enemy.name} (${dmg} DMG), odhodil ho a uvrhl do Zmatení (❓)!`
    });
  } else if (hunterId === 'silak') {
    hero.bumpCooldown = 3;
    const dmg = getBumpDmg(3);
    dealDamage(state, enemy, dmg, { reason: 'silak_bump', attackerId: hero.id }, events);
    if (enemy.hp > 0) {
      pushEntity(state, enemy, dir, 2, events, { pusher: hero });
    }
    events.push({
      type: 'log',
      text: `🏋️ Cirkusový přehoz! Silák Gustav popadl ${enemy.name} za opasek, praštil s ním o dlažbu za ${dmg} DMG a odmrštil ho o 2 pole!`
    });
  } else if (hunterId === 'anglicanka') {
    hero.bumpCooldown = 3;
    const butlerCell = targetCell; // The cell where enemy stood (hero.cell + dir)
    const initialStepCell = butlerCell + dir; // Cell directly behind enemy

    // 1. Posune nepřítele o 1 dozadu
    const oldEnemyCell = enemy.cell;
    enemy.cell = initialStepCell;
    events.push({ type: 'move', entityId: enemy.id, from: oldEnemyCell, to: initialStepCell, facing: enemy.facing });
    triggerCellTerrainOnEnter(state, enemy, initialStepCell, events);

    // 2. V obláčku prachu se zhmotní komorník
    const butler = {
      id: genEntityId('komornik'),
      kind: 'komornik',
      entityType: 'prop',
      name: 'Komorník Archibald',
      givenName: 'Archibald',
      epithet: 'Čas na čaj, milady!',
      bodyScale: 'human',
      sprite: 'prop.komornik',
      maxHp: 999,
      hp: 999,
      cell: butlerCell,
      facing: dir,
      flying: false,
      isImmortal: true,
      durationRounds: 2,
      destructible: false,
      statuses: {}
    };
    state.props.push(butler);
    events.push({
      type: 'komornik_spawn',
      cell: butlerCell,
      id: butler.id,
      facing: dir
    });
    events.push({
      type: 'log',
      text: `☕ Čas na čaj, milady! V obláčku prachu se zhmotnil komorník Archibald, nabídl šálek čaje a okovanou botou rázně vykopl ${enemy.name} vzad!`
    });

    // 3. Pak ho odsune ještě o dvě políčka
    let blockerInPath = null;
    for (let dist = 1; dist <= 2; dist++) {
      const c = initialStepCell + dir * dist;
      const b = getEntityAt(state, c);
      if (b) {
        blockerInPath = b;
        break;
      }
    }

    pushEntity(state, enemy, dir, 2, events, { pusher: hero });

    // 4. Nepřítel i ten, do kterého vrazil, je zmatený (❓)
    if (enemy.hp > 0) {
      addStatus(enemy, 'confusion', 1, events);
    }
    if (blockerInPath && blockerInPath.hp > 0 && blockerInPath.id !== enemy.id && blockerInPath.id !== butler.id) {
      addStatus(blockerInPath, 'confusion', 1, events);
      events.push({
        type: 'log',
        text: `❓ Srážka způsobila šok! ${blockerInPath.name} má nad hlavou otazník a je zmatený!`
      });
    }
  } else if (hunterId === 'helsing') {
    hero.bumpCooldown = 2;
    const dmg = getBumpDmg(2);
    dealDamage(state, enemy, dmg, { reason: 'helsing_bump', attackerId: hero.id }, events);
    if (enemy.hp > 0) {
      pushEntity(state, enemy, dir, 1, events, { pusher: hero });
    }
    events.push({
      type: 'log',
      text: `🏹 Úder pažbou kuše! Sir Arthur Featherstone udeřil ${enemy.name} okovanou pažbou za ${dmg} DMG a odhodil ho!`
    });
  } else if (hunterId === 'revident') {
    hero.bumpCooldown = 2;
    const dmg = getBumpDmg(1);
    dealDamage(state, enemy, dmg, { reason: 'revident_bump', attackerId: hero.id }, events);
    if (enemy.hp > 0) {
      pushEntity(state, enemy, dir, 1, events, { pusher: hero });
      addStatus(enemy, 'okolkovano', 1, events);
    }
    events.push({
      type: 'log',
      text: `📑 Třísknutí deskami spisů! C. k. vrchní revident Ignác Šiml vrazil do ${enemy.name} fasciklem (${dmg} DMG), odhodil ho a orazítkoval [OKOLKOVÁNO]!`
    });
  } else if (hunterId === 'zaboj') {
    hero.bumpCooldown = 3;
    const dmg = getBumpDmg(2);
    dealDamage(state, enemy, dmg, { reason: 'zaboj_bump', attackerId: hero.id }, events);
    if (enemy.hp > 0) {
      pushEntity(state, enemy, dir, 1, events, { pusher: hero });
    }
    if (enemy.hp > 0) {
      addStatus(enemy, 'confusion', 1, events);
    }
    events.push({
      type: 'log',
      text: `🪕 Falešný akord na varyto! Adolf Puchmajer třískl do lepenkových strun u ucha postavy ${enemy.name} (${dmg} DMG), odhodil ji o 1 pole a uvrhl do Zmatení (❓)!`
    });
  } else {
    hero.bumpCooldown = 3;
    const dmg = getBumpDmg(1);
    dealDamage(state, enemy, dmg, { reason: 'venca_bump', attackerId: hero.id }, events);
    if (enemy.hp > 0) {
      pushEntity(state, enemy, dir, 1, events, { pusher: hero });
    }
    const cloudCell = enemy.hp > 0 ? enemy.cell : targetCell;
    if (state.terrain[cloudCell]?.type !== 'pit') {
      state.terrain[cloudCell] = { type: 'garlic_cloud', duration: 2 };
    }
    events.push({ type: 'terrain_spawn', terrainType: 'garlic_cloud', cell: cloudCell });
    events.push({
      type: 'log',
      text: `🦅 Sokolský náraz! Venca vrazil do ${enemy.name} vypnutou hrudí (1 DMG), odhodil ho a zanechal Česnekový oblak!`
    });
  }
}

export function stepHero(state, direction) {
  const events = [];
  if (state.status !== 'playing' || !isHeroAlive(state.hero)) return { ok: false, events };
  const stunRes = consumeHeroStunIfPresent(state);
  if (stunRes) return stunRes;
  const confRes = consumeHeroConfusionIfPresent(state);
  if (confRes) return confRes;

  let dir = Math.sign(direction);
  if (!dir) return { ok: false, events };
  const hero = state.hero;
  const hName = hero.givenName || hero.name || 'Venca';

  const targetCell = hero.cell + dir;
  if (!isValidCell(targetCell, state)) {
    events.push({ type: 'invalid_action', reason: 'Tam už je hradní zeď!' });
    return { ok: false, events };
  }

  const occupant = getEntityAt(state, targetCell);
  if (!occupant) {
    const from = hero.cell;
    hero.cell = targetCell;
    hero.movedThisTurn = true;
    if (hero.hunterId === 'dragoun' && dir === hero.facing) {
      addStatus(hero, 'kavalirsky_naprah', 1, events);
      events.push({
        type: 'log',
        text: `🐎 Kavalírský nápřah! Dragoun se rozjel vpřed – příští útok získá +2 DMG a ignoruje 1 Brnění!`
      });
    }
    events.push({ type: 'move', entityId: hero.id, from, to: targetCell, facing: hero.facing });
    events.push({ type: 'log', text: `👣 ${hName} popošel na pole ${targetCell + 1}.` });
    triggerCellTerrainOnEnter(state, hero, targetCell, events);
  } else if (occupant.entityType === 'enemy') {
    if (occupant.isTorpid) {
      events.push({
        type: 'hero_stake_finish',
        heroId: hero.id,
        targetId: occupant.id,
        cell: targetCell
      });
      events.push({
        type: 'log',
        text: `🪵 ${hName} přistoupil k ochromenému ${occupant.name} a zarazil mu kolík přímo do srdce!`
      });
      occupant.isTorpid = false;
      delete occupant.statuses?.torpor;
      occupant.hp = 0;
      resolveEntityDeath(state, occupant, { reason: 'stake_finish', isFinisher: true }, events);

      const from = hero.cell;
      hero.cell = targetCell;
      events.push({ type: 'move', entityId: hero.id, from, to: targetCell, facing: hero.facing });
      events.push({ type: 'log', text: `👣 ${hName} zaujal pole ${targetCell + 1}.` });
      triggerCellTerrainOnEnter(state, hero, targetCell, events);
      assertBoardInvariants(state);
      return { ok: true, events };
    }
    if ((hero.bumpCooldown || 0) > 0) {
      events.push({
        type: 'invalid_action',
        reason: `Manévr Krok do nepřítele ještě chladne (zbývá ${hero.bumpCooldown} ${czechTurns(hero.bumpCooldown)})!`
      });
      return { ok: false, events };
    }
    const hunterId = hero.hunterId || hero.kind || 'venca';
    if (hunterId === 'anglicanka') {
      const spaceBehind = occupant.cell + dir;
      if (!isValidCell(spaceBehind, state) || getEntityAt(state, spaceBehind)) {
        events.push({
          type: 'invalid_action',
          reason: 'Schopnost „Čas na čaj, milady!“ nelze použít – za nepřítelem není volné místo!'
        });
        events.push({
          type: 'log',
          text: `🫖 Za nepřítelem ${occupant.name} není volné místo! Komorník nemůže vstoupit na scénu.`
        });
        return { ok: false, events };
      }
    }
    resolveHeroBump(state, hero, occupant, dir, targetCell, hunterId, events);
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
  if (state.status !== 'playing' || !isHeroAlive(state.hero)) return { ok: false, events };
  const stunRes = consumeHeroStunIfPresent(state);
  if (stunRes) return stunRes;
  const confRes = consumeHeroConfusionIfPresent(state);
  if (confRes) return confRes;

  const hero = state.hero;
  const hName = hero.givenName || hero.name || 'Venca';
  hero.facing = -hero.facing;
  const isVenca = hero.hunterId === 'venca' || hero.hunterId === 'classic' || hero.kind === 'venca';
  const inGarlic = Boolean(isVenca && state.terrain[hero.cell]?.type === 'garlic_cloud');
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
      text: '🧄 Sokolský tělocvik: Otočení v Česnekovém oblaku je pro Vencu ZDARMA (nestojí tah)!'
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
  if (state.status !== 'playing' || !isHeroAlive(state.hero)) return { ok: false, events };
  const stunRes = consumeHeroStunIfPresent(state);
  if (stunRes) return stunRes;
  const confRes = consumeHeroConfusionIfPresent(state);
  if (confRes) return confRes;

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
  if (state.status !== 'playing' || !isHeroAlive(state.hero)) return { ok: false, events };
  const stunRes = consumeHeroStunIfPresent(state);
  if (stunRes) return stunRes;
  const confRes = consumeHeroConfusionIfPresent(state);
  if (confRes) return confRes;

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
  if (state.status !== 'playing' || !isHeroAlive(state.hero)) return { ok: false, events };
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
  if (state.status !== 'playing' || !isHeroAlive(state.hero)) return { ok: false, events };
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
  const rawFury = hero?.currentFury || 0;
  const heroFury = Math.max(-50, rawFury);
  const getComboDmg = (base) => {
    const calculated = base + (heroFury !== 0 ? Math.round(base * (heroFury / 100)) : 0);
    return base > 0 ? Math.max(1, calculated) : 0;
  };
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
    const dmg = getComboDmg(4);
    events.push({
      type: 'log',
      text: `💪 Selský hněv! Honza získal +6 Štít a mocnou rázovou vlnou zasáhl okolí za ${dmg} DMG!`
    });
    for (const e of state.enemies) {
      if (e.hp > 0 && Math.abs(e.cell - hero.cell) <= 1) {
        dealDamage(state, e, dmg, { reason: 'honza_combo3', attackerId: hero.id }, events);
      }
    }
  } else if (hunterId === 'dragoun') {
    const dmg = getComboDmg(4);
    events.push({
      type: 'log',
      text: `💥 Kavaleristická salva! Rittmeister Jaromír vypálil kartáčovou salvu (${dmg} DMG) a zkrátil Chladnutí destiček!`
    });
    for (const e of state.enemies) {
      if (e.hp > 0 && Math.sign(e.cell - hero.cell) === hero.facing) {
        dealDamage(state, e, dmg, { reason: 'dragoon_combo3', attackerId: hero.id }, events);
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
    const dmg = getComboDmg(5);
    events.push({
      type: 'log',
      text: `🔔 Půlnoční vartování! Odbila dvanáctá hodina! Ponocný získal +6 Štít a smetl obě pole před sebou za ${dmg} DMG!`
    });
    for (const e of state.enemies) {
      if (e.hp > 0) {
        const offset = (e.cell - hero.cell) * hero.facing;
        if (offset === 1 || offset === 2) {
          dealDamage(state, e, dmg, { reason: 'ponocny_combo3', attackerId: hero.id }, events);
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
      const dmg = getComboDmg(6);
      dealDamage(state, nearestInLine, dmg, { reason: 'silak_combo3', attackerId: hero.id }, events);
      addStatus(nearestInLine, 'confusion', 1, events);
      events.push({
        type: 'log',
        text: `🏋️ Drtivý zásah činkou způsobil ${dmg} DMG a uvrhl postavu ${nearestInLine.name} do Zmatení (❓)!`
      });
    }
  } else if (hunterId === 'anglicanka') {
    applyHealToEntity(state, hero, 4, events);
    addStatus(hero, 'shield', 4, events);
    const dmg = getComboDmg(3);
    events.push({
      type: 'log',
      text: `🫖 Čaj o páté! Lady Gwendolyn si dopřála doušek Earl Grey (+4 HP, +4 Štít) a vařící čaj opařil nepřátele v dohledu za ${dmg} DMG!`
    });
    for (const e of state.enemies) {
      if (e.hp > 0 && Math.sign(e.cell - hero.cell) === hero.facing) {
        dealDamage(state, e, dmg, { reason: 'anglicanka_combo3', attackerId: hero.id }, events);
        addStatus(e, 'bleed', 2, events);
      }
    }
  } else if (hunterId === 'helsing') {
    const dmg = getComboDmg(4);
    events.push({
      type: 'log',
      text: `🏹 Kruhový rotační rozptyl! Sir Arthur Featherstone roztočil multishot mechanismus a zasáhl nepřátele stříbrnou salvou za ${dmg} DMG!`
    });
    for (const e of state.enemies) {
      if (e.hp > 0) {
        dealDamage(state, e, dmg, { reason: 'helsing_combo3', attackerId: hero.id }, events);
        addStatus(e, 'bleed', 2, events);
      }
    }
  } else if (hunterId === 'revident') {
    addStatus(hero, 'shield', 3, events);
    events.push({
      type: 'log',
      text: '📑 Finanční exekuce! Revident Ignác Šiml získal +3 Štít a zahájil daňovou kontrolu všech nočních monster!'
    });
    const dmg = getComboDmg(3);
    for (const e of state.enemies) {
      if (e.hp > 0) {
        if (hasStatus(e, 'okolkovano')) {
          dealDamage(state, e, dmg, { reason: 'revident_combo3', attackerId: hero.id }, events);
        }
        addStatus(e, 'okolkovano', 1, events);
      }
    }
  } else if (hunterId === 'zaboj') {
    addStatus(hero, 'shield', 5, events);
    hero.currentFury = (hero.currentFury || 0) + 15;
    events.push({
      type: 'fury_changed',
      heroId: hero.id,
      delta: 15,
      currentFury: hero.currentFury
    });
    const dmg = getComboDmg(4);
    events.push({
      type: 'log',
      text: `🪕 Zpěv z Černého lesa! Adolf Puchmajer zapěl hromový staroslovanský chorál (+5 Štít, +15 % Rozlícení) a ohlušil nepřátele před sebou za ${dmg} DMG se Zmatením (❓)!`
    });
    for (const e of state.enemies) {
      if (e.hp > 0) {
        const offset = (e.cell - hero.cell) * hero.facing;
        if (offset === 1 || offset === 2) {
          dealDamage(state, e, dmg, { reason: 'zaboj_combo3', attackerId: hero.id }, events);
          if (e.hp > 0) {
            addStatus(e, 'confusion', 1, events);
          }
        }
      }
    }
  } else {
    addStatus(hero, 'shield', 4, events);
    const dmg = getComboDmg(3);
    events.push({
      type: 'log',
      text: `🦅 Sokolská prostná! Venca předvedl vrcholnou sestavu s tyčí (+4 Štít), smetl nepřátele před sebou i za sebou za ${dmg} DMG a ohromil je sokolským leskem (Zmatení ❓)!`
    });
    for (const e of state.enemies) {
      if (e.hp > 0) {
        const dist = Math.abs(e.cell - hero.cell);
        if (dist === 1 || dist === 2) {
          dealDamage(state, e, dmg, { reason: 'venca_combo3', attackerId: hero.id }, events);
          addStatus(e, 'confusion', 1, events);
        }
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
  if (comboLength >= 3 && state.hero && isHeroAlive(state.hero)) {
    resolveHunterCombo3Bonus(state, state.hero, events);
  }
  delete state.comboResonanceBonusPush;
  checkSvunkBonus(state, comboLength, events);
  advanceTurnAfterPlayerAction(state, events);
  return events;
}
