import assert from 'node:assert/strict';
import {
  createBattleState,
  spawnEnemyEntity,
  spawnPropEntity,
  selectComplementaryReinforcementEnemy,
  selectSmartReinforcementGate
} from '../src/game/engine/state.js';
import { processReinforcements } from '../src/game/engine/combat.js';

console.log('=== TEST: Smart Tactical Reinforcement Director ===');

// 1. Hybrid Wave Pacing: Early Board-Clear Acceleration
{
  const state = createBattleState({ encounterId: 'tutorial_1', seed: 'REINF-ACCEL' });
  // tutorial_1 has turnDelay: 4 -> turnsRemaining starts at 4 (not locked yet)
  assert.equal(state.reinforcements[0].turnsRemaining, 4);
  assert.equal(state.reinforcements[0].isLocked, false);

  // Clear all initial enemies on Turn 1
  state.enemies.forEach((e) => {
    e.hp = 0;
    e.isTorpid = false;
  });

  const events = [];
  processReinforcements(state, events);

  // Should have accelerated from 4 -> 2 -> ticked to 1 and locked/telegraphed!
  const r = state.reinforcements[0];
  assert.equal(r.accelerated, true, 'Reinforcement should be marked accelerated when board is cleared early');
  assert.equal(r.turnsRemaining, 1, 'Accelerated reinforcement should become imminent (1 turn remaining)');
  assert.equal(r.isLocked, true, 'Accelerated reinforcement should lock gate and telegraph');
  assert.ok(events.some((ev) => ev.type === 'spawn_accelerated'), 'Should emit spawn_accelerated event');
  assert.ok(events.some((ev) => ev.type === 'reinf_telegraphed'), 'Should emit reinf_telegraphed event');

  // Next turn: should spawn!
  const nextEvents = [];
  processReinforcements(state, nextEvents);
  assert.equal(r.spawned, true, 'Reinforcement should spawn on the following turn');
  assert.ok(nextEvents.some((ev) => ev.type === 'spawn'), 'Should emit spawn event');
  console.log('✓ 1. Hybrid Wave Pacing (Early Board-Clear Acceleration) verified');
}

// 2. Overcrowding Cap Hold (Max 4 Active Enemies)
{
  const state = createBattleState({ encounterId: 'act1_battle_1', seed: 'REINF-CAP' });
  // Add 2 more living enemies so total active enemies = 4
  state.enemies.push(spawnEnemyEntity('kluk_kamen', 1, 1));
  state.enemies.push(spawnEnemyEntity('netopyr', 5, -1));
  assert.equal(state.enemies.filter((e) => e.hp > 0).length, 4);

  state.reinforcements[0].turnsRemaining = 1;
  const events = [];
  processReinforcements(state, events);

  assert.equal(state.reinforcements[0].spawned, false, 'Should not spawn when board is at max enemy cap (4)');
  assert.equal(state.reinforcements[0].turnsRemaining, 1, 'Should hold at 1 turn remaining');
  assert.equal(state.reinforcements[0].heldByCap, true, 'Should set heldByCap flag');
  assert.ok(events.some((ev) => ev.type === 'spawn_crowded_hold'), 'Should emit spawn_crowded_hold event');
  console.log('✓ 2. Overcrowding Cap Hold verified');
}

// 3. Smart Tactical Flanking (Pincer Gate Selection & Pit Avoidance)
{
  const state = createBattleState({ encounterId: 'act1_battle_1', seed: 'REINF-FLANK' });
  state.hero.cell = 3;
  // All living enemies are to the RIGHT of the hero (cells 5 and 6)
  state.enemies = [
    spawnEnemyEntity('srpak', 5, -1),
    spawnEnemyEntity('morak', 6, -1)
  ];

  const gateChoice = selectSmartReinforcementGate(state, {
    enemyId: 'zombie_hynek',
    gatePref: 6
  });
  assert.equal(
    gateChoice.gateCell,
    0,
    'Should pick Left Gate (0) to pincer hero when all enemies are on the right and Right Gate is occupied'
  );

  // Now test Pit Avoidance: put a pit on Left Gate (0) and clear Right Gate (6)
  state.enemies = [spawnEnemyEntity('srpak', 4, -1)];
  state.terrain[0] = { type: 'pit' };
  const pitAvoidChoice = selectSmartReinforcementGate(state, {
    enemyId: 'zombie_hynek', // non-flying ground unit
    gatePref: 0
  });
  assert.equal(
    pitAvoidChoice.gateCell,
    6,
    'Ground unit must avoid lethal pit on Gate 0 and choose Gate 6'
  );
  console.log('✓ 3. Smart Tactical Flanking & Pit Avoidance verified');
}

// 4. Role-Aware Complementary Enemy Selection
{
  const state = createBattleState({ encounterId: 'act1_battle_1', seed: 'REINF-ROLE' });
  const candidatePool = ['zombie_hynek', 'morak', 'sedlak_stit'];

  // Case A: Only ranged/backline enemy ('morak') is alive -> should pick frontline ('zombie_hynek' or 'sedlak_stit')
  state.enemies = [spawnEnemyEntity('morak', 5, -1)];
  const pickFrontline = selectComplementaryReinforcementEnemy(state, {
    enemyId: 'morak',
    baseEnemyId: 'morak',
    candidatePool
  });
  assert.equal(pickFrontline.role, 'frontline', 'Should select a frontline unit when only backline survives');
  assert.ok(
    pickFrontline.enemyId === 'zombie_hynek' || pickFrontline.enemyId === 'sedlak_stit',
    `Expected frontline unit, got ${pickFrontline.enemyId}`
  );

  // Case B: Only frontline enemies ('srpak', 'sedlak_stit') are alive -> should pick backline ('morak')
  state.enemies = [
    spawnEnemyEntity('srpak', 4, -1),
    spawnEnemyEntity('sedlak_stit', 5, -1)
  ];
  const pickBackline = selectComplementaryReinforcementEnemy(state, {
    enemyId: 'zombie_hynek',
    baseEnemyId: 'zombie_hynek',
    candidatePool
  });
  assert.equal(pickBackline.enemyId, 'morak', 'Should select ranged/backline unit morak when frontline is already present');
  assert.equal(pickBackline.role, 'backline');
  console.log('✓ 4. Role-Aware Complementary Enemy Selection verified');
}

// 5. Smart Blocked-Gate Rerouting vs. Dual-Gate Delay
{
  const state = createBattleState({ encounterId: 'act1_battle_1', seed: 'REINF-REROUTE' });
  state.enemies = [spawnEnemyEntity('srpak', 4, -1)];
  state.props = [];

  // Lock reinforcement to Right Gate (6) with 1 turn remaining
  const r = state.reinforcements[0];
  r.turnsRemaining = 1;
  r.isLocked = true;
  r.gateCell = 6;
  r.lockedGateCell = 6;

  // Player blocks Right Gate (6) with a barrel before reinforcement arrives, while Left Gate (0) is open
  state.props.push(spawnPropEntity('barrel', 6));

  const events = [];
  processReinforcements(state, events);

  assert.equal(r.spawned, true, 'Reinforcement should reroute and spawn when opposite gate is free');
  assert.equal(r.rerouted, true, 'Reinforcement should be marked rerouted');
  assert.equal(r.gateCell, 0, 'Reinforcement should have rerouted from blocked Gate 6 to open Gate 0');
  assert.ok(events.some((ev) => ev.type === 'spawn_rerouted'), 'Should emit spawn_rerouted event');

  // Now test when BOTH gates are blocked -> must delay by 1 turn
  const stateBothBlocked = createBattleState({ encounterId: 'act1_battle_1', seed: 'REINF-DELAY' });
  stateBothBlocked.enemies = [spawnEnemyEntity('srpak', 4, -1)];
  stateBothBlocked.props = [
    spawnPropEntity('barrel', 0),
    spawnPropEntity('barrel', 6)
  ];
  const r2 = stateBothBlocked.reinforcements[0];
  r2.turnsRemaining = 1;
  r2.isLocked = true;
  r2.gateCell = 6;
  r2.lockedGateCell = 6;

  const delayEvents = [];
  processReinforcements(stateBothBlocked, delayEvents);
  assert.equal(r2.spawned, false, 'Should not spawn when both gates are blocked');
  assert.equal(r2.turnsRemaining, 1, 'Should delay by 1 turn when both gates are blocked');
  assert.ok(delayEvents.some((ev) => ev.type === 'spawn_delayed'), 'Should emit spawn_delayed event');
  console.log('✓ 5. Smart Blocked-Gate Rerouting & Dual-Gate Delay verified');
}

console.log('=== ALL SMART REINFORCEMENT TESTS PASSED ===');
