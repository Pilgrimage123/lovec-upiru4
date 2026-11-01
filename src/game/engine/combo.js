// @ts-nocheck
import { isValidCell, addStatus, dealDamage } from './state.js';

export function detectResonances(tiles) {
  if (!tiles || tiles.length < 2) return [];
  const counts = { garlic: 0, holy: 0, brawl: 0, craft: 0 };
  for (const tile of tiles) {
    if (tile?.tags && Array.isArray(tile.tags)) {
      for (const tag of tile.tags) {
        if (counts[tag] !== undefined) counts[tag] += 1;
      }
    }
  }
  const resonances = [];
  if (counts.garlic >= 2) {
    resonances.push({
      id: 'garlic_burst',
      name: 'Česnekový opar',
      icon: '🧄',
      tag: 'garlic',
      description: 'Zanechá Česnekový oblak na 2 tahy před Vencou.'
    });
  }
  if (counts.holy >= 2) {
    resonances.push({
      id: 'holy_shield',
      name: 'Posvátná ochrana',
      icon: '✝️',
      tag: 'holy',
      description: 'Uloží Vencovi 1 Štít před protiútokem.'
    });
  }
  if (counts.brawl >= 2) {
    resonances.push({
      id: 'brawl_force',
      name: 'Hospodská rvačka',
      icon: '🍺',
      tag: 'brawl',
      description: '+1 k dosahu všech odhození (Push) v tomto kombu.'
    });
  }
  if (counts.craft >= 2) {
    resonances.push({
      id: 'craft_reduction',
      name: 'Hodinářský fortel',
      icon: '⚙️',
      tag: 'craft',
      description: 'Zkrátí cooldown o 1 tah náhodné destičce na opasku.'
    });
  }
  if (counts.garlic >= 1 && counts.holy >= 1) {
    resonances.push({
      id: 'sanctified_mist',
      name: 'Posvěcený opar',
      icon: '✨',
      tag: 'dual',
      description: 'Zasáhne všechny sousední upíry za 1 DMG.'
    });
  }
  return resonances;
}

export function applyResonances(state, tiles, events = []) {
  const resonances = detectResonances(tiles);
  if (resonances.length === 0) return resonances;
  const hero = state.hero;
  for (const res of resonances) {
    events.push({
      type: 'resonance_burst',
      resonanceId: res.id,
      name: res.name,
      icon: res.icon
    });
    if (res.id === 'garlic_burst') {
      const targetCell = hero.cell + hero.facing;
      if (isValidCell(targetCell, state)) {
        state.terrain[targetCell] = { type: 'garlic_cloud', duration: 2 };
        events.push({ type: 'terrain_spawn', terrainType: 'garlic_cloud', cell: targetCell });
        events.push({
          type: 'log',
          text: `🧄 Rezonance Česneku: Štiplavý opar zahalil pole ${targetCell + 1}!`
        });
      }
    } else if (res.id === 'holy_shield') {
      addStatus(hero, 'shield', 2, events);
      events.push({
        type: 'log',
        text: '✝️ Rezonance Svěcené vody: Venca získal posvátný Štít!'
      });
    } else if (res.id === 'brawl_force') {
      state.comboResonanceBonusPush = (state.comboResonanceBonusPush || 0) + 1;
      events.push({
        type: 'log',
        text: '🍺 Rezonance Hospody: Rány mají větší sílu (+1 pole k odhození)!'
      });
    } else if (res.id === 'craft_reduction') {
      const cooling = (state.hand || []).filter((t) => t.currentCooldown > 0);
      if (cooling.length > 0) {
        const picked = cooling[Math.floor(Math.random() * cooling.length)];
        picked.currentCooldown = Math.max(0, picked.currentCooldown - 1);
        events.push({
          type: 'log',
          text: `⚙️ Rezonance Řemesla: Důmyslné soukolí zkrátlo cooldown destičce „${picked.name}“!`
        });
      }
    } else if (res.id === 'sanctified_mist') {
      let hitAny = false;
      for (const enemy of state.enemies) {
        if (enemy.hp > 0 && Math.abs(enemy.cell - hero.cell) <= 1) {
          dealDamage(state, enemy, 2, { reason: 'sanctified_mist' }, events);
          hitAny = true;
        }
      }
      if (hitAny) {
        events.push({
          type: 'log',
          text: '✨ Posvěcený opar: Kombinace česneku a svěcené vody popálila sousední upíry za 2 DMG!'
        });
      }
    }
  }
  return resonances;
}
