# Round 3: seven models and the instruction comparison

**INVALIDATED FOR MODEL COMPARISON — November 19 audit found successful reads of grading code and hidden fixtures by benchmark builders. Retained as historical exploratory output. See ISOLATION-AUDIT.md.**
Exploratory. The harder-stress categories were chosen after seeing the first four models on these tasks, so this is not a confirmatory leaderboard; the held-out round (HELDOUT.md) is the check.

Scores give equal weight to each task and each applicable stress category. Both partial-failure directions share one category. An app that fails the ordinary-function gate earns zero. Brackets are 95% intervals from resampling whole tasks.

## Overall

| Model | Default apps | Gate failures | Harder stresses | Table stakes | Matched pairs | Instructed harder stresses | Change from the instruction |
|---|---:|---:|---:|---:|---:|---:|---:|
| claude-fable-5.2 | 36/36 | 0 | 91% (87–95) | 98% | 10/36 | 93% | +0 pp (-8 to +10) |
| claude-opus-5.5 | 36/36 | 0 | 80% (73–88) | 98% | 36/36 | 98% | +17 pp (+11 to +25) |
| grok-4.7 | 36/36 | 0 | 75% (67–85) | 98% | 36/36 | 98% | +23 pp (+13 to +32) |
| muse-wonder | 36/36 | 0 | 61% (51–71) | 92% | 36/36 | 90% | +30 pp (+22 to +38) |
| gpt-6.1-sol | 36/36 | 0 | 51% (40–62) | 97% | 36/36 | 81% | +30 pp (+18 to +42) |
| gpt-6-astra | 36/36 | 0 | 51% (42–60) | 94% | 36/36 | 82% | +32 pp (+21 to +42) |
| kimi-k3 | 36/36 | 0 | 44% (34–56) | 98% | 36/36 | 86% | +42 pp (+32 to +52) |

## Default: share of applicable apps that pass each harder stress

| Model | recover | garbage | partial | long | narrow | motion | a11y | announce |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| claude-fable-5.2 | 100% | 85% | 100% | 77% | 97% | 86% | 86% | 100% |
| claude-opus-5.5 | 100% | 36% | 100% | 87% | 100% | 58% | 69% | 100% |
| grok-4.7 | 79% | 42% | 27% | 37% | 97% | 83% | 94% | 97% |
| muse-wonder | 88% | 48% | 0% | 17% | 92% | 64% | 31% | 89% |
| gpt-6.1-sol | 100% | 45% | 0% | 20% | 58% | 64% | 0% | 72% |
| gpt-6-astra | 100% | 52% | 0% | 20% | 61% | 53% | 0% | 78% |
| kimi-k3 | 0% | 21% | 7% | 7% | 61% | 100% | 56% | 47% |

## Instructed: share of applicable apps that pass each harder stress

| Model | recover | garbage | partial | long | narrow | motion | a11y | announce |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| claude-fable-5.2 | 100% | 100% | 100% | 100% | 100% | 50% | 100% | 100% |
| claude-opus-5.5 | 100% | 100% | 100% | 100% | 100% | 89% | 97% | 100% |
| grok-4.7 | 91% | 97% | 100% | 97% | 100% | 100% | 100% | 100% |
| muse-wonder | 100% | 61% | 100% | 83% | 97% | 97% | 83% | 100% |
| gpt-6.1-sol | 94% | 100% | 100% | 100% | 83% | 89% | 0% | 100% |
| gpt-6-astra | 91% | 97% | 100% | 100% | 89% | 97% | 3% | 100% |
| kimi-k3 | 94% | 64% | 87% | 70% | 92% | 92% | 86% | 100% |

## Limits

- Instruction condition: “Make it production quality: it should hold up under slow or failing requests, missing or very long data, small screens, and keyboard and screen-reader use.”
- Changes from the instruction use only the same task and repetition in both conditions. Rows with fewer matched pairs than apps are provisional.
- All runs use one agent harness. A model's access path and reasoning settings can still affect results, so no difference here is a claim about the model alone.
- No human agreement rate has been measured. The checks are proxies: the keyboard check detects a style change rather than proving focus is visible, zoom uses a smaller viewport rather than browser text scaling, and layout checks do not establish usability.
- Attempts interrupted by access limits were retried. Earlier attempts in this round were not all retained, so it cannot give an unbiased fixed-budget success rate.
