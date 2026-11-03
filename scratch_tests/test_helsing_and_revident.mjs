import assert from 'node:assert/strict';
import { createBattleState, dealDamage, addStatus, hasStatus, consumeStatus } from '../src/game/engine/state.js';
import {
  stepHero,
  turnHero,
  executeHeroTileEffect,
  resolveHeroBump,
  resolveHunterCombo3Bonus,
  advanceTurnAfterPlayerAction
} from '../src/game/engine/combat.js';
import { getHeroTileDefinition } from '../src/game/config/tiles.js';
import { getHunterDialogue } from '../src/game/config/dialogues.js';

console.log('--- Testing Helsing & Revident Implementation ---');

// 1. Check Dialogues for Helsing and Revident
{
  const hCry = getHunterDialogue('helsing', 'battle_cries');
  assert.ok(hCry.text.length > 0, 'Helsing should have battle cry');
  assert.equal(hCry.speaker, 'Sir Arthur Featherstone');

  const rCry = getHunterDialogue('revident', 'battle_cries');
  assert.ok(rCry.text.length > 0, 'Revident should have battle cry');
  assert.equal(rCry.speaker, 'Revident Ignác Šiml');

  const rQuip = getHunterDialogue('revident', 'quips');
  assert.ok(rQuip.text.length > 0, 'Revident should have quip');
  console.log('✓ Dialogues verified for Helsing & Revident');
}

// 2. Test Okolkováno status bonus in dealDamage
{
  const state = createBattleState({ hunterId: 'revident' });
  const enemy = state.enemies[0];
  const initialHp = enemy.hp;

  addStatus(enemy, 'okolkovano', 1);
  assert.equal(hasStatus(enemy, 'okolkovano'), true);

  const events = [];
  dealDamage(state, enemy, 2, { reason: 'test_attack' }, events);

  // Raw 2 DMG + 1 Daňová přirážka = 3 DMG dealt to enemy
  assert.equal(enemy.hp, initialHp - 3, 'Okolkovano should add +1 DMG daňová přirážka');
  assert.equal(hasStatus(enemy, 'okolkovano'), false, 'Okolkovano stack should be consumed');
  assert.ok(events.some((e) => e.type === 'tax_surcharge'), 'Event tax_surcharge should be emitted');
  console.log('✓ [OKOLKOVÁNO] +1 DMG daňová přirážka verified');
}

// 3. Test Van Helsing (Gabriel van Helsing)
{
  const state = createBattleState({ hunterId: 'helsing' });
  state.props = [];
  assert.equal(state.hero.maxHp, 18, 'Helsing should have 18 max HP');
  assert.equal(state.hero.hp, 18, 'Helsing should have 18 HP');
  assert.equal(state.hero.defense, 1, 'Helsing should have 1 defense');
  assert.equal(state.hero.statuses.shield, 1, 'Helsing starts with 1 shield');

  // Starter deck check
  assert.equal(state.hand.length, 3, 'Helsing should have 3 starter tiles');
  const tileIds = state.hand.map((t) => t.id);
  assert.deepEqual(tileIds, ['repeating_crossbow', 'silver_bolt_salvo', 'winch_reload_kick']);

  // Test repeating_crossbow burst
  const enemy = state.enemies[0];
  state.hero.cell = 1;
  state.hero.facing = 1;
  enemy.cell = 3;
  enemy.hp = 10;
  enemy.statuses = {};

  const crossTile = state.hand.find((t) => t.id === 'repeating_crossbow');
  const events = [];
  executeHeroTileEffect(state, crossTile, 0, 1, events);
  // 2 hits of 2 DMG = 4 DMG dealt
  assert.equal(enemy.hp, 6, 'Repeating crossbow should fire 2 burst hits of 2 DMG');
  console.log('✓ Helsing repeating crossbow 2-burst verified');

  // Test winch_reload_kick recoil and reload
  crossTile.currentCooldown = 3;
  const kickTile = state.hand.find((t) => t.id === 'winch_reload_kick');
  enemy.cell = 2;
  state.hero.cell = 1;
  executeHeroTileEffect(state, kickTile, 0, 1, []);
  // Should step hero back to cell 0
  assert.equal(state.hero.cell, 0, 'Winch reload kick should step hero back');
  assert.equal(crossTile.currentCooldown, 2, 'Winch reload kick should reduce ranged tile CD');
  console.log('✓ Helsing winch reload kick verified');

  // Test Helsing combo3
  enemy.cell = 4;
  enemy.hp = 10;
  resolveHunterCombo3Bonus(state, state.hero, []);
  assert.equal(enemy.hp, 6, 'Helsing combo3 deals 4 DMG');
  assert.equal(hasStatus(enemy, 'bleed'), true, 'Helsing combo3 applies bleed');
  console.log('✓ Helsing 3-combo verified');
}

// 4. Test C. k. vrchní revident (Ignác Šiml)
{
  const state = createBattleState({ hunterId: 'revident' });
  state.props = [];
  assert.equal(state.hero.maxHp, 16, 'Revident should have exactly 16 HP');
  assert.equal(state.hero.hp, 16, 'Revident should have 16 HP');
  assert.equal(state.hero.defense, 2, 'Revident should have 2 defense');
  assert.equal(state.hero.statuses.shield, 2, 'Revident starts with 2 shield from dossier');

  // Starter deck check (4 tiles!)
  assert.equal(state.hand.length, 4, 'Revident should have 4 starter tiles');
  const tileIds = state.hand.map((t) => t.id);
  assert.deepEqual(tileIds, [
    'gov_stake_1884',
    'brass_stamp_denied',
    'rast_gasser_revolver',
    'domicile_inspection'
  ]);
  console.log('✓ Revident HP (16), Defense (2), and 4 Starter Tiles verified');

  // Test Úřední předvolání (Signature Action):
  // When revident turns facing enemy at distance exactly 2:
  // enemy is pulled 1 cell closer, gets [OKOLKOVÁNO], summonCooldown becomes 2.
  state.hero.cell = 2;
  state.hero.facing = -1; // facing left
  const enemy = state.enemies[0];
  enemy.cell = 4; // distance 2 to the right
  enemy.hp = 10;
  enemy.statuses = {};
  state.hero.summonCooldown = 0;

  const turnRes = turnHero(state);
  assert.equal(turnRes.ok, true);
  assert.equal(state.hero.facing, 1, 'Revident turned right');
  assert.equal(enemy.cell, 3, 'Enemy pulled 1 cell closer to cell 3');
  assert.equal(hasStatus(enemy, 'okolkovano'), true, 'Enemy should be stamped with [OKOLKOVÁNO]');
  assert.equal(state.hero.summonCooldown, 2, 'Summon cooldown set to 2');
  console.log('✓ Revident Úřední předvolání (pull 1 + OKOLKOVÁNO on turn towards dist 2) verified');

  // Test gov_stake_1884:
  // 1 políčko před sebe za 2 DMG. If target had OKOLKOVÁNO, CD reduced by 1.
  const stakeTile = state.hand.find((t) => t.id === 'gov_stake_1884');
  stakeTile.currentCooldown = 2;
  // Target enemy is at cell 3, revident at cell 2, facing 1.
  // Enemy has okolkovano: true!
  executeHeroTileEffect(state, stakeTile, 0, 1, []);
  // 2 DMG + 1 daňová přirážka = 3 DMG dealt, and CD reduced by 1
  assert.equal(enemy.hp, 7, '2 DMG + 1 tax surcharge dealt');
  assert.equal(stakeTile.currentCooldown, 1, 'CD reduced by 1 because target had OKOLKOVÁNO');
  console.log('✓ Revident Erární osikový kolík vz. 1884 verified');

  // Test brass_stamp_denied:
  // 1 DMG, push 1, delay enemy countdown by 1
  enemy.cell = 3;
  enemy.countdown = 1;
  const stampTile = state.hand.find((t) => t.id === 'brass_stamp_denied');
  executeHeroTileEffect(state, stampTile, 0, 1, []);
  assert.equal(enemy.hp, 6, 'Brass stamp deals 1 DMG');
  assert.equal(enemy.cell, 4, 'Enemy pushed back 1 cell');
  assert.equal(enemy.countdown, 2, 'Enemy countdown delayed by 1');
  console.log('✓ Revident Mosazné razítko „ZAMÍTNUTO“ verified');

  // Test rast_gasser_revolver:
  // 2 DMG line, recoil pushes revident 1 cell back
  state.hero.cell = 2;
  state.hero.facing = 1;
  enemy.cell = 4;
  const revTile = state.hand.find((t) => t.id === 'rast_gasser_revolver');
  executeHeroTileEffect(state, revTile, 0, 1, []);
  assert.equal(enemy.hp, 4, 'Revolver deals 2 DMG');
  assert.equal(state.hero.cell, 1, 'Revident pushed back to cell 1 by recoil');
  console.log('✓ Revident Služební revolver Rast & Gasser (recoil back) verified');

  // Test domicile_inspection:
  // Swaps place with adjacent enemy, faces enemy away, applies OKOLKOVÁNO
  state.hero.cell = 2;
  state.hero.facing = 1;
  enemy.cell = 3;
  enemy.facing = -1; // enemy was facing hero
  const inspectTile = state.hand.find((t) => t.id === 'domicile_inspection');
  executeHeroTileEffect(state, inspectTile, 0, 1, []);
  assert.equal(state.hero.cell, 3, 'Hero swapped to cell 3');
  assert.equal(enemy.cell, 2, 'Enemy swapped to cell 2');
  assert.equal(enemy.facing, 1, 'Enemy facing set to hero facing (back to hero)');
  assert.equal(hasStatus(enemy, 'okolkovano'), true, 'Enemy stamped with OKOLKOVÁNO');
  console.log('✓ Revident Kontrola domovského listu (swap + face away + OKOLKOVÁNO) verified');

  // Test Revident bump:
  // 1 DMG, push 1, OKOLKOVÁNO
  state.hero.cell = 1;
  state.hero.facing = 1;
  enemy.cell = 2;
  delete enemy.statuses.okolkovano;
  enemy.hp = 10;
  resolveHeroBump(state, state.hero, enemy, 1, 2, 'revident', []);
  assert.equal(enemy.hp, 9, 'Bump deals 1 DMG');
  assert.equal(enemy.cell, 3, 'Enemy pushed to cell 3');
  assert.equal(hasStatus(enemy, 'okolkovano'), true, 'Bump stamps OKOLKOVÁNO');
  console.log('✓ Revident Bump (Třísknutí deskami spisů) verified');

  // Test Revident 3-combo:
  // Gains +3 Shield, stamps OKOLKOVÁNO on all enemies, deals 3 DMG to already OKOLKOVÁNO (+1 daňová přirážka)
  state.hero.statuses = {};
  enemy.hp = 10;
  addStatus(enemy, 'okolkovano', 1);
  resolveHunterCombo3Bonus(state, state.hero, []);
  assert.equal(state.hero.statuses.shield, 3, 'Revident gains 3 shield');
  assert.equal(enemy.hp, 6, 'Already okolkovano enemy takes 3 DMG + 1 tax surcharge = 4 DMG in combo3');
  console.log('✓ Revident 3-combo (Finanční exekuce) verified');
}

console.log('\nALL HELSING & REVIDENT TESTS PASSED SUCCESSFULLY! 🎉');
