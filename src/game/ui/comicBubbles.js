// @ts-nocheck
/**
 * COMIC SPEECH BUBBLE SYSTEM
 * Creates dynamic, authentic comic-book balloons over character cells
 * for battle cries, threats, last words, and smart quips.
 */

const activeBubblesByCell = new Map();

/**
 * Spawns an animated comic bubble over a board cell.
 * @param {HTMLElement} container The stage / board container element
 * @param {number} cellIdx Grid index of the speaker (0-indexed)
 * @param {string} text Text spoken
 * @param {'battle_cry' | 'threat' | 'last_words' | 'quip'} variant Visual tone
 * @param {object} options Speaker info, facing, duration, delay
 */
export function spawnComicBubble(container, cellIdx, text, variant = 'quip', options = {}) {
  if (!text || typeof cellIdx !== 'number' || cellIdx < 0) return null;

  const {
    speaker = '',
    icon = '',
    facing = 1,
    durationMs = null,
    delayMs = 0
  } = options;

  if (delayMs > 0) {
    const timer = setTimeout(() => {
      spawnComicBubble(container, cellIdx, text, variant, { ...options, delayMs: 0 });
    }, delayMs);
    return timer;
  }

  // Remove existing bubble on this cell if forceReplace is true
  if (activeBubblesByCell.has(cellIdx)) {
    const existing = activeBubblesByCell.get(cellIdx);
    if (existing && existing.element) {
      dismissBubble(existing.element);
    }
  }

  // Find target board cell
  const root = container || document.getElementById('center-stage') || document.body;
  const cell = root.querySelector(`.board-cell[data-cell-index="${cellIdx}"]`);
  if (!cell) return null;

  const r = cell.getBoundingClientRect();
  const bubble = document.createElement('div');
  bubble.className = `comic-speech-bubble variant-${variant}`;
  bubble.setAttribute('role', 'alert');
  bubble.setAttribute('aria-live', 'polite');

  const vw = window.innerWidth || 640;
  const vh = window.innerHeight || 480;
  const isCompactLandscape = vh <= 540 && vw > vh;

  // Horizontal anchor: centered above the cell, clamped away from screen edges
  const posX = Math.max(95, Math.min(vw - 95, Math.round(r.left + r.width / 2)));
  // Vertical anchor: just above the top edge of the cell / entity, or slightly lower in compact landscape so it stays inside the viewport
  const posY = isCompactLandscape
    ? Math.max(68, Math.round(r.top + 28))
    : Math.max(30, Math.round(r.top - 8));

  bubble.style.left = `${posX}px`;
  bubble.style.top = `${posY}px`;

  // Tail direction based on facing direction (facing 1 = right, facing -1 = left)
  const tailClass = facing === 1 ? 'tail-left' : facing === -1 ? 'tail-right' : 'tail-center';

  const speakerHtml = speaker || icon
    ? `<div class="comic-bubble-speaker">${icon ? `<span class="comic-speaker-icon">${icon}</span>` : ''}<span>${escapeHtml(speaker)}</span></div>`
    : '';

  bubble.innerHTML = `
    <div class="comic-bubble-inner">
      ${speakerHtml}
      <div class="comic-bubble-quote">„${escapeHtml(text)}“</div>
      <div class="comic-bubble-tail ${tailClass}" aria-hidden="true"></div>
    </div>
  `;

  // Click / tap to dismiss immediately
  bubble.addEventListener('click', (e) => {
    e.stopPropagation();
    dismissBubble(bubble, cellIdx);
  });

  document.body.appendChild(bubble);

  // Auto dismiss timeout
  const effectiveDuration = durationMs || Math.max(2400, Math.min(3800, text.length * 60));
  const dismissTimer = setTimeout(() => {
    dismissBubble(bubble, cellIdx);
  }, effectiveDuration);

  activeBubblesByCell.set(cellIdx, { element: bubble, timer: dismissTimer });
  return bubble;
}

function dismissBubble(bubbleEl, cellIdx = null) {
  if (!bubbleEl || bubbleEl._isDismissing) return;
  bubbleEl._isDismissing = true;
  bubbleEl.classList.add('bubble-closing');

  if (typeof cellIdx === 'number' && activeBubblesByCell.get(cellIdx)?.element === bubbleEl) {
    clearTimeout(activeBubblesByCell.get(cellIdx).timer);
    activeBubblesByCell.delete(cellIdx);
  }

  setTimeout(() => {
    bubbleEl.remove();
  }, 220);
}

export function clearAllComicBubbles() {
  for (const entry of activeBubblesByCell.values()) {
    if (entry && entry.element) {
      clearTimeout(entry.timer);
      entry.element.remove();
    }
  }
  activeBubblesByCell.clear();
  document.querySelectorAll('.comic-speech-bubble').forEach((el) => el.remove());
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
