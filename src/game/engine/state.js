// @ts-nocheck
import { createRng } from './rng.js';
import { getHeroTileDefinition } from '../config/tiles.js';
import { STARTING_LOADOUTS } from '../config/loadouts.js';
import { ENEMY_TILES, ENEMIES, getEntityIchorType, isVampireEntity, isHumanEntity } from '../config/enemies.js';
export { isVampireEntity, isHumanEntity };
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


export function canDamageFinishVampires(opts = {}) {
  if (opts.isFinisher || opts.canFinishVampires) return true;
  const r = (opts.reason || '').toLowerCase();
  const t = (opts.type || '').toLowerCase();
  if (r === 'stake_finish' || r === 'pit') return true;
  if (r.includes('stake') || r.includes('kolik')) return true;
  if (r.includes('garlic') || r.includes('cesnek') || r.includes('granat')) return true;
  if (r.includes('holy') || t === 'holy' || r.includes('kropenka') || r.includes('syringe')) return true;
  if (r.includes('silver') || r.includes('stribr') || r.includes('crossbow')) return true;
  return false;
}

export function isHeroAlive(hero) {
  if (!hero) return false;
  if (hero.deathResolved || hero.corpse) return false;
  if (hero.hp > 0) return true;
  const persistence = typeof hero.persistence === 'number' ? hero.persistence : 5;
  return Boolean(hero.isReaperActive && (persistence + hero.hp) > 0);
}

export function getAllLivingEntities(state) {
  const list = [];
  if (state.hero && isHeroAlive(state.hero)) list.push(state.hero);
  for (const e of state.enemies) {
    if (e.hp > 0 || e.isTorpid) list.push(e);
  }
  for (const p of state.props) {
    if (p.hp > 0) list.push(p);
  }
  return list;
}

export function getEntityAt(state, cell) {
  if (!isValidCell(cell, state)) return null;
  if (state.hero && isHeroAlive(state.hero) && state.hero.cell === cell) return state.hero;
  for (const e of state.enemies) {
    if ((e.hp > 0 || e.isTorpid) && e.cell === cell) return e;
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
  if (!entity || (entity.entityType === 'hero' ? !isHeroAlive(entity) : entity.hp <= 0) || !statusId || statusId === 'stagger') return;
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
      text: '💦 Kamenná kropenka se roztříštila! Gejzír svěcené vody zasáhl okolní nemrtvé za 4 DMG a vytvořil posvěcenou louži!'
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
    state.status = 'lost';
    events.push({
      type: 'log',
      text: `⚰️ ${target.name || 'Venca Česnekáč'} padl! Upíři a noční stvůry dnes zvítězili.`
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
      text: `🔥 ${entity.name} vstoupil do posvěcené louže a škvaří se (2 DMG)!`
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
  if (!target || rawAmount <= 0) return 0;
  const isTargetHero = target.entityType === 'hero' || target.id === state.hero?.id;
  if (isTargetHero && (opts.reason === 'garlic_cloud' || opts.reason === 'garlic_grenade')) {
    return 0; // All hunters are immune to garlic cloud and garlic grenade damage
  }
  if (target.hp <= 0 && target.entityType !== 'hero') {
    if (target.isTorpid && target.entityType === 'enemy') {
      if (canDamageFinishVampires(opts)) {
        target.isTorpid = false;
        delete target.statuses?.torpor;
        events.push({
          type: 'vampire_finished',
          targetId: target.id,
          cell: target.cell,
          reason: opts.reason
        });
        events.push({
          type: 'log',
          text: `✨ Ochromený ${target.name} byl definitivně zničen (${opts.reason || 'dorážecí rána'})!`
        });
        resolveEntityDeath(state, target, opts, events);
        return rawAmount;
      } else {
        events.push({
          type: 'log',
          text: `🛡️ ${target.name} je ochromený a leží na zemi! Tato zbraň ho nedokáže dorazit – použij kolík, svěcenou vodu nebo česnek!`
        });
        return 0;
      }
    }
    return 0;
  }
  if (target.isImmortal || target.kind === 'komornik') {
    events.push({
      type: 'damage_absorbed_butler',
      targetId: target.id,
      cell: target.cell,
      amount: rawAmount
    });
    events.push({
      type: 'log',
      text: `☕ ${target.name} stoicky vykrývá ${rawAmount} DMG svým tácem a ani nehne brvou: „Čaj o páté nelze rušit, pane!“`
    });
    return 0;
  }
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

  if (
    target.statuses?.okolkovano > 0 &&
    !opts.reflected &&
    opts.reason !== 'bleed' &&
    opts.reason !== 'spikes' &&
    opts.reason !== 'pit' &&
    opts.reason !== 'holy_water_puddle'
  ) {
    consumeStatus(target, 'okolkovano', 1);
    dmg += 1;
    events.push({
      type: 'tax_surcharge',
      targetId: target.id,
      cell: target.cell,
      bonusDmg: 1
    });
    events.push({
      type: 'log',
      text: `📑 Daňová přirážka! Cíl (${target.name}) měl stav [OKOLKOVÁNO] – poškození zvýšeno o +1!`
    });
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

  const baseArmor = target.armor || 0;
  const armor = Math.max(0, baseArmor - (opts.ignoreArmor || 0));
  if (
    armor > 0 &&
    dmg > 0 &&
    opts.reason !== 'bleed' &&
    opts.reason !== 'garlic_cloud' &&
    opts.reason !== 'pit' &&
    opts.reason !== 'holy_water_puddle'
  ) {
    const absorbedArmor = Math.min(armor, dmg);
    dmg -= absorbedArmor;
    events.push({
      type: 'armor_absorbed',
      targetId: target.id,
      cell: target.cell,
      absorbed: absorbedArmor,
      remainingDmg: dmg,
      text: `${target.name} ztlumil ${absorbedArmor} DMG brněním!`
    });
    events.push({
      type: 'log',
      text: `🦺 Brnění postavy ${target.name} ztlumilo ${absorbedArmor} DMG z průrazu!`
    });
    if (dmg <= 0) return 0;
  }

  const isHero = target.entityType === 'hero' || target.id === state.hero?.id;
  if (isHero) {
    target.hp -= dmg;
  } else {
    target.hp = Math.max(0, target.hp - dmg);
  }

  const persistence = isHero
    ? (typeof target.persistence === 'number' ? target.persistence : 5)
    : 0;
  const reaperCountdown = persistence + target.hp;
  const isFatal = isHero ? (reaperCountdown <= 0) : (target.hp <= 0);

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
    fatal: isFatal,
    isReaperActive: isHero && target.hp <= 0 && !isFatal,
    reaperCountdown: isHero && target.hp <= 0 ? reaperCountdown : null
  });

  if (isHero && target.hp <= 0 && !isFatal) {
    const enteredReaperNow = !target.isReaperActive;
    target.isReaperActive = true;
    target.reaperCountdown = reaperCountdown;

    if (enteredReaperNow && target.hunterId === 'honza') {
      const prevFury = target.currentFury || 0;
      target.currentFury = prevFury + 25;
      events.push({
        type: 'fury_changed',
        heroId: target.id,
        delta: 25,
        currentFury: target.currentFury
      });
      events.push({
        type: 'log',
        text: `🥖 Zoufalý furiant! Chasník Honza na prahu Zubaté pociťuje nával slepé zuřivosti (+25 % Bojového rozlícení, nyní: ${target.currentFury} %)!`
      });
    }

    if (enteredReaperNow && (target.hunterId === 'venca' || target.hunterId === 'classic' || target.kind === 'venca')) {
      events.push({
        type: 'log',
        text: `💣 Poslední záchrana! Sokol Venca na prahu Zubaté odpálil Česnekový granát přímo pod nohama!`
      });
      const radiusCells = [target.cell - 1, target.cell, target.cell + 1].filter((c) => isValidCell(c, state));
      for (const c of radiusCells) {
        if (state.terrain[c]?.type !== 'pit') {
          state.terrain[c] = { type: 'garlic_cloud', duration: 2 };
          events.push({ type: 'terrain_spawn', terrainType: 'garlic_cloud', cell: c });
        }
        const ent = getEntityAt(state, c);
        if (ent && ent.id !== target.id && ent.entityType !== 'hero') {
          addStatus(ent, 'confusion', 1, events);
          if (ent.isTorpid) {
            dealDamage(state, ent, 2, { reason: 'garlic_grenade', isFinisher: true, canFinishVampires: true }, events);
          }
        }
      }
    }

    if (state.queue && state.queue.length > 0) {
      for (const instanceId of state.queue) {
        const tile = state.hand?.find((t) => t.instanceId === instanceId);
        if (tile) tile.inQueue = false;
      }
      state.queue = [];
      events.push({
        type: 'queue_cleared_reaper',
        targetId: target.id,
        cell: target.cell,
        text: `💀 Zubatá! Šok z rány vyrazil lovci ${target.name} zbraň z ruky a vyprázdnil frontu akcí!`
      });
      events.push({
        type: 'log',
        text: `💀 Zubatá! Zásah srazil lovce na práh smrti – fronta akcí byla okamžitě vyprázdněna a destičky vráceny na opasek!`
      });
    }
    events.push({
      type: 'reaper_triggered',
      targetId: target.id,
      cell: target.cell,
      hp: target.hp,
      persistence,
      reaperCountdown,
      text: `💀 Zubatá na krku! (${target.hp} HP, Odpočet: ${reaperCountdown})`
    });
    events.push({
      type: 'log',
      text: `💀 Zubatá na krku! ${target.name} se ocitá na prahu smrti (${target.hp} HP)! Odpočet Zubaté: ${reaperCountdown}.`
    });
  } else if (isHero && target.hp > 0) {
    target.isReaperActive = false;
    delete target.reaperCountdown;
  }

  if (dmg > 0 && (target.entityType === 'hero' || target.id === state.hero?.id) && (target.hunterId === 'honza' || state.hero?.hunterId === 'honza')) {
    const heroRef = state.hero || target;
    heroRef.currentFury = (heroRef.currentFury || 0) + 10;
    events.push({
      type: 'fury_accumulated',
      targetId: heroRef.id,
      cell: heroRef.cell,
      furyAdded: 10,
      currentFury: heroRef.currentFury
    });
    events.push({
      type: 'log',
      text: `🔨 Selský furiant! Zásah do těla Honzu rozpálil do běla (+10 % Rozlícení, nyní ${heroRef.currentFury > 0 ? '+' : ''}${heroRef.currentFury} %)!`
    });
  }

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

  if (isFatal) {
    if (target.entityType === 'enemy' && isVampireEntity(target) && !target.deathResolved) {
      target.isTorpid = true;
      target.torporTurnsLeft = 2;
      target.statuses ||= {};
      target.statuses.torpor = 2;
      target.actionQueue = [];
      target.nextAction = null;
      target.queueState = 'EMPTY';
      events.push({
        type: 'vampire_torpor',
        targetId: target.id,
        targetName: target.name,
        cell: target.cell,
        durationRounds: 2
      });
      events.push({
        type: 'log',
        text: `💤 ${target.name} ztratil všechny síly a v bezvědomí se hroutí k zemi (0 HP)! Je ochromený – za 2 kola opět povstane, pokud ho lovec nedorazí kolíkem!`
      });
    } else {
      resolveEntityDeath(state, target, opts, events);
    }
  }
  return dmg;
}

export function applyHealToEntity(state, target, amount, events = []) {
  if (!target || amount <= 0) return 0;
  const maxHp = target.maxHp || 20;
  const healed = Math.max(0, Math.min(maxHp - target.hp, amount));
  if (healed > 0) {
    target.hp += healed;
    if (target.entityType === 'hero' && target.hp >= 1 && target.isReaperActive) {
      target.isReaperActive = false;
      delete target.reaperCountdown;
      events.push({
        type: 'reaper_cleared',
        targetId: target.id,
        cell: target.cell,
        hp: target.hp,
        text: `✨ Zubatá ustoupila! ${target.name} se vyléčil na ${target.hp} HP.`
      });
      events.push({
        type: 'log',
        text: `✨ Zubatá ustupuje! ${target.name} se vyléčil na ${target.hp} HP a je mimo bezprostřední ohrožení života.`
      });
    } else if (target.entityType === 'hero' && target.isReaperActive) {
      target.reaperCountdown = (target.persistence || 5) + target.hp;
    }
    events.push({
      type: 'heal',
      targetId: target.id,
      cell: target.cell,
      amount: healed,
      hp: target.hp,
      remainingHp: target.hp
    });
  }
  return healed;
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

export function pushEntity(state, target, direction, distance, events = [], opts = {}) {
  if (!target || target.hp <= 0 || distance <= 0 || !direction) return;
  const dir = Math.sign(direction);
  let actualMoved = 0;
  const pusher = opts.pusher || null;
  const rawPusherFury = typeof opts.pusherFury === 'number' ? opts.pusherFury : (pusher?.currentFury || 0);
  const pusherFury = Math.max(-50, rawPusherFury);
  const isSilak = pusher?.hunterId === 'silak';

  const computeCollisionDamage = (unmoved) => {
    const furyBonus = pusherFury !== 0 ? Math.round(unmoved * (pusherFury / 100)) : 0;
    let dmg = unmoved + furyBonus;
    if (unmoved > 0) dmg = Math.max(1, dmg);
    if (isSilak) dmg += 1;
    return { collisionDmg: dmg, furyBonus };
  };

  const rewardSilakIfApplicable = () => {
    if (isSilak && !opts._silakRewarded && pusher && pusher.hp > 0) {
      opts._silakRewarded = true;
      addStatus(pusher, 'shield', 2, events);
      events.push({
        type: 'log',
        text: '🏋️ Cirkusová dominance! Srážka pobavila publikum (+1 kolizní DMG, Gustav získává +2 Štít)!'
      });
    }
  };

  for (let step = 0; step < distance && target.hp > 0; step++) {
    const nextCell = target.cell + dir;
    if (!isValidCell(nextCell, state)) {
      const unmoved = distance - actualMoved;
      const { collisionDmg, furyBonus } = computeCollisionDamage(unmoved);
      rewardSilakIfApplicable();
      events.push({
        type: 'collision_wall',
        targetId: target.id,
        cell: target.cell,
        direction: dir,
        damage: collisionDmg,
        baseDamage: unmoved,
        furyBonus
      });
      events.push({
        type: 'log',
        text: `🧱 ${target.name} narazil do hradní zdi (${collisionDmg} DMG za neprojitá pole${furyBonus > 0 ? ` – vč. +${furyBonus} z Rozlícení` : furyBonus < 0 ? ` – vč. ${furyBonus} ze Zchlazení` : ''})!`
      });
      dealDamage(state, target, collisionDmg, { reason: 'wall_collision', attackerId: pusher?.id }, events);
      break;
    }

    const blocker = getEntityAt(state, nextCell);
    if (blocker) {
      const unmoved = distance - actualMoved;
      const { collisionDmg, furyBonus } = computeCollisionDamage(unmoved);
      rewardSilakIfApplicable();
      if (blocker.entityType === 'prop' && blocker.kind === 'barrel') {
        events.push({
          type: 'collision_barrel',
          targetId: target.id,
          barrelId: blocker.id,
          cell: nextCell,
          damage: collisionDmg,
          baseDamage: unmoved,
          furyBonus
        });
        events.push({
          type: 'log',
          text: `🛢️ ${target.name} vletěl do sudu se zelím (oba ${collisionDmg} DMG za neprojitá pole${furyBonus > 0 ? ` – vč. +${furyBonus} z Rozlícení` : furyBonus < 0 ? ` – vč. ${furyBonus} ze Zchlazení` : ''})! Sud praská!`
        });
        dealDamage(state, blocker, collisionDmg, { reason: 'barrel_smash', attackerId: pusher?.id }, events);
        dealDamage(state, target, collisionDmg, { reason: 'barrel_smash', attackerId: pusher?.id }, events);
        if (target.hp > 0) addStatus(target, 'confusion', 1, events);
        if (blocker.hp <= 0 && target.hp > 0 && !getEntityAt(state, nextCell)) {
          const from = target.cell;
          target.cell = nextCell;
          actualMoved++;
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
          cell: nextCell,
          damage: collisionDmg,
          baseDamage: unmoved,
          furyBonus
        });
        events.push({
          type: 'log',
          text: `💦 ${target.name} narazil do kropenky (oba ${collisionDmg} DMG za neprojitá pole${furyBonus > 0 ? ` – vč. +${furyBonus} z Rozlícení` : furyBonus < 0 ? ` – vč. ${furyBonus} ze Zchlazení` : ''})!`
        });
        dealDamage(state, blocker, collisionDmg, { reason: 'font_smash', attackerId: pusher?.id }, events);
        dealDamage(state, target, collisionDmg, { reason: 'font_smash', attackerId: pusher?.id }, events);
        if (blocker.hp <= 0 && target.hp > 0 && !getEntityAt(state, nextCell)) {
          const from = target.cell;
          target.cell = nextCell;
          actualMoved++;
          events.push({ type: 'push_move', targetId: target.id, from, to: nextCell });
          triggerCellTerrainOnEnter(state, target, nextCell, events);
        }
        break;
      }

      events.push({
        type: 'collision_entity',
        pushedId: target.id,
        blockerId: blocker.id,
        cell: nextCell,
        damage: collisionDmg,
        baseDamage: unmoved,
        furyBonus
      });
      const quote = STRINGS.collisionQuotes[0];
      events.push({
        type: 'log',
        text: `💥 Srážka! ${target.name} vrazil do postavy ${blocker.name} (oba ${collisionDmg} DMG za neprojitá pole${furyBonus > 0 ? ` – vč. +${furyBonus} z Rozlícení` : furyBonus < 0 ? ` – vč. ${furyBonus} ze Zchlazení` : ''})! ${quote}`
      });
      dealDamage(state, target, collisionDmg, { reason: 'entity_collision', attackerId: pusher?.id }, events);
      dealDamage(state, blocker, collisionDmg, { reason: 'entity_collision', attackerId: pusher?.id }, events);
      break;
    }

    const from = target.cell;
    target.cell = nextCell;
    actualMoved++;
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
  const heroCell = state.hero?.cell;
  const dist = typeof heroCell === 'number' ? Math.abs(heroCell - enemy.cell) : 999;
  const canAdvance =
    typeof heroCell === 'number' &&
    dist > 1 &&
    canEnemyStepTo(state, enemy, enemy.cell + enemy.facing);

  if (
    enemy.actionQueue.length >= cap ||
    (enemy.archetype === 'fodder' && enemy.actionQueue.length >= 1) ||
    (remainingReady.length === 0 && !canAdvance)
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
    defense: def.defense || 0,
    armor: typeof def.armor === 'number' ? def.armor : 0,
    fury:
      typeof def.fury === 'number'
        ? def.fury
        : def.isBoss
        ? 25
        : def.isElite || def.archetype === 'brute'
        ? 25
        : def.archetype === 'fodder' || def.archetype === 'ranged' || def.archetype === 'support'
        ? 5
        : 10,
    currentFury:
      typeof def.fury === 'number'
        ? def.fury
        : def.isBoss
        ? 25
        : def.isElite || def.archetype === 'brute'
        ? 25
        : def.archetype === 'fodder' || def.archetype === 'ranged' || def.archetype === 'support'
        ? 5
        : 10,
    backstabBonus: typeof def.backstabBonus === 'number' ? def.backstabBonus : 50,
    cell,
    facing,
    flying: Boolean(def.flying),
    ichor: getEntityIchorType(enemyId, 'enemy', def.name),
    frontShield: Boolean(def.frontShield),
    statuses: (def.defense || 0) > 0 ? { shield: def.defense } : {},
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
    opts.heroMaxHp ||
    STARTING_LOADOUTS[hunterId]?.maxHp ||
    20;
  const heroHp = Math.min(heroMaxHp, opts.heroHp ?? heroMaxHp);

  const defaultDecks = {
    helsing: [
      { id: 'repeating_crossbow', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'silver_bolt_salvo', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'winch_reload_kick', upgradeLevel: 0, permanentCdReduction: 0 }
    ],
    revident: [
      { id: 'gov_stake_1884', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'brass_stamp_denied', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'rast_gasser_revolver', upgradeLevel: 0, permanentCdReduction: 0 }
    ],
    zaboj: [
      { id: 'zaboj_mallet', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'cardboard_varyto', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'linden_stakes', upgradeLevel: 0, permanentCdReduction: 0 }
    ],
    silak: [
      { id: 'barbell_slam', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'kettlebell_toss', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'iron_flex', upgradeLevel: 0, permanentCdReduction: 0 }
    ],
    anglicanka: [
      { id: 'silver_parasol', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'boiling_tea', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'royal_etiquette', upgradeLevel: 0, permanentCdReduction: 0 }
    ],
    ponocny: [
      { id: 'halberd_sweep', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'watchman_lantern', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'watchman_horn', upgradeLevel: 0, permanentCdReduction: 0 }
    ],
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
      { id: 'falcon_claw', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'garlic_grenade', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'skok_pres_kozu', upgradeLevel: 0, permanentCdReduction: 0 }
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
    helsing: { name: 'Sir Arthur Featherstone', givenName: 'Arthur', epithet: 'Britský lovec trofejí' },
    revident: { name: 'Revident Ignác Šiml', givenName: 'Ignác', epithet: 'Císařský daňový exekutor' },
    zaboj: { name: 'Adolf Puchmajer', givenName: 'Adolf', epithet: 'Vlastenecký pěvec v rouše Zábojově' },
    silak: { name: 'Silák Gustav Železný', givenName: 'Gustav', epithet: 'Cirkusový lamač podkov' },
    anglicanka: { name: 'Lady Gwendolyn Sterling', givenName: 'Gwendolyn', epithet: 'Viktoriánská dáma' },
    ponocny: { name: 'Ponocný Bartoloměj Klika', givenName: 'Bartoloměj', epithet: 'Strážce půlnoční hodiny' },
    honza: { name: 'Chasník Honza Buchta', givenName: 'Honza', epithet: 'Selský chasník' },
    dragoun: { name: 'Rittmeister Jaromír Vraný', givenName: 'Jaromír', epithet: 'Vysloužilý dragoun' },
    zlodejka: { name: 'Kapsářka Káča Pavučina', givenName: 'Káča', epithet: 'Úskočná zlodějka' },
    venca: { name: 'Sokol Venca Česnek', givenName: 'Venca', epithet: 'Sokolský cvičenec a pěstitel česneku' },
    classic: { name: 'Sokol Venca Česnek', givenName: 'Venca', epithet: 'Sokolský cvičenec a pěstitel česneku' }
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
      hunterId === 'helsing'
        ? 'hero.helsing'
        : hunterId === 'revident'
        ? 'hero.revident'
        : hunterId === 'zaboj'
        ? 'hero.zaboj'
        : hunterId === 'silak'
        ? 'hero.silak'
        : hunterId === 'anglicanka'
        ? 'hero.anglicanka'
        : hunterId === 'ponocny'
        ? 'hero.ponocny'
        : hunterId === 'honza'
        ? 'hero.honza'
        : hunterId === 'dragoun'
        ? 'hero.dragoun'
        : hunterId === 'zlodejka'
        ? 'hero.zlodejka'
        : 'hero.idle',
    maxHp: heroMaxHp,
    hp: heroHp,
    defense:
      typeof opts.defense === 'number'
        ? opts.defense
        : hunterId === 'revident' || hunterId === 'ponocny' || hunterId === 'dragoun' || hunterId === 'anglicanka' || hunterId === 'zlodejka'
        ? 2
        : hunterId === 'helsing' || hunterId === 'zaboj' || hunterId === 'silak' || hunterId === 'classic' || hunterId === 'venca'
        ? 1
        : 0,
    fury:
      typeof opts.fury === 'number'
        ? opts.fury
        : STARTING_LOADOUTS[hunterId]?.fury ?? 10,
    currentFury:
      typeof opts.fury === 'number'
        ? opts.fury
        : STARTING_LOADOUTS[hunterId]?.fury ?? 10,
    backstabBonus:
      typeof opts.backstabBonus === 'number'
        ? opts.backstabBonus
        : STARTING_LOADOUTS[hunterId]?.backstabBonus ?? 50,
    armor:
      typeof opts.armor === 'number'
        ? opts.armor
        : STARTING_LOADOUTS[hunterId]?.armor ?? 0,
    persistence:
      typeof opts.persistence === 'number'
        ? opts.persistence
        : STARTING_LOADOUTS[hunterId]?.persistence ?? 5,
    maxPersistence:
      typeof opts.maxPersistence === 'number'
        ? opts.maxPersistence
        : (typeof opts.persistence === 'number'
            ? opts.persistence
            : (STARTING_LOADOUTS[hunterId]?.persistence ?? 5)),
    isReaperActive: heroHp <= 0,
    reaperCountdown: heroHp <= 0
      ? ((typeof opts.persistence === 'number' ? opts.persistence : 5) + heroHp)
      : null,
    cell: enc.heroCell ?? 2,
    facing: enc.heroFacing ?? 1,
    flying: false,
    ichor: 'red',
    bumpCooldown: 0,
    summonCooldown: 0,
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
      (enc.isBoss || ent.id.includes('nochtic') || ent.id.includes('drakula') || ent.id.includes('dracula'))
    ) {
      ent.maxHp = Math.ceil(ent.maxHp * 1.25);
      ent.hp = ent.maxHp;
      ent.statuses = ent.statuses || {};
      ent.statuses.empower = (ent.statuses.empower || 0) + 1;
    }
    return ent;
  });

  if (hero.defense > 0) {
    hero.statuses = hero.statuses || {};
    hero.statuses.shield = (hero.statuses.shield || 0) + hero.defense;
  }
  const occupiedCells = new Set([hero.cell, ...enemies.map((e) => e.cell)]);
  const props = [];
  if (enc.props) {
    for (const pSpec of enc.props) {
      if (pSpec.cell >= 0 && pSpec.cell < boardSize && !occupiedCells.has(pSpec.cell)) {
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

  const reinforcements = (enc.reinforcements || []).map((r, idx) => {
    const normalizedGate = r.gateCell === 0 ? 0 : boardSize - 1;
    const initialTurns = Math.max(1, r.turnDelay - (curseLevel >= 1 ? 1 : 0));
    return {
      id: `reinf_${idx}`,
      turnsRemaining: initialTurns,
      baseDelay: r.turnDelay,
      gatePref: normalizedGate,
      gateCell: normalizedGate,
      lockedGateCell: null,
      isLocked: false,
      baseEnemyId: r.enemyId,
      enemyId: r.enemyId,
      candidatePool: Array.isArray(r.candidatePool) && r.candidatePool.length > 0
        ? [...r.candidatePool]
        : [r.enemyId],
      tacticalRole: getEnemyTacticalRole(r.enemyId),
      lockReason: 'standard',
      lockReasonLabel: 'Standardní nástup',
      roleReason: 'fixed',
      roleReasonLabel: 'Předepsaná hlídka',
      spawned: false
    };
  });

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
    heroStartedTurnInReaper: heroHp <= 0,
    enemies,
    props,
    terrain,
    hand,
    queue: [],
    reinforcements,
    cellBlood: {},
    log: [`⚔️ Bitva začíná: ${enc.name}! ${hero.name} tasí výzbroj do boje.`],
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

  // Lock & telegraph any reinforcement that begins at <= 2 turns remaining
  const initReservedGates = new Set();
  for (const r of state.reinforcements) {
    if (!r.spawned && r.turnsRemaining <= 2) {
      lockAndTelegraphReinforcement(state, r, initReservedGates, initEvents, { emitLog: true });
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

export function getEnemyTacticalRole(enemyOrId) {
  const def =
    typeof enemyOrId === 'string'
      ? ENEMIES[enemyOrId] || {}
      : enemyOrId || {};
  if (
    def.archetype === 'brute' ||
    def.archetype === 'shielder' ||
    def.frontShield ||
    (def.armor || 0) >= 1
  ) {
    return 'frontline';
  }
  if (def.archetype === 'ranged' || def.archetype === 'support') {
    return 'backline';
  }
  return 'flanker';
}

export function getTacticalRoleMeta(role) {
  if (role === 'frontline') {
    return { icon: '🛡️', shortLabel: 'Průlom', label: 'Přední linie (Průlom)' };
  }
  if (role === 'backline') {
    return { icon: '🏹', shortLabel: 'Zadní voj', label: 'Zadní voj (Palba / Podpora)' };
  }
  return { icon: '🦇', shortLabel: 'Slídil', label: 'Slídil (Rychlý obchvat)' };
}

export function selectComplementaryReinforcementEnemy(state, reinf = {}) {
  const fallbackId = reinf.enemyId || reinf.baseEnemyId || 'netopyr';
  const pool =
    Array.isArray(reinf.candidatePool) && reinf.candidatePool.length > 0
      ? reinf.candidatePool.filter((id) => Boolean(ENEMIES[id]))
      : [fallbackId];

  if (reinf.lockEnemy || pool.length <= 1) {
    const chosenId = pool[0] || fallbackId;
    return {
      enemyId: chosenId,
      role: getEnemyTacticalRole(chosenId),
      reason: 'fixed',
      reasonLabel: 'Předepsaná hlídka'
    };
  }

  const activeEnemies = (state?.enemies || []).filter((e) => e.hp > 0 || e.isTorpid);
  let frontlineCount = 0;
  let backlineCount = 0;
  let flankerCount = 0;
  const activeKinds = new Set();

  for (const e of activeEnemies) {
    activeKinds.add(e.kind || e.id);
    const r = getEnemyTacticalRole(e);
    if (r === 'frontline') frontlineCount++;
    else if (r === 'backline') backlineCount++;
    else flankerCount++;
  }

  let desiredRole = 'frontline';
  let reason = 'frontline_needed';
  let reasonLabel = 'Posílení přední linie';

  if (frontlineCount === 0) {
    desiredRole = 'frontline';
    reason = 'frontline_needed';
    reasonLabel = 'Posílení přední linie';
  } else if (backlineCount === 0) {
    desiredRole = 'backline';
    reason = 'ranged_support';
    reasonLabel = 'Palebná a podpůrná záloha';
  } else if (flankerCount === 0) {
    desiredRole = 'flanker';
    reason = 'flank_pressure';
    reasonLabel = 'Rychlý obchvat z boku';
  } else {
    desiredRole = frontlineCount <= backlineCount ? 'frontline' : 'backline';
    reason = 'tactical_synergy';
    reasonLabel = 'Doplnění bojové sestavy';
  }

  let bestId = pool[0] || fallbackId;
  let bestScore = -999;

  for (const candId of pool) {
    const role = getEnemyTacticalRole(candId);
    let score = 0;
    if (role === desiredRole) {
      score += 40;
    } else if (desiredRole === 'backline' && role === 'flanker') {
      score += 18;
    } else if (desiredRole === 'frontline' && role === 'flanker') {
      score += 12;
    }
    if (!activeKinds.has(candId)) {
      score += 22;
    }
    if (candId === (reinf.baseEnemyId || reinf.enemyId)) {
      score += 5;
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = candId;
    }
  }

  const chosenRole = getEnemyTacticalRole(bestId);
  return {
    enemyId: bestId,
    role: chosenRole,
    reason,
    reasonLabel
  };
}

export function scoreReinforcementGate(state, gateCell, enemyId, opts = {}) {
  const boardSize = state?.boardSize || 7;
  const heroCell = state?.hero?.cell ?? Math.floor(boardSize / 2);
  const heroFacing = state?.hero?.facing ?? 1;
  const def = ENEMIES[enemyId] || {};
  const role = getEnemyTacticalRole(def);

  let score = 0;
  let reason = 'standard';
  let reasonLabel = 'Standardní nástup';

  const occ = getEntityAt(state, gateCell);
  if (!occ) {
    score += 100;
  } else if (occ.entityType === 'hero') {
    score -= 140;
    reason = 'hero_blocking';
    reasonLabel = 'Brána blokována lovcem';
  } else {
    score -= 95;
    reason = 'occupied';
    reasonLabel = 'Brána obsazena';
  }

  if (opts.reservedGates && opts.reservedGates.has(gateCell)) {
    score -= 65;
  }

  const terr = state?.terrain?.[gateCell];
  if (terr?.type === 'pit') {
    if (!def.flying) {
      score -= 500;
    } else {
      score += 15;
    }
  } else if (
    terr?.type === 'spikes' ||
    terr?.type === 'holy_water_puddle' ||
    terr?.type === 'garlic_cloud'
  ) {
    score -= 35;
  }

  const activeEnemies = (state?.enemies || []).filter((e) => e.hp > 0 || e.isTorpid);
  const leftEnemies = activeEnemies.filter((e) => e.cell < heroCell).length;
  const rightEnemies = activeEnemies.filter((e) => e.cell > heroCell).length;
  const isLeftGate = gateCell === 0;

  if (!occ) {
    if (isLeftGate && leftEnemies < rightEnemies) {
      score += 45;
      reason = 'pincer_flank';
      reasonLabel = 'Obklíčení z nechráněného boku';
    } else if (!isLeftGate && rightEnemies < leftEnemies) {
      score += 45;
      reason = 'pincer_flank';
      reasonLabel = 'Obklíčení z nechráněného boku';
    } else {
      const dirFromHero = Math.sign(gateCell - heroCell);
      if (dirFromHero !== 0 && dirFromHero === -heroFacing) {
        score += 28;
        reason = 'rear_ambush';
        reasonLabel = 'Vpád lovci do zad';
      }
    }
  }

  const dist = Math.abs(gateCell - heroCell);
  if (role === 'backline') {
    if (dist >= 3) score += 20;
    else if (dist <= 1) score -= 20;
  } else if (dist === 0) {
    score -= 50;
  } else if (dist >= 2) {
    score += 10;
  }

  if (typeof opts.preferredGate === 'number' && opts.preferredGate === gateCell) {
    score += 6;
  }

  return {
    gateCell,
    score,
    isBlocked: Boolean(occ),
    isLethalPit: Boolean(terr?.type === 'pit' && !def.flying),
    reason,
    reasonLabel
  };
}

export function selectSmartReinforcementGate(state, reinf = {}, reservedGates = new Set()) {
  const boardSize = state?.boardSize || 7;
  const rightCell = boardSize - 1;
  const pref =
    typeof reinf.gatePref === 'number'
      ? reinf.gatePref === 0
        ? 0
        : rightCell
      : typeof reinf.gateCell === 'number'
      ? reinf.gateCell === 0
        ? 0
        : rightCell
      : null;

  const leftEval = scoreReinforcementGate(state, 0, reinf.enemyId, {
    preferredGate: pref,
    reservedGates
  });
  const rightEval = scoreReinforcementGate(state, rightCell, reinf.enemyId, {
    preferredGate: pref,
    reservedGates
  });

  const chosen = rightEval.score > leftEval.score ? rightEval : leftEval;
  const other = chosen === rightEval ? leftEval : rightEval;

  if (pref !== null && chosen.gateCell !== pref && (other.isBlocked || other.isLethalPit)) {
    chosen.reason = 'rerouted_clear_gate';
    chosen.reasonLabel = 'Přesun k volné bráně';
  }

  return chosen;
}

export function lockAndTelegraphReinforcement(
  state,
  reinf,
  reservedGates = new Set(),
  events = [],
  opts = {}
) {
  if (!state || !reinf || reinf.spawned) return reinf;
  const roleRes = selectComplementaryReinforcementEnemy(state, reinf);
  reinf.enemyId = roleRes.enemyId;
  reinf.tacticalRole = roleRes.role;
  reinf.roleReason = roleRes.reason;
  reinf.roleReasonLabel = roleRes.reasonLabel;

  const gateRes = selectSmartReinforcementGate(state, reinf, reservedGates);
  reinf.gateCell = gateRes.gateCell;
  reinf.lockedGateCell = gateRes.gateCell;
  reinf.isLocked = true;
  reinf.lockReason = gateRes.reason;
  reinf.lockReasonLabel = gateRes.reasonLabel;

  reservedGates.add(gateRes.gateCell);

  if (opts.emitEvents !== false) {
    const def = ENEMIES[reinf.enemyId];
    events.push({
      type: 'reinf_telegraphed',
      reinfId: reinf.id,
      gateCell: reinf.gateCell,
      enemyId: reinf.enemyId,
      enemyName: def?.name || reinf.enemyId,
      turnsRemaining: reinf.turnsRemaining,
      tacticalRole: reinf.tacticalRole,
      lockReason: reinf.lockReason,
      lockReasonLabel: reinf.lockReasonLabel,
      roleReasonLabel: reinf.roleReasonLabel
    });

    if (opts.emitLog && reinf.turnsRemaining > 0) {
      const gateName =
        reinf.gateCell === 0
          ? 'Levé brány (pole 1)'
          : `Pravé brány (pole ${reinf.gateCell + 1})`;
      const turnsWord = reinf.turnsRemaining === 1 ? 'tah' : 'tahy';
      events.push({
        type: 'log',
        text: `👀 Za mříží ${gateName} se chystá posila: ${def?.name || reinf.enemyId} (za ${reinf.turnsRemaining} ${turnsWord} · ${reinf.lockReasonLabel})!`
      });
    }
  }

  return reinf;
}

export function getSortedEnemiesByInitiative(state) {
  return state.enemies.filter((e) => e.hp > 0).sort((a, b) => a.cell - b.cell);
}

export const getLivingEnemiesLeftToRight = getSortedEnemiesByInitiative;

