// @ts-nocheck
import { NODE_TYPES } from './config/constants.js';
import { createBattleState } from './engine/state.js';
import { createNewRun } from './engine/run.js';
import { pickRandomEvent } from './engine/events.js';
import { initAssets } from './ui/assets.js';
import { renderHud } from './ui/hud.js';
import { renderBattleBoard, refreshBoardOverlays } from './ui/renderer.js';
import { renderTileBar } from './ui/tileBar.js';
import { renderChronicleLog } from './ui/log.js';
import { renderMapScreen } from './ui/mapScreen.js';
import {
  closeModal,
  openRulesModal,
  openFullLogModal,
  openSettingsModal,
  openPubModal,
  openWorkshopModal,
  openEventModal,
  openTreasureModal,
  openCastleArchiveModal
} from './ui/modal.js';
import { initTooltips } from './ui/tooltips.js';
import { initKeyboardInput } from './ui/input.js';
import { setSoundEnabled } from './ui/audio.js';
import { clearBattleBlood } from './ui/blood.js';
import { createBattleActions } from './battle.js';

const META_STORAGE_KEY = 'lovec_upiru_meta_v1';

const loadedMeta = loadMetaStats();

export const appState = {
  screen: 'battle',
  runState: null,
  battleState: null,
  isAnimating: false,
  hoveredEnemyId: null,
  hoveredTileId: null,
  comboPreviewActive: false,
  hoveredExecute: false,
  hoveredQueueSlot: null,
  metaStats: loadedMeta,
  settings: {
    animSpeed: loadedMeta.animSpeed ?? 1,
    soundEnabled: loadedMeta.soundEnabled ?? true,
    currentSeed: loadedMeta.lastSeed || 'VENCA-1899'
  }
};

let actions = null;
let bootToken = 0;

export function startGame() {
  const token = ++bootToken;
  return bootstrap(token);
}

export function returnToTitleScreen() {
  appState.screen = 'title';
  window.dispatchEvent(new CustomEvent('open-title-screen'));
}

function loadMetaStats() {
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        fangs: 0,
        unlockedLoadouts: ['classic', 'honza', 'dragoun', 'zlodejka'],
        selectedLoadout: 'classic',
        ...p,
        unlockedLoadouts: Array.isArray(p.unlockedLoadouts) && p.unlockedLoadouts.length >= 4
          ? p.unlockedLoadouts
          : ['classic', 'honza', 'dragoun', 'zlodejka']
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    bestAct: 1,
    victories: 0,
    totalKills: 0,
    lastSeed: 'VENCA-1899',
    fangs: 15,
    unlockedLoadouts: ['classic', 'honza', 'dragoun', 'zlodejka'],
    selectedLoadout: 'classic'
  };
}

function saveMetaStats() {
  try {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(appState.metaStats));
  } catch {
    // ignore storage errors
  }
}

async function bootstrap(token) {
  initTooltips();
  setSoundEnabled(appState.settings.soundEnabled);

  const loadingBar = document.getElementById('loading-progress-fill');
  const loadingText = document.getElementById('loading-progress-text');
  const loadingScreen = document.getElementById('loading-overlay');

  await initAssets((loaded, total, key) => {
    if (token !== bootToken) return;
    const pct = total > 0 ? Math.round((loaded / total) * 100) : 100;
    if (loadingBar) loadingBar.style.width = `${pct}%`;
    if (loadingText) loadingText.textContent = `Načítám pergameny a postavy (${loaded}/${total}): ${key}...`;
  });

  if (token !== bootToken) return;

  if (loadingScreen) loadingScreen.classList.add('hidden');

  actions = createBattleActions({
    appState,
    renderAll,
    appendEventsToLog,
    startNewRun,
    completeCurrentNodeAndShowMap
  });

  if (!window.__lovecAssetListener) {
    window.__lovecAssetListener = true;
    window.addEventListener('lovec-assets', () => {
      if (!appState.isAnimating && appState.battleState) renderAll();
    });
  }

  initKeyboardInput({
    isInputLocked: () =>
      appState.isAnimating ||
      appState.screen !== 'battle' ||
      !document.getElementById('modal-root')?.classList.contains('hidden'),
    onStep: (dir) => actions.handlePlayerStep(dir),
    onTurn: () => actions.handlePlayerTurn(),
    onWait: () => actions.handlePlayerWait(),
    onExecuteQueue: () => {
      appState.comboPreviewActive = false;
      actions.handleExecuteOrPrepareQueue();
    },
    onHoverExecute: (hovered) => {
      if (appState.hoveredExecute !== hovered) {
        appState.hoveredExecute = hovered;
        renderBattleBoardOnly();
      }
    },
    onToggleComboPreview: () => {
      appState.comboPreviewActive = !appState.comboPreviewActive;
      renderAll();
    },
    onPopQueue: () => {
      if (appState.battleState && appState.battleState.queue.length > 0) {
        actions.handleRemoveQueueSlot(appState.battleState.queue.length - 1);
      }
    },
    onHotkeyTile: (idx) => {
      const tile = appState.battleState?.hand[idx];
      if (tile) actions.handleSelectTile(tile.instanceId);
    },
    onOpenRules: () => openRulesModal(document.getElementById('modal-root')),
    onEscape: () => {
      const modalRoot = document.getElementById('modal-root');
      if (modalRoot && !modalRoot.classList.contains('hidden')) {
        const closeBtn = modalRoot.querySelector('#btn-modal-close, #btn-leave-pub, #btn-leave-workshop, #btn-skip-reward, #btn-treasure-done, #btn-event-continue');
        if (closeBtn) {
          closeBtn.click();
        } else {
          closeModal(modalRoot);
        }
      } else if (appState.screen === 'map' && appState.battleState && appState.battleState.status === 'playing') {
        appState.screen = 'battle';
        renderAll();
      }
    }
  });

  if (!window.__lovecTitleListener) {
    window.__lovecTitleListener = true;
    window.addEventListener('open-title-screen', () => {
      appState.screen = 'title';
    });
    window.addEventListener('start-hunt', (e) => {
      const detail = e.detail || {};
      startNewRun(detail.seed, detail.hunterId, detail.curseLevel);
    });
  }

  startNewRun(appState.metaStats.lastSeed || 'VENCA-1899');
}

export function startNewRun(seedInput = 'VENCA-1899', loadoutId = null, curseLevel = null) {
  clearBattleBlood();
  appState.settings.currentSeed = seedInput;
  appState.metaStats.lastSeed = seedInput;
  if (loadoutId) {
    appState.metaStats.selectedLoadout = loadoutId;
  }
  if (typeof curseLevel === 'number') {
    appState.metaStats.selectedCurse = curseLevel;
  }
  saveMetaStats();

  const chosenLoadout = loadoutId || appState.metaStats.selectedLoadout || 'classic';
  const cLevel = typeof curseLevel === 'number' ? curseLevel : (appState.metaStats.selectedCurse || 0);
  appState.runState = createNewRun(seedInput, chosenLoadout, cLevel);
  const firstNode = appState.runState.map.nodes[0];
  enterMapNode(firstNode);
}

function enterMapNode(node) {
  const run = appState.runState;
  const modalRoot = document.getElementById('modal-root');
  run.currentNodeId = node.id;

  if (
    node.type === NODE_TYPES.BATTLE ||
    node.type === NODE_TYPES.ELITE ||
    node.type === NODE_TYPES.BOSS
  ) {
    clearBattleBlood();
    appState.screen = 'battle';
    appState.battleState = createBattleState({
      seed: `${run.seed}_${node.id}`,
      rng: run.rng,
      encounterId: node.encounterId,
      heroMaxHp: run.heroMaxHp,
      heroHp: run.heroHp,
      deck: run.deck,
      talismans: run.talismans,
      curseLevel: run.curseLevel || 0,
      hunterId: run.hunterId || run.loadoutId || 'classic'
    });
    renderAll();
    return;
  }

  if (node.type === NODE_TYPES.PUB) {
    renderAll();
    openPubModal(
      modalRoot,
      run,
      () => {
        completeCurrentNodeAndShowMap();
      },
      () => renderAll()
    );
    return;
  }

  if (node.type === NODE_TYPES.WORKSHOP) {
    renderAll();
    openWorkshopModal(
      modalRoot,
      run,
      () => {
        completeCurrentNodeAndShowMap();
      },
      () => renderAll()
    );
    return;
  }

  if (node.type === NODE_TYPES.EVENT) {
    renderAll();
    const evDef = pickRandomEvent(run);
    openEventModal(
      modalRoot,
      run,
      evDef,
      () => {
        completeCurrentNodeAndShowMap();
      },
      () => renderAll()
    );
    return;
  }

  if (node.type === NODE_TYPES.TREASURE) {
    renderAll();
    openTreasureModal(
      modalRoot,
      run,
      () => {
        completeCurrentNodeAndShowMap();
      },
      () => renderAll()
    );
  }
}

function completeCurrentNodeAndShowMap() {
  const run = appState.runState;
  if (run.currentNodeId && !run.completedNodeIds.includes(run.currentNodeId)) {
    run.completedNodeIds.push(run.currentNodeId);
  }
  appState.battleState = null;
  appState.screen = 'map';
  renderAll();
}

function appendEventsToLog(state, events = [], turnOverride = null) {
  if (!state || !state.log || !Array.isArray(events)) return;
  const turnNum = turnOverride ?? state.turn;
  const turnTag = `[Kolo ${turnNum}]`;
  for (const ev of events) {
    if (ev.type === 'log' && ev.text) {
      const formatted = ev.text.startsWith('[Kolo')
        ? ev.text
        : `${turnTag} ${ev.text}`;
      state.log.push(formatted);
    }
  }
}

function renderAll() {
  const hudRoot = document.getElementById('hud-root');
  const centerStage = document.getElementById('center-stage');
  const bottomRoot = document.getElementById('bottom-root');
  const logRoot = document.getElementById('log-root');
  const modalRoot = document.getElementById('modal-root');

  renderHud(hudRoot, appState.runState, appState.battleState, {
    metaStats: appState.metaStats,
    isMapScreen: appState.screen === 'map' || !appState.battleState,
    onOpenTitleScreen: () => returnToTitleScreen(),
    onOpenArchive: () => {
      openCastleArchiveModal(
        modalRoot,
        appState,
        () => renderAll(),
        (loadoutId) => {
          appState.metaStats.selectedLoadout = loadoutId;
          saveMetaStats();
          renderAll();
        }
      );
    },
    onToggleMap: () => {
      if (appState.screen === 'map' && appState.battleState) {
        appState.screen = 'battle';
      } else {
        appState.screen = 'map';
      }
      renderAll();
    },
    onOpenRules: () => openRulesModal(modalRoot),
    onOpenSettings: () =>
      openSettingsModal(modalRoot, appState.settings, appState.metaStats, {
        onChangeAnimSpeed: (val) => {
          appState.settings.animSpeed = val;
          appState.metaStats.animSpeed = val;
          saveMetaStats();
        },
        onToggleSound: (enabled) => {
          appState.settings.soundEnabled = enabled;
          appState.metaStats.soundEnabled = enabled;
          saveMetaStats();
          setSoundEnabled(enabled);
        },
        onStartNewRun: (seed) => startNewRun(seed)
      })
  });

  if (appState.screen === 'map' || !appState.battleState) {
    renderMapScreen(centerStage, appState.runState, {
      canReturnToBattle: Boolean(appState.battleState && appState.battleState.status === 'playing'),
      onReturnToBattle: () => {
        appState.screen = 'battle';
        renderAll();
      },
      onSelectNode: (node) => {
        if (appState.battleState && appState.battleState.status === 'playing') return;
        enterMapNode(node);
      }
    });
    if (bottomRoot) bottomRoot.innerHTML = '';
    if (logRoot) logRoot.innerHTML = '';
    return;
  }

  renderBattleBoard(
    centerStage,
    appState.battleState,
    {
      hoveredEnemyId: appState.hoveredEnemyId,
      hoveredTileId: appState.hoveredTileId,
      comboPreviewActive: appState.comboPreviewActive,
      hoveredExecute: appState.hoveredExecute,
      hoveredQueueSlot: appState.hoveredQueueSlot
    },
    {
      onRemoveQueueSlot: (slotIdx) => actions.handleRemoveQueueSlot(slotIdx),
      onReorderQueue: (fromIdx, toIdx) => actions.handleReorderQueue(fromIdx, toIdx),
      onHoverQueueSlot: (slotIdx) => {
        if (appState.hoveredQueueSlot !== slotIdx) {
          appState.hoveredQueueSlot = slotIdx;
          renderBattleBoardOnly();
        }
      },
      onHoverEnemy: (enemyId) => {
        if (appState.hoveredEnemyId !== enemyId) {
          appState.hoveredEnemyId = enemyId;
          renderBattleBoardOnly();
        }
      }
    }
  );

  renderTileBar(bottomRoot, appState.battleState, {
    isComboPreviewActive: appState.comboPreviewActive,
    onStep: (dir) => actions.handlePlayerStep(dir),
    onTurn: () => actions.handlePlayerTurn(),
    onWait: () => actions.handlePlayerWait(),
    onExecuteQueue: () => {
      appState.comboPreviewActive = false;
      actions.handleExecuteOrPrepareQueue();
    },
    onHoverExecute: (hovered) => {
      if (appState.hoveredExecute !== hovered) {
        appState.hoveredExecute = hovered;
        renderBattleBoardOnly();
      }
    },
    onToggleComboPreview: () => {
      appState.comboPreviewActive = !appState.comboPreviewActive;
      renderBattleBoardOnly();
      renderTileBar(bottomRoot, appState.battleState, {
        isComboPreviewActive: appState.comboPreviewActive,
        onStep: (dir) => actions.handlePlayerStep(dir),
        onTurn: () => actions.handlePlayerTurn(),
        onWait: () => actions.handlePlayerWait(),
        onExecuteQueue: () => {
          appState.comboPreviewActive = false;
          actions.handleExecuteOrPrepareQueue();
        },
        onHoverExecute: (hovered) => {
          if (appState.hoveredExecute !== hovered) {
            appState.hoveredExecute = hovered;
            renderBattleBoardOnly();
          }
        },
        onToggleComboPreview: () => {
          appState.comboPreviewActive = !appState.comboPreviewActive;
          renderAll();
        },
        onSelectTile: (instanceId) => actions.handleSelectTile(instanceId),
        onHoverTile: (instanceId) => {
          if (appState.hoveredTileId !== instanceId) {
            appState.hoveredTileId = instanceId;
            renderBattleBoardOnly();
          }
        }
      });
    },
    onSelectTile: (instanceId) => actions.handleSelectTile(instanceId),
    onHoverTile: (instanceId) => {
      if (appState.hoveredTileId !== instanceId) {
        appState.hoveredTileId = instanceId;
        renderBattleBoardOnly();
      }
    }
  });

  renderChronicleLog(logRoot, appState.battleState, () => {
    openFullLogModal(modalRoot, appState.battleState?.log || []);
  });
}

function renderBattleBoardOnly() {
  if (appState.screen !== 'battle' || !appState.battleState) return;
  const centerStage = document.getElementById('center-stage');
  const uiState = {
    hoveredEnemyId: appState.hoveredEnemyId,
    hoveredTileId: appState.hoveredTileId,
    comboPreviewActive: appState.comboPreviewActive,
    hoveredExecute: appState.hoveredExecute,
    hoveredQueueSlot: appState.hoveredQueueSlot
  };
  if (refreshBoardOverlays(centerStage, appState.battleState, uiState)) return;
  renderBattleBoard(centerStage, appState.battleState, uiState, {
    onRemoveQueueSlot: (slotIdx) => actions.handleRemoveQueueSlot(slotIdx),
    onReorderQueue: (fromIdx, toIdx) => actions.handleReorderQueue(fromIdx, toIdx),
    onHoverQueueSlot: (slotIdx) => {
      if (appState.hoveredQueueSlot !== slotIdx) {
        appState.hoveredQueueSlot = slotIdx;
        renderBattleBoardOnly();
      }
    },
    onHoverEnemy: (enemyId) => {
      if (appState.hoveredEnemyId === enemyId) return;
      appState.hoveredEnemyId = enemyId;
      renderBattleBoardOnly();
    }
  });
}
