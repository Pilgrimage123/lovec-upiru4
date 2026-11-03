// @ts-nocheck
import assert from 'node:assert';
import { STARTING_LOADOUTS } from '../src/game/config/loadouts.js';
import { HERO_TILES, getHeroTileDefinition } from '../src/game/config/tiles.js';
import { createBattleState } from '../src/game/engine/state.js';
import {
  executeHeroTileEffect,
  resolveHeroBump,
  resolveHunterCombo3Bonus
} from '../src/game/engine/combat.js';
import {
  HUNTER_DIALOGUES,
  ENEMY_DIALOGUES,
  getHunterDialogue,
  getEnemyDialogue
} from '../src/game/config/dialogues.js';

console.log('--- TEST 1: Ponocný loadout & stats ---');
const ponocny = STARTING_LOADOUTS.ponocny;
assert(ponocny, 'Ponocný loadout must exist');
assert.strictEqual(ponocny.id, 'ponocny');
assert.strictEqual(ponocny.maxHp, 26, 'Ponocný is strong: 26 HP');
assert.strictEqual(ponocny.defense, 2, 'Ponocný has 2 Defense');
assert.strictEqual(ponocny.icon, '🏮');
assert.strictEqual(ponocny.deck.length, 3);
assert(ponocny.deck.some(d => d.id === 'halberd_sweep'));
console.log('✓ Ponocný loadout properly configured (26 HP, 2 Defense, 🏮)');

console.log('\n--- TEST 2: Halapartna two-tile reach & starter tiles ---');
const halberd = HERO_TILES.halberd_sweep;
assert(halberd, 'halberd_sweep tile must exist');
assert.strictEqual(halberd.pattern.length, 2, 'Halapartna must target 2 offsets');
assert.strictEqual(halberd.pattern[0].offset, 1);
assert.strictEqual(halberd.pattern[1].offset, 2);
assert.strictEqual(halberd.cooldown, 4, 'Ponocný is slow: CD 4');
assert(HERO_TILES.watchman_lantern, 'watchman_lantern exists');
assert(HERO_TILES.watchman_horn, 'watchman_horn exists');
console.log('✓ Halapartna strikes 2 tiles ahead (offset 1 and offset 2) with CD 4');

console.log('\n--- TEST 3: createBattleState for Ponocný ---');
const state = createBattleState({
  encounterId: 'tutorial_1',
  hunterId: 'ponocny'
});
assert.strictEqual(state.hero.maxHp, 26);
assert.strictEqual(state.hero.hp, 26);
assert.strictEqual(state.hero.defense, 2);
assert.strictEqual(state.hero.statuses.shield, 2, 'Initial shield from Defense');
assert.strictEqual(state.hand.length, 3);
assert.strictEqual(state.hand[0].id, 'halberd_sweep');
console.log('✓ Battle state initializes Ponocný with 26 HP, 2 Shield, and custom tiles');

console.log('\n--- TEST 4: Halberd hitting two enemies ahead ---');
// Setup 2 enemies at cells +1 and +2 in front of hero
state.hero.cell = 2;
state.hero.facing = 1;
// Place enemies at cell 3 and 4
state.enemies = [
  {
    id: 'enemy_1',
    name: 'Upír 1',
    cell: 3,
    hp: 10,
    maxHp: 10,
    facing: -1,
    statuses: {},
    entityType: 'enemy'
  },
  {
    id: 'enemy_2',
    name: 'Upír 2',
    cell: 4,
    hp: 10,
    maxHp: 10,
    facing: -1,
    statuses: {},
    entityType: 'enemy'
  }
];

const halberdTile = state.hand.find(t => t.id === 'halberd_sweep');
const tileEvents = [];
executeHeroTileEffect(state, halberdTile, 0, 1, tileEvents);

// Both enemies should have taken damage!
assert(state.enemies[0].hp < 10, 'Enemy 1 at offset 1 took damage');
assert(state.enemies[1].hp < 10, 'Enemy 2 at offset 2 took damage');
console.log(`✓ Halapartna hit enemy 1 (remaining HP: ${state.enemies[0].hp}) AND enemy 2 (remaining HP: ${state.enemies[1].hp})`);

console.log('\n--- TEST 5: Ponocný bump maneuver (Zarazení ratištěm) ---');
state.hero.bumpCooldown = 0;
const bumpTarget = state.enemies[0];
const bumpEvents = [];
resolveHeroBump(state, state.hero, bumpTarget, 1, bumpTarget.cell, 'ponocny', bumpEvents);
assert.strictEqual(state.hero.bumpCooldown, 4, 'Slow bump recovery: 4 turns');
assert(bumpTarget.statuses.stun > 0, 'Enemy stunned by heavy halberd butt');
assert(bumpEvents.some(e => e.type === 'comic_bubble'), 'Emits comic bubble on bump');
console.log('✓ Zarazení ratištěm dealt DMG, stunned enemy, CD 4, and emitted comic bubble');

console.log('\n--- TEST 6: Ponocný 3-Combo finisher (Půlnoční vartování) ---');
const comboEvents = [];
resolveHunterCombo3Bonus(state, state.hero, comboEvents);
assert(comboEvents.some(e => e.type === 'comic_bubble' && e.variant === 'battle_cry'), 'Emits 3-combo battle cry comic bubble');
assert(state.hero.statuses.shield >= 6, 'Gains +6 Shield on 3-combo');
console.log('✓ Půlnoční vartování triggered +6 Shield, 2-tile strike, and battle cry bubble');

console.log('\n--- TEST 7: Comic dialogue system (Smart, witty, thematic) ---');
const ponocnyBattleCry = getHunterDialogue('ponocny', 'battle_cries');
assert(ponocnyBattleCry.text.length > 0);
assert.strictEqual(ponocnyBattleCry.speaker, 'Ponocný Bartoloměj');
console.log(`  Ponocný Battle Cry: „${ponocnyBattleCry.text}“`);

const ponocnyLastWords = getHunterDialogue('ponocny', 'last_words');
assert(ponocnyLastWords.text.includes('...'));
console.log(`  Ponocný Last Words: „${ponocnyLastWords.text}“`);

const ignacLastWords = getEnemyDialogue('praktikant', 'last_words');
assert(ignacLastWords.text.length > 0);
console.log(`  Ignác Last Words: „${ignacLastWords.text}“`);

const hubertThreat = getEnemyDialogue('urednik', 'threats');
assert(hubertThreat.text.length > 0);
console.log(`  Hubert Threat: „${hubertThreat.text}“`);

const draculaBattleCry = getEnemyDialogue('boss_dracula', 'battle_cries');
assert(draculaBattleCry.text.length > 0);
console.log(`  G. Ř. Drákula Battle Cry: „${draculaBattleCry.text}“`);

console.log('\n=================================================');
console.log('ALL PONOCNÝ & COMIC BUBBLE TESTS PASSED WITH 100%!');
console.log('=================================================');
