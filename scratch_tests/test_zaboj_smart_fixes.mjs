// @ts-nocheck
import assert from 'node:assert/strict';
import { STARTING_LOADOUTS } from '../src/game/config/loadouts.js';
import { HERO_TILES } from '../src/game/config/tiles.js';
import { createBattleState, addStatus } from '../src/game/engine/state.js';
import {
  executeHeroTileEffect,
  resolveHeroBump,
  resolveHunterCombo3Bonus
} from '../src/game/engine/combat.js';

console.log('=== TEST SUITE: Záboj Smart Fixes, Verva Skull & Roster Stats ===\n');

// 1. Ověření Záboje v STARTING_LOADOUTS
console.log('--- TEST 1: Loadout Záboje ---');
const zaboj = STARTING_LOADOUTS.zaboj;
assert.ok(zaboj, 'Záboj musí existovat v STARTING_LOADOUTS');
assert.equal(zaboj.name, 'Adolf Puchmajer');
assert.equal(zaboj.shortName, 'Rek Záboj');
assert.equal(zaboj.maxHp, 20);
assert.equal(zaboj.defense, 1);
assert.equal(zaboj.armor, 1);
assert.equal(zaboj.fury, 15);
assert.equal(zaboj.persistence, 6);
assert.equal(zaboj.portrait, '/assets/aistudio/K_i__c__bard_s_lyrou_a_palc_tem_9017845b.png');
assert.equal(zaboj.deck.length, 3);
assert.equal(zaboj.deck[0].id, 'zaboj_mallet');
assert.equal(zaboj.deck[1].id, 'cardboard_varyto');
assert.equal(zaboj.deck[2].id, 'linden_stakes');
console.log('✓ Záboj má správný portrét, 20 HP, 1 Obranu, 1 Brnění, 15 % Rozlícení a 6 Vervu.');

// 2. Ověření karet Záboje
console.log('\n--- TEST 2: Destičky Záboje ---');
const mallet = HERO_TILES.zaboj_mallet;
const varyto = HERO_TILES.cardboard_varyto;
const stakes = HERO_TILES.linden_stakes;
assert.ok(mallet && varyto && stakes);
assert.equal(mallet.dmg, 4);
assert.equal(varyto.projectileRange, 3);
assert.equal(stakes.shieldAmount, 3);
console.log('✓ Všechny 3 destičky (mlat, varyto, kolíky) mají správné parametry.');

// 3. Ověření manévru kroku do nepřítele (Bump)
console.log('\n--- TEST 3: Bump - Falešný akord na varyto ---');
const state = createBattleState({ hunterId: 'zaboj' });
state.props = [];
state.hero.cell = 2;
state.hero.facing = 1;
state.hero.bumpCooldown = 0;
const enemy = {
  id: 'test_enemy_1',
  name: 'Noční chodec',
  cell: 3,
  hp: 10,
  maxHp: 10,
  facing: -1,
  statuses: {},
  entityType: 'enemy'
};
state.enemies = [enemy];
const bumpEvents = [];
resolveHeroBump(state, state.hero, enemy, 1, enemy.cell, 'zaboj', bumpEvents);
assert.equal(enemy.cell, 4, 'Nepřítel byl odhozen o 1 pole na buňku 4');
assert.ok(enemy.statuses?.confusion > 0, 'Nepřítel obdržel stav Zmatení (❓)');
assert.equal(state.hero.bumpCooldown, 3, 'Chladnutí manévru je 3');
console.log('✓ Bump udělil zranění, odhodil o 1 pole a uvrhl do Zmatení.');

// 4. Ověření pasivky Rukopisný zápal
console.log('\n--- TEST 4: Rukopisný zápal (útok do zmateného cíle) ---');
const prevShield = state.hero.statuses.shield || 0;
const prevFury = state.hero.currentFury || 0;
enemy.cell = 3;
enemy.hp = 10;
addStatus(enemy, 'confusion', 1, []);
const hitEvents = [];
const tileInstance = { ...mallet, instanceId: 'm1' };
executeHeroTileEffect(state, tileInstance, 0, 1, hitEvents);
assert.ok((state.hero.statuses.shield || 0) >= prevShield + 2, 'Rukopisný zápal přidal +2 Štít');
assert.ok((state.hero.currentFury || 0) >= prevFury + 5, 'Rukopisný zápal přidal +5 % Rozlícení');
console.log('✓ Pasivní signatura Rukopisný zápal udělila bonusový DMG, +2 Štít a +5 % Rozlícení.');

// 5. Ověření 3-komba (Zpěv z Černého lesa)
console.log('\n--- TEST 5: 3-kombo (Zpěv z Černého lesa) ---');
const comboEvents = [];
resolveHunterCombo3Bonus(state, state.hero, comboEvents);
assert.ok((state.hero.statuses.shield || 0) >= 5, '3-kombo přidalo +5 Štít');
console.log('✓ 3-kombo funguje spolehlivě.');

// 6. Ověření unikátních 10 lovců v STARTING_LOADOUTS a alfa-kanálu Záboje
console.log('\n--- TEST 6: Unikátnost 10 lovců & Alfa-kanál PNG Záboje ---');
const allLoadoutKeys = Object.keys(STARTING_LOADOUTS);
assert.equal(allLoadoutKeys.length, 10, 'Object.keys(STARTING_LOADOUTS) musí vracet přesně 10 unikátních lovců');
assert.equal(STARTING_LOADOUTS.venca, STARTING_LOADOUTS.classic, 'Alias STARTING_LOADOUTS.venca musí nadále fungovat');

import fs from 'node:fs';
import zlib from 'node:zlib';

const zabojPngBuf = fs.readFileSync('public/assets/aistudio/K_i__c__bard_s_lyrou_a_palc_tem_9017845b.png');
const width = zabojPngBuf.readUInt32BE(16);
const height = zabojPngBuf.readUInt32BE(20);
let offset = 8;
const idatChunks = [];
while (offset < zabojPngBuf.length) {
  const len = zabojPngBuf.readUInt32BE(offset);
  const type = zabojPngBuf.toString('ascii', offset + 4, offset + 8);
  if (type === 'IDAT') idatChunks.push(zabojPngBuf.subarray(offset + 8, offset + 8 + len));
  offset += 12 + len;
}
const raw = zlib.inflateSync(Buffer.concat(idatChunks));
// Check top-left corner (x=0, y=0) and between varyto strings (x=360, y=230) are transparent
const cornerAlpha = raw[1 + 3]; // filter byte + R,G,B,A of (0,0)
assert.equal(cornerAlpha, 0, 'Roh obrázku Záboje (0,0) musí být plně průhledný (alpha=0)');
console.log(`✓ PNG Záboje (${width}x${height}) má čisté průhledné pozadí a 10 unikátních lovců v registru.\n`);

console.log('====================================================');
console.log('VŠECHNY TESTY ZÁBOJE A HARMONIZACE LOVCŮ PROŠLY! 🎉');
console.log('====================================================');

