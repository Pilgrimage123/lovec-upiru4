// @ts-nocheck
import { NODE_TYPES } from '../config/constants.js';
import { HERO_TILES, getHeroTileDefinition } from '../config/tiles.js';
import { TALISMANS } from '../config/talismans.js';
import { STARTING_LOADOUTS } from '../config/loadouts.js';
import { queryEncounters, ENCOUNTERS } from '../config/encounters.js';
import { createRng } from './rng.js';

export const ROUTE_ARCHETYPES = {
  0: {
    lane: 0,
    name: 'Severní výspa',
    tag: 'Vysoké riziko',
    description: 'Nebezpečné patroly, elitní drábi a štědrá kořist.',
    threatModifier: 1,
    preferredArchetype: 'brute_force'
  },
  1: {
    lane: 1,
    name: 'Císařská magistrála',
    tag: 'Císařská silnice',
    description: 'Vyvážený taktický průzkum s dílnami a šarvátkami.',
    threatModifier: 0,
    preferredArchetype: 'disruption'
  },
  2: {
    lane: 2,
    name: 'Jižní hradební úvoz',
    tag: 'Zásobovací stezka',
    description: 'Hostince, podivná setkání a méně početné hlídky.',
    threatModifier: -1,
    preferredArchetype: 'swarm'
  }
};

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
    fury: loadout.fury ?? 10,
    armor: loadout.armor ?? 0,
    backstabBonus: loadout.backstabBonus ?? 50,
    persistence: loadout.persistence ?? 5,
    maxPersistence: loadout.persistence ?? 5,
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

export function getNodeTitle(type) {
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
  return 'Hrabě Leopold von Nochtic';
}

/**
 * Procedural DAG Map Generator with Threat Budget & Tactical Synergy Archetypes.
 * Generates an interconnected 6-tier graph per Act with deterministic seed RNG.
 */
export function generateActMap(run, act) {
  const rng = run.rng || createRng(`${run.seed}_act${act}`);
  const tiers = [[], [], [], [], [], []];
  const usedEncounterIds = [];

  // =========================================================================
  // 1. TIER TOPOLOGY GENERATION (6 Tiers: 0 to 5)
  // =========================================================================

  // TIER 0: Entry Point
  if (act === 1) {
    // Act 1 starts with a single entry gate
    tiers[0].push({
      lane: 1,
      type: NODE_TYPES.BATTLE,
      isTutorial: !run.stats || run.stats.battlesWon === 0
    });
  } else {
    // Acts 2 & 3 give an immediate strategic lane choice (Left Vanguard vs Right Bypass)
    tiers[0].push({ lane: 0, type: NODE_TYPES.BATTLE });
    tiers[0].push({ lane: 2, type: NODE_TYPES.BATTLE });
  }

  // TIER 1: First Branching Exploration (2 lanes)
  tiers[1].push({ lane: 0, type: NODE_TYPES.BATTLE });
  const t1RightType = rng.nextFloat() < 0.6 ? NODE_TYPES.EVENT : NODE_TYPES.BATTLE;
  tiers[1].push({ lane: 2, type: t1RightType });

  // TIER 2: Strategic Crossroads (3 lanes: high risk battle, center workshop/battle, pub/event)
  tiers[2].push({ lane: 0, type: NODE_TYPES.BATTLE });
  const t2CenterType = rng.nextFloat() < 0.5 ? NODE_TYPES.WORKSHOP : NODE_TYPES.BATTLE;
  tiers[2].push({ lane: 1, type: t2CenterType });
  const t2RightType = rng.nextFloat() < 0.55 ? NODE_TYPES.PUB : NODE_TYPES.EVENT;
  tiers[2].push({ lane: 2, type: t2RightType });

  // TIER 3: High-Stakes Trial (Lane 0 guaranteed Elite; Lane 2 Treasure or Battle)
  tiers[3].push({ lane: 0, type: NODE_TYPES.ELITE });
  if (rng.nextFloat() < 0.65) {
    // Occasional 3-lane expansion in Tier 3
    const t3CenterType = rng.nextFloat() < 0.5 ? NODE_TYPES.BATTLE : NODE_TYPES.EVENT;
    tiers[3].push({ lane: 1, type: t3CenterType });
  }
  const t3RightType = rng.nextFloat() < 0.5 ? NODE_TYPES.TREASURE : NODE_TYPES.BATTLE;
  tiers[3].push({ lane: 2, type: t3RightType });

  // TIER 4: Pre-Boss Preparation (Workshop + Pub for gearing and healing)
  tiers[4].push({
    lane: 0,
    type: rng.nextFloat() < 0.35 ? NODE_TYPES.BATTLE : NODE_TYPES.WORKSHOP
  });
  tiers[4].push({
    lane: 2,
    type: NODE_TYPES.PUB
  });

  // TIER 5: The Act Boss Chamber (All paths converge here)
  tiers[5].push({
    lane: 1,
    type: NODE_TYPES.BOSS
  });

  // =========================================================================
  // 2. ASSIGN NODE IDENTIFIERS & BASE FIELDS
  // =========================================================================

  const allNodes = [];
  tiers.forEach((tierList, tierIdx) => {
    // Sort tier nodes by lane so rendering is clean and predictable
    tierList.sort((a, b) => a.lane - b.lane);
    tierList.forEach((node, nodeIdx) => {
      node.id = `a${act}_t${tierIdx}_n${nodeIdx}`;
      node.tier = tierIdx;
      node.next = [];
      node.prev = [];
      allNodes.push(node);
    });
  });

  // =========================================================================
  // 3. DIRECTED ACYCLIC GRAPH (DAG) FORWARD & BACKWARD EDGE ROUTING
  // =========================================================================

  for (let t = 0; t < 5; t++) {
    const curNodes = tiers[t];
    const nxtNodes = tiers[t + 1];

    // Connect nodes based on lane proximity (|laneA - laneB| <= 1, or single convergence)
    curNodes.forEach((nodeA) => {
      nxtNodes.forEach((nodeB) => {
        const canConnect =
          curNodes.length === 1 ||
          nxtNodes.length === 1 ||
          Math.abs(nodeA.lane - nodeB.lane) <= 1;

        if (canConnect) {
          if (!nodeA.next.includes(nodeB.id)) nodeA.next.push(nodeB.id);
          if (!nodeB.prev.includes(nodeA.id)) nodeB.prev.push(nodeA.id);
        }
      });
    });

    // Invariant Check 1: Ensure every node in current tier has at least 1 outgoing edge
    curNodes.forEach((nodeA) => {
      if (nodeA.next.length === 0) {
        let closest = nxtNodes[0];
        let minDist = 999;
        nxtNodes.forEach((nodeB) => {
          const dist = Math.abs(nodeA.lane - nodeB.lane);
          if (dist < minDist) {
            minDist = dist;
            closest = nodeB;
          }
        });
        nodeA.next.push(closest.id);
        if (!closest.prev.includes(nodeA.id)) closest.prev.push(nodeA.id);
      }
    });

    // Invariant Check 2: Ensure every node in next tier has at least 1 incoming edge
    nxtNodes.forEach((nodeB) => {
      if (nodeB.prev.length === 0) {
        let closest = curNodes[0];
        let minDist = 999;
        curNodes.forEach((nodeA) => {
          const dist = Math.abs(nodeA.lane - nodeB.lane);
          if (dist < minDist) {
            minDist = dist;
            closest = nodeA;
          }
        });
        nodeB.prev.push(closest.id);
        if (!closest.next.includes(nodeB.id)) closest.next.push(nodeB.id);
      }
    });
  }

  // =========================================================================
  // 4. THREAT BUDGET & TACTICAL ENCOUNTER ALLOCATION
  // =========================================================================

  allNodes.forEach((node) => {
    const route = ROUTE_ARCHETYPES[node.lane] || ROUTE_ARCHETYPES[1];
    node.routeTag = route.tag;

    // Base threat target curves by Act and Tier depth
    let baseThreat = 1;
    if (act === 1) {
      baseThreat = node.tier <= 1 ? 1 : node.tier <= 2 ? 2 : 3;
    } else if (act === 2) {
      baseThreat = node.tier <= 1 ? 2 : node.tier <= 2 ? 3 : 4;
    } else {
      baseThreat = node.tier <= 1 ? 3 : node.tier <= 2 ? 4 : 5;
    }

    if (node.type === NODE_TYPES.ELITE) {
      node.threatRating = act === 1 ? 4 : 5;
      const enc = queryEncounters({
        act,
        isElite: true,
        threatTarget: node.threatRating,
        preferredArchetype: 'elite',
        rng,
        excludeIds: usedEncounterIds
      });
      node.encounterId = enc.id;
      node.title = enc.name;
      node.archetype = enc.archetype;
      node.archetypeName = enc.archetypeName;
      node.tacticalHint = enc.tacticalHint;
      usedEncounterIds.push(enc.id);
    } else if (node.type === NODE_TYPES.BOSS) {
      node.threatRating = act === 1 ? 5 : 6;
      const enc = queryEncounters({ act, isBoss: true, rng });
      node.encounterId = enc.id;
      node.title = getActBossTitle(act);
      node.archetype = enc.archetype;
      node.archetypeName = enc.archetypeName;
      node.tacticalHint = enc.tacticalHint;
      usedEncounterIds.push(enc.id);
    } else if (node.type === NODE_TYPES.BATTLE) {
      // Adjust threat by route personality
      const adjustedThreat = Math.max(1, Math.min(5, baseThreat + route.threatModifier));
      node.threatRating = adjustedThreat;

      let enc;
      if (act === 1 && node.tier === 0 && node.isTutorial) {
        enc = ENCOUNTERS.tutorial_1;
      } else {
        enc = queryEncounters({
          act,
          isElite: false,
          isBoss: false,
          threatTarget: adjustedThreat,
          preferredArchetype: route.preferredArchetype,
          rng,
          excludeIds: usedEncounterIds
        });
      }

      node.encounterId = enc.id;
      node.title = enc.name;
      node.archetype = enc.archetype;
      node.archetypeName = enc.archetypeName;
      node.tacticalHint = enc.tacticalHint;
      usedEncounterIds.push(enc.id);
    } else {
      // Non-combat utility nodes
      node.encounterId = null;
      node.threatRating = 0;
      node.archetype = null;

      if (node.type === NODE_TYPES.PUB) {
        node.title = node.lane === 2 ? 'Hostinec U Zlatého kříže' : 'Hospoda U Svěcené pípy';
        node.tacticalHint = 'Čas na sklenici piva, nákup proviantu a ošetření ran.';
      } else if (node.type === NODE_TYPES.WORKSHOP) {
        node.title = node.lane === 0 ? 'Panská zbrojířská kovárna' : 'Kolářská dílna mistra Hanuše';
        node.tacticalHint = 'Vylepši destičku nebo zkrať její chladnutí.';
      } else if (node.type === NODE_TYPES.EVENT) {
        node.title = node.lane === 2 ? 'Cikánská věštírna v maringotce' : 'Hradní výběrčí desátků';
        node.tacticalHint = 'Příběhové setkání s volbou osudu.';
      } else if (node.type === NODE_TYPES.TREASURE) {
        node.title = 'Zapomenutá hradní truhlice';
        node.tacticalHint = 'Volný výběr z relikvií nebo měšce dukátů.';
      }
    }
  });

  return { act, nodes: allNodes };
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
