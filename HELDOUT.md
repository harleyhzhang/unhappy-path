# Held-out round: six tasks written after the rules were fixed

**INVALIDATED FOR MODEL COMPARISON — November 19 audit found successful reads of grading code and hidden fixtures by benchmark builders. Retained for the record. See ISOLATION-AUDIT.md.**
**INCOMPLETE — counts below show the graded apps currently available.**

Protocol: HELDOUT-PROTOCOL.md, committed before any of these apps were built. Rules, categories and scoring are unchanged from round 3.

Scores give equal weight to each task and each applicable stress category. Both partial-failure directions share one category. An app that fails the ordinary-function gate earns zero. Brackets are 95% intervals from resampling whole tasks.

## Overall

| Model | Default apps | Gate failures | Harder stresses | Table stakes | Matched pairs | Instructed harder stresses | Change from the instruction |
|---|---:|---:|---:|---:|---:|---:|---:|
| claude-opus-5.5 | 18/18 | 0 | 88% (85–90) | 100% | 0/18 | — | — |
| grok-4.7 | 9/18 | 0 | 66% (55–78) | 100% | 0/18 | — | — |
| muse-wonder | 18/18 | 0 | 70% (61–80) | 96% | 0/18 | — | — |
| gpt-6.1-sol | 7/18 | 0 | 65% (56–72) | 95% | 0/18 | — | — |
| gpt-6-astra | 5/18 | 0 | 59% (47–70) | 91% | 0/18 | — | — |
| kimi-k3 | 18/18 | 0 | 53% (34–72) | 98% | 0/18 | — | — |

## Default: share of applicable apps that pass each harder stress

| Model | recover | garbage | partial | long | narrow | motion | a11y | announce |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| claude-opus-5.5 | 100% | 40% | 100% | 92% | 100% | 100% | 72% | 100% |
| grok-4.7 | 50% | 38% | 17% | 14% | 100% | 78% | 89% | 78% |
| muse-wonder | 100% | 67% | 0% | 25% | 94% | 94% | 28% | 89% |
| gpt-6.1-sol | 100% | 50% | 0% | 0% | 100% | 100% | 0% | 100% |
| gpt-6-astra | 100% | 50% | 0% | 33% | 80% | 60% | 0% | 100% |
| kimi-k3 | 0% | 13% | 0% | 17% | 78% | 100% | 61% | 61% |

## Instructed: share of applicable apps that pass each harder stress

| Model | recover | garbage | partial | long | narrow | motion | a11y | announce |
|---|---:|---:|---:|---:|---:|---:|---:|---:|

## Do the round 3 findings hold?

- Model order on harder stresses, default condition, round 3 against held-out: Spearman 1.00 across 3 models.

| Model | Round 3 default | Held-out default | Round 3 instructed | Held-out instructed |
|---|---:|---:|---:|---:|
| claude-opus-5.5 | 80% | 88% | 98% | — |
| muse-wonder | 61% | 70% | 90% | — |
| kimi-k3 | 44% | 53% | 86% | — |

## Limits

- Instruction condition: “Make it production quality: it should hold up under slow or failing requests, missing or very long data, small screens, and keyboard and screen-reader use.”
- Changes from the instruction use only the same task and repetition in both conditions. Rows with fewer matched pairs than apps are provisional.
- All runs use one agent harness. A model's access path and reasoning settings can still affect results, so no difference here is a claim about the model alone.
- No human agreement rate has been measured. The checks are proxies: the keyboard check detects a style change rather than proving focus is visible, zoom uses a smaller viewport rather than browser text scaling, and layout checks do not establish usability.
