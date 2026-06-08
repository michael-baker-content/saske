// ════════════════════════════════════════════
// ACTIONS — user-triggered mutations
// ════════════════════════════════════════════

// ════════════════════════════════════════════
// ACTIONS / MUTATIONS
// ════════════════════════════════════════════

// HP
function changeHP(sign) {
  const amt = parseInt(document.getElementById('hp-amt').value) || 1;
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
  const amt = parseInt(document.getElementById('haki-amt')?.value) || 1;
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
  const result = condBuildName('cond-select');
  if (!result) return;
  S.conditions = upsertCondition(S.conditions, result.name, result.type);
  // Reset select and level input, re-disable Add
  const sel = document.getElementById('cond-select');
  sel.value = '';
  const lvl = document.getElementById('cond-select-level');
  if (lvl) lvl.style.display = 'none';
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
  const result = condBuildName('haki-cond-select');
  if (!result) return;
  S.haki_conditions = upsertCondition(S.haki_conditions, result.name, result.type);
  const sel = document.getElementById('haki-cond-select');
  sel.value = '';
  const lvl = document.getElementById('haki-cond-select-level');
  if (lvl) lvl.style.display = 'none';
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


    // Standard (non-ammo) items
    const stdItems = inv.filter(i => !i.ammo);
    if (stdItems.length) {
      lines.push('| Item | Qty | Bulk | Description | Notes |');
      lines.push('|---|---|---|---|---|');
      stdItems.forEach(item => {
        const qty  = item.quantity != null ? item.quantity : '—';
        const bulk = calcBulk(item.bulk, item.quantity ?? 1);
        lines.push('| ' + item.name + ' | ' + qty + ' | ' + bulk + ' | ' + (item.description || '') + ' | ' + (item.notes || '') + ' |');
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

  // ── Party Conditions (Treat Condition) ──
  const pc = S.party_conditions || {};
  const tcConds = ['clumsy', 'enfeebled', 'sickened'];
  const anyPartyConditions = PARTY.some(m => {
    const mc = pc[m.name] || {};
    return tcConds.some(c => (mc[c] || 0) > 0);
  });
  if (anyPartyConditions) {
    lines.push('## Party Conditions (Treat Condition)');
    lines.push('| Member | Clumsy | Enfeebled | Sickened |');
    lines.push('|---|---|---|---|');
    PARTY.forEach(m => {
      const mc = pc[m.name] || {};
      lines.push('| ' + m.name + ' | ' + (mc.clumsy||0) + ' | ' + (mc.enfeebled||0) + ' | ' + (mc.sickened||0) + ' |');
    });
    lines.push('');
  }

  // ── Warden's Boon ──
  if (S.warden_active) {
    lines.push('## Warden\'s Boon');
    lines.push('Active — allies within 30 ft gain +1 circumstance bonus to attack rolls vs Prey.');
    lines.push('');
  }

  // ── Diseases ──
  const diseases     = S.diseases || [];
  const hakiDiseases = S.haki_diseases || [];
  if (diseases.length || hakiDiseases.length) {
    lines.push('## Diseases');
    if (diseases.length) {
      lines.push('**Saske:**');
      diseases.forEach(d => {
        const timer = d.turnsRemaining != null ? ' — ' + d.turnsRemaining + ' turns remaining' : '';
        lines.push('- ' + d.name + ' (Stage ' + d.stage + ' / ' + d.maxStage + ')' + timer);
      });
    }
    if (hakiDiseases.length) {
      lines.push('**' + C.companion.name + ':**');
      hakiDiseases.forEach(d => {
        const timer = d.turnsRemaining != null ? ' — ' + d.turnsRemaining + ' turns remaining' : '';
        lines.push('- ' + d.name + ' (Stage ' + d.stage + ' / ' + d.maxStage + ')' + timer);
      });
    }
    lines.push('');
  }

  // ── Item Effects ──
  const itemEffects = (S.item_effects || []).filter(e => e.name);
  if (itemEffects.length) {
    lines.push('## Item Effects');
    itemEffects.forEach(e => {
      const src  = e.source      ? ' (' + e.source + ')'       : '';
      const desc = e.description ? ' — ' + e.description       : '';
      lines.push('- **' + e.name + '**' + src + desc);
    });
    lines.push('');
  }

  // ── Feat Descriptions ──
  const featDescs = S.feat_descriptions || {};
  const featDescEntries = Object.entries(featDescs).filter(([, v]) => v);
  if (featDescEntries.length) {
    lines.push('## Feat Notes');
    featDescEntries.forEach(([name, desc]) => {
      lines.push('**' + name + ':** ' + desc);
    });
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
// ── Diseases ──────────────────────────────────────────────────────
function diseaseAdd() {
  const nameEl = document.getElementById('disease-name-input');
  const name = nameEl?.value.trim();
  if (!name) return;
  if (!S.diseases) S.diseases = [];
  S.diseases.push({ name, stage: 1, maxStage: 4, turnsRemaining: null, notes: '' });
  nameEl.value = '';
  document.getElementById('disease-add-btn').disabled = true;
  saveState(); syncDiseases(); syncButtonStates?.();
}

function diseaseUpdate(idx, field, value) {
  if (!S.diseases?.[idx]) return;
  S.diseases[idx][field] = value;
  saveState(); syncDiseases();
}

function diseaseRemove(idx) {
  if (!S.diseases) return;
  S.diseases.splice(idx, 1);
  saveState(); syncDiseases(); syncButtonStates?.();
}

function diseaseTick(idx, delta) {
  const d = S.diseases?.[idx];
  if (!d) return;
  const cur = d.turnsRemaining;
  if (cur === null || cur === undefined) return;
  d.turnsRemaining = Math.max(0, cur + delta);
  if (d.turnsRemaining === 0 && d.stage > 1) {
    d.stage = Math.max(1, d.stage - 1);
    d.turnsRemaining = null;
  } else if (d.turnsRemaining === 0 && d.stage === 1) {
    // Disease clears
    S.diseases.splice(idx, 1);
  }
  saveState(); syncDiseases();
}

// ── Haki Diseases ─────────────────────────────────────────────────
function hakiDiseaseAdd() {
  const nameEl = document.getElementById('haki-disease-name-input');
  const name = nameEl?.value.trim();
  if (!name) return;
  if (!S.haki_diseases) S.haki_diseases = [];
  S.haki_diseases.push({ name, stage: 1, maxStage: 4, turnsRemaining: null, notes: '' });
  nameEl.value = '';
  document.getElementById('haki-disease-add-btn').disabled = true;
  saveState(); syncHakiDiseases(); syncButtonStates?.();
}

function hakiDiseaseUpdate(idx, field, value) {
  if (!S.haki_diseases?.[idx]) return;
  S.haki_diseases[idx][field] = value;
  saveState(); syncHakiDiseases();
}

function hakiDiseaseRemove(idx) {
  if (!S.haki_diseases) return;
  S.haki_diseases.splice(idx, 1);
  saveState(); syncHakiDiseases(); syncButtonStates?.();
}

function hakiDiseaseTick(idx, delta) {
  const d = S.haki_diseases?.[idx];
  if (!d) return;
  const cur = d.turnsRemaining;
  if (cur === null || cur === undefined) return;
  d.turnsRemaining = Math.max(0, cur + delta);
  if (d.turnsRemaining === 0 && d.stage > 1) {
    d.stage = Math.max(1, d.stage - 1);
    d.turnsRemaining = null;
  } else if (d.turnsRemaining === 0 && d.stage === 1) {
    S.haki_diseases.splice(idx, 1);
  }
  saveState(); syncHakiDiseases();
}

// ── Party Condition Tracking (Treat Condition feat) ───────────────
const TC_CONDITIONS = ['clumsy', 'enfeebled', 'sickened'];
const TC_MAX = 4;

function setPartyCondition(memberName, condName, delta) {
  if (!S.party_conditions) S.party_conditions = {};
  if (!S.party_conditions[memberName]) {
    S.party_conditions[memberName] = { clumsy: 0, enfeebled: 0, sickened: 0 };
  }
  const cur = S.party_conditions[memberName][condName] ?? 0;
  const next = Math.max(0, Math.min(TC_MAX, cur + delta));
  S.party_conditions[memberName][condName] = next;

  // For Saske: pipe into S.conditions
  const member = PARTY.find(p => p.name === memberName);
  if (member?.isSelf) {
    _syncMemberCondition(memberName, condName, next, false);
  }
  // For Haki: pipe into S.haki_conditions
  if (member?.isHaki) {
    _syncMemberCondition(memberName, condName, next, true);
  }

  saveState();
  syncAll();
}

function _syncMemberCondition(memberName, condName, value, isHaki) {
  const arr = isHaki ? S.haki_conditions : S.conditions;
  const family = condName.charAt(0).toUpperCase() + condName.slice(1);
  // Remove existing entry for this family
  const filtered = arr.filter(c => !c.name.toLowerCase().startsWith(condName));
  if (value > 0) {
    filtered.push({ name: family + ' ' + value, type: 'bad' });
  }
  if (isHaki) S.haki_conditions = filtered;
  else S.conditions = filtered;
}

// ── Feat description modal ────────────────────────────────────────
let _featModalName = null;

function openFeatModal(featName) {
  _featModalName = featName;
  const desc = (S.feat_descriptions || {})[featName] || '';
  document.getElementById('feat-modal-title').textContent = featName;
  document.getElementById('feat-desc-input').value = desc;
  // Hide source row (feat modals don't need it)
  const srcRow = document.getElementById('feat-source-row');
  if (srcRow) srcRow.style.display = 'none';
  const bd = document.getElementById('feat-modal-backdrop');
  bd.style.display = 'flex';
  setTimeout(() => document.getElementById('feat-desc-input').focus(), 80);
}

function saveFeatDesc() {
  if (!_featModalName) return;
  if (!S.feat_descriptions) S.feat_descriptions = {};
  const val = document.getElementById('feat-desc-input').value.trim();
  S.feat_descriptions[_featModalName] = val;
  saveState();
  featModalCloseDirect();
  buildInfo?.();  // re-render feats so tooltip updates
}

function clearFeatDesc() {
  if (!_featModalName) return;
  if (!S.feat_descriptions) S.feat_descriptions = {};
  delete S.feat_descriptions[_featModalName];
  saveState();
  featModalCloseDirect();
  buildInfo?.();
}

function featModalClose(e) {
  if (e.target.id === 'feat-modal-backdrop') featModalCloseDirect();
}
function featModalCloseDirect() {
  document.getElementById('feat-modal-backdrop').style.display = 'none';
  _featModalName = null;
  _ieModalIdx = null;
}

// ── Item Effects ──────────────────────────────────────────────────
function ieAdd() {
  const nameEl   = document.getElementById('ie-name-input');
  const sourceEl = document.getElementById('ie-source-input');
  const name   = nameEl?.value.trim();
  const source = sourceEl?.value.trim();
  if (!name) return;
  if (!S.item_effects) S.item_effects = [];
  S.item_effects.push({ name, source: source || '', description: '' });
  nameEl.value = '';
  if (sourceEl) sourceEl.value = '';
  document.getElementById('ie-add-btn').disabled = true;
  saveState(); syncItemEffects();
}

function ieRemove(idx) {
  S.item_effects?.splice(idx, 1);
  saveState(); syncItemEffects();
}

let _ieModalIdx = null;

function openIEModal(idx) {
  const effect = S.item_effects?.[idx];
  if (!effect) return;
  _ieModalIdx = idx;
  document.getElementById('feat-modal-title').textContent = effect.name;
  document.getElementById('feat-desc-input').value = effect.description || '';
  // Show source row for item effects
  const srcRow = document.getElementById('feat-source-row');
  const srcInput = document.getElementById('feat-source-input');
  if (srcRow) srcRow.style.display = 'block';
  if (srcInput) srcInput.value = effect.source || '';
  document.getElementById('feat-modal-backdrop').style.display = 'flex';
  setTimeout(() => document.getElementById('feat-desc-input').focus(), 80);
}

// Override saveFeatDesc/clearFeatDesc to handle item effects when _ieModalIdx is set
const _origSaveFeatDesc = saveFeatDesc;
saveFeatDesc = function() {
  if (_ieModalIdx !== null) {
    const val    = document.getElementById('feat-desc-input').value.trim();
    const srcVal = document.getElementById('feat-source-input')?.value.trim() || '';
    if (S.item_effects?.[_ieModalIdx]) {
      S.item_effects[_ieModalIdx].description = val;
      S.item_effects[_ieModalIdx].source      = srcVal;
    }
    saveState();
    featModalCloseDirect();
    syncItemEffects();
    _ieModalIdx = null;
  } else {
    _origSaveFeatDesc();
  }
};

const _origClearFeatDesc = clearFeatDesc;
clearFeatDesc = function() {
  if (_ieModalIdx !== null) {
    if (S.item_effects?.[_ieModalIdx]) {
      S.item_effects[_ieModalIdx].description = '';
    }
    saveState();
    featModalCloseDirect();
    syncItemEffects();
    _ieModalIdx = null;
  } else {
    _origClearFeatDesc();
  }
};
