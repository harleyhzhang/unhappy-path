# Sensitivity: does the order depend on one rule?

**INVALIDATED FOR MODEL COMPARISON — November 19 audit found successful reads of grading code and hidden fixtures by benchmark builders. Retained as historical exploratory output. See ISOLATION-AUDIT.md.**
Round 3 tasks. Each column removes one harder stress from the score and shows each model's rank (1 is best) and score. Motion and garbage are the two rules a reasonable person could set differently; the last column drops both.

## Default (7 models with all 36 apps)

| Model | all eight | no recover | no garbage | no partial | no long | no narrow | no motion | no a11y | no announce | no motion or garbage |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| claude-fable-5.2 | 1 (91%) | 1 (89%) | 1 (92%) | 1 (91%) | 1 (93%) | 1 (90%) | 1 (92%) | 1 (92%) | 1 (89%) | 1 (93%) |
| claude-opus-5.5 | 2 (80%) | 2 (77%) | 2 (87%) | 2 (79%) | 3 (79%) | 2 (77%) | 2 (84%) | 2 (82%) | 2 (77%) | 2 (92%) |
| grok-4.7 | 3 (75%) | 3 (75%) | 3 (80%) | 3 (78%) | 2 (80%) | 3 (72%) | 3 (74%) | 3 (73%) | 3 (72%) | 3 (79%) |
| muse-wonder | 4 (61%) | 4 (56%) | 4 (62%) | 4 (63%) | 4 (65%) | 4 (55%) | 4 (60%) | 4 (66%) | 4 (56%) | 4 (61%) |
| gpt-6-astra | 5 (51%) | 6 (43%) | 6 (50%) | 5 (53%) | 5 (54%) | 5 (49%) | 5 (50%) | 6 (60%) | 6 (46%) | 5 (49%) |
| gpt-6.1-sol | 6 (51%) | 7 (43%) | 5 (51%) | 6 (53%) | 6 (54%) | 6 (49%) | 6 (48%) | 5 (60%) | 5 (47%) | 6 (48%) |
| kimi-k3 | 7 (44%) | 5 (49%) | 7 (46%) | 7 (45%) | 7 (48%) | 7 (41%) | 7 (35%) | 7 (42%) | 7 (43%) | 7 (36%) |

## Instructed (6 models with all 36 apps)

| Model | all eight | no recover | no garbage | no partial | no long | no narrow | no motion | no a11y | no announce | no motion or garbage |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| grok-4.7 | 1 (98%) | 1 (99%) | 1 (98%) | 1 (98%) | 1 (98%) | 1 (98%) | 2 (98%) | 2 (98%) | 1 (98%) | 2 (98%) |
| claude-opus-5.5 | 2 (98%) | 2 (98%) | 2 (98%) | 2 (98%) | 2 (98%) | 2 (98%) | 1 (100%) | 1 (98%) | 2 (98%) | 1 (99%) |
| muse-wonder | 3 (90%) | 3 (89%) | 3 (94%) | 3 (90%) | 3 (91%) | 3 (89%) | 3 (89%) | 5 (91%) | 3 (89%) | 3 (94%) |
| kimi-k3 | 4 (86%) | 4 (84%) | 4 (89%) | 4 (86%) | 4 (87%) | 4 (85%) | 4 (85%) | 6 (86%) | 4 (84%) | 4 (88%) |
| gpt-6-astra | 5 (82%) | 5 (81%) | 5 (80%) | 5 (81%) | 5 (80%) | 5 (81%) | 5 (80%) | 3 (96%) | 5 (79%) | 5 (77%) |
| gpt-6.1-sol | 6 (81%) | 6 (79%) | 6 (78%) | 6 (80%) | 6 (78%) | 6 (80%) | 6 (79%) | 4 (95%) | 6 (77%) | 6 (76%) |
