// ════════════════════════════════════════════
// NAVIGATION — tabs, swipe, tooltips, boot
// ════════════════════════════════════════════


// ════════════════════════════════════════════
// BOOT
// ════════════════════════════════════════════
fetch('character.json')
  .then(r => r.json())
  .then(data => {
    C = data;
    loadState();
    // Initialise HP from JSON if never set
    if (S.hp === null)       S.hp       = C.defenses.hp_max;
    if (S.haki_hp === null)  S.haki_hp  = C.companion.hp_max;
    S.haki_hp_max = C.companion.hp_max;
    // Seed inventory from JSON on first load; preserve state on subsequent loads
    if (!S.inventory) {
      S.inventory = C.inventory.map(i => ({
        name:          i.name,
        bulk:          i.bulk,
        quantity:      i.quantity      ?? 1,
        description:   i.description   ?? '',
        notes:         i.notes         ?? '',
        used:          0,
        ammo:          i.ammo          ?? false,
        ammoPerBundle: i.ammoPerBundle ?? undefined,
      }));
    } else {
      // Migrate existing state items that predate the ammo/description fields
      S.inventory.forEach(item => {
        if (item.ammo === undefined) item.ammo = false;
        if (item.description === undefined) item.description = '';
      });
    }
    saveState();
    build();
    document.getElementById('loading').style.display = 'none';
    document.getElementById('shell').style.display = 'flex';
    syncAll();
  })
  .catch(err => {
    document.getElementById('loading').innerHTML =
      `<p style="color:var(--red-b);font-family:'Inter',sans-serif;font-weight:600;font-size:13px;padding:20px;text-align:center">
        Could not load character.json.<br><br>
        <span style="color:var(--text3);font-size:11px">Make sure index.html and character.json are in the same folder,<br>and open via a local server (e.g. <code style="color:var(--gold)">npx serve .</code>).</span>
      </p>`;
    console.error(err);
  });


// ════════════════════════════════════════════
// TABS + SWIPE
// ════════════════════════════════════════════
let currentTab = 0;
const PANEL_COUNT = 5;

function panelWidth() {
  return document.querySelector('.panel')?.offsetWidth || window.innerWidth;
}

function goTab(n) {
  currentTab = Math.max(0, Math.min(PANEL_COUNT - 1, n));
  const pw = panelWidth();
  document.getElementById('track').style.transform = `translateX(${-currentTab * pw}px)`;
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === currentTab));
  if (currentTab === 1) syncHakiHP();
  if (currentTab === 3) { syncCounters(); syncBMTracker(); syncInventory(); }
}

function initSwipe() {
  const track = document.getElementById('track');
  let tx = 0, ty = 0, dragging = false;
  track.addEventListener('touchstart', e => {
    tx = e.touches[0].clientX; ty = e.touches[0].clientY; dragging = false;
  }, { passive: true });
  track.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - tx;
    const dy = e.touches[0].clientY - ty;
    if (!dragging && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) dragging = true;
    if (dragging) {
      const pw = panelWidth();
      const offset = -currentTab * pw + dx;
      track.style.transition = 'none';
      track.style.transform = `translateX(${offset}px)`;
    }
  }, { passive: true });
  track.addEventListener('touchend', e => {
    track.style.transition = '';
    const dx = e.changedTouches[0].clientX - tx;
    if (dragging && Math.abs(dx) > 45) goTab(dx < 0 ? currentTab + 1 : currentTab - 1);
    else goTab(currentTab);
    dragging = false;
  }, { passive: true });
}



// ── Fixed-position tooltip system ──────────────────────────────────
// Uses getBoundingClientRect + position:fixed to escape overflow/clip contexts
// Works on desktop (mouseenter/leave) and mobile (touchstart toggle)
(function() {
  const tip = document.getElementById('stat-tooltip');
  if (!tip) return;

  let hideTimer = null;

  function showTip(el) {
    const text = el.dataset.tooltip;
    if (!text) return;
    clearTimeout(hideTimer);
    tip.textContent = text;
    tip.classList.add('visible');
    positionTip(el);
  }

  function hideTip() {
    hideTimer = setTimeout(() => tip.classList.remove('visible'), 80);
  }

  function positionTip(el) {
    const rect = el.getBoundingClientRect();
    const tipW = tip.offsetWidth || 200;
    const margin = 8;
    // Centre above the tile
    let left = rect.left + rect.width / 2 - tipW / 2;
    // Clamp to viewport
    left = Math.max(margin, Math.min(left, window.innerWidth - tipW - margin));
    const top = rect.top - tip.offsetHeight - 10;
    tip.style.left = left + 'px';
    tip.style.top  = Math.max(margin, top) + 'px';
  }

  // Desktop: mouseenter / mouseleave
  document.addEventListener('mouseenter', e => {
    if (!(e.target instanceof Element)) return;
    const el = e.target.closest('.has-tooltip');
    if (el) showTip(el);
  }, true);
  document.addEventListener('mouseleave', e => {
    if (!(e.target instanceof Element)) return;
    if (e.target.closest('.has-tooltip')) hideTip();
  }, true);

  // Mobile: tap to toggle
  document.addEventListener('touchstart', e => {
    if (!(e.target instanceof Element)) return;
    const el = e.target.closest('.has-tooltip');
    if (el) {
      e.preventDefault();
      if (tip.classList.contains('visible') && tip._anchor === el) {
        tip.classList.remove('visible');
        tip._anchor = null;
      } else {
        tip._anchor = el;
        showTip(el);
      }
    } else {
      tip.classList.remove('visible');
      tip._anchor = null;
    }
  }, { passive: false });

  // Reposition on scroll/resize
  window.addEventListener('scroll', () => {
    if (tip.classList.contains('visible') && tip._anchor) positionTip(tip._anchor);
  }, { passive: true });
})();



// Re-snap panel position on resize
window.addEventListener('resize', () => goTab(currentTab));
