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
    description: 'Štiplavý moravský česnek (2 tahy). Nepřátelé v oblaku dávají o 1 DMG méně; lovec se v něm otáčí zdarma (0 tahů).'
  },
  holy_water_puddle: {
    id: 'holy_water_puddle',
    name: 'Posvěcená louže',
    icon: 'terrain.holy_water_puddle',
    description: 'Rozlitá svěcená voda z kropenky (3 tahy). Nemrtvý, který na ni vstoupí nebo na ní stojí, utrží 2 DMG.'
  }
};

export const PROPS = {
  barrel: {
    id: 'barrel',
    name: 'Sud s kyselým zelím',
    icon: 'terrain.barrel',
    maxHp: 4,
    destructible: true,
    description: 'Těžký dubový sud (4 HP). Blokuje pohyb, lze jej přeskočit. Při vhození postavy do sudu nebo rozbití praskne a způsobí 4 DMG + Zmatení.'
  },
  holy_font: {
    id: 'holy_font',
    name: 'Kamenná kropenka',
    icon: 'prop.holy_font',
    maxHp: 2,
    destructible: true,
    description: 'Kamenná nádoba se svěcenou vodou (2 HP). Při zásahu útokem, střelou či kolizi se roztříští: udělí 4 DMG nemrtvým na svém a sousedních polích a zanechá posvěcenou louži.'
  },
  mirror: {
    id: 'mirror',
    name: 'Hradní zrcadlo pravdy',
    icon: 'prop.mirror',
    maxHp: 6,
    destructible: false,
    reflectsProjectiles: true,
    description: 'Starobylé stříbrné zrcadlo. Nelze zničit běžnými střelami. Odrazí letící dálkové projektily o 180° zpět po ose Bojiště!'
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
