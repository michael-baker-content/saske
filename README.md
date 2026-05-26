# Saske Ullaell — PF2e Session Tracker

Mobile-first session tracker for Pathfinder 2e (Remaster). Tracks HP, conditions, combat actions, medicine, inventory, and companion state. Hosted as a static site — no build step required.

## Stack

Vanilla HTML/CSS/JS. Character data in `character.json`. Session state in `localStorage`.

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
    ├── state.js       # localStorage key, DEFAULT_STATE, load/save
    ├── utils.js       # Shared helpers and lookup tables
    ├── sync.js        # State → DOM reconciliation
    ├── actions.js     # User-triggered mutations
    ├── medicine.js    # Medicine tool + BM cooldown tracker
    ├── modal.js       # Attack roll modal
    ├── ui-panels.js   # build* functions (renders all panels)
    └── navigation.js  # Boot, tabs, swipe, tooltip system
```

Scripts load in the order listed above.

## Deploy

Serve from the repo root. Works on GitHub Pages, Netlify, or any static host.

```bash
npx serve .   # local dev
```

> `index.html` uses `fetch()` — opening it directly from the filesystem won't work.

## Updating character data

Edit `character.json`. AC and key stats are derived from component fields at runtime — no hardcoded totals to maintain.

## Resetting session state

**In-app:** Info tab → Session card → Reset Session.

**Console:**
```js
localStorage.removeItem('saske_state_v1'); location.reload();
```
