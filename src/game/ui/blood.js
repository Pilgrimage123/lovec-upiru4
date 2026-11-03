// @ts-nocheck
function makePalette(light, mid, dark, stain, stainRim, highlight, glow, core) {
  const arr = [...light, ...mid, ...dark];
  arr.light = light;
  arr.mid = mid;
  arr.dark = dark;
  arr.stain = stain;
  arr.stainRim = stainRim;
  arr.highlight = highlight;
  arr.glow = glow;
  arr.core = core;
  return arr;
}

export const PALETTE = {
  red: makePalette(
    ["#fff1f2", "#fecaca", "#fca5a5"],
    ["#fb7185", "#ef4444", "#dc2626", "#b91c1c"],
    ["#991b1b", "#7f1d1d", "#450a0a", "#260404"],
    "#880808",
    "#2e0404",
    "rgba(255, 228, 230, 0.82)",
    "rgba(239, 68, 68, 0.45)",
    "#450a0a"
  ),
  blue: makePalette(
    ["#f0f9ff", "#bae6fd", "#7dd3fc"],
    ["#38bdf8", "#0284c7", "#2563eb", "#4f46e5"],
    ["#3730a3", "#1e3a8a", "#1e1b4b", "#0f172a"],
    "#1d4ed8",
    "#0f172a",
    "rgba(224, 242, 254, 0.88)",
    "rgba(56, 189, 248, 0.52)",
    "#172554"
  ),
  green: makePalette(
    ["#f7fee7", "#d9f99d", "#bef264"],
    ["#a3e635", "#84cc16", "#65a30d", "#4d7c0f"],
    ["#3f6212", "#166534", "#14532d", "#052e16"],
    "#3f6212",
    "#052e16",
    "rgba(247, 254, 231, 0.85)",
    "rgba(163, 230, 53, 0.48)",
    "#14532d"
  )
};

const MAX_PARTICLES = 420;
let fxCanvas = null;
let fxCtx = null;
let particles = [];
let rafId = 0;
let lastFrameTime = 0;
let stageRect = null;
let stageEl = null;

const cellBloodMap = new Map();
const entityBloodMap = new Map();

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pick(arr) {
  if (!arr || arr.length === 0) return "#dc2626";
  return arr[(Math.random() * arr.length) | 0];
}

function pickParticleColor(ichor, kind) {
  const pal = PALETTE[ichor] || PALETTE.red;
  if (kind === "spark") return pick(pal.light);
  if (kind === "mist" || kind === "flash") return pick(pal.light.concat(pal.mid));
  if (kind === "bubble") return pick(pal.mid);
  if (kind === "glob") return pick(pal.dark);
  if (kind === "jet" || kind === "spurt" || kind === "slash_wave") {
    return pick(pal.mid.concat(pal.dark.slice(0, 2)));
  }
  return pick(pal.mid);
}

function pickParticleKind(ichor, style, fatal = false) {
  const r = Math.random();
  if (style === "drip") return r < 0.62 ? "drop" : r < 0.84 ? "spurt" : "glob";
  if (fatal && r < 0.24) return "jet";
  if (ichor === "blue") {
    return r < 0.16 ? "mist" : r < 0.32 ? "spark" : r < 0.52 ? "jet" : r < 0.74 ? "spurt" : r < 0.88 ? "drop" : "glob";
  }
  if (ichor === "green") {
    return r < 0.24 ? "glob" : r < 0.42 ? "bubble" : r < 0.6 ? "jet" : r < 0.78 ? "spurt" : r < 0.9 ? "drop" : "mist";
  }
  return r < 0.24 ? "jet" : r < 0.52 ? "spurt" : r < 0.76 ? "drop" : r < 0.9 ? "glob" : "mist";
}

function computeSprayProfile(reason, attackerCell, targetCell, fatal) {
  if (reason === "death") {
    return { angle: -Math.PI / 2, spread: Math.PI * 0.96, speed: [3, 9.2], style: "gush", countMul: 1.85 };
  }
  if (reason === "bleed") {
    return { angle: Math.PI / 2, spread: 0.52, speed: [0.9, 3.2], style: "drip", countMul: 0.75 };
  }
  if (reason === "spikes") {
    return { angle: -Math.PI / 2, spread: 0.88, speed: [3.2, 8.2], style: "fountain", countMul: 1.4 };
  }
  if (reason === "wall_collision") {
    return {
      angle: targetCell <= 0 ? 0 : targetCell >= 6 ? Math.PI : -Math.PI / 2,
      spread: 0.9,
      speed: [2.8, 6.8],
      style: "burst",
      countMul: 1.25
    };
  }
  if (typeof attackerCell === "number" && attackerCell !== targetCell) {
    const dir = Math.sign(targetCell - attackerCell) || 1;
    return {
      angle: Math.atan2(-0.48, dir),
      spread: 0.88,
      speed: [3, 8.4],
      style: "burst",
      countMul: fatal ? 1.65 : 1.25
    };
  }
  return {
    angle: -Math.PI / 2,
    spread: 1.35,
    speed: [2.4, 7.2],
    style: "burst",
    countMul: fatal ? 1.55 : 1.15
  };
}

function buildOrganicBlobPath(rx, ry, points = 8, seed = 1) {
  const pts = [];
  for (let i = 0; i < points; i++) {
    const ang = (i / points) * Math.PI * 2;
    const wobble = 0.82 + 0.34 * Math.sin(seed * 7.3 + i * 2.7) * Math.cos(seed * 3.1 - i * 1.9);
    pts.push({
      x: Math.cos(ang) * rx * wobble,
      y: Math.sin(ang) * ry * wobble
    });
  }
  let d = "";
  for (let i = 0; i < points; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % points];
    const mx = (p0.x + p1.x) * 0.5;
    const my = (p0.y + p1.y) * 0.5;
    if (i === 0) {
      const prev = pts[points - 1];
      d += `M ${((prev.x + p0.x) * 0.5).toFixed(1)} ${((prev.y + p0.y) * 0.5).toFixed(1)} `;
    }
    d += `Q ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)} `;
  }
  return `${d}Z`;
}

export function clearBattleBlood() {
  cellBloodMap.clear();
  entityBloodMap.clear();
  particles = [];
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
  lastFrameTime = 0;
  if (fxCtx && fxCanvas) {
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
  }
}

export function getCellBloodStains(cellIdx, state = null) {
  const idx = Number(cellIdx);
  if (state?.cellBlood && Array.isArray(state.cellBlood[idx])) {
    return state.cellBlood[idx];
  }
  return cellBloodMap.get(idx) || [];
}

export function getEntityBloodStains(entityId, state = null) {
  if (!entityId) return [];
  if (state) {
    if (state.hero && (state.hero.id === entityId || entityId === "hero_venca") && Array.isArray(state.hero.bloodStains)) {
      return state.hero.bloodStains;
    }
    const en = (state.enemies || []).find((e) => e.id === entityId);
    if (en && Array.isArray(en.bloodStains)) return en.bloodStains;
  }
  return entityBloodMap.get(entityId) || [];
}

function createGroundStain(ichor, opts = {}) {
  const pal = PALETTE[ichor] || PALETTE.red;
  const fatal = Boolean(opts.fatal);
  const rx = Number((opts.rx ?? rand(fatal ? 11 : 6.5, fatal ? 21 : 14)).toFixed(1));
  const ry = Number((opts.ry ?? rx * rand(0.42, 0.65)).toFixed(1));
  const splatCount = Math.floor(rand(fatal ? 5 : 3, fatal ? 9 : 7));
  const splats = [];
  for (let i = 0; i < splatCount; i++) {
    const a = rand(0, Math.PI * 2);
    const dist = rand(rx * 0.95, rx * 2.15);
    splats.push({
      dx: Number((Math.cos(a) * dist).toFixed(1)),
      dy: Number((Math.sin(a) * dist * 0.55).toFixed(1)),
      r: Number(rand(1.3, 3.2).toFixed(1)),
      streak: Math.random() < 0.55,
      ang: Math.round((a * 180) / Math.PI)
    });
  }
  const drips = [];
  const dripCount = fatal ? Math.floor(rand(2, 4)) : Math.random() < 0.7 ? Math.floor(rand(1, 3)) : 0;
  for (let i = 0; i < dripCount; i++) {
    drips.push({
      dx: Number(rand(-rx * 0.65, rx * 0.65).toFixed(1)),
      len: Number(rand(fatal ? 12 : 7, fatal ? 24 : 16).toFixed(1)),
      w: Number(rand(1.4, 2.8).toFixed(1))
    });
  }
  return {
    id: `gstain_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    x: Math.round(opts.x ?? rand(18, 82)),
    y: Math.round(opts.y ?? rand(fatal ? 34 : 38, 72)),
    rx,
    ry,
    seed: Number(rand(1, 99).toFixed(2)),
    rot: Math.round(rand(-22, 22)),
    color: pick(pal.mid),
    coreColor: pal.core || pick(pal.dark),
    rimColor: pal.stainRim,
    highlight: pal.highlight,
    ichor,
    splats,
    drips,
    opacity: Number(rand(0.88, 0.98).toFixed(2))
  };
}

function addCellStain(cellIdx, stain, state = null) {
  if (typeof cellIdx !== "number" || cellIdx < 0 || cellIdx > 8) return;
  if (state) {
    state.cellBlood = state.cellBlood || {};
    state.cellBlood[cellIdx] = state.cellBlood[cellIdx] || [];
    state.cellBlood[cellIdx].push(stain);
    if (state.cellBlood[cellIdx].length > 18) state.cellBlood[cellIdx].shift();
  }
  const list = cellBloodMap.get(cellIdx) || [];
  list.push(stain);
  if (list.length > 18) list.shift();
  cellBloodMap.set(cellIdx, list);
  if (typeof document !== "undefined") {
    const zone = document
      .querySelector(`.board-cell[data-cell-index="${cellIdx}"]`)
      ?.querySelector(".cell-ground-blood-zone");
    if (zone) {
      zone.innerHTML = renderCellGroundBloodHtml(getCellBloodStains(cellIdx, state));
    }
  }
}

export function recordEntityHitBlood(state, opts = {}) {
  const {
    targetId,
    attackerId,
    cell,
    attackerCell,
    amount = 1,
    ichor = "red",
    reason = "attack",
    fatal = false
  } = opts;
  if (!ichor || !PALETTE[ichor]) return;
  const pal = PALETTE[ichor];
  const cellIdx = typeof cell === "number" ? cell : Number(cell);

  if (targetId) {
    const count = fatal ? Math.floor(rand(3, 5)) : Math.min(4, 1 + Math.ceil((amount || 1) / 2));
    for (let i = 0; i < count; i++) {
      const type =
        reason === "bleed"
          ? "drip"
          : pick(fatal ? ["slash", "splat", "arterial", "drip"] : ["slash", "splat", "drip", "cluster"]);
      const stain = {
        id: `stain_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type,
        x: Math.round(rand(32, 68)),
        y: Math.round(rand(type === "drip" ? 42 : 28, 76)),
        scale: Number(rand(0.88, fatal ? 1.55 : 1.28).toFixed(2)),
        rot: Math.round(rand(-38, 38)),
        seed: Number(rand(1, 50).toFixed(1)),
        color: pick(pal.mid),
        darkColor: pick(pal.dark),
        rimColor: pal.stainRim,
        highlight: pal.highlight,
        ichor,
        opacity: Number(rand(0.88, 0.98).toFixed(2))
      };
      if (state) {
        if (state.hero && (state.hero.id === targetId || targetId === "hero_venca")) {
          state.hero.bloodStains = state.hero.bloodStains || [];
          state.hero.bloodStains.push(stain);
          if (state.hero.bloodStains.length > 12) state.hero.bloodStains.shift();
        } else {
          const en = (state.enemies || []).find((e) => e.id === targetId);
          if (en) {
            en.bloodStains = en.bloodStains || [];
            en.bloodStains.push(stain);
            if (en.bloodStains.length > 12) en.bloodStains.shift();
          }
        }
      }
      const list = entityBloodMap.get(targetId) || [];
      list.push(stain);
      if (list.length > 12) list.shift();
      entityBloodMap.set(targetId, list);
    }
  }

  if (
    attackerId &&
    typeof attackerCell === "number" &&
    typeof cellIdx === "number" &&
    Math.abs(attackerCell - cellIdx) <= 1 &&
    attackerId !== targetId
  ) {
    const count = fatal ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const stain = {
        id: `stain_spray_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: i === 0 ? "cluster" : "splat",
        x: Math.round(rand(34, 66)),
        y: Math.round(rand(32, 72)),
        scale: Number(rand(0.78, 1.12).toFixed(2)),
        rot: Math.round(rand(-35, 35)),
        seed: Number(rand(1, 50).toFixed(1)),
        color: pick(pal.mid),
        darkColor: pick(pal.dark),
        rimColor: pal.stainRim,
        highlight: pal.highlight,
        ichor,
        opacity: Number(rand(0.82, 0.94).toFixed(2))
      };
      if (state) {
        if (state.hero && (state.hero.id === attackerId || attackerId === "hero_venca")) {
          state.hero.bloodStains = state.hero.bloodStains || [];
          state.hero.bloodStains.push(stain);
          if (state.hero.bloodStains.length > 12) state.hero.bloodStains.shift();
        } else {
          const en = (state.enemies || []).find((e) => e.id === attackerId);
          if (en) {
            en.bloodStains = en.bloodStains || [];
            en.bloodStains.push(stain);
            if (en.bloodStains.length > 12) en.bloodStains.shift();
          }
        }
      }
      const list = entityBloodMap.get(attackerId) || [];
      list.push(stain);
      if (list.length > 12) list.shift();
      entityBloodMap.set(attackerId, list);
    }
  }

  if (typeof cellIdx === "number" && cellIdx >= 0) {
    const count = fatal ? Math.floor(rand(3, 5)) : Math.min(4, 1 + Math.ceil((amount || 1) / 2));
    for (let i = 0; i < count; i++) {
      addCellStain(cellIdx, createGroundStain(ichor, { fatal }), state);
    }
    if ((fatal || amount >= 3) && typeof attackerCell === "number" && attackerCell !== cellIdx) {
      const dir = Math.sign(cellIdx - attackerCell);
      const nextCell = cellIdx + dir;
      const maxCell = (state?.boardSize || 7) - 1;
      if (nextCell >= 0 && nextCell <= maxCell) {
        addCellStain(
          nextCell,
          createGroundStain(ichor, {
            fatal: false,
            x: dir > 0 ? rand(12, 46) : rand(54, 88),
            rx: rand(5.5, 10.5)
          }),
          state
        );
      }
    }
  }

  if (typeof document !== "undefined") {
    if (targetId) {
      const wrapper = document.getElementById(`entity-dom-${targetId}`)?.querySelector(".sprite-flip-wrapper");
      if (wrapper) {
        const existing = wrapper.querySelector(".sprite-blood-overlay");
        const html = renderSpriteBloodHtml(getEntityBloodStains(targetId, state));
        if (existing) existing.outerHTML = html;
        else if (html) wrapper.insertAdjacentHTML("beforeend", html);
        wrapper.classList.remove("blood-hit-gleam");
        void wrapper.offsetWidth;
        wrapper.classList.add("blood-hit-gleam");
      }
    }
    if (attackerId && attackerId !== targetId) {
      const wrapper = document.getElementById(`entity-dom-${attackerId}`)?.querySelector(".sprite-flip-wrapper");
      if (wrapper) {
        const existing = wrapper.querySelector(".sprite-blood-overlay");
        const html = renderSpriteBloodHtml(getEntityBloodStains(attackerId, state));
        if (existing) existing.outerHTML = html;
        else if (html) wrapper.insertAdjacentHTML("beforeend", html);
      }
    }
  }
}

export function renderCellGroundBloodHtml(cellOrStains, state = null) {
  let stains = [];
  if (Array.isArray(cellOrStains)) stains = cellOrStains;
  else if (typeof cellOrStains === "number") stains = getCellBloodStains(cellOrStains, state);
  if (!stains || stains.length === 0) return "";

  return `
    <svg class="ground-blood-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      ${stains
        .map((s, idx) => {
          const rx = s.rx || 9;
          const ry = s.ry || 4.5;
          const seed = s.seed || (idx + 1) * 3.7;
          const rim = s.rimColor || "#1a0505";
          const col = s.color || "#dc2626";
          const core = s.coreColor || rim;
          const hl = s.highlight || "rgba(255,255,255,0.75)";
          const op = s.opacity || 0.92;
          const splats = s.splats || [];
          const drips = s.drips || [];
          const rimPath = buildOrganicBlobPath(rx * 1.18, ry * 1.18, 8, seed);
          const mainPath = buildOrganicBlobPath(rx, ry, 8, seed + 1.4);

          const splatsHtml = splats
            .map((sp) => {
              if (sp.streak) {
                const tail = (sp.r * 2.4).toFixed(1);
                return `
                  <g transform="translate(${sp.dx}, ${sp.dy}) rotate(${sp.ang || 0})">
                    <path d="M ${-tail} 0 Q 0 ${(-sp.r * 0.9).toFixed(1)} ${sp.r.toFixed(1)} 0 Q 0 ${(sp.r * 0.9).toFixed(1)} ${-tail} 0 Z" fill="${rim}" opacity="0.92" />
                    <circle cx="${(sp.r * 0.2).toFixed(1)}" cy="0" r="${sp.r}" fill="${col}" opacity="0.95" />
                    <circle cx="${(sp.r * 0.1).toFixed(1)}" cy="${(-sp.r * 0.25).toFixed(1)}" r="${Math.max(0.45, sp.r * 0.38).toFixed(1)}" fill="${hl}" opacity="0.7" />
                  </g>
                `;
              }
              return `
                <circle cx="${sp.dx}" cy="${sp.dy}" r="${(sp.r * 1.2).toFixed(1)}" fill="${rim}" opacity="0.9" />
                <circle cx="${sp.dx}" cy="${sp.dy}" r="${sp.r}" fill="${col}" opacity="0.95" />
                <circle cx="${(sp.dx - sp.r * 0.25).toFixed(1)}" cy="${(sp.dy - sp.r * 0.25).toFixed(1)}" r="${Math.max(0.45, sp.r * 0.38).toFixed(1)}" fill="${hl}" opacity="0.68" />
              `;
            })
            .join("");

          const dripsHtml = drips
            .map(
              (dr) => `
              <g transform="translate(${(s.x + dr.dx).toFixed(1)}, ${(s.y + ry * 0.55).toFixed(1)})" opacity="${op}">
                <path d="M ${(-dr.w * 0.7).toFixed(1)} 0 Q 0 ${(dr.len * 0.6).toFixed(1)} ${(-dr.w * 0.25).toFixed(1)} ${dr.len.toFixed(1)} L ${(dr.w * 0.25).toFixed(1)} ${dr.len.toFixed(1)} Q 0 ${(dr.len * 0.6).toFixed(1)} ${(dr.w * 0.7).toFixed(1)} 0 Z" fill="${rim}" opacity="0.95" />
                <path d="M ${(-dr.w * 0.45).toFixed(1)} 0 L 0 ${(dr.len * 0.95).toFixed(1)} L ${(dr.w * 0.45).toFixed(1)} 0 Z" fill="${col}" opacity="0.94" />
                <circle cx="0" cy="${(dr.len + dr.w * 0.35).toFixed(1)}" r="${(dr.w * 0.72).toFixed(1)}" fill="${rim}" />
                <circle cx="0" cy="${(dr.len + dr.w * 0.35).toFixed(1)}" r="${(dr.w * 0.55).toFixed(1)}" fill="${col}" />
                <circle cx="${(-dr.w * 0.18).toFixed(1)}" cy="${(dr.len + dr.w * 0.15).toFixed(1)}" r="${Math.max(0.4, dr.w * 0.22).toFixed(1)}" fill="${hl}" opacity="0.8" />
              </g>
            `
            )
            .join("");

          return `
            <g transform="translate(${s.x}, ${s.y}) rotate(${s.rot || 0})" opacity="${op}">
              <path d="${rimPath}" fill="${rim}" opacity="0.96" />
              <path d="${mainPath}" fill="${col}" opacity="0.94" />
              <ellipse cx="0" cy="0" rx="${(rx * 0.58).toFixed(1)}" ry="${(ry * 0.55).toFixed(1)}" fill="${core}" opacity="0.55" />
              <ellipse cx="${(-rx * 0.26).toFixed(1)}" cy="${(-ry * 0.24).toFixed(1)}" rx="${Math.max(1.2, rx * 0.42).toFixed(1)}" ry="${Math.max(0.7, ry * 0.3).toFixed(1)}" fill="${hl}" opacity="0.72" />
              ${splatsHtml}
            </g>
            ${dripsHtml}
          `;
        })
        .join("")}
    </svg>
  `;
}

export function renderSpriteBloodHtml(entityOrStains, state = null) {
  let stains = [];
  if (Array.isArray(entityOrStains)) stains = entityOrStains;
  else if (typeof entityOrStains === "string") stains = getEntityBloodStains(entityOrStains, state);
  else if (entityOrStains && typeof entityOrStains === "object") {
    stains = entityOrStains.bloodStains || getEntityBloodStains(entityOrStains.id, state);
  }
  if (!stains || stains.length === 0) return "";

  return `
    <div class="sprite-blood-overlay" aria-hidden="true">
      <svg class="sprite-blood-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        ${stains
          .map((s, idx) => {
            const x = s.x || 50;
            const y = s.y || 50;
            const sc = s.scale || 1;
            const rot = s.rot || 0;
            const seed = s.seed || (idx + 1) * 5.1;
            const col = s.color || "#dc2626";
            const dark = s.darkColor || "#7f1d1d";
            const rim = s.rimColor || "#260404";
            const hl = s.highlight || "rgba(255,255,255,0.8)";
            const op = s.opacity || 0.92;
            let inner = "";
            if (s.type === "slash") {
              inner = `
                <path d="M -15 -7 Q -2 -1 16 7 Q 2 4 -15 -7 Z" fill="${rim}" opacity="0.85" />
                <path d="M -14 -6 Q -1 0 15 6" stroke="${rim}" stroke-width="5.4" stroke-linecap="round" fill="none" opacity="0.96" />
                <path d="M -13 -6 Q -1 0 14 6" stroke="${dark}" stroke-width="3.8" stroke-linecap="round" fill="none" opacity="0.96" />
                <path d="M -11 -5 Q 0 0 12 5" stroke="${col}" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.98" />
                <path d="M -8 -4 Q 0 -1 7 2" stroke="${hl}" stroke-width="0.9" stroke-linecap="round" fill="none" opacity="0.75" />
                <path d="M 3 2 Q 4 10 3 16" stroke="${dark}" stroke-width="2.1" stroke-linecap="round" fill="none" />
                <path d="M 3 2 Q 4 10 3 15" stroke="${col}" stroke-width="1.3" stroke-linecap="round" fill="none" />
                <circle cx="3" cy="17.2" r="1.7" fill="${col}" />
                <circle cx="-8" cy="-8" r="1.9" fill="${dark}" />
                <circle cx="-8" cy="-8" r="1.4" fill="${col}" />
                <circle cx="10" cy="9" r="1.8" fill="${col}" />
                <circle cx="17" cy="11" r="1.2" fill="${col}" />
                <circle cx="-14" cy="-2" r="1.3" fill="${col}" />
              `;
            } else if (s.type === "drip") {
              inner = `
                <ellipse cx="0" cy="-7" rx="4.5" ry="2.6" fill="${rim}" opacity="0.92" />
                <ellipse cx="0" cy="-7" rx="3.4" ry="1.9" fill="${col}" opacity="0.95" />
                <path d="M -1.8 -7 C -2.4 -1 -1.6 8 0 15 C 1.6 8 2.4 -1 1.8 -7 Z" fill="${rim}" opacity="0.96" />
                <path d="M -1.1 -7 C -1.5 -1 -1.0 7 0 13.5 C 1.0 7 1.5 -1 1.1 -7 Z" fill="${col}" opacity="0.95" />
                <circle cx="0" cy="16.5" r="2.2" fill="${rim}" />
                <circle cx="0" cy="16.5" r="1.7" fill="${col}" />
                <circle cx="-0.5" cy="15.9" r="0.65" fill="${hl}" opacity="0.82" />
                <path d="M 3.2 -6 Q 3.8 1 3.2 7" stroke="${dark}" stroke-width="1.8" stroke-linecap="round" fill="none" />
                <path d="M 3.2 -6 Q 3.8 1 3.2 6.5" stroke="${col}" stroke-width="1.1" stroke-linecap="round" fill="none" />
                <circle cx="3.2" cy="8.5" r="1.2" fill="${col}" />
              `;
            } else if (s.type === "arterial") {
              inner = `
                <path d="${buildOrganicBlobPath(7.5, 6.2, 9, seed)}" fill="${rim}" opacity="0.95" />
                <path d="${buildOrganicBlobPath(6, 4.8, 9, seed + 1.2)}" fill="${dark}" opacity="0.96" />
                <ellipse cx="0" cy="0" rx="3.8" ry="3.0" fill="${col}" opacity="0.98" />
                <ellipse cx="-1.2" cy="-1.0" rx="1.6" ry="1.0" fill="${hl}" opacity="0.8" />
                <path d="M -2 3 Q -2.5 12 -2 20" stroke="${rim}" stroke-width="2.6" stroke-linecap="round" fill="none" />
                <path d="M -2 3 Q -2.5 12 -2 19" stroke="${col}" stroke-width="1.6" stroke-linecap="round" fill="none" />
                <circle cx="-2" cy="21.5" r="1.9" fill="${col}" />
                <path d="M 2.5 2 Q 3 9 2.5 14" stroke="${dark}" stroke-width="2.0" stroke-linecap="round" fill="none" />
                <circle cx="2.5" cy="15.5" r="1.4" fill="${col}" />
                <circle cx="-8" cy="-5" r="1.8" fill="${col}" />
                <circle cx="8" cy="-4" r="2.1" fill="${col}" />
                <circle cx="9" cy="4" r="1.5" fill="${col}" />
                <circle cx="-7" cy="5" r="1.6" fill="${col}" />
              `;
            } else if (s.type === "cluster") {
              inner = `
                <circle cx="0" cy="0" r="3.8" fill="${rim}" />
                <circle cx="0" cy="0" r="2.9" fill="${col}" />
                <circle cx="-0.9" cy="-0.9" r="1.0" fill="${hl}" opacity="0.78" />
                <circle cx="-5.5" cy="-3.5" r="2.2" fill="${dark}" />
                <circle cx="-5.5" cy="-3.5" r="1.7" fill="${col}" />
                <circle cx="6.2" cy="-2.4" r="2.4" fill="${dark}" />
                <circle cx="6.2" cy="-2.4" r="1.8" fill="${col}" />
                <circle cx="2.8" cy="5.2" r="1.9" fill="${dark}" />
                <circle cx="2.8" cy="5.2" r="1.4" fill="${col}" />
                <circle cx="-4.2" cy="4.4" r="1.6" fill="${col}" />
                <circle cx="0.5" cy="-6.2" r="1.3" fill="${col}" />
                <circle cx="8.5" cy="2.5" r="1.1" fill="${col}" />
              `;
            } else {
              inner = `
                <path d="${buildOrganicBlobPath(6.4, 4.9, 8, seed)}" fill="${rim}" opacity="0.96" />
                <path d="${buildOrganicBlobPath(5.1, 3.8, 8, seed + 2.1)}" fill="${col}" opacity="0.95" />
                <ellipse cx="0" cy="0" rx="2.8" ry="2.1" fill="${dark}" opacity="0.65" />
                <circle cx="-1.5" cy="-1.2" r="1.3" fill="${hl}" opacity="0.78" />
                <circle cx="-6.5" cy="-4.5" r="1.9" fill="${col}" />
                <circle cx="7.2" cy="3.4" r="2.2" fill="${col}" />
                <circle cx="-4.8" cy="5.6" r="1.6" fill="${col}" />
                <circle cx="5.2" cy="-5.4" r="1.7" fill="${col}" />
              `;
            }
            return `
              <g transform="translate(${x}, ${y}) rotate(${rot}) scale(${sc})" opacity="${op}">
                ${inner}
              </g>
            `;
          })
          .join("")}
      </svg>
    </div>
  `;
}

function ensureFxCanvas(container) {
  if (typeof document === "undefined") return false;
  const stage = container?.querySelector?.("#battlefield-stage") || document.getElementById("battlefield-stage");
  stageEl = stage || null;
  if (fxCanvas && fxCanvas.isConnected && fxCtx) {
    if (stage && fxCanvas.parentElement !== stage) {
      stage.appendChild(fxCanvas);
      resizeFxCanvas();
    }
    return true;
  }
  const existing = stage?.querySelector?.("#blood-fx-canvas");
  if (existing) {
    fxCanvas = existing;
    fxCtx = fxCanvas.getContext("2d");
    return Boolean(fxCtx);
  }
  fxCanvas = document.createElement("canvas");
  fxCanvas.id = "blood-fx-canvas";
  fxCanvas.className = "blood-fx-layer";
  fxCanvas.setAttribute("aria-hidden", "true");
  if (stage) stage.appendChild(fxCanvas);
  else document.body.appendChild(fxCanvas);
  fxCtx = fxCanvas.getContext("2d");
  return Boolean(fxCtx);
}

function resizeFxCanvas() {
  if (!fxCanvas || !fxCtx) return;
  const stage = fxCanvas.parentElement?.id === "battlefield-stage" ? fxCanvas.parentElement : document.getElementById("battlefield-stage");
  stageEl = stage || stageEl;
  if (stage) stageRect = stage.getBoundingClientRect();
  if (!stageRect || stageRect.width < 2) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(stageRect.width));
  const h = Math.max(1, Math.round(stageRect.height));
  if (fxCanvas.width !== Math.round(w * dpr) || fxCanvas.height !== Math.round(h * dpr)) {
    fxCanvas.width = Math.round(w * dpr);
    fxCanvas.height = Math.round(h * dpr);
  }
  if (fxCanvas.parentElement === stage) {
    fxCanvas.style.position = "absolute";
    fxCanvas.style.left = "0px";
    fxCanvas.style.top = "0px";
    fxCanvas.style.width = "100%";
    fxCanvas.style.height = "100%";
  } else {
    fxCanvas.style.position = "fixed";
    fxCanvas.style.left = `${stageRect.left}px`;
    fxCanvas.style.top = `${stageRect.top}px`;
    fxCanvas.style.width = `${w}px`;
    fxCanvas.style.height = `${h}px`;
  }
  fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function getCellOrigin(container, cellIdx) {
  const stage = container?.querySelector?.("#battlefield-stage") || document.getElementById("battlefield-stage");
  const cellEl = container?.querySelector?.(`.board-cell[data-cell-index="${cellIdx}"]`);
  if (!stage || !cellEl) return null;
  const sprite = cellEl.querySelector(".entity-sprite-img");
  const stone = cellEl.querySelector(".cell-floor-stone");
  const sRect = stage.getBoundingClientRect();
  const cRect = cellEl.getBoundingClientRect();
  const spRect = sprite ? sprite.getBoundingClientRect() : cRect;
  const flRect = stone ? stone.getBoundingClientRect() : null;
  stageRect = sRect;
  stageEl = stage;
  const gMin = flRect ? flRect.top - sRect.top + 6 : cRect.bottom - sRect.top - 32;
  const gMax = flRect ? flRect.bottom - sRect.top - 4 : cRect.bottom - sRect.top - 10;
  return {
    x: spRect.left - sRect.left + spRect.width * 0.5,
    y: spRect.top - sRect.top + spRect.height * (sprite ? 0.44 : 0.55),
    groundMin: Math.max(20, gMin),
    groundMax: Math.min(sRect.height - 6, Math.max(gMin + 8, gMax)),
    ground: Math.min(sRect.height - 8, (gMin + gMax) * 0.5),
    cellIdx: Number(cellIdx),
    cellLeft: cRect.left - sRect.left,
    cellWidth: cRect.width
  };
}

function pushParticle(p) {
  particles.push(p);
  if (particles.length > MAX_PARTICLES) {
    particles.splice(0, particles.length - MAX_PARTICLES);
  }
}

function emitParticles(origin, ichor, amount, profile, timeMul, fatal = false) {
  const reduced = prefersReducedMotion();
  const pal = PALETTE[ichor] || PALETTE.red;
  let count = Math.round((36 + Math.min(64, (amount || 1) * 12)) * profile.countMul);
  if (reduced) count = Math.min(16, count);
  count = Math.max(profile.style === "drip" ? 14 : 28, Math.min(count, reduced ? 16 : 120));

  if (!reduced) {
    pushParticle({
      x: origin.x,
      y: origin.y,
      vx: 0,
      vy: 0,
      grav: 0,
      drag: 1,
      r: fatal ? 28 : 18,
      maxR: fatal ? 68 : 44,
      life: 240 * timeMul,
      maxLife: 240 * timeMul,
      color: pal.mid[1] || "#dc2626",
      glowColor: pal.glow,
      kind: "flash",
      ichor,
      ground: origin.ground
    });
  }

  for (let i = 0; i < count; i++) {
    const kind = pickParticleKind(ichor, profile.style, fatal);
    const ang = profile.angle + rand(-profile.spread, profile.spread);
    const spdMul = kind === "mist" ? 0.52 : kind === "glob" ? 0.78 : kind === "jet" ? 1.42 : kind === "spurt" ? 1.25 : 1;
    const spd = rand(profile.speed[0], profile.speed[1]) * spdMul;
    const life =
      (kind === "mist"
        ? rand(480, 960)
        : kind === "glob"
        ? rand(560, 1020)
        : kind === "jet"
        ? rand(420, 820)
        : kind === "spurt"
        ? rand(360, 740)
        : rand(400, 840)) * timeMul;
    const grav = kind === "bubble" ? -0.04 : kind === "mist" ? (ichor === "blue" ? -0.014 : 0.018) : kind === "spark" ? 0.02 : ichor === "green" ? 0.165 : 0.14;
    const r =
      kind === "glob"
        ? rand(3.8, 6.8)
        : kind === "mist"
        ? rand(5, 11.5)
        : kind === "spark"
        ? rand(1.2, 2.4)
        : kind === "jet"
        ? rand(2.4, 4.4)
        : kind === "spurt"
        ? rand(2, 3.9)
        : rand(1.6, 3.4);
    const px = origin.x + rand(-10, 10);
    const py = origin.y + rand(-16, 12);
    const gnd = rand(origin.groundMin || origin.ground - 10, origin.groundMax || origin.ground + 6);

    pushParticle({
      x: px,
      y: py,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      grav,
      drag: kind === "mist" ? 0.982 : 0.992,
      r,
      life,
      maxLife: life,
      color: pickParticleColor(ichor, kind),
      rimColor: pal.stainRim,
      highlight: pal.highlight,
      ichor,
      kind,
      ground: gnd,
      rot: rand(0, Math.PI)
    });
  }
}

function stepParticles(dt) {
  const next = [];
  const step = dt / 16.67;
  for (const p of particles) {
    p.life -= dt;
    if (p.life <= 0) continue;
    if (p.kind === "flash") {
      p.r += (p.maxR - p.r) * 0.2 * step;
      next.push(p);
    } else if (p.kind !== "stain") {
      p.vy += p.grav * step;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.x += p.vx * step;
      p.y += p.vy * step;
      if (p.kind !== "mist" && p.kind !== "bubble" && p.kind !== "spark" && p.y >= p.ground && p.vy > 0.18) {
        p.kind = "stain";
        p.y = p.ground;
        p.vx *= 0.08;
        p.vy = 0;
        p.grav = 0;
        p.r *= 1.3;
        p.life = Math.min(p.life, 540);
      }
      next.push(p);
    } else {
      next.push(p);
    }
  }
  particles = next;
}

function drawParticles() {
  if (!fxCtx || !fxCanvas) return;
  fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
  for (const p of particles) {
    const ratio = Math.max(0, Math.min(1, p.life / p.maxLife));
    const alpha = p.kind === "mist" ? ratio * 0.46 : p.kind === "flash" ? ratio * 0.55 : ratio;
    fxCtx.globalAlpha = Math.max(0, Math.min(1, alpha));
    fxCtx.fillStyle = p.color;
    if (p.kind === "flash") {
      const grad = fxCtx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.r);
      grad.addColorStop(0, p.color);
      grad.addColorStop(0.55, p.glowColor || p.color);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      fxCtx.fillStyle = grad;
      fxCtx.beginPath();
      fxCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      fxCtx.fill();
    } else {
      fxCtx.beginPath();
      fxCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      fxCtx.fill();
    }
  }
  fxCtx.globalAlpha = 1;
}

function tickFrame(ts) {
  const dt = Math.min(34, lastFrameTime ? ts - lastFrameTime : 16.67);
  lastFrameTime = ts;
  resizeFxCanvas();
  stepParticles(dt);
  drawParticles();
  if (particles.length > 0) {
    rafId = requestAnimationFrame(tickFrame);
  } else {
    rafId = 0;
    lastFrameTime = 0;
    if (fxCtx && fxCanvas) fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
  }
}

function startLoop() {
  if (!rafId) rafId = requestAnimationFrame(tickFrame);
}

export function spawnBloodBurst(container, opts = {}) {
  const ichor = opts.ichor;
  if (!ichor || !PALETTE[ichor] || !ensureFxCanvas(container)) return;
  const origin = getCellOrigin(container, opts.cell);
  if (!origin) return;
  resizeFxCanvas();
  const profile = computeSprayProfile(opts.reason, opts.attackerCell, opts.cell, opts.fatal);
  const spd = opts.animSpeed > 0 ? opts.animSpeed : 1;
  const timeMul = prefersReducedMotion() ? 0.45 : 1 / Math.min(spd, 2.4);
  emitParticles(origin, ichor, opts.amount || 1, profile, timeMul, opts.fatal);
  startLoop();
}
