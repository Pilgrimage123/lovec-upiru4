import assert from 'node:assert/strict';
import { STARTING_LOADOUTS } from '../src/game/config/loadouts.js';
import { HERO_TILES, getHeroTileDefinition } from '../src/game/config/tiles.js';
import {
  createBattleState,
  dealDamage,
  addStatus,
  hasStatus,
  pushEntity
} from '../src/game/engine/state.js';
import {
  executeHeroTileEffect,
  stepHero,
  resolveHeroHitOnTarget,
  advanceTurnAfterPlayerAction,
  checkSvunkBonus,
  computeHeroTileBonus
} from '../src/game/engine/combat.js';

console.log('=== TEST SUITE: Prohloubení lovců a aktivní modulace Rozlícení (ADR-0012) ===\n');

// -------------------------------------------------------------
// 1. All 9 Hunter Loadouts & Passives
// -------------------------------------------------------------
console.log('--- TEST 1: Ověření všech 9 loadoutů lovců a pasivních signatur ---');
const expectedHunters = {
  honza: { fury: 25, defense: 0, armor: 1, hp: 20, passive: 'Selský furiant', tileCount: 3 },
  silak: { fury: 10, defense: 1, armor: 1, hp: 22, passive: 'Cirkusová dominance', tileCount: 3 },
  dragoun: { fury: 10, defense: 2, armor: 0, hp: 20, passive: 'Kavalírský nápřah', tileCount: 3 },
  zlodejka: { fury: 10, defense: 2, armor: 0, hp: 14, passive: 'Zákeřný úder', tileCount: 3 },
  ponocny: { fury: 5, defense: 2, armor: 0, hp: 26, passive: 'Zákaz nočního vycházení', tileCount: 3 },
  anglicanka: { fury: 5, defense: 2, armor: 0, hp: 18, passive: 'Noblesní sebeovládání', tileCount: 3 },
  venca: { fury: 10, defense: 1, armor: 0, hp: 20, passive: 'Sokolský tělocvik', tileCount: 3 },
  helsing: { fury: 10, defense: 1, armor: 0, hp: 18, passive: 'Lovec trofejí', tileCount: 3 },
  revident: { fury: 5, defense: 2, armor: 0, hp: 18, passive: 'C. k. daňová kontrola', tileCount: 3 }
};

for (const [id, exp] of Object.entries(expectedHunters)) {
  const loadout = STARTING_LOADOUTS[id];
  assert.ok(loadout, `Loadout pro ${id} musí existovat`);
  assert.equal(loadout.fury || 0, exp.fury, `${id}: Rozlícení = ${exp.fury}`);
  assert.equal(loadout.defense || 0, exp.defense, `${id}: Obrana = ${exp.defense}`);
  assert.equal(loadout.armor || 0, exp.armor, `${id}: Brnění = ${exp.armor}`);
  assert.equal(loadout.maxHp, exp.hp, `${id}: HP = ${exp.hp}`);
  assert.equal(loadout.deck.length, exp.tileCount, `${id}: počet startovních destiček = ${exp.tileCount}`);
  assert.equal(loadout.passiveName, exp.passive, `${id}: pasivní signatura = ${exp.passive}`);
  assert.ok(loadout.passiveDesc && loadout.passiveDesc.length > 5, `${id}: popis pasivní schopnosti`);
}
console.log('✓ Všech 9 lovců má platné a ověřené atributy, pasivky a standardní 3 startovní destičky.\n');

// -------------------------------------------------------------
// 2. Honza: Selský furiant (damage reaction) + Rozlícení modulation & Zchlazení 🧊
// -------------------------------------------------------------
console.log('--- TEST 2: Honza – Selský furiant, modulace Rozlícení a Zchlazení 🧊 ---');
{
  const state = createBattleState({ hunterId: 'honza' });
  assert.equal(state.hero.currentFury, 25, 'Honza začíná s 25 % Rozlícení');

  // Útok na štít -> nesmí přidat Rozlícení
  addStatus(state.hero, 'shield', 5);
  dealDamage(state, state.hero, 3, { type: 'direct' });
  assert.equal(state.hero.currentFury, 25, 'Absorpce do Štítu nespustí furianta');

  // Průraz do těla HP -> spustí Selský furiant (+10 % Rozlícení)
  dealDamage(state, state.hero, 4, { type: 'direct' }); // 2 pohlceno štítem, 2 do HP
  assert.equal(state.hero.currentFury, 35, 'Zásah do těla spustil Selský furiant (+10 % -> 35 %)');

  // Nápřah (heavy_windup) zvýší Rozlícení o +20 %
  const windup = state.hand.find(t => t.id === 'heavy_windup');
  executeHeroTileEffect(state, windup, 0, 1, []);
  assert.equal(state.hero.currentFury, 55, 'Nápřah zvýšil Rozlícení o +20 % na 55 %');

  // Buchta (plum_bun) zklidní o -15 %
  const bun = state.hand.find(t => t.id === 'plum_bun');
  executeHeroTileEffect(state, bun, 0, 1, []);
  assert.equal(state.hero.currentFury, 40, 'Povidlová buchta snížila Rozlícení o -15 % na 40 %');

  // Série buchet srazí Rozlícení do záporných hodnot (Zchlazení 🧊)
  executeHeroTileEffect(state, bun, 0, 1, []); // 25
  executeHeroTileEffect(state, bun, 0, 1, []); // 10
  executeHeroTileEffect(state, bun, 0, 1, []); // -5 % (Zchlazení!)
  assert.equal(state.hero.currentFury, -5, 'Rozlícení kleslo pod nulu na -5 %');

  // Klesání je zastropováno na -50 %
  for (let i = 0; i < 5; i++) {
    executeHeroTileEffect(state, bun, 0, 1, []);
  }
  assert.equal(state.hero.currentFury, -50, 'Rozlícení je pevně zastropováno na -50 % Zchlazení');

  // Test garantovaného minimálního poškození (min 1 DMG) i při -50 % Rozlícení
  delete state.hero.statuses.empower;
  const enemy = state.enemies[0];
  enemy.hp = 10;
  enemy.statuses = {};
  enemy.cell = state.hero.cell + state.hero.facing;
  const jabTile = { id: 'test_jab', name: 'Lehký úder', dmg: 1, type: 'attack', pattern: [{ offset: 1, dmg: 1 }] };
  executeHeroTileEffect(state, jabTile, 0, 1, []);
  assert.equal(enemy.hp, 9, 'I při -50 % Zchlazení útok o síle 1 DMG udělí minimálně 1 DMG');
  console.log('✓ Honzův Selský furiant, modulace Rozlícení, Zchlazení do -50 % a garance min 1 DMG ověřeny.\n');
}

// -------------------------------------------------------------
// 3. Silák Gustav: Cirkusová dominance
// -------------------------------------------------------------
console.log('--- TEST 3: Gustav – Cirkusová dominance (+1 kolizní DMG a +2 Štít) ---');
{
  const state = createBattleState({ hunterId: 'silak' });
  state.hero.statuses = {};
  state.hero.cell = 2;
  const enemy = state.enemies[0];
  enemy.cell = state.boardSize - 1; // přímo u pravé zdi
  enemy.hp = 10;
  enemy.statuses = {};
  state.enemies = [enemy]; // izolujeme pro čistý test zdi

  // Odsuneme nepřítele o 3 políčka doprava, ale deska končí na indexu 5 (zeď)
  // Distance requested: 3. Unmoved tiles = 3 -> standard collision DMG = 3.
  // Gustav má pasivku Cirkusová dominance: +1 DMG navíc (celkem 4 DMG) a Gustav získá +2 Štít!
  const pushEvents = [];
  pushEntity(state, enemy, 1, 3, pushEvents, { pusher: state.hero });
  assert.equal(enemy.hp, 6, 'Cirkusová dominance: nepřítel utrpěl 4 DMG (3 + 1 za Gustava)');
  assert.equal(state.hero.statuses.shield, 2, 'Gustav získal +2 Štít z Cirkusové dominance');
  console.log('✓ Gustavova Cirkusová dominance (+1 DMG při kolizi a +2 Štít pro Gustava) ověřena.\n');
}

// -------------------------------------------------------------
// 4. Dragoun Jaromír: Kavalírský nápřah (+2 DMG a ignoruje 1 Brnění po pohybu)
// -------------------------------------------------------------
console.log('--- TEST 4: Dragoun – Kavalírský nápřah (+2 DMG a ignoruje 1 Brnění po pohybu) ---');
{
  const state = createBattleState({ hunterId: 'dragoun' });
  state.props = [];
  state.hero.cell = 1;
  state.hero.facing = 1;
  state.hero.movedThisTurn = false;

  const armoredEnemy = state.enemies[0];
  armoredEnemy.cell = 2;
  armoredEnemy.hp = 20;
  armoredEnemy.armor = 1; // 1 Brnění!
  armoredEnemy.statuses = {};

  const saberTile = state.hand.find(t => t.id === 'dragoon_sabre'); // dmg: 6, fury: 10% -> 7 DMG

  // 1. Útok bez předchozího pohybu (stacionární):
  // 7 DMG - 1 Brnění = 6 DMG do HP (20 -> 14).
  executeHeroTileEffect(state, saberTile, 0, 1, []);
  assert.equal(armoredEnemy.hp, 14, 'Stacionární útok: 7 DMG - 1 Brnění = 6 DMG (20 -> 14)');

  // 2. Útok po pohybu:
  // Posuneme lovce i nepřítele na volnou desku
  state.hero.cell = 1;
  state.hero.facing = 1;
  armoredEnemy.cell = 3;
  armoredEnemy.hp = 20;
  stepHero(state, 1); // pohne se na pole 2, movedThisTurn = true!
  assert.equal(state.hero.cell, 2);
  assert.equal(state.hero.movedThisTurn, true, 'Lovec se tento tah pohnul');

  // Útok s Kavalírským nápřahem:
  // +2 DMG (celkem 9 DMG) a ignoruje 1 Brnění (nepřítel má 1 Brnění -> pohlceno 0 DMG).
  // Do HP jde plných 9 DMG! (20 -> 11).
  executeHeroTileEffect(state, saberTile, 0, 1, []);
  assert.equal(armoredEnemy.hp, 11, 'Kavalírský nápřah po pohybu: 7 + 2 = 9 DMG, 1 Brnění plně ignorováno (20 -> 11)');
  console.log('✓ Dragounův Kavalírský nápřah (+2 DMG a ignorace 1 Brnění při nápřahu z pohybu) ověřen.\n');
}

// -------------------------------------------------------------
// 5. Sir Arthur: Lovec trofejí (+2 DMG a -1 CD proti krvácejícím na dálku)
// -------------------------------------------------------------
console.log('--- TEST 5: Sir Arthur – Lovec trofejí (+2 DMG a −1 CD na dálku proti krvácejícím) ---');
{
  const state = createBattleState({ hunterId: 'helsing' });
  state.props = [];
  state.hero.cell = 1;
  state.hero.facing = 1;

  const target = state.enemies[0];
  target.cell = 3; // vzdálenost 2 políčka!
  target.hp = 10;
  target.statuses = {};
  addStatus(target, 'bleed', 2); // krvácející cíl

  const shotTile = state.hand.find(t => t.id === 'repeating_crossbow'); // dmg: 2, cooldown: 3
  shotTile.currentCooldown = 3;

  executeHeroTileEffect(state, shotTile, 0, 1, []);
  // Rotační kuše pálí dávku 2 ran (burstHits: 2)!
  // Každá rána: 2 DMG + 2 Lovec trofejí = 4 DMG.
  // 2 rány x 4 DMG = 8 DMG celkem dealt (10 -> 2).
  assert.equal(target.hp, 2, 'Lovec trofejí udělil +2 DMG na obě střely rotační dávky (10 -> 2)');
  assert.equal(shotTile.currentCooldown, 1, 'Chladnutí destičky sníženo 2x o 1 za obě střely dávky (3 -> 1)');
  console.log('✓ Sir Arthurův Lovec trofejí (+2 DMG na projektil a −1 CD) ověřen.\n');
}

// -------------------------------------------------------------
// 6. Ponocný: Zákaz nočního vycházení a zchlazování monster lucernou
// -------------------------------------------------------------
console.log('--- TEST 6: Ponocný – Zákaz nočního vycházení a tlumicí lucerna ---');
{
  const state = createBattleState({ hunterId: 'ponocny' });
  state.props = [];
  state.hero.cell = 2;
  state.hero.facing = 1;
  state.hero.statuses = {};

  // Vytvoříme 2 nepřátele v dosahu lucerny (1-2 políčka, tj. buňky 3 a 4)
  state.enemies = [
    { id: 'vamp1', name: 'Noční cháska 1', cell: 3, hp: 10, currentFury: 30, statuses: {}, entityType: 'enemy' },
    { id: 'vamp2', name: 'Noční cháska 2', cell: 4, hp: 10, currentFury: 20, statuses: {}, entityType: 'enemy' }
  ];

  // Konec kola -> aktivuje se Zákaz nočního vycházení (+1 Štít za každého nepřítele v dosahu lucerny = +2 Štít)
  // Plus Ponocný má Obranu 2, takže +2 Štít z Obrany, celkem 4 Štít.
  advanceTurnAfterPlayerAction(state);
  assert.equal(state.hero.statuses.shield, 4, 'Ponocný získal 2 ze své Obrany + 2 z pasivky Zákaz nočního vycházení');

  // Půlnoční lucerna (watchman_lantern) zchladí Rozlícení nepřítele o 15 % a udělí Zmatení (❓)
  const lantern = state.hand.find(t => t.id === 'watchman_lantern');
  executeHeroTileEffect(state, lantern, 0, 1, []);
  assert.equal(state.enemies[0].currentFury, 15, 'Lucerna snížila Rozlícení cíle z 30 % na 15 %');
  assert.equal(state.enemies[0].statuses.confusion, 1, 'Lucerna udělila Zmatení (❓)');
  console.log('✓ Ponocného Zákaz nočního vycházení i tlumicí lucerna se Zmatením ověřeny.\n');
}

// -------------------------------------------------------------
// 7. Lady Gwendolyn: Noblesní sebeovládání (převod Rozlícení na Štít)
// -------------------------------------------------------------
console.log('--- TEST 7: Lady Gwendolyn – Noblesní sebeovládání ---');
{
  const state = createBattleState({ hunterId: 'anglicanka' });
  state.hero.currentFury = 15; // nakumulovaný hněv
  state.hero.statuses = {};

  const etiquette = state.hand.find(t => t.id === 'royal_etiquette');
  // royal_etiquette: convertFuryToShield: true, furyPerShield: 5
  // 15 % Rozlícení / 5 = +3 Štít, Rozlícení klesne na 0
  executeHeroTileEffect(state, etiquette, 0, 1, []);
  assert.equal(state.hero.currentFury, 0, 'Rozlícení konvertováno na nulu');
  assert.equal(state.hero.statuses.shield, 10, 'Gwendolyn získala 5 základ + 2 přetečení léčení + 3 za 15 % Rozlícení = 10 Štítu');
  console.log('✓ Noblesní sebeovládání (převod hněvu na chladný Štít) ověřeno.\n');
}

// -------------------------------------------------------------
// 8. Švunk: Zkrácení Chladnutí manévru Krok do nepřítele
// -------------------------------------------------------------
console.log('--- TEST 8: Mechanika Švunk – zkrácení Chladnutí Kroku do nepřítele ---');
{
  const state = createBattleState({ hunterId: 'honza' });
  state.hero.bumpCooldown = 3;
  state._livingEnemiesBeforeCombo = state.enemies.filter((e) => e.hp > 0).length + 1;

  // checkSvunkBonus při eliminaci nepřítele v kombu délky 2:
  const events = [];
  checkSvunkBonus(state, 2, events);
  assert.equal(state.hero.bumpCooldown, 1, 'Eliminace v kombu délky 2 zkrátila bumpCooldown o 2 (3 -> 1)');
  console.log('✓ Švunk úspěšně zkracuje Chladnutí manévru Krok do nepřítele.\n');
}

console.log('================================================================');
console.log('VŠECHNY TESTY PROHLOUBENÍ LOVCŮ A MODULACE ROZLÍCENÍ PROŠLY 100%!');
console.log('================================================================');
