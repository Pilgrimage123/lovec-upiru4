import assert from 'node:assert/strict';
import { STARTING_LOADOUTS } from '../src/game/config/loadouts.js';
import { HERO_TILES } from '../src/game/config/tiles.js';
import {
  createBattleState,
  dealDamage,
  addStatus
} from '../src/game/engine/state.js';
import {
  resolveHeroBump,
  executeHeroTileEffect
} from '../src/game/engine/combat.js';

console.log('=== TEST SUITE: Benchmark Sokola Venci a asymetrická Verva (ADR-0013) ===\n');

// 1. Ověření asymetrické Vervy a atributů všech 9 lovců
console.log('--- TEST 1: Ověření asymetrické Vervy a vyvážených atributů ---');
const expected = {
  venca:      { hp: 20, defense: 1, armor: 0, fury: 10, persistence: 5 },
  honza:      { hp: 20, defense: 0, armor: 1, fury: 25, persistence: 7 },
  dragoun:    { hp: 20, defense: 2, armor: 0, fury: 10, persistence: 4 },
  zlodejka:   { hp: 14, defense: 2, armor: 0, fury: 10, persistence: 6 },
  ponocny:    { hp: 26, defense: 2, armor: 0, fury: 5,  persistence: 6 },
  silak:      { hp: 22, defense: 1, armor: 1, fury: 10, persistence: 5 },
  anglicanka: { hp: 18, defense: 2, armor: 0, fury: 5,  persistence: 4 },
  helsing:    { hp: 18, defense: 1, armor: 0, fury: 10, persistence: 5 },
  revident:   { hp: 18, defense: 2, armor: 0, fury: 5,  persistence: 5 }
};

for (const [id, exp] of Object.entries(expected)) {
  const loadout = STARTING_LOADOUTS[id];
  assert.ok(loadout, `Loadout ${id} musí existovat`);
  assert.equal(loadout.maxHp, exp.hp, `${id}: HP = ${exp.hp}`);
  assert.equal(loadout.defense, exp.defense, `${id}: Obrana = ${exp.defense}`);
  assert.equal(loadout.armor || 0, exp.armor, `${id}: Brnění = ${exp.armor}`);
  assert.equal(loadout.fury, exp.fury, `${id}: Rozlícení = ${exp.fury}%`);
  assert.equal(loadout.persistence, exp.persistence, `${id}: Verva = ${exp.persistence}`);

  const state = createBattleState({ hunterId: id });
  assert.equal(state.hero.maxHp, exp.hp, `${id} v bitvě: maxHp = ${exp.hp}`);
  assert.equal(state.hero.hp, exp.hp, `${id} v bitvě: hp = ${exp.hp}`);
  assert.equal(state.hero.persistence, exp.persistence, `${id} v bitvě: persistence = ${exp.persistence}`);
}
console.log('✓ Všech 9 lovců má správnou asymetrickou Vervu (4 až 7) a vyvážené základní životy.\n');

// 2. Ponocný: Rychlejší rotační rytmus (Lucerna CD 3, Bump CD 3)
console.log('--- TEST 2: Ponocný – Půlnoční lucerna a ratiště na CD 3 ---');
{
  assert.equal(HERO_TILES.watchman_lantern.cooldown, 3, 'Půlnoční lucerna musí mít Chladnutí 3');
  assert.equal(HERO_TILES.watchman_lantern.dmg, 2, 'Půlnoční lucerna má 2 DMG');

  const state = createBattleState({ hunterId: 'ponocny' });
  state.props = [];
  state.hero.bumpCooldown = 0;
  const enemy = state.enemies[0];
  enemy.cell = state.hero.cell + state.hero.facing;
  const events = [];
  resolveHeroBump(state, state.hero, enemy, 1, enemy.cell, 'ponocny', events);
  assert.equal(state.hero.bumpCooldown, 3, 'Manévr Zarazení ratištěm má Chladnutí 3 (zkráceno ze 4)');
  console.log('✓ Ponocného Chladnutí manévru i lucerny zkráceno na 3 tahy.\n');
}

// 3. Revident: Posílení přímého boje (Razítko 2 DMG, Revolver CD 3)
console.log('--- TEST 3: Revident – Razítko 2 DMG a Revolver CD 3 ---');
{
  assert.equal(HERO_TILES.brass_stamp_denied.dmg, 2, 'Mosazné razítko má základní poškození 2 DMG');
  assert.equal(HERO_TILES.rast_gasser_revolver.cooldown, 3, 'Služební revolver má zkrácené Chladnutí 3 (z 5)');

  const state = createBattleState({ hunterId: 'revident' });
  state.props = [];
  assert.equal(state.hero.maxHp, 18, 'Revident má zvýšené životy na 18 HP');
  console.log('✓ Revidentovo razítko má 2 DMG, revolver CD 3 a hrdina 18 HP.\n');
}

// 4. Chasník Honza: Zoufalý furiant při vstupu do Zubaté (+25 % Rozlícení)
console.log('--- TEST 4: Chasník Honza – Zoufalý furiant při pádu do Zubaté ---');
{
  const state = createBattleState({ hunterId: 'honza' });
  assert.equal(state.hero.currentFury, 25, 'Honza začíná na 25 % Rozlícení');
  assert.equal(state.hero.persistence, 7, 'Honza má Vervu 7');

  // Připravíme frontu akcí s destičkou
  const bunTile = state.hand[0];
  bunTile.inQueue = true;
  state.queue = [bunTile.instanceId];

  // Zasadíme Honzovi úder srážející ho do záporných životů:
  // 23 DMG - 1 Brnění = 22 DMG do HP (20 HP -> -2 HP)
  // Odpočet Zubaté: 7 (Verva) + (-2 HP) = 5
  dealDamage(state, state.hero, 23, { type: 'direct' });
  assert.equal(state.hero.hp, -2, 'Honza má -2 HP (23 DMG - 1 Brnění)');
  assert.equal(state.hero.isReaperActive, true, 'Honza vstoupil do stavu Zubatá');
  assert.equal(state.hero.reaperCountdown, 5, 'Odpočet Zubaté je 7 + (-2) = 5');
  assert.equal(state.queue.length, 0, 'Fronta akcí byla vyprázdněna');
  assert.equal(bunTile.inQueue, false, 'Destička byla bezpečně vrácena do ruky');

  // Zoufalý furiant: Honza získal +25 % Rozlícení ze vstupu do Zubaté
  // Plus Selský furiant: +10 % za zásah do těla.
  // Původní Rozlícení 25 % + 10 % (Selský furiant) + 25 % (Zoufalý furiant) = 60 %!
  assert.equal(state.hero.currentFury, 60, 'Honza získal +25 % z nouzového režimu Zoufalého furianta (celkem 60 %)');

  // Další rána v Zubaté: 3 DMG - 1 Brnění = 2 DMG (-2 HP -> -4 HP) NEspustí znovu Zoufalého furianta
  dealDamage(state, state.hero, 3, { type: 'direct' });
  assert.equal(state.hero.hp, -4, 'Honza má -4 HP (3 DMG - 1 Brnění)');
  assert.equal(state.hero.reaperCountdown, 3, 'Odpočet Zubaté klesl na 3');
  // Selský furiant +10 % přibude za tělesnou ránu, ale Zoufalý furiant se nezdvojuje: 60 + 10 = 70 %
  assert.equal(state.hero.currentFury, 70, 'Zoufalý furiant se nespustil podruhé v tomtéž stavu Zubaté');
  console.log('✓ Honzův Zoufalý furiant a Verva 7 fungují v kritickém stavu spolehlivě.\n');
}

console.log('====================================================================');
console.log('VŠECHNY TESTY BENCHMARKU SOKOLA VENCI A ASYMETRICKÉ VERVY PROŠLY! 🎉');
console.log('====================================================================');
