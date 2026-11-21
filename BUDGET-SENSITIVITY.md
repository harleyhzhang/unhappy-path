# Sensitivity: does the order depend on one rule?

Budgeted extension artifacts. Each column removes one harder stress from the score and shows each model's rank (1 is best) and score. Motion and garbage are the two rules a reasonable person could set differently; the last column drops both.

## Default (7 models with all 18 apps)

| Model | all eight | no recover | no garbage | no partial | no long | no narrow | no motion | no a11y | no announce | no motion or garbage |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| claude-fable-5.2 | 1 (95%) | 1 (94%) | 1 (95%) | 1 (94%) | 1 (95%) | 1 (94%) | 1 (98%) | 1 (95%) | 1 (94%) | 1 (98%) |
| claude-opus-5.5 | 2 (79%) | 2 (81%) | 2 (81%) | 3 (78%) | 3 (80%) | 2 (80%) | 2 (75%) | 2 (78%) | 2 (75%) | 2 (77%) |
| muse-wonder | 3 (77%) | 3 (78%) | 3 (78%) | 2 (80%) | 2 (81%) | 3 (75%) | 3 (75%) | 3 (78%) | 3 (75%) | 4 (75%) |
| grok-4.7 | 4 (71%) | 4 (70%) | 4 (75%) | 4 (73%) | 4 (77%) | 4 (66%) | 4 (70%) | 6 (66%) | 4 (69%) | 3 (75%) |
| gpt-6-astra | 5 (63%) | 6 (59%) | 5 (63%) | 5 (65%) | 5 (67%) | 5 (63%) | 5 (57%) | 4 (75%) | 5 (56%) | 5 (56%) |
| gpt-6.1-sol | 6 (57%) | 7 (51%) | 6 (59%) | 6 (59%) | 6 (63%) | 6 (54%) | 6 (53%) | 5 (69%) | 7 (49%) | 6 (55%) |
| kimi-k3 | 7 (54%) | 5 (61%) | 7 (57%) | 7 (56%) | 7 (58%) | 7 (49%) | 7 (47%) | 7 (55%) | 6 (54%) | 7 (48%) |

## Instructed (7 models with all 18 apps)

| Model | all eight | no recover | no garbage | no partial | no long | no narrow | no motion | no a11y | no announce | no motion or garbage |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| claude-fable-5.2 | 1 (98%) | 1 (98%) | 1 (98%) | 1 (98%) | 1 (98%) | 1 (98%) | 1 (100%) | 1 (98%) | 1 (98%) | 1 (100%) |
| claude-opus-5.5 | 2 (96%) | 2 (95%) | 4 (95%) | 2 (96%) | 3 (96%) | 2 (96%) | 2 (99%) | 5 (95%) | 2 (95%) | 2 (99%) |
| muse-wonder | 3 (95%) | 3 (95%) | 2 (96%) | 3 (95%) | 2 (96%) | 3 (95%) | 3 (96%) | 3 (97%) | 3 (95%) | 3 (97%) |
| kimi-k3 | 4 (94%) | 4 (93%) | 3 (96%) | 4 (95%) | 4 (93%) | 4 (93%) | 4 (94%) | 6 (94%) | 4 (93%) | 4 (96%) |
| grok-4.7 | 5 (92%) | 5 (91%) | 5 (92%) | 5 (91%) | 5 (92%) | 5 (92%) | 5 (91%) | 7 (92%) | 5 (91%) | 5 (92%) |
| gpt-6.1-sol | 6 (85%) | 6 (83%) | 6 (84%) | 6 (84%) | 6 (84%) | 6 (82%) | 6 (84%) | 4 (95%) | 6 (82%) | 6 (84%) |
| gpt-6-astra | 7 (83%) | 7 (81%) | 7 (81%) | 7 (82%) | 7 (81%) | 7 (80%) | 7 (81%) | 2 (97%) | 7 (79%) | 7 (78%) |
