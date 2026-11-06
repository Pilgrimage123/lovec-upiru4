// @ts-nocheck
let tooltipEl = null;

export function initTooltips() {
  if (tooltipEl) return;
  tooltipEl = document.createElement('div');
  tooltipEl.id = 'neprakta-tooltip';
  tooltipEl.className = 'neprakta-tooltip hidden';
  document.body.appendChild(tooltipEl);

  document.addEventListener('mousemove', (e) => {
    if (!tooltipEl || tooltipEl.classList.contains('hidden')) return;
    if (tooltipEl.dataset.pinnedTouch === '1') return;
    positionTooltip(e.clientX, e.clientY);
  });

  document.addEventListener(
    'touchstart',
    (e) => {
      if (!tooltipEl || tooltipEl.classList.contains('hidden')) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target && target.closest('[data-enemy-id], [data-talisman-id], [data-smart-info], .terrain-decal-wrapper, .diegetic-gate-portal')) {
        return;
      }
      hideTooltip();
    },
    { passive: true }
  );

  window.addEventListener('scroll', () => hideTooltip(), { passive: true });
  window.addEventListener('resize', () => hideTooltip(), { passive: true });
}

export function showTooltip(htmlContent, clientX = 0, clientY = 0, isTouch = false) {
  if (!tooltipEl) initTooltips();
  tooltipEl.innerHTML = htmlContent;
  tooltipEl.dataset.pinnedTouch = isTouch ? '1' : '0';
  tooltipEl.classList.remove('hidden');
  positionTooltip(clientX, clientY);
}

export function hideTooltip() {
  if (!tooltipEl) return;
  tooltipEl.dataset.pinnedTouch = '0';
  tooltipEl.classList.add('hidden');
}

function positionTooltip(x, y) {
  if (!tooltipEl) return;
  const vw = window.innerWidth || 360;
  const vh = window.innerHeight || 640;
  const margin = 8;
  const pad = 12;

  if (vh <= 540) {
    tooltipEl.style.maxHeight = `${Math.max(180, vh - 16)}px`;
    tooltipEl.style.overflowY = 'auto';
  } else {
    tooltipEl.style.maxHeight = '';
    tooltipEl.style.overflowY = '';
  }

  const rect = tooltipEl.getBoundingClientRect();

  // On narrow phone screens, center horizontally for maximum legibility
  let left = vw <= 480 ? Math.round((vw - rect.width) / 2) : x + pad;
  let top = y + pad;

  if (left + rect.width > vw - margin) {
    left = Math.max(margin, x - rect.width - pad);
  }
  if (left < margin) {
    left = margin;
  }

  if (top + rect.height > vh - margin) {
    top = Math.max(margin, y - rect.height - pad);
  }
  if (top + rect.height > vh - margin) {
    top = Math.max(margin, vh - rect.height - margin);
  }
  if (top < margin) {
    top = margin;
  }

  tooltipEl.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
}

