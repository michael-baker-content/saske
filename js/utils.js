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
