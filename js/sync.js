// ════════════════════════════════════════════
// SYNC — state → DOM functions
// ════════════════════════════════════════════

function syncAll() {
  syncHP();
  syncHakiHP();
  syncPrey();
  syncActions();
  syncWarden();
  syncConditions();
  syncHakiConditions(); applyHakiConditionEffects();
  syncNotes();
  syncCounters();
  applyConditionEffects();
  syncBMTracker();
  syncHakiSkills();
  syncInventory();
  syncArmor();
  syncHakiBardingCard();
}

function syncHP() {
  const max    = C.defenses.hp_max;
  const hp     = Math.max(0, S.hp);
  const tmp    = Math.max(0, S.tmp_hp || 0);
  const total  = hp + tmp;

  // Normal HP bar: proportion of max, capped at 100%
  const normalPct = Math.min(100, (hp / max) * 100);
  // Temp HP bar: proportion of max (extends bar beyond 100% visually)
  // We scale both within the bar-track width, treating (max + tmp) as 100%
  const scale  = total > 0 ? max / total : 1; // how much of bar-track is "normal"
  const normW  = (hp  / total * 100).toFixed(2) + '%';
  const tempW  = (tmp / total * 100).toFixed(2) + '%';

  const barNorm = document.getElementById('hp-bar-normal');
  const barTemp = document.getElementById('hp-bar-temp');
  if (barNorm) {
    barNorm.style.width = normW;
    barNorm.style.background = normalPct > 50 ? 'var(--hp-full)' : normalPct > 25 ? 'var(--hp-mid)' : 'var(--hp-low)';
  }
  if (barTemp) barTemp.style.width = tempW;

  // Label: "104" normally, "88+16" when temp HP active
  const curEl = document.getElementById('hp-cur');
  if (curEl) curEl.textContent = tmp > 0 ? `${hp}+${tmp}` : hp;

  // Temp current display
  const tmpCurEl = document.getElementById('tmp-cur');
  if (tmpCurEl) tmpCurEl.textContent = tmp > 0 ? `${tmp} active` : '';

  // Keep Temp HP button highlighted while temp HP is active
  document.getElementById('saske-tmp-toggle')?.classList.toggle('tmp-toggle-active', tmp > 0);
}

function syncHakiHP() {
  const max   = S.haki_hp_max;
  const hp    = Math.max(0, S.haki_hp);
  const tmp   = Math.max(0, S.haki_tmp_hp || 0);
  const total = hp + tmp;

  const normalPct = Math.min(100, (hp / max) * 100);
  const normW = total > 0 ? (hp  / total * 100).toFixed(2) + '%' : '100%';
  const tempW = total > 0 ? (tmp / total * 100).toFixed(2) + '%' : '0%';

  const barNorm = document.getElementById('haki-bar-normal');
  const barTemp = document.getElementById('haki-bar-temp');
  if (barNorm) {
    barNorm.style.width = normW;
    barNorm.style.background = normalPct > 50 ? 'var(--hp-full)' : normalPct > 25 ? 'var(--hp-mid)' : 'var(--hp-low)';
  }
  if (barTemp) barTemp.style.width = tempW;

  const curEl = document.getElementById('haki-cur');
  if (curEl) curEl.textContent = tmp > 0 ? `${hp}+${tmp}` : hp;

  const tmpCurEl = document.getElementById('haki-tmp-cur');
  if (tmpCurEl) tmpCurEl.textContent = tmp > 0 ? `${tmp} active` : '';

  document.getElementById('haki-tmp-toggle')?.classList.toggle('tmp-toggle-active', tmp > 0);
}

function syncPrey() {
  const txt   = document.getElementById('prey-txt');
  const clear = document.getElementById('prey-clear');
  if (!txt) return;
  if (S.prey) {
    txt.textContent = '🎯 ' + S.prey;
    txt.className   = 'prey-name';
    clear.style.display = '';
  } else {
    txt.textContent = 'No prey designated';
    txt.className   = 'prey-none';
    clear.style.display = 'none';
  }
}

function syncActions() {
  Object.entries(S.actions).forEach(([id, used]) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('used', used);
  });
}

function syncWarden() {
  const el = document.getElementById('warden-tog');
  if (el) el.classList.toggle('on', S.warden_active);
}

function syncConditions() {
  renderConditions('cond-list', S.conditions, 'removeCondition');
}

function syncHakiConditions() {
  renderConditions('haki-cond-list', S.haki_conditions, 'removeHakiCondition');
}

function renderConditions(listId, arr, removeFn) {
  const el = document.getElementById(listId);
  if (!el) return;
  if (!arr.length) { el.innerHTML = '<span class="cond-none">No active conditions</span>'; return; }
  el.innerHTML = arr.map(c =>
    `<span class="cond-badge ${c.type==='good'?'good':''}">${c.name}<span class="cond-x" onclick="${removeFn}('${c.name}')">✕</span></span>`
  ).join('');
}

function syncNotes() {
  const el = document.getElementById('notes');
  if (el) el.value = S.notes || '';
}

function syncCounters() {
  // Quantity-tracked inventory items are synced via syncInventory()
  // BM count display removed (tracked in Medicine Tool cooldowns)
}


function toggleHakiBarding() {
  S.haki_barding = !S.haki_barding;
  saveState();
  syncHakiSkills();
  syncHakiBardingCard();
}

function syncHakiBardingCard() {
  const armorEl = document.getElementById('haki-armor-grid');
  if (!armorEl || !C.companion.equipped_barding) return;

  const co   = C.companion;
  const bard = co.equipped_barding;
  const dex  = co.attributes.dex;
  const level = C.meta.level;
  const acProf = profBonus(co.ac_proficiency, level);
  const effDex = Math.min(dex, bard.dex_cap);
  const computedAC = 10 + acProf + effDex + bard.ac_bonus;

  armorEl.innerHTML = `
    <div class="armor-name">${bard.name}</div>
    <div class="armor-stats">
      <div class="armor-stat-group">
        <div class="armor-tile has-tooltip"
          data-tooltip="AC = 10 base + ${acProf} prof (${co.ac_proficiency}) + ${effDex} DEX${dex > bard.dex_cap ? ' (capped from +' + dex + ')' : ''} + ${bard.ac_bonus} item bonus">
          <div class="stat-val" style="font-size:20px">${computedAC}</div>
          <div class="stat-label">AC</div>
        </div>
        <div class="armor-tile has-tooltip" data-tooltip="Item bonus to AC granted by this barding">
          <div class="stat-val" style="font-size:20px">+${bard.ac_bonus}</div>
          <div class="stat-label">Item Bonus</div>
        </div>
        <div class="armor-tile has-tooltip"
          data-tooltip="Max DEX bonus that applies to AC${dex > bard.dex_cap ? '. DEX +' + dex + ' capped to +' + bard.dex_cap : '. DEX +' + dex + ' within cap'}">
          <div class="stat-val" style="font-size:20px${dex > bard.dex_cap ? ';color:var(--amber)' : ''}">+${bard.dex_cap}</div>
          <div class="stat-label">Dex Cap</div>
        </div>
        <div class="armor-tile has-tooltip" data-tooltip="Check penalty to Stealth, Acrobatics, Athletics">
          <div class="stat-val" style="font-size:20px;color:var(--red-b)">${bard.check_penalty}</div>
          <div class="stat-label">Check Pen.</div>
        </div>
      </div>
    </div>
    <div class="armor-proficiency" style="margin-top:8px">
      Armor proficiency: ${profToStars(co.ac_proficiency)}
      <span style="font-size:10px;color:var(--text3);margin-left:4px">${co.ac_proficiency} (+${acProf})</span>
    </div>
    <div class="toggle-row" style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border)">
      <div class="tog${S.haki_barding ? ' on' : ''}" id="haki-barding-tog" onclick="toggleHakiBarding()"><div class="tog-knob"></div></div>
      <span class="tog-label">Barding currently worn <span style="font-size:10px;color:var(--text3)">(−3 to Stealth, Acrobatics, Athletics)</span></span>
    </div>
  `;
}

function syncHakiSkills() {
  // Sync toggle visual
  const tog = document.getElementById('haki-barding-tog');
  if (tog) {
    tog.classList.toggle('on', S.haki_barding);
    // preserve .green class if present
    if (!tog.classList.contains('green')) {} // no-op
  }

  // Re-render the entire skill grid so tooltips and colours update correctly
  const grid = document.getElementById('haki-skill-grid');
  if (!grid || !C) return;

  const PROF_MAP = {Untrained:0, Trained:2, Expert:4, Master:6, Legendary:8};
  const bardingOn = S.haki_barding;
  const co = C.companion;

  grid.innerHTML = co.skills.map(s => {
    const attrVal  = co.attributes[s.key_attribute] ?? 0;
    const attrName = (s.key_attribute || '').toUpperCase();
    const pb       = PROF_MAP[s.proficiency] ?? 0;
    const profNum  = pb === 0 ? 0 : C.meta.level + pb;
    const bp       = s.barding_penalty ?? 0;
    const effMod   = s.modifier + (bardingOn ? bp : 0);
    const tipParts = [];
    if (pb > 0) tipParts.push(profNum + ' prof (' + s.proficiency + ')');
    tipParts.push((attrVal >= 0 ? '+' : '') + attrVal + ' ' + attrName);
    if (bardingOn && bp !== 0) tipParts.push(bp + ' barding');
    const tip   = s.name + ' = ' + tipParts.join(' + ') + ' = ' + (effMod >= 0 ? '+' : '') + effMod;
    const mod   = (effMod >= 0 ? '+' : '') + effMod;
    const style = (bardingOn && bp !== 0) ? ' style="color:var(--red-b)"' : '';
    return '<div class="skill-row has-tooltip" data-tooltip="' + tip + '">'
         + '<div class="skill-name-wrap">'
         + '<span>' + s.name + '</span>'
         + '<span class="skill-prof-badge">' + s.proficiency + (bp !== 0 ? ' · barding' : '') + '</span>'
         + '</div>'
         + '<span class="skill-mod"' + style + '>' + mod + '</span>'
         + '</div>';
  }).join('');
}

// ─── Condition Effect Engine ──────────────────────────────────────
// Computes penalty totals from active conditions and updates live stat elements.
// PF2e rules used:
//   Clumsy N   → −N to Dex-based attacks, AC, Reflex, Acrobatics, Stealth, Thievery
//   Enfeebled N → −N to Str-based attacks (minimal impact for Saske)
//   Drained N  → −N to Fort; max HP = base − N×level
//   Frightened N→ −N to all attacks, saves, perception, skills
//   Sickened N  → −N to all attacks, saves, perception, skills
//   Fatigued   → −1 to AC and all saves
//   Prone      → −2 to attack rolls (ranged not allowed without action)
//   Grabbed    → flat-footed (−2 AC, Dex DC/checks)
//   Restrained → flat-footed (−2 AC, Dex DC/checks)
//   Blinded    → flat-footed + −4 to vision-dependent attacks
//   Dazzled    → −2 to attacks (concealed)
//   Unconscious→ flat-footed + −4 AC + −4 attacks
//   Stunned N  → lose N actions (displayed on badge, no numeric mod)
//   Slowed N   → lose N actions per turn (displayed on badge, no numeric mod)
function applyConditionEffects() {
  const base = C.defenses;
  const sv   = C.saving_throws;
  const cs   = S.conditions;

  let acPen=0, reflexPen=0, fortPen=0, willPen=0, percPen=0, atkPen=0;
  let flatFooted=false;
  let effectNotes=[];

  for (const cond of cs) {
    const n = condRank(cond.name);
    const nm = cond.name;

    if (nm.startsWith('Clumsy')) {
      acPen += n; reflexPen += n; atkPen += n; // Dex-based attacks & AC & Reflex
      effectNotes.push(`Clumsy ${n}: −${n} AC, Reflex, Dex attacks`);
    }
    if (nm.startsWith('Drained')) {
      fortPen += n;
      effectNotes.push(`Drained ${n}: −${n} Fort; max HP −${n * C.meta.level} (shown above)`);
    }
    if (nm.startsWith('Frightened')) {
      acPen += n; reflexPen += n; fortPen += n; willPen += n; percPen += n; atkPen += n;
      effectNotes.push(`Frightened ${n}: −${n} to all`);
    }
    if (nm.startsWith('Sickened')) {
      reflexPen += n; fortPen += n; willPen += n; percPen += n; atkPen += n;
      effectNotes.push(`Sickened ${n}: −${n} attacks/saves/skills`);
    }
    if (nm === 'Fatigued') {
      acPen += 1; reflexPen += 1; fortPen += 1; willPen += 1;
      effectNotes.push('Fatigued: −1 AC and saves');
    }
    if (nm === 'Prone') {
      atkPen += 2;
      effectNotes.push('Prone: −2 attacks');
    }
    if (nm === 'Grabbed' || nm === 'Restrained') {
      flatFooted = true;
      effectNotes.push(`${nm}: flat-footed`);
    }
    if (nm === 'Blinded') {
      flatFooted = true; atkPen += 4;
      effectNotes.push('Blinded: flat-footed, −4 attacks');
    }
    if (nm === 'Dazzled') {
      atkPen += 2;
      effectNotes.push('Dazzled: −2 attacks');
    }
    if (nm === 'Unconscious') {
      flatFooted = true; acPen += 4; atkPen += 4;
      effectNotes.push('Unconscious: −4 AC, −4 attacks, flat-footed');
    }
    if (nm === 'Paralyzed') {
      flatFooted = true;
      effectNotes.push('Paralyzed: flat-footed, cannot act');
    }
    if (nm.startsWith('Stunned') || nm.startsWith('Slowed')) {
      effectNotes.push(`${nm}: lose ${n} action${n>1?'s':''} per turn`);
    }
  }

  if (flatFooted) {
    acPen += 2; reflexPen += 2;
  }

  // Drained lowers max HP
  const drainedCond = cs.find(c => c.name.startsWith('Drained '));
  const drainedN = drainedCond ? condRank(drainedCond.name) : 0;
  const effectiveMaxHP = base.hp_max - drainedN * C.meta.level;

  // Update AC — derive from armor data so it stays correct as items/stats change
  const arm = C.equipped_armor;
  const level = C.meta.level;
  const dex = C.attributes.dex;
  const acProfBonus = profBonus(base.ac_proficiency, level);
  const effDex = arm ? Math.min(dex, arm.dex_cap) : dex;
  const derivedAC = 10 + acProfBonus + effDex + (arm ? arm.ac_bonus : 0);
  const acEl = document.getElementById('live-ac');
  if (acEl) {
    acEl.textContent = derivedAC - acPen;
    acEl.style.color = acPen > 0 ? 'var(--red-b)' : '';
  }

  // Update Perception
  const effectivePerc = C.perception.modifier - percPen;
  const percEl = document.getElementById('live-perc');
  if (percEl) {
    percEl.textContent = (effectivePerc >= 0 ? '+' : '') + effectivePerc;
    percEl.style.color = percPen > 0 ? 'var(--red-b)' : '';
  }

  // Update saves
  const saveUpdates = [
    ['live-fort',  sv.fortitude.modifier - fortPen],
    ['live-reflex',sv.reflex.modifier    - reflexPen],
    ['live-will',  sv.will.modifier      - willPen],
  ];
  saveUpdates.forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = (val >= 0 ? '+' : '') + val;
    const isPenalised = (id==='live-fort'&&fortPen>0)||(id==='live-reflex'&&reflexPen>0)||(id==='live-will'&&willPen>0);
    el.style.color = isPenalised ? 'var(--red-b)' : '';
  });

  // Update weapon attack modifiers
  C.weapons.forEach((w, i) => {
    // Ranged / finesse weapons are Dex-based — apply clumsy, flat-footed etc.
    // Saske's shortbow is ranged, shortsword has Finesse — both use Dex
    const effectiveAtk = w.attack - atkPen;
    const el = document.getElementById(`live-weapon-atk-${i}`);
    if (el) {
      el.textContent = (effectiveAtk >= 0 ? '+' : '') + effectiveAtk;
      el.style.color = atkPen > 0 ? 'var(--red-b)' : '';
    }
  });

  // Update condition effects summary panel
  let summEl = document.getElementById('cond-effects-summary');
  if (summEl) {
    if (effectNotes.length) {
      summEl.innerHTML = effectNotes.map(n => `<div class="cond-effect-line">▸ ${n}</div>`).join('');
      summEl.style.display = '';
    } else {
      summEl.style.display = 'none';
    }
  }

  // Store effective penalties for use in the attack modal
  S._condPenalties = { ac: acPen, reflex: reflexPen, fort: fortPen, will: willPen, perc: percPen, atk: atkPen };
}
// ─── Haki Condition Effect Engine ────────────────────────────────
function applyHakiConditionEffects() {
  const co  = C.companion;
  const sv  = co.saving_throws;
  const cs  = S.haki_conditions;

  let acPen=0, reflexPen=0, fortPen=0, willPen=0, atkPen=0;
  let flatFooted = false;
  let effectNotes = [];

  for (const cond of cs) {
    const n  = condRank(cond.name);
    const nm = cond.name;
    if (nm.startsWith('Clumsy'))     { acPen+=n; reflexPen+=n; atkPen+=n; effectNotes.push(`Clumsy ${n}: −${n} AC, Reflex, attacks`); }
    if (nm.startsWith('Frightened')) { acPen+=n; reflexPen+=n; fortPen+=n; willPen+=n; atkPen+=n; effectNotes.push(`Frightened ${n}: −${n} to all`); }
    if (nm.startsWith('Sickened'))   { reflexPen+=n; fortPen+=n; willPen+=n; atkPen+=n; effectNotes.push(`Sickened ${n}: −${n} attacks/saves`); }
    if (nm === 'Fatigued')           { acPen+=1; reflexPen+=1; fortPen+=1; willPen+=1; effectNotes.push('Fatigued: −1 AC and saves'); }
    if (nm === 'Prone')              { atkPen+=2; effectNotes.push('Prone: −2 attacks'); }
    if (nm === 'Grabbed' || nm === 'Restrained') { flatFooted=true; effectNotes.push(`${nm}: flat-footed`); }
    if (nm === 'Blinded')            { flatFooted=true; atkPen+=4; effectNotes.push('Blinded: flat-footed, −4 attacks'); }
    if (nm === 'Dazzled')            { atkPen+=2; effectNotes.push('Dazzled: −2 attacks'); }
    if (nm === 'Unconscious')        { flatFooted=true; acPen+=4; atkPen+=4; effectNotes.push('Unconscious: −4 AC, −4 attacks'); }
    if (nm === 'Paralyzed')          { flatFooted=true; effectNotes.push('Paralyzed: flat-footed, cannot act'); }
    if (nm.startsWith('Stunned') || nm.startsWith('Slowed')) {
      effectNotes.push(`${nm}: lose ${n} action${n>1?'s':''} per turn`);
    }
  }
  if (flatFooted) { acPen+=2; reflexPen+=2; }

  // AC
  // Derive AC from barding data
  const bard2    = co.equipped_barding;
  const hAcProf  = profBonus(co.ac_proficiency, C.meta.level);
  const hEffDex  = bard2 ? Math.min(co.attributes.dex, bard2.dex_cap) : co.attributes.dex;
  const hDerivedAC = 10 + hAcProf + hEffDex + (bard2 ? bard2.ac_bonus : 0);
  const acEl = document.getElementById('haki-live-ac');
  if (acEl) { acEl.textContent = hDerivedAC - acPen; acEl.style.color = acPen>0?'var(--red-b)':''; }

  // Saves
  [['haki-live-fort', sv.fortitude.modifier - fortPen],
   ['haki-live-reflex', sv.reflex.modifier  - reflexPen],
   ['haki-live-will', sv.will.modifier      - willPen]
  ].forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = (val >= 0 ? '+' : '') + val;
    const pen = id.includes('fort') ? fortPen : id.includes('reflex') ? reflexPen : willPen;
    el.style.color = pen > 0 ? 'var(--red-b)' : '';
  });

  // Attack modifiers
  C.companion.attacks.forEach((a, i) => {
    const el = document.getElementById(`haki-live-atk-${i}`);
    if (!el) return;
    const eff = a.attack - atkPen;
    el.textContent = (eff >= 0 ? '+' : '') + eff;
    el.style.color = atkPen > 0 ? 'var(--red-b)' : '';
  });

  // Store for modal use
  S._hakiCondPenalties = { ac: acPen, reflex: reflexPen, fort: fortPen, will: willPen, atk: atkPen };

  // Condition effects summary
  const summEl = document.getElementById('haki-cond-effects-summary');
  if (summEl) {
    if (effectNotes.length) {
      summEl.innerHTML = effectNotes.map(n => `<div class="cond-effect-line">▸ ${n}</div>`).join('');
      summEl.style.display = '';
    } else {
      summEl.style.display = 'none';
    }
  }
}


// Notes