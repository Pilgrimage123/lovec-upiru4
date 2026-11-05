// @ts-nocheck
export const TERRAIN_TYPES = {
  none: {
    id: 'none',
    name: 'Kamenná dlažba',
    icon: 'terrain.stone',
    description: 'Obyčejná hradní dlaždice postříkaná pivem a voskem ze svíček.'
  },
  plank_intact: {
    id: 'plank_intact',
    name: 'Prohnilé prkno',
    icon: 'terrain.plank_intact',
    description: '1. stoupnutí zapraská. 2. stoupnutí prkno prolomí a způsobí 4 DMG (létající netopýři prkno neprolomí).'
  },
  plank_cracked: {
    id: 'plank_cracked',
    name: 'Napůl zlomené prkno',
    icon: 'terrain.plank_cracked',
    description: 'Už praská ve švech! Další stoupnutí jej prolomí za 4 DMG.'
  },
  pit: {
    id: 'pit',
    name: 'Hradní propast',
    icon: 'terrain.pit',
    description: 'Bezedná šachta do sklepení. Vhození nebo stoupnutí znamená okamžitou smrt (kromě létajících potvor).'
  },
  spikes: {
    id: 'spikes',
    name: 'Naostřené kůly',
    icon: 'terrain.spikes',
    description: 'Dubové špičáky v podlaze. Každý přesun nebo odhození na toto pole způsobí okamžitě 4 DMG.'
  },
  garlic_cloud: {
    id: 'garlic_cloud',
    name: 'Česnekový oblak',
    icon: 'terrain.garlic_cloud',
    description: 'Štiplavý dým (2 tahy). Na začátku tahu udělí 1 DMG (upírům 2 DMG a dorazí ochromené). Lovec se v něm otáčí zdarma (0 tahů).'
  },
  holy_water_puddle: {
    id: 'holy_water_puddle',
    name: 'Posvěcená louže',
    icon: 'terrain.holy_water_puddle',
    description: 'Svěcená voda (3 tahy). Nemrtvý při vstupu nebo stání utrží 2 DMG.'
  }
};

export const PROPS = {
  barrel: {
    id: 'barrel',
    name: 'Sud s kyselým zelím',
    icon: 'terrain.barrel',
    maxHp: 4,
    destructible: true,
    description: 'Dubový sud (4 HP). Blokuje krok, lze jej přeskočit. Při rozbití či srážce udělí 4 DMG + Zmatení (❓).'
  },
  holy_font: {
    id: 'holy_font',
    name: 'Kamenná kropenka',
    icon: 'prop.holy_font',
    maxHp: 2,
    destructible: true,
    description: 'Nádoba se svěcenou vodou (2 HP). Při rozbití udělí 4 DMG nemrtvým v okolí a zanechá posvěcenou louži.'
  },
  mirror: {
    id: 'mirror',
    name: 'Hradní zrcadlo pravdy',
    icon: 'prop.mirror',
    maxHp: 6,
    destructible: false,
    reflectsProjectiles: true,
    description: 'Stříbrné zrcadlo. Odráží letící dálkové střely o 180° zpět po ose Bojiště!'
  }
};

export const TERRAIN_PRESETS = [
  { id: 'barrel_center', props: [{ type: 'barrel', cell: 4 }], terrain: [{ type: 'plank_intact', cell: 2 }] },
  { id: 'spikes_and_plank', props: [], terrain: [{ type: 'spikes', cell: 3 }, { type: 'plank_intact', cell: 5 }] },
  { id: 'pit_edge', props: [{ type: 'barrel', cell: 2 }], terrain: [{ type: 'pit', cell: 5 }] },
  { id: 'garlic_corridor', props: [{ type: 'barrel', cell: 3 }], terrain: [{ type: 'garlic_cloud', cell: 2, duration: 2 }, { type: 'spikes', cell: 5 }] },
  { id: 'twin_planks', props: [], terrain: [{ type: 'plank_intact', cell: 2 }, { type: 'plank_intact', cell: 4 }] },
  { id: 'pit_and_spikes', props: [{ type: 'barrel', cell: 4 }], terrain: [{ type: 'pit', cell: 1 }, { type: 'spikes', cell: 3 }] },
  { id: 'holy_chapel', props: [{ type: 'holy_font', cell: 3 }], terrain: [{ type: 'plank_intact', cell: 5 }] },
  { id: 'mirror_hall', props: [{ type: 'mirror', cell: 5 }], terrain: [{ type: 'spikes', cell: 2 }] },
  { id: 'sacred_font_and_mirror', props: [{ type: 'holy_font', cell: 2 }, { type: 'mirror', cell: 6 }], terrain: [] }
];
