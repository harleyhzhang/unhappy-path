# Confirmatory round: results

Six new tasks, seven models, two conditions, three runs: 248 of 252 apps graded. Rules, predictions and deviations are in CONFIRM-PROTOCOL.md; scoring is unchanged from the main run. Brackets are 95% intervals from resampling whole tasks.

**INCOMPLETE — some apps are missing; counts are shown per model.**

## Overall

| Model | Default apps | Instructed apps | Gate failures | Harder stresses, default | Table stakes, default | Harder stresses, instructed | Instructed minus default | Main run, default |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| claude-fable-5.2 | 18/18 | 18/18 | 0 | 96% (90–100) | 100% | 96% (91–99) | +0 pp (-8 to +9) | 95% |
| claude-opus-5.5 | 18/18 | 18/18 | 0 | 80% (78–83) | 100% | 98% (96–100) | +18 pp (+15 to +21) | 79% |
| muse-wonder | 18/18 | 18/18 | 0 | 67% (54–79) | 100% | 95% (91–98) | +28 pp (+16 to +42) | 77% |
| grok-4.7 | 18/18 | 16/18 | 0 | 63% (47–81) | 100% | 81% (71–92) | +18 pp (+1 to +38) | 71% |
| gpt-6-astra | 18/18 | 18/18 | 0 | 55% (45–64) | 97% | 84% (80–87) | +29 pp (+17 to +41) | 63% |
| gpt-6.1-sol | 18/18 | 18/18 | 0 | 47% (31–63) | 94% | 89% (85–94) | +42 pp (+24 to +58) | 57% |
| kimi-k3 | 18/18 | 16/18 | 0 | 52% (31–76) | 100% | 95% (91–99) | +42 pp (+19 to +64) | 54% |

## Default: pass rates by harder stress

| Model | recover | garbage | partial | long | narrow | motion | a11y | announce |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| claude-fable-5.2 | 100% | 87% | 100% | 75% | 94% | 100% | 100% | 100% |
| claude-opus-5.5 | 87% | 47% | 83% | 50% | 94% | 100% | 67% | 100% |
| muse-wonder | 73% | 60% | 0% | 8% | 89% | 94% | 28% | 100% |
| grok-4.7 | 20% | 20% | 0% | 8% | 100% | 100% | 83% | 72% |
| gpt-6-astra | 100% | 47% | 0% | 0% | 89% | 50% | 0% | 94% |
| gpt-6.1-sol | 100% | 33% | 0% | 0% | 44% | 61% | 0% | 78% |
| kimi-k3 | 13% | 13% | 0% | 0% | 67% | 94% | 61% | 67% |

## Instructed: pass rates by harder stress

| Model | recover | garbage | partial | long | narrow | motion | a11y | announce |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| claude-fable-5.2 | 100% | 100% | 100% | 100% | 100% | 72% | 100% | 100% |
| claude-opus-5.5 | 100% | 100% | 100% | 100% | 100% | 89% | 100% | 100% |
| muse-wonder | 100% | 87% | 100% | 92% | 100% | 94% | 89% | 100% |
| grok-4.7 | 77% | 77% | 60% | 80% | 81% | 81% | 75% | 81% |
| gpt-6-astra | 100% | 100% | 100% | 100% | 100% | 100% | 0% | 100% |
| gpt-6.1-sol | 100% | 100% | 100% | 100% | 100% | 94% | 33% | 100% |
| kimi-k3 | 100% | 100% | 100% | 92% | 94% | 81% | 94% | 100% |

## Registered predictions

1. Default model order agrees with the main run (Spearman ≥ 0.6). **Held.** Spearman 0.96 across seven models. (Instructed condition, not a registered prediction: 0.86.)
2. The production sentence raises at least six of seven models. **Held.** 7 of 7 rose. Rises of at least five points: 6 of 7; claude-fable-5.2 +0.1 pp (at its ceiling).
3. Default table stakes ≥ 90% for every model. **Held.** Lowest: gpt-6.1-sol at 94%.
4. Muse Wonder, Grok 4.7, GPT-6 Astra, GPT-6.1 Sol and Kimi K3 each fail partial failure in a majority of default two-request apps. **Held.** muse-wonder 6/6; grok-4.7 6/6; gpt-6-astra 6/6; gpt-6.1-sol 6/6; kimi-k3 6/6. (Not predicted: claude-fable-5.2 0/6; claude-opus-5.5 1/6.)
5. GPT-6 Astra and GPT-6.1 Sol each have a serious or critical accessibility-audit violation in a majority of default apps. **Held.** gpt-6-astra 18/18; gpt-6.1-sol 18/18. (Others: claude-fable-5.2 0/18; claude-opus-5.5 6/18; muse-wonder 13/18; grok-4.7 3/18; kimi-k3 7/18.)

Definitions used for 4 and 5: an app fails partial failure if either failure direction fails or its ordinary-function gate fails; an app has an audit violation if the axe check fails on a built app.

## Agent completion and elapsed time

| Model | Default finished / captured | Instructed finished / captured | Instructed deadline captures | Median minutes, default | Median minutes, instructed |
|---|---:|---:|---:|---:|---:|
| claude-fable-5.2 | 18/18 | 18/18 | 0 | 1.1 | 2.4 |
| claude-opus-5.5 | 18/18 | 18/18 | 0 | 1.0 | 2.6 |
| muse-wonder | 18/18 | 18/18 | 0 | 1.4 | 2.3 |
| grok-4.7 | 18/18 | 5/16 | 11 | 1.0 | 20.0 |
| gpt-6-astra | 18/18 | 18/18 | 0 | 3.0 | 5.9 |
| gpt-6.1-sol | 18/18 | 18/18 | 0 | 4.4 | 7.1 |
| kimi-k3 | 18/18 | 15/16 | 1 | 1.2 | 7.0 |

## Grok 4.7 by route

All 18 default Grok apps and 5 instructed apps came from the original route; the other 11 instructed apps came from the Cursor route after the original route ran out of allowance (deviation 3). Instructed harder-stress mean per app: original route 98% over 5 apps; Cursor route 70% over 11 apps, of which 11 were captured at the 20-minute deadline. Prediction 2 for Grok on original-route pairs only: course run 1 +50 pp, demo run 1 +0 pp, parts run 1 +29 pp, shipments run 1 +29 pp, supplier run 1 +62 pp.

## Missing apps

Four instructed apps are missing: the Cursor route ended them with "Agent turn stopped after repeated resume attempts made no progress" and the runner did not capture an app. Under the protocol they are reported as missing, not rebuilt: course grok-4.7 run 2, parts grok-4.7 run 2, demo kimi-k3 run 1, storefront kimi-k3 run 1.
