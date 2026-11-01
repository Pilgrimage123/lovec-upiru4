// @ts-nocheck
import { ANIMATION_TIMINGS } from './config/constants.js';
import { getCurseDefinition } from './config/curses.js';
import { clearCorpses } from './engine/state.js';
import {
  stepHero,
  turnHero,
  waitHero,
  insertTileIntoQueue,
  removeTileFromQueue,
  reorderQueue,
  executeSingleQueueSlot,
  finalizeComboAndAdvanceTurn,
  advanceTurnAfterPlayerAction,
  checkBattleEnd,
  consumeHeroStunIfPresent
} from './engine/combat.js';
import { generateBattleRewards, advanceToNextActOrWin } from './engine/run.js';
import { playEngineEvents as playCombatEventsAnimation, sleep } from './ui/renderer.js';
import { hideTooltip } from './ui/tooltips.js';
import { SFX } from './ui/audio.js';
import { openBattleRewardModal, openRunEndModal } from './ui/modal.js';

export function createBattleActions(deps) {
  const {
    appState,
    renderAll,
    appendEventsToLog,
    startNewRun,
    completeCurrentNodeAndShowMap
  } = deps;

  async function runActionAndAdvanceIfTurnConsumed(state, res, turnNum, extraCd = 0) {
    const centerStage = document.getElementById('center-stage');
    appendEventsToLog(state, res.events, turnNum);
    await playCombatEventsAnimation(
      centerStage,
      res.events,
      appState.settings.animSpeed,
      state
    );
    clearCorpses(state);
    renderAll();

    if (!res.ok || res.freeTurn || checkBattleEnd(state) !== 'playing') {
      appState.isAnimating = false;
      renderAll();
      await checkAndHandleBattleOutcome();
      return;
    }

    const turnEvents = [];
    advanceTurnAfterPlayerAction(state, turnEvents, extraCd);
    appendEventsToLog(state, turnEvents, turnNum);
    await playCombatEventsAnimation(
      centerStage,
      turnEvents,
      appState.settings.animSpeed,
      state
    );
    clearCorpses(state);
    appState.isAnimating = false;
    renderAll();
    await checkAndHandleBattleOutcome();
  }

  async function handlePlayerStep(dir) {
    if (appState.isAnimating || !appState.battleState) return;
    appState.isAnimating = true;
    hideTooltip();
    const state = appState.battleState;
    const turnNum = state.turn;
    await runActionAndAdvanceIfTurnConsumed(state, stepHero(state, dir), turnNum);
  }

  async function handlePlayerTurn() {
    if (appState.isAnimating || !appState.battleState) return;
    appState.isAnimating = true;
    hideTooltip();
    const state = appState.battleState;
    const turnNum = state.turn;
    await runActionAndAdvanceIfTurnConsumed(state, turnHero(state), turnNum);
  }

  async function handlePlayerWait() {
    if (appState.isAnimating || !appState.battleState) return;
    appState.isAnimating = true;
    hideTooltip();
    const state = appState.battleState;
    const turnNum = state.turn;
    const res = waitHero(state);
    await runActionAndAdvanceIfTurnConsumed(state, res, turnNum, res.extraCd || 0);
  }

  async function handleSelectTile(instanceId) {
    if (appState.isAnimating || !appState.battleState) return;
    appState.isAnimating = true;
    hideTooltip();
    const state = appState.battleState;
    const turnNum = state.turn;
    await runActionAndAdvanceIfTurnConsumed(
      state,
      insertTileIntoQueue(state, instanceId),
      turnNum
    );
  }

  function handleRemoveQueueSlot(slotIdx) {
    if (appState.isAnimating || !appState.battleState) return;
    hideTooltip();
    const res = removeTileFromQueue(appState.battleState, slotIdx);
    if (res.ok) {
      appendEventsToLog(appState.battleState, res.events);
    }
    SFX.queueRemove();
    renderAll();
  }

  function handleReorderQueue(fromIdx, toIdx) {
    if (appState.isAnimating || !appState.battleState) return;
    hideTooltip();
    const res = reorderQueue(appState.battleState, fromIdx, toIdx);
    if (res.ok) {
      appendEventsToLog(appState.battleState, res.events);
      SFX.queueInsert();
      renderAll();
    }
  }

  async function finalizeComboPhase(comboLength = 1) {
    const state = appState.battleState;
    if (!state) return;
    const centerStage = document.getElementById('center-stage');
    const turnNum = state.turn;
    const endEvents = finalizeComboAndAdvanceTurn(state, comboLength);
    appendEventsToLog(state, endEvents, turnNum);
    await playCombatEventsAnimation(
      centerStage,
      endEvents,
      appState.settings.animSpeed,
      state
    );
    clearCorpses(state);
    renderAll();
  }

  async function executeQueueNow() {
    const state = appState.battleState;
    if (appState.isAnimating || !state || state.queue.length === 0 || state.status !== 'playing') {
      return;
    }
    appState.isAnimating = true;
    hideTooltip();
    const centerStage = document.getElementById('center-stage');
    const queueSnapshot = [...state.queue];
    const comboLength = queueSnapshot.length;
    const turnNum = state.turn;

    const stunRes = consumeHeroStunIfPresent(state);
    if (stunRes) {
      appendEventsToLog(state, stunRes.events, turnNum);
      await playCombatEventsAnimation(
        centerStage,
        stunRes.events,
        appState.settings.animSpeed,
        state
      );
      clearCorpses(state);
      renderAll();
      const turnEvents = [];
      advanceTurnAfterPlayerAction(state, turnEvents);
      appendEventsToLog(state, turnEvents, turnNum);
      await playCombatEventsAnimation(
        centerStage,
        turnEvents,
        appState.settings.animSpeed,
        state
      );
      clearCorpses(state);
      appState.isAnimating = false;
      renderAll();
      await checkAndHandleBattleOutcome();
    } else {
      for (let i = 0; i < queueSnapshot.length && state.hero.hp > 0; i++) {
        const curId = queueSnapshot[i];
        const nextId = queueSnapshot[i + 1] || null;
        const slotEvents = executeSingleQueueSlot(state, curId, i, comboLength, nextId);
        appendEventsToLog(state, slotEvents, turnNum);
        await playCombatEventsAnimation(
          centerStage,
          slotEvents,
          appState.settings.animSpeed,
          state
        );
        clearCorpses(state);
        renderAll();
        await sleep(ANIMATION_TIMINGS.QUEUE_STEP_MS, appState.settings.animSpeed);
        if (checkBattleEnd(state) !== 'playing') break;
      }
      await sleep(ANIMATION_TIMINGS.TURN_TRANSITION_MS, appState.settings.animSpeed);
      await finalizeComboPhase(comboLength);
      appState.isAnimating = false;
      renderAll();
      await checkAndHandleBattleOutcome();
    }
  }

  async function handleExecuteOrPrepareQueue() {
    const state = appState.battleState;
    if (!appState.isAnimating && state && state.queue.length !== 0 && state.status === 'playing') {
      await executeQueueNow();
    }
  }

  function recordBattleStatsIntoRun(battle, run, won) {
    if (won) {
      run.stats.battlesWon += 1;
      if (battle.isElite) run.stats.elitesDefeated += 1;
    }
    run.stats.totalDamageDealt += battle.stats.damageDealt || 0;
    run.stats.totalFriendlyFire += battle.stats.friendlyFireCount || 0;
    run.stats.totalTurns += battle.stats.turnsTaken || 0;
    run.stats.enemiesKilled = (run.stats.enemiesKilled || 0) + (battle.stats.enemiesKilled || 0);

    let fangs = (battle.stats.enemiesKilled || 0) * 1;
    if (won) {
      if (battle.isElite) fangs += 3;
      if (battle.isBoss) fangs += 10;
    }
    const curseDef = getCurseDefinition(run.curseLevel || 0);
    if (curseDef.fangMultiplier > 1) {
      fangs = Math.round(fangs * curseDef.fangMultiplier);
    }
    appState.metaStats.fangs = (appState.metaStats.fangs || 0) + fangs;
    battle.fangsEarned = fangs;
    appState.metaStats.totalKills =
      (appState.metaStats.totalKills || 0) + (battle.stats.enemiesKilled || 0);
    appState.metaStats.bestAct = Math.max(appState.metaStats.bestAct || 1, run.act);
    try {
      localStorage.setItem('lovec_upiru_meta_v1', JSON.stringify(appState.metaStats));
    } catch {}
  }

  async function checkAndHandleBattleOutcome() {
    const battle = appState.battleState;
    const run = appState.runState;
    if (!battle || !run) return;
    const modalRoot = document.getElementById('modal-root');

    if (battle.status === 'lost' || battle.hero.hp <= 0) {
      SFX.defeat();
      run.heroHp = 0;
      run.status = 'defeat';
      recordBattleStatsIntoRun(battle, run, false);
      openRunEndModal(modalRoot, run, false, {
        onRetrySeed: (s) => startNewRun(s),
        onNewRun: (s) => startNewRun(s)
      });
    } else if (battle.status === 'won') {
      SFX.victory();
      run.heroHp = battle.hero.hp;
      if (run.talismans.includes('sacred_flask')) {
        run.heroHp = Math.min(run.heroMaxHp, run.heroHp + 1);
        battle.hero.hp = run.heroHp;
      }
      const keyringBonusGold = run.talismans.includes('sexton_keyring')
        ? (battle.stats.friendlyFireCount || 0) * 3
        : 0;
      run.gold += (battle.goldReward || 18) + keyringBonusGold;
      recordBattleStatsIntoRun(battle, run, true);

      if (battle.isBoss) {
        run.stats.bossesDefeated += 1;
        if (advanceToNextActOrWin(run).victory) {
          appState.metaStats.victories = (appState.metaStats.victories || 0) + 1;
          const cLvl = run.curseLevel || 0;
          const nextCurse = Math.min(5, cLvl + 1);
          if (nextCurse > (appState.metaStats.maxCurseUnlocked || 0)) {
            appState.metaStats.maxCurseUnlocked = nextCurse;
          }
          appState.metaStats.hallOfFame ||= [];
          appState.metaStats.hallOfFame.unshift({
            date: new Date().toLocaleDateString('cs-CZ'),
            curseLevel: cLvl,
            loadoutId: run.loadoutId || 'classic',
            battlesWon: run.stats.battlesWon,
            damageDealt: run.stats.totalDamageDealt,
            gold: run.gold
          });
          if (appState.metaStats.hallOfFame.length > 20) {
            appState.metaStats.hallOfFame.pop();
          }
          try {
            localStorage.setItem('lovec_upiru_meta_v1', JSON.stringify(appState.metaStats));
          } catch {}
          openRunEndModal(modalRoot, run, true, {
            onRetrySeed: (s) => startNewRun(s),
            onNewRun: (s) => startNewRun(s)
          });
          return;
        }
        appState.metaStats.bestAct = Math.max(appState.metaStats.bestAct || 1, run.act);
        try {
          localStorage.setItem('lovec_upiru_meta_v1', JSON.stringify(appState.metaStats));
        } catch {}
        openBattleRewardModal(modalRoot, run, generateBattleRewards(run, true), () => {
          appState.battleState = null;
          appState.screen = 'map';
          renderAll();
        });
        return;
      }

      openBattleRewardModal(modalRoot, run, generateBattleRewards(run, battle.isElite), () => {
        completeCurrentNodeAndShowMap();
      });
    }
  }

  return {
    handlePlayerStep,
    handlePlayerTurn,
    handlePlayerWait,
    handleSelectTile,
    handleRemoveQueueSlot,
    handleReorderQueue,
    handleExecuteOrPrepareQueue
  };
}
