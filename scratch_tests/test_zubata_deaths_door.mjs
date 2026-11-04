// @ts-nocheck
import assert from 'node:assert';
import { createBattleState, isHeroAlive, dealDamage, applyHealToEntity } from '../src/game/engine/state.js';
import {
  advanceTurnAfterPlayerAction,
  checkBattleEnd,
  insertTileIntoQueue,
  stepHero,
  turnHero,
  waitHero
} from '../src/game/engine/combat.js';
import { createNewRun } from '../src/game/engine/run.js';

console.log('--- TEST SUITE: ZUBATÁ & VERVA (PERSISTENCE & DEATH\'S DOOR) ---');

// Test 1: Data Model & Initial State
{
  console.log('Test 1: Initial state & loadout persistence');
  const run = createNewRun('test_seed', 'classic');
  assert.strictEqual(run.persistence, 5, 'Run persistence should default to 5');
  assert.strictEqual(run.maxPersistence, 5, 'Run maxPersistence should default to 5');

  const state = createBattleState({
    hunterId: 'classic',
    heroHp: 10,
    heroMaxHp: 20,
    persistence: run.persistence,
    maxPersistence: run.maxPersistence
  });

  assert.strictEqual(state.hero.persistence, 5);
  assert.strictEqual(state.hero.maxPersistence, 5);
  assert.strictEqual(state.hero.isReaperActive, false);
  assert.strictEqual(state.hero.reaperCountdown, null);
  assert.strictEqual(isHeroAlive(state.hero), true);
  console.log('✓ Test 1 passed');
}

// Test 2: Entering Zubatá on Hit & Queue Clearing
{
  console.log('Test 2: Taking damage into negative HP triggers Zubatá and clears queue');
  const state = createBattleState({
    hunterId: 'classic',
    heroHp: 4,
    heroMaxHp: 20,
    persistence: 5
  });

  // Queue a card
  const cardId = state.hand[0].instanceId;
  const insertRes = insertTileIntoQueue(state, cardId);
  assert.strictEqual(insertRes.ok, true);
  assert.strictEqual(state.queue.length, 1);
  assert.strictEqual(state.hand[0].inQueue, true);

  // Take 6 damage with 0 shield (drops HP from 4 to -2)
  state.hero.statuses = {};
  const events = [];
  const dmg = dealDamage(state, state.hero, 6, { reason: 'enemy_attack' }, events);
  assert.strictEqual(dmg, 6);
  assert.strictEqual(state.hero.hp, -2, 'HP drops to -2');
  assert.strictEqual(state.hero.isReaperActive, true, 'isReaperActive becomes true');
  assert.strictEqual(state.hero.reaperCountdown, 3, 'reaperCountdown = 5 + (-2) = 3');
  assert.strictEqual(isHeroAlive(state.hero), true, 'Hero is alive in Zubatá');

  // Verify queue cleared immediately
  assert.strictEqual(state.queue.length, 0, 'Queue must be emptied immediately');
  assert.strictEqual(state.hand[0].inQueue, false, 'Card must be returned to hand (inQueue: false)');

  // Verify events emitted
  const hasReaperEvent = events.some((e) => e.type === 'reaper_triggered');
  const hasQueueClearedEvent = events.some((e) => e.type === 'queue_cleared_reaper');
  assert.strictEqual(hasReaperEvent, true, 'reaper_triggered event emitted');
  assert.strictEqual(hasQueueClearedEvent, true, 'queue_cleared_reaper event emitted');

  console.log('✓ Test 2 passed');
}

// Test 3: Second Hit while in Zubatá
{
  console.log('Test 3: Taking a second hit while in Zubatá clears queue again and updates countdown');
  const state = createBattleState({
    hunterId: 'classic',
    heroHp: -2,
    heroMaxHp: 20,
    persistence: 5
  });
  state.hero.isReaperActive = true;
  state.hero.reaperCountdown = 3;

  // Queue another card
  const cardId = state.hand[0].instanceId;
  insertTileIntoQueue(state, cardId);
  assert.strictEqual(state.queue.length, 1);

  // Take 1 more damage with 0 shield (drops to -3)
  state.hero.statuses = {};
  const events = [];
  dealDamage(state, state.hero, 1, { reason: 'enemy_attack' }, events);
  assert.strictEqual(state.hero.hp, -3);
  assert.strictEqual(state.hero.isReaperActive, true);
  assert.strictEqual(state.hero.reaperCountdown, 2, 'Countdown updates to 5 + (-3) = 2');
  assert.strictEqual(state.queue.length, 0, 'Queue cleared again');
  assert.strictEqual(isHeroAlive(state.hero), true);
  console.log('✓ Test 3 passed');
}

// Test 4: Lethal Hit exceeding Persistence
{
  console.log('Test 4: Lethal hit exceeding persistence kills hero immediately');
  const state = createBattleState({
    hunterId: 'classic',
    heroHp: 2,
    heroMaxHp: 20,
    persistence: 5
  });

  // Take 7 damage with 0 shield (2 - 7 = -5, countdown = 5 + (-5) = 0 <= 0 -> lethal)
  state.hero.statuses = {};
  const events = [];
  dealDamage(state, state.hero, 7, { reason: 'enemy_attack' }, events);
  assert.strictEqual(state.hero.hp, -5);
  assert.strictEqual(isHeroAlive(state.hero), false, 'Hero is dead');
  assert.strictEqual(state.status, 'lost', 'Battle status lost');
  console.log('✓ Test 4 passed');
}

// Test 5: Turn-End Persistence Decay Isolation
{
  console.log('Test 5: Persistence decays only when hero started AND ended turn in Zubatá');
  const state = createBattleState({
    hunterId: 'classic',
    heroHp: 5,
    heroMaxHp: 20,
    persistence: 5
  });

  // Place enemies out of attack range so they don't deal extra damage during advanceTurnAfterPlayerAction
  state.enemies.forEach((e) => {
    e.cell = 6;
    e.facing = 1;
    e.actionQueue = [];
  });

  // Turn 1 starts with hero at 5 HP (heroStartedTurnInReaper is false)
  assert.strictEqual(state.heroStartedTurnInReaper, false);

  // Hero takes a hit during enemy phase dropping to -1
  state.hero.statuses = {};
  dealDamage(state, state.hero, 6, { reason: 'enemy_attack' }, []);
  assert.strictEqual(state.hero.hp, -1);
  assert.strictEqual(state.hero.isReaperActive, true);
  assert.strictEqual(state.hero.persistence, 5);

  // Advance turn (first round ends, snapshot taken for next turn)
  const turnEvents1 = [];
  advanceTurnAfterPlayerAction(state, turnEvents1);

  // Decay should NOT have happened yet, because hero did NOT start turn in reaper!
  assert.strictEqual(state.hero.persistence, 5, 'No decay on the turn hero first entered Zubatá');
  // But now snapshot for the upcoming player turn is true:
  assert.strictEqual(state.heroStartedTurnInReaper, true, 'Snapshot is now true for next turn');

  // Player takes their turn while in Zubatá (e.g. wait or turn) and ends turn still in Zubatá:
  const turnEvents2 = [];
  advanceTurnAfterPlayerAction(state, turnEvents2);

  // NOW persistence must decay by 1!
  assert.strictEqual(state.hero.persistence, 4, 'Persistence decremented to 4');
  assert.strictEqual(state.hero.reaperCountdown, 3, 'Countdown is now 4 + (-1) = 3');
  const hasDecayEvent = turnEvents2.some((e) => e.type === 'reaper_decay');
  assert.strictEqual(hasDecayEvent, true, 'reaper_decay event emitted');

  console.log('✓ Test 5 passed');
}

// Test 6: Fatal Decay when Persistence hits <= 0
{
  console.log('Test 6: Decay to 0 countdown triggers death');
  const state = createBattleState({
    hunterId: 'classic',
    heroHp: -1,
    heroMaxHp: 20,
    persistence: 2
  });
  state.hero.isReaperActive = true;
  state.heroStartedTurnInReaper = true;
  state.enemies.forEach((e) => {
    e.cell = 6;
    e.facing = 1;
    e.actionQueue = [];
  });

  // Advance turn -> persistence decays from 2 to 1 (reaperCountdown = 1 + (-1) = 0 -> lethal!)
  const turnEvents = [];
  advanceTurnAfterPlayerAction(state, turnEvents);

  assert.strictEqual(state.hero.persistence, 1);
  assert.strictEqual(isHeroAlive(state.hero), false, 'Hero died from persistence decay');
  assert.strictEqual(state.status, 'lost', 'Battle marked lost');
  console.log('✓ Test 6 passed');
}

// Test 7: Healing Out of Zubatá
{
  console.log('Test 7: Healing out of Zubatá restores normal state');
  const state = createBattleState({
    hunterId: 'classic',
    heroHp: -2,
    heroMaxHp: 20,
    persistence: 4
  });
  state.hero.isReaperActive = true;
  state.hero.reaperCountdown = 2;

  // Heal 1 HP (still in Zubatá at -1 HP)
  const healEvents1 = [];
  applyHealToEntity(state, state.hero, 1, healEvents1);
  assert.strictEqual(state.hero.hp, -1);
  assert.strictEqual(state.hero.isReaperActive, true);
  assert.strictEqual(state.hero.reaperCountdown, 3, '4 + (-1) = 3');

  // Heal 3 HP (-1 + 3 = +2 HP -> exits Zubatá!)
  const healEvents2 = [];
  applyHealToEntity(state, state.hero, 3, healEvents2);
  assert.strictEqual(state.hero.hp, 2);
  assert.strictEqual(state.hero.isReaperActive, false, 'isReaperActive is false');
  assert.strictEqual(state.hero.reaperCountdown ?? null, null, 'Countdown cleared');
  assert.strictEqual(state.hero.persistence, 4, 'Persistence remains at decayed value');
  const hasClearedEvent = healEvents2.some((e) => e.type === 'reaper_cleared');
  assert.strictEqual(hasClearedEvent, true, 'reaper_cleared event emitted');

  console.log('✓ Test 7 passed');
}

// Test 8: Stage Victory Recovery
{
  console.log('Test 8: Surviving combat room resets HP to 1 and clears Zubatá without decay');
  const state = createBattleState({
    hunterId: 'classic',
    heroHp: -3,
    heroMaxHp: 20,
    persistence: 3
  });
  state.hero.isReaperActive = true;
  state.hero.reaperCountdown = 0; // wait, if persistence is 3 and hp is -3, countdown is 0 -> let's use hp -2 so countdown 1
  state.hero.hp = -2;
  state.hero.reaperCountdown = 1;
  state.heroStartedTurnInReaper = true;

  // Kill all enemies and clear reinforcements
  state.enemies.forEach((e) => {
    e.hp = 0;
  });
  state.reinforcements = [];

  const outcome = checkBattleEnd(state);
  assert.strictEqual(outcome, 'won', 'Battle is won');
  assert.strictEqual(state.hero.hp, 1, 'Hero HP restored to 1');
  assert.strictEqual(state.hero.isReaperActive, false, 'Zubatá cleared');
  assert.strictEqual(state.hero.persistence, 3, 'Persistence did not decay on victory turn');
  console.log('✓ Test 8 passed');
}

console.log('\nALL ZUBATÁ & VERVA TESTS PASSED SUCCESSFULLY! 🎯');
