# Held-out round: protocol

**Superseded by the isolated replay following evaluator exposure. See
ISOLATION-AUDIT.md. The same six tasks, prompts, repetitions and scoring rules
are retained with the documented measurement corrections.**

Written and committed on November 19, 2026, before any app in this round was
built or graded.

## Why

The grading rules and the "harder stresses" grouping were developed while
looking at results on the first twelve tasks. This round tests whether the
findings hold on tasks nobody looked at while writing the rules.

## What is fixed

- **Tasks:** six new tasks, marked `"set": "heldout"` in their `task.json`:
  `releases` (list), `account` and `event` (two requests), `products`
  (search), `invite` (create form), `workspace` (edit form).
- **Grader:** `bench/grade.mjs` and `bench/page-probes.mjs` as of this commit.
  Pass rules do not change after this point. If the grader cannot operate an
  app (a harness fault, not a rule), the fix is logged below with the affected
  runs and all held-out apps are regraded.
- **Models:** claude-opus-5.5, gpt-6.1-sol, gpt-6-astra, grok-4.7, kimi-k3,
  muse-wonder. claude-fable-5.2 is absent: no access path was available for
  it in this round.
- **Conditions:** `default` and `told`, prompts unchanged from round 3.
- **Runs:** three per task, model and condition: 216 apps.
- **Score:** the round 3 metric, unchanged. Equal weight per task and per
  applicable stress category; the two partial-failure directions share one
  category; a failed ordinary-function gate earns zero. "Harder stresses" are
  the same eight as round 3: recover, garbage, partial, long, narrow, motion,
  accessibility audit, announce.
- **Attempts:** every build attempt is appended to the run's attempt log.
  An attempt that ends on an access limit, timeout or protocol error is
  retried; an attempt that completes is never rebuilt.

These tasks use the same app families and API patterns as development tasks.
This tests new briefs within those families; it does not establish performance
on entirely new interaction types.

## Predictions being tested

1. The model order on harder stresses matches round 3 (Spearman correlation
   across the six models).
2. The instruction raises every model's harder-stress score.
3. The table-stakes stresses stay near ceiling for every model.

## Known differences from round 3

- claude-opus-5.5 is served through a different access path than in round 3.
  Same model, same harness, same prompt; reasoning settings may differ.

## Deviations

1. **First launch lost (November 19).** The first build batch was killed a few
   seconds in when its launching shell exited. No app had completed. It was
   relaunched unchanged; the cut-off attempts remain in the attempt logs.
2. **Harness fault: form not found (November 19).** In the first grading pass
   (75 default apps, graded while builds were running on the same machine),
   two `invite` apps that passed the gate had form scenarios report that the
   form could not be found. Regrading one alone found the form and it passed.
   Fix: a scenario that cannot find the form or search box it is meant to
   operate is retried alone up to three times before its result is accepted.
   No pass rule changed. All held-out apps are regraded with the fixed grader
   after the builds finish, with nothing else running.
3. **Coordinator interruption (November 19).** The last baseline build
   coordinator was interrupted while separating the two conditions into
   concurrent queues. Its final unfinished run (account, Astra, default,
   repetition 3) had no completion event or metadata and was retried. Its
   earlier logs remain available. This further limits fixed-budget claims.
4. **Determinate progress misclassified as loading (November 19).** A
   determinate check-in or seat-use progress bar counted as pending work,
   falsely failing valid empty states. The snapshot probe now counts progress
   without a current value (or an explicit `aria-busy=true`) as pending.
   Regression controls cover determinate zero, indeterminate progress and
   explicit busy states. Held-out apps receive the final replay; affected
   development apps are also replayed before comparing rounds.

5. **Announcement applicability and task weights (November 19).** Synthetic
   contract checks found that absent error feedback could omit the announcement
   category. Absence now fails that category, matching the stated error-
   announcement rule. Load and save announcements are both required for edit
   forms. Report aggregation and clustered intervals now preserve equal task
   weight even when repetition counts are incomplete; complete balanced rows
   are unchanged by that weighting correction. Four verdict controls and four
   metric controls pass before the final isolated replay.
