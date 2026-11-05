import assert from 'node:assert/strict';
import { createBattleState, dealDamage, getEntityAt, hasStatus } from '../src/game/engine/state.js';
import {
  stepHero,
  turnHero,
  resolveHeroBump,
  resolveHunterCombo3Bonus,
  advanceTurnAfterPlayerAction
} from '../src/game/engine/combat.js';
import { STARTING_LOADOUTS } from '../src/game/config/loadouts.js';
import { getHunterDialogue } from '../src/game/config/dialogues.js';

console.log('--- TEST 1: Sokol Venca Identity & Loadout ---');
{
  const venca = STARTING_LOADOUTS.classic;
  assert.equal(venca.name, 'Sokol Venca Česnek');
  assert.equal(venca.shortName, 'Sokol Venca');
  assert.equal(venca.icon, '🦅');
  assert.equal(venca.epithet, 'Sokolský cvičenec a pěstitel česneku');
  assert.equal(venca.bumpName, 'Sokolský náraz');
  assert.equal(venca.comboName, 'Sokolská prostná');
  assert.ok(venca.description.includes('Sokola'), 'Description includes Sokol');
  console.log('✓ Sokol Venca identity verified');
}

console.log('--- TEST 2: Sokolský náraz (1 DMG, Push 1, Garlic Cloud 2 turns) ---');
{
  const state = createBattleState({ hunterId: 'venca' });
  state.props = [];
  state.hero.cell = 2;
  state.hero.facing = 1;

  const enemy = {
    id: 'drab_1',
    name: 'Dráb',
    entityType: 'enemy',
    ichor: 'red',
    hp: 10,
    maxHp: 10,
    cell: 3,
    facing: -1,
    statuses: {}
  };
  state.enemies = [enemy];

  const events = [];
  resolveHeroBump(state, state.hero, enemy, 1, 3, 'venca', events);

  // 1 DMG dealt
  assert.equal(enemy.hp, 9, 'Dealt 1 DMG');
  // Pushed to cell 4
  assert.equal(enemy.cell, 4, 'Pushed 1 cell to cell 4');
  // Cloud spawned on cell 4 (where enemy was pushed)
  assert.equal(state.terrain[4]?.type, 'garlic_cloud', 'Garlic cloud on cell 4');
  assert.equal(state.terrain[4]?.duration, 2, 'Cloud lasts 2 rounds');
  // Cooldown 3
  assert.equal(state.hero.bumpCooldown, 3, 'Bump cooldown is 3');

  console.log('✓ Sokolský náraz mechanics verified');
}

console.log('--- TEST 3: Sokolská prostná 3-Combo (+4 Shield, 3 DMG & ❓ both Front and Back) ---');
{
  const state = createBattleState({ hunterId: 'venca' });
  state.props = [];
  state.hero.cell = 3;
  state.hero.facing = 1;

  // Enemy A: cell 1 (dist 2 behind hero)
  const enemyBehindFar = {
    id: 'e_behind_far',
    name: 'Upír za zády (2 pole)',
    entityType: 'enemy',
    ichor: 'blue',
    hp: 10,
    maxHp: 10,
    cell: 1,
    facing: 1,
    statuses: {}
  };
  // Enemy B: cell 2 (dist 1 behind hero)
  const enemyBehindNear = {
    id: 'e_behind_near',
    name: 'Upír za zády (1 pole)',
    entityType: 'enemy',
    ichor: 'blue',
    hp: 10,
    maxHp: 10,
    cell: 2,
    facing: 1,
    statuses: {}
  };
  // Enemy C: cell 4 (dist 1 in front of hero)
  const enemyFrontNear = {
    id: 'e_front_near',
    name: 'Upír vpředu (1 pole)',
    entityType: 'enemy',
    ichor: 'blue',
    hp: 10,
    maxHp: 10,
    cell: 4,
    facing: -1,
    statuses: {}
  };
  // Enemy D: cell 5 (dist 2 in front of hero)
  const enemyFrontFar = {
    id: 'e_front_far',
    name: 'Upír vpředu (2 pole)',
    entityType: 'enemy',
    ichor: 'blue',
    hp: 10,
    maxHp: 10,
    cell: 5,
    facing: -1,
    statuses: {}
  };
  // Enemy E: cell 6 (dist 3 in front of hero - should NOT be hit)
  const enemyTooFar = {
    id: 'e_too_far',
    name: 'Upír příliš daleko (3 pole)',
    entityType: 'enemy',
    ichor: 'blue',
    hp: 10,
    maxHp: 10,
    cell: 6,
    facing: -1,
    statuses: {}
  };

  state.enemies = [enemyBehindFar, enemyBehindNear, enemyFrontNear, enemyFrontFar, enemyTooFar];

  const events = [];
  resolveHunterCombo3Bonus(state, state.hero, events);

  // Venca gains +4 Shield (1 initial from Defense + 4 = 5)
  assert.equal(state.hero.statuses?.shield, 5, 'Venca has 1 initial Defense + 4 combo shield = 5 Shield');

  // Enemies at dist 1 and 2 (both front and behind) take 3 DMG and gain ❓
  for (const e of [enemyBehindFar, enemyBehindNear, enemyFrontNear, enemyFrontFar]) {
    assert.equal(e.hp, 7, `${e.name} took 3 DMG (10 - 3 = 7)`);
    assert.equal(hasStatus(e, 'confusion'), true, `${e.name} gained Zmatení ❓`);
  }

  // Enemy at dist 3 was not hit
  assert.equal(enemyTooFar.hp, 10, 'Enemy at dist 3 took 0 DMG');
  assert.equal(hasStatus(enemyTooFar, 'confusion'), false, 'Enemy at dist 3 not confused');

  // NO garlic cloud was spawned by Sokolská prostná
  for (let c = 0; c < state.terrain.length; c++) {
    assert.notEqual(state.terrain[c]?.type, 'garlic_cloud', `Cell ${c} has no garlic cloud`);
  }

  console.log('✓ Sokolská prostná (+4 Shield, 3 DMG + ❓ at dist 1-2 front & back, NO garlic) verified');
}

console.log('--- TEST 4: Dialogues & Comic Bubbles for Sokol Venca ---');
{
  const cry = getHunterDialogue('venca', 'battle_cries');
  assert.equal(cry.speaker, 'Sokol Venca');
  assert.equal(cry.icon, '🦅');
  assert.ok(cry.text.length > 0);
  console.log(`  Sokol Battle Cry: „${cry.text}“ (${cry.icon} ${cry.speaker})`);

  const threat = getHunterDialogue('venca', 'threats');
  assert.equal(threat.speaker, 'Sokol Venca');
  console.log(`  Sokol Threat: „${threat.text}“`);

  const lastWords = getHunterDialogue('venca', 'last_words');
  assert.equal(lastWords.speaker, 'Sokol Venca');
  console.log(`  Sokol Last Words: „${lastWords.text}“`);

  console.log('✓ Sokol Venca dialogues verified');
}

console.log('--- TEST 5: Free turn in Garlic Cloud (Venca only) ---');
{
  const stateVenca = createBattleState({ hunterId: 'venca' });
  stateVenca.hero.cell = 2;
  stateVenca.hero.facing = 1;
  stateVenca.terrain[2] = { type: 'garlic_cloud', duration: 2 };

  const turnResVenca = turnHero(stateVenca);
  assert.equal(turnResVenca.ok, true);
  assert.equal(stateVenca.hero.facing, -1, 'Turned around');
  const turnEvtVenca = turnResVenca.events.find((e) => e.type === 'turn');
  assert.equal(turnEvtVenca.free, true, 'Turn was FREE inside garlic cloud for Venca');
  assert.equal(turnResVenca.freeTurn, true, 'Venca gets freeTurn: true');

  // Other hunters do NOT get free turn in garlic cloud
  const stateHonza = createBattleState({ hunterId: 'honza' });
  stateHonza.hero.cell = 2;
  stateHonza.hero.facing = 1;
  stateHonza.terrain[2] = { type: 'garlic_cloud', duration: 2 };

  const turnResHonza = turnHero(stateHonza);
  assert.equal(turnResHonza.ok, true);
  assert.equal(stateHonza.hero.facing, -1, 'Turned around');
  const turnEvtHonza = turnResHonza.events.find((e) => e.type === 'turn');
  assert.equal(turnEvtHonza.free, false, 'Turn was NOT free for Honza inside garlic cloud');
  assert.equal(Boolean(turnResHonza.freeTurn), false, 'Honza freeTurn is false');

  console.log('✓ Free turn in garlic cloud verified for Venca, normal turn for other hunters');
}

console.log('--- TEST 6: Venca Garlic Grenade on entering Zubatá ---');
{
  const state = createBattleState({ hunterId: 'classic', heroHp: 3, heroMaxHp: 20, persistence: 5 });
  state.hero.cell = 3;
  state.hero.statuses = {};

  const enemyNear = {
    id: 'test_enemy_1',
    name: 'Netopýří zplozenec',
    entityType: 'enemy',
    kind: 'bat',
    hp: 10,
    maxHp: 10,
    cell: 2,
    facing: 1,
    statuses: {}
  };
  const torpidVampire = {
    id: 'test_vampire_1',
    name: 'Hraběcí nohsled',
    entityType: 'enemy',
    kind: 'vampire',
    hp: 0,
    maxHp: 10,
    cell: 4,
    facing: -1,
    isTorpid: true,
    torporTurnsLeft: 2,
    statuses: { torpor: 2 }
  };
  state.enemies = [enemyNear, torpidVampire];

  const events = [];
  dealDamage(state, state.hero, 5, { reason: 'test_hit' }, events);

  assert.equal(state.hero.hp, -2, 'Hero dropped to -2 HP (Zubatá)');
  assert.equal(state.hero.isReaperActive, true, 'Zubatá is active');

  // Garlic cloud spawned on cell 2, 3, 4
  assert.equal(state.terrain[2]?.type, 'garlic_cloud', 'Cell 2 has garlic cloud');
  assert.equal(state.terrain[3]?.type, 'garlic_cloud', 'Cell 3 has garlic cloud');
  assert.equal(state.terrain[4]?.type, 'garlic_cloud', 'Cell 4 has garlic cloud');

  // Enemy on cell 2 is confused
  assert.equal(hasStatus(enemyNear, 'confusion'), true, 'Enemy on cell 2 gained Zmatení');

  // Torpid vampire on cell 4 was finished
  assert.equal(torpidVampire.isTorpid, false, 'Torpid vampire was finished');
  assert.equal(torpidVampire.deathResolved, true, 'Torpid vampire death resolved');

  // Log event emitted
  const hasLog = events.some((e) => e.type === 'log' && e.text.includes('Česnekový granát'));
  assert.equal(hasLog, true, 'Log announced garlic grenade detonation on Zubatá');

  console.log('✓ Garlic grenade detonation on entering Zubatá verified');
}

console.log('--- TEST 7: All hunters immune to Garlic Cloud ---');
{
  for (const hunterId of ['venca', 'honza', 'dragoun', 'zlodejka', 'ponocny', 'silak', 'anglicanka', 'helsing', 'revident']) {
    const state = createBattleState({ hunterId, heroHp: 10 });
    const events = [];
    const dmg = dealDamage(state, state.hero, 5, { reason: 'garlic_cloud' }, events);
    assert.equal(dmg, 0, `${hunterId} took 0 dmg from garlic_cloud`);
    assert.equal(state.hero.hp, 10, `${hunterId} HP unchanged`);
  }
  console.log('✓ All 9 hunters verified immune to garlic cloud damage');
}

console.log('\n=============================================');
console.log('ALL SOKOL VENCA MECHANICS TESTS PASSED 100%! 🎉');
console.log('=============================================');
