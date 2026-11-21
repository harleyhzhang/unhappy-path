# Isolated replay: six tasks and six models

**Historical completion-filtered diagnostic only. The primary repaired cohort and final quiet replay are in BUDGET.md.**

**INCOMPLETE — counts below show the graded apps currently available.**

**DIAGNOSTIC ONLY — collected alongside generation; final scores require the quiet replay.**

Filesystem-isolated replay of the six extension tasks. See ISOLATION-AUDIT.md and HELDOUT-PROTOCOL.md. Earlier exposed runs are excluded. Scoring retains the documented progress-bar and inoperable-control corrections.

Scores give equal weight to each task and each applicable stress category. Both partial-failure directions share one category. An app that fails the ordinary-function gate earns zero. Brackets are 95% intervals from resampling whole tasks.

## Overall

| Model | Default apps | Gate failures | Harder stresses | Table stakes | Matched pairs | Instructed harder stresses | Instructed minus default |
|---|---:|---:|---:|---:|---:|---:|---:|
| claude-opus-5.5 | 18/18 | 0 | 79% (68–89) | 100% | 18/18 | 96% | +17 pp (+7 to +27) |
| grok-4.7 | 18/18 | 0 | 71% (58–85) | 99% | 1/18 | 100% | +14 pp |
| muse-wonder | 18/18 | 0 | 77% (64–90) | 100% | 18/18 | 95% | +18 pp (+6 to +31) |
| gpt-6.1-sol | 18/18 | 0 | 57% (48–66) | 97% | 18/18 | 83% | +26 pp (+17 to +35) |
| gpt-6-astra | 18/18 | 0 | 63% (49–77) | 98% | 18/18 | 81% | +18 pp (+2 to +35) |
| kimi-k3 | 18/18 | 0 | 54% (37–73) | 96% | 18/18 | 93% | +38 pp (+22 to +55) |

## Default: share of applicable apps that pass each harder stress

| Model | recover | garbage | partial | long | narrow | motion | a11y | announce |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| claude-opus-5.5 | 53% | 60% | 83% | 58% | 72% | 100% | 78% | 100% |
| grok-4.7 | 73% | 33% | 0% | 0% | 100% | 78% | 100% | 83% |
| muse-wonder | 73% | 67% | 0% | 33% | 94% | 94% | 72% | 94% |
| gpt-6.1-sol | 100% | 40% | 0% | 0% | 72% | 83% | 0% | 100% |
| gpt-6-astra | 100% | 67% | 0% | 25% | 72% | 89% | 0% | 100% |
| kimi-k3 | 0% | 33% | 0% | 8% | 89% | 100% | 56% | 56% |

## Instructed: share of applicable apps that pass each harder stress

| Model | recover | garbage | partial | long | narrow | motion | a11y | announce |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| claude-opus-5.5 | 100% | 100% | 100% | 100% | 94% | 78% | 100% | 100% |
| grok-4.7 | 100% | 100% | — | 100% | 100% | 100% | 100% | 100% |
| muse-wonder | 100% | 87% | 100% | 92% | 100% | 94% | 89% | 100% |
| gpt-6.1-sol | 87% | 87% | 100% | 92% | 100% | 89% | 28% | 100% |
| gpt-6-astra | 87% | 100% | 100% | 100% | 94% | 89% | 6% | 100% |
| kimi-k3 | 93% | 80% | 67% | 100% | 94% | 94% | 94% | 100% |

## Completed-attempt build time

Median minutes for the accepted generation attempt only. Failed attempts and retry backoff are excluded. Access paths, load and browser setup vary, so this is descriptive elapsed time rather than a model-only speed or cost comparison.

| Model | Default | Instructed |
|---|---:|---:|
| claude-opus-5.5 | 1.2 | 2.5 |
| grok-4.7 | 4.1 | 15.3 |
| muse-wonder | 1.2 | 1.6 |
| gpt-6.1-sol | 4.5 | 6.3 |
| gpt-6-astra | 3.2 | 4.8 |
| kimi-k3 | 0.4 | 1.5 |

## Limits

- Instruction condition: “Make it production quality: it should hold up under slow or failing requests, missing or very long data, small screens, and keyboard and screen-reader use.”
- Differences use only the same task and repetition in both conditions. Rows with fewer matched pairs than apps are provisional.
- Disposable-browser instructions changed during generation, and earlier completed apps were retained. Differences are descriptive; this prevents clean causal attribution to the production-quality instruction. See ISOLATION-AUDIT.md.
- All runs use one agent harness. A model's access path and reasoning settings can still affect results, so no difference here is a claim about the model alone.
- No human agreement rate has been measured. The checks are proxies: the keyboard check detects a style change rather than proving focus is visible, zoom uses a smaller viewport rather than browser text scaling, and layout checks do not establish usability.
