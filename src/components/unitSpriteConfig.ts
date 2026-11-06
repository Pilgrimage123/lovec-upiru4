// ============================================================================
// CENTRALIZED ANIMATION PHYSICS, PRESETS & TUNING CONSTANTS
// ============================================================================
export const ANIMATION_CONFIG = {
  grid: {
    cols: 6,
    rows: 4,
    tileWidth: 108,
    tileHeight: 96,
  },
  idle: {
    scaleY: [1, 1.05, 1] as number[],
    scaleX: [1, 0.97, 1] as number[],
    durationSec: 2.2,
  },
  move: {
    hopHeightPx: 34,
    tiltDeg: 11,
    durationSec: 0.34,
    takeoffSquash: { scaleX: 0.91, scaleY: 1.09 },
    landingSquash: { scaleX: 1.16, scaleY: 0.86 },
    shadowHopScale: 0.56,
    shadowHopOpacity: 0.28,
  },
  attack: {
    windupDistanceRatio: -0.18,
    windupDurationSec: 0.1,
    windupRotateDeg: -8,
    windupScale: { scaleX: 0.92, scaleY: 1.08 },
    lungeDistanceRatio: 0.6, // Lunge rapidly 60% of the way toward target tile
    lungeDurationSec: 0.09,
    lungeRotateDeg: 11,
    lungeScale: { scaleX: 1.15, scaleY: 0.89 },
    hitStopMs: 60, // 60ms hit-stop pause at the apex
    springStiffness: 420,
    springDamping: 24,
  },
  hit: {
    flashDurationMs: 120, // 120ms silhouette flash (white -> crimson)
    whiteFlashMs: 65,
    shakeAmplitudePx: 9,
    durationSec: 0.36,
    squashScaleX: 1.25,
    squashScaleY: 0.8,
  },
  death: {
    shakeDurationSec: 0.2,
    fallDurationSec: 0.46,
    rotateDeg: -88,
    flattenScaleX: 1.15,
    flattenScaleY: 0.62,
  },
  floatingText: {
    arcHeightPx: -54,
    arcDriftPx: 16,
    durationSec: 0.88,
  },
} as const;

// ============================================================================
// FALLBACK DATA-URI SPRITES & CUSTOMIZABLE PNG ASSET CONFIG
// ============================================================================
const KNIGHT_FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" shape-rendering="crispEdges">
  <rect x="48" y="14" width="32" height="26" fill="#cbd5e1" stroke="#0f172a" stroke-width="4"/>
  <rect x="54" y="22" width="20" height="6" fill="#0f172a"/>
  <rect x="58" y="6" width="12" height="10" fill="#dc2626" stroke="#0f172a" stroke-width="3"/>
  <rect x="40" y="40" width="48" height="44" fill="#94a3b8" stroke="#0f172a" stroke-width="4"/>
  <rect x="50" y="48" width="28" height="26" fill="#eab308" stroke="#0f172a" stroke-width="3"/>
  <rect x="60" y="52" width="8" height="18" fill="#dc2626"/>
  <rect x="55" y="57" width="18" height="8" fill="#dc2626"/>
  <rect x="26" y="42" width="14" height="34" fill="#64748b" stroke="#0f172a" stroke-width="4"/>
  <rect x="88" y="42" width="14" height="32" fill="#64748b" stroke="#0f172a" stroke-width="4"/>
  <rect x="96" y="12" width="8" height="48" fill="#e2e8f0" stroke="#0f172a" stroke-width="3"/>
  <rect x="90" y="54" width="20" height="6" fill="#f59e0b" stroke="#0f172a" stroke-width="3"/>
  <rect x="44" y="84" width="16" height="34" fill="#475569" stroke="#0f172a" stroke-width="4"/>
  <rect x="68" y="84" width="16" height="34" fill="#475569" stroke="#0f172a" stroke-width="4"/>
  <rect x="40" y="112" width="22" height="12" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
  <rect x="66" y="112" width="22" height="12" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
</svg>`;

const GOBLIN_FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" shape-rendering="crispEdges">
  <polygon points="24,28 46,22 46,38" fill="#4d7c0f" stroke="#0f172a" stroke-width="4"/>
  <polygon points="104,28 82,22 82,38" fill="#4d7c0f" stroke="#0f172a" stroke-width="4"/>
  <rect x="44" y="18" width="40" height="30" fill="#65a30d" stroke="#0f172a" stroke-width="4"/>
  <rect x="50" y="26" width="10" height="8" fill="#ef4444"/>
  <rect x="68" y="26" width="10" height="8" fill="#ef4444"/>
  <rect x="52" y="38" width="24" height="6" fill="#0f172a"/>
  <rect x="54" y="38" width="5" height="5" fill="#fef08a"/>
  <rect x="69" y="38" width="5" height="5" fill="#fef08a"/>
  <rect x="40" y="48" width="48" height="40" fill="#78350f" stroke="#0f172a" stroke-width="4"/>
  <rect x="48" y="54" width="32" height="24" fill="#92400e" stroke="#0f172a" stroke-width="3"/>
  <rect x="20" y="34" width="10" height="44" fill="#a16207" stroke="#0f172a" stroke-width="3"/>
  <polygon points="16,36 25,14 34,36" fill="#cbd5e1" stroke="#0f172a" stroke-width="3"/>
  <rect x="44" y="88" width="16" height="30" fill="#4d7c0f" stroke="#0f172a" stroke-width="4"/>
  <rect x="68" y="88" width="16" height="30" fill="#4d7c0f" stroke="#0f172a" stroke-width="4"/>
  <rect x="40" y="112" width="20" height="12" fill="#27272a" stroke="#0f172a" stroke-width="3"/>
  <rect x="68" y="112" width="20" height="12" fill="#27272a" stroke="#0f172a" stroke-width="3"/>
</svg>`;

export const FALLBACK_DATA_URIS = {
  playerKnight: `data:image/svg+xml;utf8,${encodeURIComponent(KNIGHT_FALLBACK_SVG)}`,
  enemyGoblin: `data:image/svg+xml;utf8,${encodeURIComponent(GOBLIN_FALLBACK_SVG)}`,
};

export const SPRITE_PRESETS = {
  vencaHunter: "/assets/aistudio/Venca__esnek_06bdb1af.png",
  vencaAttack: "/assets/aistudio/Venca__esnek_06bdb1af.png",
  honzaHunter: "/assets/aistudio/Vesel__Honza_s_rane_kem_na_cest__2d2284c3.png",
  dragounHunter: "/assets/aistudio/dragoun_3c7cb780.png",
  zlodejkaHunter: "/assets/aistudio/Zlatovlas__zlod_jka_s_d_kou_96361a6e.png",
  ponocnyHunter: "/assets/aistudio/ponocn__6449a1bd.png",
  silakHunter: "/assets/aistudio/Vintage_sil_k_s_kotvou_a_medail__86a24e4c.png",
  anglicankaHunter: "/assets/aistudio/Barevn__viktori_nsk__lovkyn__s_de_tn_kem_e96488c5.png",
  helsingHunter: "/assets/aistudio/Karikatura_Van_Helsinga_s_rota_n__ku___4ad7e475.png",
  arthurHunter: "/assets/aistudio/Karikatura_Van_Helsinga_s_rota_n__ku___4ad7e475.png",
  komornik: "/assets/aistudio/komornik_tea_c6a99182.png",
  revidentHunter: "/assets/aistudio/Ornate_c_sa_sk__boty_star_ho___edn_ka_8f8df6f3.png",
  zabojHunter: "/assets/aistudio/K_i__c__bard_s_lyrou_a_palc_tem_9017845b.png",
  enemyDrab: "/assets/enemies/drab.png",
  enemyVampireCilka: "/assets/enemies/upirka_cilka.png",
  enemySkeletonFabian: "/assets/enemies/kostlivec_fabian.png",
  enemyLojzicek: "/assets/enemies/kluk_kamen.png",
  bossCountessDagmar: "/assets/bosses/hrabenka_dagmar.png",
  pixelKnightFallback: FALLBACK_DATA_URIS.playerKnight,
  pixelGoblinFallback: FALLBACK_DATA_URIS.enemyGoblin,
} as const;

export interface GridPos {
  x: number;
  y: number;
}

export interface FloatingCombatPopup {
  id: string;
  text: string;
  type: "dmg" | "heal" | "status" | "crit";
}
