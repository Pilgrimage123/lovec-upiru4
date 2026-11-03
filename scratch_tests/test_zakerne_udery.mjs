// @ts-nocheck
import assert from 'node:assert';
import { createBattleState, dealDamage, addStatus } from '../src/game/engine/state.js';
import { executeHeroTileEffect, resolveEnemyHitOnTarget, resolveHeroBump } from '../src/game/engine/combat.js';
import { STARTING_LOADOUTS } from '../src/game/config/loadouts.js';

console.log('--- TEST 1: Loadout & Attribute Verification ---');
assert.strictEqual(STARTING_LOADOUTS.zlodejka.backstabBonus, 100, 'Kapsářka Káča has 100% backstab bonus');
const stateVenca = createBattleState({ encounterId: 'tutorial_1', hunterId: 'classic' });
assert.strictEqual(stateVenca.hero.backstabBonus, 50, 'Venca defaults to 50% backstab bonus');
const stateKaca = createBattleState({ encounterId: 'tutorial_1', hunterId: 'zlodejka' });
assert.strictEqual(stateKaca.hero.backstabBonus, 100, 'Káča has 100% backstab bonus in battle state');
console.log('✓ Loadout backstabBonus attributes verified');

console.log('\n--- TEST 2: Zákeřný úder from Behind (Frontal vs Backstab) ---');
// Create a state where hero at cell 2 faces right (+1)
// Enemy at cell 3 faces right (+1) -> Hero hits Enemy from BEHIND!
stateVenca.hero.cell = 2;
stateVenca.hero.facing = 1;
stateVenca.hero.currentFury = 0; // Test purely backstab first

const targetBehind = {
  id: 'target_behind',
  name: 'Otočený upír',
  cell: 3,
  hp: 20,
  maxHp: 20,
  facing: 1, // Facing same as hero -> back is exposed
  statuses: {},
  entityType: 'enemy'
};
stateVenca.enemies = [targetBehind];

// Attack tile with base 2 DMG
const tileSlash2 = {
  id: 'test_slash',
  name: 'Sek',
  dmg: 2,
  type: 'attack',
  pattern: [{ offset: 1, dmg: 2, effects: [] }]
};

const events1 = [];
executeHeroTileEffect(stateVenca, tileSlash2, 0, 1, events1);
// Base 2 DMG + 50% (Math.round(2 * 0.5) = 1) = 3 DMG!
assert.strictEqual(targetBehind.hp, 17, 'Dealt 3 DMG (2 + 1) from behind');
assert(events1.some(e => e.type === 'log' && e.text.includes('Zákeřný úder')), 'Emitted Zákeřný úder log');
console.log('✓ Hit from behind deals +50% DMG (2 -> 3 DMG)');

console.log('\n--- TEST 3: Zákeřný úder on Confused Enemy (Facing Front) ---');
// Enemy at cell 3 faces left (-1) -> Face-to-face with Hero!
// But enemy has status confusion (❓)!
targetBehind.hp = 20;
targetBehind.facing = -1; // Facing hero
addStatus(targetBehind, 'confusion', 1);

const events2 = [];
executeHeroTileEffect(stateVenca, tileSlash2, 0, 1, events2);
// Face to face, BUT confused -> Zákeřný úder triggers!
assert.strictEqual(targetBehind.hp, 17, 'Dealt 3 DMG (2 + 1) against confused target');
assert(events2.some(e => e.type === 'log' && e.text.includes('zmateného cíle')), 'Logged strike on confused target');
console.log('✓ Hit on confused enemy triggers Zákeřný úder (+50%) even when facing front');

console.log('\n--- TEST 4: Binary Stacking (Facing Behind AND Confused = 50%, not 100%) ---');
// Enemy faces away (1) AND is confused!
targetBehind.hp = 20;
targetBehind.facing = 1;
targetBehind.statuses.confusion = 1;

const events3 = [];
executeHeroTileEffect(stateVenca, tileSlash2, 0, 1, events3);
// Still +50% (1 bonus DMG), does NOT double-dip to +100%
assert.strictEqual(targetBehind.hp, 17, 'Dealt 3 DMG (no double-dipping)');
console.log('✓ Facing behind AND confused applies +50% once without double-dipping');

console.log('\n--- TEST 5: Kapsářka Káča Master Bonus (+100% DMG) ---');
stateKaca.hero.cell = 2;
stateKaca.hero.facing = 1;
stateKaca.hero.currentFury = 0;

const kacaTarget = {
  id: 'kaca_target',
  name: 'Káčina oběť',
  cell: 3,
  hp: 20,
  maxHp: 20,
  facing: 1, // Facing away
  statuses: {},
  entityType: 'enemy'
};
stateKaca.enemies = [kacaTarget];

// Standard card with 2 DMG without hardcoded backstabDmg
const events4 = [];
executeHeroTileEffect(stateKaca, tileSlash2, 0, 1, events4);
// Base 2 DMG + 100% = 4 DMG!
assert.strictEqual(kacaTarget.hp, 16, 'Dealt 4 DMG (2 + 2) with Káča +100% bonus');
console.log('✓ Kapsářka Káča deals +100% (double damage) on Zákeřný úder');

console.log('\n--- TEST 6: Normal Frontal Hit deals standard damage ---');
// Enemy at cell 3 faces hero (-1) and has NO confusion
kacaTarget.hp = 20;
kacaTarget.facing = -1;
delete kacaTarget.statuses.confusion;

const events5 = [];
executeHeroTileEffect(stateKaca, tileSlash2, 0, 1, events5);
assert.strictEqual(kacaTarget.hp, 18, 'Dealt normal 2 DMG (no sneak bonus)');
console.log('✓ Normal frontal hit deals base damage without bonus');

console.log('\n--- TEST 7: Enemy Zákeřný úder on Hero ---');
// Enemy at cell 4 faces left (-1)
// Hero at cell 3 faces left (-1) -> Enemy hits Hero in the back!
const enemyAttacker = {
  id: 'rogue_enemy',
  name: 'Vrahoun',
  cell: 4,
  facing: -1,
  currentFury: 0,
  backstabBonus: 50,
  entityType: 'enemy'
};
stateVenca.hero.cell = 3;
stateVenca.hero.facing = -1; // Facing away from enemy!
stateVenca.hero.hp = 20;
delete stateVenca.hero.statuses.shield;

const enemyPatternStep = { dmg: 2, effects: [] };
const enemyTileDef = { id: 'knife_stab', name: 'Bodnutí dýkou' };
const events6 = [];

resolveEnemyHitOnTarget(
  stateVenca,
  enemyAttacker,
  enemyTileDef,
  enemyPatternStep,
  stateVenca.hero,
  0,
  0,
  events6
);
// Enemy deals 2 DMG + 50% = 3 DMG to Hero!
assert.strictEqual(stateVenca.hero.hp, 17, 'Hero took 3 DMG (2 + 1) from behind');
assert(events6.some(e => e.type === 'log' && e.text.includes('Zákeřný úder')), 'Logged enemy Zákeřný úder on hero');
console.log('✓ Enemy correctly executes Zákeřný úder on Hero when hitting from behind');

console.log('\n=============================================');
console.log('ALL ZÁKEŘNÝ ÚDER TESTS PASSED 100%! 🗡️✨');
console.log('=============================================');
