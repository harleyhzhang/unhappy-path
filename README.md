# Unhappy Path

A benchmark for one question: when an AI model builds a web app, does the app
survive real conditions? See [SPEC.md](SPEC.md).

Status: prior comparisons invalidated after a builder read grading code and
hidden fixtures. See [ISOLATION-AUDIT.md](ISOLATION-AUDIT.md). The filesystem-isolated
artifact replay is complete. See [BUDGET-PROTOCOL.md](BUDGET-PROTOCOL.md) for the capture repair. Historical scores in ROUND3.md and HELDOUT.md must not
be used as a blinded model ranking.

## Layout

- `tasks/<id>/` — the brief the model sees, the sample data it develops against,
  and the different data plus checks used for grading (`task.json`).
- `template/` — the starting project every run begins from.
- `bench/run.mjs` — build phase: one headless agent run per (task, model, run).
- `bench/grade.mjs` — stress phase: replays each built app under changed
  conditions and scores it from browser measurements only.
- `bench/analysis.py` — separate development and held-out reports, matched
  instruction comparisons and task-clustered intervals.
- `bench/sensitivity.py` — isolated rankings with individual stress categories removed.

## Run

```sh
npm install && (cd template && npm install) && npx playwright install chromium
node bench/run.mjs --isolate --out runs-budget --models <model> --tasks <comma-separated-task-ids> --runs 3 --condition default --capture-on-timeout
node bench/run.mjs --isolate --out runs-budget --models <model> --tasks <comma-separated-task-ids> --runs 3 --condition told --capture-on-timeout
node bench/grade.mjs --dir runs-budget --video
python3 bench/analysis.py
python3 bench/sensitivity.py
python3 bench/export-results.py
python3 bench/status.py
```

`bench/run.mjs` expects a local `routes.local.json` mapping each model name to
the model identifiers your agent CLI accepts.

The original design in SPEC.md is historical. BUDGET-PROTOCOL.md defines the repaired capture policy;
HELDOUT-PROTOCOL.md retains the original task/stress design and deviations. each task’s `set` field keeps development tasks and
held-out tasks separate in the reports. AUDIT.md records a same-agent visual
second read. Independent human validation remains outstanding.

## Isolation configuration (macOS)

Generation requires `--isolate`. Keep `routes.local.json` and
`isolation.local.json` private. The latter has three absolute paths, all outside
this checkout:

```json
{
  "home": "/private/tmp/benchmark-private/codex-home",
  "workspace": "/private/tmp/benchmark-private/workspaces",
  "profile": "/private/tmp/benchmark-private/base.sb"
}
```

Use a mode-700 private parent. `home` contains the dedicated agent CLI config,
auth file and a frozen `models.json` catalog. Its config must point to that
catalog and the intended provider. Keep auth files mode 600. The runner creates
a fresh runtime home for each attempt and removes the per-run credential copy
afterward. Never copy ordinary personal chat history into this runtime.

`base.sb` starts with `(version 1)` and `(allow default)`, then denies
`file-read*` on this checkout and every directory containing grading artifacts,
fixtures or previous source apps. The coordinator runs outside that policy;
only builders inherit it. The runner adds per-run sibling filesystem denials,
write restrictions, and a signal policy permitting self/children only. It uses
one outer Seatbelt policy; nesting the CLI's own Seatbelt policy is unsupported.
Unrelated app/plugin connectors are disabled for builders.

Run `node bench/isolation-check.mjs` after an isolated `releases`/Kimi smoke
build. The own-project controls must succeed; grader, fixture and sibling
reads and sibling writes must fail. The smoke app must also build and pass its
ordinary-function gate. See ISOLATION-AUDIT.md for the actual incident and
additional process-signal controls.

`runs-isolated/` holds accepted apps and raw grades. Historical exposed apps
remain under `runs/`; reporting and export scripts exclude them. Isolated
reports are `ISOLATED.md` and `ISOLATED-SENSITIVITY.md`; exports are under
`artifacts-isolated/`. Keep incomplete rows provisional. Independent human
validation and a held-out set of entirely new interaction families remain
future work.

The grader rebuilds saved source inside `bench/build-app.mjs` isolation, with a
clean environment, before serving it through the path-confined static server.
Use `npm test` for scorer, compiler, serving and browser-probe controls.
`--phase interim` records diagnostics as `grade-interim.json`; ordinary scoring
reads `grade.json` from the final replay only.

The current budget cohort references preserved completed or deadline source via
`artifact_source` metadata and captures future source at completion/deadline.
Agent completion is a separate metric. `bench/status.py` tracks captures and
completion separately. The primary reports are BUDGET.md and
BUDGET-SENSITIVITY.md; exports are under artifacts-budget/. The original
runs-isolated/ corpus remains available for comparison and audit. Capture
repair details, replacements and resource differences are in BUDGET-PROTOCOL.md.

## November 19 final result

216 case outcomes captured and evaluated: 207 agent completions and nine
20-minute deadline artifacts. 215 passed the scripted normal flow; one deadline
artifact did not compile because App.css was missing. Reference controls and
independent export arithmetic checks passed. See [BUDGET.md](BUDGET.md),
[BUDGET-SENSITIVITY.md](BUDGET-SENSITIVITY.md), and
[VALIDATION.md](VALIDATION.md). Independent human agreement has not been
measured yet.

## November 21 Fable addition

Fable 5.2 was added as a seventh model: 36 further cases, all agent-completed
and all passing the scripted normal flow, for 252 in total. It was generated
later and through a different access route. Its first run had two differing
starting conditions, so it was rerun from the same starting project as the
original runs; the rerun is reported. See
[BUDGET-PROTOCOL.md](BUDGET-PROTOCOL.md#fable-52-addition--november-21-2026).
