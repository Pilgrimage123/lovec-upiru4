// @ts-nocheck
export const BACKGROUND_THEMES = {
  village_night: {
    id: 'village_night',
    name: 'Noční náves a předhradí',
    image: '/assets/terrain/village_night.svg',
    rasterFallback: '/assets/terrain/naves-yard.jpg',
    cssClass: 'theme-village-night',
    ambientColor: 'rgba(125, 160, 230, 0.12)',
    vignette: 'radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(5, 8, 16, 0.85) 100%)'
  },
  castle_corridor: {
    id: 'castle_corridor',
    name: 'Zatuchlé kamenné chodby hradu',
    image: '/assets/terrain/castle_corridor.svg',
    rasterFallback: '/assets/terrain/naves-dvur.jpg',
    cssClass: 'theme-castle-corridor',
    ambientColor: 'rgba(234, 138, 50, 0.14)',
    vignette: 'radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(16, 10, 6, 0.9) 100%)'
  },
  noble_boudoir: {
    id: 'noble_boudoir',
    name: 'Zámecký budoár a zrcadlový salón',
    image: '/assets/terrain/noble_boudoir.svg',
    rasterFallback: null,
    cssClass: 'theme-noble-boudoir',
    ambientColor: 'rgba(180, 40, 90, 0.15)',
    vignette: 'radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(20, 6, 12, 0.88) 100%)'
  },
  torture_dungeon: {
    id: 'torture_dungeon',
    name: 'Hradní sklepení a mučírna',
    image: '/assets/terrain/torture_dungeon.svg',
    rasterFallback: null,
    cssClass: 'theme-torture-dungeon',
    ambientColor: 'rgba(50, 160, 120, 0.12)',
    vignette: 'radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(6, 14, 12, 0.92) 100%)'
  },
  vampire_throne_crypt: {
    id: 'vampire_throne_crypt',
    name: 'Starobylá krypta a trůnní sál',
    image: '/assets/terrain/vampire_throne_crypt.svg',
    rasterFallback: null,
    cssClass: 'theme-vampire-throne-crypt',
    ambientColor: 'rgba(160, 20, 40, 0.16)',
    vignette: 'radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(18, 4, 8, 0.94) 100%)'
  }
};

export function getEncounterTheme(encounter) {
  return (encounter && BACKGROUND_THEMES[encounter.backgroundTheme || 'village_night']) || BACKGROUND_THEMES.village_night;
}
