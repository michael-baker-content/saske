// ════════════════════════════════════════════
// ACTIONS — user-triggered mutations
// ════════════════════════════════════════════

// ════════════════════════════════════════════
// ACTIONS / MUTATIONS
// ════════════════════════════════════════════

// HP
function changeHP(sign) {
  const amt = parseInt(document.getElementById('hp-amt').value) || 0;
  if (!amt) return;
  if (sign < 0) {
    // Damage: drain temp HP first, then real HP
    let dmg = amt;
    const tmpAbsorb = Math.min(S.tmp_hp, dmg);
    S.tmp_hp = Math.max(0, S.tmp_hp - tmpAbsorb);
    dmg -= tmpAbsorb;
    S.hp = Math.max(0, S.hp - dmg);
  } else {
    // Healing: only restores real HP, not temp (PF2e rule)
    S.hp = Math.min(C.defenses.hp_max, S.hp + amt);
  }
  saveState(); syncHP();
  document.getElementById('hp-amt').value = '';
}
function setHP(val) { S.hp = Math.min(C.defenses.hp_max, Math.max(0, val)); saveState(); syncHP(); }
function toggleTmpStrip(who) {
  const stripId  = who === 'haki' ? 'haki-tmp-strip'  : 'saske-tmp-strip';
  const toggleId = who === 'haki' ? 'haki-tmp-toggle' : 'saske-tmp-toggle';
  const strip  = document.getElementById(stripId);
  const toggle = document.getElementById(toggleId);
  if (!strip) return;
  const isOpen = strip.style.display !== 'none';
  strip.style.display = isOpen ? 'none' : 'flex';
  toggle?.classList.toggle('tmp-toggle-active', !isOpen);
  // Auto-focus the amount input when opening
  if (!isOpen) {
    const inputId = who === 'haki' ? 'haki-tmp-amt' : 'tmp-amt';
    setTimeout(() => document.getElementById(inputId)?.focus(), 50);
  }
}

function setTmpHP() {
  const val = parseInt(document.getElementById('tmp-amt').value);
  if (isNaN(val) || val < 0) return;
  // PF2e: only keep higher of new vs existing temp HP
  S.tmp_hp = Math.max(S.tmp_hp, val);
  document.getElementById('tmp-amt').value = '';
  saveState(); syncHP();
  // Auto-close if temp HP is now set
  if (S.tmp_hp > 0) {
    const strip = document.getElementById('saske-tmp-strip');
    if (strip) strip.style.display = 'none';
    document.getElementById('saske-tmp-toggle')?.classList.remove('tmp-toggle-active');
  }
}
function clearTmpHP() {
  S.tmp_hp = 0;
  saveState(); syncHP();
}
function fullRest() {
  S.hp = C.defenses.hp_max;
  S.tmp_hp = 0;
  setHakiHP(C.companion.hp_max);
  saveState(); syncHP();
}

// Haki HP
function changeHakiHP(sign) {
  const amt = parseInt(document.getElementById('haki-amt')?.value) || 0;
  if (!amt) return;
  if (sign < 0) {
    let dmg = amt;
    const tmpAbsorb = Math.min(S.haki_tmp_hp, dmg);
    S.haki_tmp_hp = Math.max(0, S.haki_tmp_hp - tmpAbsorb);
    dmg -= tmpAbsorb;
    S.haki_hp = Math.max(0, S.haki_hp - dmg);
  } else {
    S.haki_hp = Math.min(S.haki_hp_max, S.haki_hp + amt);
  }
  saveState(); syncHakiHP();
  const hakiAmt = document.getElementById('haki-amt');
  if (hakiAmt) hakiAmt.value = '';
}
function setHakiHP(val) {
  S.haki_hp = Math.min(S.haki_hp_max, Math.max(0, val));
  S.haki_tmp_hp = 0;
  saveState(); syncHakiHP();
}
function setHakiTmpHP() {
  const val = parseInt(document.getElementById('haki-tmp-amt').value);
  if (isNaN(val) || val < 0) return;
  S.haki_tmp_hp = Math.max(S.haki_tmp_hp, val);
  document.getElementById('haki-tmp-amt').value = '';
  saveState(); syncHakiHP();
  if (S.haki_tmp_hp > 0) {
    const strip = document.getElementById('haki-tmp-strip');
    if (strip) strip.style.display = 'none';
    document.getElementById('haki-tmp-toggle')?.classList.remove('tmp-toggle-active');
  }
}
function clearHakiTmpHP() {
  S.haki_tmp_hp = 0;
  saveState(); syncHakiHP();
}

// Prey
function setPrey() {
  const val = document.getElementById('prey-input')?.value.trim();
  if (!val) return;
  S.prey = val;
  document.getElementById('prey-input').value = '';
  saveState(); syncPrey();
}
function clearPrey() { S.prey = ''; saveState(); syncPrey(); }

// Actions
function toggleAction(id) {
  S.actions[id] = !S.actions[id];
  saveState(); syncActions();
}
function resetActions() {
  Object.keys(S.actions).forEach(k => S.actions[k] = false);
  saveState(); syncActions();
}

// Warden
function toggleWarden() {
  S.warden_active = !S.warden_active;
  saveState(); syncWarden();
}

// ─── Ranked condition helpers ────────────────────────────────────
// Conditions like "Clumsy 1" / "Clumsy 2" share a family name.
// Only one rank per family is allowed; adding a higher rank replaces lower.

function addCondition() {
  const sel = document.getElementById('cond-select');
  const val = sel.value; if (!val) return;
  const [name, type] = val.split('|');
  S.conditions = upsertCondition(S.conditions, name, type);
  sel.value = '';
  document.getElementById('cond-select-add-btn').disabled = true;
  saveState(); syncConditions(); applyConditionEffects();
}
function removeCondition(name) {
  S.conditions = S.conditions.filter(c => c.name !== name);
  saveState(); syncConditions(); applyConditionEffects();
}
function clearConditions() { S.conditions = []; saveState(); syncConditions(); applyConditionEffects(); }

// Conditions (Haki)
function addHakiCondition() {
  const sel = document.getElementById('haki-cond-select');
  const val = sel.value; if (!val) return;
  const [name, type] = val.split('|');
  S.haki_conditions = upsertCondition(S.haki_conditions, name, type);
  sel.value = '';
  document.getElementById('haki-cond-select-add-btn').disabled = true;
  saveState(); syncHakiConditions(); applyHakiConditionEffects();
}
function removeHakiCondition(name) {
  S.haki_conditions = S.haki_conditions.filter(c => c.name !== name);
  saveState(); syncHakiConditions(); applyHakiConditionEffects();
}
function clearHakiConditions() { S.haki_conditions = []; saveState(); syncHakiConditions(); applyHakiConditionEffects(); }

// ─── Haki Barding Toggle ──────────────────────────────────────────

function changeBM(d) { S.bm_count = Math.max(0, S.bm_count + d); saveState(); syncCounters(); }


// ════════════════════════════════════════════
// SESSION CONTROLS
// ════════════════════════════════════════════

// ── Reset ────────────────────────────────────
function confirmResetSession() {
  document.getElementById('session-confirm').style.display = 'block';
  document.getElementById('session-feedback').style.display = 'none';
}
function cancelReset() {
  document.getElementById('session-confirm').style.display = 'none';
}
function executeReset() {
  try { localStorage.removeItem(LS_KEY); } catch(e) {}
  location.reload();
}

// ── Export Report ─────────────────────────────
function exportSessionReport() {
  const now = new Date();
  const timestamp = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
                  + ' at ' + now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });

  const lines = [];

  // Header
  lines.push('# Session Report — ' + C.meta.name);
  lines.push('**' + C.meta.subtitle + '**');
  lines.push('*Exported ' + timestamp + '*');
  lines.push('');

  // ── Saske HP ──
  lines.push('## Hit Points');
  const hpMax  = C.defenses.hp_max;
  const hpCur  = S.hp ?? hpMax;
  const tmpHP  = S.tmp_hp ?? 0;
  const hpPct  = Math.round(hpCur / hpMax * 100);
  lines.push('**Saske:** ' + hpCur + ' / ' + hpMax + ' (' + hpPct + '%)' + (tmpHP > 0 ? ' + ' + tmpHP + ' temp HP' : ''));

  // Haki HP
  const hkMax  = S.haki_hp_max ?? C.companion.hp_max;
  const hkCur  = S.haki_hp ?? hkMax;
  const hkTmp  = S.haki_tmp_hp ?? 0;
  const hkPct  = Math.round(hkCur / hkMax * 100);
  lines.push('**' + C.companion.name + ':** ' + hkCur + ' / ' + hkMax + ' (' + hkPct + '%)' + (hkTmp > 0 ? ' + ' + hkTmp + ' temp HP' : ''));
  lines.push('');

  // ── Conditions ──
  const sasConds = (S.conditions || []);
  const hakConds = (S.haki_conditions || []);
  if (sasConds.length || hakConds.length) {
    lines.push('## Active Conditions');
    if (sasConds.length) lines.push('**Saske:** ' + sasConds.map(c => c.name).join(', '));
    else lines.push('**Saske:** None');
    if (hakConds.length) lines.push('**' + C.companion.name + ':** ' + hakConds.map(c => c.name).join(', '));
    else lines.push('**' + C.companion.name + ':** None');
    lines.push('');
  }

  // ── Hunt Prey ──
  if (S.prey) {
    lines.push('## Hunt Prey');
    lines.push('Currently hunting: **' + S.prey + '**');
    lines.push('');
  }

  // ── Inventory ──
  const inv = S.inventory || [];
  lines.push('## Inventory');
  if (inv.length) {
    // Bulk helper (mirrors panels-inventory.js calcBulk)
    const calcBulkExport = (bulkStr, qty) => {
      const q = qty ?? 1;
      const b = (bulkStr ?? '—').trim();
      if (b === '—' || b === '-') return '—';
      const lMatch = b.match(/^(\d*)L$/i);
      if (lMatch) {
        const perItem = lMatch[1] === '' ? 1 : parseInt(lMatch[1]);
        const totalL  = q * perItem;
        if (totalL < 10) return totalL + 'L';
        const bulk = Math.floor(totalL / 10);
        const remL = totalL % 10;
        return remL === 0 ? String(bulk) : bulk + ' (' + remL + 'L)';
      }
      const n = parseFloat(b);
      if (!isNaN(n)) { const t = n * q; return String(Number.isInteger(t) ? t : t); }
      return b;
    };

    // Standard (non-ammo) items
    const stdItems = inv.filter(i => !i.ammo);
    if (stdItems.length) {
      lines.push('| Item | Qty | Bulk | Notes |');
      lines.push('|---|---|---|---|');
      stdItems.forEach(item => {
        const qty  = item.quantity != null ? item.quantity : '—';
        const bulk = calcBulkExport(item.bulk, item.quantity ?? 1);
        lines.push('| ' + item.name + ' | ' + qty + ' | ' + bulk + ' | ' + (item.notes || '') + ' |');
      });
      lines.push('');
    }

    // Ammo items
    const ammoItems = inv.filter(i => i.ammo && i.quantity != null);
    if (ammoItems.length) {
      lines.push('**Ammunition**');
      lines.push('| Item | Bundles | Per Bundle | Total | Used | Remaining |');
      lines.push('|---|---|---|---|---|---|');
      ammoItems.forEach(item => {
        const perBundle = item.ammoPerBundle ?? 1;
        const total     = item.quantity * perBundle;
        const used      = item.used ?? 0;
        const remaining = total - used;
        lines.push('| ' + item.name + ' | ' + item.quantity + ' | ' + perBundle + ' | ' + total + ' | ' + used + ' | ' + remaining + ' |');
      });
      lines.push('');
    }
  } else {
    lines.push('*No inventory data.*');
    lines.push('');
  }

  // ── Battle Medicine Cooldowns ──
  const cds = S.bm_cooldowns || {};
  const cdEntries = Object.entries(cds);
  if (cdEntries.length) {
    lines.push('## Battle Medicine Cooldowns');
    cdEntries.forEach(([name, mins]) => {
      const status = mins > 10 ? 'On cooldown (' + mins + ' min remaining)' : 'Ready';
      lines.push('- **' + name + ':** ' + status);
    });
    lines.push('');
  }

  // ── Session Notes ──
  const notes = (S.notes || '').trim();
  lines.push('## Session Notes');
  if (notes) {
    lines.push(notes);
  } else {
    lines.push('*No notes recorded.*');
  }
  lines.push('');

  // Copy to clipboard
  const markdown = lines.join('\n');
  const feedbackEl = document.getElementById('session-feedback');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(markdown).then(() => {
      showSessionFeedback('✓ Report copied to clipboard', 'success');
    }).catch(() => {
      fallbackCopy(markdown);
    });
  } else {
    fallbackCopy(markdown);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try {
    document.execCommand('copy');
    showSessionFeedback('✓ Report copied to clipboard', 'success');
  } catch(e) {
    showSessionFeedback('✗ Copy failed — try a different browser', 'error');
  }
  document.body.removeChild(ta);
}

function showSessionFeedback(msg, type) {
  const el = document.getElementById('session-feedback');
  if (!el) return;
  el.textContent = msg;
  el.className = 'session-feedback session-feedback-' + type;
  el.style.display = 'block';
  document.getElementById('session-confirm').style.display = 'none';
  setTimeout(() => { el.style.display = 'none'; }, 3500);
}




// ── Notes ────────────────────────────────────────────────────────
function saveNotes() {
  S.notes = document.getElementById('notes')?.value || '';
  saveState();
  const t = document.getElementById('notes-toast');
  if (t) { t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1500); }
}

function clearNotes() {
  S.notes = '';
  const el = document.getElementById('notes');
  if (el) el.value = '';
  saveState();
}