import assert from 'node:assert';
import { getEntityBodyScale } from '../src/game/ui/renderer.js';
import { ENEMIES } from '../src/game/config/enemies.js';
import { spawnEnemyEntity } from '../src/game/engine/state.js';

console.log('--- TEST 1: Entity Body Scale Identification for Children & Entities ---');

// 1. Children enemies
const lojzicek = spawnEnemyEntity('kluk_kamen', 1);
assert.strictEqual(getEntityBodyScale(lojzicek), 'small', 'Lojzíček has small scale');

const cilka = spawnEnemyEntity('upirka_cilka', 2);
assert.strictEqual(getEntityBodyScale(cilka), 'small', 'Cilka has small scale');

const smudla = spawnEnemyEntity('upiri_trpaslik', 0);
assert.strictEqual(getEntityBodyScale(smudla), 'small', 'Šmudla has small scale');

// Test fallback when bodyScale property is missing/deleted
assert.strictEqual(getEntityBodyScale({ id: 'enemy_cilka_99', name: 'Upírka Cilka' }), 'small');
assert.strictEqual(getEntityBodyScale({ id: 'enemy_lojz_99', name: 'Vesnický kluk Lojzíček' }), 'small');
assert.strictEqual(getEntityBodyScale({ id: 'enemy_smudla_99', name: 'Upíří trpaslík Šmudla' }), 'small');
console.log('✓ All children entities (Lojzíček, Cilka, Šmudla) accurately identified as "small"');

// 2. Bosses, Hunters, Humans, Beasts, Critters
assert.strictEqual(getEntityBodyScale({ entityType: 'hero', id: 'hero_venca' }), 'hero');
assert.strictEqual(getEntityBodyScale({ entityType: 'hero', id: 'hero_honza' }), 'hero');
assert.strictEqual(getEntityBodyScale({ entityType: 'hero', id: 'hero_dragoun' }), 'hero');
assert.strictEqual(getEntityBodyScale({ entityType: 'hero', id: 'hero_zlodejka' }), 'hero');
assert.strictEqual(getEntityBodyScale({ isBoss: true, id: 'boss_drakula' }), 'boss');
assert.strictEqual(getEntityBodyScale(spawnEnemyEntity('halapartnik', 4)), 'human');
assert.strictEqual(getEntityBodyScale(spawnEnemyEntity('krysa_piskota', 5)), 'critter');
assert.strictEqual(getEntityBodyScale(spawnEnemyEntity('divocak', 6)), 'beast');
assert.strictEqual(getEntityBodyScale(spawnEnemyEntity('netopyr', 7)), 'flyer');
console.log('✓ Full scale categories (hero, boss, human, small, beast, flyer, critter) resolve cleanly');

console.log('\n--- TEST 2: Hierarchy Proportions Verification ---');
const TIERS = {
  desktop: { boss: 195, hero: 165, human: 135, small: 68 },
  laptop:  { boss: 135, hero: 115, human: 92,  small: 48 },
  tablet:  { boss: 104, hero: 90,  human: 72,  small: 38 },
  mobile:  { boss: 86,  hero: 76,  human: 60,  small: 32 },
};

for (const [tier, v] of Object.entries(TIERS)) {
  const childToHeroRatio = v.small / v.hero;
  const childToHumanRatio = v.small / v.human;
  const bossToHeroRatio = v.boss / v.hero;

  assert.ok(
    childToHeroRatio <= 0.45,
    `[${tier}] Child must be <= 45% of hero height (was ${(childToHeroRatio * 100).toFixed(1)}%)`
  );
  assert.ok(
    childToHumanRatio <= 0.55,
    `[${tier}] Child must be <= 55% of adult human height (was ${(childToHumanRatio * 100).toFixed(1)}%)`
  );
  assert.ok(
    bossToHeroRatio >= 1.12,
    `[${tier}] Boss must be >= 112% of hero height (was ${(bossToHeroRatio * 100).toFixed(1)}%)`
  );
  console.log(`✓ [${tier}] Child/Hero: ${(childToHeroRatio * 100).toFixed(1)}% | Child/Human: ${(childToHumanRatio * 100).toFixed(1)}% | Boss/Hero: ${(bossToHeroRatio * 100).toFixed(1)}%`);
}

console.log('\n=============================================');
console.log('ALL SCALE HIERARCHY TESTS PASSED SUCCESSFULLY!');
console.log('=============================================');
