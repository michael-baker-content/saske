// ════════════════════════════════════════════
// MODAL — attack roll modal
// ════════════════════════════════════════════

let modalWeapon = null;
let modalSource = null;
let currentMAP  = 0;
let modalIsCrit = false;

function openModal(idx, source) {
  const weapon = source === 'player' ? C.weapons[idx] : C.companion.attacks[idx];
  modalWeapon = weapon;
  modalSource = source;
  currentMAP  = 0;
  modalIsCrit = false;

  document.getElementById('modal-weapon-name').textContent = weapon.name;

  const condPen = source === 'player'
    ? (condPenalties?.atk || 0)
    : (hakiCondPenalties?.atk || 0);
  const mod = weapon.attack - condPen;
  document.getElementById('modal-atk-mod').value = mod;
  document.getElementById('modal-d20').value = '';
  document.getElementById('modal-atk-total').value = '';

  const isAgile = weapon.traits?.some(t => t.toLowerCase().includes('agile'));
  document.getElementById('map-btn-2').textContent = isAgile ? 'Second (\u22124)' : 'Second (\u22125)';
  document.getElementById('map-btn-3').textContent = isAgile ? 'Third (\u22128)' : 'Third (\u221210)';

  document.querySelectorAll('.map-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.map-btn').classList.add('active');
  document.getElementById('crit-toggle-btn')?.classList.remove('active');

  const hasPrey = !!S.prey;
  document.getElementById('prey-bonus-row').style.display = hasPrey ? 'block' : 'none';
  if (hasPrey) {
    document.getElementById('prey-bonus-label').textContent = '\uD83C\uDFAF ' + S.prey;
    document.getElementById('prey-tog').classList.add('on');
  }
  // Precision row is now folded into buildDamageInputs — hide the static one
  const precRow = document.getElementById('precision-row');
  if (precRow) precRow.style.display = 'none';

  buildDamageInputs(false);

  document.getElementById('result-grid').style.display = 'none';
  document.getElementById('atk-modal-backdrop').classList.add('open');
  setTimeout(() => document.getElementById('modal-d20').focus(), 80);
}

// ── Build damage grid ───────────────────────────────────────────────
// Each cell: label (die notation) / sublabel (type or note) / input or flat value
function buildDamageInputs(isCrit) {
  const weapon   = modalWeapon;
  if (!weapon) return;

  const rolls    = weapon.damage_rolls || parseDamageToRolls(weapon.damage);
  const bonus    = weapon.damage_bonus || 0;
  const abilMod  = weapon.ability_mod;
  const crits    = weapon.crit_additions || [];
  const inputsEl = document.getElementById('modal-dmg-inputs');

  let abilVal = 0;
  if (abilMod) {
    const attrs = modalSource === 'companion' ? C.companion.attributes : C.attributes;
    abilVal = attrs[abilMod.stat] ?? 0;
    if (abilMod.divisor) abilVal = Math.floor(abilVal / abilMod.divisor);
  }

  const critMult   = isCrit ? 2 : 1;
  const totalBonus = (bonus + abilVal) * critMult;
  let html = '';

  // Weapon dice cells — input first, label below
  rolls.forEach((roll, i) => {
    const dc = roll.dice * critMult;
    html += '<div class="modal-die-group">'
          + '<input class="modal-input" type="number" id="modal-dmg-' + i + '" '
          +   'placeholder="\u2014" min="1" max="' + roll.faces + '" '
          +   'data-count="' + dc + '" data-faces="' + roll.faces + '" '
          +   'data-type="' + roll.type + '" data-category="' + roll.category + '"/>'
          + '<div class="modal-die-sublabel">' + dc + 'd' + roll.faces + ' ' + roll.type + '</div>'
          + '</div>';
  });

  // Flat bonus cell — display first, label below (no redundant number in label)
  if (totalBonus !== 0) {
    const bonusSub = isCrit
      ? '\xd72(base ' + (rolls[0]?.type || '') + ')'
      : 'base ' + (rolls[0]?.type || '');
    html += '<div class="modal-die-group">'
          + '<div class="modal-flat-bonus" id="modal-flat-bonus">' + (totalBonus > 0 ? '+' : '') + totalBonus + '</div>'
          + '<div class="modal-die-sublabel">' + bonusSub + '</div>'
          + '</div>';
  }

  // Crit addition cells — input first, two-line label below
  if (isCrit && crits.length) {
    crits.forEach((crit, ci) => {
      html += '<div class="modal-die-group">'
            + '<input class="modal-input" type="number" id="modal-crit-' + ci + '" '
            +   'placeholder="\u2014" min="1" max="' + crit.faces + '" '
            +   'data-count="' + crit.dice + '" data-faces="' + crit.faces + '" '
            +   'data-type="' + crit.type + '" data-category="' + crit.category + '"/>'
            + '<div class="modal-die-sublabel crit-label">' + crit.dice + 'd' + crit.faces + ' ' + crit.type + '</div>'
            + '<div class="modal-die-sublabel crit-label">' + crit.label + '</div>'
            + '</div>';
    });
  }

  // Precision die cell — input first, two-line label below
  const preyTogOn = document.getElementById('prey-tog')?.classList.contains('on');
  if (preyTogOn) {
    const precType = modalWeapon?.damage_rolls?.[0]?.type || 'P';
    html += '<div class="modal-die-group">'
          + '<input class="modal-input" type="number" id="modal-precision-die" '
          +   'placeholder="\u2014" min="1" max="8"/>'
          + '<div class="modal-die-sublabel prey-label">1d8 ' + precType + '</div>'
          + '<div class="modal-die-sublabel prey-label">1st hit vs Prey</div>'
          + '</div>';
  }

  inputsEl.innerHTML = html;
}

// ── Fallback: parse "2d6+3 P" string into damage_rolls ─────────────
function parseDamageToRolls(str) {
  if (!str) return [];
  const m = str.match(/^(\d+)d(\d+)([+-]\d+)?\s*(\S+)?/);
  if (!m) return [];
  return [{ dice: parseInt(m[1]), faces: parseInt(m[2]), type: m[4] || '', category: 'weapon', label: '' }];
}

// ── Crit toggle ─────────────────────────────────────────────────────
function toggleCrit() {
  modalIsCrit = !modalIsCrit;
  document.getElementById('crit-toggle-btn')?.classList.toggle('active', modalIsCrit);
  buildDamageInputs(modalIsCrit);
  document.getElementById('result-grid').style.display = 'none';
}

// ── Prey toggle ─────────────────────────────────────────────────────
function togglePreyAttack() {
  const tog = document.getElementById('prey-tog');
  tog.classList.toggle('on');
  // Rebuild to add/remove precision cell
  buildDamageInputs(modalIsCrit);
  document.getElementById('result-grid').style.display = 'none';
}

// ── Open / close ────────────────────────────────────────────────────
function closeModal(e) {
  if (e.target === document.getElementById('atk-modal-backdrop')) closeModalDirect();
}
function closeModalDirect() {
  document.getElementById('atk-modal-backdrop').classList.remove('open');
  document.getElementById('result-grid').style.display = 'none';
}

// ── MAP ─────────────────────────────────────────────────────────────
function setMAP(tier, btn) {
  currentMAP = tier;
  document.querySelectorAll('.map-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updateAtkTotal();
}

function effectiveMAP() {
  if (currentMAP === 0) return 0;
  const isAgile = modalWeapon?.traits?.some(t => t.toLowerCase().includes('agile'));
  if (currentMAP === -1) return isAgile ? -4 : -5;
  return isAgile ? -8 : -10;
}

function updateAtkTotal() {
  const d20 = parseInt(document.getElementById('modal-d20').value);
  if (isNaN(d20)) { document.getElementById('modal-atk-total').value = ''; return; }
  const condPen = modalSource === 'player'
    ? (condPenalties?.atk || 0)
    : (hakiCondPenalties?.atk || 0);
  const mod = modalWeapon.attack - condPen;
  document.getElementById('modal-atk-total').value = d20 + mod + effectiveMAP();
}

document.addEventListener('input', e => {
  if (e.target.id === 'modal-d20') updateAtkTotal();
});

// ── Calculate results ───────────────────────────────────────────────
function calcResults() {
  const d20 = parseInt(document.getElementById('modal-d20').value);
  if (isNaN(d20)) { alert('Enter your d20 roll first.'); return; }

  const condPen = modalSource === 'player'
    ? (condPenalties?.atk || 0)
    : (hakiCondPenalties?.atk || 0);
  const mod = modalWeapon.attack - condPen;
  const atkTotal = d20 + mod + effectiveMAP();
  let atkBreak = 'd20(' + d20 + ') + mod(' + (mod >= 0 ? '+' + mod : mod) + ')';
  if (effectiveMAP() !== 0) atkBreak += ' + MAP(' + effectiveMAP() + ')';

  let dmgTotal = 0;
  const breakParts = [];

  // Weapon dice
  const rolls = modalWeapon.damage_rolls || parseDamageToRolls(modalWeapon.damage);
  rolls.forEach((roll, i) => {
    const inp = document.getElementById('modal-dmg-' + i);
    const singleDie = parseInt(inp?.value);
    if (isNaN(singleDie)) return;
    const dc = roll.dice * (modalIsCrit ? 2 : 1);
    const rolled = singleDie * dc;
    dmgTotal += rolled;
    breakParts.push(dc + '\xd7' + singleDie + ' ' + roll.type);
  });

  // Flat bonus
  const flatEl = document.getElementById('modal-flat-bonus');
  if (flatEl) {
    const flatVal = parseInt(flatEl.textContent);
    if (!isNaN(flatVal) && flatVal !== 0) {
      dmgTotal += flatVal;
      breakParts.push(flatVal + ' base');
    }
  }

  // Crit additions
  if (modalIsCrit) {
    (modalWeapon.crit_additions || []).forEach((crit, ci) => {
      const inp = document.getElementById('modal-crit-' + ci);
      const sv  = parseInt(inp?.value);
      if (isNaN(sv)) return;
      const rolled = sv * crit.dice;
      dmgTotal += rolled;
      breakParts.push(crit.dice + '\xd7' + sv + ' ' + crit.type + ' (' + crit.label + ')');
    });
  }

  // Precision die
  const preyTogOn = document.getElementById('prey-tog')?.classList.contains('on');
  if (preyTogOn) {
    const pv = parseInt(document.getElementById('modal-precision-die')?.value);
    if (!isNaN(pv)) { dmgTotal += pv; breakParts.push('prec(' + pv + ')'); }
  }

  document.getElementById('res-atk').textContent = atkTotal;
  document.getElementById('res-atk-break').textContent = atkBreak;

  if (breakParts.length) {
    document.getElementById('res-dmg').textContent = dmgTotal;
    document.getElementById('res-dmg-break').textContent = breakParts.join(' + ');
  } else {
    document.getElementById('res-dmg').textContent = '\u2014';
    document.getElementById('res-dmg-break').textContent = 'Enter dice above';
  }
  document.getElementById('result-grid').style.display = 'grid';
}

// ── Keyboard shortcuts ──────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModalDirect();
  if (e.key === 'Enter' && document.getElementById('atk-modal-backdrop').classList.contains('open')) calcResults();
});
