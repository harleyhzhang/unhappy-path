# Confirmatory round: protocol

Written and committed on November 21, 2026, before any app in this round was
built. Nothing below changes after the first build starts; any deviation is
logged at the end of this file with the runs it affects.

## Why

The main run's grading rules were developed on earlier tasks, the run was
repaired while it was in progress, and its task data is now public. This round
tests whether its findings hold on new tasks, with every model generated
together under rules fixed in advance and no repairs in flight.

## What is fixed

- **Tasks:** six new tasks, marked `"set": "confirm"`, written for this round
  and not published before it ends: `shipments` (list), `supplier` and
  `course` (two requests), `parts` (search), `demo` (create form),
  `storefront` (edit form). Same kinds as the main run, so the grader needs no
  change; new briefs, data and probes.
- **Grader:** `bench/grade.mjs`, `bench/page-probes.mjs`, `bench/verdicts.mjs`,
  `bench/build-app.mjs`, `bench/static-server.mjs` and `bench/controls.mjs` as
  of this commit. Pass rules do not change. Before this commit, correct
  reference apps for the four data tasks were graded and passed every check.
- **Score:** unchanged from the main run. Equal weight per task and per
  applicable stress category; partial-failure directions share one category; a
  failed gate or build earns zero. Harder stresses: recover, garbage, partial,
  long, narrow, motion, accessibility audit, announce.
- **Models:** Claude Fable 5.2, Claude Opus 5.5, Muse Wonder, Grok 4.7, GPT-6
  Astra, GPT-6.1 Sol, Kimi K3.
- **Conditions:** `default` and `told`, prompts unchanged.
- **Runs:** three per task, model and condition: 252 apps.
- **Starting project:** the template with its locked dependencies installed and
  without the host browser-testing note (`--no-host-note`), for every model.
- **Harness:** the Codex command-line agent in the same operating-system
  sandbox as the main run, 20-minute wall limit, capture at agent completion or
  the deadline.
- **Scheduling:** all models run in the same window, two workers per model,
  default condition then instructed. A model whose route only becomes
  available later starts as soon as it is available; the lag is logged.

## Attempts

One attempt per app. An attempt is retried only if it ends on an access,
rate-limit or protocol error before the agent completes, using the existing
runner rule (at most four cycles). A captured app is never rebuilt, whatever
its quality. Apps still missing after four cycles are reported as missing.

## Predictions being tested

1. On the default prompt, the model order on harder stresses agrees with the
   main run (Spearman correlation of at least 0.6 across the seven models).
2. Adding the production sentence raises the harder-stress score for at least
   six of the seven models.
3. Table stakes stay at or above 90% for every model on the default prompt.
4. Partial failure: Muse Wonder, Grok 4.7, GPT-6 Astra, GPT-6.1 Sol and Kimi K3
   each fail it in a majority of their default two-request apps.
5. GPT-6 Astra and GPT-6.1 Sol each have a serious accessibility-audit
   violation in a majority of their default apps.

Each prediction is reported as held or not held, with the numbers.

## Reporting

The round is reported in full, separately from the main run, whatever the
results. Access paths and reasoning settings per model are recorded in the
private run logs and summarised as model, harness and date in public.

## Deviations

1. **Kimi K3 and Muse Wonder start late (November 21).** Their route needs a
   new sign-in that was not yet approved when the other five models started at
   19:07 Central. They start when it is available; the lag will be recorded.
2. **Grok 4.7 usage limit (November 21).** After 23 apps, Grok's route reported
   that its usage allowance was used up for a rolling 24-hour window. Every
   affected attempt ended before the agent completed and was retried under the
   attempt rule until the runner's four cycles ran out; the runner was then
   stopped. The remaining Grok apps will be generated when a route is available
   again, either after the window resets or through another route serving the
   same model, which will be recorded. No captured app was rebuilt.
3. **Route changes and start times (November 21).** Kimi K3 and Muse Wonder
   started at 23:30 Central, about 4 hours 23 minutes after the other models,
   through the same Cursor model service the main run used, on a different
   account. The 13 missing Grok 4.7 apps were attempted through that Cursor
   route instead of the original one (11 captured, 2 missing), at its default reasoning setting, as in
   the main run. The 23 Grok apps already captured were kept. Grok's results
   are reported both overall and for the 23 original-route apps alone.
