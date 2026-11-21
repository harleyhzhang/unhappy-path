# Budgeted artifact replay: six tasks and seven models

Repaired cohort. See BUDGET-PROTOCOL.md. Applications are captured at agent completion or the nominal 20-minute deadline; agent completion is reported separately. Existing preserved sources and one annotated replacement are used, so this is not an unbiased first-attempt success or confirmatory study. Fable 5.2 was generated on November 21, after the other six models had been scored, through a direct account route at standard speed and medium effort; the task set, capture rule and grading code were unchanged. Two starting conditions differed for Fable: its template had no installed dependencies, so each agent installed the locked versions itself (which also lengthens its elapsed times), and all 36 of its runs carried the host disposable-browser note that most other default runs predate. See BUDGET-PROTOCOL.md.

Scores give equal weight to each task and each applicable stress category. Both partial-failure directions share one category. An app that fails the ordinary-function gate earns zero. Brackets are 95% intervals from resampling whole tasks.

## Overall

| Model | Default artifacts | Default gate failures | Harder stresses | Table stakes | Matched pairs | Instructed harder stresses | Instructed minus default |
|---|---:|---:|---:|---:|---:|---:|---:|
| claude-fable-5.2 | 18/18 | 0 | 95% (91–98) | 100% | 18/18 | 98% | +4 pp (+1 to +7) |
| claude-opus-5.5 | 18/18 | 0 | 79% (68–89) | 100% | 18/18 | 96% | +17 pp (+7 to +27) |
| grok-4.7 | 18/18 | 0 | 71% (58–85) | 99% | 18/18 | 92% | +21 pp (-3 to +38) |
| muse-wonder | 18/18 | 0 | 77% (64–90) | 100% | 18/18 | 95% | +18 pp (+6 to +31) |
| gpt-6.1-sol | 18/18 | 0 | 57% (48–66) | 97% | 18/18 | 85% | +28 pp (+20 to +35) |
| gpt-6-astra | 18/18 | 0 | 63% (49–77) | 98% | 18/18 | 83% | +20 pp (+5 to +35) |
| kimi-k3 | 18/18 | 0 | 54% (37–73) | 96% | 18/18 | 94% | +39 pp (+22 to +57) |

## Agent completion at artifact capture

Agent completion is separate from whether the captured application passes its browser gate. Deadline artifacts are included, with zero for a compile or ordinary-function failure.

| Model | Default finished / captured | Instructed finished / captured | Instructed deadline artifacts |
|---|---:|---:|---:|
| claude-fable-5.2 | 18/18 | 18/18 | 0 |
| claude-opus-5.5 | 18/18 | 18/18 | 0 |
| grok-4.7 | 18/18 | 9/18 | 9 |
| muse-wonder | 18/18 | 18/18 | 0 |
| gpt-6.1-sol | 18/18 | 18/18 | 0 |
| gpt-6-astra | 18/18 | 18/18 | 0 |
| kimi-k3 | 18/18 | 18/18 | 0 |

## Default: pass rates by harder stress

Partial averages the two failure directions per app; other entries are the share passing the category.

| Model | recover | garbage | partial | long | narrow | motion | a11y | announce |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| claude-fable-5.2 | 100% | 93% | 100% | 92% | 100% | 78% | 94% | 100% |
| claude-opus-5.5 | 53% | 60% | 83% | 58% | 72% | 100% | 78% | 100% |
| grok-4.7 | 73% | 33% | 0% | 0% | 100% | 78% | 100% | 83% |
| muse-wonder | 73% | 67% | 0% | 33% | 94% | 94% | 72% | 94% |
| gpt-6.1-sol | 100% | 40% | 0% | 0% | 72% | 83% | 0% | 100% |
| gpt-6-astra | 100% | 67% | 0% | 25% | 72% | 89% | 0% | 100% |
| kimi-k3 | 0% | 33% | 0% | 8% | 89% | 100% | 56% | 56% |

## Instructed: pass rates by harder stress

Partial averages the two failure directions per app; other entries are the share passing the category.

| Model | recover | garbage | partial | long | narrow | motion | a11y | announce |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| claude-fable-5.2 | 100% | 100% | 100% | 100% | 100% | 89% | 100% | 100% |
| claude-opus-5.5 | 100% | 100% | 100% | 100% | 94% | 78% | 100% | 100% |
| grok-4.7 | 100% | 93% | 100% | 92% | 89% | 94% | 89% | 94% |
| muse-wonder | 100% | 87% | 100% | 92% | 100% | 94% | 89% | 100% |
| gpt-6.1-sol | 100% | 87% | 100% | 92% | 100% | 89% | 28% | 100% |
| gpt-6-astra | 100% | 100% | 100% | 100% | 94% | 89% | 6% | 100% |
| kimi-k3 | 100% | 80% | 67% | 100% | 94% | 94% | 94% | 100% |

## Captured-attempt elapsed time

Median minutes for the selected captured attempt. Deadline captures include the full nominal 20 minutes; discarded attempts and retry backoff are excluded. Access paths, load and browser setup vary, so this is descriptive elapsed time rather than a model-only speed or cost comparison.

| Model | Default | Instructed |
|---|---:|---:|
| claude-fable-5.2 | 1.0 | 3.2 |
| claude-opus-5.5 | 1.2 | 2.5 |
| grok-4.7 | 4.1 | 18.6 |
| muse-wonder | 1.2 | 1.6 |
| gpt-6.1-sol | 4.5 | 6.3 |
| gpt-6-astra | 3.2 | 4.8 |
| kimi-k3 | 0.4 | 1.5 |

## Limits

- Instruction condition: “Make it production quality: it should hold up under slow or failing requests, missing or very long data, small screens, and keyboard and screen-reader use.”
- Differences use only the same task and repetition in both conditions. Rows with fewer matched pairs than apps are provisional.
- Disposable-browser instructions changed during generation, and earlier completed apps were retained. Differences are descriptive; this prevents clean causal attribution to the production-quality instruction. See ISOLATION-AUDIT.md.
- All runs use one agent harness. A model's access path and reasoning settings can still affect results, so no difference here is a claim about the model alone.
- The ordinary-function gate checks scripted content and flows, not every field, date format or business rule. Announcement checks inspect structural exposure rather than listening to a screen reader.
- No human agreement rate has been measured. The checks are proxies: the keyboard check detects a style change rather than proving focus is visible, zoom uses a smaller viewport rather than browser text scaling, and layout checks do not establish usability.
