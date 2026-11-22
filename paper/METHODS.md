# Methods

## Design

| Factor | Levels |
|---|---|
| Models | Claude Fable 5.2, Claude Opus 5.5, Muse Wonder, Grok 4.7, GPT-6 Astra, GPT-6.1 Sol, Kimi K3 |
| Tasks | releases (list), account and event (two requests), products (search), invite (create form), workspace (edit form) |
| Prompt | default; default plus one production-quality sentence |
| Repetitions | 3 |

7 × 6 × 2 × 3 = 252 apps.

**Prompts.** Default: "Read BRIEF.md in this directory and build the app it
describes. Work only inside this directory." The production prompt appends:
"Make it production quality: it should hold up under slow or failing
requests, missing or very long data, small screens, and keyboard and
screen-reader use."

**Harness.** The Codex command-line agent, headless, one fresh project per
run, same React and Vite template, 20-minute wall limit. Fixed medium
reasoning effort where the route allows a setting. Access paths differ by
model and are not part of the comparison.

## Isolation

Builds run outside the evaluation tree. A macOS Seatbelt policy applied to
the agent and all its children denies reads of the tree holding the
repository and of every other run, denies writes outside temporary
directories, and denies signals to anything but the process's own children.
Each attempt has its own runtime directory. Controls verify that own-project
reads and builds work and that grader, fixture and sibling reads fail.

## Capture

The app's source is captured when the agent finishes or at the deadline,
whichever comes first. Agent completion is reported separately. An attempt
that ends on an access or protocol error before capture may be retried; no
retry depends on a captured app's score.

## Grading

1. **Rebuild.** Source is rebuilt in a compiler sandbox that can read only
   the Node toolchain and that app. A build failure scores zero.
2. **Serve.** The bundle is served as static files by a server that refuses
   paths outside it.
3. **Gate.** The normal flow is driven against grading data that differs
   from the sample data: rows present, search results exact, form payload
   correct, confirmation shown. A gate failure scores zero.
4. **Stress.** One fresh browser context per stress. Network conditions are
   injected by intercepting requests to `/api/`; browser conditions are
   set on the context.
5. **Verdict.** A stress passes only if all of its checks pass.

## Stress categories

Applicability depends on the task kind; a task has between 10 and 14.

| Category | Condition | Passes if |
|---|---|---|
| Slow | every reply delayed 3 s | a loading signal is present; no empty-state text while loading; layout shift under 0.1 |
| Failed | load requests return 500 | text unique to the failed state; not stuck loading; not shown as empty; no raw error text; no crash |
| Empty | list endpoints return [] | text unique to the empty state; not stuck loading; no junk values |
| 200% zoom | viewport 640 × 400 | no sideways scroll; no cut or spilled text; content present |
| Text spacing | WCAG 1.4.12 spacing styles injected | no sideways scroll; no cut or spilled text |
| Keyboard | Tab only | every control reached; style changes on focus; no mouse-only controls; Enter submits forms |
| Out-of-order | older search reply arrives last | results match the latest query |
| Double submit | two clicks during a slow save | exactly one request |
| Failed save | save returns 500 | error text appears; input kept; pressing save again resends; not stuck |
| Invalid save | required field empty | no request sent |
| Recover | fail, then backend recovers | a control unique to the failed state refetches and content returns |
| Garbage reply | HTML body with status 200 | an error is shown; no raw parser text; not stuck; no crash |
| Partial failure | one of two requests fails, each way | the loaded part is still shown; an error is shown |
| Long content | 4× strings plus a 45-character word, 40× rows | no sideways scroll; no new sideways scroller; no cut or spilled text |
| Narrow screen | viewport 320 × 640 | no sideways scroll; no cut or spilled text; tap targets 24 px or spaced; content present |
| Reduced motion | reduced-motion preference on | no running animation that moves something and repeats or lasts over 3 s |
| Accessibility audit | axe-core on the loaded page | no serious or critical violation |
| Announced errors | failed load, failed save | error text in a live region, alert or status role, associated with the field, or focused |

Table stakes are the first ten rows. Harder stresses are the last eight.

## Scoring

Per app, each applicable category scores 1 or 0 (the two partial-failure
directions share one category and are averaged). The harder-stress score of
an app is the mean over its applicable harder categories. A model's score is
the mean over tasks of the mean over its three runs. Intervals: 4,000
resamples of whole tasks, 2.5th and 97.5th percentiles, fixed seed.

## Validation done

- Three reference apps pass every applicable check; eight apps with one
  planted defect each are all detected.
- Contract tests for verdict logic, metrics, the compiler sandbox, the
  static server and the capture policy.
- An independent script recomputes every reported score from the exported
  per-verdict file and checks export fidelity against the raw grade files.
- Four previously graded apps regraded after the grading environment was
  reinstalled; every verdict matched.
- A blind second read of 32 sampled verdicts on four stresses by an AI
  agent, 31 in agreement. Not an independent human check.

- A second round on six new tasks under a protocol registered before any
  build, all models generated together: all five predictions held
  (CONFIRM.md).

## Validation not done

- Independent human agreement on a random sample of verdicts.
- Tasks from interaction families the rules were not developed on.

