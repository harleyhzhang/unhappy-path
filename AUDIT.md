# Second-read audit of the grader

November 19, 2026. This is not the independent human check; that is still
owed. It is a blind second read by the same agent that wrote the rules, so it
can catch a grader that measures the wrong thing but cannot catch a rule that
is wrong.

## Method

- 32 verdicts sampled at random (fixed seed) from round 3 apps that passed the
  gate: 8 each for long, narrow, garbage and partial failure, 4 that the
  grader passed and 4 that it failed.
- The screenshots were shuffled, given opaque labels and judged against the
  written pass rule without the grader's verdict visible.
- Sample: `runs/audit/sheets.json`; verdicts: `runs/audit/second-read.json`.

## Result

| Stress | Agree | Disagree |
|---|---:|---:|
| Long | 8 | 0 |
| Narrow | 7 | 1 |
| Garbage | 8 | 0 |
| Partial failure | 8 | 0 |
| **Total** | **31** | **1** |

The one disagreement went the grader's way on inspection. The reader passed a
billing page at 320 px because nothing looked broken; the grader failed it
because the payment-method column was gone. The app hides that column below
720 px, so content the brief asks for is missing on a phone.

## What this does and does not show

- The measurements match what is on the screen for these four stresses.
- A screenshot shows only the first screen, so the reader could miss problems
  further down that the grader measures.
- Motion, the accessibility audit, announce and recover cannot be judged from
  a still image and are not covered.
- Balanced sampling means 31 of 32 is not an estimate of overall accuracy.
