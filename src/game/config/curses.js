// @ts-nocheck
export const NIGHT_CURSES = [
  {
    level: 0,
    id: 'none',
    name: 'Běžná noc',
    shortName: 'Bez kletby',
    icon: '☀️',
    fangMultiplier: 1,
    description: 'Běžná výprava bez dodatečných upířích kleteb.'
  },
  {
    level: 1,
    id: 'restless_crypt',
    name: 'Kletba I: Neklidná hrobka',
    shortName: 'Kletba I',
    icon: '⚰️',
    fangMultiplier: 1.25,
    description: 'Posily z hradních bran nastupují o 1 tah dříve.'
  },
  {
    level: 2,
    id: 'costly_outskirts',
    name: 'Kletba II: Drahota v podzámčí',
    shortName: 'Kletba II',
    icon: '🪙',
    fangMultiplier: 1.5,
    description: 'Ceny v hospodě a kovářské dílně jsou vyšší o 25 %.'
  },
  {
    level: 3,
    id: 'armored_brutes',
    name: 'Kletba III: Obrnění drábové',
    shortName: 'Kletba III',
    icon: '🛡️',
    fangMultiplier: 1.75,
    description: 'Elitní nepřátelé vstupují do boje s 1 Štítem navíc.'
  },
  {
    level: 4,
    id: 'weary_hunter',
    name: 'Kletba IV: Zemdlený lovec',
    shortName: 'Kletba IV',
    icon: '🩸',
    fangMultiplier: 2,
    description: 'Lovec začíná výpravu s −2 maximálními HP.'
  },
  {
    level: 5,
    id: 'lord_of_darkness',
    name: 'Kletba V: Pán temnoty',
    shortName: 'Kletba V',
    icon: '👑',
    fangMultiplier: 2.5,
    description: 'Hrabě Leopold von Nochtic má o 25 % více životů a začíná boj s posílením úderů.'
  }
];

export function getCurseDefinition(level = 0) {
  return NIGHT_CURSES[Math.max(0, Math.min(5, Number(level) || 0))] || NIGHT_CURSES[0];
}

export function getCurseShopPrice(basePrice, curseLevel = 0) {
  return curseLevel >= 2 ? Math.ceil(basePrice * 1.25) : basePrice;
}
