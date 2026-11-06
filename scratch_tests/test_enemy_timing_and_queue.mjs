// @ts-nocheck
import assert from 'node:assert/strict';
import {
  createBattleState,
  spawnEnemyEntity,
  hasStatus,
  addStatus
} from '../src/game/engine/state.js';
import {
  planEnemyNextAction,
  checkArmingCondition,
  refreshSingleEnemyIntent
} from '../src/game/engine/state.js';
import {
  insertTileIntoQueue,
  removeTileFromQueue,
  reorderQueue,
  resolveEnemyPhase,
  executeSingleQueueSlot,
  finalizeComboAndAdvanceTurn,
  advanceTurnAfterPlayerAction
} from '../src/game/engine/combat.js';
import { computeBoardThreats } from '../src/game/engine/threat.js';
import { renderEnemyIntentStripHtml } from '../src/game/ui/enemyIntent.js';

console.log('=== TEST SUITE: Časování akcí nepřátel a odpalování fronty (ADR-0014) ===\n');

// Helper to create a clean battle state
function setupState(heroCell = 4, heroFacing = -1) {
  const state = createBattleState('venca', {
    id: 'test_encounter',
    title: 'Testovací střetnutí',
    boardSize: 7,
    enemies: [],
    props: [],
    terrain: {}
  });
  state.hero.cell = heroCell;
  state.hero.facing = heroFacing;
  state.enemies = [];
  return state;
}

// TEST 1: Nabíjení fronty bez indikace & zachování rozpracované fronty při pronásledování
console.log('--- TEST 1: Nabíjení fronty bez indikace & zachování při pronásledování ---');
{
  const state = setupState(4, -1);
  const drab = spawnEnemyEntity('drab', 2, 1); // cell 2, facing right towards cell 4
  drab.comboCapacity = 2;
  state.enemies = [drab];

  // Dráb puts 1 tile into queue
  drab.actionQueue = ['drab_strike'];
  drab.queueState = 'QUEUING_GRAY';

  // Hero is at cell 5 (distance 3, out of melee range)
  state.hero.cell = 5;

  // AI evaluates: hero is out of reach, but Dráb can advance!
  planEnemyNextAction(state, drab);
  checkArmingCondition(state, drab, []);

  assert.notEqual(
    drab.queueState,
    'ARMED_RED',
    'Nepřítel nesmí předčasně zčervenat, když může hráče honit krokem vpřed'
  );
  assert.equal(
    drab.nextAction?.type,
    'step',
    'Nepřítel musí plánovat krok vpřed (honit hráče)'
  );
  assert.deepEqual(
    drab.actionQueue,
    ['drab_strike'],
    'Rozpracovaná fronta musí zůstat zachována i při postupu vpřed'
  );

  // UI check: "NABÍJÍ" tag must NOT be rendered
  const html = renderEnemyIntentStripHtml(drab, 1);
  assert.ok(
    !html.includes('NABÍJÍ'),
    'Vizuál nesmí obsahovat žádný text ani odznak NABÍJÍ'
  );
  assert.ok(
    html.includes('Krok'),
    'Vizuál musí ukazovat telegrafovaný krok'
  );
  console.log('✓ Dráb si ponechal rozpracovanou frontu při postupu vpřed a stav Nabíjí se neindikuje.');
}

// TEST 2: Přechod do 🚨 (Příprava k odpálení) a garantovaný 1 tah na reakci
console.log('\n--- TEST 2: Přechod do 🚨 (Příprava k odpálení) po naplnění kapacity ---');
{
  const state = setupState(3, -1);
  const drab = spawnEnemyEntity('drab', 2, 1); // adjacent: cell 2 vs cell 3
  drab.comboCapacity = 2;
  drab.actionQueue = ['drab_strike', 'drab_strike']; // capacity 2 reached
  state.enemies = [drab];

  checkArmingCondition(state, drab, []);
  assert.equal(drab.queueState, 'ARMED_RED', 'Po naplnění kapacity fronty musí přejít do ARMED_RED');
  assert.equal(drab.nextAction?.type, 'execute_queue', 'Příští akcí musí být odpal fronty');

  const html = renderEnemyIntentStripHtml(drab, 1);
  assert.ok(html.includes('1 AKCE'), 'Vizuál musí indikovat 1 AKCE před odpalem');
  assert.ok(html.includes('intent-slot-armed-red'), 'Sloty musí mít červený rámeček nápřahu');
  console.log('✓ Po naplnění kapacity nepřítel zčervená a hráč má 1 tah na reakci.');
}

// TEST 3: Kiting a Odpálení do prázdna (Kiting into empty air)
console.log('\n--- TEST 3: Kiting a Odpálení do prázdna při ústupu lovce ---');
{
  const state = setupState(4, -1);
  const intern = spawnEnemyEntity('praktikant', 2, 1); // cell 2, strikes cell 3
  intern.actionQueue = ['intern_bite'];
  intern.queueState = 'ARMED_RED';
  state.enemies = [intern];

  // Hero stepped back from cell 3 to cell 4 (out of reach of intern_bite which has offset 1)
  const initialHeroHp = state.hero.hp;
  const events = [];
  resolveEnemyPhase(state, events);

  // Hero must not take damage (miss)
  assert.equal(state.hero.hp, initialHeroHp, 'Hrdina nesmí utrpět zranění, protože byl mimo dosah úderu');

  // Intern must have emptied queue and tile went on cooldown
  assert.equal(intern.actionQueue.length, 0, 'Fronta nepřítele se musí po odpalu vyprázdnit');
  assert.equal(intern.queueState, 'EMPTY', 'Stav fronty musí být EMPTY');
  const poolItem = intern.actionPool.find((p) => p.tileId === 'intern_bite');
  assert.ok((poolItem?.currentCooldown || 0) > 0, 'Destička nepřítele musí po odpalu začít chladnout');

  const airLog = events.find((e) => e.text && (e.text.includes('promáchl') || e.text.includes('do prázdna')));
  assert.ok(airLog, 'V logu musí být záznam o promáchnutí do prázdna');
  console.log('✓ Nepřítel v 🚨 po ústupu hráče sekl do prázdna, vyprázdnil frontu a destička chladne.');
}

// TEST 4: Dynamický přepočet a Přátelská palba (Friendly Fire)
console.log('\n--- TEST 4: Dynamický přepočet a Přátelská palba (Friendly Fire) ---');
{
  const state = setupState(5, -1);
  // Intern 1 at cell 2, facing right (1), armed with intern_bite (hits cell 3)
  const intern1 = spawnEnemyEntity('praktikant', 2, 1);
  intern1.actionQueue = ['intern_bite'];
  intern1.queueState = 'ARMED_RED';

  // Intern 2 at cell 3 (standing in front of intern 1)
  const intern2 = spawnEnemyEntity('praktikant', 3, 1);
  const initialIntern2Hp = intern2.hp;

  state.enemies = [intern1, intern2];

  const events = [];
  resolveEnemyPhase(state, events);

  // Intern 2 was in cell 3, so intern 1's intern_bite hit Intern 2!
  assert.ok(intern2.hp < initialIntern2Hp, 'Intern 2 musel utrpět zranění z Přátelské palby');
  const friendlyLog = events.find((e) => e.text && e.text.includes('PŘÁTELSKÁ PALBA'));
  assert.ok(friendlyLog, 'V logu musí být explicitně zaznamenána PŘÁTELSKÁ PALBA');
  console.log('✓ Zásah vlastního spojence po kinetickém přerovnání korektně udělil Přátelskou palbu.');
}

// TEST 5: Zdržení Zmatením (❓) a zachování fronty bez indikace nápřahu
console.log('\n--- TEST 5: Zdržení Zmatením (❓) a skrytí indikátoru nápřahu ---');
{
  const state = setupState(4, -1);
  const drab = spawnEnemyEntity('drab', 2, 1);
  drab.actionQueue = ['drab_strike'];
  drab.queueState = 'ARMED_RED';
  state.enemies = [drab];

  // Apply confusion
  addStatus(drab, 'confusion', 1);

  // UI check: must show ZMATEN, NOT 1 AKCE
  const html = renderEnemyIntentStripHtml(drab, 1);
  assert.ok(html.includes('ZMATEN'), 'Zmatený nepřítel musí ukazovat tag ZMATEN');
  assert.ok(!html.includes('1 AKCE'), 'Zmatený nepřítel nesmí ukazovat výstrahu 1 AKCE');

  // Threat check: must not be flagged as armed red imminent threat on board
  const threats = computeBoardThreats(state);
  const cell3Threat = threats[3];
  assert.equal(cell3Threat?.isArmedRed, false, 'Při zmatení nesmí bojiště pulzovat červeným zaměřovačem');

  // Resolve enemy phase: confusion should be consumed, but fronta preserved!
  const events = [];
  resolveEnemyPhase(state, events);

  assert.equal(drab.actionQueue.length, 1, 'Fronta zmateného nepřítele nesmí být smazána');
  assert.equal(drab.queueState, 'ARMED_RED', 'Nepřítel zůstává ve stavu nápřahu pro další tah');
  assert.equal(drab.statuses?.confusion || 0, 0, '1 stack zmatení byl spotřebován');

  const skipLog = events.find((e) => e.type === 'enemy_confusion_skipped');
  assert.ok(skipLog, 'Nepřítel musel vynechat akci');
  console.log('✓ Zmatení zdrží odpal o 1 tah, skryje nápřah a nesmaže rozpracovanou frontu.');
}

// TEST 6: Ekonomika tahů hráče (Zařazení = 1 tah, Odpal = 1 tah, Vyjmutí/Přerovnání = zdarma)
console.log('\n--- TEST 6: Ekonomika tahů hráče (Vložení 1 tah, Odpal 1 tah, Vyjmutí 0 tahů) ---');
{
  const state = setupState(3, -1);
  assert.ok(state.hand.length >= 2, 'Hrdina musí mít destičky v ruce');
  const t1 = state.hand[0];
  const t2 = state.hand[1];

  // 1. Insert normal tile -> consumes turn (freeTurn: false)
  const insRes = insertTileIntoQueue(state, t1.instanceId);
  assert.equal(insRes.ok, true);
  assert.equal(insRes.freeTurn, false, 'Vložení běžné destičky musí spotřebovat tah (freeTurn: false)');
  assert.equal(state.queue.length, 1);

  // 2. Reorder queue -> free turn (freeTurn: true)
  insertTileIntoQueue(state, t2.instanceId);
  assert.equal(state.queue.length, 2);
  const reorderRes = reorderQueue(state, 0, 1);
  assert.equal(reorderRes.ok, true);
  assert.equal(reorderRes.freeTurn, true, 'Přerovnání fronty musí být ZDARMA (freeTurn: true)');

  // 3. Remove tile -> free turn (freeTurn: true)
  const remRes = removeTileFromQueue(state, 0);
  assert.equal(remRes.ok, true);
  assert.equal(remRes.freeTurn, true, 'Vyjmutí z fronty musí být ZDARMA (freeTurn: true)');
  assert.equal(state.queue.length, 1);

  // 4. Executing queue -> consumes turn
  const initialTurnsTaken = state.stats.turnsTaken || 0;
  executeSingleQueueSlot(state, state.queue[0], 0, 1);
  finalizeComboAndAdvanceTurn(state, 1);

  assert.equal(
    state.stats.turnsTaken,
    initialTurnsTaken + 1,
    'Odpálení fronty musí zvýšit odehrané tahy o 1'
  );
  console.log('✓ Ekonomika tahů přesně odpovídá ADR-0014.');
}

console.log('\n===============================================================');
console.log('VŠECHNY TESTY ČASOVÁNÍ, ODPALOVÁNÍ FRONTY A PŘÁTELSKÉ PALBY PROŠLY! 🎉');
console.log('===============================================================');
