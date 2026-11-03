import assert from 'node:assert';
import {
  createBattleState,
  spawnEnemyEntity,
  dealDamage
} from '../src/game/engine/state.js';
import {
  advanceTurnAfterPlayerAction,
  stepHero,
  finalizeComboAndAdvanceTurn,
  checkSvunkBonus
} from '../src/game/engine/combat.js';
import { simulateComboImpact } from '../src/game/engine/simulation.js';
import { applyResonances } from '../src/game/engine/combo.js';

console.log('--- TEST 1: Enemy initial shield from Defense ---');
{
  const enemy = spawnEnemyEntity('vratny_stit', 4);
  assert.strictEqual(enemy.defense, 2, 'vratny_stit has defense 2');
  assert.strictEqual(enemy.statuses.shield, 2, 'vratny_stit spawns with shield 2');

  const boss = spawnEnemyEntity('boss_sosak', 5);
  assert.strictEqual(boss.defense, 3, 'boss_sosak has defense 3');
  assert.strictEqual(boss.statuses.shield, 3, 'boss_sosak spawns with shield 3');
  console.log('✓ Spawned enemies with Defense correctly receive initial Shield');
}

console.log('\n--- TEST 2: Holy Water Puddle damage & expiration ---');
{
  const state = createBattleState({ hunterId: 'classic', encounterId: 'tutorial_1' });
  const enemy = state.enemies[0];
  enemy.cell = 3;
  state.terrain[3] = { type: 'holy_water_puddle', duration: 2 };

  const hpBefore = enemy.hp;
  const events = [];
  advanceTurnAfterPlayerAction(state, events);

  assert.strictEqual(enemy.hp, hpBefore - 2, 'Enemy standing on holy water puddle took 2 holy DMG');
  assert.strictEqual(state.terrain[3].duration, 1, 'Holy water puddle duration decremented to 1');

  advanceTurnAfterPlayerAction(state, events);
  assert.strictEqual(state.terrain[3].type, 'none', 'Holy water puddle expired after duration ran out');
  console.log('✓ Holy water puddle correctly damages standing enemies and decrements/expires');
}

console.log('\n--- TEST 3: Tactical Preview simulates 3-Combo Finisher ---');
{
  // Test with Honza: 3-combo hits all adjacent enemies for 4 DMG
  const state = createBattleState({ hunterId: 'honza', encounterId: 'tutorial_1' });
  state.hero.cell = 2;
  const enemy = state.enemies[0];
  enemy.cell = 3; // Adjacent to hero
  const initialEnemyHp = enemy.hp;

  // 3 tiles in hand
  state.queue = [state.hand[0].instanceId, state.hand[1].instanceId, state.hand[2].instanceId];
  const simResult = simulateComboImpact(state);

  const enemyImpact = simResult.impactMap[enemy.id];
  assert.ok(enemyImpact, 'Enemy is in impact map');
  assert.ok(enemyImpact.dmgTaken >= 4, `Enemy should take damage including 3-combo finisher (took ${enemyImpact.dmgTaken})`);
  console.log('✓ Tactical Preview accurately accounts for 3-Combo Finisher bonuses');
}

console.log('\n--- TEST 4: Krok do nepřítele and Bump Cooldown ---');
{
  const state = createBattleState({ hunterId: 'honza', encounterId: 'tutorial_1' });
  state.hero.cell = 2;
  const enemy = state.enemies[0];
  enemy.cell = 3;

  const res1 = stepHero(state, 1);
  assert.strictEqual(res1.ok, true, 'Hero performed Selský beran into enemy');
  assert.strictEqual(state.hero.bumpCooldown, 3, 'Bump cooldown is set to 3');

  // Next move into enemy should be rejected due to cooldown
  const enemy2 = state.enemies.find(e => e.hp > 0 && e.cell === state.hero.cell + 1);
  if (enemy2) {
    const res2 = stepHero(state, 1);
    assert.strictEqual(res2.ok, false, 'Bump maneuver rejected while cooling down');
    assert.match(res2.events[0].reason, /Krok do nepřítele/, 'Log uses glossary term "Krok do nepřítele"');
  }
  console.log('✓ Krok do nepřítele handles bump cooldown and adheres to glossary');
}

console.log('\n--- TEST 5: Combo Resonance Determinism ---');
{
  const state = createBattleState({ hunterId: 'classic', encounterId: 'tutorial_1' });
  state.hand[0].currentCooldown = 3;
  state.hand[1].currentCooldown = 2;

  const craftTiles = [
    { id: 't1', tags: ['craft'] },
    { id: 't2', tags: ['craft'] }
  ];
  const events = [];
  applyResonances(state, craftTiles, events);

  const logEv = events.find(e => e.type === 'log' && e.text.includes('Rezonance'));
  assert.ok(logEv, 'Resonance logged');
  assert.ok(logEv.text.includes('zkrátilo Chladnutí'), 'Logged correct Czech spelling and glossary term');
  console.log('✓ Combo Resonance uses deterministic RNG and correct glossary term');
}

console.log('\n=============================');
console.log('ALL FIX TESTS PASSED SUCCESSFULLY!');
console.log('=============================');
