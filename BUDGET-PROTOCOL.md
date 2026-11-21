# Budgeted artifact repair — November 19, 2026

Purpose: measure the generated application, with agent completion reported as a
separate outcome. A saved account app from a timed-out run compiled and passed
the scripted normal flow; waiting for a final agent event excluded usable UI.

## Capture rule

- Same six extension tasks, six available models, two prompts, three repetitions:
  216 cases. Fable remains unavailable through the permitted source.
- Capture the source at normal agent completion or the nominal 20-minute wall
  deadline, whichever happens first. A deadline capture does **not** claim the
  agent finished. Do not retry based on a captured app's score or usability.
- Access/protocol errors before capture may be retried. Operator-interrupted
  attempts remain recorded and are not scored as completed generations.
- Rebuild captured source inside the compiler sandbox, then run the same
  documented browser stresses. A compile or ordinary-function failure earns
  zero; an agent timeout alone does not substitute for the browser verdict.
- Preserve the original completion-filtered dataset. Existing completed sources
  are referenced without copying the corpus. Where an earlier timeout snapshot
  exists, use the first preserved deadline artifact, even if a later retry
  completed. One event cutoff was discarded by the old runner; replace it with
  a fresh draw, explicitly annotated, without selecting on its browser score.
- Remaining Grok cases run three at a time after all other model generations
  finished. Earlier work mostly used two workers per model. Record this resource
  difference; elapsed time is not a compute-normalized model speed comparison.

## Interpretation and validation

This cohort was repaired during the run and was not preregistered, so it is not
an unbiased first-attempt success study. Earlier access/operator retries, missing
cutoff replacement and the host browser-policy change remain limitations.
Both artifact quality and generation completion must be visible in reports.

The final primary replay runs after generation and diagnostic grading finish.
It uses fresh isolated compilation, confined static serving, fixed task weights
and the documented announcement/progress corrections. Independent human
validation and an entirely new held-out interaction-family set remain pending.
Nothing is published by this protocol.

## Recovery locator correction

Diagnostic replay found visible retry labels containing decorative aria-hidden
arrows, or differing from explicit accessible labels. Role-name exact matching
could not activate those controls. Recovery now locates the actual visible
control recorded by the snapshot; real GET requests and loaded content still
determine success. A managed-browser regression control covers both cases.

## Fable 5.2 addition — November 21, 2026

Fable 5.2 was not available through the access path used for the other
Claude models when the main cohort ran. Its 36 cases (same six tasks, two
prompts, three repetitions) were generated on November 21 through a separate
direct access path instead.

- Generated after the other six models had been scored. The task set, briefs,
  capture rule, isolation profile and grading code were not changed for it.
- Standard speed, fixed medium effort. Requests went through a separate local
  router instance with fast mode disabled; every logged provider turn reported
  standard speed. Other models used their own routes and effort settings, so
  access path remains a difference between rows.
- Two workers per condition, default first, then instructed.
- Same retry policy: only access or protocol errors before capture may be
  retried; no retry depends on a captured app's score.

Two starting conditions differed from the other rows and were found only after
generation, before any Fable app was graded:

- A host cleanup on November 20 had removed `node_modules` from the template
  and from every previously captured app. Fable agents therefore started
  without installed dependencies and all 36 ran their own install. Each
  captured app's lockfile is byte-identical to the template's and its installed
  package versions match the template lockfile, with no added packages. Fable's
  elapsed times include that install and are not comparable with other rows.
- All 36 Fable runs started from the current template, which includes the host
  disposable-browser note (AGENTS.md). Among other models' default runs only
  six Grok cases had it; instructed runs are mixed. The note mentions browser
  tests, and some Fable agents did test in a browser, so this is a possible
  contributor to Fable's default score that the data cannot separate.

No Fable case was rerun. The earlier 216 grades were produced before the
cleanup and were not regenerated. Before grading Fable, four previously graded
apps from four other models were copied to a scratch directory, given a
lockfile install and regraded with the restored dependencies and browser; gate
and every stress verdict matched the recorded grades, with identical
measurement-source hashes. Replaying the older captured apps now requires a
lockfile install in each app first.

`bench/run.mjs --isolation-config isolation.<name>.local.json` selects the
private isolation config that points the agent CLI at that router.
