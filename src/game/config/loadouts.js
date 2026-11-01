// @ts-nocheck
export const STARTING_LOADOUTS = {
  classic: {
    id: 'classic',
    hunterId: 'venca',
    name: 'Venca Česnekáč',
    icon: '🧄',
    cost: 0,
    epithet: 'Dub a česnek',
    maxHp: 20,
    bumpName: 'Česnekové žduchnutí',
    bumpDesc: 'Krok do nepřítele: Odhodí ho o 1 pole a zanechá Česnekový oblak (CD 3).',
    comboName: 'Česneková aura',
    comboDesc: '3-kombo: Získá +4 Štít (vyprchá na konci dalšího kola) a omámí okolní upíry (Zmatení).',
    description: 'Hospodský štamgast a lidový lovec. 20 HP, spoléhá na česnek a odhazování nepřátel.',
    deck: [
      { id: 'oak_stake', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'garlic_belch', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'holy_syringe', upgradeLevel: 0, permanentCdReduction: 0 }
    ]
  },
  honza: {
    id: 'honza',
    hunterId: 'honza',
    name: 'Hloupý Honza',
    icon: '🥖',
    cost: 0,
    epithet: 'Selský silák',
    maxHp: 20,
    bumpName: 'Selský beran',
    bumpDesc: 'Krok do nepřítele: Odhodí nepřítele, sám obsadí jeho pole a způsobí mu 2 drtivé DMG (CD 3).',
    comboName: 'Selský hněv',
    comboDesc: '3-kombo: Získá +6 Štít a mocná rázová vlna zasáhne okolní nepřátele za 4 DMG.',
    description: 'Prostý chasník s nadlidskou silou. 20 HP, okovaný cep, povidlové buchty a drtivý nápřah. Benchmark vyváženosti.',
    deck: [
      { id: 'flail_sweep', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'plum_bun', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'heavy_windup', upgradeLevel: 0, permanentCdReduction: 0 }
    ]
  },
  dragoun: {
    id: 'dragoun',
    hunterId: 'dragoun',
    name: 'Rittmeister Jaromír',
    icon: '⚔️',
    cost: 15,
    epithet: 'Vysloužilý dragoun',
    maxHp: 24,
    bumpName: 'Úder těžkým jílcem',
    bumpDesc: 'Krok do nepřítele: Praští ho mosazným jílcem šavle za 2 DMG, odhodí ho a omráčí (CD 3).',
    comboName: 'Kavaleristická salva',
    comboDesc: '3-kombo: Vypálí kartáčovou salvu (4 DMG všem v linii pohledu) a zkrátí chladnutí všech destiček o 1.',
    description: 'Císařský jezdecký veterán. 24 HP, armádní šavle, křesadlová bambitka a neprůstřelný vojenský kryt.',
    deck: [
      { id: 'dragoon_sabre', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'dragoon_pistol', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'cavalry_parry', upgradeLevel: 0, permanentCdReduction: 0 }
    ]
  },
  zlodejka: {
    id: 'zlodejka',
    hunterId: 'zlodejka',
    name: 'Káča Pavučina',
    icon: '🗡️',
    cost: 25,
    epithet: 'Úskočná zlodějka',
    maxHp: 14,
    bumpName: 'Kapsářská záměna',
    bumpDesc: 'Krok do nepřítele: Prohodí si s ním místo a otočí ho zády k sobě (CD 2).',
    comboName: 'Pavučinový únik',
    comboDesc: '3-kombo: Získá +4 Štít a okamžitě obnoví připravenost manévru záměny.',
    description: 'Hbitá kapsářka z pražských uliček. Křehká (14 HP), ale ze zálohy do zad zasazuje smrtících 8 DMG.',
    deck: [
      { id: 'stiletto_stab', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'glass_shards', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'shadow_slip', upgradeLevel: 0, permanentCdReduction: 0 }
    ]
  }
};
