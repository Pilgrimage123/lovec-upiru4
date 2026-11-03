// @ts-nocheck
export const STATUSES = {
  confusion: {
    id: 'confusion',
    name: 'Zmatení',
    icon: 'status.confusion',
    badge: '❓',
    color: '#9b59b6',
    description: 'Postava má nad hlavou otazník ❓ a jeden tah nic nedělá. Na konci tahu otazník zmizí.'
  },
  stun: {
    id: 'stun',
    name: 'Omráčení',
    icon: 'status.stun',
    badge: '🔔',
    color: '#f1c40f',
    description: 'Vynechá příští akci. U nepřítele zůstane zčervenalá fronta zamčená a odpálí se až další tah.'
  },
  bleed: {
    id: 'bleed',
    name: 'Krvácení',
    icon: 'status.bleed',
    badge: '🩸',
    color: '#c0392b',
    description: 'Způsobí 1 DMG na konci každého tahu po dobu 2 tahů.'
  },
  shield: {
    id: 'shield',
    name: 'Štít',
    icon: 'status.shield',
    badge: '🛡️',
    color: '#2980b9',
    description: 'Pohlcuje přicházející poškození bod po bodu dříve, než zasáhne zdraví.'
  },
  empower: {
    id: 'empower',
    name: 'Zesílení',
    icon: 'status.empower',
    badge: '🔥',
    color: '#d35400',
    description: 'Příští útočná akce způsobí +1 DMG.'
  },
  okolkovano: {
    id: 'okolkovano',
    name: 'Okolkováno',
    icon: 'status.okolkovano',
    badge: '📑',
    color: '#d97706',
    description: 'Příští útok do tohoto cíle způsobí +1 poškození (daňová přirážka).'
  },
  rozliceni: {
    id: 'rozliceni',
    name: 'Bojové rozlícení',
    icon: 'status.rozliceni',
    badge: '💢',
    color: '#e74c3c',
    description: 'Postupně gradující bojový hněv a horká krev. Zvyšuje veškeré udělené zranění.'
  },
  torpor: {
    id: 'torpor',
    name: 'Ochromení',
    icon: 'status.torpor',
    badge: '💤',
    color: '#64748b',
    description: 'Upír leží bezvládně na zemi. Za 2 kola opět vstane s polovinou životů, pokud ho lovec nedorazí kolíkem.'
  }
};
