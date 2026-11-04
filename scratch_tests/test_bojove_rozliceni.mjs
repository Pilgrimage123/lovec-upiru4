// @ts-nocheck
import assert from 'node:assert';
import { createBattleState, pushEntity, dealDamage, getEntityAt, spawnEnemyEntity } from '../src/game/engine/state.js';
import { computeHeroTileBonus, advanceTurnAfterPlayerAction, resolveHunterCombo3Bonus } from '../src/game/engine/combat.js';
import { STARTING_LOADOUTS } from '../src/game/config/loadouts.js';
import { ENEMIES } from '../src/game/config/enemies.js';
import { STATUSES } from '../src/game/config/statuses.js';

console.log('--- TEST 1: Status definition & Glossary terms ---');
assert.strictEqual(STATUSES.rozliceni.id, 'rozliceni');
assert.strictEqual(STATUSES.rozliceni.badge, '💢');
assert.strictEqual(STATUSES.rozliceni.name, 'Bojové rozlícení');
console.log('✓ Status definition for Bojové rozlícení verified');

console.log('\n--- TEST 2: Initial Loadout Fury & Enemy Temperament ---');
assert.strictEqual(STARTING_LOADOUTS.classic.fury, 10, 'Sokol Venca has 10% fury');
assert.strictEqual(STARTING_LOADOUTS.honza.fury, 25, 'Chasník Honza has 25% fury (Polní furiant)');
assert.strictEqual(STARTING_LOADOUTS.dragoun.fury, 10, 'Rittmeister Jaromír has 10% fury');
assert.strictEqual(STARTING_LOADOUTS.zlodejka.fury, 10, 'Káča has 10% fury');
assert.strictEqual(STARTING_LOADOUTS.ponocny.fury, 5, 'Ponocný has 5% fury');
assert.strictEqual(STARTING_LOADOUTS.silak.fury, 10, 'Silák Gustav has 10% fury');
assert.strictEqual(STARTING_LOADOUTS.anglicanka.fury, 5, 'Lady Gwendolyn has 5% fury');
assert.strictEqual(STARTING_LOADOUTS.helsing.fury, 10, 'Sir Arthur has 10% fury');
assert.strictEqual(STARTING_LOADOUTS.revident.fury, 5, 'Revident Šiml has 5% fury');

const state = createBattleState({ encounterId: 'tutorial_1', hunterId: 'honza' });
assert.strictEqual(state.hero.fury, 25);
assert.strictEqual(state.hero.currentFury, 25, 'Initial currentFury matches base fury in round 1');
console.log('✓ All 9 hunters and hero battle state fury initialization verified');

console.log('\n--- TEST 3: Round accumulation of Bojové rozlícení ---');
// Advance round and verify accumulation
const events = [];
advanceTurnAfterPlayerAction(state, events);
assert.strictEqual(state.hero.currentFury, 50, 'Accumulated to 50% after round 1 advance (25 + 25)');
assert(events.some(e => e.type === 'fury_accumulated' && e.targetId === state.hero.id), 'Emitted fury_accumulated event');
assert(events.some(e => e.type === 'log' && e.text.includes('Bojové rozlícení')), 'Logged Bojové rozlícení');
console.log('✓ Bojové rozlícení accumulates each round and logs message');

console.log('\n--- TEST 4: Math.round formula (0.5 rounds up) ---');
// Base 2 DMG with 15%: 2 * 0.15 = 0.30 -> +0 DMG bonus
const tile2Dmg = { id: 'test_tile', dmg: 2, type: 'attack' };
state.hero.currentFury = 15;
const bonus15 = computeHeroTileBonus(state, tile2Dmg, 0);
assert.strictEqual(bonus15.furyBonus, 0, '2 * 0.15 = 0.30 rounds to +0 DMG');

// Base 2 DMG with 30%: 2 * 0.30 = 0.60 -> +1 DMG bonus
state.hero.currentFury = 30;
const bonus30 = computeHeroTileBonus(state, tile2Dmg, 0);
assert.strictEqual(bonus30.furyBonus, 1, '2 * 0.30 = 0.60 (>= 0.5) rounds up to +1 DMG');

// Base 4 DMG with 15%: 4 * 0.15 = 0.60 -> +1 DMG bonus
const tile4Dmg = { id: 'heavy_strike', dmg: 4, type: 'attack' };
state.hero.currentFury = 15;
const bonus4Dmg = computeHeroTileBonus(state, tile4Dmg, 0);
assert.strictEqual(bonus4Dmg.furyBonus, 1, '4 * 0.15 = 0.60 rounds up to +1 DMG');

// Polní furiant (35% fury): 2 * 0.35 = 0.70 -> +1 DMG in round 1!
state.hero.currentFury = 35;
const bonusFuriantR1 = computeHeroTileBonus(state, tile2Dmg, 0);
assert.strictEqual(bonusFuriantR1.furyBonus, 1, '2 * 0.35 = 0.70 rounds to +1 DMG right from round 1');
console.log('✓ Damage calculation with 0.5 half-up rounding verified');

console.log('\n--- TEST 5: Odstrčení a srážka with Pusher Rozlícení ---');
// Setup test board for push collision:
// Hero at cell 1 with currentFury = 50%
// Enemy 1 at cell 2 pushed right by distance 2 into wall at board edge or blocker
const pushState = createBattleState({ encounterId: 'tutorial_1', hunterId: 'classic' });
pushState.boardSize = 7;
pushState.hero.cell = 0;
pushState.hero.currentFury = 50;

const targetEnemy = {
  id: 'target_1',
  name: 'Odmrštěný upír',
  cell: 5,
  hp: 20,
  maxHp: 20,
  statuses: {},
  entityType: 'enemy'
};
const blockerEnemy = {
  id: 'blocker_1',
  name: 'Stojící upír',
  cell: 6,
  hp: 20,
  maxHp: 20,
  statuses: {},
  entityType: 'enemy'
};
pushState.enemies = [targetEnemy, blockerEnemy];

// Target at 5 pushed right (+1) by distance 2 into Blocker at 6.
// Distance = 2, actualMoved = 0. Unmoved = 2 cells.
// Base collision = 2 DMG.
// With pusher (Hero) fury = 50%:
// Bonus = Math.round(2 * 0.50) = 1 DMG.
// Total collision = 3 DMG.
const pushEvents = [];
pushEntity(pushState, targetEnemy, 1, 2, pushEvents, { pusher: pushState.hero });

assert.strictEqual(targetEnemy.hp, 17, 'Target took 3 DMG (20 - 3 = 17)');
assert.strictEqual(blockerEnemy.hp, 17, 'Blocker took 3 DMG (20 - 3 = 17)');
assert.strictEqual(pushState.hero.hp, pushState.hero.maxHp, 'Pusher took 0 DMG');
assert(pushEvents.some(e => e.type === 'collision_entity' && e.damage === 3 && e.furyBonus === 1), 'Collision event recorded 3 DMG (base 2 + fury 1)');
console.log('✓ Odstrčení a srážka applies kinetic Rozlícení bonus to both entities while pusher takes 0 DMG');

console.log('\n--- TEST 6: Shield Penetration with Raw Rozlícení DMG ---');
// Enemy has 2 Shield from Defense.
// Base attack is 2 DMG. Without Rozlícení, 2 DMG is completely absorbed by Shield (0 HP damage).
// With Rozlícení (+50%), total DMG is 2 + 1 = 3 DMG.
// 2 absorbed by Shield, 1 penetrates to HP!
const shieldedEnemy = {
  id: 'shielded_1',
  name: 'Štítař',
  cell: 3,
  hp: 10,
  maxHp: 10,
  defense: 2,
  statuses: { shield: 2 },
  entityType: 'enemy'
};
const shieldEvents = [];
dealDamage(pushState, shieldedEnemy, 3, { reason: 'test_attack' }, shieldEvents);
assert.strictEqual(shieldedEnemy.statuses?.shield || 0, 0, 'Shield was completely broken');
assert.strictEqual(shieldedEnemy.hp, 9, 'Excess 1 DMG penetrated into HP');
console.log('✓ High raw DMG from Bojové rozlícení punches through Shield and hits HP');

console.log('\n=============================================');
console.log('ALL BOJOVÉ ROZLÍCENÍ TESTS PASSED 100%! 🦅🔥');
console.log('=============================================');
