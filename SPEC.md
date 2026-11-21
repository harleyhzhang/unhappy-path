# Unhappy Path

A benchmark that asks one question: **when an AI model builds a web app, does
the app survive real conditions?** Slow networks, failed requests, empty data,
long content, small screens, keyboard-only use.

Historical proposal (v0.4). Task counts, planned experiments and rules below
include superseded plans. See HELDOUT-PROTOCOL.md for the current frozen
protocol and ROUND3.md for exploratory results. Literature comparisons below
are original planning claims and require a fresh source check before publication.

## Why this is new

Existing UI benchmarks score one of three things, almost always on the happy
path (one screen size, instant data, clean content):

| They measure | Examples | Scored by |
| --- | --- | --- |
| Looks like the target | Design2Code, DesignBench, Vision2Web | Screenshot similarity |
| Works when clicked | WebGen-Bench, WebUIProof, FrontendBench | An AI agent clicking through |
| People prefer it | WebDev Arena, Design Arena, UI-Bench | Human votes |

What the closest papers leave open:

- **WebUIProof** tests at a single 1280x800 window; its AI evaluator agrees
  with humans 82-86% of the time.
- **ArtifactsBench** samples three screenshots at fixed intervals and says in
  its own limitations that this misses state-dependent behaviour.
- **Vision2Web** does check three screen sizes, but only for matching a
  supplied mock-up, not for whether the layout breaks.
- **WebGen-Bench** grades appearance with a 1-5 score from GPT-4o.
- None inject faults. None measure loading, error or empty states.

Our two differences: we **break the conditions on purpose**, and we score with
**browser measurements only, no AI judge**.

## How it works

1. **Task.** The model gets a product brief, a fake API description and a short
   list of element labels it must use (so scripts can find the search box, the
   list, the submit button).
2. **Build.** Every model runs in the same open agent harness with the same
   tools, time limit and stack (React + Vite). Three runs per task in the pilot,
   five in the final.
3. **Gate.** A scripted happy-path test runs first. Apps that fail it are
   reported separately, so "broken" is never confused with "fragile".
4. **Stress.** We replay the app while intercepting its network calls and
   changing the browser. The app needs no cooperation; faults are injected
   from outside.
5. **Score.** Each stress is pass/fail by a fixed rule. A model's score is the
   share of stresses its apps survive, overall and per category.

## The stresses and their pass rules

| Stress | What we do | Passes if |
| --- | --- | --- |
| Slow | Delay every API reply 3 s | Screen is not blank; no false "no results" shown; layout shift under 0.1 when data lands |
| Failed | Return a server error | A visible error message appears; no endless spinner after 10 s; no crash |
| Recover | Fail once, then succeed | A retry control exists and works |
| Empty | Return an empty list | An explicit empty message, not a blank area |
| Long | 10x-long strings, 1,000 items | No sideways scroll, no text spilling out of its box, scrolling stays smooth |
| Narrow | 320 px wide screen | No sideways scroll, nothing clipped, tap targets at least 24 px |
| Double submit | Click submit twice during a slow save | Exactly one request is sent |
| Out of order | Make an older search reply arrive last | Screen shows results for the latest query |
| Keyboard | Tab through with no mouse | Every control reachable, focus visibly marked |
| Reduced motion | Turn on the reduced-motion setting | No animations keep running |
| Accessibility | Run the standard axe audit | No serious or critical violations |

## Tasks

40 small apps in five families, eight each: feed/list, search, form, dashboard,
detail page. Each ships with its fake API and happy-path script. Hand-written
and reviewed; kept small enough that most models pass the gate.

## Experiments

- **Main leaderboard:** 7 current models, brief says nothing about
  robustness. This measures what models do by default.
- **Told vs not told:** the same runs with one extra line asking for loading,
  error and empty handling. How much does asking help?
- **Pretty vs robust:** compare our ranking with WebDev Arena's. If they
  disagree, that is the headline.
- **Stretch:** does a written "skill" file help? An August 2026 study found
  web-dev skills slightly lowered task completion; nobody has tested quality.

## Proving the scoring is fair

- Two people hand-check 150 random verdicts; report agreement. Target above
  95%, since rivals report 82-94% for AI judges.
- Publish every rule, every app and every recording so anyone can re-run it.
- Report spread across the three runs, not just averages.

## Out of scope for v1

iPhone and Android apps, visual taste, animation quality, back-end code,
multi-page full-stack apps, ranking tools like v0 or Lovable.

## Plan

| Week | Deliverable |
| --- | --- |
| 1 | Harness, 5 tasks, 4 stresses, 2 models end to end. **Go/no-go: do models actually differ?** |
| 2 | All 40 tasks and all stresses |
| 3 | Full runs, hand-check, analysis |
| 4 | Site live on its domain, paper on arXiv, plain-language post |

Public repository from the first commit.

## Models and access

One harness for every model: the Codex command-line agent run headless
(`codex exec -m <model>`), pointed at the local router. Same tools, same
prompt, same time limit; only the model changes.

Models: GPT-6.1 Sol, GPT-6 Astra, Claude Opus 5.5, Claude Fable 5.2,
Grok 4.7, Kimi K3 and Muse Wonder.

Rules so access does not bend the results:

- The runner keeps a queue per model. On a limit error it retries the job
  later and carries on with other models meanwhile.
- Every run records its date and token counts.
- If a model is reached through a different pathway, we first run 10 tasks on
  both pathways and check the scores match.
- The paper reports what papers normally report: model names, the harness
  (Codex CLI) and the run dates.

Cost is reported as tokens and minutes per run rather than dollars.

## What we take from FrontierSWE

FrontierSWE (frontierswe.com, by Proximal; Rajan Agarwal is one of 21 listed
authors) is the presentation model. It is published as a site and blog post,
not an arXiv paper. Worth copying:

- **Spread, not just averages.** They run 5 trials per task and show mean plus
  worst-to-best. We use 3 runs in the pilot and 5 in the final.
- **Every run is public.** They publish full traces. Ours are better to watch:
  a short screen recording of each app under each stress.
- **A page per task** with its own ranking and background.
- **Score against effort.** Their chart of score vs cost; ours is score vs
  tokens and minutes.
- **One minimal shared harness**, described openly, with its limits stated.
- **Grading the agent cannot touch.** Their checker runs in a separate clean
  container. Ours runs after the build ends, from outside the app, with stress
  scripts the model never sees.
- **Versioning.** A changelog, retiring tasks that every model passes.
- **Citation block and a contribute page.**

One thing they list as future work that we get for free: testing inside a real
product harness (Codex) rather than a lab one.

## Publishing

1. **Site** on its own domain: leaderboard, per-stress breakdown, task pages,
   run recordings, method, changelog, citation.
2. **arXiv paper** (software engineering category, cross-listed to HCI) so
   there is a permanent, citable record. First-time submitters need
   endorsement; a university email speeds it up, otherwise one established
   author must endorse.
3. **Peer-reviewed venue** afterwards as the stronger credential: a workshop
   or a benchmarks track. Deadlines not yet checked.
4. **Plain-language post** linking all three.

Domain: buy once the name is final. Registry lookup on Nov 16 (not registrar
prices): unhappypath.com and .dev are taken; unhappypath.org and .ai,
fragilebench.com and .dev, baddaybench.com showed as unregistered.

## Risks

- **Scooped.** Four related benchmarks appeared in six weeks. Mitigation: ship
  the week-1 pilot result publicly as soon as it is interesting.
- **No spread.** If every model fails or passes the same stresses, there is no
  leaderboard. The week-1 gate exists to catch this.
- **Rule disputes.** "Is that a loading indicator?" Mitigation: rules test
  outcomes (blank screen, false empty message, layout shift), never specific
  designs.
- **Required labels constrain the build.** Standard practice, but stated
  plainly in the paper.

## Open decisions

1. Domain: unhappypath.org (about USD 8 first year, 12 after) or
   unhappypath.ai (about USD 83 a year). Porkbun list prices, Nov 16.
2. Sole author, or bring in a co-author for the hand-check.
3. Who endorses the arXiv submission.
