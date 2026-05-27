# Saske Ullaell — PF2e Session Tracker

Mobile-first session tracker for Pathfinder 2e (Remaster). Static HTML/CSS/JS, no build step.

## Structure

```
├── index.html
├── character.json
├── css/
│   ├── base.css
│   ├── components.css
│   ├── medicine.css
│   └── inventory.css
└── js/
    ├── state.js             # LS key, DEFAULT_STATE, load/save
    ├── utils.js             # Shared helpers and lookup tables
    ├── sync.js              # State → DOM reconciliation + button states
    ├── actions.js           # User mutations + session export/reset
    ├── medicine.js          # Medicine tool + BM cooldown tracker
    ├── modal.js             # Attack roll modal
    ├── panels-shared.js     # Shared condition card builder
    ├── panels-combat.js     # Combat + Companion panels
    ├── panels-skills.js     # Skills panel + Medicine Tool
    ├── panels-info.js       # Info panel (notes, feats, session controls)
    ├── panels-inventory.js  # Inventory panel + ammo tracking
    └── navigation.js        # Boot, tabs, swipe, tooltip system
```

Scripts load in the order listed. `panels-shared.js` must precede the other panel files.

## Deploy

Serve from repo root. `fetch()` won't work from `file://`.

```bash
npx serve .
```

## Updating character data

Edit `character.json`. AC and most stats derive from component fields at runtime.

Weapon damage uses a structured `damage_rolls` array — see existing weapons for the format. Inventory items need `ammo: true` and `ammoPerBundle` for ammunition tracking.

## Resetting session state

**In-app:** Info tab → Session → Reset Session.

**Console:**
```js
localStorage.removeItem('saske_state_v1'); location.reload();
```
