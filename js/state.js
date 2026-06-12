// ════════════════════════════════════════════
// STATE — persisted to localStorage
// ════════════════════════════════════════════
const LS_KEY = 'saske_state_v1';
let C = null; // character data from JSON

const DEFAULT_STATE = {
  hp: null,           // set after JSON loads
  haki_hp: null,
  haki_hp_max: null,
  haki_tmp_hp: 0,
  conditions: [],
  haki_conditions: [],
  prey: '',
  warden_active: false,
  actions: { a1: false, a2: false, a3: false, a4: false, r1: false },
  bm_count: 0,
  arrow_used: 0,  // kept for legacy; quantity items now use S.inventory[].used
  tmp_hp: 0,
  bm_cooldowns: {},
  diseases:     [],
  haki_diseases: [],
  party_conditions: {},
  feat_descriptions: {},
  item_effects:      [],
  haki_barding: true,
  inventory: null,    // null = seed from C.inventory on first load
  notes: ''
};

let S = { ...DEFAULT_STATE };
let condPenalties = { ac: 0, reflex: 0, fort: 0, will: 0, perc: 0, atk: 0, skills: {} };
let hakiCondPenalties = { ac: 0, reflex: 0, fort: 0, will: 0, atk: 0 };

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) S = { ...DEFAULT_STATE, ...JSON.parse(raw) };
    S.actions = { ...DEFAULT_STATE.actions, ...(S.actions || {}) };
  } catch(e) {}
}

function saveState() {
  try {
    const persisted = Object.fromEntries(
      Object.entries(S).filter(([key]) => !key.startsWith('_'))
    );
    localStorage.setItem(LS_KEY, JSON.stringify(persisted));
  } catch(e) {}
}

function commit(mutator, syncFns = []) {
  mutator(S);
  saveState();
  const uniqueFns = new Set(syncFns.filter(Boolean));
  uniqueFns.forEach(fn => fn());
  if (typeof syncButtonStates === 'function') syncButtonStates();
}
