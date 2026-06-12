# Making a Pathfinder Combat Tracker Feel More Like a Table Companion

This session was about turning a useful Pathfinder 2e tracker into something a little more trustworthy during actual play.

The app already tracked Saske, my ranger, and Haki, her animal companion. It handled hit points, attacks, conditions, inventory, medicine, and session notes. But as it grew, a few rough edges started to matter. Some changes were not being reflected in the session report. Some tooltips explained the math in a clunky way. Some mobile controls needed more room. And one important Pathfinder rule interaction, Quickened and Slowed changing the number of actions available, still needed to be represented directly in the turn tracker.

The latest pass focused on those table-facing details.

## The turn tracker now understands Quickened and Slowed

Pathfinder's three-action economy is one of the system's defining rhythms, so the action tracker needs to be accurate at a glance.

Saske's "Actions This Turn" control now responds to conditions:

- Normal: three actions and one reaction.
- Quickened: a fourth action appears.
- Slowed: the correct number of actions disappears.
- Quickened and Slowed together: the tracker shows the combined result.

This only applies to Saske's turn tracker. Haki's condition list can still show Slowed or Quickened as table information, but it does not change Saske's action selector.

The mobile layout was adjusted at the same time. The action buttons now wrap more gracefully on narrow screens, and the Warden's Boon text was shortened so the important controls keep their space. The longer Warden's Boon explanation still exists as a hover tip.

## Haki is now part of the session report

One of the main goals of the tracker is to make session notes easy to export. If something important changes during combat, the Copy Report button should become available and include that change.

Haki's hit points were not fully tied into that workflow before. Now Haki starts at full health by default, and changes to Haki's HP or temporary HP count as reportable session changes. If Haki takes damage, receives healing, gets temporary HP, gains a condition, or has other tracked state changes, the app treats that as part of the session story.

The report trigger was also broadened beyond HP. It now watches more of the things that can matter after a session:

- Saske's actions and reaction usage.
- Warden's Boon.
- Haki's HP, conditions, diseases, and barding.
- Inventory changes and ammunition usage.
- Disease tracking.
- Party condition tracking.
- Feat notes and custom item effects.
- Battle Medicine cooldowns.

That makes Copy Report feel less like a hit point log and more like a full session summary.

## Attack cards explain themselves

The attack cards now have hover explanations showing how the attack modifier is calculated. Instead of only seeing a final `+17`, you can hover and see where that number comes from: proficiency, ability modifier, item bonus, and any current condition penalty.

This matters because the app is not just a calculator. It is also a confidence tool. During a game, especially when conditions pile up, it helps to see why a number changed without digging through the character sheet.

While doing that, the math language across the tracker was cleaned up. The app now avoids awkward text like `+ +4 DEX` and instead shows cleaner expressions like `+ 4 DEX`. It is a small wording change, but it makes the tracker feel calmer and more reliable.

## Tooltips are less twitchy

The attack tooltip had an annoying behavior: moving the mouse around inside the same attack card could make the tooltip appear and disappear. The issue was not the content of the tooltip, but how hover was detected. The app was reacting as though moving between parts inside the same card meant leaving and re-entering the hover area.

That behavior is now fixed. Hovering an attack card feels stable, which makes the explanations much easier to use.

## More changes are safer to display

The tracker stores everything locally in the browser. There is no account system, no database, and no remote user input. Even so, some user-editable text can be rendered back into the page: item notes, disease names, feat descriptions, and similar fields.

Those display paths now escape text before showing it. For a personal local tool, this is not the same risk profile as a public website, but it is still a good habit. The tracker should be resilient even when a note contains unusual characters.

## The character data got a rules cleanup

Saske's weapon damage data was corrected so the app's attack scoring better matches the actual character build. This is the sort of fix that is easy to miss because the interface can look right while the underlying numbers are slightly off.

That reinforces one of the lessons from this project: the tracker is only as good as the relationship between the character data and the live interface. When those line up, the app becomes much easier to trust.

## The bigger direction

The tracker is moving from "a place to record things" toward "a table companion that notices what matters."

The best changes in this session were not flashy. They were small pieces of friction removed:

- A fourth action appears exactly when it should.
- A report button activates when Haki takes damage.
- A tooltip explains a number without making the screen noisy.
- Mobile controls keep working when the tracker is squeezed.
- The exported report better reflects what happened in play.

That is the kind of polish that matters most for a personal game tool. It does not need to become a platform. It needs to be fast, readable, and honest about the current state of the character.
