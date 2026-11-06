// @ts-nocheck
import { HERO_TILES, getHeroTileDefinition } from '../config/tiles.js';
import { TALISMANS } from '../config/talismans.js';
import { STARTING_LOADOUTS } from '../config/loadouts.js';
import { getCurseShopPrice, getCurseDefinition, NIGHT_CURSES } from '../config/curses.js';
import {
  grantTileToRun,
  grantTalismanToRun,
  upgradeTileInRun,
  reduceTileCooldownInRun
} from '../engine/run.js';
import { resolveEventChoice } from '../engine/events.js';
import { czechTurns } from '../config/strings.cs.js';

export function closeModal(modalRoot) {
  if (!modalRoot) return;
  modalRoot.innerHTML = '';
  modalRoot.classList.add('hidden');
}

export function openRulesModal(modalRoot) {
  modalRoot.classList.remove('hidden');
  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>📜 C. k. Vyhláška a pravidla lovu upírů · L. P. 1899</h3>
          <button type="button" class="btn-parchment btn-xs" id="btn-modal-close">✖ Zavřít</button>
        </div>
        <div class="modal-body rules-grid">
          <div class="rule-block">
            <h4>1. 1D Bojiště a Tah lovce</h4>
            <p>Na každém poli smí stát nejvýše jedna postava nebo překážka. Jeden tvůj <strong>TAH</strong> je jedna z akcí:</p>
            <ul>
              <li><strong>Krok (A / D):</strong> Posun o 1 pole bez změny směru. Krok do sousedního nepřítele provede tvůj manévr <strong>Krok do nepřítele</strong>, pokud nechladne.</li>
              <li><strong>Otočení (W):</strong> Změní směr pohledu (◀ / ▶). V <strong>Česnekovém oblaku</strong> je otočení <strong>ZDARMA (0 tahů)</strong>!</li>
              <li><strong>Čekání (S):</strong> Stojí 1 tah, zkrátí Chladnutí destiček i manévru o 1.</li>
              <li><strong>Vložení destičky do Fronty (1–4):</strong> Stojí 1 tah (<em>Rychlovka</em> 0 tahů). Vyjmutí a přerovnání ve frontě je zdarma.</li>
              <li><strong>ODPÁLIT KOMBO (Mezerník):</strong> Všechny destičky ve frontě se provedou zleva doprava za <strong>1 tah</strong>. Zřetězení 3 destiček spustí <strong>3-Kombo Finišer</strong> lovce!</li>
            </ul>
          </div>

          <div class="rule-block">
            <h4>2. Záměry nepřátel a Friendly Fire</h4>
            <ul>
              <li>Nepřátelé jednají podle iniciativy (<strong>#1, #2, #3</strong> zleva doprava).</li>
              <li>Stav <strong>⚪ NABÍJÍ</strong> či šipka pohybu znamená, že se nepřítel přesouvá nebo vkládá destičku do komba — v tomto tahu nevystřelí.</li>
              <li>Stav <strong>🚨 1 AKCE</strong> (červeně pulzující pole) znamená, že po tvé další akci nepřítel odpálí své kombo!</li>
              <li><strong>FRIENDLY FIRE:</strong> Nepřítel se značkou 🚨 1 AKCE se už před výstřelem neotočí. Když ho odstrčíš nebo prohodíš, zasáhne plnou silou vlastního kumpána!</li>
            </ul>
          </div>

          <div class="rule-block">
            <h4>3. Obrana, Kolize, Rozlícení a Švunk</h4>
            <ul>
              <li><strong>Obrana, Brnění a Zubatá:</strong> Obrana dává na začátku kola dočasný <em>Štít</em>. <em>Brnění</em> tlumí každé pronikající zranění do HP. Klesnou-li HP na 0, drží tě při životě <em>Verva</em> (odpočet Zubaté 💀).</li>
              <li><strong>Odhození (Push) a Kolize:</strong> Náraz do zdi nebo jiné postavy udělí oběma <strong>1 DMG za každé neprojité pole</strong>. Srážka se sudem zelí jej rozbije (<strong>4 DMG + Zmatení ❓</strong>).</li>
              <li><strong>Bojové rozlícení (💢):</strong> Každé kolo roste hněv (+% ke zranění útoků i kolizí). Upíry v <em>Ochromení (💤)</em> dorazíš kolíkem, česnekem nebo srážkou.</li>
              <li><strong>Švunk:</strong> Zabiješ-li nepřítele kombem 2+ destiček, zkrátí se Chladnutí první destičce komba i manévru kroku o délku komba!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

  modalRoot.querySelector('#btn-modal-close')?.addEventListener('click', () => closeModal(modalRoot));
  modalRoot.querySelector('.modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal(modalRoot);
  });
}

export function openFullLogModal(modalRoot, logs = []) {
  modalRoot.classList.remove('hidden');

  // Group log rows by Round if they contain [Kolo X]
  const turnGroups = [];
  let currentGroup = { turn: 1, entries: [] };

  logs.forEach((rawText, idx) => {
    const text = String(rawText || '');
    const match = text.match(/^\[Kolo\s+(\d+)\]\s*(.*)$/);
    if (match) {
      const turnNum = Number(match[1]);
      if (turnNum !== currentGroup.turn && currentGroup.entries.length > 0) {
        turnGroups.push(currentGroup);
        currentGroup = { turn: turnNum, entries: [] };
      } else {
        currentGroup.turn = turnNum;
      }
      currentGroup.entries.push({ idx: idx + 1, text: match[2] });
    } else {
      currentGroup.entries.push({ idx: idx + 1, text });
    }
  });
  if (currentGroup.entries.length > 0) {
    turnGroups.push(currentGroup);
  }

  const groupsHtml = turnGroups
    .map((grp) => `
      <div class="full-log-round-section">
        <div class="full-log-round-title">⚔️ Kolo ${grp.turn}</div>
        <div class="full-log-round-items">
          ${grp.entries.map((e) => `
            <div class="full-log-row">
              <span class="log-idx">#${e.idx}</span>
              <span class="log-row-text">${e.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `)
    .join('');

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>📜 C. k. Četnický deník a svodka šarvátky (${logs.length} záznamů)</h3>
          <button type="button" class="btn-parchment btn-xs" id="btn-modal-close">✖ Zavřít</button>
        </div>
        <div class="modal-body full-log-scroll" id="full-log-scroll-area">
          ${groupsHtml || '<p>Kronikář zatím nezaznamenal žádné události.</p>'}
        </div>
      </div>
    </div>
  `;

  const scrollArea = modalRoot.querySelector('#full-log-scroll-area');
  if (scrollArea) {
    setTimeout(() => {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }, 20);
  }

  modalRoot.querySelector('#btn-modal-close')?.addEventListener('click', () => closeModal(modalRoot));
  modalRoot.querySelector('.modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal(modalRoot);
  });
}

export function openSettingsModal(modalRoot, settings, metaStats, callbacks = {}) {
  modalRoot.classList.remove('hidden');
  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>⚙️ Nastavení & Nová výprava</h3>
          <button type="button" class="btn-parchment btn-xs" id="btn-modal-close">✖ Zavřít</button>
        </div>
        <div class="modal-body settings-form">
          <div class="setting-row">
            <label for="sel-anim-speed"><strong>Rychlost přehrávání animací:</strong></label>
            <select id="sel-anim-speed" class="parchment-input">
              <option value="1" ${settings.animSpeed === 1 ? 'selected' : ''}>Normální (1×)</option>
              <option value="2" ${settings.animSpeed === 2 ? 'selected' : ''}>Rychlá (2×)</option>
              <option value="0" ${settings.animSpeed === 0 ? 'selected' : ''}>Okamžitá (přeskočit animace)</option>
            </select>
          </div>

          <div class="setting-row">
            <label for="chk-sound"><strong>Zvukové efekty:</strong></label>
            <input type="checkbox" id="chk-sound" ${settings.soundEnabled ? 'checked' : ''} />
          </div>

          <hr class="tt-divider" />

          <div class="setting-row-col">
            <label for="inp-custom-seed"><strong>Spustit novou výpravu s vlastním seedem:</strong></label>
            <div class="seed-input-group">
              <input type="text" id="inp-custom-seed" class="parchment-input" value="${settings.currentSeed || 'VENCA-1899'}" placeholder="Např. HRAD-1899" />
              <button type="button" class="btn-parchment" id="btn-start-seed">🎲 Spustit seed</button>
              <button type="button" class="btn-parchment" id="btn-random-seed">🔀 Náhodný běh</button>
            </div>
          </div>

          <hr class="tt-divider" />
          <div class="setting-row" style="margin-top: 0.5rem;">
            <button type="button" class="btn-parchment w-full" id="btn-settings-return-title" style="width: 100%; justify-content: center; font-weight: 700;">
              🏰 Zpět do výběru lovců
            </button>
          </div>

          <hr class="tt-divider" />
          <div class="meta-stats-box">
            <h4>🏆 Nejlepší výsledky</h4>
            <p>Nejvyšší dosažený akt: <strong>${metaStats.bestAct || 1}</strong> · Vítězné výpravy: <strong>${metaStats.victories || 0}</strong> · Celkem poraženo upírů: <strong>${metaStats.totalKills || 0}</strong></p>
          </div>
        </div>
      </div>
    </div>
  `;

  modalRoot.querySelector('#btn-settings-return-title')?.addEventListener('click', () => {
    closeModal(modalRoot);
    window.dispatchEvent(new CustomEvent('open-title-screen'));
  });

  modalRoot.querySelector('#btn-modal-close')?.addEventListener('click', () => closeModal(modalRoot));
  modalRoot.querySelector('.modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal(modalRoot);
  });
  modalRoot.querySelector('#sel-anim-speed')?.addEventListener('change', (e) => {
    callbacks.onChangeAnimSpeed?.(Number(e.target.value));
  });
  modalRoot.querySelector('#chk-sound')?.addEventListener('change', (e) => {
    callbacks.onToggleSound?.(e.target.checked);
  });
  modalRoot.querySelector('#btn-start-seed')?.addEventListener('click', () => {
    const val = modalRoot.querySelector('#inp-custom-seed')?.value || 'VENCA-1899';
    closeModal(modalRoot);
    callbacks.onStartNewRun?.(val);
  });
  modalRoot.querySelector('#btn-random-seed')?.addEventListener('click', () => {
    const randomSeed = `LOV-${Math.floor(1000 + Math.random() * 9000)}`;
    closeModal(modalRoot);
    callbacks.onStartNewRun?.(randomSeed);
  });
}

export function openBattleRewardModal(modalRoot, runState, choices, onComplete) {
  modalRoot.classList.remove('hidden');

  const cardsHtml = choices
    .map(
      (c, idx) => `
      <div class="reward-choice-card">
        <div class="reward-card-title">${c.title}</div>
        <div class="reward-card-sub">${c.subtitle}</div>
        <p class="reward-card-desc">${c.description}</p>
        <button type="button" class="btn-parchment btn-pick-reward" data-reward-idx="${idx}">
          Vybrat tuto odměnu
        </button>
      </div>
    `
    )
    .join('');

  const hunterName = runState.hunterName || STARTING_LOADOUTS[runState.loadoutId]?.name || 'Venca Česnekáč';

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>🏆 C. k. Polní kořist: Výběr 1 ze 3 trofejí</h3>
        </div>
        <div class="modal-body">
          <p class="modal-lead">${hunterName} vykázal upíří hlídku z revíru a četnický protokol umožňuje zabavit jednu položku:</p>
          <div class="reward-choices-grid">
            ${cardsHtml}
          </div>
          <div class="modal-footer-actions">
            <button type="button" class="btn-parchment" id="btn-skip-reward">Přeskočit odměnu a pokračovat na mapu ➡</button>
          </div>
        </div>
      </div>
    </div>
  `;

  modalRoot.querySelectorAll('[data-reward-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-reward-idx'));
      const chosen = choices[idx];
      if (chosen) {
        if (chosen.type === 'tile') {
          grantTileToRun(runState, chosen.tileId);
        } else if (chosen.type === 'talisman') {
          grantTalismanToRun(runState, chosen.talismanId);
        } else if (chosen.type === 'gold') {
          runState.gold += chosen.amount;
        }
      }
      closeModal(modalRoot);
      onComplete?.();
    });
  });

  modalRoot.querySelector('#btn-skip-reward')?.addEventListener('click', () => {
    closeModal(modalRoot);
    onComplete?.();
  });
}

export function openPubModal(modalRoot, runState, onLeavePub, onUpdate) {
  modalRoot.classList.remove('hidden');

  const ownedTileIds = new Set(runState.deck.map((d) => d.id));
  const shopTilePool = Object.keys(HERO_TILES).filter((id) => !ownedTileIds.has(id));
  const shopTileId = (runState.rng && shopTilePool.length > 0) ? runState.rng.pick(shopTilePool) : (shopTilePool[0] || 'rosary_slap');
  const shopTileDef = getHeroTileDefinition(shopTileId, 0);

  const unownedTalismans = Object.keys(TALISMANS).filter((id) => !runState.talismans.includes(id));
  const shopTalismanId = (unownedTalismans.length > 0) ? ((runState.rng) ? runState.rng.pick(unownedTalismans) : unownedTalismans[0]) : null;
  const shopTalisman = shopTalismanId ? TALISMANS[shopTalismanId] : null;

  let healedInThisVisit = false;
  let cdReducedInThisVisit = false;
  let boughtTile = false;
  let boughtTalisman = false;

  function renderContent() {
    const prevScroll = modalRoot.querySelector('.modal-card')?.scrollTop || 0;
    const cdCost = getCurseShopPrice(14, runState.curseLevel);
    const tileCost = getCurseShopPrice(18, runState.curseLevel);
    const talPrice = shopTalisman ? getCurseShopPrice(shopTalisman.price, runState.curseLevel) : 0;
    const deckButtonsHtml = runState.deck
      .map((entry, idx) => {
        const def = getHeroTileDefinition(entry.id, entry.upgradeLevel || 0);
        const effCd = Math.max(1, def.cooldown - (entry.permanentCdReduction || 0));
        const canReduce = !cdReducedInThisVisit && runState.gold >= cdCost && effCd > 1;
        return `
          <button type="button" class="btn-parchment btn-sm" data-reduce-cd-idx="${idx}" ${!canReduce ? 'disabled' : ''}>
            ⏳ Zkrátit Chladnutí: ${def.name} (nyní Chladnutí ${effCd}) — ${cdCost} dukátů
          </button>
        `;
      })
      .join('');

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card modal-lg">
          <div class="modal-header">
            <h3>🍺 Hostinský výčepní lístek „U Svěcené pípy“ (Měšec: 💰 ${runState.gold} dukátů · ❤️ ${runState.heroHp}/${runState.heroMaxHp} HP)</h3>
            <button type="button" class="btn-parchment btn-sm" id="btn-leave-pub">Opustit hostinec ➡</button>
          </div>
          <div class="modal-body pub-grid">
            <div class="pub-section">
              <h4>1. Teplá dršťková polévka & čepovaný ležák</h4>
              <p>Hostinský natočí poctivý džbánek na kuráž a zklidnění mysli.</p>
              <button type="button" class="btn-parchment" id="btn-pub-heal" ${healedInThisVisit || (runState.heroHp >= runState.heroMaxHp && (runState.persistence || 5) >= (runState.maxPersistence || 5)) ? 'disabled' : ''}>
                🍺 Dát si pivo a guláš (+2 HP a plné obnovení Vervy ZDARMA)
              </button>
            </div>

            <div class="pub-section">
              <h4>2. Promazat výzbroj sádlem (Trvale −1 Chladnutí)</h4>
              <p>Jedné destičce trvale zkrátíš Chladnutí o 1 tah (min. Chladnutí 1):</p>
              <div class="pub-deck-list">${deckButtonsHtml}</div>
            </div>

            <div class="pub-section">
              <h4>3. Podpultové zboží od štamgastů</h4>
              <div class="pub-shop-items">
                <div class="reward-choice-card">
                  <div class="reward-card-title">Destička: ${shopTileDef.name}</div>
                  <p class="reward-card-desc">${shopTileDef.description}</p>
                  <button type="button" class="btn-parchment" id="btn-pub-buy-tile" ${boughtTile || runState.gold < tileCost ? 'disabled' : ''}>
                    💰 Koupit destičku (${tileCost} dukátů)
                  </button>
                </div>

                ${
                  shopTalisman
                    ? `<div class="reward-choice-card">
                         <div class="reward-card-title">${shopTalisman.badge} ${shopTalisman.name}</div>
                         <p class="reward-card-desc">${shopTalisman.description}</p>
                         <button type="button" class="btn-parchment" id="btn-pub-buy-tal" ${boughtTalisman || runState.gold < talPrice ? 'disabled' : ''}>
                           💰 Koupit talisman (${talPrice} dukátů)
                         </button>
                       </div>`
                    : ''
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const nextCard = modalRoot.querySelector('.modal-card');
    if (nextCard && prevScroll > 0) {
      nextCard.scrollTop = prevScroll;
    }

    modalRoot.querySelector('#btn-pub-heal')?.addEventListener('click', () => {
      healedInThisVisit = true;
      runState.heroHp = Math.min(runState.heroMaxHp, runState.heroHp + 2);
      runState.persistence = runState.maxPersistence || 5;
      onUpdate?.();
      renderContent();
    });

    modalRoot.querySelectorAll('[data-reduce-cd-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-reduce-cd-idx'));
        if (runState.gold >= cdCost && reduceTileCooldownInRun(runState, idx)) {
          runState.gold -= cdCost;
          cdReducedInThisVisit = true;
          onUpdate?.();
          renderContent();
        }
      });
    });

    modalRoot.querySelector('#btn-pub-buy-tile')?.addEventListener('click', () => {
      if (!boughtTile && runState.gold >= tileCost) {
        runState.gold -= tileCost;
        boughtTile = true;
        grantTileToRun(runState, shopTileId);
        onUpdate?.();
        renderContent();
      }
    });

    modalRoot.querySelector('#btn-pub-buy-tal')?.addEventListener('click', () => {
      if (shopTalisman && !boughtTalisman && runState.gold >= talPrice) {
        runState.gold -= talPrice;
        boughtTalisman = true;
        grantTalismanToRun(runState, shopTalisman.id);
        onUpdate?.();
        renderContent();
      }
    });

    modalRoot.querySelector('#btn-leave-pub')?.addEventListener('click', () => {
      closeModal(modalRoot);
      onLeavePub?.();
    });
  }

  renderContent();
}

export function openWorkshopModal(modalRoot, runState, onLeaveWorkshop, onUpdate) {
  modalRoot.classList.remove('hidden');
  let freeUpgradeUsed = false;

  function renderWorkshop() {
    const prevScroll = modalRoot.querySelector('.modal-card')?.scrollTop || 0;
    const upgradeCost = getCurseShopPrice(16, runState.curseLevel);
    const cardsHtml = runState.deck
      .map((entry, idx) => {
        const curDef = getHeroTileDefinition(entry.id, entry.upgradeLevel || 0);
        const maxReached = (entry.upgradeLevel || 0) >= 2;
        const nextDef = !maxReached ? getHeroTileDefinition(entry.id, (entry.upgradeLevel || 0) + 1) : null;
        const cost = freeUpgradeUsed ? upgradeCost : 0;
        const canAfford = !maxReached && (cost === 0 || runState.gold >= cost);

        return `
          <div class="reward-choice-card">
            <div class="reward-card-title">${curDef.name} (Úroveň ${entry.upgradeLevel || 0}/2)</div>
            <p class="reward-card-desc">Nyní: ${curDef.description}</p>
            ${
              nextDef
                ? `<p class="tt-bonus">Po vylepšení: <strong>${nextDef.name}</strong> — ${nextDef.description}</p>
                   <button type="button" class="btn-parchment" data-upg-idx="${idx}" ${!canAfford ? 'disabled' : ''}>
                     ⚒️ Vylepšit (${cost === 0 ? '1. vylepšení ZDARMA' : `${cost} dukátů`})
                   </button>`
                : `<span class="hud-muted-text">✔ Maximální mistrovská úroveň</span>`
            }
          </div>
        `;
      })
      .join('');

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card modal-lg">
          <div class="modal-header">
            <h3>⚒️ Cechovní kniha mistra koláře a kováře (Měšec: 💰 ${runState.gold} dukátů)</h3>
            <button type="button" class="btn-parchment btn-sm" id="btn-leave-workshop">Pokračovat na mapu ➡</button>
          </div>
          <div class="modal-body">
            <p class="modal-lead">Cechovní mistr ti první destičku okove a přiostří zadarmo, další pak za ${upgradeCost} dukátů:</p>
            <div class="reward-choices-grid">${cardsHtml}</div>
          </div>
        </div>
      </div>
    `;

    const nextCard = modalRoot.querySelector('.modal-card');
    if (nextCard && prevScroll > 0) {
      nextCard.scrollTop = prevScroll;
    }

    modalRoot.querySelectorAll('[data-upg-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-upg-idx'));
        const cost = freeUpgradeUsed ? upgradeCost : 0;
        if (runState.gold >= cost && upgradeTileInRun(runState, idx)) {
          runState.gold -= cost;
          freeUpgradeUsed = true;
          onUpdate?.();
          renderWorkshop();
        }
      });
    });

    modalRoot.querySelector('#btn-leave-workshop')?.addEventListener('click', () => {
      closeModal(modalRoot);
      onLeaveWorkshop?.();
    });
  }

  renderWorkshop();
}

export function openEventModal(modalRoot, runState, eventDef, onComplete, onUpdate) {
  modalRoot.classList.remove('hidden');

  const choicesHtml = eventDef.choices
    .map((c, idx) => {
      const allowed = !c.condition || c.condition(runState);
      return `
        <button type="button" class="btn-parchment event-choice-btn" data-choice-idx="${idx}" ${!allowed ? 'disabled' : ''}>
          👉 ${c.label}
        </button>
      `;
    })
    .join('');

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>📜 C. k. Mimořádná událost: ${eventDef.title}</h3>
        </div>
        <div class="modal-body">
          <p class="event-narrative-text">${eventDef.text}</p>
          <div class="event-choices-stack" id="event-choices-box">
            ${choicesHtml}
          </div>
          <div id="event-outcome-box" class="hidden"></div>
        </div>
      </div>
    </div>
  `;

  modalRoot.querySelectorAll('[data-choice-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-choice-idx'));
      const res = resolveEventChoice(runState, eventDef.id, idx);
      onUpdate?.();
      const choicesBox = modalRoot.querySelector('#event-choices-box');
      const outcomeBox = modalRoot.querySelector('#event-outcome-box');
      if (choicesBox) choicesBox.classList.add('hidden');
      if (outcomeBox) {
        outcomeBox.classList.remove('hidden');
        outcomeBox.innerHTML = `
          <div class="event-outcome-msg">${res.message}</div>
          <button type="button" class="btn-parchment" id="btn-event-continue">Pokračovat na mapu ➡</button>
        `;
        outcomeBox.querySelector('#btn-event-continue')?.addEventListener('click', () => {
          closeModal(modalRoot);
          onComplete?.();
        });
      }
    });
  });
}

export function openTreasureModal(modalRoot, runState, onComplete, onUpdate) {
  modalRoot.classList.remove('hidden');
  const unownedTalismans = Object.keys(TALISMANS).filter((id) => !runState.talismans.includes(id));
  const talId = unownedTalismans.length > 0 ? runState.rng.pick(unownedTalismans) : null;
  const tal = talId ? TALISMANS[talId] : null;
  const bonusGold = 20;

  if (talId) {
    grantTalismanToRun(runState, talId);
  }
  runState.gold += bonusGold;
  onUpdate?.();

  const hunterName = runState.hunterName || STARTING_LOADOUTS[runState.loadoutId]?.name || 'Venca Česnekáč';

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>💎 Hradní pokladnice!</h3>
        </div>
        <div class="modal-body">
          <p class="modal-lead">${hunterName} vypáčil dubovou truhlici za oltářem a našel:</p>
          <div class="reward-choice-card">
            ${
              tal
                ? `<div class="reward-card-title">${tal.badge} ${tal.name}</div>
                   <p class="reward-card-desc">${tal.description}</p>`
                : ''
            }
            <p class="tt-bonus">💰 Navíc +${bonusGold} dukátů do měšce!</p>
          </div>
          <div class="modal-footer-actions">
            <button type="button" class="btn-parchment" id="btn-treasure-done">Sebrat kořist a pokračovat ➡</button>
          </div>
        </div>
      </div>
    </div>
  `;

  modalRoot.querySelector('#btn-treasure-done')?.addEventListener('click', () => {
    closeModal(modalRoot);
    onComplete?.();
  });
}

export function openRunEndModal(modalRoot, runState, isVictory, callbacks = {}) {
  modalRoot.classList.remove('hidden');
  const hunterName = runState.hunterName || STARTING_LOADOUTS[runState.loadoutId]?.name || 'Venca Česnekáč';

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>${isVictory ? `🏆 SLAVNÉ VÍTĚZSTVÍ: ${hunterName.toUpperCase()}!` : `⚰️ ${hunterName.toUpperCase()} PADL V BOJI`}</h3>
        </div>
        <div class="modal-body">
          <p class="modal-lead">
            ${
              isVictory
                ? `Veleupír hrabě Leopold von Nochtic dostal přímo do svého černého srdce! Hrad je vyčištěn a ${hunterName} míří na zaslouženou dvanáctku!`
                : `Temné upíří hordy tentokrát lovce (${hunterName}) udolaly. Ale moravský česnek ještě neřekl poslední slovo!`
            }
          </p>
          <div class="summary-stats-grid">
            <div class="stat-pill">Dosažený akt: <strong>${runState.act} / 3</strong></div>
            <div class="stat-pill">Vyhrané bitvy: <strong>${runState.stats.battlesWon}</strong></div>
            <div class="stat-pill">Poraženo upírů: <strong>${runState.stats.enemiesKilled || 0}</strong></div>
            <div class="stat-pill">Rozdané poškození: <strong>${runState.stats.totalDamageDealt} DMG</strong></div>
            <div class="stat-pill">Friendly Fire zásahy: <strong>${runState.stats.totalFriendlyFire}</strong></div>
            <div class="stat-pill">Odehrané tahy: <strong>${runState.stats.totalTurns}</strong></div>
            <div class="stat-pill">Seed běhu: <strong>${runState.seed}</strong></div>
          </div>

          <div class="modal-footer-actions">
            <button type="button" class="btn-parchment" id="btn-return-to-title">
              🏰 Zvolit jiného lovce
            </button>
            <button type="button" class="btn-parchment" id="btn-retry-same-seed">
              🔁 Opakovat stejný seed (${runState.seed})
            </button>
            <button type="button" class="btn-parchment btn-execute-ready" id="btn-new-random-run">
              ⚔️ Nová výprava (nový seed)
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  modalRoot.querySelector('#btn-return-to-title')?.addEventListener('click', () => {
    closeModal(modalRoot);
    if (callbacks.onReturnToTitle) {
      callbacks.onReturnToTitle();
    } else {
      window.dispatchEvent(new CustomEvent('open-title-screen'));
    }
  });

  modalRoot.querySelector('#btn-retry-same-seed')?.addEventListener('click', () => {
    closeModal(modalRoot);
    callbacks.onRetrySeed?.(runState.seed);
  });

  modalRoot.querySelector('#btn-new-random-run')?.addEventListener('click', () => {
    closeModal(modalRoot);
    const nextSeed = `VENCA-${Math.floor(1000 + Math.random() * 9000)}`;
    callbacks.onNewRun?.(nextSeed);
  });
}


export function openCastleArchiveModal(modalRoot, appState, onUpdate = null, onSelect = null) {
  const prevScroll = modalRoot.querySelector('.modal-card')?.scrollTop || 0;
  modalRoot.classList.remove('hidden');
  const meta = appState.metaStats || { fangs: 0, unlockedLoadouts: ['classic'], selectedLoadout: 'classic' };
  const fangs = meta.fangs || 0;
  const unlocked = meta.unlockedLoadouts || ['classic'];
  const selected = meta.selectedLoadout || 'classic';
  const maxCurse = meta.maxCurseUnlocked || ((meta.victories || 0) > 0 ? 1 : 0);
  const selectedCurse = meta.selectedCurse || 0;

  const loadoutCardsHtml = Object.values(STARTING_LOADOUTS).map((loadout) => {
    const isUnlocked = unlocked.includes(loadout.id);
    const isSelected = selected === loadout.id;
    const canAfford = fangs >= loadout.cost;

    const tilesBadgesHtml = loadout.deck.map((d) => {
      const def = getHeroTileDefinition(d.id, 0);
      return `<span class="loadout-tile-pill" title="${def.description}"><strong>${def.name}</strong> (${def.dmg ?? 0} DMG)</span>`;
    }).join(' ');

    let actionBtnHtml = '';
    if (isSelected) {
      actionBtnHtml = `<span class="badge-active-loadout">✅ Aktivní arzenál</span>`;
    } else if (isUnlocked) {
      actionBtnHtml = `<button type="button" class="btn-parchment btn-sm btn-select-loadout" data-select-loadout="${loadout.id}">Zvolit pro další běh</button>`;
    } else {
      actionBtnHtml = `<button type="button" class="btn-parchment btn-sm btn-unlock-loadout" data-unlock-loadout="${loadout.id}" ${canAfford ? '' : 'disabled'} title="${canAfford ? 'Odemknout za tesáky' : 'Nedostatek tesáků'}">Odemknout za 🦷 ${loadout.cost}</button>`;
    }

    return `
      <div class="archive-loadout-card ${isSelected ? 'loadout-card-selected' : ''} ${!isUnlocked ? 'loadout-card-locked' : ''}">
        <div class="loadout-card-header">
          ${
            loadout.portrait
              ? `<img src="${loadout.portrait}" alt="${loadout.name}" style="width: 96px; height: 116px; object-fit: contain; object-position: bottom; border-radius: 10px; background: radial-gradient(circle at 50% 58%, rgba(250, 224, 148, 0.32) 0%, rgba(212, 175, 55, 0.14) 52%, #140b07 85%); border: 2px solid #b45309; padding: 3px; flex-shrink: 0; filter: ${loadout.id === 'zlodejka' ? 'brightness(1.24) contrast(1.1) saturate(1.12)' : 'brightness(1.08) contrast(1.06) saturate(1.06)'} drop-shadow(0 0 2px rgba(255, 248, 220, 0.9)) drop-shadow(0 3px 6px rgba(0, 0, 0, 0.85));" />`
              : `<span class="loadout-card-icon">${loadout.icon}</span>`
          }
          <div>
            <h4 class="loadout-card-title">${loadout.name} <span class="badge-hp">❤️ ${loadout.maxHp || 20} HP</span> <span class="badge-defense" style="margin-left: 4px; padding: 1px 6px; border-radius: 4px; background: #1e3a8a; border: 1px solid #1d4ed8; font-size: 0.78rem; color: #eff6ff;">🛡️ ${loadout.defense ?? 0} Obrana</span>${loadout.armor ? ` <span class="badge-armor" style="margin-left: 4px; padding: 1px 6px; border-radius: 4px; background: #065f46; border: 1px solid #047857; font-size: 0.78rem; color: #ecfdf5;">🦺 ${loadout.armor} Brnění</span>` : ''}${loadout.fury ? ` <span class="badge-fury" style="margin-left: 4px; padding: 1px 6px; border-radius: 4px; background: #7f1d1d; border: 1px solid #b91c1c; font-size: 0.78rem; color: #fef2f2;">💢 +${loadout.fury} %</span>` : ''} <span class="badge-persistence" style="margin-left: 4px; padding: 1px 6px; border-radius: 4px; background: #27272a; border: 1px solid #52525b; font-size: 0.78rem; color: #f4f4f5;" title="Verva (Odolnost vůči Zubaté)">💀 ${loadout.persistence ?? 5} Verva</span></h4>
            <div class="loadout-card-epithet">${loadout.epithet}</div>
          </div>
        </div>
        <p class="loadout-card-desc">${loadout.description}</p>
        <div class="loadout-card-abilities" style="margin: 0.35rem 0; font-size: 0.85rem; line-height: 1.4; color: #1c140e; background: rgba(255, 255, 255, 0.55); padding: 6px 8px; border-radius: 6px; border: 1px solid rgba(28, 20, 14, 0.25);">
          ${loadout.passiveName ? `<div style="margin-bottom: 0.2rem;"><strong style="color: #9f1239;">✨ Pasivita (${loadout.passiveName}):</strong> ${loadout.passiveDesc}</div>` : ''}
          ${loadout.bumpName ? `<div style="margin-bottom: 0.2rem;"><strong style="color: #92400e;">💥 ${loadout.bumpName}:</strong> ${loadout.bumpDesc}</div>` : ''}
          ${loadout.comboName ? `<div><strong style="color: #075985;">✨ 3-Kombo:</strong> ${loadout.comboDesc}</div>` : ''}
        </div>
        <div class="loadout-card-deck">
          <strong>Startovní destičky:</strong>
          <div class="loadout-deck-pills">${tilesBadgesHtml}</div>
        </div>
        <div class="loadout-card-action">
          ${actionBtnHtml}
        </div>
      </div>
    `;
  }).join('');

  const cursesCardsHtml = (maxCurse === 0)
    ? `<div class="curse-locked-hint">🔒 Kletby noci se odemknou po tvém prvním vítězství nad Hrabětem von Nochtic v aktu 3!</div>`
    : `<div class="archive-curses-grid">` +
      NIGHT_CURSES.map((curse) => {
        const isUnlocked = curse.level <= maxCurse;
        const isSelected = selectedCurse === curse.level;
        let actionBtn = '';
        if (isSelected) {
          actionBtn = `<span class="badge-active-curse">✅ Aktivní kletba</span>`;
        } else if (isUnlocked) {
          actionBtn = `<button type="button" class="btn-parchment btn-sm btn-select-curse" data-select-curse="${curse.level}">Aktivovat pro další běh</button>`;
        } else {
          actionBtn = `<span class="curse-card-locked-text">🔒 Vyžaduje pokoření Kletby ${curse.level - 1}</span>`;
        }
        return `
          <div class="archive-curse-card ${isSelected ? 'curse-card-selected' : ''} ${!isUnlocked ? 'curse-card-locked' : ''}">
            <div class="curse-card-header">
              <span class="curse-card-icon">${curse.icon}</span>
              <div>
                <h5 class="curse-card-title">${curse.name}</h5>
                <div class="curse-multiplier">🦷 Násobič tesáků: <strong>${curse.fangMultiplier}×</strong></div>
              </div>
            </div>
            <p class="curse-card-desc">${curse.description}</p>
            <div class="curse-card-action">${actionBtn}</div>
          </div>
        `;
      }).join('') +
      `</div>`;

  const hallOfFame = meta.hallOfFame || [];
  const hallOfFameHtml = hallOfFame.length === 0
    ? `<div class="curse-locked-hint">Zatím žádný zápis v Síni slávy. Pokoř Hraběte von Nochtic v aktu 3 a zapiš svůj triumf!</div>`
    : `<div class="hall-of-fame-table-wrap">
        <table class="hall-of-fame-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Kletba noci</th>
              <th>Výstroj</th>
              <th>Bitev</th>
              <th>DMG</th>
              <th>Zlato</th>
            </tr>
          </thead>
          <tbody>
            ${hallOfFame.map((entry) => {
              const cDef = getCurseDefinition(entry.curseLevel);
              const lDef = STARTING_LOADOUTS[entry.loadoutId] || STARTING_LOADOUTS.classic;
              return `
                <tr>
                  <td>${entry.date}</td>
                  <td>${cDef.icon} ${cDef.shortName}</td>
                  <td>${lDef.icon} ${lDef.name}</td>
                  <td>${entry.battlesWon}</td>
                  <td>${entry.damageDealt}</td>
                  <td>💰 ${entry.gold}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
       </div>`;

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>🏛️ Hradní archiv a zbrojnice</h3>
          <button type="button" class="btn-parchment btn-xs" id="btn-modal-close">✖ Zavřít</button>
        </div>
        <div class="modal-body archive-body">
          <div class="archive-treasury-banner">
            <span class="treasury-icon">🦷</span>
            <div class="treasury-info">
              <strong>Tvoje nasbírané Upíří tesáky: <span class="fangs-count">${fangs}</span></strong>
              <div class="treasury-hint">Získávej tesáky za likvidaci upírů, elitních drábů a bossů a odemykej nové startovní arzenály!</div>
            </div>
          </div>

          <h4 class="archive-section-title">Startovní arzenály lovců</h4>
          <div class="archive-loadouts-grid">
            ${loadoutCardsHtml}
          </div>

          <h4 class="archive-section-title">🌙 Kletby noci (Obtížnost I–V)</h4>
          ${cursesCardsHtml}

          <h4 class="archive-section-title">🏆 Síň slávy vítězství</h4>
          ${hallOfFameHtml}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-parchment" id="btn-archive-done">Zpět k výpravě</button>
        </div>
      </div>
    </div>
  `;

  const nextCard = modalRoot.querySelector('.modal-card');
  if (nextCard && prevScroll > 0) {
    nextCard.scrollTop = prevScroll;
  }

  modalRoot.querySelector('#btn-modal-close')?.addEventListener('click', () => {
    closeModal(modalRoot);
  });
  modalRoot.querySelector('#btn-archive-done')?.addEventListener('click', () => {
    closeModal(modalRoot);
  });
  modalRoot.querySelector('.modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal(modalRoot);
  });

  modalRoot.querySelectorAll('[data-unlock-loadout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lId = btn.getAttribute('data-unlock-loadout');
      const loadout = STARTING_LOADOUTS[lId];
      if (loadout && meta.fangs >= loadout.cost && !meta.unlockedLoadouts.includes(lId)) {
        meta.fangs -= loadout.cost;
        meta.unlockedLoadouts.push(lId);
        meta.selectedLoadout = lId;
        try {
          localStorage.setItem('lovec_upiru_meta_v1', JSON.stringify(meta));
        } catch {
          /* ignore storage error */
        }
        onUpdate?.();
        openCastleArchiveModal(modalRoot, appState, onUpdate, onSelect);
      }
    });
  });

  modalRoot.querySelectorAll('[data-select-loadout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lId = btn.getAttribute('data-select-loadout');
      meta.selectedLoadout = lId;
      try {
        localStorage.setItem('lovec_upiru_meta_v1', JSON.stringify(meta));
      } catch {
        /* ignore storage error */
      }
      onSelect?.(lId);
      onUpdate?.();
      openCastleArchiveModal(modalRoot, appState, onUpdate, onSelect);
    });
  });

  modalRoot.querySelectorAll('[data-select-curse]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cLvl = Number(btn.getAttribute('data-select-curse'));
      meta.selectedCurse = cLvl;
      try {
        localStorage.setItem('lovec_upiru_meta_v1', JSON.stringify(meta));
      } catch {
        /* ignore storage error */
      }
      onUpdate?.();
      openCastleArchiveModal(modalRoot, appState, onUpdate, onSelect);
    });
  });
}

export function openLoadoutAndTalismansModal(modalRoot, runState, battleState) {
  if (!modalRoot || !runState) return;
  modalRoot.classList.remove('hidden');

  const hero = battleState?.hero || {};
  const hunterKey = hero.hunterId || hero.kind || runState.hunterId || runState.loadoutId || 'classic';
  const loadout =
    STARTING_LOADOUTS[hunterKey] ||
    Object.values(STARTING_LOADOUTS).find((l) => l.hunterId === hunterKey) ||
    STARTING_LOADOUTS.classic;

  const bumpName = loadout?.bumpName || 'Krok do nepřítele';
  const bumpDesc = loadout?.bumpDesc || 'Speciální manévr při kroku do sousedního nepřítele.';
  const bumpCd = hero.bumpCooldown || 0;
  const bumpStatusHtml =
    bumpCd > 0
      ? `<span class="maneuver-status-badge status-cooling">⏳ Chladne (${bumpCd} ${czechTurns(bumpCd)})</span>`
      : `<span class="maneuver-status-badge status-ready">⚔️ Připraven k okamžitému použití</span>`;

  const passiveSectionHtml = loadout?.passiveName
    ? `
      <div class="rule-block" style="margin-bottom: 8px;">
        <h4>✨ Pasivní signatura: ${loadout.passiveName}</h4>
        <p>${loadout.passiveDesc || ''}</p>
      </div>
    `
    : '';

  const comboSectionHtml = loadout?.comboName
    ? `
      <div class="rule-block" style="margin-bottom: 8px;">
        <h4>🔥 3-Kombo Finišer: ${loadout.comboName}</h4>
        <p>${loadout.comboDesc || ''}</p>
      </div>
    `
    : '';

  const talismansListHtml =
    !runState.talismans || runState.talismans.length === 0
      ? `<p class="modal-lead" style="margin-bottom: 0;">Zatím nemáš žádné talismany. Získáš je za porážku elitních protivníků, v truhlách a v hospodě.</p>`
      : `<div class="reward-choices-grid" style="margin: 6px 0 0 0;">
          ${runState.talismans
            .map((id) => {
              const t = TALISMANS[id];
              if (!t) return '';
              return `
                <div class="reward-choice-card" style="padding: 8px 10px; gap: 4px;">
                  <div class="reward-card-title">${t.badge} ${t.name}</div>
                  <div class="reward-card-desc">${t.description}</div>
                </div>
              `;
            })
            .join('')}
        </div>`;

  const deckTiles = battleState?.hand || runState?.deck || [];
  const deckListHtml =
    deckTiles.length > 0
      ? `<div class="loadout-deck-pills" style="margin-top: 6px;">
          ${deckTiles
            .map(
              (tile) =>
                `<span class="loadout-tile-pill" style="background:#2d1e12;border:1px solid #8c6320;color:#fff8e8;">⚔️ ${tile.name} (${tile.dmg ?? 0} DMG · ⏳ ${tile.maxCooldown ?? tile.cooldown ?? 1}t)</span>`
            )
            .join('')}
        </div>`
      : '';

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>🧿 Výbava, manévr a talismany (${loadout?.name || 'Lovec'})</h3>
          <button type="button" class="btn-parchment btn-xs" id="btn-modal-close">✖ Zavřít</button>
        </div>
        <div class="modal-body">
          <div class="rule-block" style="margin-bottom: 8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
              <h4 style="margin:0;border:0;padding:0;">👢 Osobní manévr: ${bumpName}</h4>
              ${bumpStatusHtml}
            </div>
            <p>${bumpDesc}</p>
          </div>
          ${passiveSectionHtml}
          ${comboSectionHtml}
          <div class="rule-block" style="margin-bottom: 8px;">
            <h4>🧿 Aktivní talismany (${runState.talismans?.length || 0})</h4>
            ${talismansListHtml}
          </div>
          ${
            deckListHtml
              ? `<div class="rule-block">
                  <h4>🃏 Destičky v ruce (${deckTiles.length})</h4>
                  ${deckListHtml}
                </div>`
              : ''
          }
        </div>
        <div class="modal-footer-actions">
          <button type="button" class="btn-parchment" id="btn-loadout-info-done">Zpět do boje</button>
        </div>
      </div>
    </div>
  `;

  modalRoot.querySelector('#btn-modal-close')?.addEventListener('click', () => closeModal(modalRoot));
  modalRoot.querySelector('#btn-loadout-info-done')?.addEventListener('click', () => closeModal(modalRoot));
  modalRoot.querySelector('.modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal(modalRoot);
  });
}

