// @ts-nocheck
export const STARTING_LOADOUTS = {
  classic: {
    id: 'classic',
    hunterId: 'venca',
    name: 'Venca Česnekáč',
    icon: '🧄',
    portrait: '/assets/aistudio/Venca__esnek_06bdb1af.png',
    cost: 0,
    epithet: 'Dub a česnek',
    maxHp: 20,
    defense: 1,
    bumpName: 'Česnekové žduchnutí',
    bumpDesc: 'Krok do nepřítele: Odhodí ho o 1 pole a zanechá Česnekový oblak (Chladnutí 3).',
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
    portrait: '/assets/aistudio/Vesel__Honza_s_rane_kem_na_cest__2d2284c3.png',
    cost: 0,
    epithet: 'Selský silák',
    maxHp: 20,
    defense: 0,
    bumpName: 'Selský beran',
    bumpDesc: 'Krok do nepřítele: Odhodí nepřítele, sám obsadí jeho pole a způsobí mu 2 drtivé DMG (Chladnutí 3).',
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
    portrait: '/assets/aistudio/dragoun_3c7cb780.png',
    cost: 15,
    epithet: 'Vysloužilý dragoun',
    maxHp: 24,
    defense: 2,
    bumpName: 'Úder těžkým jílcem',
    bumpDesc: 'Krok do nepřítele: Praští ho mosazným jílcem šavle za 2 DMG, odhodí ho a omráčí (Chladnutí 3).',
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
    portrait: '/assets/aistudio/Zlatovlas__zlod_jka_s_d_kou_96361a6e.png',
    cost: 25,
    epithet: 'Úskočná zlodějka',
    maxHp: 14,
    defense: 2,
    bumpName: 'Kapsářská záměna',
    bumpDesc: 'Krok do nepřítele: Prohodí si s ním místo a otočí ho zády k sobě (Chladnutí 2).',
    comboName: 'Pavučinový únik',
    comboDesc: '3-kombo: Získá +4 Štít a okamžitě obnoví připravenost manévru záměny.',
    description: 'Hbitá kapsářka z pražských uliček. Křehká (14 HP), ale ze zálohy do zad zasazuje smrtících 8 DMG.',
    deck: [
      { id: 'stiletto_stab', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'glass_shards', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'shadow_slip', upgradeLevel: 0, permanentCdReduction: 0 }
    ]
  },
  ponocny: {
    id: 'ponocny',
    hunterId: 'ponocny',
    name: 'Ponocný Bartoloměj',
    icon: '🏮',
    portrait: '/assets/aistudio/ponocn__6449a1bd.png',
    cost: 20,
    epithet: 'Strážce půlnoční hodiny',
    maxHp: 26,
    defense: 2,
    bumpName: 'Zarazení ratištěm',
    bumpDesc: 'Krok do nepřítele: Vrazí do nepřítele těžké ratiště za 3 DMG, odhodí ho o 1 pole a na 1 tah omráčí (Chladnutí 4).',
    comboName: 'Půlnoční vartování',
    comboDesc: '3-kombo: Získá +6 Štít, odtroubí půlnoc a zasáhne obě pole před sebou za 5 DMG.',
    description: 'Silný a rozvážný noční hlídač. Vysoké zdraví (26 HP), 2 Obrana. Jeho kovaná halapartna zasahuje dvě políčka před sebou! Pomalé chladnutí vyvažuje těžkým úderem, lucernou a nočním rohem.',
    deck: [
      { id: 'halberd_sweep', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'watchman_lantern', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'watchman_horn', upgradeLevel: 0, permanentCdReduction: 0 }
    ]
  },
  silak: {
    id: 'silak',
    hunterId: 'silak',
    name: 'Silák Gustav',
    icon: '🏋️',
    portrait: '/assets/aistudio/Vintage_sil_k_s_kotvou_a_medail__86a24e4c.png',
    cost: 20,
    epithet: 'Cirkusový lamač podkov',
    maxHp: 22,
    defense: 1,
    bumpName: 'Cirkusový přehoz',
    bumpDesc: 'Krok do nepřítele: Praští s nepřítelem o zem za 3 DMG a odhodí ho o 2 pole vzad (Chladnutí 3)!',
    comboName: 'Litinové finále',
    comboDesc: '3-kombo: Získá +5 Štít a vrhne obří činku na prvního nepřítele v linii pohledu za 6 DMG + omráčení.',
    description: 'Bývalá hvězda kočovného cirkusu Kludský. 22 HP, litinové činky, vrhací závaží a ocelové svaly lámající upíří vazy.',
    deck: [
      { id: 'barbell_slam', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'kettlebell_toss', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'iron_flex', upgradeLevel: 0, permanentCdReduction: 0 }
    ]
  },
  anglicanka: {
    id: 'anglicanka',
    hunterId: 'anglicanka',
    name: 'Lady Gwendolyn',
    icon: '🫖',
    portrait: '/assets/aistudio/Barevn__viktori_nsk__lovkyn__s_de_tn_kem_e96488c5.png',
    cost: 30,
    epithet: 'Viktoriánská dáma & lovkyně',
    maxHp: 18,
    defense: 2,
    bumpName: 'Klepnutí slunečníkem',
    bumpDesc: 'Krok do nepřítele: Klepne nevychovaného upíra přes prsty za 2 DMG a otočí ho zády k sobě (Chladnutí 2).',
    comboName: 'Čaj o páté',
    comboDesc: '3-kombo: Vychutná si doušek čaje (+4 HP, +4 Štít) a vařící čaj opaří všechny nepřátele v linii pohledu za 3 DMG.',
    description: 'Ušlechtilá britská aristokratka na ozdravném pobytu v Čechách. 18 HP, 2 Obrana, stříbrný slunečník a vařící Earl Grey proti nevychované noční havěti.',
    deck: [
      { id: 'silver_parasol', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'boiling_tea', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'royal_etiquette', upgradeLevel: 0, permanentCdReduction: 0 }
    ]
  },
  helsing: {
    id: 'helsing',
    hunterId: 'helsing',
    name: 'Profesor Gabriel van Helsing',
    icon: '🏹',
    portrait: '/assets/aistudio/Karikatura_Van_Helsinga_s_rota_n__ku___4ad7e475.png',
    cost: 25,
    epithet: 'Vědecký okultista',
    maxHp: 18,
    defense: 1,
    bumpName: 'Úder pažbou kuše',
    bumpDesc: 'Krok do nepřítele: Udeří nepřítele okovanou pažbou za 2 DMG a odhodí ho o 1 pole vzad (Chladnutí 2).',
    comboName: 'Kruhový rotační rozptyl',
    comboDesc: '3-kombo: Vypálí salvu šipek: 4 DMG + Krvácení (2) všem nepřátelům v linii dohledu.',
    description: 'Renomovaný profesor z Leidenu a Londýna. 18 HP, 1 Obrana, rotační multishot kuše, stříbrné salvy a vědecky neúprosná likvidace nočních kreatur.',
    deck: [
      { id: 'repeating_crossbow', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'silver_bolt_salvo', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'winch_reload_kick', upgradeLevel: 0, permanentCdReduction: 0 }
    ]
  },
  revident: {
    id: 'revident',
    hunterId: 'revident',
    name: 'C. k. vrchní revident (Ignác Šiml)',
    icon: '📑',
    portrait: '/assets/aistudio/Ornate_c_sa_sk__boty_star_ho___edn_ka_8f8df6f3.png',
    cost: 20,
    epithet: 'Císařský daňový exekutor',
    maxHp: 4,
    defense: 2,
    bumpName: 'Třísknutí deskami spisů',
    bumpDesc: 'Krok do nepřítele: Vrazí do nepřítele fasciklem za 1 DMG, odhodí ho o 1 pole a orazítkuje [OKOLKOVÁNO] (Chladnutí 2).',
    comboName: 'Finanční exekuce',
    comboDesc: '3-kombo: Získá +3 Štít, nalepí [OKOLKOVÁNO] na všechny noční netvory a již okolkovaným udělí 3 DMG!',
    description: 'C. k. vrchní revident Ignác Šiml. 4 HP, 2 Obrana (chráněn tvídovým převlečníkem a fasciklem spisů na hrudi). Úřední předvolání, razítka a vymáhání daně z nočního pobytu.',
    deck: [
      { id: 'gov_stake_1884', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'brass_stamp_denied', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'rast_gasser_revolver', upgradeLevel: 0, permanentCdReduction: 0 },
      { id: 'domicile_inspection', upgradeLevel: 0, permanentCdReduction: 0 }
    ]
  }
};
