// @ts-nocheck
const loadedAssets = new Map();
const missingAssets = new Set();
let manifest = {};

export function generateFallbackSvg(key, meta = {}) {
  const label = meta.label || key.split(".").pop();
  const category = key.split(".")[0];
  if (category === "hero" || category === "enemy" || category === "boss") {
    const svg = generateCharacterSvg(key, label);
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
  if (category === "terrain") {
    const svg = generateTerrainSvg(key, label);
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
  const svg = generateIconSvg(key, label);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function generateCharacterSvg(key, label) {
  const palettes = {
    "hero.idle": { coat: "#3f6212", cape: "#65a30d", skin: "#fde68a", nose: "#e11d48", hat: "#365314", prop: "✝️" },
    "hero.ponocny": { coat: "#1e1b4b", cape: "#312e81", skin: "#fed7aa", nose: "#ea580c", hat: "#0f172a", prop: "🏮" },
    "hero.silak": { coat: "#991b1b", cape: "#dc2626", skin: "#fed7aa", nose: "#ea580c", hat: "#451a03", prop: "🏋️" },
    "hero.anglicanka": { coat: "#334155", cape: "#64748b", skin: "#fef3c7", nose: "#f43f5e", hat: "#1e293b", prop: "🫖" },
    "hero.helsing": { coat: "#1c1917", cape: "#44403c", skin: "#fde68a", nose: "#e11d48", hat: "#0c0a09", prop: "🏹" },
    "hero.revident": { coat: "#78350f", cape: "#a16207", skin: "#fed7aa", nose: "#b45309", hat: "#451a03", prop: "📑" },
    "enemy.praktikant": { coat: "#4c1d95", cape: "#7e22ce", skin: "#e2e8f0", nose: "#be123c", hat: "#1e1b4b", prop: "🦷" },
    "enemy.urednik": { coat: "#7f1d1d", cape: "#991b1b", skin: "#cbd5e1", nose: "#dc2626", hat: "#450a0a", prop: "💮" },
    "enemy.drab": { coat: "#78350f", cape: "#b45309", skin: "#fed7aa", nose: "#ea580c", hat: "#451a03", prop: "🔪" },
    "enemy.vratny_stit": { coat: "#1e3a8a", cape: "#1d4ed8", skin: "#cbd5e1", nose: "#e11d48", hat: "#172554", prop: "🛡️" },
    "enemy.netopyr": { coat: "#311042", cape: "#581c87", skin: "#d8b4fe", nose: "#f43f5e", hat: "#1e1b4b", prop: "🦇" },
    "enemy.ucetni_buffer": { coat: "#581c87", cape: "#9333ea", skin: "#f1f5f9", nose: "#e11d48", hat: "#3b0764", prop: "📜" },
    "enemy.kluk_kamen": { coat: "#3f6212", cape: "#1d4ed8", skin: "#fde68a", nose: "#e11d48", hat: "#ca8a04", prop: "🪨" },
    "enemy.divocak": { coat: "#9a3412", cape: "#fdba74", skin: "#fecdd3", nose: "#fb7185", hat: "#44403c", prop: "🐗" },
    "enemy.upirske_prase": { coat: "#9f1239", cape: "#fecdd3", skin: "#ffe4e6", nose: "#e11d48", hat: "#4c0519", prop: "🩸" },
    "enemy.sliz": { coat: "#65a30d", cape: "#84cc16", skin: "#d9f99d", nose: "#ca8a04", hat: "#365314", prop: "🦠" },
    "enemy.carodejnice": { coat: "#1e3a8a", cape: "#1d4ed8", skin: "#fef3c7", nose: "#65a30d", hat: "#1e3a8a", prop: "🧙" },
    "enemy.drevo": { coat: "#78350f", cape: "#b45309", skin: "#fde68a", nose: "#e11d48", hat: "#713f12", prop: "🪓" },
    "enemy.sedlak_stit": { coat: "#44403c", cape: "#a8a29e", skin: "#fde68a", nose: "#e11d48", hat: "#b45309", prop: "🪵" },
    "enemy.hrabenka_amalie": { coat: "#1d4ed8", cape: "#dbeafe", skin: "#fde68a", nose: "#e11d48", hat: "#1e3a8a", prop: "👑" },
    "enemy.upirka_cilka": { coat: "#111827", cape: "#b91c1c", skin: "#fecdd3", nose: "#e11d48", hat: "#0f172a", prop: "🎩" },
    "enemy.vrhac_nozu": { coat: "#3f6212", cape: "#b45309", skin: "#fde68a", nose: "#e11d48", hat: "#ca8a04", prop: "🗡️" },
    "enemy.prase_mutant": { coat: "#9a3412", cape: "#7f1d1d", skin: "#fecdd3", nose: "#eab308", hat: "#44403c", prop: "🐷" },
    "enemy.bazinny_sliz": { coat: "#166534", cape: "#65a30d", skin: "#84cc16", nose: "#ca8a04", hat: "#3f6212", prop: "🍃" },
    "enemy.upiri_trpaslik": { coat: "#1d4ed8", cape: "#b91c1c", skin: "#fecdd3", nose: "#e11d48", hat: "#1e3a8a", prop: "🧢" },
    "enemy.rytir_prizrak": { coat: "#334155", cape: "#1d4ed8", skin: "#86efac", nose: "#22c55e", hat: "#1e293b", prop: "👻" },
    "enemy.zombie_hynek": { coat: "#1f2937", cape: "#44403c", skin: "#84cc16", nose: "#65a30d", hat: "#365314", prop: "⚰️" },
    "enemy.kostlivec_fabian": { coat: "#78350f", cape: "#d6d3d1", skin: "#f5f5f4", nose: "#a8a29e", hat: "#44403c", prop: "🦴" },
    "enemy.krysa_piskota": { coat: "#78350f", cape: "#b91c1c", skin: "#a16207", nose: "#fb7185", hat: "#fef3c7", prop: "🐀" },
    "enemy.morovy_felcar": { coat: "#1e293b", cape: "#0f172a", skin: "#fdba74", nose: "#14532d", hat: "#0f172a", prop: "🩺" },
    "boss.arcikniaze_sosak": { coat: "#881337", cape: "#be123c", skin: "#e2e8f0", nose: "#f43f5e", hat: "#4c0519", prop: "👑" },
    "boss.hrabenka_dagmar": { coat: "#4c0519", cape: "#9f1239", skin: "#f8fafc", nose: "#e11d48", hat: "#1e1b4b", prop: "🌹" },
    "boss.drakula_generalni_reditel": { coat: "#111827", cape: "#991b1b", skin: "#e2e8f0", nose: "#dc2626", hat: "#030712", prop: "💼" }
  };
  const p = palettes[key] || palettes["enemy.praktikant"];
  if (key === "enemy.netopyr") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
      <ellipse cx="128" cy="230" rx="52" ry="12" fill="rgba(0,0,0,0.25)"/>
      <path d="M20 110 Q70 50 115 110 Q75 135 20 110 Z" fill="${p.cape}" stroke="#1a110b" stroke-width="6"/>
      <path d="M236 110 Q186 50 141 110 Q181 135 236 110 Z" fill="${p.cape}" stroke="#1a110b" stroke-width="6"/>
      <ellipse cx="128" cy="118" rx="36" ry="32" fill="${p.coat}" stroke="#1a110b" stroke-width="6"/>
      <circle cx="118" cy="110" r="10" fill="#fff" stroke="#1a110b" stroke-width="4"/>
      <circle cx="142" cy="110" r="10" fill="#fff" stroke="#1a110b" stroke-width="4"/>
      <circle cx="121" cy="110" r="4" fill="#1a110b"/>
      <circle cx="145" cy="110" r="4" fill="#1a110b"/>
      <ellipse cx="152" cy="122" rx="14" ry="10" fill="${p.nose}" stroke="#1a110b" stroke-width="4"/>
      <polygon points="122,136 127,150 132,136" fill="#fff" stroke="#1a110b" stroke-width="3"/>
      <polygon points="136,136 141,150 146,136" fill="#fff" stroke="#1a110b" stroke-width="3"/>
      <rect x="28" y="198" width="200" height="28" rx="8" fill="#f4e7c5" stroke="#1a110b" stroke-width="4"/>
      <text x="128" y="217" font-family="Georgia, serif" font-size="15" font-weight="bold" fill="#1a110b" text-anchor="middle">${label}</text>
    </svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
    <ellipse cx="128" cy="238" rx="68" ry="12" fill="rgba(0,0,0,0.28)"/>
    <path d="M58 225 L75 122 L180 122 L198 225 Z" fill="${p.coat}" stroke="#1a110b" stroke-width="6" stroke-linejoin="round"/>
    <path d="M48 135 Q85 110 128 128 Q170 110 205 140 L188 215 L64 215 Z" fill="${p.cape}" stroke="#1a110b" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="128" cy="88" r="40" fill="${p.skin}" stroke="#1a110b" stroke-width="6"/>
    <circle cx="122" cy="78" r="12" fill="#ffffff" stroke="#1a110b" stroke-width="4"/>
    <circle cx="148" cy="78" r="12" fill="#ffffff" stroke="#1a110b" stroke-width="4"/>
    <circle cx="126" cy="78" r="5" fill="#1a110b"/>
    <circle cx="152" cy="78" r="5" fill="#1a110b"/>
    <ellipse cx="168" cy="92" rx="18" ry="13" fill="${p.nose}" stroke="#1a110b" stroke-width="5"/>
    <path d="M115 110 Q138 122 158 108" fill="none" stroke="#1a110b" stroke-width="5" stroke-linecap="round"/>
    <polygon points="126,112 131,127 136,112" fill="#ffffff" stroke="#1a110b" stroke-width="3"/>
    <polygon points="142,111 147,126 152,110" fill="#ffffff" stroke="#1a110b" stroke-width="3"/>
    <path d="M76 58 L180 58 L162 28 L94 28 Z" fill="${p.hat}" stroke="#1a110b" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="188" cy="162" r="24" fill="#f4e7c5" stroke="#1a110b" stroke-width="5"/>
    <text x="188" y="171" font-size="24" text-anchor="middle">${p.prop}</text>
    <rect x="18" y="210" width="220" height="28" rx="7" fill="#f4e7c5" stroke="#1a110b" stroke-width="4"/>
    <text x="128" y="229" font-family="Georgia, serif" font-size="14" font-weight="bold" fill="#1a110b" text-anchor="middle">${label}</text>
  </svg>`;
}

function generateTerrainSvg(key, label) {
  if (key === "terrain.barrel") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
      <ellipse cx="128" cy="236" rx="64" ry="12" fill="rgba(0,0,0,0.3)"/>
      <rect x="64" y="72" width="128" height="156" rx="34" fill="#92400e" stroke="#1a110b" stroke-width="6"/>
      <rect x="62" y="102" width="132" height="16" fill="#52525b" stroke="#1a110b" stroke-width="4"/>
      <rect x="62" y="176" width="132" height="16" fill="#52525b" stroke="#1a110b" stroke-width="4"/>
      <path d="M84 72 Q128 50 172 72" fill="#84cc16" stroke="#1a110b" stroke-width="5"/>
      <rect x="34" y="206" width="188" height="26" rx="6" fill="#f4e7c5" stroke="#1a110b" stroke-width="4"/>
      <text x="128" y="224" font-family="Georgia, serif" font-size="14" font-weight="bold" fill="#1a110b" text-anchor="middle">${label}</text>
    </svg>`;
  }
  if (key === "prop.holy_font" || key === "terrain.holy_font") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
      <ellipse cx="128" cy="236" rx="64" ry="12" fill="rgba(0,0,0,0.3)"/>
      <rect x="100" y="140" width="56" height="80" rx="6" fill="#64748b" stroke="#1a110b" stroke-width="5"/>
      <path d="M50 80 Q128 60 206 80 L180 144 Q128 160 76 144 Z" fill="#94a3b8" stroke="#1a110b" stroke-width="6"/>
      <ellipse cx="128" cy="86" rx="68" ry="22" fill="#38bdf8" stroke="#0284c7" stroke-width="3"/>
      <path d="M128 50 L128 72 M118 60 L138 60" stroke="#fde047" stroke-width="4" stroke-linecap="round"/>
      <circle cx="128" cy="95" r="6" fill="#ffffff" opacity="0.8"/>
      <rect x="34" y="210" width="188" height="26" rx="6" fill="#e2e8f0" stroke="#1a110b" stroke-width="4"/>
      <text x="128" y="228" font-family="Georgia, serif" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">${label}</text>
    </svg>`;
  }
  if (key === "prop.mirror" || key === "terrain.mirror") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
      <ellipse cx="128" cy="236" rx="64" ry="12" fill="rgba(0,0,0,0.3)"/>
      <rect x="68" y="32" width="120" height="180" rx="60" fill="#cbd5e1" stroke="#334155" stroke-width="10"/>
      <rect x="80" y="44" width="96" height="156" rx="48" fill="#e0f2fe" stroke="#0284c7" stroke-width="4"/>
      <path d="M96 60 L160 170" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.6"/>
      <path d="M108 52 L148 120" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
      <rect x="34" y="210" width="188" height="26" rx="6" fill="#f8fafc" stroke="#1a110b" stroke-width="4"/>
      <text x="128" y="228" font-family="Georgia, serif" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">${label}</text>
    </svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 128" width="256" height="128">
    <rect x="8" y="8" width="240" height="112" rx="12" fill="#d6c7a1" stroke="#1a110b" stroke-width="5"/>
    <text x="128" y="72" font-family="Georgia, serif" font-size="18" font-weight="bold" fill="#1a110b" text-anchor="middle">${label}</text>
  </svg>`;
}

function generateIconSvg(key, label) {
  const icons = {
    "tile.oak_stake": "🪵",
    "tile.garlic_belch": "🧄",
    "tile.holy_syringe": "💦",
    "tile.halberd_sweep": "🔱",
    "tile.watchman_lantern": "🏮",
    "tile.watchman_horn": "📯",
    "tile.barbell_slam": "🏋️",
    "tile.kettlebell_toss": "💣",
    "tile.iron_flex": "💪",
    "tile.silver_parasol": "🌂",
    "tile.boiling_tea": "🫖",
    "tile.royal_etiquette": "☕",
    "tile.repeating_crossbow": "🏹",
    "tile.silver_bolt_salvo": "🎯",
    "tile.winch_reload_kick": "⚙️",
    "tile.gov_stake_1884": "🪵",
    "tile.brass_stamp_denied": "💮",
    "tile.rast_gasser_revolver": "🔫",
    "tile.domicile_inspection": "📋",
    "status.okolkovano": "📑",
    "tile.belly_vault": "🤸",
    "tile.rosary_slap": "📿",
    "tile.funeral_hook": "🪝",
    "tile.manhole_shield": "🛡️",
    "tile.sacristy_bell": "🔔",
    "tile.wood_axe": "🪓",
    "tile.plank_stomp": "🥾",
    "tile.funeral_shroud": "👻",
    "tile.silver_crucifix_beam": "✝️",
    "tile.nimble_step": "👟",
    "tile.garlic_pinch": "🧄",
    "tile.pub_elbow": "💪",
    "prop.holy_font": "⛲",
    "prop.mirror": "🪞",
    "terrain.holy_water_puddle": "💦",
    "terrain.holy_font": "⛲",
    "terrain.mirror": "🪞",
    "intent.step": "👣",
    "intent.strike": "⚔️",
    "intent.shoot": "🎯",
    "intent.windup": "💢",
    "intent.shield": "🛡️",
    "intent.heal": "💉",
    "intent.summon": "🦇",
    "intent.turn": "🔄",
    "map.battle": "⚔️",
    "map.elite": "💀",
    "map.pub": "🍺",
    "map.workshop": "⚒️",
    "map.event": "❓",
    "map.treasure": "💎",
    "map.boss": "👑",
    "talisman.wet_kerchief": "🧣",
    "talisman.brass_lantern": "🏮",
    "talisman.beer_frog": "🐸",
    "talisman.garlic_braid": "🧄",
    "talisman.hobnailed_boots": "🥾",
    "talisman.sexton_keyring": "🗝️",
    "talisman.sacred_flask": "🍶",
    "talisman.notary_stamp": "💮",
    "talisman.oak_splinter": "🪵",
    "talisman.pocket_watch": "⏱️",
    "talisman.butcher_apron": "🥩",
    "talisman.holy_aspergillum": "💦"
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
    <rect x="6" y="6" width="116" height="116" rx="18" fill="#f4e7c5" stroke="#2c1d11" stroke-width="6"/>
    <circle cx="64" cy="54" r="32" fill="#e6d2a3" stroke="#2c1d11" stroke-width="3"/>
    <text x="64" y="66" font-size="36" text-anchor="middle">${icons[key] || "⚜️"}</text>
    <text x="64" y="108" font-family="Georgia, serif" font-size="12" font-weight="bold" fill="#2c1d11" text-anchor="middle">${String(label).slice(0, 14)}</text>
  </svg>`;
}

function normalizeSrc(src) {
  if (!src || src.startsWith("data:") || src.startsWith("/") || src.startsWith("http") || src.startsWith("blob:")) {
    return src;
  }
  return `/${src.replace(/^\.\//, "")}`;
}

function loadSingleAsset(key) {
  const meta = manifest[key];
  if (!meta || !meta.src) return Promise.resolve();
  if (meta.present !== true) {
    missingAssets.add(`${key} (${meta.src})`);
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      loadedAssets.set(key, { key, src: normalizeSrc(meta.src), isFallback: false, meta });
      resolve(true);
    };
    img.onerror = () => {
      missingAssets.add(`${key} (${meta.src})`);
      loadedAssets.set(key, { key, src: generateFallbackSvg(key, meta), isFallback: true, meta });
      resolve(false);
    };
    img.src = normalizeSrc(meta.src);
  });
}

export async function initAssets(onProgress = () => {}) {
  try {
    let res = await fetch("/assets/manifest.json").catch(() => null);
    if (!res || !res.ok) {
      res = await fetch("assets/manifest.json").catch(() => null);
    }
    if (res && res.ok) {
      manifest = await res.json();
    }
  } catch {
    manifest = {};
  }
  const allKeys = Object.keys(manifest);
  const preloadKeys = allKeys.filter((k) => manifest[k].preload);
  let loadedCount = 0;

  for (const key of allKeys) {
    const meta = manifest[key];
    loadedAssets.set(key, {
      key,
      src: generateFallbackSvg(key, meta),
      isFallback: true,
      meta
    });
  }

  const notifyUpdate = () => window.dispatchEvent(new Event("lovec-assets"));

  await Promise.all(
    preloadKeys.map(async (key) => {
      const ok = await loadSingleAsset(key);
      loadedCount += 1;
      onProgress(loadedCount, preloadKeys.length, key);
      if (ok) notifyUpdate();
    })
  );

  const lazyKeys = allKeys.filter((k) => !manifest[k].preload);
  Promise.all(lazyKeys.map((key) => loadSingleAsset(key))).then(() => {
    if (missingAssets.size > 0) {
      console.info(
        `[Lovec Upírů - Asset Pipeline] Chybějící externí PNG soubory nahrazeny Neprakta SVG fallbackem (${missingAssets.size}):\n` +
          Array.from(missingAssets).join(", ")
      );
    }
  });
}

export function getAssetUrl(key, fallbackLabel = "") {
  if (loadedAssets.has(key)) return loadedAssets.get(key).src;
  const fallback = generateFallbackSvg(key, { label: fallbackLabel || key });
  loadedAssets.set(key, { key, src: fallback, isFallback: true });
  return fallback;
}
