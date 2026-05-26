// ════════════════════════════════════════════
// MODAL — attack roll modal
// ════════════════════════════════════════════

// ════════════════════════════════════════════
// ATTACK MODAL
// ════════════════════════════════════════════
let modalWeapon = null;    // current weapon object
let modalSource = null;    // 'player' | 'companion'
let currentMAP  = 0;       // 0 = 1st, -1 = 2nd, -2 = 3rd+

// Parse a damage string like "2d6 P" or "2d4+3 S" into parts
function openModal(idx, source) {
  const weapon = source === 'player' ? C.weapons[idx] : C.companion.attacks[idx];
  modalWeapon = weapon;
  modalSource = source;
  currentMAP  = 0;

  // Header
  document.getElementById('modal-weapon-name').textContent = weapon.name;

  // Attack modifier — apply active condition penalties
  const condPen = source === 'player'
    ? (S._condPenalties?.atk || 0)
    : (S._hakiCondPenalties?.atk || 0);
  const mod = weapon.attack - condPen;
  document.getElementById('modal-atk-mod').value = (mod >= 0 ? '+' : '') + mod;
  document.getElementById('modal-d20').value = '';
  document.getElementById('modal-atk-total').value = '';

  // MAP buttons — show agile penalties if weapon has Agile trait
  const isAgile = weapon.traits?.some(t => t.toLowerCase().includes('agile'));
  const map2 = document.getElementById('map-btn-2');
  map2.textContent = isAgile ? '2nd attack (−4)' : '2nd attack (−5)';

  // Reset MAP selection
  document.querySelectorAll('.map-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.map-btn').classList.add('active');

  // Prey toggle row — shown for player AND companion weapons when prey is active
  // (Companion benefits from Warden's Boon sharing Precision)
  const hasPrey = !!S.prey;
  const preyRow = document.getElementById('prey-bonus-row');
  preyRow.style.display = hasPrey ? 'block' : 'none';
  if (hasPrey) {
    document.getElementById('prey-bonus-label').textContent = '🎯 ' + S.prey;
    // Default toggle ON (most common case is attacking your prey)
    const tog = document.getElementById('prey-tog');
    tog.classList.add('on');
  }
  // Precision die row visibility driven by toggle state
  const precRow = document.getElementById('precision-row');
  precRow.style.display = hasPrey ? 'flex' : 'none';
  document.getElementById('modal-precision-die').value = '';

  // Build damage inputs
  const dmgParts = parseDamage(weapon.damage);
  const inputsEl = document.getElementById('modal-dmg-inputs');
  inputsEl.innerHTML = dmgParts.map((p, i) => `
    <div>
      <div class="modal-input-label" style="margin-bottom:3px">${p.count}d${p.sides}${p.bonus !== 0 ? (p.bonus > 0 ? '+'+p.bonus : p.bonus) : ''}</div>
      <input class="modal-input" type="number" id="modal-dmg-${i}" placeholder="—" min="${p.count}" max="${p.count * p.sides}"
        data-count="${p.count}" data-sides="${p.sides}" data-bonus="${p.bonus}"/>
    </div>
  `).join('<div style="font-size:20px;color:var(--text3);align-self:flex-end;padding-bottom:8px">+</div>');

  // Hide results
  document.getElementById('result-grid').style.display = 'none';

  // Open
  document.getElementById('atk-modal-backdrop').classList.add('open');

  // Focus d20
  setTimeout(() => document.getElementById('modal-d20').focus(), 80);
}

function togglePreyAttack() {
  const tog = document.getElementById('prey-tog');
  const isOn = tog.classList.toggle('on');
  // Show/hide the precision die input
  document.getElementById('precision-row').style.display = isOn ? 'flex' : 'none';
  if (!isOn) document.getElementById('modal-precision-die').value = '';
  // Clear results when toggling so stale numbers aren't shown
  document.getElementById('result-grid').style.display = 'none';
}

function closeModal(e) {
  if (e.target === document.getElementById('atk-modal-backdrop')) closeModalDirect();
}
function closeModalDirect() {
  document.getElementById('atk-modal-backdrop').classList.remove('open');
  document.getElementById('result-grid').style.display = 'none';
}

function setMAP(tier, btn) {
  currentMAP = tier;
  document.querySelectorAll('.map-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Recalculate total if d20 already entered
  updateAtkTotal();
}

function effectiveMAP() {
  // tier 0 = 0, tier -1 = -4 agile / -5 normal, tier -2 = -8 agile / -10 normal
  if (currentMAP === 0) return 0;
  const isAgile = modalWeapon?.traits?.some(t => t.toLowerCase().includes('agile'));
  if (currentMAP === -1) return isAgile ? -4 : -5;
  return isAgile ? -8 : -10;
}

function updateAtkTotal() {
  const d20 = parseInt(document.getElementById('modal-d20').value);
  if (isNaN(d20)) { document.getElementById('modal-atk-total').value = ''; return; }
  const mod = modalWeapon.attack;
  const map = effectiveMAP();
  document.getElementById('modal-atk-total').value = d20 + mod + map;
}

// Live-update total as d20 is typed
document.addEventListener('input', e => {
  if (e.target.id === 'modal-d20') updateAtkTotal();
});

function calcResults() {
  const d20 = parseInt(document.getElementById('modal-d20').value);
  if (isNaN(d20)) { alert('Enter your d20 roll first.'); return; }

  // Attack
  const mod = modalWeapon.attack;
  const map = effectiveMAP();
  const atkTotal = d20 + mod + map;

  let atkBreak = `d20(${d20}) + mod(${mod > 0 ? '+'+mod : mod})`;
  if (map !== 0) atkBreak += ` + MAP(${map})`;

  // Damage
  const dmgParts = parseDamage(modalWeapon.damage);
  let dmgTotal = 0;
  let dmgBreakParts = [];
  let allDmgFilled = true;

  dmgParts.forEach((p, i) => {
    const inp = document.getElementById('modal-dmg-' + i);
    const rolled = parseInt(inp?.value);
    if (isNaN(rolled)) { allDmgFilled = false; return; }
    const total = rolled + p.bonus;
    dmgTotal += total;
    dmgBreakParts.push(`${rolled}${p.bonus !== 0 ? (p.bonus > 0 ? '+'+p.bonus : p.bonus) : ''}`);
  });

  // Precision die — only count if prey toggle is ON
  let precisionTotal = 0;
  const preyTogOn = document.getElementById('prey-tog')?.classList.contains('on');
  const precInp = document.getElementById('modal-precision-die');
  if (precInp && preyTogOn && document.getElementById('precision-row').style.display !== 'none') {
    const pv = parseInt(precInp.value);
    if (!isNaN(pv)) { precisionTotal = pv; dmgBreakParts.push(`prec(${pv})`); dmgTotal += pv; }
  }

  // Display
  document.getElementById('res-atk').textContent = atkTotal;
  document.getElementById('res-atk-break').textContent = atkBreak;

  if (allDmgFilled || dmgBreakParts.length) {
    document.getElementById('res-dmg').textContent = dmgTotal;
    document.getElementById('res-dmg-break').textContent = dmgBreakParts.join(' + ');
  } else {
    document.getElementById('res-dmg').textContent = '—';
    document.getElementById('res-dmg-break').textContent = 'Enter dice above';
  }

  document.getElementById('result-grid').style.display = 'grid';
}

// Close modal on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModalDirect();
  if (e.key === 'Enter' && document.getElementById('atk-modal-backdrop').classList.contains('open')) calcResults();
});

