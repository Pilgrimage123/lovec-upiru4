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
      { type: 'spikes', cell: 1 }
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
 * Intelligent encounter query and selector for the smart stage generation system.
 * Filters by act and constraints, then scores candidates using threat budget and synergy archetypes.
 */
export function queryEncounters(opts = {}) {
  const {
    act = 1,
    isElite = false,
    isBoss = false,
    threatTarget = 2,
    preferredArchetype = null,
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
    return true;
  });

  if (pool.length === 0) {
    // Fallback: relax elite requirement if none found
    pool = allList.filter((e) => e.act === act && !e.isBoss);
  }

  // 2. Filter out already used encounters in this run if we have enough variety
  const unusedPool = pool.filter((e) => !excludeIds.includes(e.id));
  const candidatePool = unusedPool.length > 0 ? unusedPool : pool;

  // 3. Score candidates based on threat budget distance and archetype match
  const scored = candidatePool.map((enc) => {
    let score = 10;
    const diff = Math.abs((enc.threatRating || 2) - threatTarget);
    score -= diff * 3; // Closer to target threat gives higher score

    if (preferredArchetype && enc.archetype === preferredArchetype) {
      score += 4; // Preference bonus for route synergy
    }

    return { enc, score: Math.max(1, score) };
  });

  // 4. Weighted selection using RNG
  if (rng && typeof rng.nextFloat === 'function') {
    const totalWeight = scored.reduce((sum, item) => sum + item.score, 0);
    let r = rng.nextFloat() * totalWeight;
    for (const item of scored) {
      r -= item.score;
      if (r <= 0) return item.enc;
    }
    return scored[scored.length - 1]?.enc || pool[0];
  }

  // Fallback to highest scored or first
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.enc || pool[0];
}
