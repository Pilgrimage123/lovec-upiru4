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
          return `
            <button type="button"
                    class="map-node-card ${stateClass}"
                    data-node-id="${node.id}"
                    ${disabled ? "disabled" : ""}>
              <div class="map-node-icon-wrap">
                <img src="${iconUrl}" alt="${node.title}" class="map-node-icon" referrerpolicy="no-referrer" />
                ${isCompleted ? `<span class="map-node-check">✔</span>` : ""}
              </div>
              <div class="map-node-info">
                <div class="map-node-title">${node.title}</div>
                <div class="map-node-sub">${callbacks.canReturnToBattle && isCurrent ? "⚔️ Právě bojuješ!" : getNodeSubtitle(node.type)}</div>
              </div>
            </button>
          `;
        })
        .join("");

      const tierRoman = ["Etapa I", "Etapa II", "Etapa III", "Etapa IV", "Etapa V", "Etapa VI"][tierIdx] || `Etapa ${tierIdx + 1}`;
      return `
        <div class="map-tier-column">
          <div class="map-tier-label">${tierRoman}</div>
          <div class="map-tier-nodes">${nodesHtml}</div>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="map-screen-wrapper">
      <div class="map-header-banner">
        <div>
          <div style="font-family: var(--font-display, serif); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.12em; color: var(--stamp-red, #991b1b); text-transform: uppercase; margin-bottom: 2px;">
            ⚜️ C. a k. Katastrální revírní mapa výpravy ⚜️
          </div>
          <h2 class="map-act-heading">${STRINGS.acts[runState.act] || `Akt ${runState.act}`}</h2>
          ${runState.curseLevel > 0 ? `<div class="map-curse-pill">🌙 ${getCurseDefinition(runState.curseLevel).name}</div>` : ""}
          <p class="map-act-subtitle">${
            callbacks.canReturnToBattle
              ? `Šarvátka právě probíhá — pokračuj úředním rozkazem vpravo.`
              : `Zvol další revír cesty k zámku Nochtice (${runState.hunterName || "Lovec"}).`
          }</p>
        </div>
        ${callbacks.canReturnToBattle ? `<button type="button" class="btn-parchment" id="btn-return-battle">⚔️ Zpět do šarvátky</button>` : ""}
      </div>

      <div class="map-tiers-grid">
        ${tiersHtml}
      </div>
    </div>
  `;

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
      } else {
        callbacks.onSelectNode?.(node);
      }
    });
  });
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
