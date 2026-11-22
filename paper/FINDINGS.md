# Findings

First full run of Unhappy Path, November 19 to 21, 2026. Seven models, six
tasks, two prompts, three runs each: 252 apps and 3,402 stress verdicts.
Read with [METHODS.md](METHODS.md) and the limits at the end.
Every number here is in [data.json](data.json), which is built from
`artifacts-budget/outcomes.csv` and the per-run grade files by
`paper/build_data.py`.

## Headline table

Harder-stress score, equal weight per task and per applicable category.
Brackets are 95% intervals from resampling whole tasks.

| Model | Default | Production prompt | Change | Table stakes (default) |
|---|---:|---:|---:|---:|
| Claude Fable 5.2 † | 95% (91–98) | 98% (96–100) | +4 (+1 to +7) | 100% |
| Claude Opus 5.5 | 79% (68–89) | 96% (92–99) | +17 (+7 to +27) | 100% |
| Muse Wonder | 77% (64–90) | 95% (92–98) | +18 (+6 to +31) | 100% |
| Grok 4.7 | 71% (58–85) | 92% (81–100) | +21 (−3 to +38) | 99% |
| GPT-6 Astra | 63% (49–77) | 83% (78–87) | +20 (+5 to +35) | 98% |
| GPT-6.1 Sol | 57% (48–66) | 85% (81–88) | +28 (+20 to +35) | 97% |
| Kimi K3 | 54% (37–73) | 94% (90–98) | +39 (+22 to +57) | 96% |

† Generated two days later through a different access path. Reported from a
rerun that started from the same project as the original runs; a first run
with two differing starting conditions scored within one point of it.

## The findings

1. **The expected states are solved.** Loading, error and empty states,
   double submits, stale search replies, rejected saves and keyboard
   reachability pass at 96% to 100% for every model with no instruction.
2. **Harder stresses separate models on the default prompt.** Scores run
   from 54% to 79% among the six models generated together.
3. **Partial failure is the sharpest split.** On pages with two requests,
   five of seven models lose the working half in all six default apps. All
   31 failing default apps fetch with a single `Promise.all`; none of the
   11 passing apps do.
4. **Long content breaks most default layouts.** 32% pass, averaged over
   models; four models pass in a quarter of apps or fewer.
5. **One sentence closes most of the gap.** Asking for production quality
   raises six models by 17 to 39 points. Five models then sit between 92%
   and 98%. Partial failure goes from 26% to 95%, long content from 32% to
   96%, recovery to 100% for every model.
6. **Two things the sentence does not fix.** GPT-6 Astra and GPT-6.1 Sol
   fail the accessibility audit in all 36 default apps and in 30 of 36
   instructed apps, almost always on colour contrast. Reduced motion stays
   at 90% in both conditions.
7. **Appearance and resilience are separate.** Some of the most polished
   default apps print a JSON parser exception to the user when the backend
   returns HTML.
8. **The sentence costs time.** Median build time rises for every model.
   Half of Grok 4.7's instructed runs reached the 20-minute limit; their
   apps were captured and graded as they stood.
9. **The order is coarse.** Runs of one model on one task differ by a
   median of 13 points. Removing any one harder stress moves a model by at
   most two ranks; Fable, Opus and Muse Wonder stay in the top three.

## Second round

Six new tasks, registered with five predictions before any app was built
(CONFIRM-PROTOCOL.md); all seven models generated together from the same
starting project, one attempt per app. 248 of 252 apps captured, 3,349
verdicts. All five predictions held:

1. Default order agrees with the main run: Spearman 0.96 (threshold 0.6).
2. The sentence raises at least six models: six rose by 18 to 42 points;
   Fable stayed at 96%.
3. Default table stakes at least 90% for every model: lowest 94%.
4. Muse Wonder, Grok, Astra, Sol and Kimi fail partial failure in most
   default two-request apps: each failed all six.
5. Astra and Sol fail the accessibility audit in most default apps: each
   failed all 18.

Grok's instructed apps came from two access paths after its first path ran
out of allowance; the 11 from the second path were all captured at the time
limit. Details: CONFIRM.md.

## Counts

- 252 apps captured: 243 at agent completion, 9 at the 20-minute deadline.
- 251 pass the normal-flow gate. One deadline capture did not compile.
- Zero measurement exceptions in the final grading pass.

## Limits

No independent human check of the verdicts. Repairs were made during the
run. Fable was generated later and through a different access path.
Access paths and reasoning settings differ between models. Twelve tasks
across two rounds, all from familiar families. Several checks are proxies. Details: METHODS.md, and in
the repository root BUDGET-PROTOCOL.md, ISOLATION-AUDIT.md and VALIDATION.md.

