// ════════════════════════════════════════════
// MEDICINE — medicine tool + BM cooldowns
// ════════════════════════════════════════════

// ════════════════════════════════════════════
// MEDICINE TOOL
// ════════════════════════════════════════════

// Party data: name, level (for Robust Health), hasRobustHealth
const PARTY = [
  { name: 'Saske',  level: 8, robust: true,  isSelf: true  },
  { name: 'Haki',   level: 8, robust: false, isSelf: false },
  { name: 'Cadoc',  level: 8, robust: true,  isSelf: false },
  { name: 'Jemand', level: 8, robust: true,  isSelf: false },
  { name: 'Afi',    level: 8, robust: false, isSelf: false },
];

// DC tiers: bonusHP = base Treat Wounds tier bonus only (not Medic Ded.)
// medicDedBonus = circumstance bonus from Medic Dedication feat on success
const MED_TIERS = {
  expert:    { dc: 20, bonusHP: 10, medicDedBonus: 5,  label: 'Expert DC 20',    minAssurance: true  },
  master:    { dc: 30, bonusHP: 30, medicDedBonus: 10, label: 'Master DC 30',    minAssurance: false },
  legendary: { dc: 40, bonusHP: 50, medicDedBonus: 15, label: 'Legendary DC 40', minAssurance: false },
};

// Saske's medicine modifier
const SASKE_MED_MOD = 19;
const ASSURANCE_RESULT = 24; // 10 + Master proficiency bonus (14)

// Medicine tool state (not persisted — resets on page load)
let medState = {
  selectedTargets: new Set(),
  tier: null,
  useAssurance: false,
  action: null,
};

function buildMedicineTool() {
  // Build party member buttons
  const grid = document.getElementById('med-party-grid');
  if (!grid) return;
  grid.innerHTML = PARTY.map((p, i) => `
    <div class="med-member" id="med-member-${i}" ontouchstart="" onclick="medToggleMember(${i})">
      <div class="med-member-name">${p.name}</div>
      <div class="med-member-tag">${p.robust ? 'Robust Health' : ''}</div>
    </div>
  `).join('');

  medUpdateUI();
}

const MED_MAX_TARGETS = 4; // Ward Medic cap

function medToggleMember(i) {
  if (medState.selectedTargets.has(i)) {
    medState.selectedTargets.delete(i);
  } else {
    if (medState.selectedTargets.size >= MED_MAX_TARGETS) {
      medShowWarning(`Ward Medic allows up to ${MED_MAX_TARGETS} targets at once.`);
      return;
    }
    medState.selectedTargets.add(i);
  }
  medClearWarning();
  // Refresh member highlights
  PARTY.forEach((_, idx) => {
    const el = document.getElementById(`med-member-${idx}`);
    if (el) el.classList.toggle('selected', medState.selectedTargets.has(idx));
  });
  medClearResult();
  syncButtonStates?.();
}

function medShowWarning(msg) {
  const el = document.getElementById('med-warning');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function medClearWarning() {
  const el = document.getElementById('med-warning');
  if (el) el.style.display = 'none';
}

function medSetTier(tier) {
  medState.tier = tier;
  document.querySelectorAll('#med-tier-btns .med-tier-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tier === tier);
  });
  medUpdateUI();
  medClearResult();
  syncButtonStates?.();
}

function medSetAction(action) {
  medState.action = action;
  document.querySelectorAll('[data-action]').forEach(b => {
    b.classList.toggle('active', b.dataset.action === action);
  });
  medClearResult();
  syncButtonStates?.();
}

function medToggleAssurance() {
  medState.useAssurance = !medState.useAssurance;
  syncButtonStates?.();
  document.getElementById('med-assurance-tog').classList.toggle('on', medState.useAssurance);
  medUpdateUI();
  medClearResult();
}

function medUpdateUI() {
  const tier = MED_TIERS[medState.tier];
  const rollRow = document.getElementById('med-roll-row');
  const assuranceNote = document.getElementById('med-assurance-note');

  // Roll row visibility
  if (rollRow) rollRow.style.display = medState.useAssurance ? 'none' : 'flex';

  // Assurance validity note
  if (assuranceNote) {
    if (medState.useAssurance) {
      const beats = ASSURANCE_RESULT >= tier.dc;
      assuranceNote.textContent = beats
        ? `Auto-result ${ASSURANCE_RESULT} — beats DC ${tier.dc} ✓`
        : `Auto-result ${ASSURANCE_RESULT} — does not meet DC ${tier.dc} ✗`;
      assuranceNote.className = 'med-assurance-note ' + (beats ? 'valid' : 'invalid');
    } else {
      assuranceNote.textContent = `Auto-result: ${ASSURANCE_RESULT}`;
      assuranceNote.className = 'med-assurance-note';
    }
  }

  // Live total as d20 is typed
  const d20Input = document.getElementById('med-d20');
  const totalDisplay = document.getElementById('med-total-display');
  if (d20Input && totalDisplay) {
    const d20val = parseInt(d20Input.value);
    if (!isNaN(d20val)) {
      const total = d20val + SASKE_MED_MOD;
      totalDisplay.textContent = `= ${total}`;
    } else {
      totalDisplay.textContent = '';
    }
  }
}

// Wire up live d20 update
document.addEventListener('input', e => {
  if (e.target.id === 'med-d20') medUpdateUI();
});

function clearMedD20() {
  const inp = document.getElementById('med-d20');
  if (inp) { inp.value = ''; inp.focus(); }
  document.getElementById('med-total-display').textContent = '';
  medClearResult();
}

function medClearResult() {
  const area = document.getElementById('med-result-area');
  if (area) area.classList.remove('show');
  const diceArea = document.getElementById('med-dice-area');
  if (diceArea) diceArea.style.display = 'none';
  const diceGrid = document.getElementById('med-dice-grid');
  if (diceGrid) diceGrid.innerHTML = '';
  const applyBtn = document.getElementById('med-apply-btn');
  if (applyBtn) applyBtn.style.display = 'none';
  // Always re-enable Confirm when clearing
  const confirmBtn = document.querySelector('.med-calc-btn');
  if (confirmBtn) confirmBtn.disabled = false;
}

function medReset() {
  // Deselect all targets
  medState.selectedTargets.clear();
  PARTY.forEach((_, idx) => {
    const el = document.getElementById('med-member-' + idx);
    if (el) el.classList.remove('selected');
  });
  // Deactivate type + tier buttons
  medState.action = null;
  medState.tier   = null;
  document.querySelectorAll('[data-action]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#med-tier-btns .med-tier-btn').forEach(b => b.classList.remove('active'));
  // Reset assurance
  medState.useAssurance = false;
  document.getElementById('med-assurance-tog')?.classList.remove('on');
  // Clear roll input + total
  const d20 = document.getElementById('med-d20');
  if (d20) d20.value = '';
  document.getElementById('med-total-display').textContent = '';
  // Re-enable confirm, hide apply
  const confirmBtn = document.querySelector('.med-calc-btn');
  if (confirmBtn) confirmBtn.disabled = false;
  const applyBtn = document.getElementById('med-apply-btn');
  if (applyBtn) applyBtn.style.display = 'none';
  // Clear result + dice
  medClearResult();
  medUpdateUI();
}

function medGetCheckTotal() {
  if (medState.useAssurance) return ASSURANCE_RESULT;
  const d20 = parseInt(document.getElementById('med-d20').value);
  if (isNaN(d20)) return null;
  return d20 + SASKE_MED_MOD;
}

function medGetOutcome(total, dc) {
  // PF2e: nat 1 always crit fail, nat 20 always crit success (when using d20 roll)
  if (medState.useAssurance) {
    // Assurance: no nat 1/20 rules, just compare to DC
    if (total >= dc + 10) return 'crit';
    if (total >= dc)      return 'hit';
    if (total >= dc - 9)  return 'miss';
    return 'fail';
  }
  const d20 = parseInt(document.getElementById('med-d20').value);
  let deg = total >= dc + 10 ? 'crit' : total >= dc ? 'hit' : total >= dc - 9 ? 'miss' : 'fail';
  // Nat 20 upgrades one step, nat 1 downgrades one step
  const steps = ['fail', 'miss', 'hit', 'crit'];
  let idx = steps.indexOf(deg);
  if (d20 === 20 && idx < 3) idx++;
  if (d20 === 1  && idx > 0) idx--;
  return steps[idx];
}

// How many d8s to roll and fixed bonus HP for this tier + outcome
function medHealingProfile(outcome, tier) {
  // bonusHP = base Treat Wounds tier flat bonus (part of the action itself)
  // medicDedBonus = separate circumstance bonus from Medic Dedication (on success only)
  const bonus        = tier.bonusHP;
  const medicBonus   = (outcome === 'crit' || outcome === 'hit') ? (tier.medicDedBonus || 0) : 0;
  switch (outcome) {
    case 'crit':  return { diceCount: 4, sides: 8, bonus, medicBonus, isDamage: false };
    case 'hit':   return { diceCount: 2, sides: 8, bonus, medicBonus, isDamage: false };
    case 'miss':  return { diceCount: 0, sides: 0, bonus: 0, medicBonus: 0, isDamage: false, fixed: 0 };
    case 'fail':  return { diceCount: 1, sides: 8, bonus: 0, medicBonus: 0, isDamage: true };
  }
}

function medCalculate() {
  const targets = [...medState.selectedTargets];
  if (!targets.length) { medShowWarning('Select at least one target.'); return; }

  const tier = MED_TIERS[medState.tier];

  if (medState.useAssurance && ASSURANCE_RESULT < tier.dc) {
    medShowWarning(`Assurance (${ASSURANCE_RESULT}) does not meet DC ${tier.dc}. Use a rolled check for this tier.`);
    return;
  }

  const total = medGetCheckTotal();
  if (total === null) { medShowWarning('Enter your d20 roll.'); return; }
  medClearWarning();

  const outcome = medGetOutcome(total, tier.dc);
  const profile = medHealingProfile(outcome, tier);

  const diceArea  = document.getElementById('med-dice-area');
  const diceGrid  = document.getElementById('med-dice-grid');
  const diceLabel = document.getElementById('med-dice-label');
  const applyBtn  = document.getElementById('med-apply-btn');
  const confirmBtn = document.querySelector('.med-calc-btn');

  if (profile.diceCount > 0) {
    const isDmg = profile.isDamage;
    if (diceLabel) diceLabel.textContent = isDmg ? 'Damage Dice' : 'Healing Dice';

    diceGrid.innerHTML =
      '<div class="modal-die-group">'
      + '<input class="modal-input" type="number" id="med-die-0" placeholder="\u2014" min="1" max="' + profile.sides + '"/>'
      + '<div class="modal-die-sublabel' + (isDmg ? ' crit-label' : '') + '">'
      +   profile.diceCount + 'd' + profile.sides + (isDmg ? ' dmg' : ' heal')
      + '</div>'
      + '</div>'
      + (profile.bonus > 0
        ? '<div class="modal-die-group">'
          + '<div class="modal-flat-bonus">+' + profile.bonus + '</div>'
          + '<div class="modal-die-sublabel">tier</div>'
          + '</div>'
        : '');

    diceArea.style.display = 'block';
    // Show Apply (highlighted) — Confirm stays disabled until Apply pressed
    if (applyBtn) { applyBtn.style.display = ''; applyBtn.disabled = false; }
    if (confirmBtn) confirmBtn.disabled = true;
    setTimeout(() => document.getElementById('med-die-0')?.focus(), 60);
    medShowOutcomeBanner(outcome, total, tier);
  } else {
    if (diceArea) diceArea.style.display = 'none';
    if (applyBtn) applyBtn.style.display = 'none';
    if (confirmBtn) confirmBtn.disabled = false;
    medApplyDiceWithProfile(profile, outcome, total, tier, targets);
  }
}

function medShowOutcomeBanner(outcome, total, tier) {
  const labels = { crit: 'Critical Success', hit: 'Success', miss: 'Failure', fail: 'Critical Failure' };
  const badge = document.getElementById('med-outcome-badge');
  const summary = document.getElementById('med-roll-summary');
  if (badge) { badge.textContent = labels[outcome]; badge.className = 'med-result-outcome ' + outcome; }
  if (summary) summary.textContent = medState.useAssurance
    ? `Assurance ${total} vs DC ${tier.dc}`
    : `Roll ${total - SASKE_MED_MOD} + ${SASKE_MED_MOD} = ${total} vs DC ${tier.dc}`;
  const area = document.getElementById('med-result-area');
  if (area) area.classList.add('show');
}

function medApplyDice() {
  const tier    = MED_TIERS[medState.tier];
  const total   = medGetCheckTotal();
  const outcome = medGetOutcome(total, tier.dc);
  const profile = medHealingProfile(outcome, tier);
  const targets = [...medState.selectedTargets];

  // Single input — user enters one die value, multiply by diceCount
  const singleVal = parseInt(document.getElementById('med-die-0')?.value);
  if (isNaN(singleVal) || singleVal < 1) { alert('Enter your die roll.'); return; }
  profile.rolledDice = singleVal * profile.diceCount;

  const diceArea  = document.getElementById('med-dice-area');
  const applyBtn  = document.getElementById('med-apply-btn');
  if (diceArea) diceArea.style.display = 'none';
  if (applyBtn) applyBtn.style.display = 'none';
  // Re-enable Confirm for next use
  const confirmBtn = document.querySelector('.med-calc-btn');
  if (confirmBtn) confirmBtn.disabled = false;

  medApplyDiceWithProfile(profile, outcome, total, tier, targets);
}

function medApplyDiceWithProfile(profile, outcome, total, tier, targets) {
  medShowOutcomeBanner(outcome, total, tier);

  const resultsEl = document.getElementById('med-target-results');
  const footerEl  = document.getElementById('med-footer-note');
  if (!resultsEl) return;

  const rows = targets.map(idx => {
    const member = PARTY[idx];
    let html = '';

    if (outcome === 'miss') {
      html = `<div class="med-target-row">
        <span class="med-target-name">${member.name}</span>
        <span class="med-target-dice">No effect</span>
      </div>`;
    } else if (outcome === 'fail') {
      // Crit fail: 1d8 damage to target (profile.rolledDice for damage outcome)
      const dmg = profile.rolledDice ?? 0;
      html = `<div class="med-target-row">
        <span class="med-target-name">${member.name}</span>
        <span>
          <span class="med-target-heal damage">−${dmg} HP</span>
          <span class="med-target-dice"> (1d8 dmg)</span>
        </span>
      </div>`;
    } else {
      // Success or crit success
      const diceRolled   = profile.rolledDice ?? 0;
      const robustBonus  = member.robust ? member.level : 0;
      const medicBonus   = profile.medicBonus || 0;
      // Both are circumstance bonuses — same type cannot stack, only the higher applies
      const circumstanceBonus = Math.max(medicBonus, robustBonus);
      const baseHeal     = diceRolled + profile.bonus;
      const totalHeal    = baseHeal + circumstanceBonus;

      // Breakdown: rolled + base (tier) + circumstance
      const circLabel = robustBonus > medicBonus ? 'Robust Health' : 'Medic Ded.';
      let diceLabel = `${diceRolled}`;
      if (profile.bonus > 0) diceLabel += ` + ${profile.bonus} (base)`;
      if (circumstanceBonus > 0) diceLabel += ` + ${circumstanceBonus} (${circLabel})`;
      const robustLabel  = '';

      html = `<div class="med-target-row">
        <div>
          <span class="med-target-name">${member.name}</span>
          <span class="med-target-dice"> ${diceLabel}</span>
        </div>
        <span class="med-target-heal">+${totalHeal} HP</span>
      </div>`;
    }
    return html;
  });

  resultsEl.innerHTML = rows.join('');

  // Footer notes
  const notes = [];
  if (outcome === 'hit' || outcome === 'crit') {
    const names = targets.map(i => PARTY[i].name).join(', ');
    if (medState.action === 'battle') {
      notes.push(`${names}: immune to Battle Medicine for 1 hr (Medic Dedication)`);
    } else {
      notes.push(`${names}: immune to Treat Wounds for 1 hr (Continual Recovery)`);
    }
  } else if (outcome === 'fail') {
    notes.push('Critical failure: 1d8 damage dealt. No immunity applied.');
  } else {
    notes.push('Failure: no healing, no immunity applied.');
  }
  if (footerEl) footerEl.innerHTML = notes.map(n=>`▸ ${n}`).join('<br/>');

  // Start cooldown tracking on success/crit success only (crit fail causes damage, not immunity)
  if (outcome === 'hit' || outcome === 'crit') {
    targets.forEach(idx => bmStartTracking(PARTY[idx].name, 60));
    syncBMTracker();
  }

  // UI resets when user taps Clear — see med-clear-btn
}


// ════════════════════════════════════════════
// BATTLE MEDICINE COOLDOWN TRACKER
// ════════════════════════════════════════════

// S.bm_cooldowns = { memberName: minutesRemaining }

// ── BM Cooldown Tracking ──────────────────────────────────────────
const BM_TOTAL_COOLDOWN = 60;
const BM_RECENT_THRESHOLD = 50; // "healed recently" if > 10 min remaining


function bmStartTracking(name, minutes) {
  if (!S.bm_cooldowns) S.bm_cooldowns = {};
  S.bm_cooldowns[name] = minutes;
  saveState();
}

function bmRemoveMember(name) {
  if (S.bm_cooldowns) delete S.bm_cooldowns[name];
  saveState();
  syncBMTracker();
}

function bmAdjust(name, delta) {
  if (!S.bm_cooldowns || !(name in S.bm_cooldowns)) return;
  S.bm_cooldowns[name] = Math.max(0, Math.min(BM_TOTAL_COOLDOWN, S.bm_cooldowns[name] + delta));
  if (S.bm_cooldowns[name] === 0) delete S.bm_cooldowns[name];
  saveState();
  syncBMTracker();
}

function bmTickAll() {
  if (!S.bm_cooldowns) return;
  Object.keys(S.bm_cooldowns).forEach(name => {
    S.bm_cooldowns[name] = Math.max(0, S.bm_cooldowns[name] - 10);
    if (S.bm_cooldowns[name] === 0) delete S.bm_cooldowns[name];
  });
  saveState();
  syncBMTracker();
}

function bmToggleMember(name) {
  if (!S.bm_cooldowns) S.bm_cooldowns = {};
  if (name in S.bm_cooldowns) {
    bmRemoveMember(name);
  } else {
    bmStartTracking(name, BM_TOTAL_COOLDOWN);
    syncBMTracker();
  }
}

function buildBMTracker() {
  // The add-row chips and grid are rendered by syncBMTracker — just ensure they exist
}

function syncBMTracker() {
  const grid = document.getElementById('bm-tracker-grid');
  const addRow = document.getElementById('bm-add-row');
  if (!grid) return;

  const cooldowns = S.bm_cooldowns || {};
  const tracked = Object.entries(cooldowns); // [[name, mins], ...]

  // ── Main tracker rows ──
  if (!tracked.length) {
    grid.innerHTML = '<div class="bm-tracker-empty">No members currently tracked</div>';
  } else {
    grid.innerHTML = tracked.map(([name, mins]) => {
      const pct = (mins / BM_TOTAL_COOLDOWN) * 100;
      const isRecent = mins > (BM_TOTAL_COOLDOWN - BM_RECENT_THRESHOLD); // > 10min remaining = healed within 50min
      const barColor = mins > 30 ? 'var(--red-b)' : mins > 15 ? 'var(--amber)' : 'var(--green-b)';
      // Red = lots of time left (recently healed, cannot re-heal)
      // Amber = getting close
      // Green = nearly eligible again
      const timeLabel = mins === 0 ? 'ready' : `${mins} min`;
      const recentBadge = isRecent
        ? `<span style="font-size:9px;color:var(--red-b);font-weight:700;letter-spacing:0.05em">RECENT</span>`
        : `<span style="font-size:9px;color:var(--green-b);font-weight:700;letter-spacing:0.05em">READY</span>`;

      return `<div class="bm-tracker-row">
        <span class="bm-tracker-name">${name}</span>
        <div class="bm-tracker-bar-wrap">
          <div class="bm-tracker-bar" style="width:${pct.toFixed(1)}%;background:${barColor}"></div>
        </div>
        <span class="bm-tracker-time" style="color:${barColor}">${timeLabel}</span>
        ${recentBadge}
        <div class="bm-tracker-controls">
          <button class="bm-adj-btn" ontouchstart="" onclick="bmAdjust('${name}', 10)" title="+10 min">+</button>
          <button class="bm-adj-btn" ontouchstart="" onclick="bmAdjust('${name}', -10)" title="-10 min">−</button>
        </div>
        <button class="bm-remove-btn" ontouchstart="" onclick="bmRemoveMember('${name}')" title="Remove">✕</button>
      </div>`;
    }).join('');
  }

  // ── Add-member chips (show untracked party members) ──
  if (addRow) {
    const trackedNames = new Set(Object.keys(cooldowns));
    const untracked = PARTY.filter(p => !trackedNames.has(p.name));
    if (untracked.length) {
      addRow.innerHTML = '<span style="font-size:10px;color:var(--text3);font-weight:600;letter-spacing:0.05em;align-self:center">ADD:</span>' +
        untracked.map(p =>
          `<button class="bm-member-chip" ontouchstart="" onclick="bmToggleMember('${p.name}')">${p.name}</button>`
        ).join('');
    } else {
      addRow.innerHTML = '';
    }
  }
}