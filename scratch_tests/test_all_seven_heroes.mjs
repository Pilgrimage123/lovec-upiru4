// @ts-nocheck
import assert from 'node:assert';
import { STARTING_LOADOUTS } from '../src/game/config/loadouts.js';
import { HERO_TILES } from '../src/game/config/tiles.js';
import { createBattleState } from '../src/game/engine/state.js';
import {
  executeHeroTileEffect,
  resolveHeroBump,
  resolveHunterCombo3Bonus
} from '../src/game/engine/combat.js';
import { getHunterDialogue } from '../src/game/config/dialogues.js';

console.log('--- TEST 1: Check All 7 Starting Loadouts ---');
const expectedHeroes = ['classic', 'honza', 'dragoun', 'zlodejka', 'ponocny', 'silak', 'anglicanka'];
for (const hId of expectedHeroes) {
  const loadout = STARTING_LOADOUTS[hId];
  assert(loadout, `Loadout ${hId} must exist`);
  assert(loadout.name, `Loadout ${hId} must have a name`);
  assert(loadout.maxHp > 0, `Loadout ${hId} must have positive HP`);
  assert(loadout.deck.length === 3, `Loadout ${hId} must have 3 starter tiles`);
  console.log(`  ✓ ${loadout.icon} ${loadout.name} (${loadout.maxHp} HP, ${loadout.defense} Obrana)`);
}

console.log('\n--- TEST 2: Silák Gustav - Mechanics & Bump & Combo ---');
const silakState = createBattleState({
  encounterId: 'tutorial_1',
  hunterId: 'silak'
});
assert.strictEqual(silakState.hero.maxHp, 22);
assert.strictEqual(silakState.hero.defense, 1);
assert.strictEqual(silakState.hero.statuses.shield, 1);
assert.strictEqual(silakState.hand.length, 3);
assert.strictEqual(silakState.hand[0].id, 'barbell_slam');
assert.strictEqual(silakState.hand[1].id, 'kettlebell_toss');
assert.strictEqual(silakState.hand[2].id, 'iron_flex');

// Bump test: Cirkusový přehoz (3 DMG, Push 2)
silakState.hero.cell = 2;
silakState.hero.facing = 1;
const dummyEnemy = {
  id: 'dummy_1',
  name: 'Upír',
  cell: 3,
  hp: 10,
  maxHp: 10,
  facing: -1,
  statuses: {},
  entityType: 'enemy'
};
silakState.enemies = [dummyEnemy];
const bumpEvents = [];
resolveHeroBump(silakState, silakState.hero, dummyEnemy, 1, dummyEnemy.cell, 'silak', bumpEvents);
assert.strictEqual(dummyEnemy.hp, 7, 'Dealt 3 DMG');
assert.strictEqual(dummyEnemy.cell, 5, 'Pushed 2 tiles away (3 + 2 = 5)');
assert(bumpEvents.some(e => e.type === 'comic_bubble'), 'Emitted comic bubble');
console.log('  ✓ Cirkusový přehoz: 3 DMG, Push 2, comic bubble emitted');

// 3-Combo test: Litinové finále (+5 Shield, 6 DMG line-of-sight + stun)
const comboEvents = [];
resolveHunterCombo3Bonus(silakState, silakState.hero, comboEvents);
assert(silakState.hero.statuses.shield >= 5, 'Gained +5 Shield');
assert.strictEqual(dummyEnemy.hp, 1, 'Dummy took 6 DMG (7 - 6 = 1)');
assert(dummyEnemy.statuses.stun > 0, 'Dummy is stunned');
assert(comboEvents.some(e => e.type === 'comic_bubble' && e.variant === 'battle_cry'), 'Emitted 3-combo shout bubble');
console.log('  ✓ Litinové finále: +5 Shield, 6 DMG line of sight, Stun 1, shout bubble');

console.log('\n--- TEST 3: Lady Gwendolyn - Mechanics & Bump & Combo ---');
const ladyState = createBattleState({
  encounterId: 'tutorial_1',
  hunterId: 'anglicanka'
});
assert.strictEqual(ladyState.hero.maxHp, 18);
assert.strictEqual(ladyState.hero.defense, 2);
assert.strictEqual(ladyState.hero.statuses.shield, 2);
assert.strictEqual(ladyState.hand.length, 3);
assert.strictEqual(ladyState.hand[0].id, 'silver_parasol');
assert.strictEqual(ladyState.hand[1].id, 'boiling_tea');
assert.strictEqual(ladyState.hand[2].id, 'royal_etiquette');

// Bump test: Klepnutí slunečníkem (2 DMG, turn enemy facing)
ladyState.hero.cell = 2;
ladyState.hero.facing = 1;
const ladyEnemy = {
  id: 'dummy_2',
  name: 'Nevychovaný upír',
  cell: 3,
  hp: 10,
  maxHp: 10,
  facing: -1, // facing toward lady
  statuses: {},
  entityType: 'enemy'
};
ladyState.enemies = [ladyEnemy];
const ladyBumpEvents = [];
resolveHeroBump(ladyState, ladyState.hero, ladyEnemy, 1, ladyEnemy.cell, 'anglicanka', ladyBumpEvents);
assert.strictEqual(ladyEnemy.hp, 8, 'Dealt 2 DMG');
assert.strictEqual(ladyEnemy.facing, 1, 'Turned facing away from lady');
console.log('  ✓ Klepnutí slunečníkem: 2 DMG, otočil nepřítele zády k dámě');

// 3-Combo test: Čaj o páté (+4 HP, +4 Shield, 3 DMG + bleed to all in line)
ladyState.hero.hp = 10;
const ladyComboEvents = [];
resolveHunterCombo3Bonus(ladyState, ladyState.hero, ladyComboEvents);
assert.strictEqual(ladyState.hero.hp, 14, 'Healed 4 HP');
assert(ladyState.hero.statuses.shield >= 4, 'Gained +4 Shield');
assert.strictEqual(ladyEnemy.hp, 5, 'Dummy took 3 DMG (8 - 3 = 5)');
assert(ladyEnemy.statuses.bleed > 0, 'Applied Bleed 2');
console.log('  ✓ Čaj o páté: +4 HP, +4 Shield, 3 DMG + Bleed all in line of sight');

console.log('\n--- TEST 4: Comic Bubble Quotes for New Heroes ---');
const silakCry = getHunterDialogue('silak', 'battle_cries');
console.log(`  Silák Battle Cry: „${silakCry.text}“ (${silakCry.icon} ${silakCry.speaker})`);
assert(silakCry.text.length > 0);

const silakLastWords = getHunterDialogue('silak', 'last_words');
console.log(`  Silák Last Words: „${silakLastWords.text}“`);
assert(silakLastWords.text.includes('...'));

const ladyCry = getHunterDialogue('anglicanka', 'battle_cries');
console.log(`  Lady Gwendolyn Battle Cry: „${ladyCry.text}“ (${ladyCry.icon} ${ladyCry.speaker})`);
assert(ladyCry.text.length > 0);

const ladyQuip = getHunterDialogue('anglicanka', 'quips');
console.log(`  Lady Gwendolyn Quip: „${ladyQuip.text}“`);
assert(ladyQuip.text.length > 0);

console.log('\n=============================================');
console.log('ALL 7 HEROES & COMIC BUBBLE TESTS PASSED 100%!');
console.log('=============================================');
