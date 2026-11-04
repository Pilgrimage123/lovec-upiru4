// @ts-nocheck
export const TILE_TAGS = {
  garlic: { id: 'garlic', name: 'Česnek', icon: '🧄', color: '#84cc16' },
  holy: { id: 'holy', name: 'Svěcená', icon: '✝️', color: '#38bdf8' },
  brawl: { id: 'brawl', name: 'Hospoda', icon: '🍺', color: '#f59e0b' },
  craft: { id: 'craft', name: 'Řemeslo', icon: '⚙️', color: '#a1a1aa' },
  movement: { id: 'movement', name: 'Pohyb', icon: '🏃', color: '#10b981' },
  sokol: { id: 'sokol', name: 'Sokol', icon: '🦅', color: '#e11d48' },
  explosive: { id: 'explosive', name: 'Třaskavina', icon: '💣', color: '#ea580c' }
};

export const HERO_TILES = {
  falcon_claw: {
    id: 'falcon_claw',
    name: 'Sokolí spár',
    icon: 'tile.falcon_claw',
    type: 'attack',
    tags: ['sokol', 'brawl'],
    dmg: 4,
    cooldown: 2,
    quick: false,
    pattern: [
      { offset: 1, dmg: 4, effects: [{ type: 'pull' }] },
      { offset: 2, dmg: 4, effects: [{ type: 'pull' }] }
    ],
    resonance: null,
    description: 'Dosah 1–2 pole dopředu: 4 DMG (+2 DMG, pokud je cíl člověk) a přitáhne cíl o 1 pole k lovci. Chladnutí 2.',
    flavor: '„Pevný sokolský úchop vytáhne každého hříšníka na světlo boží!“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Ocelový sokolí spár+',
        dmg: 5,
        cooldown: 2,
        pattern: [
          { offset: 1, dmg: 5, effects: [{ type: 'pull' }] },
          { offset: 2, dmg: 5, effects: [{ type: 'pull' }] }
        ],
        description: 'Dosah 1–2 pole: 5 DMG (+2 DMG proti lidem = 7 DMG) a přitáhne o 1 pole.'
      },
      {
        level: 2,
        name: 'Mistrovský sokolí spár++',
        dmg: 6,
        cooldown: 2,
        pattern: [
          { offset: 1, dmg: 6, effects: [{ type: 'pull' }, { type: 'bleed', amount: 2 }] },
          { offset: 2, dmg: 6, effects: [{ type: 'pull' }, { type: 'bleed', amount: 2 }] }
        ],
        description: 'Dosah 1–2 pole: 6 DMG (+2 DMG proti lidem = 8 DMG), přitáhne o 1 pole a udělí Krvácení (2).'
      }
    ]
  },
  garlic_grenade: {
    id: 'garlic_grenade',
    name: 'Česnekový granát',
    icon: 'tile.garlic_grenade',
    type: 'ranged',
    tags: ['garlic', 'explosive'],
    dmg: 0,
    cooldown: 3,
    quick: false,
    isLobbed: true,
    lobDistance: 3,
    canFinishVampires: true,
    pattern: [],
    resonance: null,
    description: 'Přistane o 3 pole dál (zarazí se o zeď). V dosahu 1 od dopadu vytvoří Česnekový oblak (2 kola), který zasažené zmate (❓). Kdo v něm začíná tah, utrpí 1 DMG (upíři 2 DMG). Může dorazit upíra! Chladnutí 3.',
    flavor: '„Domácí česneková třaskavina v pivní lahvi. Upíři po ní lapají po dechu.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Těžký česnekový granát+',
        dmg: 0,
        cooldown: 3,
        isLobbed: true,
        lobDistance: 3,
        canFinishVampires: true,
        cloudDuration: 3,
        description: 'Česnekový oblak má prodloužené trvání na 3 kola a okamžitě zmate zasažené (❓).'
      },
      {
        level: 2,
        name: 'Tříštivý česnekový granát++',
        dmg: 2,
        cooldown: 2,
        isLobbed: true,
        lobDistance: 3,
        canFinishVampires: true,
        cloudDuration: 3,
        description: 'Chladnutí 2, přímý výbuch za 2 DMG, oblak na 3 kola se Zmatením. Doráží upíry!'
      }
    ]
  },
  skok_pres_kozu: {
    id: 'skok_pres_kozu',
    name: 'Skok přes kozu',
    icon: 'tile.skok_pres_kozu',
    type: 'move',
    tags: ['sokol', 'brawl', 'garlic'],
    dmg: 0,
    cooldown: 2,
    quick: false,
    leapDistance: 2,
    leaveGarlicCloudRadius1: true,
    cloudDuration: 2,
    pattern: [{ offset: 2, dmg: 0, isMoveTarget: true, effects: [] }],
    resonance: {
      nextTileCdReduction: 1,
      description: 'Rezonance: další destička ve frontě má po odehrání CD −1.'
    },
    description: 'Sokolský přeskok o 2 pole vpřed (přeskočí překážku i nepřítele na poli 1, nepříteli se nic nestane). Na výchozím poli a v okolí (±1 pole) zanechá Česnekový oblak (2 kola, 1 DMG za tah, upíři 2 DMG, bez zmatení). Chladnutí 2.',
    flavor: '„Pevný odraz z podlahy a ladný let! Sokolský tělocvik v praxi!“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Sokolský skok přes kozu+',
        dmg: 0,
        cooldown: 2,
        leapDistance: 2,
        leaveGarlicCloudRadius1: true,
        cloudDuration: 2,
        resonance: {
          nextTileCdReduction: 2,
          description: 'Rezonance: další destička ve frontě má CD −2.'
        },
        description: 'Přeskok o 2 pole vpřed, 3-polový Česnekový oblak a Rezonance sníží CD další destičky o 2.'
      },
      {
        level: 2,
        name: 'Mistrovský skok s obratem++',
        dmg: 0,
        cooldown: 1,
        leapDistance: 2,
        leaveGarlicCloudRadius1: true,
        cloudDuration: 3,
        resonance: {
          nextTileCdReduction: 2,
          description: 'Rezonance: další destička ve frontě má CD −2.'
        },
        description: 'Chladnutí 1: ladný sokolský skok přes 2 pole a Česnekový oblak na 3 kola.'
      }
    ]
  },
  oak_stake: {
    id: 'oak_stake',
    name: 'Dubový kolík',
    icon: 'tile.oak_stake',
    type: 'attack',
    tags: ['brawl'],
    dmg: 4,
    cooldown: 3,
    quick: false,
    pattern: [{ offset: 1, dmg: 4, effects: [] }],
    resonance: null,
    description: 'Poctivý dubový kolík ořezaný kapesní kudlou. Dosah 1 pole vpřed za 4 DMG.',
    flavor: '„Na upíra jedině dub, smrk se mu v žebrech tříští!“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Okovaný dubový kolík+',
        dmg: 6,
        cooldown: 3,
        pattern: [{ offset: 1, dmg: 6, effects: [] }],
        description: 'Vylepšená špice: 6 DMG na 1 pole vpřed.'
      },
      {
        level: 2,
        name: 'Svěcený dubový kolík++',
        dmg: 6,
        cooldown: 2,
        pattern: [{ offset: 1, dmg: 6, effects: [{ type: 'bleed', amount: 2 }] }],
        description: 'Mistrovský kolík (CD 2): 6 DMG na 1 pole vpřed + Krvácení (2).'
      }
    ]
  },
  garlic_belch: {
    id: 'garlic_belch',
    name: 'Česnekový pšouk',
    icon: 'tile.garlic_belch',
    type: 'attack',
    tags: ['garlic'],
    dmg: 2,
    cooldown: 4,
    quick: false,
    pattern: [{ offset: 1, dmg: 2, effects: [{ type: 'push', distance: 2 }] }],
    resonance: null,
    description: '2 DMG na 1 pole vpřed a prudce odhodí cíl o 2 pole vzad (Push 2).',
    flavor: '„Topinka se šesti stroužky moravského paličáku dělá divy.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Česnekový vichr+',
        dmg: 4,
        cooldown: 4,
        pattern: [{ offset: 1, dmg: 4, effects: [{ type: 'push', distance: 3 }] }],
        description: '4 DMG na 1 pole vpřed a Push o 3 pole vzad.'
      },
      {
        level: 2,
        name: 'Hospodský uragán++',
        dmg: 4,
        cooldown: 3,
        pattern: [{ offset: 1, dmg: 4, effects: [{ type: 'push', distance: 3 }, { type: 'spawn_garlic_target' }] }],
        description: 'CD 3, 4 DMG, Push o 3 pole a zanechá Česnekový oblak.'
      }
    ]
  },
  holy_syringe: {
    id: 'holy_syringe',
    name: 'Hasičská stříkačka se svěcenou vodou',
    icon: 'tile.holy_syringe',
    type: 'ranged',
    tags: ['holy'],
    dmg: 2,
    cooldown: 4,
    quick: false,
    projectileRange: 3,
    pattern: [
      { offset: 1, dmg: 2, projectile: true, effects: [] },
      { offset: 2, dmg: 2, projectile: true, effects: [] },
      { offset: 3, dmg: 2, projectile: true, effects: [] }
    ],
    resonance: null,
    description: 'Střela na dosah až 3 pole (zastaví se o první cíl) za 2 DMG.',
    flavor: '„Půjčeno ze zbrojnice SDH Horní Děs, posvěceno panem farářem.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Mosazná stříkačka+',
        dmg: 4,
        cooldown: 4,
        projectileRange: 4,
        pattern: [
          { offset: 1, dmg: 4, projectile: true, effects: [] },
          { offset: 2, dmg: 4, projectile: true, effects: [] },
          { offset: 3, dmg: 4, projectile: true, effects: [] },
          { offset: 4, dmg: 4, projectile: true, effects: [] }
        ],
        description: 'Dosah 4 pole, 4 DMG prvnímu cíli.'
      },
      {
        level: 2,
        name: 'Tlaková stříkačka++',
        dmg: 4,
        cooldown: 3,
        projectileRange: 4,
        pattern: [
          { offset: 1, dmg: 4, projectile: true, effects: [{ type: 'flip_target' }, { type: 'push', distance: 1 }] },
          { offset: 2, dmg: 4, projectile: true, effects: [{ type: 'flip_target' }, { type: 'push', distance: 1 }] },
          { offset: 3, dmg: 4, projectile: true, effects: [{ type: 'flip_target' }, { type: 'push', distance: 1 }] },
          { offset: 4, dmg: 4, projectile: true, effects: [{ type: 'flip_target' }, { type: 'push', distance: 1 }] }
        ],
        description: 'CD 3, dosah 4 pole, 4 DMG, otočí cíl čelem vzad a odhodí o 1 pole.'
      }
    ]
  },
  belly_vault: {
    id: 'belly_vault',
    aliasOf: 'skok_pres_kozu',
    name: 'Hospodský přemet přes pupík',
    icon: 'tile.belly_vault',
    type: 'move',
    tags: ['brawl', 'garlic'],
    dmg: 0,
    cooldown: 2,
    quick: false,
    leapDistance: 2,
    leaveGarlicCloud: true,
    pattern: [{ offset: 2, dmg: 0, isMoveTarget: true, effects: [] }],
    resonance: {
      nextTileCdReduction: 1,
      description: 'Rezonance: další destička ve frontě má po odehrání CD −1.'
    },
    description: 'Přeskok o 2 pole vpřed přes entity (je-li obsazeno, přistane na nejbližším volném poli). Zanechá Česnekový oblak (2 tahy). Rezonance: další destička CD −1.',
    flavor: '„Sice v kříži křupne, ale upír čumí jak tele na nová vrata!“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Sokolský přemet přes pupík+',
        dmg: 0,
        cooldown: 2,
        leapDistance: 2,
        leaveGarlicCloud: true,
        resonance: {
          nextTileCdReduction: 2,
          description: 'Rezonance: další destička ve frontě má CD −2.'
        },
        description: 'Přeskok o 2 pole vpřed, Česnekový oblak a Rezonance sníží CD další destičky o 2.'
      },
      {
        level: 2,
        name: 'Mistrovský přemet s výkopem++',
        dmg: 0,
        cooldown: 1,
        leapDistance: 2,
        leaveGarlicCloud: true,
        selfEffect: { type: 'empower', amount: 2 },
        resonance: {
          nextTileCdReduction: 2,
          description: 'Rezonance: další destička má CD −2 + získáš Zesílení (+2 DMG).'
        },
        description: 'CD 1! Přeskok o 2 pole, Česnekový oblak, Zesílení (+2 DMG) a Rezonance CD −2.'
      }
    ]
  },
  rosary_slap: {
    id: 'rosary_slap',
    name: 'Facka růžencem',
    icon: 'tile.rosary_slap',
    type: 'attack',
    tags: ['holy'],
    dmg: 2,
    cooldown: 2,
    quick: false,
    selfFlipAfter: true,
    pattern: [{ offset: -1, dmg: 2, effects: [] }],
    resonance: null,
    description: 'Švihne 1 pole ZA ZÁDY za 2 DMG a okamžitě otočí lovce čelem vzad.',
    flavor: '„Kdo mi to funí za krk?! Tady máš desátek přes dršku!“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Dvojitá facka růžencem+',
        dmg: 4,
        cooldown: 2,
        selfFlipAfter: true,
        pattern: [{ offset: -1, dmg: 4, effects: [] }],
        description: '4 DMG za zády a otočí lovce čelem vzad.'
      },
      {
        level: 2,
        name: 'Kajícná facka růžencem++',
        dmg: 4,
        cooldown: 1,
        selfFlipAfter: true,
        pattern: [{ offset: -1, dmg: 4, effects: [{ type: 'confusion', amount: 1 }] }],
        description: 'CD 1, 4 DMG za zády + Zmatení a otočí lovce.'
      }
    ]
  },
  funeral_hook: {
    id: 'funeral_hook',
    name: 'Půjčený pohřební hák',
    icon: 'tile.funeral_hook',
    type: 'ranged',
    tags: ['craft'],
    dmg: 2,
    cooldown: 4,
    quick: false,
    projectileRange: 3,
    pattern: [
      { offset: 1, dmg: 2, projectile: true, effects: [{ type: 'pull' }] },
      { offset: 2, dmg: 2, projectile: true, effects: [{ type: 'pull' }] },
      { offset: 3, dmg: 2, projectile: true, effects: [{ type: 'pull' }] }
    ],
    resonance: null,
    description: 'Dosah až 3 pole: první zasaženou entitu zraní za 2 DMG a přitáhne těsně před lovce (Pull).',
    flavor: '„Hrobník říkal, ať mu ho vrátím do pátku. Pojď sem, holoubku!“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Kovaný pohřební hák+',
        dmg: 4,
        cooldown: 3,
        projectileRange: 4,
        pattern: [
          { offset: 1, dmg: 4, projectile: true, effects: [{ type: 'pull' }, { type: 'bleed', amount: 2 }] },
          { offset: 2, dmg: 4, projectile: true, effects: [{ type: 'pull' }, { type: 'bleed', amount: 2 }] },
          { offset: 3, dmg: 4, projectile: true, effects: [{ type: 'pull' }, { type: 'bleed', amount: 2 }] },
          { offset: 4, dmg: 4, projectile: true, effects: [{ type: 'pull' }, { type: 'bleed', amount: 2 }] }
        ],
        description: 'CD 3, dosah 4 pole, 4 DMG + Pull + Krvácení.'
      },
      {
        level: 2,
        name: 'Řeznický hák na korhele++',
        dmg: 6,
        cooldown: 3,
        projectileRange: 4,
        pattern: [
          { offset: 1, dmg: 6, projectile: true, effects: [{ type: 'pull' }, { type: 'bleed', amount: 3 }] },
          { offset: 2, dmg: 6, projectile: true, effects: [{ type: 'pull' }, { type: 'bleed', amount: 3 }] },
          { offset: 3, dmg: 6, projectile: true, effects: [{ type: 'pull' }, { type: 'bleed', amount: 3 }] },
          { offset: 4, dmg: 6, projectile: true, effects: [{ type: 'pull' }, { type: 'bleed', amount: 3 }] }
        ],
        description: 'Dosah 4 pole, 6 DMG + Pull + silné Krvácení (3).'
      }
    ]
  },
  manhole_shield: {
    id: 'manhole_shield',
    name: 'Štít z kanálového poklopu',
    icon: 'tile.manhole_shield',
    type: 'defense',
    tags: ['craft', 'brawl'],
    dmg: 0,
    cooldown: 4,
    quick: false,
    selfEffect: { type: 'shield', amount: 2 },
    pattern: [{ offset: 1, dmg: 0, effects: [{ type: 'push', distance: 1 }] }],
    resonance: null,
    description: 'Dá lovci Štít (vykryje 2 body zranění) a odstrčí nepřítele přímo před ním o 1 pole.',
    flavor: '„Litinová klasika z roku 1889. Ani zuby hraběte skrz to neprojdou.“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Litinový poklop+',
        dmg: 2,
        cooldown: 3,
        selfEffect: { type: 'shield', amount: 2 },
        pattern: [{ offset: 1, dmg: 2, effects: [{ type: 'push', distance: 1 }] }],
        description: 'CD 3, 2 Štít + 2 DMG a Push o 1 pole vzad.'
      },
      {
        level: 2,
        name: 'Pancéřový poklop vodáren++',
        dmg: 4,
        cooldown: 3,
        selfEffect: { type: 'shield', amount: 4 },
        pattern: [{ offset: 1, dmg: 4, effects: [{ type: 'push', distance: 2 }] }],
        description: '4 Štít + 4 DMG a Push o 2 pole vzad.'
      }
    ]
  },
  sacristy_bell: {
    id: 'sacristy_bell',
    name: 'Kostelní zvonec na ministranty',
    icon: 'tile.sacristy_bell',
    type: 'control',
    tags: ['holy'],
    dmg: 2,
    cooldown: 5,
    quick: false,
    pattern: [
      { offset: 1, dmg: 2, effects: [{ type: 'confusion', amount: 1 }] },
      { offset: 2, dmg: 2, effects: [{ type: 'confusion', amount: 1 }] }
    ],
    resonance: null,
    description: 'Zazvoní na 2 pole vpřed za 2 DMG a všem zasaženým způsobí Zmatení (❓) na 1 tah.',
    flavor: '„Po třech pivech z toho brní uši i mrtvému.“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Mosazný zvon z kaple+',
        dmg: 2,
        cooldown: 4,
        pattern: [
          { offset: 1, dmg: 2, effects: [{ type: 'confusion', amount: 1 }] },
          { offset: 2, dmg: 2, effects: [{ type: 'confusion', amount: 1 }] }
        ],
        description: 'CD 4, zasáhne 2 pole vpřed za 2 DMG + Zmatení (❓).'
      },
      {
        level: 2,
        name: 'Polední zvon Hromburác++',
        dmg: 4,
        cooldown: 4,
        pattern: [
          { offset: 1, dmg: 4, effects: [{ type: 'confusion', amount: 1 }] },
          { offset: 2, dmg: 4, effects: [{ type: 'confusion', amount: 1 }] }
        ],
        description: 'CD 4, zasáhne 2 pole vpřed za 4 DMG + Zmatení (❓).'
      }
    ]
  },
  wood_axe: {
    id: 'wood_axe',
    name: 'Sekera na polena',
    icon: 'tile.wood_axe',
    type: 'attack',
    tags: ['brawl'],
    dmg: 4,
    cooldown: 4,
    quick: false,
    pattern: [
      { offset: 1, dmg: 4, effects: [{ type: 'bleed', amount: 2 }] },
      { offset: -1, dmg: 4, effects: [{ type: 'bleed', amount: 2 }] }
    ],
    resonance: null,
    description: 'Rozmáchne se kolem dokola a zasáhne OBA sousedy (1 pole vpřed i 1 pole vzad) za 4 DMG + Krvácení.',
    flavor: '„Tuhle mi půjčil švagr, když jsme poráželi kůlnu.“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Nabroušená sekera+',
        dmg: 6,
        cooldown: 4,
        pattern: [
          { offset: 1, dmg: 6, effects: [{ type: 'bleed', amount: 2 }] },
          { offset: -1, dmg: 6, effects: [{ type: 'bleed', amount: 2 }] }
        ],
        description: '6 DMG do obou sousedních polí + Krvácení.'
      },
      {
        level: 2,
        name: 'Dřevorubecký obouručák++',
        dmg: 6,
        cooldown: 3,
        pattern: [
          { offset: 1, dmg: 6, effects: [{ type: 'bleed', amount: 2 }, { type: 'push', distance: 1 }] },
          { offset: -1, dmg: 6, effects: [{ type: 'bleed', amount: 2 }, { type: 'push', distance: 1 }] }
        ],
        description: 'CD 3, 6 DMG na obě strany + Krvácení + odhození o 1 pole.'
      }
    ]
  },
  plank_stomp: {
    id: 'plank_stomp',
    name: 'Dupnutí na prkno',
    icon: 'tile.plank_stomp',
    type: 'control',
    tags: ['brawl'],
    dmg: 2,
    cooldown: 3,
    quick: false,
    pattern: [
      { offset: 1, dmg: 2, effects: [{ type: 'spawn_spikes' }] },
      { offset: 2, dmg: 2, effects: [{ type: 'push', distance: 1 }] }
    ],
    resonance: null,
    description: 'Zasáhne 2 pole vpřed za 2 DMG: na 1. poli vyrazí z podlahy Naostřené kůly a na 2. poli cíl odhodí o 1 pole.',
    flavor: '„Tady c. k. stavební hejtmanství šetřilo na kovaných hřebech!“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Těžká bota na prkno+',
        dmg: 4,
        cooldown: 3,
        pattern: [
          { offset: 1, dmg: 4, effects: [{ type: 'spawn_spikes' }] },
          { offset: 2, dmg: 4, effects: [{ type: 'push', distance: 1 }] }
        ],
        description: '4 DMG na 2 pole vpřed, vytvoří Kůly na 1. poli a odhodí 2. pole.'
      },
      {
        level: 2,
        name: 'Okovaná bota s hřeby++',
        dmg: 4,
        cooldown: 2,
        pattern: [
          { offset: 1, dmg: 4, effects: [{ type: 'spawn_spikes' }] },
          { offset: 2, dmg: 4, effects: [{ type: 'spawn_spikes' }, { type: 'push', distance: 1 }] }
        ],
        description: 'CD 2, 4 DMG a vyrazí Kůly na OBOU polích před lovcem!'
      }
    ]
  },
  funeral_shroud: {
    id: 'funeral_shroud',
    name: 'Pohřební plachta',
    icon: 'tile.funeral_shroud',
    type: 'utility',
    tags: ['holy'],
    dmg: 0,
    cooldown: 3,
    quick: false,
    selfEffect: { type: 'empower', amount: 2 },
    pattern: [{ offset: 1, dmg: 0, effects: [{ type: 'confusion', amount: 1 }, { type: 'flip_target' }] }],
    resonance: {
      nextTileCdReduction: 1,
      description: 'Rezonance: další destička ve frontě má CD −1.'
    },
    description: 'Hodí plachtu na souseda vpřed (Zmatení + otočení) a lovec získá Zesílení (+2 DMG).',
    flavor: '„Kukuč! Kdo zhasnul v rakvi?!“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Vyšívaná pohřební plachta+',
        dmg: 2,
        cooldown: 3,
        quick: false,
        selfEffect: { type: 'empower', amount: 2 },
        pattern: [{ offset: 1, dmg: 2, effects: [{ type: 'confusion', amount: 1 }, { type: 'flip_target' }] }],
        resonance: {
          nextTileCdReduction: 1,
          description: 'Rezonance: další destička má CD −1.'
        },
        description: '2 DMG, Zmatení, otočení a Zesílení.'
      },
      {
        level: 2,
        name: 'Olověná pohřební plachta++',
        dmg: 2,
        cooldown: 2,
        quick: false,
        selfEffect: { type: 'empower', amount: 2 },
        pattern: [{ offset: 1, dmg: 2, effects: [{ type: 'confusion', amount: 1 }, { type: 'flip_target' }] }],
        resonance: {
          nextTileCdReduction: 1,
          description: 'Rezonance: další destička má CD −1.'
        },
        description: 'CD 2, 2 DMG, Zmatení (❓), otočení a Zesílení.'
      }
    ]
  },
  silver_crucifix_beam: {
    id: 'silver_crucifix_beam',
    name: 'Blesk z posvěceného krucifixu',
    icon: 'tile.silver_crucifix_beam',
    type: 'ranged',
    tags: ['holy'],
    dmg: 4,
    cooldown: 5,
    quick: false,
    pattern: [
      { offset: 1, dmg: 4, effects: [] },
      { offset: 2, dmg: 4, effects: [] },
      { offset: 3, dmg: 4, effects: [] }
    ],
    resonance: null,
    description: 'Průrazný paprsek přes 3 pole vpřed – zasáhne VŠECHNY nepřátele v řadě za 4 DMG!',
    flavor: '„Zasviť jim na cestu do pekla, pane faráři!“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Zlatý krucifix+',
        dmg: 6,
        cooldown: 5,
        pattern: [
          { offset: 1, dmg: 6, effects: [] },
          { offset: 2, dmg: 6, effects: [] },
          { offset: 3, dmg: 6, effects: [] }
        ],
        description: 'Průrazný paprsek na 3 pole za 6 DMG všem v řadě.'
      },
      {
        level: 2,
        name: 'Arcibiskupský krucifix++',
        dmg: 8,
        cooldown: 4,
        pattern: [
          { offset: 1, dmg: 8, effects: [] },
          { offset: 2, dmg: 8, effects: [] },
          { offset: 3, dmg: 8, effects: [] },
          { offset: 4, dmg: 8, effects: [] }
        ],
        description: 'CD 4, průrazný paprsek na 4 pole za 8 DMG všem.'
      }
    ]
  },
  nimble_step: {
    id: 'nimble_step',
    name: 'Pohotový úkrok',
    icon: 'tile.nimble_step',
    type: 'move',
    tags: ['craft'],
    dmg: 0,
    cooldown: 3,
    quick: true,
    stepBackward: 1,
    pattern: [],
    resonance: null,
    description: '⚡ Rychlovka (0 tahů). V rámci komba uskočí o 1 pole vzad (je-li volno).',
    flavor: '„Když se dráb rozpřáhne, je moudřejší nestát v cestě.“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Bystrý úkrok+',
        dmg: 0,
        cooldown: 2,
        stepBackward: 1,
        description: 'CD 2. Uskočí o 1 pole vzad.'
      },
      {
        level: 2,
        name: 'Mistrovský odskok++',
        dmg: 0,
        cooldown: 2,
        stepBackward: 1,
        selfEffect: { type: 'shield', amount: 2 },
        description: 'CD 2. Uskočí o 1 pole vzad a získá 2 Štít.'
      }
    ]
  },
  garlic_pinch: {
    id: 'garlic_pinch',
    name: 'Stroužek v záloze',
    icon: 'tile.garlic_pinch',
    type: 'control',
    tags: ['garlic'],
    dmg: 0,
    cooldown: 3,
    quick: true,
    pattern: [{ offset: 1, dmg: 0, effects: [{ type: 'dispel_empower' }, { type: 'bleed', amount: 1 }] }],
    resonance: null,
    description: '⚡ Rychlovka (0 tahů). Rozmačká stroužek 1 pole vpřed: zruší Zesílení (Empower) a způsobí 1 Krvácení.',
    flavor: '„V kapse kabátu mám vždycky jeden záložní stroužek z loňské sklizně.“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Paličák v záloze+',
        dmg: 0,
        cooldown: 2,
        pattern: [{ offset: 1, dmg: 0, effects: [{ type: 'dispel_empower' }, { type: 'bleed', amount: 1 }] }],
        description: 'CD 2. Zruší Zesílení a udělí 1 Krvácení.'
      },
      {
        level: 2,
        name: 'Česnekový výron++',
        dmg: 2,
        cooldown: 2,
        pattern: [{ offset: 1, dmg: 2, effects: [{ type: 'dispel_empower' }, { type: 'bleed', amount: 2 }] }],
        description: 'CD 2. 2 DMG, zruší Zesílení a způsobí 2 Krvácení.'
      }
    ]
  },
  pub_elbow: {
    id: 'pub_elbow',
    name: 'Loket ze šenku',
    icon: 'tile.pub_elbow',
    type: 'attack',
    tags: ['brawl'],
    dmg: 0,
    cooldown: 3,
    quick: true,
    pattern: [{ offset: 1, dmg: 0, effects: [{ type: 'push', distance: 1 }] }],
    resonance: null,
    description: '⚡ Rychlovka (0 tahů). Vstrčení loktem 1 pole vpřed: Push o 1 pole vzad (může způsobit kolizi!).',
    flavor: '„Povolení k průchodu do výčepu se vyřizuje loktem.“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Ostrý loket ze šenku+',
        dmg: 2,
        cooldown: 3,
        pattern: [{ offset: 1, dmg: 2, effects: [{ type: 'push', distance: 1 }] }],
        description: 'CD 3. 2 DMG a Push o 1 pole vzad.'
      },
      {
        level: 2,
        name: 'Hospodský krosček++',
        dmg: 2,
        cooldown: 2,
        pattern: [{ offset: 1, dmg: 2, effects: [{ type: 'push', distance: 2 }] }],
        description: 'CD 2. 2 DMG a Push o 2 pole vzad.'
      }
    ]
  },
  flail_sweep: {
    id: 'flail_sweep',
    name: 'Okovaný cep',
    icon: 'tile.flail_sweep',
    type: 'attack',
    tags: ['brawl'],
    dmg: 4,
    cooldown: 3,
    quick: false,
    pattern: [{ offset: 1, dmg: 4, effects: [{ type: 'push', distance: 2 }] }],
    resonance: null,
    description: 'Poctivý selský cep okovaný hřeby. 4 DMG na 1 pole vpřed a Push 2 (kolize o zeď drtí za další DMG!).',
    flavor: '„Tímhle mlátil dědek obilí i loupežníky za stodolou!“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Kovaný cep s hřeby+',
        dmg: 6,
        cooldown: 3,
        pattern: [{ offset: 1, dmg: 6, effects: [{ type: 'push', distance: 2 }] }],
        description: '6 DMG na 1 pole vpřed a Push 2.'
      },
      {
        level: 2,
        name: 'Husitský mláticí cep++',
        dmg: 8,
        cooldown: 2,
        pattern: [{ offset: 1, dmg: 8, effects: [{ type: 'push', distance: 3 }] }],
        description: 'CD 2, 8 DMG na 1 pole vpřed a Push 3!'
      }
    ]
  },
  plum_bun: {
    id: 'plum_bun',
    name: 'Povidlová buchta od babičky',
    icon: 'tile.plum_bun',
    type: 'utility',
    tags: ['brawl'],
    dmg: 0,
    cooldown: 4,
    quick: false,
    healAmount: 4,
    cureStatus: 'bleed',
    furyChange: -15,
    pattern: [],
    resonance: null,
    description: 'Poctivá česká buchta: vyléčí 4 HP (přebytek přemění na Štít), zastaví Krvácení, ale zchladí horkou krev (−15 % Rozlícení, může jít do Zchlazení 🧊).',
    flavor: '„Kdo jí babiččiny povidláky, tomu ani upíří tesák kůži neprokousne.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Kynutá buchta se sádlem+',
        dmg: 0,
        cooldown: 3,
        healAmount: 6,
        cureStatus: 'bleed',
        furyChange: -15,
        description: 'CD 3, vyléčí 6 HP, zastaví Krvácení a zchladí krev (−15 % Rozlícení).'
      },
      {
        level: 2,
        name: 'Zlatá sváteční pecen++',
        dmg: 0,
        cooldown: 3,
        healAmount: 8,
        cureStatus: 'bleed',
        selfEffect: { type: 'shield', amount: 4 },
        furyChange: -15,
        description: 'CD 3, vyléčí 8 HP, zastaví Krvácení, přidá +4 Štít a zchladí krev (−15 % Rozlícení).'
      }
    ]
  },
  heavy_windup: {
    id: 'heavy_windup',
    name: 'Honzův selský nápřah',
    icon: 'tile.heavy_windup',
    type: 'utility',
    tags: ['brawl'],
    dmg: 0,
    cooldown: 3,
    quick: true,
    furyChange: 20,
    selfEffect: { type: 'empower', amount: 2 },
    pattern: [],
    resonance: null,
    description: '⚡ Rychlovka (0 tahů). Honza si plivne do dlaní: okamžitě získá +20 % k Bojovému rozlícení a Zesílení (+2 DMG k příštímu úderu).',
    flavor: '„Počkej, ty bledá potvoro, jen co se pořádně napřáhnu!“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Drtivý nápřah+',
        dmg: 0,
        cooldown: 2,
        furyChange: 25,
        selfEffect: { type: 'empower', amount: 3 },
        description: 'CD 2, získá +25 % k Rozlícení a Zesílení (+3 DMG).'
      },
      {
        level: 2,
        name: 'Rázový selský úder++',
        dmg: 0,
        cooldown: 2,
        furyChange: 30,
        selfEffect: { type: 'empower', amount: 4 },
        resonance: {
          nextTileCdReduction: 1,
          description: 'Rezonance: další destička má CD −1.'
        },
        description: 'CD 2, získá +30 % k Rozlícení, Zesílení (+4 DMG) a Rezonanci CD −1.'
      }
    ]
  },
  dragoon_sabre: {
    id: 'dragoon_sabre',
    name: 'Důstojnická šavle vzor 1877',
    icon: 'tile.dragoon_sabre',
    type: 'attack',
    tags: ['craft'],
    dmg: 6,
    cooldown: 3,
    quick: false,
    pattern: [{ offset: 1, dmg: 6, effects: [] }],
    resonance: null,
    description: 'Přesný a smrtící vojenský sek šavlí za 6 DMG na 1 pole vpřed.',
    flavor: '„Broušeno na císařských bruskách ve Vídni. Řeže kosti jak máslo.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Zdobená gardová šavle+',
        dmg: 8,
        cooldown: 3,
        pattern: [{ offset: 1, dmg: 8, effects: [{ type: 'bleed', amount: 2 }] }],
        description: '8 DMG na 1 pole vpřed + Krvácení (2).'
      },
      {
        level: 2,
        name: 'Generálská čepel++',
        dmg: 10,
        cooldown: 2,
        pattern: [{ offset: 1, dmg: 10, effects: [{ type: 'bleed', amount: 4 }] }],
        description: 'CD 2, 10 DMG na 1 pole vpřed + silné Krvácení (4).'
      }
    ]
  },
  dragoon_pistol: {
    id: 'dragoon_pistol',
    name: 'Armádní revolver Gasser M1870',
    icon: 'tile.dragoon_pistol',
    type: 'ranged',
    tags: ['craft'],
    dmg: 4,
    cooldown: 4,
    quick: false,
    projectileRange: 4,
    pattern: [
      { offset: 1, dmg: 4, projectile: true, effects: [{ type: 'confusion', amount: 1 }] },
      { offset: 2, dmg: 4, projectile: true, effects: [{ type: 'confusion', amount: 1 }] },
      { offset: 3, dmg: 4, projectile: true, effects: [{ type: 'confusion', amount: 1 }] },
      { offset: 4, dmg: 4, projectile: true, effects: [{ type: 'confusion', amount: 1 }] }
    ],
    resonance: null,
    description: 'Výstřel olověné kule na dosah až 4 pole: 4 DMG prvnímu cíli a Zmatení (❓) na 1 tah.',
    flavor: '„Rakouský armádní revolver ráže 11 mm. Spolehlivá kavaleristická rána.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Vyladěný revolver Gasser+',
        dmg: 6,
        cooldown: 4,
        projectileRange: 4,
        pattern: [
          { offset: 1, dmg: 6, projectile: true, effects: [{ type: 'confusion', amount: 1 }] },
          { offset: 2, dmg: 6, projectile: true, effects: [{ type: 'confusion', amount: 1 }] },
          { offset: 3, dmg: 6, projectile: true, effects: [{ type: 'confusion', amount: 1 }] },
          { offset: 4, dmg: 6, projectile: true, effects: [{ type: 'confusion', amount: 1 }] }
        ],
        description: 'Dosah 4 pole: 6 DMG a Zmatení (❓) na 1 tah.'
      },
      {
        level: 2,
        name: 'Důstojnický revolver Gasser++',
        dmg: 8,
        cooldown: 3,
        projectileRange: 5,
        pattern: [
          { offset: 1, dmg: 8, projectile: true, effects: [{ type: 'confusion', amount: 1 }] },
          { offset: 2, dmg: 8, projectile: true, effects: [{ type: 'confusion', amount: 1 }] },
          { offset: 3, dmg: 8, projectile: true, effects: [{ type: 'confusion', amount: 1 }] },
          { offset: 4, dmg: 8, projectile: true, effects: [{ type: 'confusion', amount: 1 }] },
          { offset: 5, dmg: 8, projectile: true, effects: [{ type: 'confusion', amount: 1 }] }
        ],
        description: 'CD 3, dosah 5 polí: 8 DMG a Zmatení (❓) na 1 tah.'
      }
    ]
  },
  cavalry_parry: {
    id: 'cavalry_parry',
    name: 'Vojenský kryt čepelí',
    icon: 'tile.cavalry_parry',
    type: 'defense',
    tags: ['craft'],
    dmg: 0,
    cooldown: 3,
    quick: false,
    shieldAmount: 6,
    pattern: [],
    resonance: null,
    description: 'Bravurní vojenský kryt: získá +6 Štítu.',
    flavor: '„Vojenský předpis, paragraf 14: Čepel pod úhlem 45 stupňů odrazí každou ránu.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Mistrovský kryt+',
        dmg: 0,
        cooldown: 2,
        shieldAmount: 8,
        description: 'CD 2, získá +8 Štítu.'
      },
      {
        level: 2,
        name: 'Kavalírská odveta++',
        dmg: 0,
        cooldown: 2,
        shieldAmount: 10,
        selfEffect: { type: 'empower', amount: 4 },
        description: 'CD 2, získá +10 Štítu a Zesílení (+4 DMG) pro odvetný úder!'
      }
    ]
  },
  stiletto_stab: {
    id: 'stiletto_stab',
    name: 'Zlodějská dýka pod žebro',
    icon: 'tile.stiletto_stab',
    type: 'attack',
    tags: ['craft'],
    dmg: 2,
    cooldown: 2,
    quick: false,
    pattern: [{ offset: 1, dmg: 2, backstabDmg: 8, backstabEffects: [{ type: 'bleed', amount: 4 }], effects: [] }],
    resonance: null,
    description: 'Rychlé bodnutí dýkou za 2 DMG. Ze zálohy (pokud cíl stojí zády k tobě): drtivých 8 DMG + 4 Krvácení!',
    flavor: '„Když se na mě díváš, je to jen škrábnutí. Když se otočíš, je to konec.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Otrávené stileto+',
        dmg: 4,
        cooldown: 2,
        pattern: [{ offset: 1, dmg: 4, backstabDmg: 12, backstabEffects: [{ type: 'bleed', amount: 6 }], effects: [] }],
        description: '4 DMG zepředu, ale 12 DMG + 6 Krvácení ze zálohy!'
      },
      {
        level: 2,
        name: 'Čepel tiché noci++',
        dmg: 4,
        cooldown: 1,
        pattern: [{ offset: 1, dmg: 4, backstabDmg: 16, backstabEffects: [{ type: 'bleed', amount: 8 }], effects: [] }],
        description: 'CD 1! 4 DMG zepředu, ale 16 DMG + 8 Krvácení ze zálohy!'
      }
    ]
  },
  glass_shards: {
    id: 'glass_shards',
    name: 'Hrst střepů z výlohy',
    icon: 'tile.glass_shards',
    type: 'attack',
    tags: ['craft'],
    dmg: 2,
    cooldown: 3,
    quick: false,
    pattern: [
      { offset: 1, dmg: 2, effects: [{ type: 'bleed', amount: 4 }, { type: 'push', distance: 1 }] },
      { offset: 2, dmg: 2, effects: [{ type: 'bleed', amount: 4 }, { type: 'push', distance: 1 }] }
    ],
    resonance: null,
    description: 'Vrhne ostré skleněné střepy na 2 pole vpřed: 2 DMG + 4 Krvácení a Push 1.',
    flavor: '„Střepy z lékárny přinášejí upírům smůlu a těžké krvácení.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Sypané vitriolové střepy+',
        dmg: 4,
        cooldown: 3,
        pattern: [
          { offset: 1, dmg: 4, effects: [{ type: 'bleed', amount: 4 }, { type: 'push', distance: 1 }] },
          { offset: 2, dmg: 4, effects: [{ type: 'bleed', amount: 4 }, { type: 'push', distance: 1 }] }
        ],
        description: '4 DMG na 2 pole vpřed + 4 Krvácení a Push 1.'
      },
      {
        level: 2,
        name: 'Výbušná prachovnice se střepy++',
        dmg: 6,
        cooldown: 2,
        pattern: [
          { offset: 1, dmg: 6, effects: [{ type: 'bleed', amount: 6 }, { type: 'push', distance: 2 }] },
          { offset: 2, dmg: 6, effects: [{ type: 'bleed', amount: 6 }, { type: 'push', distance: 2 }] }
        ],
        description: 'CD 2, 6 DMG na 2 pole vpřed + 6 Krvácení a Push 2.'
      }
    ]
  },
  shadow_slip: {
    id: 'shadow_slip',
    name: 'Stínový prokluz za záda',
    icon: 'tile.shadow_slip',
    type: 'move',
    tags: ['craft'],
    dmg: 0,
    cooldown: 2,
    quick: false,
    leapDistance: 2,
    selfFlipAfter: true,
    pattern: [{ offset: 2, dmg: 0, isMoveTarget: true, effects: [] }],
    resonance: null,
    description: 'Káča proklouzne stíny o 2 pole vpřed přes nepřátele a okamžitě se otočí čelem k jejich zádům!',
    flavor: '„Kde nic, tu nic. Teď stojím za tebou!“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Mlžný krok za záda+',
        dmg: 0,
        cooldown: 2,
        leapDistance: 2,
        selfFlipAfter: true,
        selfEffect: { type: 'shield', amount: 2 },
        description: 'Přeskok o 2 pole, otočení za záda a získá +2 Štít.'
      },
      {
        level: 2,
        name: 'Přízračný stín++',
        dmg: 0,
        cooldown: 1,
        leapDistance: 3,
        selfFlipAfter: true,
        selfEffect: { type: 'shield', amount: 4 },
        description: 'CD 1! Přeskok až o 3 pole, otočení a získá +4 Štít.'
      }
    ]
  },
  halberd_sweep: {
    id: 'halberd_sweep',
    name: 'Ponocenská halapartna',
    icon: 'tile.halberd_sweep',
    type: 'attack',
    tags: ['brawl', 'craft'],
    dmg: 5,
    cooldown: 4,
    quick: false,
    pattern: [
      { offset: 1, dmg: 5, effects: [] },
      { offset: 2, dmg: 4, effects: [{ type: 'push', distance: 1 }] }
    ],
    resonance: null,
    description: 'Těžká kovaná halapartna ponocného. Zasáhne dvě políčka přímo před sebou (1. pole za 5 DMG, 2. pole za 4 DMG + Push 1).',
    flavor: '„Dvě políčka odstup od městské brány! C. k. vyhláška o nočním klidu nepřipouští výjimky.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Okovaná ponocenská halapartna+',
        dmg: 7,
        cooldown: 4,
        pattern: [
          { offset: 1, dmg: 7, effects: [] },
          { offset: 2, dmg: 5, effects: [{ type: 'push', distance: 1 }] }
        ],
        description: 'Zesílený břit: 1. pole za 7 DMG, 2. pole za 5 DMG + Push 1.'
      },
      {
        level: 2,
        name: 'Mistrovská strážní halapartna++',
        dmg: 8,
        cooldown: 3,
        pattern: [
          { offset: 1, dmg: 8, effects: [{ type: 'bleed', amount: 2 }] },
          { offset: 2, dmg: 6, effects: [{ type: 'push', distance: 2 }] }
        ],
        description: 'Mistrovské vyvážení (CD 3): 1. pole za 8 DMG + Krvácení (2), 2. pole za 6 DMG + Push 2.'
      }
    ]
  },
  watchman_lantern: {
    id: 'watchman_lantern',
    name: 'Půlnoční lucerna',
    icon: 'tile.watchman_lantern',
    type: 'attack',
    tags: ['holy'],
    dmg: 2,
    cooldown: 3,
    quick: false,
    reduceTargetFury: 15,
    pattern: [
      { offset: 1, dmg: 2, effects: [{ type: 'confusion', amount: 1 }] }
    ],
    resonance: null,
    description: 'Žhnoucí olejová lucerna vrhne oslepující světlo na 1 pole vpřed za 2 DMG, uvrhne upíra do Zmatení (❓) na 1 tah a zchladí jeho běsnění (−15 % Rozlícení) (Chladnutí 3).',
    flavor: '„V tomhle světle pozná každý noční tvor, jak vypadá hřích.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Posvěcená olejová lampa+',
        dmg: 4,
        cooldown: 3,
        reduceTargetFury: 20,
        pattern: [
          { offset: 1, dmg: 4, effects: [{ type: 'confusion', amount: 1 }] }
        ],
        description: '4 DMG na 1 pole vpřed + Zmatení (❓) na 1 tah a zchlazení cíle (−20 % Rozlícení) (Chladnutí 3).'
      },
      {
        level: 2,
        name: 'Věčné světlo strážce++',
        dmg: 6,
        cooldown: 2,
        reduceTargetFury: 25,
        pattern: [
          {
            offset: 1,
            dmg: 6,
            effects: [
              { type: 'confusion', amount: 1 },
              { type: 'spawn_garlic_target' }
            ]
          }
        ],
        description: 'CD 2! 6 DMG na 1 pole vpřed, Zmatení (❓) na 1 tah, zchlazení cíle (−25 % Rozlícení) a Česnekový oblak.'
      }
    ]
  },
  watchman_horn: {
    id: 'watchman_horn',
    name: 'Ponocenský roh',
    icon: 'tile.watchman_horn',
    type: 'defend',
    tags: ['brawl'],
    dmg: 2,
    cooldown: 4,
    quick: false,
    shieldAmount: 5,
    pattern: [
      { offset: 1, dmg: 2, effects: [{ type: 'push', distance: 2 }] },
      { offset: -1, dmg: 2, effects: [{ type: 'push', distance: 2 }] }
    ],
    resonance: null,
    description: 'Mocné zatroubení na noční mosazný roh. Ponocný získá +5 Štít a odhodí sousedící nepřátele před i za sebou o 2 pole (Push 2 za 2 DMG).',
    flavor: '„Chval každý duch Hospodina! A vy upíři koukejte táhnout do komína!“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Mosazný polní roh+',
        dmg: 3,
        cooldown: 4,
        shieldAmount: 7,
        pattern: [
          { offset: 1, dmg: 3, effects: [{ type: 'push', distance: 2 }] },
          { offset: -1, dmg: 3, effects: [{ type: 'push', distance: 2 }] }
        ],
        description: 'Získá +7 Štít, odhodí sousedy o 2 pole za 3 DMG.'
      },
      {
        level: 2,
        name: 'Půlnoční polnice zkázy++',
        dmg: 4,
        cooldown: 3,
        shieldAmount: 9,
        pattern: [
          { offset: 1, dmg: 4, effects: [{ type: 'push', distance: 3 }, { type: 'confusion', amount: 1 }] },
          { offset: -1, dmg: 4, effects: [{ type: 'push', distance: 3 }, { type: 'confusion', amount: 1 }] }
        ],
        description: 'CD 3! Získá +9 Štít, odhodí sousedy o 3 pole za 4 DMG a uvrhne je do Zmatení (❓).'
      }
    ]
  },
  barbell_slam: {
    id: 'barbell_slam',
    name: 'Litinová činka',
    icon: 'tile.barbell_slam',
    type: 'attack',
    tags: ['brawl', 'craft'],
    dmg: 5,
    cooldown: 3,
    quick: false,
    pattern: [{ offset: 1, dmg: 5, effects: [{ type: 'push', distance: 1 }] }],
    resonance: null,
    description: 'Drtivý úder padesátikilovou cirkusovou činkou za 5 DMG a odhození cíle o 1 pole (Push 1).',
    flavor: '„S tímhle zvedám v manéži tři artistky naráz. Pro tvoji lebku to bude těžký večer!“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Okovaná litinová činka+',
        dmg: 7,
        cooldown: 3,
        pattern: [{ offset: 1, dmg: 7, effects: [{ type: 'push', distance: 2 }] }],
        description: '7 DMG a odhození o 2 pole (Push 2).'
      },
      {
        level: 2,
        name: 'Arénová dvousféra++',
        dmg: 8,
        cooldown: 2,
        pattern: [{ offset: 1, dmg: 8, effects: [{ type: 'push', distance: 2 }, { type: 'confusion', amount: 1 }] }],
        description: 'CD 2! 8 DMG, Push 2 a Zmatení (❓) cíle.'
      }
    ]
  },
  kettlebell_toss: {
    id: 'kettlebell_toss',
    name: 'Vrhací závaží',
    icon: 'tile.kettlebell_toss',
    type: 'ranged',
    tags: ['brawl'],
    dmg: 3,
    cooldown: 3,
    quick: false,
    projectileRange: 3,
    pattern: [
      { offset: 1, dmg: 3, projectile: true, effects: [{ type: 'push', distance: 1 }] },
      { offset: 2, dmg: 3, projectile: true, effects: [{ type: 'push', distance: 1 }] },
      { offset: 3, dmg: 3, projectile: true, effects: [{ type: 'push', distance: 1 }] }
    ],
    resonance: null,
    description: 'Vrhne kovanou litinovou kouli s uchem až na 3 pole. Způsobí 3 DMG prvnímu cíli v dráze a odhodí ho o 1 pole.',
    flavor: '„Když létá železo vzduchem, publikum v prvních řadách raději sklání hlavy.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Těžké vrhací závaží+',
        dmg: 5,
        cooldown: 3,
        pattern: [
          { offset: 1, dmg: 5, projectile: true, effects: [{ type: 'push', distance: 2 }] },
          { offset: 2, dmg: 5, projectile: true, effects: [{ type: 'push', distance: 2 }] },
          { offset: 3, dmg: 5, projectile: true, effects: [{ type: 'push', distance: 2 }] }
        ],
        description: '5 DMG na dosah až 3 polí a Push 2.'
      },
      {
        level: 2,
        name: 'Stolibrová dělová koule++',
        dmg: 6,
        cooldown: 2,
        pattern: [
          { offset: 1, dmg: 6, projectile: true, effects: [{ type: 'push', distance: 2 }, { type: 'confusion', amount: 1 }] },
          { offset: 2, dmg: 6, projectile: true, effects: [{ type: 'push', distance: 2 }, { type: 'confusion', amount: 1 }] },
          { offset: 3, dmg: 6, projectile: true, effects: [{ type: 'push', distance: 2 }, { type: 'confusion', amount: 1 }] }
        ],
        description: 'CD 2! 6 DMG na dosah až 3 polí, Push 2 a Zmatení (❓) cíle.'
      }
    ]
  },
  iron_flex: {
    id: 'iron_flex',
    name: 'Zatnutí svalů',
    icon: 'tile.iron_flex',
    type: 'defend',
    tags: ['brawl'],
    dmg: 0,
    cooldown: 3,
    quick: false,
    shieldAmount: 5,
    furyChange: 10,
    selfEffect: { type: 'empower', amount: 1 },
    pattern: [],
    resonance: null,
    description: 'Předvede bicepsy publiku: Získá +5 Štít, +10 % k Bojovému rozlícení a Zesílení (+2 DMG k příštímu úderu).',
    flavor: '„Ocelové svaly, ocelové nervy. Upíří zub se na mém rameni jenom zlomí!“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Železný hrudník+',
        dmg: 0,
        cooldown: 3,
        shieldAmount: 7,
        furyChange: 15,
        selfEffect: { type: 'empower', amount: 1 },
        pattern: [],
        description: 'Získá +7 Štít, +15 % k Rozlícení a Zesílení (+2 DMG).'
      },
      {
        level: 2,
        name: 'Bronzový titán++',
        dmg: 0,
        cooldown: 2,
        shieldAmount: 8,
        furyChange: 20,
        selfEffect: { type: 'empower', amount: 2 },
        pattern: [],
        description: 'Chladnutí 2! Získá +8 Štít, +20 % k Rozlícení a velké Zesílení (+4 DMG).'
      }
    ]
  },
  silver_parasol: {
    id: 'silver_parasol',
    name: 'Stříbrný slunečník',
    icon: 'tile.silver_parasol',
    type: 'attack',
    tags: ['craft', 'holy'],
    dmg: 4,
    cooldown: 3,
    quick: false,
    pattern: [{ offset: 1, dmg: 4, backstabDmg: 7, effects: [] }],
    resonance: null,
    description: 'Šermířský výpad stříbrem okovanou špicí slunečníku na 1 pole za 4 DMG (do zad nepřipraveného tvora za 7 DMG!).',
    flavor: '„Britská dáma nevychází bez slunečníku. Zvláště pokud se v kryptě práší a upíři nedodržují bontón.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Broušený stříbrný slunečník+',
        dmg: 6,
        cooldown: 3,
        pattern: [{ offset: 1, dmg: 6, backstabDmg: 9, effects: [] }],
        description: '6 DMG vpřed (9 DMG do zad).'
      },
      {
        level: 2,
        name: 'Čepel královské gardy++',
        dmg: 7,
        cooldown: 2,
        pattern: [{ offset: 1, dmg: 7, backstabDmg: 11, effects: [{ type: 'bleed', amount: 2 }] }],
        description: 'CD 2! 7 DMG (11 DMG do zad) + Krvácení (2).'
      }
    ]
  },
  boiling_tea: {
    id: 'boiling_tea',
    name: 'Vařící Earl Grey',
    icon: 'tile.boiling_tea',
    type: 'ranged',
    tags: ['holy'],
    dmg: 3,
    cooldown: 3,
    quick: false,
    projectileRange: 2,
    pattern: [
      { offset: 1, dmg: 3, projectile: true, effects: [{ type: 'confusion', amount: 1 }, { type: 'bleed', amount: 2 }] },
      { offset: 2, dmg: 3, projectile: true, effects: [{ type: 'confusion', amount: 1 }, { type: 'bleed', amount: 2 }] }
    ],
    resonance: null,
    description: 'Vrhne šálek vroucího černého čaje na dosah 2 polí za 3 DMG + Opaření (Krvácení 2) a Zmatení (1 kolo).',
    flavor: '„Dvě lžičky bergamotu, vroucí voda ze stříbrného samovaru a kapka svěcené vody pro chuť.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Vřelý královský čaj+',
        dmg: 5,
        cooldown: 3,
        pattern: [
          { offset: 1, dmg: 5, projectile: true, effects: [{ type: 'confusion', amount: 1 }, { type: 'bleed', amount: 2 }] },
          { offset: 2, dmg: 5, projectile: true, effects: [{ type: 'confusion', amount: 1 }, { type: 'bleed', amount: 2 }] }
        ],
        description: '5 DMG na 2 pole + Krvácení (2) a Zmatení.'
      },
      {
        level: 2,
        name: 'Vroucí konvice zkázy++',
        dmg: 6,
        cooldown: 2,
        pattern: [
          { offset: 1, dmg: 6, projectile: true, effects: [{ type: 'confusion', amount: 2 }, { type: 'bleed', amount: 3 }] },
          { offset: 2, dmg: 6, projectile: true, effects: [{ type: 'confusion', amount: 2 }, { type: 'bleed', amount: 3 }] }
        ],
        description: 'CD 2! 6 DMG na 2 pole + Krvácení (3) a Zmatení na 2 kola.'
      }
    ]
  },
  royal_etiquette: {
    id: 'royal_etiquette',
    name: 'Královská etiketa',
    icon: 'tile.royal_etiquette',
    type: 'defend',
    tags: ['holy', 'craft'],
    dmg: 0,
    cooldown: 3,
    quick: false,
    shieldAmount: 5,
    healAmount: 2,
    convertFuryToShield: true,
    furyPerShield: 5,
    pattern: [],
    resonance: null,
    description: 'Dámský doušek odpoledního čaje a ukázněný postoj: Získá +5 Štít a vyléčí si 2 HP. Veškeré kladné Rozlícení noblesně přetaví ve Štít (každých 5 % Rozlícení = +1 Štít navíc)!',
    flavor: '„Pravá dáma neztrácí způsoby ani ve chvíli, kdy jí krvelačný hrabě sahá na kanýry.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Viktoriánská důstojnost+',
        dmg: 0,
        cooldown: 3,
        shieldAmount: 7,
        healAmount: 3,
        convertFuryToShield: true,
        furyPerShield: 5,
        pattern: [],
        description: 'Získá +7 Štít, vyléčí 3 HP a přetaví Rozlícení na Štít (5 % = +1 Štít).'
      },
      {
        level: 2,
        name: 'Čajové panství++',
        dmg: 0,
        cooldown: 2,
        shieldAmount: 8,
        healAmount: 4,
        convertFuryToShield: true,
        furyPerShield: 4,
        pattern: [],
        description: 'Chladnutí 2! Získá +8 Štít, vyléčí 4 HP a přetaví Rozlícení na Štít (4 % = +1 Štít).'
      }
    ]
  },
  repeating_crossbow: {
    id: 'repeating_crossbow',
    name: 'Rotační opakovací kuše',
    icon: 'tile.repeating_crossbow',
    type: 'ranged',
    tags: ['craft'],
    dmg: 2,
    cooldown: 3,
    quick: false,
    projectileRange: 4,
    burstHits: 2,
    pattern: [
      { offset: 1, dmg: 2, projectile: true },
      { offset: 2, dmg: 2, projectile: true },
      { offset: 3, dmg: 2, projectile: true },
      { offset: 4, dmg: 2, projectile: true }
    ],
    resonance: null,
    description: 'Dosah 4 pole: Rotační bubínek vypálí dvě stříbrné šipky v rychlém sledu (2x 2 DMG = 4 DMG celkem).',
    flavor: '„Gatlingův patent v kapesním provedení. Dva výstřely, než upír stihne mrknout!“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Rotační opakovací kuše+',
        dmg: 3,
        cooldown: 3,
        projectileRange: 4,
        burstHits: 2,
        pattern: [
          { offset: 1, dmg: 3, projectile: true },
          { offset: 2, dmg: 3, projectile: true },
          { offset: 3, dmg: 3, projectile: true },
          { offset: 4, dmg: 3, projectile: true }
        ],
        description: 'Dosah 4 pole: Vypálí 2 šipky za 3 DMG (celkem 6 DMG).'
      },
      {
        level: 2,
        name: 'Gatlingova rotační kuše++',
        dmg: 3,
        cooldown: 2,
        projectileRange: 4,
        burstHits: 3,
        pattern: [
          { offset: 1, dmg: 3, projectile: true },
          { offset: 2, dmg: 3, projectile: true },
          { offset: 3, dmg: 3, projectile: true },
          { offset: 4, dmg: 3, projectile: true }
        ],
        description: 'CD 2! Rychlopalba 3 šipek za 3 DMG (celkem 9 DMG).'
      }
    ]
  },
  silver_bolt_salvo: {
    id: 'silver_bolt_salvo',
    name: 'Stříbrná salva šípů',
    icon: 'tile.silver_bolt_salvo',
    type: 'ranged',
    tags: ['holy', 'craft'],
    dmg: 3,
    cooldown: 3,
    quick: false,
    projectileRange: 3,
    pattern: [
      { offset: 1, dmg: 3, projectile: true, effects: [{ type: 'bleed', amount: 2 }] },
      { offset: 2, dmg: 3, projectile: true, effects: [{ type: 'bleed', amount: 2 }] },
      { offset: 3, dmg: 3, projectile: true, effects: [{ type: 'bleed', amount: 2 }] }
    ],
    resonance: null,
    description: 'Dosah 3 pole: Zasáhne cíl za 3 DMG a způsobí Krvácení (2).',
    flavor: '„Posvěcené stříbro leptá upíří maso jako vroucí kyselina.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Stříbrná salva šípů+',
        dmg: 4,
        cooldown: 3,
        projectileRange: 3,
        pattern: [
          { offset: 1, dmg: 4, projectile: true, effects: [{ type: 'bleed', amount: 3 }] },
          { offset: 2, dmg: 4, projectile: true, effects: [{ type: 'bleed', amount: 3 }] },
          { offset: 3, dmg: 4, projectile: true, effects: [{ type: 'bleed', amount: 3 }] }
        ],
        description: '4 DMG + Krvácení (3) na 3 pole.'
      },
      {
        level: 2,
        name: 'Posvěcená salva šípů++',
        dmg: 5,
        cooldown: 2,
        projectileRange: 4,
        pattern: [
          { offset: 1, dmg: 5, projectile: true, effects: [{ type: 'bleed', amount: 4 }] },
          { offset: 2, dmg: 5, projectile: true, effects: [{ type: 'bleed', amount: 4 }] },
          { offset: 3, dmg: 5, projectile: true, effects: [{ type: 'bleed', amount: 4 }] },
          { offset: 4, dmg: 5, projectile: true, effects: [{ type: 'bleed', amount: 4 }] }
        ],
        description: 'CD 2! Dosah 4 pole, 5 DMG + Krvácení (4).'
      }
    ]
  },
  winch_reload_kick: {
    id: 'winch_reload_kick',
    name: 'Odskok a natažení rumpálu',
    icon: 'tile.winch_reload_kick',
    type: 'attack',
    tags: ['movement', 'craft'],
    dmg: 2,
    cooldown: 3,
    quick: false,
    recoilBack: 1,
    reloadRangedTiles: 1,
    pattern: [{ offset: 1, dmg: 2, effects: [{ type: 'push', distance: 1 }] }],
    resonance: null,
    description: 'Udeří cíl před sebou za 2 DMG, odhodí ho o 1 pole, odskočí o 1 pole vzad a zkrátí Chladnutí střeleckých destiček o 1.',
    flavor: '„Taktický ústup s bleskovým natažením mechanismu.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Odskok a natažení rumpálu+',
        dmg: 3,
        cooldown: 2,
        recoilBack: 1,
        reloadRangedTiles: 1,
        pattern: [{ offset: 1, dmg: 3, effects: [{ type: 'push', distance: 1 }] }],
        description: 'CD 2, 3 DMG, odhodí o 1 pole, odskok vzad a zkrátí Chladnutí střelby o 1.'
      },
      {
        level: 2,
        name: 'Mistrovský úskok s rumpálem++',
        dmg: 4,
        cooldown: 2,
        recoilBack: 1,
        reloadRangedTiles: 2,
        pattern: [{ offset: 1, dmg: 4, effects: [{ type: 'push', distance: 2 }] }],
        description: 'CD 2, 4 DMG, odhodí o 2 pole, odskok vzad a zkrátí Chladnutí střelby o 2!'
      }
    ]
  },
  gov_stake_1884: {
    id: 'gov_stake_1884',
    name: 'Erární osikový kolík vz. 1884',
    icon: 'tile.gov_stake_1884',
    type: 'attack',
    tags: ['craft', 'holy'],
    dmg: 2,
    cooldown: 2,
    quick: false,
    pattern: [{ offset: 1, dmg: 2, effects: [] }],
    resonance: null,
    description: '1 políčko před sebe za 2 DMG. Čistý úder. Pokud má cíl stav [OKOLKOVÁNO], sníží se Chladnutí této destičky o 1.',
    flavor: '„Vydáno c. k. zbrojním skladem ve Vídni. Každá tříska je řádně zainventarizována.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Erární osikový kolík vz. 1884+',
        dmg: 3,
        cooldown: 2,
        pattern: [{ offset: 1, dmg: 3, effects: [] }],
        description: '3 DMG na 1 pole. Pokud má cíl [OKOLKOVÁNO], sníží Chladnutí o 1.'
      },
      {
        level: 2,
        name: 'Posvěcený erární kolík vz. 1884++',
        dmg: 4,
        cooldown: 1,
        pattern: [{ offset: 1, dmg: 4, effects: [] }],
        description: 'Chladnutí 1! 4 DMG na 1 pole. Pokud má cíl [OKOLKOVÁNO], sníží Chladnutí o 1.'
      }
    ]
  },
  brass_stamp_denied: {
    id: 'brass_stamp_denied',
    name: 'Mosazné razítko „ZAMÍTNUTO“',
    icon: 'tile.brass_stamp_denied',
    type: 'attack',
    tags: ['craft'],
    dmg: 2,
    cooldown: 3,
    quick: false,
    delayEnemyCountdown: 1,
    pattern: [{ offset: 1, dmg: 2, effects: [{ type: 'push', distance: 1 }] }],
    resonance: null,
    description: '1 políčko před sebe za 2 DMG. Odrazí nepřítele o 1 políčko dozadu a odloží jeho naplánovaný útok o 1 tah (+1 tah do odpočtu).',
    flavor: '„Vaše žádost o vysátí krve byla zamítnuta pro formální nedostatky v kolkování!“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Mosazné razítko „ZAMÍTNUTO“+',
        dmg: 3,
        cooldown: 3,
        delayEnemyCountdown: 1,
        pattern: [{ offset: 1, dmg: 3, effects: [{ type: 'push', distance: 1 }] }],
        description: '3 DMG, odrazí o 1 pole a odloží útok nepřítele o 1 tah.'
      },
      {
        level: 2,
        name: 'Císařská pečeť „ZAMÍTNUTO“++',
        dmg: 4,
        cooldown: 2,
        delayEnemyCountdown: 1,
        pattern: [{ offset: 1, dmg: 4, effects: [{ type: 'push', distance: 2 }] }],
        description: 'Chladnutí 2! 4 DMG, odrazí o 2 pole a odloží útok nepřítele o 1 tah.'
      }
    ]
  },
  rast_gasser_revolver: {
    id: 'rast_gasser_revolver',
    name: 'Služební revolver Rast & Gasser (Stříbrná munice)',
    icon: 'tile.rast_gasser_revolver',
    type: 'ranged',
    tags: ['craft', 'holy'],
    dmg: 2,
    cooldown: 3,
    quick: false,
    projectileRange: 5,
    recoilBack: 1,
    pattern: [
      { offset: 1, dmg: 2, projectile: true },
      { offset: 2, dmg: 2, projectile: true },
      { offset: 3, dmg: 2, projectile: true },
      { offset: 4, dmg: 2, projectile: true },
      { offset: 5, dmg: 2, projectile: true }
    ],
    resonance: null,
    description: 'Střelba v přímé linii za 2 DMG. Chladnutí 3 tahy, ale zpětný ráz posune revidenta o 1 políčko dozadu.',
    flavor: '„Osmiranný armádní revolver ráže 8 mm. Každou vystřelenou stříbrnou kulku musím písemně zdůvodnit.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Služební revolver Rast & Gasser+',
        dmg: 3,
        cooldown: 3,
        projectileRange: 5,
        recoilBack: 1,
        pattern: [
          { offset: 1, dmg: 3, projectile: true },
          { offset: 2, dmg: 3, projectile: true },
          { offset: 3, dmg: 3, projectile: true },
          { offset: 4, dmg: 3, projectile: true },
          { offset: 5, dmg: 3, projectile: true }
        ],
        description: 'Chladnutí 3, 3 DMG v linii, zpětný ráz 1 pole vzad.'
      },
      {
        level: 2,
        name: 'Vyladěný revolver Rast & Gasser++',
        dmg: 4,
        cooldown: 2,
        projectileRange: 5,
        recoilBack: 1,
        pattern: [
          { offset: 1, dmg: 4, projectile: true },
          { offset: 2, dmg: 4, projectile: true },
          { offset: 3, dmg: 4, projectile: true },
          { offset: 4, dmg: 4, projectile: true },
          { offset: 5, dmg: 4, projectile: true }
        ],
        description: 'Chladnutí 2! 4 DMG v linii, zpětný ráz 1 pole vzad.'
      }
    ]
  },
  domicile_inspection: {
    id: 'domicile_inspection',
    name: 'Kontrola domovského listu',
    icon: 'tile.domicile_inspection',
    type: 'move',
    tags: ['movement', 'craft'],
    dmg: 0,
    cooldown: 2,
    quick: false,
    pattern: [],
    resonance: null,
    description: 'Prohodí si místo se sousedním nepřítelem, otočí ho zády k sobě a aplikuje na něj stav [OKOLKOVÁNO].',
    flavor: '„Váš domovský list je neplatný! Okamžitě se otočte zády k přepážce a čekejte na výměr!“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Kontrola domovského listu+',
        dmg: 0,
        cooldown: 2,
        shieldAmount: 2,
        pattern: [],
        description: 'Prohodí místo se sousedem, otočí ho zády, aplikuje [OKOLKOVÁNO] a získá +2 Štít.'
      },
      {
        level: 2,
        name: 'Zabavení domovského listu++',
        dmg: 0,
        cooldown: 1,
        shieldAmount: 3,
        pattern: [],
        description: 'Chladnutí 1! Prohodí místo, otočí zády, aplikuje [OKOLKOVÁNO] a získá +3 Štít.'
      }
    ]
  }
};

export function getHeroTileDefinition(tileId, upgradeLevel = 0) {
  const base = HERO_TILES[tileId];
  if (!base) return null;
  if (!upgradeLevel || !base.upgrades || upgradeLevel <= 0) {
    return structuredClone(base);
  }
  const upg = base.upgrades[Math.min(upgradeLevel - 1, base.upgrades.length - 1)];
  return structuredClone({
    ...base,
    ...upg,
    tags: upg.tags || base.tags,
    id: base.id,
    upgradeLevel
  });
}
