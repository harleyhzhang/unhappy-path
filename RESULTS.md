# Results, round 2

**Historical results: the November 19 isolation audit found evaluator exposure in earlier generation runs. These scores must not be treated as a blinded model comparison. See ISOLATION-AUDIT.md and the replacement ISOLATED.md report.**

November 16, 2026. 9 tasks, 4 models, 3 runs each (108 apps), 18 stresses,
default condition (the brief says nothing about robustness). Every app built
and worked under normal conditions. Supersedes [PILOT.md](PILOT.md).

Each cell is apps that survived / apps the stress applies to.

| Stress | What it does | Claude Opus 5.5 | Grok 4.7 | GPT-6.1 Sol | Kimi K3 |
| --- | --- | --- | --- | --- | --- |
| Recover | Backend comes back after failing; is there a retry that works | 24/24 | 19/24 | 24/24 | 0/24 |
| Garbage | Backend answers with an HTML error page instead of data | 8/24 | 11/24 | 14/24 | 6/24 |
| Partial | One of two requests fails | 6/6 | 2/6 | 0/6 | 1/6 |
| Long | Long values and 40x the rows | 17/21 | 10/21 | 6/21 | 0/21 |
| Narrow | 320px-wide screen | 27/27 | 26/27 | 18/27 | 17/27 |
| Motion | Reduce-motion setting on | 16/27 | 25/27 | 19/27 | 27/27 |
| Accessibility | axe audit, serious or critical issues | 19/27 | 26/27 | 0/27 | 14/27 |
| Announce | Errors exposed to screen readers | 27/27 | 26/27 | 22/27 | 14/27 |
| Slow | 3-second network delay | 24/24 | 24/24 | 24/24 | 24/24 |
| Failed | Server error on load | 24/24 | 22/24 | 24/24 | 24/24 |
| Empty | No data | 20/21 | 21/21 | 21/21 | 19/21 |
| Zoom | 200% zoom | 27/27 | 27/27 | 26/27 | 27/27 |
| Spacing | User text-spacing settings | 26/27 | 26/27 | 26/27 | 27/27 |
| Keyboard | Tab reaches every control, focus is visible | 27/27 | 27/27 | 27/27 | 27/27 |
| Stale | Old search reply arrives last | 6/6 | 6/6 | 6/6 | 6/6 |
| Double | Submit clicked twice during a slow save | 6/6 | 6/6 | 6/6 | 6/6 |
| Failed save | Save rejected: told, input kept, retry works | 6/6 | 6/6 | 6/6 | 6/6 |
| Invalid | Required field empty: nothing sent | 6/6 | 6/6 | 6/6 | 6/6 |
| **Overall** | | **316/357 (89%)** | **316/357 (89%)** | **275/357 (77%)** | **251/357 (70%)** |
| Per run | | 87, 88, 90 | 87, 90, 88 | 77, 75, 79 | 69, 72, 70 |

## What this says

- The ceiling is gone: the best score is 89%, and no model passes everything.
- Scores are stable from run to run (within about 3 points per model).
- **Eight stresses separate models** (top block). **Ten are passed by nearly
  everyone** (bottom block), including every interaction stress: out-of-order
  search replies, double submit, failed and invalid saves. Current models
  cancel stale requests and disable buttons without being asked.
- The gaps are in less-rehearsed territory: an HTML error page where JSON was
  expected (most apps print the raw parser error to the user), one request of
  two failing (most apps blank the whole page), long content, small screens,
  reduce-motion, colour contrast.
- Different models fail different things. GPT-6.1 Sol fails the accessibility
  audit on every app, always for colour contrast. Kimi K3 never offers a retry.
  Claude Opus 5.5 keeps spinners spinning under reduce-motion and prints raw
  parser errors.

## Rule changes since the pilot

- Long: the unbreakable word is now 45 characters (a long email address), text
  is 4x not 8x, and long values must not create new sideways scrolling inside
  the page (this closed the loophole noted in the pilot).
- Text "spilled" now requires visible damage: it leaves its card or runs into
  other text.
- Vertical text cut-off is now measured.
- "Garbage", "failed" and "partial" fail if raw exception text reaches the user.

## Harness bugs found and fixed this round

Both would have produced wrong rankings and both were caught only by reading
the evidence behind a surprising number.

1. Double submit reported 0/6 for GPT-6.1 Sol. The test clicked where the
   button was without scrolling to it; on taller pages it clicked nothing.
   True result: 6/6.
2. Keyboard reported invisible focus for search boxes that focus themselves on
   load, because the "unfocused" reference was taken while focused. True
   result: 27/27 for every model.

## Caveats

- Rules were written by one author and have not had the independent human check.
- Agents could start a dev server but had no guaranteed browser.
- Build time is not comparable across models (different access speeds).
- Motion and Garbage rest on rules a reasonable person could set differently;
  they are reported as separate rows so they can be discounted.
- Three runs per cell. Partial and the form and search stresses have 6 apps per model.

## Next

- Drop or merge the ten saturated stresses in the headline score; keep them as
  a "table stakes" block.
- More tasks with two or more requests, so Partial has more than 6 apps.
- The "told vs not told" condition.
- Independent hand-check of 150 verdicts.
