// @ts-nocheck
import { NODE_TYPES } from "../config/constants.js";
import { STRINGS } from "../config/strings.cs.js";
import { getCurseDefinition } from "../config/curses.js";
import { getAvailableNodes as getAvailableMapNodes } from "../engine/run.js";
import { getAssetUrl } from "./assets.js";

export function renderMapScreen(container, runState, callbacks = {}) {
  if (!container || !runState || !runState.map) return;
  const availableNodes = callbacks.canReturnToBattle ? [] : getAvailableMapNodes(runState);
  const availableIds = new Set(availableNodes.map((n) => n.id));
  const completedIds = new Set(runState.completedNodeIds || []);

  const tiersHtml = [0, 1, 2, 3, 4, 5]
    .map((tierIdx) => {
      const nodesHtml = runState.map.nodes
        .filter((n) => n.tier === tierIdx)
        .map((node) => {
          const isAvailable = availableIds.has(node.id);
          const isCompleted = completedIds.has(node.id);
          const isCurrent = runState.currentNodeId === node.id;
          const iconUrl = getAssetUrl(getNodeAssetKey(node.type), node.title);

          let stateClass = "map-node-locked";
          if (isCompleted) stateClass = "map-node-completed";
          if (isCurrent) {
            stateClass = callbacks.canReturnToBattle ? "map-node-current map-node-active" : "map-node-current";
          }
          if (isAvailable) stateClass = "map-node-available";
          const disabled = !isAvailable && (!isCurrent || !callbacks.canReturnToBattle);

          const isCombat = node.type === NODE_TYPES.BATTLE || node.type === NODE_TYPES.ELITE || node.type === NODE_TYPES.BOSS;
          const threatLevel = node.threatRating || (node.type === NODE_TYPES.ELITE ? 4 : node.type === NODE_TYPES.BOSS ? 5 : 2);

          let threatSkulls = "";
          if (isCombat) {
            const count = Math.min(5, Math.max(1, Number(threatLevel) || 1));
            threatSkulls = "💀".repeat(count);
          }

          return `
            <button type="button"
                    class="map-node-card ${stateClass} map-lane-${node.lane}"
                    data-node-id="${node.id}"
                    data-tier="${node.tier}"
                    data-lane="${node.lane}"
                    title="${escapeHtml(node.tacticalHint || node.title)}"
                    ${disabled ? "disabled" : ""}>
              
              <div class="map-node-top-meta">
                <span class="map-node-route-label">${node.routeTag || getLaneLabel(node.lane)}</span>
                ${isCombat ? `<span class="map-node-threat-text" title="Hrozba ${threatLevel}/5">${threatSkulls}</span>` : ""}
              </div>

              <div class="map-node-body">
                <div class="map-node-icon-wrap">
                  <img src="${iconUrl}" alt="${node.title}" class="map-node-icon" referrerpolicy="no-referrer" />
                  ${isCompleted ? `<span class="map-node-check">✔</span>` : ""}
                  ${node.type === NODE_TYPES.ELITE ? `<span class="map-node-elite-badge" title="Elitní střet">★</span>` : ""}
                </div>

                <div class="map-node-info">
                  <div class="map-node-title">${node.title}</div>
                  <div class="map-node-archetype">
                    ${callbacks.canReturnToBattle && isCurrent ? "⚔️ Právě bojuješ!" : (node.archetypeName || getNodeSubtitle(node.type))}
                  </div>
                  ${node.tacticalHint ? `<div class="map-node-hint-preview">${node.tacticalHint}</div>` : ""}
                </div>
              </div>
            </button>
          `;
        })
        .join("");

      const tierRoman = ["Etapa I", "Etapa II", "Etapa III", "Etapa IV", "Etapa V", "Etapa VI"][tierIdx] || `Etapa ${tierIdx + 1}`;
      const tierSub = getTierStrategicPurpose(tierIdx);

      return `
        <div class="map-tier-column" data-tier-idx="${tierIdx}">
          <div class="map-tier-header">
            <div class="map-tier-label">${tierRoman}</div>
            <div class="map-tier-sub">${tierSub}</div>
          </div>
          <div class="map-tier-nodes">${nodesHtml}</div>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="map-screen-wrapper">
      <div class="map-header-banner">
        <div>
          <div class="map-header-kicker">
            ⚜️ C. a k. Katastrální revírní mapa výpravy · Zámek Nochtice ⚜️
          </div>
          <h2 class="map-act-heading">${STRINGS.acts[runState.act] || `Akt ${runState.act}`}</h2>
          ${runState.curseLevel > 0 ? `<div class="map-curse-pill">🌙 ${getCurseDefinition(runState.curseLevel).name}</div>` : ""}
          <p class="map-act-subtitle">${
            callbacks.canReturnToBattle
              ? `Šarvátka právě probíhá — pokračuj úředním rozkazem vpravo.`
              : `Zvol taktický revír postupu pro lovce (${runState.hunterName || "Lovec"}). Cesty nahoře skýtají větší riziko i kořist.`
          }</p>
        </div>

        <div class="map-header-actions">
          <div class="map-route-legend">
            <span class="legend-item legend-north">⚔️ Severní výspa (Vysoké riziko)</span>
            <span class="legend-sep">·</span>
            <span class="legend-item legend-center">⚖️ Císařská silnice (Vyvážená)</span>
            <span class="legend-sep">·</span>
            <span class="legend-item legend-south">🍺 Hradební úvoz (Zásobovací)</span>
          </div>
          ${callbacks.canReturnToBattle ? `<button type="button" class="btn-parchment" id="btn-return-battle">⚔️ Zpět do šarvátky</button>` : ""}
        </div>
      </div>

      <div class="map-tiers-container" id="map-tiers-container">
        <div class="map-scroll-plane" id="map-scroll-plane">
          <svg class="map-connections-svg" id="map-connections-svg" xmlns="http://www.w3.org/2000/svg"></svg>
          <div class="map-tiers-grid">
            ${tiersHtml}
          </div>
        </div>
      </div>
    </div>
  `;

  // Draw SVG connection lines connecting DAG edges
  requestAnimationFrame(() => {
    drawMapConnections(container, runState, availableIds, completedIds);
  });

  // Attach safe, single-instance ResizeObserver
  if (container._mapResizeObserver) {
    container._mapResizeObserver.disconnect();
    container._mapResizeObserver = null;
  }
  const resizeTarget = container.querySelector("#map-scroll-plane") || container.querySelector("#map-tiers-container");
  if (resizeTarget && typeof window !== "undefined" && window.ResizeObserver) {
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        drawMapConnections(container, runState, availableIds, completedIds);
      });
    });
    ro.observe(resizeTarget);
    container._mapResizeObserver = ro;
  }

  container.querySelector("#btn-return-battle")?.addEventListener("click", () => {
    callbacks.onReturnToBattle?.();
  });

  container.querySelectorAll("[data-node-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nodeId = btn.getAttribute("data-node-id");
      const node = runState.map.nodes.find((n) => n.id === nodeId);
      if (!node) return;
      if (callbacks.canReturnToBattle) {
        if (node.id === runState.currentNodeId) callbacks.onReturnToBattle?.();
      } else if (availableIds.has(node.id)) {
        callbacks.onSelectNode?.(node);
      }
    });
  });
}

/**
 * Calculates node center coordinates and renders smooth bezier curve rails for all DAG edges.
 */
function drawMapConnections(container, runState, availableIds, completedIds) {
  const svg = container.querySelector("#map-connections-svg");
  const scrollPlane = container.querySelector("#map-scroll-plane");
  if (!svg || !scrollPlane || !runState || !runState.map) return;

  const planeRect = scrollPlane.getBoundingClientRect();
  if (planeRect.width <= 0 || planeRect.height <= 0) return;

  svg.setAttribute("viewBox", `0 0 ${planeRect.width} ${planeRect.height}`);
  svg.style.width = `${planeRect.width}px`;
  svg.style.height = `${planeRect.height}px`;

  const nodeMap = new Map();
  runState.map.nodes.forEach((n) => nodeMap.set(n.id, n));

  const cardRects = new Map();
  container.querySelectorAll("[data-node-id]").forEach((el) => {
    const id = el.getAttribute("data-node-id");
    const r = el.getBoundingClientRect();
    cardRects.set(id, {
      x: r.left - planeRect.left + r.width / 2,
      y: r.top - planeRect.top + r.height / 2,
      right: r.right - planeRect.left,
      left: r.left - planeRect.left
    });
  });

  let pathsHtml = "";

  runState.map.nodes.forEach((fromNode) => {
    const fromPos = cardRects.get(fromNode.id);
    if (!fromPos || !Array.isArray(fromNode.next)) return;

    fromNode.next.forEach((toId) => {
      const toPos = cardRects.get(toId);
      if (!toPos) return;

      const isTraversed =
        completedIds.has(fromNode.id) &&
        (completedIds.has(toId) || runState.currentNodeId === toId);

      const isAvailableChoice =
        (completedIds.has(fromNode.id) || (!runState.currentNodeId && fromNode.tier === 0)) &&
        availableIds.has(toId);

      let lineClass = "map-edge-inactive";
      if (isTraversed) {
        lineClass = "map-edge-traversed";
      } else if (isAvailableChoice) {
        lineClass = "map-edge-available";
      }

      const x1 = fromPos.right - 2;
      const y1 = fromPos.y;
      const x2 = Math.max(x1 + 10, toPos.left + 2);
      const y2 = toPos.y;
      const dx = Math.max(16, (x2 - x1) * 0.5);

      const d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${(x1 + dx).toFixed(1)} ${y1.toFixed(1)}, ${(x2 - dx).toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;

      pathsHtml += `
        <path d="${d}" class="map-connection-path ${lineClass}" />
      `;
    });
  });

  svg.innerHTML = pathsHtml;
}

function getLaneLabel(lane) {
  if (lane === 0) return "Severní výspa";
  if (lane === 1) return "Císařská silnice";
  return "Hradební úvoz";
}

function getTierStrategicPurpose(tierIdx) {
  switch (tierIdx) {
    case 0:
      return "Průlom hradeb";
    case 1:
      return "Rozcestí hlídek";
    case 2:
      return "Srdce revíru";
    case 3:
      return "Předpolí pevnosti";
    case 4:
      return "Poslední zbrojení";
    case 5:
      return "Trůnní komnata";
    default:
      return "";
  }
}

function getNodeAssetKey(type) {
  switch (type) {
    case NODE_TYPES.BATTLE:
      return "map.battle";
    case NODE_TYPES.ELITE:
      return "map.elite";
    case NODE_TYPES.PUB:
      return "map.pub";
    case NODE_TYPES.WORKSHOP:
      return "map.workshop";
    case NODE_TYPES.EVENT:
      return "map.event";
    case NODE_TYPES.TREASURE:
      return "map.treasure";
    case NODE_TYPES.BOSS:
      return "map.boss";
    default:
      return "map.battle";
  }
}

function getNodeSubtitle(type) {
  switch (type) {
    case NODE_TYPES.BATTLE:
      return "Běžná šarvátka";
    case NODE_TYPES.ELITE:
      return "Tuhý protivník · Bohatší kořist";
    case NODE_TYPES.PUB:
      return "Léčení · Pivo · Obchod";
    case NODE_TYPES.WORKSHOP:
      return "Vylepšení destičky";
    case NODE_TYPES.EVENT:
      return "Příběhové rozhodnutí";
    case NODE_TYPES.TREASURE:
      return "Talisman nebo dukáty zdarma";
    case NODE_TYPES.BOSS:
      return "Vládce patra";
    default:
      return "";
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
