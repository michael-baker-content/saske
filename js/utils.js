// ════════════════════════════════════════════
// UTILS — shared helpers and lookup tables
// ════════════════════════════════════════════

// ════════════════════════════════════════════
// BUILD — render static structure from JSON
// ════════════════════════════════════════════
// ── Proficiency → star rating helper ──────
// Trained=1 ★, Expert=2 ★★, Master=3 ★★★, Legendary=4 ★★★★, Untrained=0
const PROF_RANKS = { Untrained: 0, Trained: 1, Expert: 2, Master: 3, Legendary: 4 };
function profToStars(proficiency) {
  const filled = PROF_RANKS[proficiency] ?? 0;
  const total  = 4;
  let svg = '';
  for (let i = 0; i < total; i++) {
    svg += i < filled
      ? '<span class="star star-filled">★</span>'
      : '<span class="star star-empty">☆</span>';
  }
  return `<span class="prof-stars" title="${proficiency}">${svg}</span>`;
}

const PROF_BONUS_MAP = { Untrained: 0, Trained: 2, Expert: 4, Master: 6, Legendary: 8 };
function profBonus(rank, level) {
  const base = PROF_BONUS_MAP[rank] ?? 0;
  return base === 0 ? 0 : level + base;
}

// ── Compute and display the equipped armor card ───────────────────

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function fmtMod(v) { return (v >= 0 ? '+' : '') + v; }
function mathTerm(value, label = '') {
  const n = Number(value) || 0;
  return `${n < 0 ? '- ' : '+ '}${Math.abs(n)}${label ? ' ' + label : ''}`;
}
function joinMathTerms(first, terms = []) {
  return [first, ...terms.filter(term => term && !term.startsWith('+ 0') && !term.startsWith('- 0'))].join(' ');
}
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function escapeAttr(value) {
  return escapeHtml(value);
}

function attackTooltip(weapon, source, penalty = 0) {
  const isCompanion = source === 'companion';
  const attrs = isCompanion ? C.companion.attributes : C.attributes;
  const profRank = isCompanion ? 'Trained' : 'Expert';
  const ability = attackAbility(weapon, source);
  const abilityVal = attrs[ability.key] ?? 0;
  const prof = profBonus(profRank, C.meta.level);
  const itemBonus = Math.max(0, weapon.attack - prof - abilityVal);
  const expr = joinMathTerms(`${prof} prof (${profRank})`, [
    mathTerm(abilityVal, ability.label),
    mathTerm(itemBonus, 'item'),
  ]);
  let tooltip = `${weapon.name} attack = ${expr} = ${fmtMod(weapon.attack)}`;
  if (penalty > 0) tooltip += `; current ${fmtMod(weapon.attack - penalty)} after -${penalty} condition penalty`;
  return tooltip;
}

function attackAbility(weapon, source) {
  if (weapon.ability_mod?.stat) {
    return { key: weapon.ability_mod.stat, label: weapon.ability_mod.label || weapon.ability_mod.stat.toUpperCase() };
  }
  const traits = (weapon.traits || []).map(t => t.toLowerCase());
  const isRanged = source === 'player' && traits.some(t =>
    t.includes('range') || t.includes('reload') || t.includes('deadly')
  );
  const isFinesse = traits.some(t => t.includes('finesse'));
  return (isRanged || isFinesse)
    ? { key: 'dex', label: 'DEX' }
    : { key: 'str', label: 'STR' };
}

function saskeActionBudget() {
  const conditions = S.conditions || [];
  const quickened = conditions.some(c => c.name === 'Quickened');
  const slowed = conditions
    .filter(c => c.name.startsWith('Slowed '))
    .reduce((max, c) => Math.max(max, condRank(c.name)), 0);
  const total = Math.max(0, Math.min(4, 3 + (quickened ? 1 : 0) - slowed));
  return { total, quickened, slowed };
}

function isActionAvailable(id) {
  if (id === 'r1') return true;
  const match = id.match(/^a(\d)$/);
  if (!match) return false;
  return Number(match[1]) <= saskeActionBudget().total;
}

function statTooltip(label, total, first, terms = []) {
  return `${label} = ${joinMathTerms(first, terms)} = ${fmtMod(total)}`;
}

function dcTooltip(label, total, first, terms = []) {
  return `${label} = ${joinMathTerms(first, terms)} = ${total}`;
}

const RANKED_FAMILIES = [
  'Clumsy','Enfeebled','Drained','Doomed','Frightened',
  'Sickened','Slowed','Stunned','Dying'
];
function condFamily(name) {
  for (const f of RANKED_FAMILIES) if (name.startsWith(f + ' ')) return f;
  return null;
}
function condRank(name) {
  const m = name.match(/(\d+)$/);
  return m ? parseInt(m[1]) : 0;
}
function upsertCondition(arr, name, type) {
  const family = condFamily(name);
  if (family) {
    // Remove any existing member of this family
    arr = arr.filter(c => !c.name.startsWith(family + ' '));
  } else {
    // Non-ranked: just skip duplicates
    if (arr.find(c => c.name === name)) return arr;
  }
  arr.push({ name, type });
  return arr;
}


function parseDamage(dmgStr) {
  // Matches patterns like: 2d6, 1d8, 2d4+3, 2d6+3
  const parts = [];
  const regex = /(\d+)d(\d+)([+-]\d+)?/g;
  let m;
  while ((m = regex.exec(dmgStr)) !== null) {
    parts.push({ count: parseInt(m[1]), sides: parseInt(m[2]), bonus: m[3] ? parseInt(m[3]) : 0 });
  }
  return parts;
}

// ── Bulk calculation (PF2e rules: 10L = 1 bulk, — is negligible) ──
function calcBulk(bulkStr, qty) {
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
  if (!isNaN(n)) { const t = n * q; return Number.isInteger(t) ? String(t) : String(t); }
  return b;
}

// ── Inventory description lookup ──────────────────────────────────
// Returns the description (and optionally notes) for an inventory item
// by name, pulling from current session state.
function invDescHtml(name) {
  const item = (S.inventory || []).find(i => i.name === name);
  if (!item) return '';
  const parts = [];
  if (item.description) parts.push('<span class="section-inv-desc">' + escapeHtml(item.description) + '</span>');
  if (item.notes)       parts.push('<span class="section-inv-notes">' + escapeHtml(item.notes) + '</span>');
  return parts.length ? '<div class="section-inv-info">' + parts.join('') + '</div>' : '';
}
