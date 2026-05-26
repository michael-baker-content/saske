# Saske Ullaell — PF2e Session Tracker

Mobile-first session tracker for Pathfinder 2e (Remaster). No build step — static HTML/CSS/JS served from a single directory.

## Stack

Vanilla HTML/CSS/JS. Character data in `character.json`. Session state in `localStorage` under `saske_state_v1`.

## Structure

```
├── index.html
├── character.json
├── saske.png / haki.png
├── css/
│   ├── base.css            # Variables, reset, shell, header, HP bar, tabs
│   ├── components.css      # Cards, stats, saves, weapons, conditions, skills, buttons
│   ├── medicine.css        # Attack modal, medicine tool, BM tracker, stat tooltips
│   └── inventory.css       # Inventory table, armor card, feats, session controls
└── js/
    ├── state.js             # LS key, DEFAULT_STATE, loadState/saveState
    ├── utils.js             # profToStars, profBonus, fmtMod, condition helpers
    ├── sync.js              # State → DOM: syncAll, syncHP, applyConditionEffects, etc.
    ├── actions.js           # User mutations: HP, conditions, prey, inventory, session export/reset
    ├── medicine.js          # Medicine tool, MED_TIERS, PARTY, BM cooldown tracker
    ├── modal.js             # Attack roll modal: structured dice, crit toggle, MAP, prey
    ├── panels-shared.js     # buildConditionCard, buildConditionSelect
    ├── panels-combat.js     # build(), buildCombat(), buildCompanion()
    ├── panels-skills.js     # buildSkills() — skills + medicine tool
    ├── panels-info.js       # buildInfo() — notes, character info, feats, session controls
    ├── panels-inventory.js  # buildInventory(), syncInventory(), inv* — inventory + ammo
    └── navigation.js        # Boot (fetch + build), tabs, swipe, fixed tooltip system
```

Scripts load in the order listed above. `panels-shared.js` must precede the other panel files.

## Features by tab

**Combat** — HP bar + controls (damage, heal, temp HP toggle), Core Stats + Saving Throws tiles with proficiency stars and derivation tooltips, weapon cards opening the attack modal, Hunt Prey toggle, action pip tracker, conditions.

**Companion** — Haki's HP, derived AC (from barding data), Perception, saves with stars, attack modal, skills with barding toggle, Equipped Barding card, conditions, special abilities.

**Skills** — full skill list with derivation tooltips; Medicine Tool (targets → type → tier → assurance → roll → dice → apply/confirm, auto-resets after use); Battle Medicine Quick Ref; BM Cooldown tracker.

**Inventory** — Equipped Armor card (derived AC); inventory table (Name / Qty / Bulk with PF2e bulk math); item modal (tap name to edit bulk, quantity, notes, ammo flag, per-bundle count); Ammunition section with Use/Return/Reset per ammo type.

**Info** — Session Notes; Character Info + Ability Modifiers; Feats (multi-column flex); Session card (Copy Report → Markdown to clipboard; Reset Session with confirmation).

## Attack modal

Weapons use a structured `damage_rolls` array in `character.json` rather than a flat string. Each roll group has `dice`, `faces`, `type`, and `category`. On a crit, weapon dice double and `crit_additions` (e.g. Deadly d10) are appended. Ability modifiers (`ability_mod.stat`) are resolved live from character attributes.

## Updating character data

Edit `character.json` — no JS changes needed for most updates.

| What changed | Field |
|---|---|
| Level | `meta.level` (AC, saves, proficiency bonuses all re-derive) |
| HP | `defenses.hp_max` |
| Ability scores | `attributes.*` |
| Armor proficiency | `defenses.ac_proficiency` |
| Skill rank | `skills[].proficiency` + `skills[].modifier` |
| Weapon damage | `weapons[].damage_rolls`, `damage_bonus`, `crit_additions` |
| New feat | `feats[]` |
| Inventory seed | `inventory[]` — `ammo: true` items need `ammoPerBundle` |

AC is fully derived: `10 + profBonus(ac_proficiency, level) + min(dex, equipped_armor.dex_cap) + equipped_armor.ac_bonus`.

## Deploy

Serve from the repo root. Works on GitHub Pages, Netlify, or any static host.

```bash
npx serve .   # local dev
```

> `index.html` uses `fetch()` for `character.json` — opening directly from the filesystem won't work.

## Resetting session state

**In-app:** Info tab → Session card → Reset Session.

**Console:**
```js
localStorage.removeItem('saske_state_v1'); location.reload();
```
