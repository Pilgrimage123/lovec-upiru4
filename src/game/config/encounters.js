// @ts-nocheck

export const ARCHETYPES = {
  SWARM: { id: 'swarm', name: 'Letecký & rychlý roj', hint: 'Rychlí útočníci a hlodavci útočící v přesile.' },
  SHIELDWALL: { id: 'shieldwall', name: 'Štítová hradba', hint: 'Odolný štítonoš vpředu kryjící střelce či léčitele.' },
  SNIPERS: { id: 'snipers', name: 'Střelecká křížová palba', hint: 'Dálkoví střelci vrhající nože a prokleté svitky.' },
  DISRUPTION: { id: 'disruption', name: 'Zákeřná léčka & pasti', hint: 'Odstrkování do propastí a na naostřené kůly.' },
  AMBUSH: { id: 'ambush', name: 'Přepadení ze zálohy', hint: 'Protivníci útočí z obou stran zároveň.' },
  BRUTE_FORCE: { id: 'brute_force', name: 'Surová drtivá síla', hint: 'Těžcí chasníci s nápřahy a vysokým zraněním.' },
  ELITE: { id: 'elite', name: 'C. k. panská inkvizice', hint: 'Vysoce nebezpeční úředníci s četnými posilami.' },
  BOSS: { id: 'boss', name: 'Vládce patra hradu', hint: 'Temný aristokrat s unikátními schopnostmi a fázemi.' }
};

export const ENCOUNTERS = {
  // =========================================================================
  // AKT 1: ZATUCHLÉ PŘEDHRADÍ A HŘBITOV (Threat 1 - 4, Boss 5)
  // =========================================================================

  tutorial_1: {
    id: 'tutorial_1',
    act: 1,
    name: 'Předhradí: Náves za humny',
    backgroundTheme: 'village_night',
    isTutorial: true,
    threatRating: 1,
    archetype: 'swarm',
    archetypeName: 'Venkovská hlídka',
    tacticalHint: 'Základní střet pro osvojení kroků, otočení a jednoduchých úderů.',
    boardSize: 9,
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'kluk_kamen', cell: 5, facing: -1 },
      { enemyId: 'divocak', cell: 8, facing: -1 }
    ],
    props: [{ type: 'barrel', cell: 1 }],
    reinforcements: [
      {
        turnDelay: 4,
        gateCell: 8,
        enemyId: 'netopyr',
        candidatePool: ['netopyr', 'kluk_kamen']
      }
    ],
    goldReward: 16
  },

  act1_patrol_easy: {
    id: 'act1_patrol_easy',
    act: 1,
    name: 'Noční stráž u márnice',
    backgroundTheme: 'village_night',
    threatRating: 1,
    archetype: 'swarm',
    archetypeName: 'Rojová šarvátka',
    tacticalHint: 'Vyřaď srpáka dříve, než se přiblíží morový nosič.',
    boardSize: 7,
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'srpak', cell: 4, facing: -1 },
      { enemyId: 'morak', cell: 6, facing: -1 }
    ],
    reinforcements: [
      {
        turnDelay: 4,
        gateCell: 6,
        enemyId: 'netopyr',
        candidatePool: ['netopyr', 'kluk_kamen']
      }
    ],
    goldReward: 16
  },

  act1_battle_1: {
    id: 'act1_battle_1',
    act: 1,
    name: 'Zatuchlá hradní chodba',
    backgroundTheme: 'castle_corridor',
    threatRating: 2,
    archetype: 'disruption',
    archetypeName: 'Chodbová šarvátka',
    tacticalHint: 'Rozbití kropenky posvětí dlažbu a zraní všechny nemrtvé v okolí.',
    props: [{ type: 'holy_font', cell: 3 }],
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'srpak', cell: 4, facing: -1 },
      { enemyId: 'morak', cell: 6, facing: -1 }
    ],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 6,
        enemyId: 'zombie_hynek',
        candidatePool: ['zombie_hynek', 'morak', 'sedlak_stit']
      }
    ],
    goldReward: 18
  },

  act1_shield_and_stone: {
    id: 'act1_shield_and_stone',
    act: 1,
    name: 'Vrátnice u hradební výspy',
    backgroundTheme: 'village_night',
    threatRating: 2,
    archetype: 'shieldwall',
    archetypeName: 'Štítová hradba',
    tacticalHint: 'Sedlák s víkem od sudu blokuje cestu ke střelci vzadu. Použij prorážení nebo skok.',
    boardSize: 7,
    heroCell: 1,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'sedlak_stit', cell: 3, facing: -1 },
      { enemyId: 'kluk_kamen', cell: 5, facing: -1 }
    ],
    props: [{ type: 'barrel', cell: 6 }],
    reinforcements: [
      {
        turnDelay: 4,
        gateCell: 6,
        enemyId: 'morak',
        candidatePool: ['morak', 'srpak']
      }
    ],
    goldReward: 18
  },

  act1_battle_2: {
    id: 'act1_battle_2',
    act: 1,
    name: 'Hradní spižírna u zelného sudu',
    backgroundTheme: 'village_night',
    threatRating: 2,
    archetype: 'brute_force',
    archetypeName: 'Surová síla',
    tacticalHint: 'Sud se zelím tě ochrání před přímým rozběhem prasete.',
    boardSize: 9,
    heroCell: 1,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'prase_mutant', cell: 5, facing: -1 },
      { enemyId: 'kyjovec', cell: 8, facing: -1 }
    ],
    props: [{ type: 'barrel', cell: 3 }],
    terrain: [],
    reinforcements: [
      {
        turnDelay: 4,
        gateCell: 0,
        enemyId: 'buldok',
        candidatePool: ['buldok', 'kluk_kamen', 'morak']
      }
    ],
    goldReward: 20
  },

  act1_bat_roost: {
    id: 'act1_bat_roost',
    act: 1,
    name: 'Stará zvonice plná netopýrů',
    backgroundTheme: 'castle_corridor',
    threatRating: 3,
    archetype: 'swarm',
    archetypeName: 'Letecký přepad',
    tacticalHint: 'Létající netopýři ignorují pasti a rychle přeletují. Rychlé otočení ti zachrání krk.',
    boardSize: 7,
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'netopyr', cell: 4, facing: -1 },
      { enemyId: 'netopyr', cell: 6, facing: -1 }
    ],
    terrain: [{ type: 'plank_intact', cell: 3 }],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 0,
        enemyId: 'morak',
        candidatePool: ['morak', 'kluk_kamen']
      }
    ],
    goldReward: 20
  },

  act1_puddle_ambush: {
    id: 'act1_puddle_ambush',
    act: 1,
    name: 'Zádušní kaple s kropenkou',
    backgroundTheme: 'castle_corridor',
    threatRating: 3,
    archetype: 'ambush',
    archetypeName: 'Oboustranné sevření',
    tacticalHint: 'Nepřítel za zády vyžaduje rychlé otočení nebo odhození do posvěcené vody.',
    boardSize: 7,
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'srpak', cell: 0, facing: 1 },
      { enemyId: 'zombie_hynek', cell: 5, facing: -1 }
    ],
    props: [{ type: 'holy_font', cell: 3 }],
    reinforcements: [
      {
        turnDelay: 4,
        gateCell: 6,
        enemyId: 'kluk_kamen',
        candidatePool: ['kluk_kamen', 'morak']
      }
    ],
    goldReward: 22
  },

  act1_courtyard_crossfire: {
    id: 'act1_courtyard_crossfire',
    act: 1,
    name: 'Nádvoří se špičáky',
    backgroundTheme: 'village_night',
    threatRating: 3,
    archetype: 'disruption',
    archetypeName: 'Pasti a překážky',
    tacticalHint: 'Kůly v podlaze udělují 4 zranění každému, kdo na ně vkročí nebo je na ně odhozen!',
    boardSize: 7,
    heroCell: 1,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'sedlak_stit', cell: 4, facing: -1 },
      { enemyId: 'kluk_kamen', cell: 6, facing: -1 }
    ],
    terrain: [{ type: 'spikes', cell: 3 }],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 0,
        enemyId: 'buldok',
        candidatePool: ['buldok', 'srpak']
      }
    ],
    goldReward: 22
  },

  act1_butcher_dogs: {
    id: 'act1_butcher_dogs',
    act: 1,
    name: 'Zámecký psí kotec',
    backgroundTheme: 'castle_corridor',
    threatRating: 3,
    archetype: 'brute_force',
    archetypeName: 'Hladové bestie',
    tacticalHint: 'Buldok a vlkodav provádějí rychlé skoky s krvácením. Připrav si obranné manévry.',
    boardSize: 7,
    heroCell: 1,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'buldok', cell: 4, facing: -1 },
      { enemyId: 'kyjovec', cell: 6, facing: -1 }
    ],
    props: [{ type: 'barrel', cell: 3 }],
    reinforcements: [
      {
        turnDelay: 4,
        gateCell: 6,
        enemyId: 'vlkodav',
        candidatePool: ['vlkodav', 'morak']
      }
    ],
    goldReward: 24
  },

  act1_elite: {
    id: 'act1_elite',
    act: 1,
    name: 'Černá kuchyně řeznice Boženy',
    backgroundTheme: 'castle_corridor',
    isElite: true,
    threatRating: 4,
    archetype: 'elite',
    archetypeName: 'Elitní dráb',
    tacticalHint: 'Elitní dráb má vysoké brnění a odhazuje úderem. Eliminuj nejprve štítonoše!',
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'elite_drab', cell: 5, facing: -1 },
      { enemyId: 'sedlak_stit', cell: 3, facing: -1 }
    ],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 6,
        enemyId: 'vlkodav',
        candidatePool: ['vlkodav', 'morak', 'netopyr']
      }
    ],
    goldReward: 30
  },

  act1_elite_inquisitor: {
    id: 'act1_elite_inquisitor',
    act: 1,
    name: 'Přísedící c. k. polního soudu',
    backgroundTheme: 'castle_corridor',
    isElite: true,
    threatRating: 4,
    archetype: 'elite',
    archetypeName: 'Elitní inkvizitor',
    tacticalHint: 'Pozor na bodce a rychlé posily. Využij sud k omráčení elitních sil.',
    heroCell: 1,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'elite_drab', cell: 4, facing: -1 },
      { enemyId: 'morak', cell: 6, facing: -1 }
    ],
    props: [{ type: 'barrel', cell: 2 }],
    terrain: [{ type: 'spikes', cell: 5 }],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 0,
        enemyId: 'sedlak_stit',
        candidatePool: ['sedlak_stit', 'kluk_kamen']
      }
    ],
    goldReward: 32
  },

  act1_boss: {
    id: 'act1_boss',
    act: 1,
    name: 'Zrcadlový salón Arciknížete von Sosáka',
    backgroundTheme: 'noble_boudoir',
    isBoss: true,
    threatRating: 5,
    archetype: 'boss',
    archetypeName: 'Pán prvního patra',
    tacticalHint: 'Sosák se prohazuje se spojenci u zrcadla a vysává krev. Znič jeho poskoka před úderem do bosse.',
    boardSize: 9,
    heroCell: 1,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'boss_sosak', cell: 5, facing: -1 },
      { enemyId: 'netopyr', cell: 6, facing: -1 }
    ],
    props: [
      { type: 'barrel', cell: 3 },
      { type: 'mirror', cell: 7 }
    ],
    terrain: [{ type: 'spikes', cell: 4 }],
    reinforcements: [
      {
        turnDelay: 4,
        gateCell: 0,
        enemyId: 'netopyr',
        candidatePool: ['netopyr', 'kluk_kamen', 'vlkodav']
      },
      {
        turnDelay: 7,
        gateCell: 8,
        enemyId: 'kluk_kamen',
        candidatePool: ['kluk_kamen', 'sedlak_stit', 'morak']
      }
    ],
    goldReward: 45
  },

  // =========================================================================
  // AKT 2: ČERNÁ KUCHYNĚ A ZBROJNICE (Threat 2 - 5, Boss 6)
  // =========================================================================

  act2_battle_1: {
    id: 'act2_battle_1',
    act: 2,
    name: 'Strážnice u padací mříže',
    backgroundTheme: 'torture_dungeon',
    threatRating: 2,
    archetype: 'disruption',
    archetypeName: 'Halapartny a zuby',
    tacticalHint: 'Halapartník má dosah 2 pole a odhazuje. Upírka Cilka tě přepadá z týlu.',
    heroCell: 3,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'halapartnik', cell: 5, facing: -1 },
      { enemyId: 'upirka_cilka', cell: 1, facing: 1 }
    ],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 0,
        enemyId: 'upiri_trpaslik',
        candidatePool: ['upiri_trpaslik', 'vrhac_nozu', 'sedlak_stit']
      }
    ],
    goldReward: 22
  },

  act2_battle_2: {
    id: 'act2_battle_2',
    act: 2,
    name: 'Starobylý archiv rodové krve',
    backgroundTheme: 'torture_dungeon',
    threatRating: 3,
    archetype: 'snipers',
    archetypeName: 'Aristokratické svitky',
    tacticalHint: 'Hraběnka Amálie sesílá kletby ze zadních řad. Oživlé dřevo zastaví tvoji salvu.',
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'hrabenka_amalie', cell: 0, facing: 1 },
      { enemyId: 'drevo', cell: 5, facing: -1 }
    ],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 0,
        enemyId: 'sedlak_stit',
        candidatePool: ['sedlak_stit', 'upirka_cilka', 'halapartnik']
      },
      {
        turnDelay: 5,
        gateCell: 6,
        enemyId: 'vrhac_nozu',
        candidatePool: ['vrhac_nozu', 'ucetni_buffer', 'upiri_trpaslik']
      }
    ],
    goldReward: 24
  },

  act2_dwarf_ambush: {
    id: 'act2_dwarf_ambush',
    act: 2,
    name: 'Podzemní sklep s ležáky',
    backgroundTheme: 'torture_dungeon',
    threatRating: 3,
    archetype: 'ambush',
    archetypeName: 'Podzemní přepad',
    tacticalHint: 'Upíří trpaslík kope do holení a vrhá nože. Využij pivní sud k rozptýlení.',
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'upiri_trpaslik', cell: 4, facing: -1 },
      { enemyId: 'vrhac_nozu', cell: 6, facing: -1 }
    ],
    props: [{ type: 'barrel', cell: 3 }],
    reinforcements: [
      {
        turnDelay: 4,
        gateCell: 0,
        enemyId: 'sliz',
        candidatePool: ['sliz', 'upirka_cilka']
      }
    ],
    goldReward: 24
  },

  act2_buffer_cabal: {
    id: 'act2_buffer_cabal',
    act: 2,
    name: 'Účetní kancelář krevních poplatků',
    backgroundTheme: 'torture_dungeon',
    threatRating: 4,
    archetype: 'shieldwall',
    archetypeName: 'Úřednická ochrana',
    tacticalHint: 'Účetní buffer léčí a posiluje halapartníka. Znič účetního přednostně!',
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'halapartnik', cell: 4, facing: -1 },
      { enemyId: 'ucetni_buffer', cell: 6, facing: -1 }
    ],
    terrain: [{ type: 'plank_intact', cell: 3 }],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 6,
        enemyId: 'vrhac_nozu',
        candidatePool: ['vrhac_nozu', 'upiri_trpaslik']
      }
    ],
    goldReward: 26
  },

  act2_pit_corridor: {
    id: 'act2_pit_corridor',
    act: 2,
    name: 'Hladomorna nad bezednou šachtou',
    backgroundTheme: 'torture_dungeon',
    threatRating: 4,
    archetype: 'disruption',
    archetypeName: 'Smrtící propast',
    tacticalHint: 'Propast na poli 6 znamená okamžitou smrt! Odhoď do ní drába manévrem.',
    boardSize: 7,
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'drab', cell: 4, facing: -1 },
      { enemyId: 'upirka_cilka', cell: 1, facing: 1 }
    ],
    terrain: [{ type: 'pit', cell: 5 }],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 0,
        enemyId: 'vrhac_nozu',
        candidatePool: ['vrhac_nozu', 'krysa_piskota']
      }
    ],
    goldReward: 26
  },

  act2_plague_rat_den: {
    id: 'act2_plague_rat_den',
    act: 2,
    name: 'Šatlava zamořená hlodavci',
    backgroundTheme: 'torture_dungeon',
    threatRating: 4,
    archetype: 'swarm',
    archetypeName: 'Morová havěť',
    tacticalHint: 'Krysa Piskota a sliz působí nákazu a krvácení. Udržuj si odstup.',
    boardSize: 7,
    heroCell: 1,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'krysa_piskota', cell: 4, facing: -1 },
      { enemyId: 'sliz', cell: 5, facing: -1 }
    ],
    props: [{ type: 'barrel', cell: 2 }],
    terrain: [{ type: 'spikes', cell: 6 }],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 6,
        enemyId: 'upiri_trpaslik',
        candidatePool: ['upiri_trpaslik', 'morak']
      }
    ],
    goldReward: 28
  },

  act2_elite: {
    id: 'act2_elite',
    act: 2,
    name: 'Mučírna vrchního inkvizitora',
    backgroundTheme: 'torture_dungeon',
    isElite: true,
    threatRating: 5,
    archetype: 'elite',
    archetypeName: 'Císařský vyšetřovatel',
    tacticalHint: 'Elite úředník sesílá těžké daňové kletby a chrání se slizem.',
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'elite_urednik', cell: 5, facing: -1 },
      { enemyId: 'sliz', cell: 6, facing: -1 }
    ],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 0,
        enemyId: 'krysa_piskota',
        candidatePool: ['krysa_piskota', 'ucetni_buffer', 'sedlak_stit']
      }
    ],
    goldReward: 35
  },

  act2_elite_halberdier: {
    id: 'act2_elite_halberdier',
    act: 2,
    name: 'Čestná stráž hraběnčina křídla',
    backgroundTheme: 'torture_dungeon',
    isElite: true,
    threatRating: 5,
    archetype: 'elite',
    archetypeName: 'Panská garda',
    tacticalHint: 'Elitní dráb a halapartník vytvářejí neprostupnou hradbu oceli.',
    heroCell: 1,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'elite_drab', cell: 4, facing: -1 },
      { enemyId: 'halapartnik', cell: 5, facing: -1 }
    ],
    props: [{ type: 'barrel', cell: 2 }],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 6,
        enemyId: 'ucetni_buffer',
        candidatePool: ['ucetni_buffer', 'vrhac_nozu']
      }
    ],
    goldReward: 38
  },

  act2_boss: {
    id: 'act2_boss',
    act: 2,
    name: 'Krajkový budoár Hraběnky Dagmar',
    backgroundTheme: 'noble_boudoir',
    isBoss: true,
    threatRating: 6,
    archetype: 'boss',
    archetypeName: 'Paní hradního křídla',
    tacticalHint: 'Dagmar okouzluje a využívá zrcadel. Pozor na propadla a kůly v hedvábném salonu.',
    boardSize: 9,
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'boss_dagmar', cell: 5, facing: -1 },
      { enemyId: 'sedlak_stit', cell: 4, facing: -1 }
    ],
    props: [
      { type: 'barrel', cell: 3 },
      { type: 'mirror', cell: 7 }
    ],
    terrain: [
      { type: 'plank_intact', cell: 4 },
      { type: 'spikes', cell: 0 }
    ],
    reinforcements: [
      {
        turnDelay: 4,
        gateCell: 8,
        enemyId: 'ucetni_buffer',
        candidatePool: ['ucetni_buffer', 'upirka_cilka', 'sedlak_stit']
      },
      {
        turnDelay: 6,
        gateCell: 0,
        enemyId: 'netopyr',
        candidatePool: ['netopyr', 'vrhac_nozu', 'upiri_trpaslik']
      }
    ],
    goldReward: 55
  },

  // =========================================================================
  // AKT 3: ZRCADLOVÝ TRŮNNÍ SÁL NOCHTICE (Threat 3 - 5, Boss 6)
  // =========================================================================

  act3_battle_1: {
    id: 'act3_battle_1',
    act: 3,
    name: 'Krypta zapomenutých hrobů',
    backgroundTheme: 'vampire_throne_crypt',
    threatRating: 3,
    archetype: 'swarm',
    archetypeName: 'Hrobové zástupy',
    tacticalHint: 'Kostlivec Fabián a sliz povstávají ze tmy. Chraň si záda.',
    heroCell: 3,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'sedlak_stit', cell: 5, facing: -1 },
      { enemyId: 'kostlivec_fabian', cell: 1, facing: 1 },
      { enemyId: 'bazinny_sliz', cell: 6, facing: -1 }
    ],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 0,
        enemyId: 'morovy_felcar',
        candidatePool: ['morovy_felcar', 'zombie_hynek', 'kostlivec_fabian']
      }
    ],
    goldReward: 28
  },

  act3_battle_2: {
    id: 'act3_battle_2',
    act: 3,
    name: 'Předkomoří upířího sněmu',
    backgroundTheme: 'vampire_throne_crypt',
    threatRating: 4,
    archetype: 'snipers',
    archetypeName: 'Okultní sabat',
    tacticalHint: 'Zrcadlo odráží střely zpět! Čarodějnice sesílá zkázu na dálku.',
    props: [{ type: 'mirror', cell: 5 }],
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'rytir_prizrak', cell: 4, facing: -1 },
      { enemyId: 'carodejnice', cell: 6, facing: -1 },
      { enemyId: 'upiri_trpaslik', cell: 0, facing: 1 }
    ],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 0,
        enemyId: 'halapartnik',
        candidatePool: ['halapartnik', 'sedlak_stit', 'upirske_prase']
      },
      {
        turnDelay: 5,
        gateCell: 6,
        enemyId: 'ucetni_buffer',
        candidatePool: ['ucetni_buffer', 'morovy_felcar', 'bazinny_sliz']
      }
    ],
    goldReward: 30
  },

  act3_spectral_knights: {
    id: 'act3_spectral_knights',
    act: 3,
    name: 'Zbrojnice padlých křižáků',
    backgroundTheme: 'vampire_throne_crypt',
    threatRating: 4,
    archetype: 'shieldwall',
    archetypeName: 'Přízračná falanga',
    tacticalHint: 'Přízračný rytíř má silné brnění. Kamenná kropenka poskytuje svěcenou vodu k jeho oslabení.',
    boardSize: 7,
    heroCell: 1,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'rytir_prizrak', cell: 4, facing: -1 },
      { enemyId: 'halapartnik', cell: 5, facing: -1 }
    ],
    props: [{ type: 'holy_font', cell: 3 }],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 6,
        enemyId: 'vrhac_nozu',
        candidatePool: ['vrhac_nozu', 'kostlivec_fabian']
      }
    ],
    goldReward: 30
  },

  act3_plague_infirmary: {
    id: 'act3_plague_infirmary',
    act: 3,
    name: 'Morový špitál temného řádu',
    backgroundTheme: 'vampire_throne_crypt',
    threatRating: 4,
    archetype: 'disruption',
    archetypeName: 'Felčarská morová lázeň',
    tacticalHint: 'Morový felčar léčí a šíří mor. Zabij felčara dříve, než nakazí celou chodbu.',
    boardSize: 7,
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'morovy_felcar', cell: 5, facing: -1 },
      { enemyId: 'zombie_hynek', cell: 4, facing: -1 },
      { enemyId: 'bazinny_sliz', cell: 0, facing: 1 }
    ],
    terrain: [{ type: 'spikes', cell: 3 }],
    reinforcements: [
      {
        turnDelay: 4,
        gateCell: 6,
        enemyId: 'upirske_prase',
        candidatePool: ['upirske_prase', 'sedlak_stit']
      }
    ],
    goldReward: 32
  },

  act3_swine_abomination: {
    id: 'act3_swine_abomination',
    act: 3,
    name: 'Kafilerie upířích mutantů',
    backgroundTheme: 'vampire_throne_crypt',
    threatRating: 5,
    archetype: 'brute_force',
    archetypeName: 'Mutantní běsnění',
    tacticalHint: 'Upírské prase a mutant provádějí ničivé nájezdy. Chraň se za sudy se zelím.',
    boardSize: 9,
    heroCell: 1,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'upirske_prase', cell: 5, facing: -1 },
      { enemyId: 'prase_mutant', cell: 7, facing: -1 }
    ],
    props: [{ type: 'barrel', cell: 3 }],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 0,
        enemyId: 'vrhac_nozu',
        candidatePool: ['vrhac_nozu', 'upiri_trpaslik']
      }
    ],
    goldReward: 34
  },

  act3_elite: {
    id: 'act3_elite',
    act: 3,
    name: 'Sál nočního soudu',
    backgroundTheme: 'torture_dungeon',
    isElite: true,
    threatRating: 5,
    archetype: 'elite',
    archetypeName: 'Nejvyšší inkvizice',
    tacticalHint: 'Kombinace elitního drába a elitního úředníka. Maximální hrozba!',
    heroCell: 3,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'elite_drab', cell: 5, facing: -1 },
      { enemyId: 'elite_urednik', cell: 1, facing: 1 }
    ],
    reinforcements: [
      {
        turnDelay: 4,
        gateCell: 6,
        enemyId: 'sliz',
        candidatePool: ['sliz', 'ucetni_buffer', 'upirske_prase']
      }
    ],
    goldReward: 42
  },

  act3_elite_phantom_general: {
    id: 'act3_elite_phantom_general',
    act: 3,
    name: 'Katakomba generála Radeckého stínu',
    backgroundTheme: 'vampire_throne_crypt',
    isElite: true,
    threatRating: 5,
    archetype: 'elite',
    archetypeName: 'Přízračný generál',
    tacticalHint: 'Přízračný rytíř a felčar s kůly v podlaze vyžadují precizní taktiku a využití kropenky.',
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'rytir_prizrak', cell: 5, facing: -1 },
      { enemyId: 'morovy_felcar', cell: 6, facing: -1 }
    ],
    props: [{ type: 'holy_font', cell: 3 }],
    terrain: [{ type: 'spikes', cell: 4 }],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 0,
        enemyId: 'halapartnik',
        candidatePool: ['halapartnik', 'sedlak_stit']
      }
    ],
    goldReward: 45
  },

  act3_boss: {
    id: 'act3_boss',
    act: 3,
    name: 'Trůnní sál Hraběte von Nochtic',
    backgroundTheme: 'vampire_throne_crypt',
    isBoss: true,
    threatRating: 6,
    archetype: 'boss',
    archetypeName: 'Samotný Hrabě Dracula',
    tacticalHint: 'Svrchovaný pán Nochtic! Dávej pozor na propast, bodce a účetní posily dodávající mu štíty.',
    heroCell: 2,
    heroFacing: 1,
    initialEnemies: [
      { enemyId: 'boss_drakula', cell: 5, facing: -1 },
      { enemyId: 'ucetni_buffer', cell: 6, facing: -1 }
    ],
    props: [{ type: 'barrel', cell: 4 }],
    terrain: [
      { type: 'pit', cell: 0 },
      { type: 'spikes', cell: 3 }
    ],
    reinforcements: [
      {
        turnDelay: 3,
        gateCell: 6,
        enemyId: 'upirske_prase',
        candidatePool: ['upirske_prase', 'rytir_prizrak', 'sedlak_stit']
      },
      {
        turnDelay: 5,
        gateCell: 6,
        enemyId: 'sedlak_stit',
        candidatePool: ['sedlak_stit', 'ucetni_buffer', 'morovy_felcar']
      }
    ],
    goldReward: 100
  }
};

/**
 * Safely retrieve an encounter definition by ID with fallback.
 */
export function getEncounter(id) {
  if (id && ENCOUNTERS[id]) return ENCOUNTERS[id];
  return ENCOUNTERS.tutorial_1;
}

/**
 * Computes a deterministic 1D horizontal reflection (mirroring) of an encounter
 * while preserving exact relative distances, collision spacings, and tactical invariants.
 */
export function computeSpatialVariant(enc, shouldMirror = false) {
  if (!enc || !shouldMirror || enc.isTutorial) return enc;
  const N = enc.boardSize || 7;
  const mirrorCell = (c) => Math.max(0, Math.min(N - 1, (N - 1) - c));
  const mirrorFacing = (f) => (f === 1 ? -1 : 1);

  return {
    ...enc,
    isMirroredVariant: true,
    heroCell: mirrorCell(enc.heroCell ?? 2),
    heroFacing: mirrorFacing(enc.heroFacing ?? 1),
    initialEnemies: (enc.initialEnemies || []).map((e) => ({
      ...e,
      cell: mirrorCell(e.cell),
      facing: mirrorFacing(e.facing ?? -1)
    })),
    props: enc.props
      ? enc.props.map((p) => ({ ...p, cell: mirrorCell(p.cell) }))
      : undefined,
    terrain: enc.terrain
      ? enc.terrain.map((t) => ({ ...t, cell: mirrorCell(t.cell) }))
      : undefined,
    reinforcements: (enc.reinforcements || []).map((r) => ({
      ...r,
      gateCell: r.gateCell === 0 ? N - 1 : 0
    }))
  };
}

/**
 * Intelligent encounter query and selector for the smart stage generation system.
 * Filters by act and constraints, then scores candidates using threat budget,
 * route synergy archetypes, and parent-aware anti-repetition penalties.
 */
export function queryEncounters(opts = {}) {
  const {
    act = 1,
    isElite = false,
    isBoss = false,
    threatTarget = 2,
    preferredArchetype = null,
    avoidArchetypes = [],
    rng = null,
    excludeIds = []
  } = opts;

  // Direct Boss resolution
  if (isBoss) {
    if (act === 1) return ENCOUNTERS.act1_boss;
    if (act === 2) return ENCOUNTERS.act2_boss;
    return ENCOUNTERS.act3_boss;
  }

  const allList = Object.values(ENCOUNTERS);

  // 1. Strict pool filter by act and elite status
  let pool = allList.filter((e) => {
    if (e.act !== act) return false;
    if (Boolean(e.isElite) !== Boolean(isElite)) return false;
    if (e.isBoss) return false;
    if (e.isTutorial) return false;
    return true;
  });

  if (pool.length === 0) {
    // Fallback: relax elite requirement if none found
    pool = allList.filter((e) => e.act === act && !e.isBoss && !e.isTutorial);
  }

  // 2. Filter out already used encounters in this act if we have enough variety
  const unusedPool = pool.filter((e) => !excludeIds.includes(e.id));
  const candidatePool = unusedPool.length > 0 ? unusedPool : pool;

  const avoidSet = new Set(Array.isArray(avoidArchetypes) ? avoidArchetypes : []);

  // 3. Multi-objective utility scoring:
  //    U(e) = max(1, 12 - 3 * |threat(e) - B| + 4 * I(arch == pref) - 6 * I(arch in parentArchs))
  const scored = candidatePool.map((enc) => {
    let score = 12;
    const diff = Math.abs((enc.threatRating || 2) - threatTarget);
    score -= diff * 3;

    if (preferredArchetype && enc.archetype === preferredArchetype) {
      score += 4;
    }

    if (avoidSet.has(enc.archetype)) {
      score -= 6;
    }

    return { enc, score: Math.max(1, score) };
  });

  // 4. Weighted Boltzmann-like proportional sampling using seeded PRNG
  if (rng && typeof rng.nextFloat === 'function') {
    const totalWeight = scored.reduce((sum, item) => sum + item.score, 0);
    let r = rng.nextFloat() * totalWeight;
    for (const item of scored) {
      r -= item.score;
      if (r <= 0) return item.enc;
    }
    return scored[scored.length - 1]?.enc || pool[0];
  }

  // Deterministic fallback: highest utility score
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.enc || pool[0];
}



export const ENEMY_ROLES = {
  SWARM: 'swarm',     // 1 bod (Roj / Hlodavci)
  STRIKER: 'striker', // 2 body (Úderník / Šarvátkář)
  TANK: 'tank',       // 3 body (Předvoj / Štít)
  SNIPER: 'sniper',   // 3 body (Střelec / Podpora)
  ELITE: 'elite'      // 5 bodů (Elitní dráb / Inkvizitor)
};

export const ROLE_COSTS = {
  swarm: 1,
  striker: 2,
  tank: 3,
  sniper: 3,
  elite: 5
};

export const ENEMY_ROLE_REGISTRY = {
  // Roj (1 bod)
  netopyr: { role: 'swarm', cost: 1, acts: [1, 2], name: 'Hladový netopýr' },
  krysa_piskota: { role: 'swarm', cost: 1, acts: [1, 2], name: 'Krysa Piškota' },
  sliz: { role: 'swarm', cost: 1, acts: [1], name: 'Hradní sliz' },
  bazinny_sliz: { role: 'swarm', cost: 1, acts: [2, 3], name: 'Bažinný sliz' },
  divocak: { role: 'swarm', cost: 1, acts: [1], name: 'Zdivočelý kanec' },
  praktikant: { role: 'swarm', cost: 1, acts: [2, 3], name: 'Advokátní praktikant' },
  vlkodav: { role: 'swarm', cost: 1, acts: [2], name: 'Panský vlkodav' },
  buldok: { role: 'swarm', cost: 1, acts: [2, 3], name: 'C. k. buldok' },

  // Úderník (2 body)
  srpak: { role: 'striker', cost: 2, acts: [1, 2], name: 'Podroušený srpák' },
  kyjovec: { role: 'striker', cost: 2, acts: [1, 2], name: 'Hromotlucký kyjovec' },
  morak: { role: 'striker', cost: 2, acts: [1, 2], name: 'Morový nosič' },
  upiri_trpaslik: { role: 'striker', cost: 2, acts: [2, 3], name: 'Upíří trpaslík' },
  kostlivec_fabian: { role: 'striker', cost: 2, acts: [1, 2], name: 'Kostlivec Fabián' },
  zombie_hynek: { role: 'striker', cost: 2, acts: [1], name: 'Umrlec Hynek' },
  drevo: { role: 'striker', cost: 2, acts: [2], name: 'Oživlé poleno' },
  upirske_prase: { role: 'striker', cost: 2, acts: [3], name: 'Upíří prase' },

  // Předvoj / Štít (3 body)
  sedlak_stit: { role: 'tank', cost: 3, acts: [1, 2], name: 'Sedlák s víkem od sudu' },
  vratny_stit: { role: 'tank', cost: 3, acts: [2, 3], name: 'Hradní vrátný se závorou' },
  prase_mutant: { role: 'tank', cost: 3, acts: [1, 2], name: 'Zmutovaný vepř' },
  drab: { role: 'tank', cost: 3, acts: [2, 3], name: 'C. k. panský dráb' },
  halapartnik: { role: 'tank', cost: 3, acts: [2, 3], name: 'Strážný halapartník' },
  rytir_prizrak: { role: 'tank', cost: 3, acts: [3], name: 'Rytířský přízrak' },

  // Střelec / Dálkař (3 body)
  kluk_kamen: { role: 'sniper', cost: 3, acts: [1, 2], name: 'Uličník s prakem' },
  carodejnice: { role: 'sniper', cost: 3, acts: [2, 3], name: 'Bába kořenářka' },
  morovy_felcar: { role: 'sniper', cost: 3, acts: [2, 3], name: 'Morový felčar' },
  vrhac_nozu: { role: 'sniper', cost: 3, acts: [2, 3], name: 'Cirkusový vrhač nožů' },
  urednik: { role: 'sniper', cost: 3, acts: [2, 3], name: 'Hradní výběrčí daní' },
  ucetni_buffer: { role: 'sniper', cost: 3, acts: [3], name: 'Hlavní účetní von Zástava' },
  hrabenka_amalie: { role: 'sniper', cost: 3, acts: [2, 3], name: 'Hraběnka Amálie' },
  upirka_cilka: { role: 'sniper', cost: 3, acts: [2, 3], name: 'Upírka Cilka' },

  // Elitní drábi (5 bodů)
  elite_drab: { role: 'elite', cost: 5, acts: [1, 2, 3], name: 'Vrchní zámecký hejtman' },
  elite_urednik: { role: 'elite', cost: 5, acts: [2, 3], name: 'C. k. vrchní inkvizitor' }
};

export const ROOM_ORDERS = {
  podlaha: {
    id: 'podlaha',
    name: 'Ztrouchnivělá podlaha',
    shortName: 'Ztrouchnivělá podlaha',
    badge: '🪵',
    tacticalHint: '2–3 pole podlahy jsou načatá prkna. Pozor na propadnutí!',
    description: '2–3 náhodná pole začínají jako načatá prkna, další stoupnutí způsobí prolomení (4 DMG).'
  },
  cesnek: {
    id: 'cesnek',
    name: 'Česnekový průvan z kuchyní',
    shortName: 'Česnekový průvan',
    badge: '🧄',
    tacticalHint: 'Z panských kuchyní fouká česnek. Pravidelně zamořuje krajní pole.',
    description: 'Každé 3 tahy se u obou bran na 2 kola utvoří česnekový oblak (zraňuje upíry).'
  },
  zakaz_ustupu: {
    id: 'zakaz_ustupu',
    name: 'C. k. zákaz ústupu',
    shortName: 'Zákaz ústupu',
    badge: '📜',
    tacticalHint: 'Panský hejtman zakázal ústup. Krok vzad zvyšuje chladnutí o 1.',
    description: 'Krok směrem vzad (odvrácení od protivníka) prodlužuje chladnutí manévrů o 1.'
  },
  rimsa: {
    id: 'rimsa',
    name: 'Úzká hradební římsa',
    shortName: 'Hradební římsa',
    badge: '🧱',
    tacticalHint: 'Stísněný prostor (6 polí). Na obou krajích jsou bezedné propasti!',
    description: 'Bojiště je zkráceno na 6 polí a na obou krajích číhají propasti pro shození.'
  },
  kaple: {
    id: 'kaple',
    name: 'Posvěcená kaple',
    shortName: 'Posvěcená kaple',
    badge: '⛪',
    tacticalHint: 'Posvěcené místo s kropenkou. Nemrtví začínají se Zchlazením.',
    description: 'Uprostřed stojí kropenka se svěcenou vodou a nemrtví začínají se Zchlazením (−25 % k rozlícení).'
  },
  sero: {
    id: 'sero',
    name: 'Zámecké šero a průvan',
    shortName: 'Hradní šero',
    badge: '🕯️',
    tacticalHint: 'Snížená viditelnost omezuje střely na vzdálenost maximálně 3 pole.',
    description: 'Všechny dálkové střelecké útoky mají maximální dostřel zkrácen na 3 pole.'
  }
};

/**
 * Procedurální syntéza Bojiště (Chytrý systém komnat).
 * Sestavuje 1D arénu z rozpočtu Hrozby podle Taktického archetypu
 * se 3 bezpečnostními invarianty terénu, stropem startovní družiny a vlnami posil.
 */
export function synthesizeEncounter(opts = {}) {
  const {
    act = 1,
    threatRating = 2,
    archetype = 'swarm',
    isElite = false,
    isBoss = false,
    isTutorial = false,
    roomOrder = null,
    rng = null,
    curseLevel = 0,
    nodeId = 'proc_node'
  } = opts;

  if (isBoss) {
    if (act === 1) return ENCOUNTERS.act1_boss;
    if (act === 2) return ENCOUNTERS.act2_boss;
    return ENCOUNTERS.act3_boss;
  }

  if (isTutorial) {
    return ENCOUNTERS.tutorial_1;
  }

  const safeRng =
    rng && typeof rng.nextFloat === 'function'
      ? rng
      : {
          nextFloat: () => Math.random(),
          pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
          nextInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
        };

  // 1. Délka Bojiště
  let boardSize = 7;
  if (roomOrder?.id === 'rimsa') {
    boardSize = 6;
  } else if (archetype === 'snipers') {
    boardSize = safeRng.nextFloat() < 0.5 ? 8 : 9;
  } else if (isElite) {
    boardSize = 8;
  } else if (act === 1) {
    boardSize = safeRng.nextFloat() < 0.5 ? 7 : 8;
  } else {
    boardSize = safeRng.nextFloat() < 0.35 ? 7 : safeRng.nextFloat() < 0.7 ? 8 : 9;
  }

  // 2. Pozice a orientace Lovce
  let heroCell = 1;
  let heroFacing = 1;
  if (roomOrder?.id === 'rimsa') {
    heroCell = 2;
    heroFacing = 1;
  } else if (archetype === 'ambush') {
    heroCell = Math.floor(boardSize / 2);
    heroFacing = 1;
  } else if (boardSize >= 8) {
    heroCell = safeRng.nextFloat() < 0.5 ? 1 : 2;
  }

  // 3. Rozpočet hrozby (ADR-0015: Hrozba 1=3b, 2=5b, 3=7b, 4=9b, 5=12b)
  let budget = 5;
  if (threatRating <= 1) budget = 3;
  else if (threatRating === 2) budget = 5;
  else if (threatRating === 3) budget = 7;
  else if (threatRating === 4 || isElite) budget = 9;
  else budget = 12;

  if (curseLevel >= 2) {
    budget += Math.floor(curseLevel / 2);
  }

  // Filtrování dostupných nepřátel dle aktu
  const enemiesForAct = (role) => {
    return Object.entries(ENEMY_ROLE_REGISTRY)
      .filter(([id, def]) => def.role === role && def.acts.includes(act))
      .map(([id]) => id);
  };

  const swarms = enemiesForAct('swarm').length > 0 ? enemiesForAct('swarm') : ['netopyr', 'krysa_piskota'];
  const strikers = enemiesForAct('striker').length > 0 ? enemiesForAct('striker') : ['srpak', 'kyjovec'];
  const tanks = enemiesForAct('tank').length > 0 ? enemiesForAct('tank') : ['sedlak_stit', 'drab'];
  const snipers = enemiesForAct('sniper').length > 0 ? enemiesForAct('sniper') : ['kluk_kamen', 'morovy_felcar'];
  const elites = enemiesForAct('elite').length > 0 ? enemiesForAct('elite') : ['elite_drab'];

  const pickEnemy = (pool) => pool[Math.floor(safeRng.nextFloat() * pool.length)] || pool[0];

  // 4. Skladba startovní družiny (strop: 2 v Aktu 1, 3 v Aktu 2-3)
  const initialSpecs = [];
  const startCap = isElite ? 2 : (act === 1 ? 2 : 3);
  let spentBudget = 0;

  if (isElite) {
    const eliteId = pickEnemy(elites);
    const supportId = pickEnemy(tanks.length > 0 ? tanks : strikers);
    initialSpecs.push({ enemyId: supportId, role: 'tank', cost: 3 });
    initialSpecs.push({ enemyId: eliteId, role: 'elite', cost: 5 });
    spentBudget += 8;
  } else if (archetype === 'shieldwall') {
    const tankId = pickEnemy(tanks);
    const sniperId = pickEnemy(snipers.length > 0 ? snipers : strikers);
    initialSpecs.push({ enemyId: tankId, role: 'tank', cost: 3 });
    initialSpecs.push({ enemyId: sniperId, role: 'sniper', cost: 3 });
    spentBudget += 6;
  } else if (archetype === 'snipers') {
    const frontId = pickEnemy(strikers.length > 0 ? strikers : swarms);
    const sniperId = pickEnemy(snipers);
    initialSpecs.push({ enemyId: frontId, role: 'striker', cost: 2 });
    initialSpecs.push({ enemyId: sniperId, role: 'sniper', cost: 3 });
    spentBudget += 5;
  } else if (archetype === 'brute_force') {
    const tankId = pickEnemy(tanks.length > 0 ? tanks : strikers);
    initialSpecs.push({ enemyId: tankId, role: 'tank', cost: 3 });
    spentBudget += 3;
    if (budget >= 5 && startCap >= 2) {
      const strikerId = pickEnemy(strikers);
      initialSpecs.push({ enemyId: strikerId, role: 'striker', cost: 2 });
      spentBudget += 2;
    }
  } else if (archetype === 'ambush') {
    const rearId = pickEnemy(strikers.length > 0 ? strikers : swarms);
    const frontId = pickEnemy(strikers.length > 0 ? strikers : tanks);
    initialSpecs.push({ enemyId: rearId, role: 'striker', cost: 2, isRear: true });
    initialSpecs.push({ enemyId: frontId, role: 'striker', cost: 2, isRear: false });
    spentBudget += 4;
  } else if (archetype === 'disruption') {
    const strikerId = pickEnemy(strikers);
    const swarmId = pickEnemy(swarms);
    initialSpecs.push({ enemyId: strikerId, role: 'striker', cost: 2 });
    initialSpecs.push({ enemyId: swarmId, role: 'swarm', cost: 1 });
    spentBudget += 3;
  } else {
    // Standard / Swarm
    const swarm1 = pickEnemy(swarms);
    const swarm2 = pickEnemy(swarms);
    initialSpecs.push({ enemyId: swarm1, role: 'swarm', cost: 1 });
    initialSpecs.push({ enemyId: swarm2, role: 'swarm', cost: 1 });
    spentBudget += 2;
    if (budget >= 5 && startCap >= 3) {
      const strikerId = pickEnemy(strikers);
      initialSpecs.push({ enemyId: strikerId, role: 'striker', cost: 2 });
      spentBudget += 2;
    }
  }

  // 5. Rozmístění startovních nepřátel
  const placedEnemies = [];
  const occupiedCells = new Set([heroCell]);

  if (archetype === 'ambush') {
    const rearCell = Math.max(0, heroCell - 2);
    const frontCell = Math.min(boardSize - 1, heroCell + 2);
    placedEnemies.push({
      enemyId: initialSpecs[0].enemyId,
      cell: rearCell,
      facing: 1
    });
    occupiedCells.add(rearCell);
    placedEnemies.push({
      enemyId: initialSpecs[1].enemyId,
      cell: frontCell,
      facing: -1
    });
    occupiedCells.add(frontCell);
  } else {
    let curCell = Math.min(boardSize - 1, heroCell + 2);
    if (roomOrder?.id === 'rimsa') {
      curCell = Math.max(curCell, 3);
    }

    initialSpecs.forEach((eSpec, idx) => {
      let cell = curCell + idx;
      if (cell >= boardSize) cell = boardSize - 1;
      while (occupiedCells.has(cell) && cell > heroCell + 1) {
        cell--;
      }
      if (occupiedCells.has(cell)) {
        cell = curCell + idx;
        while (occupiedCells.has(cell) && cell < boardSize - 1) {
          cell++;
        }
      }
      occupiedCells.add(cell);
      placedEnemies.push({
        enemyId: eSpec.enemyId,
        cell,
        facing: -1
      });
    });
  }

  // 6. Rozvržení vln posil ze zbytku rozpočtu
  const reinforcements = [];
  let remainingBudget = Math.max(0, budget - spentBudget);
  let waveIdx = 0;

  while (remainingBudget > 0 && waveIdx < 2) {
    waveIdx++;
    const waveDelay = waveIdx === 1 ? 4 : 7;
    const gateCell = waveIdx === 1 ? boardSize - 1 : (archetype === 'ambush' ? 0 : boardSize - 1);

    let reinfPool = swarms;
    let cost = 1;
    if (remainingBudget >= 3 && safeRng.nextFloat() < 0.5) {
      reinfPool = snipers.length > 0 ? snipers : tanks;
      cost = 3;
    } else if (remainingBudget >= 2) {
      reinfPool = strikers;
      cost = 2;
    }

    const reinfEnemyId = pickEnemy(reinfPool);
    reinforcements.push({
      turnDelay: waveDelay,
      gateCell,
      enemyId: reinfEnemyId,
      candidatePool: reinfPool
    });
    remainingBudget -= cost;
  }

  // 7. Terén a rekvizity se 3 bezpečnostními invarianty
  const props = [];
  const terrain = [];

  // Invariant 1: heroCell a heroCell +- 1 NIKDY nemají propast ani kůly
  const safeCells = new Set([heroCell, heroCell - 1, heroCell + 1]);

  // Aplikace Panského rozkazu na terén
  if (roomOrder?.id === 'rimsa') {
    terrain.push({ type: 'pit', cell: 0 });
    terrain.push({ type: 'pit', cell: 5 });
    occupiedCells.add(0);
    occupiedCells.add(5);
  } else if (roomOrder?.id === 'kaple') {
    const midCell = Math.floor(boardSize / 2);
    if (!occupiedCells.has(midCell) && !safeCells.has(midCell)) {
      props.push({ type: 'holy_font', cell: midCell });
      occupiedCells.add(midCell);
    }
  } else if (roomOrder?.id === 'podlaha') {
    const validCells = [];
    for (let c = 0; c < boardSize; c++) {
      if (!occupiedCells.has(c) && !safeCells.has(c)) {
        validCells.push(c);
      }
    }
    for (let i = 0; i < Math.min(2, validCells.length); i++) {
      terrain.push({ type: 'plank_cracked', cell: validCells[i] });
    }
  }

  // Invariant 2: Limit hustoty překážek a pastí max 25 % délky bojiště
  const maxHazardsAndProps = Math.floor(boardSize * 0.25);
  let currentHazardsProps = props.length + terrain.length;

  if (currentHazardsProps < maxHazardsAndProps && !roomOrder) {
    if (archetype === 'shieldwall' || archetype === 'brute_force') {
      const candidateCell = heroCell + 1;
      if (!occupiedCells.has(candidateCell)) {
        props.push({ type: 'barrel', cell: candidateCell });
        occupiedCells.add(candidateCell);
        currentHazardsProps++;
      }
    } else if (archetype === 'disruption') {
      const spikeCell = boardSize - 2;
      if (!occupiedCells.has(spikeCell) && !safeCells.has(spikeCell)) {
        terrain.push({ type: 'spikes', cell: spikeCell });
        occupiedCells.add(spikeCell);
        currentHazardsProps++;
      }
    } else if (archetype === 'snipers') {
      const mirrorCell = boardSize - 1;
      if (!occupiedCells.has(mirrorCell) && !safeCells.has(mirrorCell)) {
        props.push({ type: 'mirror', cell: mirrorCell });
        occupiedCells.add(mirrorCell);
        currentHazardsProps++;
      }
    }
  }

  // 8. Tématické názvy a hlášky
  const titlesByArch = {
    shieldwall: ['Štítová hradba v průchodu', 'Zatarasená hradní brána', 'Hlídka s víky od sudů'],
    snipers: ['Střelecká křížová palba', 'Bába kořenářka a střelci', 'Zámecká střelnice'],
    swarm: ['Krysí a netopýří rej', 'Noční hejno ze stok', 'Smečka panských vlkodavů'],
    brute_force: ['Surový nápřah chasníků', 'Zdivočelý vepř a kyjovec', 'Drtivá síla drábů'],
    disruption: ['Zákeřná léčka u propasti', 'Pasti a naostřené kůly', 'Podzemní přepad'],
    ambush: ['Obklíčení ze zálohy', 'Noční léčka z obou stran', 'Křížový úder hlídek'],
    elite: ['C. k. panská inkvizice', 'Vrchní hejtman se stráží', 'Inkviziční panský soud']
  };

  const poolTitles = titlesByArch[archetype] || titlesByArch.swarm;
  const chosenTitle = poolTitles[Math.floor(safeRng.nextFloat() * poolTitles.length)];

  const archDef = ARCHETYPES[archetype?.toUpperCase()] || ARCHETYPES.SWARM;
  const baseHint = archDef?.hint || 'Taktický střet s hlídkou.';

  const goldReward = (isElite ? 32 : 16) + threatRating * 2;

  return {
    id: nodeId,
    act,
    name: chosenTitle,
    backgroundTheme: act === 1 ? 'village_night' : act === 2 ? 'castle_corridor' : 'cellar',
    threatRating,
    archetype,
    archetypeName: archDef?.name || 'Šarvátka',
    tacticalHint: `${baseHint}${roomOrder ? ' [' + roomOrder.name + ': ' + roomOrder.tacticalHint + ']' : ''}`,
    boardSize,
    heroCell,
    heroFacing,
    initialEnemies: placedEnemies,
    props,
    terrain,
    reinforcements,
    roomOrder,
    goldReward
  };
}
