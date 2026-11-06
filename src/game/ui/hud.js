// @ts-nocheck
import { STARTING_LOADOUTS } from '../config/loadouts.js';
import { TALISMANS } from '../config/talismans.js';
import { STRINGS } from '../config/strings.cs.js';
import { getCurseDefinition } from '../config/curses.js';
import { showTooltip, hideTooltip } from './tooltips.js';
import { toggleFullscreen, isFullscreenActive } from './fullscreen.js';

export function renderHud(container, runState, battleState, callbacks = {}) {
  if (!container || !runState) return;

  const hp = battleState ? battleState.hero.hp : runState.heroHp;
  const maxHp = battleState ? battleState.hero.maxHp : runState.heroMaxHp;
  const actName = STRINGS.acts[runState.act] || `Akt ${runState.act}`;
  const locationTitle = battleState ? battleState.encounterName : 'Mapa výpravy';
  const curseDef = getCurseDefinition(runState.curseLevel || 0);
  const curseHtml =
    runState.curseLevel > 0
      ? `<span class="hud-separator">·</span><span class="hud-curse-pill" title="${curseDef.name}: ${curseDef.description} (+${Math.round((curseDef.fangMultiplier - 1) * 100)} % tesáků)">🌙 ${curseDef.shortName}</span>`
      : '';

  const pipCount = Math.min(maxHp, 8);
  const filledPips = maxHp > 0 ? Math.round((Math.max(0, hp) / maxHp) * pipCount) : 0;
  const heartsHtml = Array.from({ length: pipCount }, (_, i) => {
    const full = i < filledPips;
    return `<span class="hp-pip ${full ? 'hp-pip-full' : 'hp-pip-empty'}" title="Život ${hp}/${maxHp}">${full ? '❤️' : '🖤'}</span>`;
  }).join('');

  const talismansHtml =
    runState.talismans.length === 0
      ? `<span class="hud-muted-text">Žádné talismany</span>`
      : runState.talismans
          .map((id) => {
            const t = TALISMANS[id];
            if (!t) return '';
            return `<button type="button" class="talisman-badge" data-talisman-id="${t.id}" aria-label="${t.name}">
              <span class="talisman-icon">${t.badge}</span>
              <span class="talisman-name">${t.name}</span>
            </button>`;
          })
          .join('');

  let maneuverHtml = '';
  if (battleState && battleState.hero) {
    const hero = battleState.hero;
    const hunterKey = hero.hunterId || hero.kind || 'classic';
    const loadout =
      STARTING_LOADOUTS[hunterKey] ||
      Object.values(STARTING_LOADOUTS).find((l) => l.hunterId === hunterKey) ||
      STARTING_LOADOUTS.classic;
    const bumpName = loadout?.bumpName || 'Krok do nepřítele';
    const bumpCd = hero.bumpCooldown || 0;
    const bumpOnCd = bumpCd > 0;
    maneuverHtml = `<span class="hud-separator">·</span><div class="hud-maneuver ${bumpOnCd ? 'hud-maneuver-cooling' : 'hud-maneuver-ready'}" title="${loadout?.bumpDesc || 'Manévr při kroku do nepřítele'}">👢 <strong>${bumpName}:</strong> ${bumpOnCd ? `Chladne (${bumpCd} t.)` : 'Připraven'}</div>`;
  }

  const isMapView = Boolean(callbacks.isMapScreen);
  const canToggleBattle = Boolean(isMapView && battleState && battleState.status === 'playing');
  const heroDef = battleState?.hero?.defense ?? runState?.defense ?? 1;
  const heroArmor = battleState?.hero?.armor ?? runState?.armor ?? 0;
  const heroPersistence = battleState?.hero?.persistence ?? runState?.persistence ?? 5;
  const heroMaxPersistence = battleState?.hero?.maxPersistence ?? runState?.maxPersistence ?? 5;
  const isReaper = Boolean(battleState?.hero?.isReaperActive);
  const reaperCountdown = isReaper ? (battleState.hero.persistence + battleState.hero.hp) : null;
  const heroDisplayName = battleState?.hero?.name || runState?.hunterName || 'Venca Česnekáč';
  const fsActive = isFullscreenActive();

  container.innerHTML = `
    <div class="hud-bar">
      <div class="hud-left">
        <div class="hud-brand">
          <span class="hud-title"><span class="hud-title-icon">🧄</span><span class="hud-title-text"> LOVEC UPÍRŮ</span></span>
          <span class="hud-separator">·</span>
          <span class="hud-act">${actName}</span>
          <span class="hud-separator">·</span>
          <span class="hud-location" title="${locationTitle}">${locationTitle}</span>${curseHtml}
        </div>
        <div class="hud-vitals">
          <div class="hud-hp-group ${isReaper ? 'hud-hp-in-reaper' : ''}" title="Zdraví lovce (${heroDisplayName})${isReaper ? ` · Zubatá na krku (${reaperCountdown} do skonu)` : ''}">
            <span class="hud-vital-label">Zdraví:</span>
            <div class="hud-hearts">${heartsHtml}</div>
            <span class="hud-hp-numbers ${isReaper ? 'hud-hp-danger' : ''}"><span class="hud-hp-icon" aria-hidden="true">${isReaper ? '💀' : '❤️'}</span>${hp}/${maxHp}<span class="hud-unit-suffix"> HP</span></span>
          </div>
          ${isReaper ? `
            <span class="hud-separator">·</span>
            <div class="hud-reaper-badge pulse-reaper" title="Zubatá na krku! Odpočet do skonu: ${reaperCountdown}">
              💀 <strong>${reaperCountdown}</strong> <span class="hud-reaper-title">Zubatá</span>
            </div>
          ` : `
            <span class="hud-separator">·</span>
            <div class="hud-persistence" title="Verva (${heroPersistence}/${heroMaxPersistence}): limit záporných HP před definitivním skonem">
              💀 <strong>${heroPersistence}</strong><span class="hud-unit-suffix"> Verva</span>
            </div>
          `}
          <span class="hud-separator">·</span>
          <div class="hud-defense" title="Obrana (${heroDef}): na začátku kola přidá +${heroDef} Štít">
            🛡️ <strong>${battleState?.hero?.statuses?.shield ? `${battleState.hero.statuses.shield} Štít` : `${heroDef} Obrana`}</strong>
          </div>${maneuverHtml}${heroArmor > 0 ? `
            <span class="hud-separator">·</span>
            <div class="hud-armor" title="Brnění (${heroArmor}): tlumí každé pronikající zranění do těla o ${heroArmor}">
              🦺 <strong>${heroArmor} Brnění</strong>
            </div>
          ` : ''}${(battleState?.hero?.currentFury || 0) > 0 ? `
            <span class="hud-separator">·</span>
            <div class="hud-fury" title="Bojové rozlícení (+${battleState.hero.currentFury} %): zvyšuje zranění útoků i kolizí (+${battleState.hero.fury || 10} % za kolo)">
              💢 <strong>+${battleState.hero.currentFury} %</strong><span class="hud-unit-suffix"> Rozlícení</span>
            </div>
          ` : (battleState?.hero?.currentFury || 0) < 0 ? `
            <span class="hud-separator">·</span>
            <div class="hud-fury hud-fury-cold" style="color: #60a5fa;" title="Zchlazení (${battleState.hero.currentFury} %): tlumí poškození útoků (min. 1 DMG)">
              🧊 <strong>${battleState.hero.currentFury} %</strong><span class="hud-unit-suffix"> Zchlazení</span>
            </div>
          ` : ''}
          <span class="hud-separator">·</span>
          <div class="hud-gold" title="Hradní dukáty">
            💰 <strong>${runState.gold}</strong><span class="hud-unit-suffix"> dukátů</span>
          </div>
          <span class="hud-separator">·</span>
          <div class="hud-fangs" title="Upíří tesáky (Hradní archiv)">
            🦷 <strong>${callbacks.metaStats?.fangs || 0}</strong>
          </div>
          <span class="hud-separator hud-seed-sep">·</span>
          <div class="hud-seed" title="Seed výpravy">
            🎲 <strong>${runState.seed}</strong>
          </div>
        </div>
      </div>

      <div class="hud-center-talismans">
        <span class="hud-vital-label">Talismany:</span>
        <div class="talisman-strip">${talismansHtml}</div>
      </div>

      <div class="hud-actions">
        <button type="button" class="btn-parchment btn-sm btn-hud-compact-detail" id="btn-hud-loadout-info" title="Osobní manévr lovce a aktivní talismany (${runState.talismans.length})" aria-label="Výbava a talismany">
          <span class="btn-icon">🧿</span><span class="btn-compact-tag">${runState.talismans.length}</span><span class="btn-text"> Výbava</span>
        </button>
        ${
          battleState
            ? `<button type="button" class="btn-parchment btn-sm btn-hud-compact-detail" id="btn-hud-log" title="Otevřít Bojový deník (Kolo ${battleState.turn})" aria-label="Bojový deník">
                 <span class="btn-icon">📜</span><span class="btn-compact-tag">${battleState.turn}.k</span><span class="btn-text"> Deník</span>
               </button>`
            : ''
        }
        <button type="button" class="btn-parchment btn-sm" id="btn-hud-hunters" title="Výběr lovce a titulní strana" aria-label="Výběr lovce">
          <span class="btn-icon">🏰</span><span class="btn-text"> Lovci</span>
        </button>
        <button type="button" class="btn-parchment btn-sm" id="btn-hud-map" title="${canToggleBattle ? 'Zpět do bitvy' : 'Zobrazit mapu aktu'}" aria-label="${canToggleBattle ? 'Zpět do bitvy' : 'Zobrazit mapu aktu'}">
          <span class="btn-icon">${canToggleBattle ? '⚔️' : '🗺️'}</span><span class="btn-text"> ${canToggleBattle ? 'Bitva' : 'Mapa'}</span>
        </button>
        <button type="button" class="btn-parchment btn-sm" id="btn-hud-archive" title="Hradní archiv a zbrojnice – odemykání výzbroje za tesáky" aria-label="Hradní archiv a zbrojnice">
          <span class="btn-icon">🏛️</span><span class="btn-text"> Archiv</span>
        </button>
        <button type="button" class="btn-parchment btn-sm" id="btn-hud-anim-lab" title="2D Procedurální Animační Laboratoř (6×4 taktické pískoviště)" aria-label="Animační laboratoř">
          <span class="btn-icon">🎬</span><span class="btn-text"> Animace</span>
        </button>
        <button type="button" class="btn-parchment btn-sm" id="btn-hud-rules" title="Pravidla a nápověda (F1)" aria-label="Pravidla a nápověda (F1)">
          <span class="btn-icon">📖</span><span class="btn-text"> Pravidla</span>
        </button>
        <button type="button" class="btn-parchment btn-sm" id="btn-hud-fullscreen" title="Přepnout celou obrazovku (Klávesa F)" aria-label="Celá obrazovka (Klávesa F)">
          <span class="btn-icon">${fsActive ? '🗗' : '⛶'}</span><span class="btn-text"> [F]</span>
        </button>
        <button type="button" class="btn-parchment btn-sm" id="btn-hud-settings" title="Nastavení rychlosti, zvuku a seedu" aria-label="Nastavení rychlosti, zvuku a seedu">
          <span class="btn-icon">⚙️</span><span class="btn-text"> Nastavení</span>
        </button>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-talisman-id]').forEach((el) => {
    const id = el.getAttribute('data-talisman-id');
    const tal = TALISMANS[id];
    if (!tal) return;
    const html = `<div class="tt-title">${tal.badge} ${tal.name}</div><div class="tt-desc">${tal.description}</div>`;
    el.addEventListener('mouseenter', (ev) => {
      showTooltip(html, ev.clientX, ev.clientY);
    });
    el.addEventListener('mouseleave', hideTooltip);
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const r = el.getBoundingClientRect();
      showTooltip(html, r.left + r.width / 2, r.bottom, true);
    });
  });

  container.querySelector('#btn-hud-loadout-info')?.addEventListener('click', () => {
    callbacks.onOpenLoadoutInfo?.();
  });
  container.querySelector('#btn-hud-log')?.addEventListener('click', () => {
    callbacks.onOpenFullLog?.();
  });
  container.querySelector('#btn-hud-hunters')?.addEventListener('click', () => {
    callbacks.onOpenTitleScreen?.();
  });
  container.querySelector('#btn-hud-map')?.addEventListener('click', () => callbacks.onToggleMap?.());
  container.querySelector('#btn-hud-archive')?.addEventListener('click', () => callbacks.onOpenArchive?.());
  container.querySelector('#btn-hud-anim-lab')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-animation-lab'));
  });
  container.querySelector('#btn-hud-rules')?.addEventListener('click', () => callbacks.onOpenRules?.());
  container.querySelector('#btn-hud-fullscreen')?.addEventListener('click', () => {
    void toggleFullscreen();
  });
  container.querySelector('#btn-hud-settings')?.addEventListener('click', () => callbacks.onOpenSettings?.());
}


