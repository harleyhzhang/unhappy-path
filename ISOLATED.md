# Isolated replay: six tasks and six models

**INCOMPLETE — counts below show the graded apps currently available.**

Filesystem-isolated replay of the six extension tasks. See ISOLATION-AUDIT.md and HELDOUT-PROTOCOL.md. Earlier exposed runs are excluded. Scoring retains the documented progress-bar and inoperable-control corrections.

Scores give equal weight to each task and each applicable stress category. Both partial-failure directions share one category. An app that fails the ordinary-function gate earns zero. Brackets are 95% intervals from resampling whole tasks.

## Overall

| Model | Default apps | Gate failures | Harder stresses | Table stakes | Matched pairs | Instructed harder stresses | Change from the instruction |
|---|---:|---:|---:|---:|---:|---:|---:|
| kimi-k3 | 1/18 | 0 | 43% | 100% | 0/18 | — | — |

## Default: share of applicable apps that pass each harder stress

| Model | recover | garbage | partial | long | narrow | motion | a11y | announce |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| kimi-k3 | 0% | 0% | — | 100% | 100% | 100% | 0% | 0% |

## Instructed: share of applicable apps that pass each harder stress

| Model | recover | garbage | partial | long | narrow | motion | a11y | announce |
|---|---:|---:|---:|---:|---:|---:|---:|---:|

## Limits

- Instruction condition: “Make it production quality: it should hold up under slow or failing requests, missing or very long data, small screens, and keyboard and screen-reader use.”
- Changes from the instruction use only the same task and repetition in both conditions. Rows with fewer matched pairs than apps are provisional.
- All runs use one agent harness. A model's access path and reasoning settings can still affect results, so no difference here is a claim about the model alone.
- No human agreement rate has been measured. The checks are proxies: the keyboard check detects a style change rather than proving focus is visible, zoom uses a smaller viewport rather than browser text scaling, and layout checks do not establish usability.
