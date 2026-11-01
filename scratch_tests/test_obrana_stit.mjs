import assert from 'node:assert';
import {
  createBattleState,
  dealDamage,
  getHitBlockType,
  shouldApplySecondaryEffect
} from '../src/game/engine/state.js';
import { advanceTurnAfterPlayerAction } from '../src/game/engine/combat.js';

const fresh = () => createBattleState({ hunterId: 'dragoun', encounterId: 'tutorial_1' });

// 1. Štít pohlcuje zranění bod po bodu
{
  const s = fresh();
  const t = s.enemies[0];
  t.statuses = { shield: 2 };
  const hp0 = t.hp;
  dealDamage(s, t, 1, {}, []);
  assert.strictEqual(t.statuses.shield, 1, 'Štít klesl o 1');
  assert.strictEqual(t.hp, hp0, 'HP beze změny');
  console.log('✓ Štít pohlcuje zranění bod po bodu');
}

// 2. Plná absorpce -> vedlejší efekty odraženy
{
  const s = fresh();
  const t = s.enemies[0];
  t.statuses = { shield: 3 };
  const ev = [];
  dealDamage(s, t, 2, {}, ev);
  const block = getHitBlockType(ev, 0);
  assert.strictEqual(block, 'shield');
  for (const e of ['stun', 'bleed', 'confusion']) {
    assert.strictEqual(shouldApplySecondaryEffect(block, e), false, e + ' odražen');
  }
  console.log('✓ Plně pohlcený útok odrazí vedlejší efekty');
}

// 3. Průraz do HP -> vedlejší efekty projdou
{
  const s = fresh();
  const t = s.enemies[0];
  t.statuses = { shield: 1 };
  const hp0 = t.hp;
  const ev = [];
  dealDamage(s, t, 3, {}, ev);
  assert.strictEqual(t.hp, hp0 - 2, 'Do HP prošly 2 body');
  const block = getHitBlockType(ev, 0);
  assert.strictEqual(block, null);
  assert.strictEqual(shouldApplySecondaryEffect(block, 'stun'), true);
  console.log('✓ Proražený Štít propustí vedlejší efekty');
}

// 4. Štít vyprchá a znovu se nahodí z Obrany (lovec)
{
  const s = fresh();
  s.hero.statuses.shield = 7; // bonus štít z destičky
  advanceTurnAfterPlayerAction(s, []);
  assert.strictEqual(s.hero.statuses.shield, s.hero.defense, 'Zbytek zmizel, nahodila se Obrana');
  console.log('✓ Štít na konci kola zmizí a nahodí se z Obrany');
}

// 5. Obrana 0 -> žádný Štít
{
  const s = createBattleState({ hunterId: 'honza', encounterId: 'tutorial_1' });
  assert.ok(!s.hero.statuses.shield, 'Honza nemá Štít');
  advanceTurnAfterPlayerAction(s, []);
  assert.ok(!s.hero.statuses.shield, 'Honza nemá Štít ani po kole');
  console.log('✓ Obrana 0 nedává Štít');
}

console.log('\nVše prošlo.');
