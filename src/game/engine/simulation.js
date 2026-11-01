// @ts-nocheck
import { createRng } from './rng.js';
import { ENEMY_TILES } from '../config/enemies.js';
import { wouldEnemyTileHitTargetCell } from './state.js';
import { detectResonances } from './combo.js';
import { executeSingleQueueSlot } from './combat.js';

export function cloneBattleStateForSim(state) {
  if (!state) return null;
  const clone = {
    hero: JSON.parse(JSON.stringify(state.hero)),
    enemies: JSON.parse(JSON.stringify(state.enemies || [])),
    props: JSON.parse(JSON.stringify(state.props || [])),
    terrain: JSON.parse(JSON.stringify(state.terrain || [])),
    hand: JSON.parse(JSON.stringify(state.hand || [])),
    queue: [...(state.queue || [])],
    talismans: [...(state.talismans || [])],
    boardSize: state.boardSize,
    turn: state.turn,
    status: state.status,
    stats: JSON.parse(JSON.stringify(state.stats || {})),
    reinforcements: JSON.parse(JSON.stringify(state.reinforcements || [])),
    comboResonanceBonusPush: state.comboResonanceBonusPush || 0,
    lastTurnAspergillumTurn: state.lastTurnAspergillumTurn,
    cellBlood: state.cellBlood ? JSON.parse(JSON.stringify(state.cellBlood)) : {}
  };
  if (state.rng) {
    clone.rng = createRng('sim_clone');
    if (typeof state.rng.getState === 'function') {
      clone.rng.setState(state.rng.getState());
    }
  }
  return clone;
}

export function simulateComboImpact(state, customQueue = null) {
  if (!state || !state.hero || state.hero.hp <= 0) {
    return {
      hero: null,
      entities: [],
      resonances: [],
      ghosts: [],
      threatsPostCombo: [],
      impactMap: {}
    };
  }
  const queueIds = customQueue === null ? [...(state.queue || [])] : [...customQueue];
  if (queueIds.length === 0) {
    return {
      hero: {
        initialCell: state.hero.cell,
        finalCell: state.hero.cell,
        initialFacing: state.hero.facing,
        finalFacing: state.hero.facing,
        hpBefore: state.hero.hp,
        hpAfter: state.hero.hp,
        moved: false,
        isThreatenedPostCombo: false
      },
      entities: [],
      resonances: [],
      ghosts: [],
      threatsPostCombo: [],
      impactMap: {}
    };
  }

  const sim = cloneBattleStateForSim(state);
  sim.queue = [...queueIds];
  const initialHero = {
    cell: sim.hero.cell,
    facing: sim.hero.facing,
    hp: sim.hero.hp
  };

  const initialMap = new Map();
  for (const e of sim.enemies) {
    initialMap.set(e.id, {
      id: e.id,
      name: e.name,
      entityType: 'enemy',
      cell: e.cell,
      facing: e.facing,
      hp: e.hp,
      maxHp: e.maxHp
    });
  }
  for (const p of sim.props) {
    initialMap.set(p.id, {
      id: p.id,
      name: p.name,
      entityType: 'prop',
      cell: p.cell,
      facing: p.facing,
      hp: p.hp,
      maxHp: p.maxHp
    });
  }

  const comboLength = queueIds.length;
  const allEvents = [];
  for (let i = 0; i < comboLength && sim.hero.hp > 0; i++) {
    const curId = queueIds[i];
    const nextId = queueIds[i + 1] || null;
    const evs = executeSingleQueueSlot(sim, curId, i, comboLength, nextId);
    allEvents.push(...evs);
  }

  const resonances = detectResonances(
    queueIds.map((id) => (state.hand || []).find((t) => t.instanceId === id)).filter(Boolean)
  );

  const heroMoved = sim.hero.cell !== initialHero.cell || sim.hero.facing !== initialHero.facing;
  const entities = [];
  const ghosts = [];
  const impactMap = {};

  if (heroMoved && sim.hero.hp > 0) {
    ghosts.push({
      id: sim.hero.id,
      name: sim.hero.name,
      entityType: 'hero',
      cell: sim.hero.cell,
      facing: sim.hero.facing
    });
  }

  for (const e of sim.enemies) {
    const init = initialMap.get(e.id);
    if (!init) continue;
    const dmgTaken = Math.max(0, init.hp - e.hp);
    const isLethal = e.hp <= 0 && init.hp > 0;
    const moved = e.cell !== init.cell || e.facing !== init.facing;
    const rec = {
      id: e.id,
      name: e.name,
      entityType: 'enemy',
      initialCell: init.cell,
      finalCell: e.cell,
      initialFacing: init.facing,
      finalFacing: e.facing,
      hpBefore: init.hp,
      hpAfter: e.hp,
      maxHp: init.maxHp,
      dmgTaken,
      isLethal,
      moved
    };
    entities.push(rec);
    impactMap[e.id] = rec;
    if (moved && e.hp > 0) {
      ghosts.push({
        id: e.id,
        name: e.name,
        entityType: 'enemy',
        cell: e.cell,
        facing: e.facing
      });
    }
  }

  for (const p of sim.props) {
    const init = initialMap.get(p.id);
    if (!init) continue;
    const dmgTaken = Math.max(0, init.hp - p.hp);
    const isLethal = p.hp <= 0 && init.hp > 0;
    const moved = p.cell !== init.cell;
    const rec = {
      id: p.id,
      name: p.name,
      entityType: 'prop',
      initialCell: init.cell,
      finalCell: p.cell,
      initialFacing: init.facing,
      finalFacing: p.facing,
      hpBefore: init.hp,
      hpAfter: p.hp,
      maxHp: init.maxHp,
      dmgTaken,
      isLethal,
      moved
    };
    entities.push(rec);
    impactMap[p.id] = rec;
    if (moved && p.hp > 0) {
      ghosts.push({
        id: p.id,
        name: p.name,
        entityType: 'prop',
        cell: p.cell,
        facing: p.facing
      });
    }
  }

  const threatsPostCombo = [];
  const finalHeroCell = sim.hero.cell;
  for (const e of sim.enemies) {
    if (e.hp <= 0) continue;
    let threatens = false;
    const q = e.actionQueue || [];
    if (q.length > 0) {
      for (const tileId of q) {
        const def = ENEMY_TILES[tileId];
        if (def && wouldEnemyTileHitTargetCell(sim, e, def, e.cell, e.facing, finalHeroCell)) {
          threatens = true;
          break;
        }
      }
    } else if (e.nextAction?.tileId) {
      const def = ENEMY_TILES[e.nextAction.tileId];
      if (def && wouldEnemyTileHitTargetCell(sim, e, def, e.cell, e.facing, finalHeroCell)) {
        threatens = true;
      }
    }
    if (threatens) {
      threatsPostCombo.push({
        enemyId: e.id,
        enemyName: e.name,
        cell: e.cell,
        targetCell: finalHeroCell
      });
      if (impactMap[e.id]) {
        impactMap[e.id].threatensHeroPostCombo = true;
      }
    }
  }

  return {
    hero: {
      initialCell: initialHero.cell,
      finalCell: sim.hero.cell,
      initialFacing: initialHero.facing,
      finalFacing: sim.hero.facing,
      hpBefore: initialHero.hp,
      hpAfter: sim.hero.hp,
      moved: heroMoved,
      isThreatenedPostCombo: threatsPostCombo.length > 0,
      threatsPostCombo
    },
    entities,
    resonances,
    ghosts,
    threatsPostCombo,
    impactMap,
    events: allEvents
  };
}
