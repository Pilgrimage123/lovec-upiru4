import assert from 'node:assert';
import { dealDamage, spawnEnemyEntity, createBattleState, pushEntity } from '../src/game/engine/state.js';
import { STARTING_LOADOUTS } from '../src/game/config/loadouts.js';
import { ENEMIES } from '../src/game/config/enemies.js';

console.log('=== TEST SUITE: Mechanika Brnění (ADR-0010) ===\n');

// Test 1: Loadout configs
console.log('Test 1: Kontrola konfigurace lovců v loadouts.js');
assert.strictEqual(STARTING_LOADOUTS.honza.armor, 1, 'Honza musí mít armor: 1');
assert.strictEqual(STARTING_LOADOUTS.silak.armor, 1, 'Silák Gustav musí mít armor: 1');
assert.strictEqual(STARTING_LOADOUTS.dragoun.armor ?? 0, 0, 'Rittmeister Jaromír Vraný nemá kyrys (armor: 0)');
assert.strictEqual(STARTING_LOADOUTS.venca.armor ?? 0, 0, 'Venca má armor: 0');
assert.strictEqual(STARTING_LOADOUTS.helsing.armor ?? 0, 0, 'Helsing má armor: 0');
assert.strictEqual(STARTING_LOADOUTS.revident.armor ?? 0, 0, 'Revident má armor: 0');
console.log('  -> OK: Lovci mají správné hodnoty Brnění.\n');

// Test 2: Enemies configs & spawnEnemyEntity
console.log('Test 2: Kontrola konfigurace nepřátel v enemies.js a spawnEnemyEntity');
const expectedArmor2 = ['rytir_prizrak', 'drevo', 'prase_mutant', 'divocak', 'elite_drab'];
const expectedArmor1 = ['drab', 'kyjovec', 'sedlak_stit', 'upirske_prase', 'boss_drakula', 'boss_dagmar'];

for (const id of expectedArmor2) {
  assert.strictEqual(ENEMIES[id].armor, 2, `Nepřítel ${id} musí mít v ENEMIES armor: 2`);
  const ent = spawnEnemyEntity(id, 4, -1);
  assert.strictEqual(ent.armor, 2, `Spawnutá entita ${id} musí mít armor: 2`);
}
for (const id of expectedArmor1) {
  assert.strictEqual(ENEMIES[id].armor, 1, `Nepřítel ${id} musí mít v ENEMIES armor: 1`);
  const ent = spawnEnemyEntity(id, 4, -1);
  assert.strictEqual(ent.armor, 1, `Spawnutá entita ${id} musí mít armor: 1`);
}

const fodder = spawnEnemyEntity('netopyr', 4, -1);
assert.strictEqual(fodder.armor, 0, 'Běžný nepřítel (např. netopýr) má armor: 0');
console.log('  -> OK: Všech 11 obrněných nepřátel i běžní nepřátelé mají správné Brnění.\n');

// Test 3: Hero battle state initialization
console.log('Test 3: createBattleState přebírá Brnění');
const stateSilak = createBattleState({ hunterId: 'silak' });
assert.strictEqual(stateSilak.hero.armor, 1, 'Hrdina Silák v battle state má armor: 1');

const stateHonza = createBattleState({ hunterId: 'honza' });
assert.strictEqual(stateHonza.hero.armor, 1, 'Hrdina Honza v battle state má armor: 1');

const stateVenca = createBattleState({ hunterId: 'venca' });
assert.strictEqual(stateVenca.hero.armor, 0, 'Hrdina Venca v battle state má armor: 0');
console.log('  -> OK: createBattleState správně nastavuje hero.armor.\n');

// Test 4: Vrstvená obrana - Štít absorbuje PRVNÍ, Brnění snižuje PRŮRAZ
console.log('Test 4: Vrstvená obrana: Štít -> Brnění -> HP');
{
  const dummyState = { hero: null, enemies: [], props: [] };
  const target = {
    id: 'test_target',
    name: 'Obrněnec',
    hp: 20,
    maxHp: 20,
    armor: 2,
    statuses: { shield: 3 }
  };
  const events = [];
  // Útok za 7 DMG:
  // 1) Štít absorbuje 3 DMG (zbývá 4 DMG, štít klesne na 0)
  // 2) Brnění ztlumí 2 DMG (zbývá 2 DMG)
  // 3) HP klesne o 2 DMG (20 -> 18 HP)
  const dealt = dealDamage(dummyState, target, 7, { reason: 'attack' }, events);

  assert.strictEqual(dealt, 2, 'dealDamage musí vrátit 2 udělené DMG do HP');
  assert.strictEqual(target.hp, 18, 'Cíl musí mít 18 HP');
  assert.strictEqual(target.statuses.shield, undefined, 'Štít byl zcela spotřebován');

  const shieldEvent = events.find(e => e.type === 'shield_blocked');
  assert(shieldEvent, 'Musí existovat event shield_blocked');
  assert.strictEqual(shieldEvent.absorbed, 3, 'Štít musel pohltit 3 DMG');

  const armorEvent = events.find(e => e.type === 'armor_absorbed');
  assert(armorEvent, 'Musí existovat event armor_absorbed');
  assert.strictEqual(armorEvent.absorbed, 2, 'Brnění muselo ztlumit 2 DMG');
  assert.strictEqual(armorEvent.remainingDmg, 2, 'Po ztlumení brněním zbývají 2 DMG');

  const dmgEvent = events.find(e => e.type === 'damage');
  assert(dmgEvent, 'Musí existovat event damage');
  assert.strictEqual(dmgEvent.amount, 2, 'Zranění do HP je 2 DMG');
  console.log('  -> OK: Štít pohlcuje první, Brnění tlumí průraz, HP ztrácí zbytek.\n');
}

// Test 5: Redukce zranění na 0 DMG
console.log('Test 5: Redukce zranění na 0 DMG brněním');
{
  const dummyState = { hero: null, enemies: [], props: [] };
  const target = {
    id: 'test_heavytank',
    name: 'Rytíř',
    hp: 10,
    maxHp: 10,
    armor: 2
  };
  const events = [];
  // Slabý útok za 1 DMG proti Brnění 2
  const dealt = dealDamage(dummyState, target, 1, { reason: 'attack' }, events);
  assert.strictEqual(dealt, 0, 'dealDamage vrátí 0 DMG');
  assert.strictEqual(target.hp, 10, 'HP cíle se nezmění');

  const armorEvent = events.find(e => e.type === 'armor_absorbed');
  assert(armorEvent, 'Musí existovat event armor_absorbed');
  assert.strictEqual(armorEvent.absorbed, 1, 'Brnění ztlumilo 1 DMG');
  assert.strictEqual(armorEvent.remainingDmg, 0, 'Zbývající DMG je 0');

  const dmgEvent = events.find(e => e.type === 'damage');
  assert.strictEqual(dmgEvent, undefined, 'Žádný damage event se nevystaví při 0 DMG');
  console.log('  -> OK: Brnění dokáže ztlumit zranění na 0 DMG.\n');
}

// Test 6: Bypassy - krvácení a česnekový oblak ignorují Brnění
console.log('Test 6: Bypassy - Krvácení a louže/oblaky prochází skrze Brnění');
{
  const dummyState = { hero: null, enemies: [], props: [] };
  const target = {
    id: 'test_target_bleed',
    name: 'Obrněnec',
    hp: 15,
    maxHp: 15,
    armor: 2
  };

  // Bleed bypass
  const eventsBleed = [];
  const dealtBleed = dealDamage(dummyState, target, 2, { reason: 'bleed' }, eventsBleed);
  assert.strictEqual(dealtBleed, 2, 'Krvácení musí projít v plné výši (2 DMG)');
  assert.strictEqual(target.hp, 13, 'Cíl má 13 HP');
  assert(!eventsBleed.some(e => e.type === 'armor_absorbed'), 'Krvácení nesmí spustit armor_absorbed');

  // Garlic cloud bypass
  const eventsGarlic = [];
  const dealtGarlic = dealDamage(dummyState, target, 1, { reason: 'garlic_cloud' }, eventsGarlic);
  assert.strictEqual(dealtGarlic, 1, 'Česnek musí projít v plné výši (1 DMG)');
  assert.strictEqual(target.hp, 12, 'Cíl má 12 HP');
  assert(!eventsGarlic.some(e => e.type === 'armor_absorbed'), 'Česnekový oblak nesmí spustit armor_absorbed');
  console.log('  -> OK: Krvácení i česnek úspěšně ignorují Brnění.\n');
}

// Test 7: Kolize se zdí podléhá Brnění
console.log('Test 7: Kolize se zdí podléhá Brnění');
{
  const dummyState = {
    boardSize: 5,
    hero: null,
    enemies: [],
    props: []
  };
  const target = {
    id: 'test_pushed',
    name: 'Obrněný divočák',
    hp: 10,
    maxHp: 10,
    armor: 2,
    cell: 4,
    facing: -1
  };
  dummyState.enemies.push(target);
  const events = [];
  // Odhození směrem do zdi (cell 4 + 1 = 5, mimo meze 0-4)
  pushEntity(dummyState, target, 1, 3, events);

  // Vzdálenost 3 do zdi = 3 náraz DMG
  // Brnění 2 ztlumí 2 DMG -> 1 DMG do HP
  assert.strictEqual(target.hp, 9, 'Target ztratil 1 HP (3 DMG náraz - 2 Brnění)');
  const armorEv = events.find(e => e.type === 'armor_absorbed');
  assert(armorEv, 'Kolize se zdí spustila armor_absorbed');
  assert.strictEqual(armorEv.absorbed, 2, 'Brnění ztlumilo 2 DMG ze zdi');
  console.log('  -> OK: Náraz do zdi je řádně tlumen Brněním.\n');
}

console.log('=== VŠECHNY TESTY PRO BRNĚNÍ PROŠLY! ===');
