// @ts-nocheck
import { NODE_TYPES } from '../config/constants.js';
import { HERO_TILES, getHeroTileDefinition } from '../config/tiles.js';
import { TALISMANS } from '../config/talismans.js';
import { STARTING_LOADOUTS } from '../config/loadouts.js';
import { createRng } from './rng.js';

export function createNewRun(seedInput = 'VENCA-1899', loadoutId = 'classic', curseLevel = 0) {
  const seed = String(seedInput || 'VENCA-1899').trim() || 'VENCA-1899';
  const rng = createRng(seed);
  const loadout = STARTING_LOADOUTS[loadoutId] || STARTING_LOADOUTS.classic;
  const deck = JSON.parse(JSON.stringify(loadout.deck));
  const cLvl = Math.max(0, Math.min(5, Number(curseLevel) || 0));
  const baseMaxHp = loadout.maxHp || 20;
  const heroMaxHp = cLvl >= 4 ? Math.max(1, baseMaxHp - 2) : baseMaxHp;

  const run = {
    seed,
    loadoutId: loadout.id,
    hunterId: loadout.hunterId || loadout.id,
    hunterName: loadout.name || 'Venca Česnekáč',
    defense: loadout.defense ?? 1,
    curseLevel: cLvl,
    rng,
    act: 1,
    heroMaxHp,
    heroHp: heroMaxHp,
    gold: 25,
    deck,
    talismans: [],
    visitedEvents: [],
    currentNodeId: null,
    completedNodeIds: [],
    map: null,
    status: 'active',
    stats: {
      battlesWon: 0,
      elitesDefeated: 0,
      bossesDefeated: 0,
      enemiesKilled: 0,
      totalDamageDealt: 0,
      totalFriendlyFire: 0,
      totalTurns: 0,
      goldEarned: 25
    }
  };

  run.map = generateActMap(run, 1);
  return run;
}

function getNodeTitle(type) {
  switch (type) {
    case NODE_TYPES.BATTLE:
      return 'Upíří hlídka';
    case NODE_TYPES.ELITE:
      return 'Elitní dráb';
    case NODE_TYPES.PUB:
      return 'Hospoda U Svěcené pípy';
    case NODE_TYPES.WORKSHOP:
      return 'Kolářská dílna';
    case NODE_TYPES.EVENT:
      return 'Podivné setkání';
    case NODE_TYPES.TREASURE:
      return 'Zapomenutá truhlice';
    case NODE_TYPES.BOSS:
      return 'Hradní Boss';
    default:
      return 'Komnata';
  }
}

function getActBossTitle(act) {
  if (act === 1) return 'Arcikníže von Sosák';
  if (act === 2) return 'Hraběnka Dagmar';
  return 'Hrabě Drákula, Pán temnot';
}

export function generateActMap(run, act) {
  const rng = run.rng;
  const prefix = `act${act}`;
  const nodes = [];

  const n0 = {
    id: `a${act}_t0_n0`,
    tier: 0,
    lane: 1,
    type: NODE_TYPES.BATTLE,
    title: act === 1 ? 'Noční vrátnice (Tutoriál)' : `Brána ${act}. aktu`,
    encounterId: act === 1 ? 'tutorial_1' : `${prefix}_battle_1`,
    next: [`a${act}_t1_n0`, `a${act}_t1_n1`]
  };
  nodes.push(n0);

  const t1Left = rng.nextFloat() < 0.65 ? NODE_TYPES.BATTLE : NODE_TYPES.EVENT;
  const t1Right = t1Left === NODE_TYPES.BATTLE ? NODE_TYPES.EVENT : NODE_TYPES.BATTLE;
  nodes.push({
    id: `a${act}_t1_n0`,
    tier: 1,
    lane: 0,
    type: t1Left,
    title: getNodeTitle(t1Left),
    encounterId: t1Left === NODE_TYPES.BATTLE ? `${prefix}_battle_1` : null,
    next: [`a${act}_t2_n0`, `a${act}_t2_n1`]
  });
  nodes.push({
    id: `a${act}_t1_n1`,
    tier: 1,
    lane: 2,
    type: t1Right,
    title: getNodeTitle(t1Right),
    encounterId: t1Right === NODE_TYPES.BATTLE ? `${prefix}_battle_1` : null,
    next: [`a${act}_t2_n1`, `a${act}_t2_n2`]
  });

  rng.shuffle([NODE_TYPES.WORKSHOP, NODE_TYPES.BATTLE, NODE_TYPES.PUB]).forEach((type, idx) => {
    nodes.push({
      id: `a${act}_t2_n${idx}`,
      tier: 2,
      lane: idx,
      type,
      title: getNodeTitle(type),
      encounterId: type === NODE_TYPES.BATTLE ? `${prefix}_battle_2` : null,
      next:
        idx === 0
          ? [`a${act}_t3_n0`]
          : idx === 1
            ? [`a${act}_t3_n0`, `a${act}_t3_n1`]
            : [`a${act}_t3_n1`]
    });
  });

  nodes.push({
    id: `a${act}_t3_n0`,
    tier: 3,
    lane: 0,
    type: NODE_TYPES.ELITE,
    title: 'Elitní strážnice',
    encounterId: `${prefix}_elite`,
    next: [`a${act}_t4_n0`, `a${act}_t4_n1`]
  });

  const t3Right = rng.nextFloat() < 0.5 ? NODE_TYPES.TREASURE : NODE_TYPES.BATTLE;
  nodes.push({
    id: `a${act}_t3_n1`,
    tier: 3,
    lane: 2,
    type: t3Right,
    title: getNodeTitle(t3Right),
    encounterId: t3Right === NODE_TYPES.BATTLE ? `${prefix}_battle_2` : null,
    next: [`a${act}_t4_n0`, `a${act}_t4_n1`]
  });

  nodes.push({
    id: `a${act}_t4_n0`,
    tier: 4,
    lane: 0,
    type: NODE_TYPES.PUB,
    title: 'Hospoda U Svěcené pípy',
    encounterId: null,
    next: [`a${act}_t5_n0`]
  });

  nodes.push({
    id: `a${act}_t4_n1`,
    tier: 4,
    lane: 2,
    type: NODE_TYPES.WORKSHOP,
    title: 'Kolářská dílna',
    encounterId: null,
    next: [`a${act}_t5_n0`]
  });

  nodes.push({
    id: `a${act}_t5_n0`,
    tier: 5,
    lane: 1,
    type: NODE_TYPES.BOSS,
    title: getActBossTitle(act),
    encounterId: `${prefix}_boss`,
    next: []
  });

  return { act, nodes };
}

export function getAvailableNodes(run) {
  if (!run.map) return [];
  if (!run.currentNodeId) {
    return run.map.nodes.filter((n) => n.tier === 0);
  }
  if (!run.completedNodeIds?.includes(run.currentNodeId)) return [];
  const cur = run.map.nodes.find((n) => n.id === run.currentNodeId);
  if (!cur) return [];
  return run.map.nodes.filter((n) => cur.next.includes(n.id));
}

export function generateBattleRewards(run, isEliteOrBoss = false) {
  const rng = run.rng;
  const choices = [];
  const ownedTileIds = new Set(run.deck.map((d) => d.id));
  const unownedTiles = Object.keys(HERO_TILES).filter((id) => !ownedTileIds.has(id));
  const pool = unownedTiles.length > 0 ? unownedTiles : Object.keys(HERO_TILES);
  const pickedTileId = rng.pick(pool);
  if (pickedTileId) {
    const def = getHeroTileDefinition(pickedTileId, 0);
    choices.push({
      type: 'tile',
      tileId: pickedTileId,
      title: `Destička: ${def.name}`,
      subtitle: `DMG ${def.dmg ?? 0} · Chladnutí ${def.cooldown}`,
      description: def.description
    });
  }

  const unownedTalismans = Object.keys(TALISMANS).filter((id) => !run.talismans.includes(id));
  if (unownedTalismans.length > 0) {
    const talId = rng.pick(unownedTalismans);
    const tal = TALISMANS[talId];
    choices.push({
      type: 'talisman',
      talismanId: talId,
      title: `${tal.badge} Talisman: ${tal.name}`,
      subtitle: 'Pasivní relikvie',
      description: tal.description
    });
  }

  const goldAmt = isEliteOrBoss ? 28 : 16;
  choices.push({
    type: 'gold',
    amount: goldAmt,
    title: `💰 Měšec hradního pokladu (+${goldAmt} dukátů)`,
    subtitle: 'Hotovost do hospody a dílny',
    description: `Přidá ${goldAmt} poctivých dukátů do měšce výpravy.`
  });

  return choices;
}

export function grantTileToRun(run, tileId) {
  const existing = run.deck.find((d) => d.id === tileId);
  if (existing && (existing.upgradeLevel || 0) < 2) {
    existing.upgradeLevel = (existing.upgradeLevel || 0) + 1;
    return existing;
  }
  const entry = { id: tileId, upgradeLevel: 0, permanentCdReduction: 0 };
  run.deck.push(entry);
  return entry;
}

export function grantTalismanToRun(run, talismanId) {
  if (!run.talismans.includes(talismanId)) {
    run.talismans.push(talismanId);
    if (talismanId === 'butcher_apron') {
      run.heroMaxHp += 2;
      run.heroHp += 2;
    }
  }
}

export function upgradeTileInRun(run, deckIdx) {
  const entry = run.deck[deckIdx];
  if (!entry || (entry.upgradeLevel || 0) >= 2) return false;
  entry.upgradeLevel = (entry.upgradeLevel || 0) + 1;
  return true;
}

export function reduceTileCooldownInRun(run, deckIdx) {
  const entry = run.deck[deckIdx];
  if (!entry) return false;
  const def = getHeroTileDefinition(entry.id, entry.upgradeLevel || 0);
  if (Math.max(1, def.cooldown - (entry.permanentCdReduction || 0)) <= 1) return false;
  entry.permanentCdReduction = (entry.permanentCdReduction || 0) + 1;
  return true;
}

export function advanceToNextActOrWin(run) {
  if (run.act < 3) {
    run.act += 1;
    run.currentNodeId = null;
    run.heroHp = Math.min(run.heroMaxHp, run.heroHp + 3);
    run.map = generateActMap(run, run.act);
    return { newAct: run.act, victory: false };
  }
  run.status = 'victory';
  return { newAct: 3, victory: true };
}
