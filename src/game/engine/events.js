// @ts-nocheck
import { HERO_TILES } from '../config/tiles.js';
import { TALISMANS } from '../config/talismans.js';
import { grantTileToRun, grantTalismanToRun, upgradeTileInRun } from './run.js';

export const EVENTS = [
  {
    id: 'garlic_smuggler',
    title: 'Pašerák se sušeným česnekem',
    text: 'V průvanu pod schodištěm přešlapuje chlapík v promaštěném kabátě. „Pst, pane Venco! Mám tu pravý břeclavský paličák i trochu mešního vína ze sakristie. Co to bude?“',
    choices: [
      {
        label: 'Koupit věnec česneku a posilnit se (−12 dukátů, +3 HP)',
        condition: (run) => run.gold >= 12,
        effect: {
          goldDelta: -12,
          heal: 3,
          log: 'Venca schroupal tři stroužky česneku a cítí se jako zamlada (+3 HP).'
        }
      },
      {
        label: 'Vyměnit starou lahvičku za náhodný talisman (−15 dukátů)',
        condition: (run) => run.gold >= 15,
        effect: {
          goldDelta: -15,
          grantRandomTalisman: true,
          log: 'Pašerák vytáhl z kapsy podivuhodnou relikvii!'
        }
      },
      {
        label: 'Postrašit ho krucifixem a vybrat pokutu (+10 dukátů)',
        effect: {
          goldDelta: 10,
          log: 'Pašerák raději vysypal drobné, než by dostal křížem přes čepici (+10 dukátů).'
        }
      }
    ]
  },
  {
    id: 'vampire_tax_form',
    title: 'Zaprášené hradní skriptorium',
    text: 'U kamenného pultu dospává starý upíří písař. Na pergamenech jsou načrtnuté kletby krve a vedle leží měšec se stříbrňáky.',
    choices: [
      {
        label: 'Sebrat měšec a probodnout kletbu (+18 dukátů, ale písař tě škrábne drápem: −1 HP)',
        effect: {
          goldDelta: 18,
          damage: 1,
          log: 'Škrábanec od upířího drápu pálí (−1 HP), ale v kapse cinká 18 dukátů!'
        }
      },
      {
        label: 'Seřídit si opasek a vylepšit náhodnou destičku zdarma',
        effect: {
          upgradeRandomTile: true,
          log: 'Klid ve skriptoriu posloužil k vykování jedné destičky!'
        }
      },
      {
        label: 'Po špičkách odejít a odpočinout si ve stínu klenby (+2 HP)',
        effect: {
          heal: 2,
          log: 'Dvacet minut klidného oddechu v chladném stínu katakomb (+2 HP).'
        }
      }
    ]
  },
  {
    id: 'abandoned_barrel',
    title: 'Zapomenutý sud z klášterního pivovaru',
    text: 'Uprostřed klenuté síně stojí naražený soudek. Voní z něj poctivý ležák, ale kolem pípy jsou stopy od upířích špičáků.',
    choices: [
      {
        label: 'Natočit si poctivý tuplák (+4 HP)',
        effect: {
          heal: 4,
          log: 'Křenová pěna a svěcený chmel! Vencovi se vrátil elán (+4 HP).'
        }
      },
      {
        label: 'Prohledat dno sudu (získáš novou destičku do zásoby)',
        effect: {
          grantRandomTile: true,
          log: 'Za sudem ležel zapomenutý lovecký nástroj!'
        }
      },
      {
        label: 'Rozebrat mosazné obruče a prodat je (+14 dukátů)',
        effect: {
          goldDelta: 14,
          log: 'Mosazná pípa hodí ve výkupu pěkných 14 dukátů.'
        }
      }
    ]
  },
  {
    id: 'crypt_confessional',
    title: 'Vrzající zpovědnice v kryptě',
    text: 'Z dřevěné budky se ozývá šepot: „Otče, zhřešil jsem, místo krve jsem včera pil malinovou limonádu...“ Je to kající se upír-praktikant.',
    choices: [
      {
        label: 'Udělit mu rozhřešení výměnou za cenný talisman',
        effect: {
          grantRandomTalisman: true,
          log: 'Kající se upír ti podstrčil mřížkou rodinný talisman.'
        }
      },
      {
        label: 'Uložit mu pokání v dukátech (+16 dukátů)',
        effect: {
          goldDelta: 16,
          log: 'Upír vysázel 16 dukátů do kasičky na opravu střechy.'
        }
      },
      {
        label: 'Namočit kolík ve svěcené kropence (vylepší 1 destičku)',
        effect: {
          upgradeRandomTile: true,
          log: 'Svěcená voda ze zpovědnice posílila tvou výzbroj!'
        }
      }
    ]
  }
];

export function pickRandomEvent(run) {
  const visited = new Set(run.visitedEvents || []);
  const unvisited = EVENTS.filter((ev) => !visited.has(ev.id));
  const picked = run.rng.pick(unvisited.length > 0 ? unvisited : EVENTS);
  run.visitedEvents ||= [];
  if (picked && !run.visitedEvents.includes(picked.id)) {
    run.visitedEvents.push(picked.id);
  }
  return {
    ...picked,
    choices: (picked.choices || []).map((c) => ({ ...c }))
  };
}

export function resolveEventChoice(run, eventId, choiceIdx) {
  const ev = EVENTS.find((e) => e.id === eventId);
  if (!ev) return { ok: false, message: 'Neznámá událost.' };
  const choice = ev.choices[choiceIdx];
  if (!choice) return { ok: false, message: 'Neplatná volba.' };
  if (choice.condition && !choice.condition(run)) {
    return { ok: false, message: 'Na tuto volbu nemáš dostatek dukátů!' };
  }

  const eff = choice.effect || {};
  let msg = eff.log || 'Rozhodnutí bylo učiněno.';
  if (typeof eff.goldDelta === 'number') {
    run.gold = Math.max(0, run.gold + eff.goldDelta);
  }
  if (typeof eff.heal === 'number') {
    run.heroHp = Math.min(run.heroMaxHp, run.heroHp + eff.heal);
  }
  if (typeof eff.damage === 'number') {
    run.heroHp = Math.max(1, run.heroHp - eff.damage);
  }
  if (eff.grantRandomTalisman) {
    const unowned = Object.keys(TALISMANS).filter((id) => !run.talismans.includes(id));
    if (unowned.length > 0) {
      const talId = run.rng.pick(unowned);
      grantTalismanToRun(run, talId);
      msg += ` Získán talisman: ${TALISMANS[talId].name}!`;
    } else {
      run.gold += 20;
      msg += ' (Všechny talismany už vlastníš, získáváš +20 dukátů.)';
    }
  }
  if (eff.grantRandomTile) {
    const owned = new Set(run.deck.map((d) => d.id));
    const unowned = Object.keys(HERO_TILES).filter((id) => !owned.has(id));
    if (unowned.length > 0) {
      const tId = run.rng.pick(unowned);
      grantTileToRun(run, tId);
      msg += ` Získána destička: ${HERO_TILES[tId].name}!`;
    } else {
      run.gold += 18;
      msg += ' (+18 dukátů)';
    }
  }
  if (eff.upgradeRandomTile) {
    const upgradable = run.deck
      .map((d, idx) => ({ ...d, idx }))
      .filter((d) => (d.upgradeLevel || 0) < 2);
    if (upgradable.length > 0) {
      const picked = run.rng.pick(upgradable);
      upgradeTileInRun(run, picked.idx);
      msg += ` Vylepšena destička: ${HERO_TILES[picked.id].name}!`;
    } else {
      run.gold += 15;
    }
  }

  return { ok: true, message: msg };
}
