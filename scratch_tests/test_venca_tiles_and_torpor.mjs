import assert from 'node:assert/strict';
import {
  createBattleState,
  dealDamage,
  addStatus,
  hasStatus,
  pushEntity,
  getEntityAt,
  isVampireEntity,
  isHumanEntity,
  canDamageFinishVampires
} from '../src/game/engine/state.js';
import {
  stepHero,
  resolveHeroBump,
  advanceTurnAfterPlayerAction,
  resolveEnemyPhase,
  executeHeroTileEffect,
  checkBattleEnd
} from '../src/game/engine/combat.js';
import { getHeroTileDefinition } from '../src/game/config/tiles.js';
import { STARTING_LOADOUTS } from '../src/game/config/loadouts.js';

console.log('--- TEST 1: Venca Starting Loadout & Tile Definitions ---');
{
  const vencaLoadout = STARTING_LOADOUTS.classic;
  assert.equal(vencaLoadout.name, 'Štamgast Venca Česnek');
  const deckIds = vencaLoadout.deck.map((d) => d.id);
  assert.deepEqual(deckIds, ['falcon_claw', 'garlic_grenade', 'skok_pres_kozu']);

  const falcon = getHeroTileDefinition('falcon_claw');
  assert.equal(falcon.name, 'Sokolí spár');
  assert.equal(falcon.cooldown, 2);
  assert.equal(falcon.dmg, 4);

  const grenade = getHeroTileDefinition('garlic_grenade');
  assert.equal(grenade.name, 'Česnekový granát');
  assert.equal(grenade.cooldown, 3);
  assert.equal(grenade.isLobbed, true);
  assert.equal(grenade.lobDistance, 3);

  const vault = getHeroTileDefinition('skok_pres_kozu');
  assert.equal(vault.name, 'Skok přes kozu');
  assert.equal(vault.cooldown, 2);
  assert.equal(vault.leapDistance, 2);
  assert.equal(vault.leaveGarlicCloudRadius1, true);

  console.log('✓ Loadout and tile definitions verified');
}

console.log('--- TEST 2: Sokolí spár (Pull 1, +2 DMG against Humans) ---');
{
  // Test 2A: Hit human (drab) at range 2 -> 4 + 2 = 6 DMG, pulled to range 1
  const stateA = createBattleState({ hunterId: 'venca' });
  stateA.props = [];
  stateA.hero.cell = 2;
  stateA.hero.facing = 1;
  const humanEnemy = {
    id: 'drab_1',
    kind: 'drab',
    name: 'Císařský dráb',
    entityType: 'enemy',
    ichor: 'red',
    bodyScale: 'human',
    hp: 15,
    maxHp: 15,
    cell: 4,
    facing: -1,
    statuses: {}
  };
  stateA.enemies = [humanEnemy];

  assert.equal(isHumanEntity(humanEnemy), true, 'Drab is human');
  assert.equal(isVampireEntity(humanEnemy), false, 'Drab is not vampire');

  const tileFalcon = { ...getHeroTileDefinition('falcon_claw'), instanceId: 't_falcon' };
  const eventsA = [];
  executeHeroTileEffect(stateA, tileFalcon, 0, 1, eventsA);

  assert.equal(humanEnemy.hp, 9, 'Dealt 6 DMG to human (4 base + 2 human bonus)');
  assert.equal(humanEnemy.cell, 3, 'Pulled from cell 4 to cell 3 (1 step closer)');

  // Test 2B: Hit human at range 1 -> 6 DMG, target stays at cell 3 (0 steps pull, no collision)
  executeHeroTileEffect(stateA, tileFalcon, 0, 1, []);
  assert.equal(humanEnemy.hp, 3, 'Dealt another 6 DMG');
  assert.equal(humanEnemy.cell, 3, 'Stayed at cell 3 (cannot be pulled into hero)');

  // Test 2C: Hit vampire (praktikant) at range 2 -> 4 DMG (no human bonus), pulled to range 1
  const stateC = createBattleState({ hunterId: 'venca' });
  stateC.props = [];
  stateC.hero.cell = 2;
  stateC.hero.facing = 1;
  const vampEnemy = {
    id: 'vamp_1',
    kind: 'praktikant',
    name: 'Upíří praktikant',
    entityType: 'enemy',
    ichor: 'blue',
    bodyScale: 'human',
    hp: 10,
    maxHp: 10,
    cell: 4,
    facing: -1,
    statuses: {}
  };
  stateC.enemies = [vampEnemy];

  assert.equal(isVampireEntity(vampEnemy), true, 'Praktikant is vampire');
  assert.equal(isHumanEntity(vampEnemy), false, 'Praktikant is not human');

  executeHeroTileEffect(stateC, tileFalcon, 0, 1, []);
  assert.equal(vampEnemy.hp, 6, 'Dealt 4 DMG (no human bonus)');
  assert.equal(vampEnemy.cell, 3, 'Pulled from cell 4 to cell 3');

  console.log('✓ Sokolí spár human damage bonus and pull logic verified');
}

console.log('--- TEST 3: Česnekový granát (Lob 3, Confusion, Finishes Torpid Vampires) ---');
{
  const state = createBattleState({ hunterId: 'venca' });
  state.props = [];
  state.reinforcements = [];
  state.hero.cell = 1;
  state.hero.facing = 1;

  // Enemy standing at cell 2 (should be jumped over by lob)
  const enemyMiddle = {
    id: 'em_1',
    kind: 'drab',
    name: 'Dráb',
    entityType: 'enemy',
    ichor: 'red',
    hp: 10,
    maxHp: 10,
    cell: 2,
    facing: -1,
    statuses: {}
  };
  // Enemy standing at cell 4 (impact = 1 + 3 = 4)
  const enemyTarget = {
    id: 'et_1',
    kind: 'urednik',
    name: 'Úředník',
    entityType: 'enemy',
    ichor: 'blue',
    hp: 10,
    maxHp: 10,
    cell: 4,
    facing: -1,
    statuses: {}
  };
  // Torpid vampire at cell 5 (within radius 1 of impact: cells 3, 4, 5)
  const torpidVamp = {
    id: 'tv_1',
    kind: 'upirka_cilka',
    name: 'Upírka Cílka',
    entityType: 'enemy',
    ichor: 'blue',
    hp: 0,
    maxHp: 8,
    cell: 5,
    facing: -1,
    isTorpid: true,
    torporTurnsLeft: 2,
    statuses: { torpor: 2 }
  };

  state.enemies = [enemyMiddle, enemyTarget, torpidVamp];

  const grenade = { ...getHeroTileDefinition('garlic_grenade'), instanceId: 't_grenade' };
  const events = [];
  executeHeroTileEffect(state, grenade, 0, 1, events);

  // Cloud should be at 3, 4, 5
  assert.equal(state.terrain[3]?.type, 'garlic_cloud', 'Cloud at cell 3');
  assert.equal(state.terrain[4]?.type, 'garlic_cloud', 'Cloud at cell 4');
  assert.equal(state.terrain[5]?.type, 'garlic_cloud', 'Cloud at cell 5');

  // Enemy at cell 2 was jumped over (not in radius, no cloud at cell 2)
  assert.notEqual(state.terrain[2]?.type, 'garlic_cloud', 'No cloud at cell 2');
  assert.equal(hasStatus(enemyMiddle, 'confusion'), false, 'Enemy at cell 2 not confused');

  // Enemy at cell 4 is in radius -> gains confusion
  assert.equal(hasStatus(enemyTarget, 'confusion'), true, 'Enemy at impact cell is confused ❓');

  // Torpid vampire at cell 5 was in radius -> finished!
  assert.equal(torpidVamp.isTorpid, false, 'Torpid vampire finished');
  assert.equal(torpidVamp.deathResolved, true, 'Torpid vampire death resolved');

  console.log('✓ Česnekový granát lob, cloud spawn, confusion, and vampire finish verified');
}

console.log('--- TEST 4: Skok přes kozu (Leap 2, Untouched Target, Garlic Cloud Radius 1) ---');
{
  const state = createBattleState({ hunterId: 'venca' });
  state.props = [];
  state.hero.cell = 2;
  state.hero.facing = 1;

  const enemyObstacle = {
    id: 'obs_1',
    kind: 'drab',
    name: 'Dráb',
    entityType: 'enemy',
    ichor: 'red',
    hp: 10,
    maxHp: 10,
    cell: 3,
    facing: -1,
    statuses: {}
  };
  state.enemies = [enemyObstacle];

  const vault = { ...getHeroTileDefinition('skok_pres_kozu'), instanceId: 't_vault' };
  const events = [];
  executeHeroTileEffect(state, vault, 0, 1, events);

  // Hero leaped from 2 to 4
  assert.equal(state.hero.cell, 4, 'Hero leaped to cell 4');

  // Enemy at cell 3 is untouched!
  assert.equal(enemyObstacle.hp, 10, 'Enemy took 0 damage');
  assert.equal(enemyObstacle.facing, -1, 'Enemy facing untouched');
  assert.equal(hasStatus(enemyObstacle, 'confusion'), false, 'Enemy not confused');

  // Garlic cloud spawned on fromCell ± 1 (cells 1, 2, 3)
  assert.equal(state.terrain[1]?.type, 'garlic_cloud', 'Cloud at cell 1');
  assert.equal(state.terrain[2]?.type, 'garlic_cloud', 'Cloud at cell 2');
  assert.equal(state.terrain[3]?.type, 'garlic_cloud', 'Cloud at cell 3');

  // Turn turnover: enemy at cell 3 starts turn in garlic cloud -> takes 1 DMG (human)
  advanceTurnAfterPlayerAction(state, []);
  assert.equal(enemyObstacle.hp, 9, 'Enemy took 1 DMG from garlic cloud on turn turnover');

  console.log('✓ Skok přes kozu leap, untouched enemy, and 3-cell garlic cloud verified');
}

console.log('--- TEST 5: Vampire Torpor & Stake Finishing Mechanics ---');
{
  const state = createBattleState({ hunterId: 'venca' });
  state.props = [];
  state.reinforcements = [];
  state.hero.cell = 1;
  state.hero.facing = 1;

  const vampire = {
    id: 'vamp_boss_cand',
    kind: 'urednik',
    name: 'C. k. úředník',
    entityType: 'enemy',
    ichor: 'blue',
    bodyScale: 'human',
    hp: 4,
    maxHp: 10,
    cell: 2,
    facing: -1,
    statuses: {}
  };
  state.enemies = [vampire];

  // Subtest 5A: Dropping to 0 HP induces Torpor (does not die)
  dealDamage(state, vampire, 4, { reason: 'generic_strike' }, []);
  assert.equal(vampire.hp, 0, 'HP is 0');
  assert.equal(vampire.isTorpid, true, 'Entered Torpor');
  assert.equal(vampire.torporTurnsLeft, 2, '2 turns left in torpor');
  assert.equal(vampire.statuses?.torpor, 2, 'Has torpor status 💤2');
  assert.equal(checkBattleEnd(state), 'playing', 'Battle is not won while vampire is torpid');

  // Subtest 5B: Torpid vampire blocks cell from other entities
  assert.equal(getEntityAt(state, 2), vampire, 'Torpid vampire occupies cell 2');

  // Subtest 5C: Non-finisher damage against torpid vampire deals 0 damage and does not slay it
  const dealtNonFinisher = dealDamage(state, vampire, 5, { reason: 'fist_punch' }, []);
  assert.equal(dealtNonFinisher, 0, 'Non-finisher deals 0 DMG to torpid vampire');
  assert.equal(vampire.isTorpid, true, 'Still torpid');

  // Subtest 5D: Step hero into torpid vampire -> stakes it through the heart, kills it, hero moves to cell 2
  const stepRes = stepHero(state, 1);
  assert.equal(stepRes.ok, true, 'Step action succeeds');
  assert.equal(state.hero.bumpCooldown, 0, 'Normal bump cooldown was NOT triggered');
  assert.equal(vampire.isTorpid, false, 'No longer torpid');
  assert.equal(vampire.deathResolved, true, 'Vampire is permanently slain');
  assert.equal(state.hero.cell, 2, 'Hero stepped onto cell 2');
  assert.equal(checkBattleEnd(state), 'won', 'Battle won after staking final vampire');

  // Subtest 5E: Vampire Revival after 2 rounds if not staked
  const stateRev = createBattleState({ hunterId: 'venca' });
  stateRev.props = [];
  stateRev.hero.cell = 0;
  stateRev.hero.facing = 1;
  const revivingVamp = {
    id: 'vamp_rev',
    kind: 'upirka_cilka',
    name: 'Upírka Cílka',
    entityType: 'enemy',
    ichor: 'blue',
    bodyScale: 'human',
    hp: 0,
    maxHp: 10,
    cell: 3,
    facing: -1,
    isTorpid: true,
    torporTurnsLeft: 2,
    statuses: { torpor: 2 }
  };
  stateRev.enemies = [revivingVamp];

  // Round 1 turnover: decrements to 1
  advanceTurnAfterPlayerAction(stateRev, []);
  assert.equal(revivingVamp.isTorpid, true, 'Still torpid after round 1');
  assert.equal(revivingVamp.torporTurnsLeft, 1, '1 round left');

  // Round 2 turnover: revives with half HP (10 / 2 = 5 HP)!
  advanceTurnAfterPlayerAction(stateRev, []);
  assert.equal(revivingVamp.isTorpid, false, 'Revived after round 2');
  assert.equal(revivingVamp.hp, 5, 'Revived with 5 HP (half of 10)');
  assert.equal(revivingVamp.statuses?.torpor, undefined, 'Torpor status cleared');

  console.log('✓ Vampire torpor, non-finisher immunity, staking, and revival verified');
}

console.log('\n=============================================');
console.log('ALL VENCA TILES & TORPOR TESTS PASSED 100%! 🎉');
console.log('=============================================');
