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
  actions: { a1: false, a2: false, a3: false, r1: false },
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

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) S = { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch(e) {}
}

function saveState() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch(e) {}
}