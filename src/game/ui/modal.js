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
          <h3>📖 Pravidla lovu upírů (Manuál Venci Česnekáče)</h3>
          <button type="button" class="btn-parchment btn-xs" id="btn-modal-close">✖ Zavřít</button>
        </div>
        <div class="modal-body rules-grid">
          <div class="rule-block">
            <h4>1. 1D Bojiště (7–9 polí) a Ekonomika tahu</h4>
            <p>Na každém ze 7–9 kamenných polí smí stát nejvýše jedna postava nebo sud. Jeden tvůj <strong>TAH</strong> je právě jedna z akcí:</p>
            <ul>
              <li><strong>Krok vlevo / vpravo (A / D):</strong> Posun o 1 pole bez změny směru pohledu. Cílové pole musí být volné (do obsazeného pole nelze vstoupit ani ho krokem přeskočit – přes překážky skáče pouze destička <em>Hospodský přemet</em>).</li>
              <li><strong>Otočení (W):</strong> Změní směr pohledu (◀ / ▶). Stojíš-li v <strong>Česnekovém oblaku</strong>, je otočení <strong>ZDARMA (0 tahů)</strong>!</li>
              <li><strong>Čekání (S):</strong> Stojí 1 tah, sníží cooldowny tvých destiček.</li>
              <li><strong>Vložení destičky do Fronty (1–4 / klik):</strong> Stojí 1 tah (vyjma destiček s vlastností <em>Rychlovka</em>, jejichž vložení stojí 0 tahů). Vyjmutí i libovolné přerovnání destiček ve frontě je vždy zdarma.</li>
              <li><strong>PROVÉST KOMBO (Mezerník / Space):</strong> Okamžitý odpal! Všechny destičky ve frontě se provedou zleva doprava bez nutnosti přípravného nápřahu za <strong>JEDEN tah</strong>!</li>
            </ul>
          </div>

          <div class="rule-block">
            <h4>2. Fronty nepřátel, Záměry a Friendly Fire</h4>
            <ul>
              <li>Nad každým upírem vidíš jeho <strong>pořadí iniciativy (#1, #2, #3 zleva doprava)</strong> a pás jeho destiček akcí.</li>
              <li>První zvýrazněná destička má <strong>odpočet (⏳)</strong>. Na konci každého tvého tahu klesne odpočet o 1.</li>
              <li>Při odpočtu <strong>0</strong> upír provede akci do polí podle své <strong>AKTUÁLNÍ polohy a otočení</strong>!</li>
              <li><strong>FRIENDLY FIRE:</strong> Pokud upíra poodstrčíš, přitáhneš nebo otočíš hasičskou stříkačkou, při odpočtu 0 napálí plnou silou vlastního kolegu nebo sud!</li>
            </ul>
          </div>

          <div class="rule-block">
            <h4>3. Kolize, Terén a poslední akce</h4>
            <ul>
              <li><strong>Odhození (Push) a Kolize:</strong> Narazí-li odhozená postava do zdi nebo do jiné postavy, utrpí obě <strong>+1 kolizní DMG</strong>. Vhození do sudu se zelím sud rozbije (2 DMG + Zmatení).</li>
              <li><strong>Ještě jedna akce:</strong> Když nepřítel zčervená (🚨), útok ještě nejde. Stihneš jednu obyčejnou akci — krok, otočku, destičku nebo čekání. Pak teprve útok dopadne. Žádné zvláštní okno.</li>
              <li><strong>Terén:</strong> <em>Propast</em> = okamžitá smrt (kromě létajících netopýrů). <em>Kůly</em> = 2 DMG. <em>Prohnilé prkno</em> = 1. stoupnutí zapraská, 2. stoupnutí se prolomí za 2 DMG.</li>
              <li><strong>Momentum:</strong> Zabiješ-li posledního nepřítele bitvy kombem 2+ destiček, zkrátí se cooldowny všech tvých destiček o počet destiček v kombu!</li>
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
          <h3>📜 Kompletní deník bojových událostí (${logs.length} záznamů)</h3>
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
            <label for="chk-sound"><strong>Zvukové efekty (WebAudio syntéza):</strong></label>
            <input type="checkbox" id="chk-sound" ${settings.soundEnabled ? 'checked' : ''} />
          </div>

          <hr class="tt-divider" />

          <div class="setting-row-col">
            <label for="inp-custom-seed"><strong>Spustit novou výpravu s vlastním seedem:</strong></label>
            <div class="seed-input-group">
              <input type="text" id="inp-custom-seed" class="parchment-input" value="${settings.currentSeed || 'VENCA-1899'}" placeholder="Např. HRAD-1905" />
              <button type="button" class="btn-parchment" id="btn-start-seed">🎲 Spustit seed</button>
              <button type="button" class="btn-parchment" id="btn-random-seed">🔀 Náhodný běh</button>
            </div>
          </div>

          <hr class="tt-divider" />
          <div class="setting-row" style="margin-top: 0.5rem;">
            <button type="button" class="btn-parchment w-full" id="btn-settings-return-title" style="width: 100%; justify-content: center; font-weight: 700;">
              🏰 Zpět do výběru lovců (Titulní strana)
            </button>
          </div>

          <hr class="tt-divider" />
          <div class="meta-stats-box">
            <h4>🏆 Nejlepší výsledky (localStorage)</h4>
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

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>🏆 Bitva vyhrána! Vyber si 1 ze 3 odměn</h3>
        </div>
        <div class="modal-body">
          <p class="modal-lead">Venca vytřel podlahu s upíří patrolou a prohledává kapsy poražených:</p>
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
            ⏳ Zkrátit CD: ${def.name} (nyní CD ${effCd}) — ${cdCost} dukátů
          </button>
        `;
      })
      .join('');

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card modal-lg">
          <div class="modal-header">
            <h3>🍺 Hospoda U Svěcené pípy (Měšec: 💰 ${runState.gold} dukátů · ❤️ ${runState.heroHp}/${runState.heroMaxHp} HP)</h3>
            <button type="button" class="btn-parchment btn-sm" id="btn-leave-pub">Opustit hospodu ➡</button>
          </div>
          <div class="modal-body pub-grid">
            <div class="pub-section">
              <h4>1. Teplá dršťková a ležák</h4>
              <p>Hospodský ti natočí poctivý džbánek na kuráž.</p>
              <button type="button" class="btn-parchment" id="btn-pub-heal" ${healedInThisVisit || runState.heroHp >= runState.heroMaxHp ? 'disabled' : ''}>
                🍺 Dát si pivo a guláš (+2 HP ZDARMA)
              </button>
            </div>

            <div class="pub-section">
              <h4>2. Promazat výzbroj sádlem (Trvale −1 Cooldown)</h4>
              <p>Jedné destičce trvale snížíš nabíjení o 1 tah (min. CD 1):</p>
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
            <h3>⚒️ Kolářská a kovářská dílna (💰 ${runState.gold} dukátů)</h3>
            <button type="button" class="btn-parchment btn-sm" id="btn-leave-workshop">Pokračovat na mapu ➡</button>
          </div>
          <div class="modal-body">
            <p class="modal-lead">Mistr kolář ti první destičku přiostří zadarmo, další pak za ${upgradeCost} dukátů:</p>
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
          <h3>❓ ${eventDef.title}</h3>
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

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>💎 Hradní pokladnice!</h3>
        </div>
        <div class="modal-body">
          <p class="modal-lead">Venca vypáčil dubovou truhlici za oltářem a našel:</p>
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

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>${isVictory ? '🏆 SLAVNÉ VÍTĚZSTVÍ VENCI ČESNEKÁČE!' : '⚰️ VENCA ČESNEKÁČ PADL V BOJI'}</h3>
        </div>
        <div class="modal-body">
          <p class="modal-lead">
            ${
              isVictory
                ? 'Pán temnot hrabě Drákula dostal dubovým kolíkem přímo do svého černého srdce! Hrad je vyčištěn a Venca míří na zaslouženou dvanáctku!'
                : 'Temné upíří hordy tentokrát Vencu udolaly. Ale moravský česnek ještě neřekl poslední slovo!'
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
      return `<span class="loadout-tile-pill" title="${def.description}"><strong>${def.name}</strong> (${def.dmg} DMG)</span>`;
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
          <span class="loadout-card-icon">${loadout.icon}</span>
          <div>
            <h4 class="loadout-card-title">${loadout.name} <span class="badge-hp">❤️ ${loadout.maxHp || 20} HP</span></h4>
            <div class="loadout-card-epithet">${loadout.epithet}</div>
          </div>
        </div>
        <p class="loadout-card-desc">${loadout.description}</p>
        <div class="loadout-card-abilities" style="margin: 0.35rem 0; font-size: 0.85rem; line-height: 1.35; color: #e2e8f0;">
          ${loadout.bumpName ? `<div style="margin-bottom: 0.2rem;"><strong style="color: #f59e0b;">💥 ${loadout.bumpName}:</strong> ${loadout.bumpDesc}</div>` : ''}
          ${loadout.comboName ? `<div><strong style="color: #38bdf8;">✨ 3-Kombo:</strong> ${loadout.comboDesc}</div>` : ''}
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
    ? `<div class="curse-locked-hint">🔒 Kletby noci se odemknou po tvém prvním vítězství nad Hrabětem Drákulou v aktu 3!</div>`
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
    ? `<div class="curse-locked-hint">Zatím žádný zápis v Síni slávy. Pokoř Hraběte Drákulu v aktu 3 a zapiš svůj triumf!</div>`
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

          <h4 class="archive-section-title">Startovní arzenály Venci Česnekáče</h4>
          <div class="archive-loadouts-grid">
            ${loadoutCardsHtml}
          </div>

          <h4 class="archive-section-title">🌙 Kletby noci (Stupně obtížnosti I–V)</h4>
          ${cursesCardsHtml}

          <h4 class="archive-section-title">🏆 Síň slávy Vencových vítězství</h4>
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
        } catch {}
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
      } catch {}
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
      } catch {}
      onUpdate?.();
      openCastleArchiveModal(modalRoot, appState, onUpdate, onSelect);
    });
  });
}
