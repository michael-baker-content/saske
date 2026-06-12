# PF2e Session Tracker

Mobile-first session tracker for my Pathfinder 2e Remaster character, Saske Ullaell, and her animal companion, Haki. The app is intentionally small and local: no accounts, no database, no build step, and no framework.

## What it tracks

- Saske and Haki hit points, temporary hit points, conditions, and disease stages.
- Saske's current prey, Warden's Boon, turn actions, reaction, and condition-adjusted action budget.
- Weapon attacks with roll modals, multiple attack penalty support, damage dice, critical effects, and hover explanations for attack math.
- Live condition effects for AC, saves, Perception, attacks, and skills.
- Haki's barding, attacks, HP, conditions, and condition-adjusted combat values.
- Battle Medicine, Treat Wounds, party condition tracking, cooldowns, and related Medic workflow.
- Inventory, ammo usage, item notes, feat notes, and custom item effects.
- Copyable session reports that summarize meaningful changes from the default state.

## Recent updates

- Quickened and Slowed now change Saske's "Actions This Turn" selector. Quickened reveals a fourth action; Slowed removes the correct number of actions. Haki is not affected by this action tracker.
- Haki now starts sessions at full health, and Haki HP changes are included in the Copy Report workflow.
- Copy Report now watches more session changes, including actions, diseases, inventory edits, party condition tracking, feat notes, item effects, Haki barding, and Battle Medicine cooldowns.
- Attack cards now have hover explanations showing how the attack modifier is calculated.
- Math text was cleaned up throughout the UI so modifiers read clearly, such as `+ 4 DEX` instead of `+ +4 DEX`.
- The tooltip system was adjusted so hovering inside an attack card no longer causes the tooltip to flicker.
- Touch and narrow-screen behavior was tightened for important controls.
- Saske's weapon damage data was corrected to match the expected attack scoring.
- User-editable text that renders into the page is escaped before display.

## Stack

Vanilla HTML, CSS, and JavaScript. Character data lives in `character.json`. Session state is stored locally in the browser under `saske_state_v1`.

## Structure

```text
├── index.html
├── character.json
├── css/
│   ├── base.css
│   ├── components.css
│   ├── medicine.css
│   └── inventory.css
└── js/
    ├── state.js             # localStorage key, default state, load/save helpers
    ├── utils.js             # shared helpers, tooltip math, condition helpers
    ├── sync.js              # state to screen reconciliation and button states
    ├── actions.js           # user actions, session report, reset flows
    ├── medicine.js          # Medicine tool and Battle Medicine cooldown tracker
    ├── modal.js             # attack roll modal
    ├── panels-shared.js     # shared condition card builder
    ├── panels-combat.js     # Combat and Companion panels
    ├── panels-skills.js     # Skills panel and Medicine Tool
    ├── panels-info.js       # Info panel, notes, feats, session controls
    ├── panels-inventory.js  # Inventory panel and ammo tracking
    └── navigation.js        # boot, tabs, swipe, and tooltip system
```

Scripts load in the order listed in `index.html`. `panels-shared.js` must load before the other panel files.

## Running locally

Serve from the repo root. The app fetches `character.json`, so opening `index.html` directly with `file://` will not work reliably.

```bash
npx serve .
```

Any static local server works. For example:

```bash
python -m http.server 4177
```

Then open `http://127.0.0.1:4177/`.

## Updating character data

Edit `character.json`. AC and most stats are derived from component fields at runtime, so update the underlying fields instead of only changing displayed totals.

Weapon damage uses a structured `damage_rolls` array. Inventory items need `ammo: true` and `ammoPerBundle` for ammunition tracking.

## Resetting session state

In the app: Info tab -> Session -> Reset Session.

In the browser console:

```js
localStorage.removeItem('saske_state_v1');
location.reload();
```

## Before pushing

Recommended quick checks:

```bash
node --check js/state.js
node --check js/utils.js
node --check js/sync.js
node --check js/actions.js
node --check js/medicine.js
node --check js/modal.js
node --check js/panels-shared.js
node --check js/panels-combat.js
node --check js/panels-skills.js
node --check js/panels-info.js
node --check js/panels-inventory.js
node --check js/navigation.js
```

Also parse `character.json` and smoke test the Combat tab in a browser.
