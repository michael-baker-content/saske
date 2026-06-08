# Building a Personal Tabletop Tracker: Recent Challenges and Solutions

When a tool is built for exactly one user, it can afford to be opinionated in ways a general product never could. My PF2e session tracker — a static web app for tracking my ranger Saske and her animal companion Haki across combat sessions — has been iterating quickly lately, and a few of the recent problems were interesting enough to be worth writing up.

## The Data Connection Problem

One of the recurring design tensions in this project is between static character data and live session state. The character sheet lives in a JSON file; runtime state lives in localStorage. That separation is clean, but it creates a gap: when a piece of the UI is supposed to reflect something from both sources simultaneously, you have to be deliberate about where the data comes from and when.

This came up when adding inventory descriptions to weapon and armor cards. The shortbow card on the Combat tab should show what the item actually does — but that description lives in the inventory system, which is conceptually separate from weapons. The solution was a shared helper function (`invDescHtml`) in the utilities layer that any panel could call, looking up an item by name in the live session inventory. It meant the weapon card and the inventory table are both reading from the same source, so editing the description in one place propagates automatically. Small pattern, but it changed how I thought about crossing the boundary between static data and state.

## Conditions That Actually Do Something

Ranked conditions — Enfeebled, Clumsy, Sickened and the rest — have levels, and those levels have mechanical consequences. Enfeebled 3 isn't just a label; it's a −3 status penalty to every Strength-based roll. Getting that to propagate correctly required restructuring how conditions were stored.

Previously, conditions were stored as flat strings like `"Enfeebled 1"`. Adding a level selector meant splitting the data: the conditions list in the JSON now distinguishes between ranked conditions (with a `maxLevel`) and simple ones. The UI shows a number input that appears only when a ranked condition is selected. After adding, the string is reconstructed — `"Enfeebled 3"` — and fed into the existing system that computes per-skill penalty maps.

The trickier part was making Enfeebled actually affect the Skills panel. The penalty computation runs in `applyConditionEffects`, populates a `skillPenMap` object, and stores it in a non-persisted `_condPenalties` field on the state object. Every skill renderer then reads from that map and applies red highlighting and an adjusted modifier if the map has an entry for that skill. The skills panel also re-renders automatically when conditions change, which required a carefully placed re-build call that only fires when the Skills tab is currently visible.

## Party Condition Tracking

The Treat Condition feat introduced an interesting UI challenge: it applies to exactly three conditions, on up to five party members, with different downstream effects depending on who's affected. For Saske and Haki, changes pipe directly into the live condition system and affect stats immediately. For the other three party members, changes are tracked for reporting purposes only.

Rather than building a separate system, the solution was a 5×3 grid — members as rows, conditions as columns — with +/− buttons per cell. A single `setPartyCondition` function handles all five members but branches on whether the target is Saske or Haki, routing changes into `S.conditions` or `S.haki_conditions` respectively. The grid lives in the same card as the Battle Medicine cooldown tracker, keeping all the Medic Dedication workflow in one place.

## The Invisible Description Layer

Several features across the last few pushes share the same underlying pattern: information that exists in the data but shouldn't clutter the visual display. Feat descriptions, item effect notes, inventory hover text — all of these use the app's existing fixed-position tooltip system, which was originally built for stat tiles.

What made this satisfying to implement is that the tooltip trigger is on the *container element*, not the clickable element inside it. A feat row shows a tooltip when you hover anywhere in the row, but the text inside still signals clickability via cursor and colour. It's a small UX distinction — hover for context, tap for action — that keeps the information accessible without filling the screen with it.

## Localhost Caching Is Genuinely Annoying

A mundane but persistent source of confusion: `npx serve` caches JavaScript files in memory. Replacing a file on disk while the server is running doesn't guarantee the server will serve the new version. The fix for `character.json` was adding `{ cache: 'no-cache' }` to the fetch call. The fix for JS files is simply stopping the server before replacing them. Neither is complicated, but both are easy to forget — and the symptom (the app behaving as if your changes don't exist) is confusing the first few times you encounter it.

## What's Next

The tracker has grown significantly from its original scope. What started as a simple HP and condition tracker now covers attack rolls with structured dice, a full medicine workflow, disease tracking, party condition management, and a knowledge layer for feats and item effects. The next interesting problem is probably making more of these systems talk to each other — surfacing item effects directly from the inventory, or connecting disease stages to conditions automatically.
