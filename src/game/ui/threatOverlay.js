// @ts-nocheck
export function renderCellThreatAndPreviewHtml(cellIndex, cellThreat, queuePreview, state, simPreview = null) {
  const parts = [];

  // 1. ARMED_RED Ground Telegraph Crosshair on this cell
  if (cellThreat && cellThreat.isArmedRed) {
    const totalDmg = cellThreat.totalDmg;
    const arrows = Array.from(
      new Set(cellThreat.sources.filter((s) => s.isArmedRed).map((s) => (s.direction === 1 ? '▶' : '◀')))
    ).join('');
    const effectIcons = collectEffectIcons(cellThreat.sources.filter((s) => s.isArmedRed));

    parts.push(`
      <div class="ground-crosshair-badge animate-pulse-crosshair"
           title="Zóna dopadu! Připravený nepřítel zde v příštím tahu odpálí útok za ${totalDmg} DMG!">
        <div class="crosshair-header">
          <span class="crosshair-target-icon">🎯</span>
          <span class="crosshair-tag badge-verbose-text">CÍL ÚTOKU</span>
        </div>
        <div class="crosshair-dmg-row">
          <span class="crosshair-dir">${arrows}</span>
          <span class="crosshair-dmg-val">💥 ${totalDmg}<span class="badge-verbose-text"> DMG</span></span>
          ${effectIcons ? `<span class="crosshair-eff badge-verbose-text">${effectIcons}</span>` : ''}
        </div>
      </div>
    `);
  } else if (cellThreat && cellThreat.sources.length > 0) {
    // Legacy fallback threat badge
    const totalDmg = cellThreat.totalDmg;
    const isImminent = cellThreat.sources.some((s) => s.countdown <= 1);
    const arrows = Array.from(
      new Set(cellThreat.sources.map((s) => (s.direction === 1 ? '▶' : '◀')))
    ).join('');
    const effectIcons = collectEffectIcons(cellThreat.sources);

    parts.push(`
      <div class="threat-badge ${isImminent ? 'threat-badge-imminent' : 'threat-badge-warning'}"
           title="Ohrožené pole! Součet DMG: ${totalDmg}">
        <span class="threat-dir">${arrows}</span>
        <span class="threat-dmg">💥 ${totalDmg}<span class="badge-verbose-text"> DMG</span></span>
        ${effectIcons ? `<span class="threat-eff badge-verbose-text">${effectIcons}</span>` : ''}
      </div>
    `);
  }

  // 2. Hovered enemy inspect reach highlight
  if (cellThreat && cellThreat.isInspectReach) {
    const inspectCount = cellThreat.inspectSources?.length || 1;
    parts.push(`
      <div class="inspect-reach-badge" title="Pole v dosahu útoků vybraného nepřítele (${inspectCount} schopností)">
        <span>👁️<span class="badge-verbose-text"> Dosah</span></span>
      </div>
    `);
  }

  // 3. Player queued combo preview on this cell
  if (queuePreview) {
    const cellHits = queuePreview.targetedCells.filter((h) => h.cell === cellIndex);
    if (cellHits.length > 0) {
      const sumDmg = cellHits.reduce((a, b) => a + (b.dmg || 0), 0);
      const anyKill = cellHits.some((h) => h.wouldKill);
      const isMoveOnly = cellHits.every((h) => h.isMove);

      parts.push(`
        <div class="preview-badge preview-badge-queue">
          ${isMoveOnly ? '🤸<span class="badge-verbose-text"> Dopad</span>' : `⚔️<span class="badge-verbose-text"> Kombo:</span> ${sumDmg}<span class="badge-verbose-text"> DMG</span>`}
          ${anyKill ? '<span class="preview-kill">💀<span class="badge-verbose-text"> SMRT</span></span>' : ''}
        </div>
      `);
    }

    // 4. Hovered player tile preview from hand
    const hoverHits = queuePreview.hoveredCells.filter((h) => h.cell === cellIndex);
    if (hoverHits.length > 0) {
      const hoverDmg = hoverHits.reduce((a, b) => a + (b.dmg || 0), 0);
      const hoverKill = hoverHits.some((h) => h.wouldKill);
      const isMove = hoverHits.every((h) => h.isMove);
      parts.push(`
        <div class="preview-badge preview-badge-hover">
          ${isMove ? '👣<span class="badge-verbose-text"> Doskok</span>' : `🎯<span class="badge-verbose-text"> Dosah:</span> ${hoverDmg}<span class="badge-verbose-text"> DMG</span>`}
          ${hoverKill ? ' 💀' : ''}
        </div>
      `);
    }

    // 5. Ghost of active Hunter if queued movement changes their cell
    if (queuePreview.heroMoved && queuePreview.ghostCell === cellIndex && state.hero.cell !== cellIndex) {
      const heroLabel = state.hero?.givenName || state.hero?.name || 'Lovec';
      parts.push(`
        <div class="hero-ghost-marker" title="Sem se ${heroLabel} přesune po odehrání fronty">
          👻<span class="badge-verbose-text"> ${heroLabel}</span> (${queuePreview.ghostFacing === 1 ? '▶' : '◀'})
        </div>
      `);
    }
  }

  if (simPreview?.ghosts) {
    for (const g of simPreview.ghosts) {
      if (g.cell === cellIndex) {
        parts.push(`
          <div class="ghost-silhouette ghost-${g.entityType}" title="Sem se ${g.name} přesune po odpalu komba">
            <span class="ghost-icon">👻</span>
            <span class="ghost-name">${g.name} (${g.facing === 1 ? '▶' : '◀'})</span>
          </div>
        `);
      }
    }
  }

  return parts.join('');
}

function collectEffectIcons(sources) {
  const icons = new Set();
  for (const s of sources) {
    for (const eff of s.effects || []) {
      if (eff.type === 'push') icons.add('💨');
      if (eff.type === 'bleed') icons.add('🩸');
      if (eff.type === 'stun') icons.add('🔔');
      if (eff.type === 'confusion') icons.add('🌀');
    }
  }
  return Array.from(icons).join('');
}

