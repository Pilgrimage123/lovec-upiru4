// @ts-nocheck
function hashSeed(seed) {
  const s = String(seed ?? 'VENCA-1899');
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

export function createRng(seed = 'VENCA-1899') {
  let state = hashSeed(seed)() || 1;

  function nextFloat() {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min, max) {
    return Math.floor(nextFloat() * (max - min + 1)) + min;
  }

  function pick(arr) {
    if (!arr || arr.length === 0) return undefined;
    return arr[Math.floor(nextFloat() * arr.length)];
  }

  function shuffle(arr) {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(nextFloat() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function getState() {
    return state >>> 0;
  }

  function setState(newState) {
    state = newState >>> 0 || 1;
  }

  return {
    seed: String(seed),
    nextFloat,
    nextInt,
    pick,
    shuffle,
    getState,
    setState
  };
}
