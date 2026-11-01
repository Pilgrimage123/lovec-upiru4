// @ts-nocheck
export const TILE_TAGS = {
  garlic: { id: 'garlic', name: 'Česnek', icon: '🧄', color: '#84cc16' },
  holy: { id: 'holy', name: 'Svěcená', icon: '✝️', color: '#38bdf8' },
  brawl: { id: 'brawl', name: 'Hospoda', icon: '🍺', color: '#f59e0b' },
  craft: { id: 'craft', name: 'Řemeslo', icon: '⚙️', color: '#a1a1aa' }
};

export const HERO_TILES = {
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
    description: 'Švihne 1 pole ZA ZÁDY za 2 DMG a okamžitě otočí Vencu čelem vzad.',
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
    flavor: '„Litinová klasika z roku 1924. Ani zuby hraběte skrz to neprojdou.“',
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
      { offset: 1, dmg: 2, effects: [{ type: 'stun', amount: 1 }] },
      { offset: 2, dmg: 2, effects: [{ type: 'stun', amount: 1 }] }
    ],
    resonance: null,
    description: 'Zazvoní na 2 pole vpřed za 2 DMG a všem zasaženým způsobí Omráčení (přeskočí jejich aktivní akci!).',
    flavor: '„Po třech pivech z toho brní uši i mrtvému.“',
    starter: false,
    upgrades: [
      {
        level: 1,
        name: 'Mosazný zvon z kaple+',
        dmg: 2,
        cooldown: 4,
        pattern: [
          { offset: 1, dmg: 2, effects: [{ type: 'stun', amount: 1 }] },
          { offset: 2, dmg: 2, effects: [{ type: 'stun', amount: 1 }] }
        ],
        description: 'CD 4, zasáhne 2 pole vpřed za 2 DMG + Omráčení.'
      },
      {
        level: 2,
        name: 'Polední zvon Hromburác++',
        dmg: 4,
        cooldown: 4,
        pattern: [
          { offset: 1, dmg: 4, effects: [{ type: 'stun', amount: 1 }] },
          { offset: 2, dmg: 4, effects: [{ type: 'stun', amount: 1 }] }
        ],
        description: 'CD 4, zasáhne 2 pole vpřed za 4 DMG + Omráčení.'
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
    flavor: '„Tady soudruzi památkáři šetřili na hřebíkách!“',
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
        pattern: [{ offset: 1, dmg: 2, effects: [{ type: 'confusion', amount: 1 }, { type: 'flip_target' }, { type: 'stun', amount: 1 }] }],
        resonance: {
          nextTileCdReduction: 1,
          description: 'Rezonance: další destička má CD −1.'
        },
        description: 'CD 2, 2 DMG, Omráčení, otočení a Zesílení.'
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
    pattern: [],
    resonance: null,
    description: 'Poctivá česká buchta: vyléčí 4 HP (přebytek přemění na Štít) a zastaví Krvácení.',
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
        description: 'CD 3, vyléčí 6 HP a zastaví Krvácení.'
      },
      {
        level: 2,
        name: 'Zlatá sváteční pecen++',
        dmg: 0,
        cooldown: 3,
        healAmount: 8,
        cureStatus: 'bleed',
        selfEffect: { type: 'shield', amount: 4 },
        description: 'CD 3, vyléčí 8 HP, zastaví Krvácení a přidá +4 Štít!'
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
    selfEffect: { type: 'empower', amount: 4 },
    pattern: [],
    resonance: null,
    description: '⚡ Rychlovka (0 tahů). Honza si plivne do dlaní: Zesílení (+4 DMG k příštímu úderu).',
    flavor: '„Počkej, ty bledá potvoro, jen co se pořádně napřáhnu!“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Drtivý nápřah+',
        dmg: 0,
        cooldown: 2,
        selfEffect: { type: 'empower', amount: 6 },
        description: 'CD 2, Zesílení (+6 DMG).'
      },
      {
        level: 2,
        name: 'Rázový selský úder++',
        dmg: 0,
        cooldown: 2,
        selfEffect: { type: 'empower', amount: 8 },
        resonance: {
          nextTileCdReduction: 1,
          description: 'Rezonance: další destička má CD −1.'
        },
        description: 'CD 2, Zesílení (+8 DMG) a Rezonance CD −1.'
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
    name: 'Jezdecká křesadlová bambitka',
    icon: 'tile.dragoon_pistol',
    type: 'ranged',
    tags: ['craft'],
    dmg: 4,
    cooldown: 4,
    quick: false,
    projectileRange: 4,
    pattern: [
      { offset: 1, dmg: 4, projectile: true, effects: [{ type: 'stun', amount: 1 }] },
      { offset: 2, dmg: 4, projectile: true, effects: [{ type: 'stun', amount: 1 }] },
      { offset: 3, dmg: 4, projectile: true, effects: [{ type: 'stun', amount: 1 }] },
      { offset: 4, dmg: 4, projectile: true, effects: [{ type: 'stun', amount: 1 }] }
    ],
    resonance: null,
    description: 'Výstřel olověné kule na dosah až 4 pole: 4 DMG prvnímu cíli a Omráčení (1).',
    flavor: '„Jedna rána, jedna díra v upírovi a zvonění v uších až do rána.“',
    starter: true,
    upgrades: [
      {
        level: 1,
        name: 'Dvojhlavňová bambitka+',
        dmg: 6,
        cooldown: 4,
        projectileRange: 4,
        pattern: [
          { offset: 1, dmg: 6, projectile: true, effects: [{ type: 'stun', amount: 1 }] },
          { offset: 2, dmg: 6, projectile: true, effects: [{ type: 'stun', amount: 1 }] },
          { offset: 3, dmg: 6, projectile: true, effects: [{ type: 'stun', amount: 1 }] },
          { offset: 4, dmg: 6, projectile: true, effects: [{ type: 'stun', amount: 1 }] }
        ],
        description: 'Dosah 4 pole: 6 DMG a Omráčení.'
      },
      {
        level: 2,
        name: 'Tříhlavňová karabina++',
        dmg: 8,
        cooldown: 3,
        projectileRange: 5,
        pattern: [
          { offset: 1, dmg: 8, projectile: true, effects: [{ type: 'stun', amount: 1 }] },
          { offset: 2, dmg: 8, projectile: true, effects: [{ type: 'stun', amount: 1 }] },
          { offset: 3, dmg: 8, projectile: true, effects: [{ type: 'stun', amount: 1 }] },
          { offset: 4, dmg: 8, projectile: true, effects: [{ type: 'stun', amount: 1 }] },
          { offset: 5, dmg: 8, projectile: true, effects: [{ type: 'stun', amount: 1 }] }
        ],
        description: 'CD 3, dosah 5 polí: 8 DMG a Omráčení.'
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
