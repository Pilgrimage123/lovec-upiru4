import assert from 'node:assert/strict';
import { createBattleState, dealDamage, addStatus, hasStatus, pushEntity, getEntityAt } from '../src/game/engine/state.js';
import {
  stepHero,
  resolveHeroBump,
  advanceTurnAfterPlayerAction,
  resolveEnemyPhase
} from '../src/game/engine/combat.js';
import { STATUSES } from '../src/game/config/statuses.js';
import { STARTING_LOADOUTS } from '../src/game/config/loadouts.js';

console.log('--- TEST 1: Status Confusion definition ---');
{
  assert.equal(STATUSES.confusion.badge, '❓', 'Confusion badge should be question mark');
  assert.ok(STATUSES.confusion.description.includes('otazník'), 'Description should mention question mark');
  console.log('✓ Confusion badge ❓ verified');
}

console.log('--- TEST 2: Universal Push & Collision Formula (1 DMG per unmoved tile) ---');
{
  // Case A: Push 2 into wall immediately (0 moved -> 2 unmoved -> 2 DMG)
  const stateA = createBattleState();
  stateA.hero.cell = 6;
  const enemyA = stateA.enemies[0];
  enemyA.cell = 0; // Left wall is at -1
  enemyA.hp = 10;
  pushEntity(stateA, enemyA, -1, 2, []);
  assert.equal(enemyA.hp, 8, 'Wall collision with 2 unmoved tiles deals 2 DMG');
  assert.equal(enemyA.cell, 0, 'Enemy stayed at cell 0');

  // Case B: Push 2 with 1 tile free then wall (1 moved, 1 unmoved -> 1 DMG)
  const stateB = createBattleState();
  stateB.hero.cell = 6;
  const enemyB = stateB.enemies[0];
  enemyB.cell = 1; // can move to 0, but cannot move to -1
  enemyB.hp = 10;
  pushEntity(stateB, enemyB, -1, 2, []);
  assert.equal(enemyB.cell, 0, 'Moved 1 step to cell 0');
  assert.equal(enemyB.hp, 9, 'Wall collision with 1 unmoved tile deals 1 DMG');

  // Case C: Push 2 completely unobstructed (2 moved -> 0 unmoved -> 0 DMG)
  const stateC = createBattleState();
  stateC.hero.cell = 6;
  const enemyC = stateC.enemies[0];
  enemyC.cell = 3;
  enemyC.hp = 10;
  stateC.props = [];
  stateC.enemies = [enemyC];
  pushEntity(stateC, enemyC, -1, 2, []);
  assert.equal(enemyC.cell, 1, 'Moved 2 steps to cell 1');
  assert.equal(enemyC.hp, 10, 'No collision damage when unobstructed');

  // Case D: Collision between two entities:
  // Enemy 1 at cell 2 pushed right (dir +1) by 2 tiles. Enemy 2 at cell 3.
  // Enemy 1 can move 0 tiles before hitting Enemy 2.
  // Unmoved = 2. BOTH receive 2 DMG!
  const stateD = createBattleState();
  stateD.hero.cell = 6;
  stateD.props = [];
  const e1 = stateD.enemies[0];
  const e2 = stateD.enemies[1];
  e1.cell = 2;
  e1.hp = 10;
  e2.cell = 3;
  e2.hp = 10;
  pushEntity(stateD, e1, 1, 2, []);
  assert.equal(e1.hp, 8, 'Pushed entity takes 2 DMG (unmoved = 2)');
  assert.equal(e2.hp, 8, 'Blocker entity takes 2 DMG (unmoved = 2)');

  console.log('✓ Universal Push & Collision formula (1 DMG per unmoved tile) verified');
}

console.log('--- TEST 3: Confusion skips turn with ❓ and expires ---');
{
  const state = createBattleState();
  const enemy = state.enemies[0];
  addStatus(enemy, 'confusion', 1);
  assert.equal(hasStatus(enemy, 'confusion'), true);

  const events = [];
  resolveEnemyPhase(state, events);

  // Confusion should have caused skip and been consumed
  assert.equal(hasStatus(enemy, 'confusion'), false, 'Confusion should expire after skipping turn');
  const skippedEvt = events.find((e) => e.type === 'enemy_confusion_skipped');
  assert.ok(skippedEvt, 'Should emit enemy_confusion_skipped event');
  console.log('✓ Enemy confusion skips turn and removes question mark');
}

console.log('--- TEST 4: Lady Gwendolyn Bump: Čas na čaj, milady! ---');
{
  const state = createBattleState({ hunterId: 'anglicanka' });
  state.props = [];
  const hero = state.hero;
  hero.cell = 2;
  hero.facing = 1;

  const enemy1 = state.enemies[0];
  enemy1.cell = 3;
  enemy1.hp = 15;

  // Subtest 4A: Blocked space behind enemy -> bump cannot be used
  const enemy2 = state.enemies[1];
  enemy2.cell = 4; // Right behind enemy1!
  enemy2.hp = 15;

  const blockedRes = stepHero(state, 1);
  assert.equal(blockedRes.ok, false, 'Bump must fail if space behind enemy is occupied');
  assert.equal(hero.bumpCooldown, 0, 'Cooldown not consumed when blocked');

  // Subtest 4B: Free space behind enemy -> Butler manifests, enemy pushed 1+2, confused
  state.enemies = [enemy1]; // Remove enemy2 so cells 4, 5, 6 are completely free
  const bumpRes = stepHero(state, 1);
  assert.equal(bumpRes.ok, true, 'Bump should succeed when space behind is free');
  assert.equal(hero.bumpCooldown, 3, 'Cooldown should be set to 3');

  // Butler should be at cell 3
  const butler = state.props.find((p) => p.kind === 'komornik');
  assert.ok(butler, 'Butler must be spawned in state.props');
  assert.equal(butler.cell, 3, 'Butler must stand at cell 3');
  assert.equal(butler.isImmortal, true, 'Butler must be immortal');
  assert.equal(butler.durationRounds, 2, 'Butler must have 2 rounds duration');

  // Enemy1 should have moved from 3 -> 4 (by 1 step), then pushed by 2 -> cell 6
  assert.equal(enemy1.cell, 6, 'Enemy1 pushed to cell 6');
  assert.equal(hasStatus(enemy1, 'confusion'), true, 'Enemy1 must be confused with ❓');

  // Subtest 4C: Butler immortality: attacks against Butler deal 0 damage
  const damageEvts = [];
  const dealt = dealDamage(state, butler, 10, { reason: 'attack' }, damageEvts);
  assert.equal(dealt, 0, 'Immortal Butler takes 0 DMG');
  assert.equal(butler.hp, 999, 'Butler HP stays 999');
  assert.ok(damageEvts.some((e) => e.type === 'damage_absorbed_butler'), 'Emits damage_absorbed_butler event');

  // Subtest 4D: Butler expiration after 2 rounds
  advanceTurnAfterPlayerAction(state, []);
  assert.equal(butler.durationRounds, 1, 'Butler duration decrements to 1 after 1 round');
  assert.ok(state.props.includes(butler), 'Butler still present after 1 round');

  const expireEvents = [];
  advanceTurnAfterPlayerAction(state, expireEvents);
  assert.ok(!state.props.includes(butler), 'Butler removed after 2 rounds');
  assert.ok(expireEvents.some((e) => e.type === 'komornik_expire'), 'Emits komornik_expire event');

  console.log('✓ Lady Gwendolyn bump and immortal Butler life cycle verified');
}

console.log('--- TEST 5: Collision with secondary entity applies Confusion to both ---');
{
  const state = createBattleState({ hunterId: 'anglicanka' });
  state.props = [];
  const hero = state.hero;
  hero.cell = 1;
  hero.facing = 1;

  const enemy1 = state.enemies[0];
  enemy1.cell = 2; // directly adjacent
  enemy1.hp = 15;

  const enemy2 = state.enemies[1];
  enemy2.cell = 4; // cell 3 is free (allows initial step), but cell 4 has enemy2!
  enemy2.hp = 15;

  const bumpRes = stepHero(state, 1);
  assert.equal(bumpRes.ok, true, 'Bump succeeds because cell 3 is free');

  // Enemy1 stepped to 3, then pushed by 2 towards 4.
  // Cell 4 has enemy2, so unmoved = 2 - 0 = 2 -> both take 2 DMG!
  assert.equal(enemy1.hp, 13, 'Enemy1 takes 2 collision DMG (unmoved = 2)');
  assert.equal(enemy2.hp, 13, 'Enemy2 takes 2 collision DMG (unmoved = 2)');

  // Both should be confused!
  assert.equal(hasStatus(enemy1, 'confusion'), true, 'Enemy1 is confused');
  assert.equal(hasStatus(enemy2, 'confusion'), true, 'Enemy2 hit by collision is also confused');

  console.log('✓ Secondary collision damage and mutual confusion verified');
}

console.log('\n=============================================');
console.log('ALL BUTLER, CONFUSION & COLLISION TESTS PASSED 100%! 🎉');
console.log('=============================================');
