# Week-1 pilot results

**Historical results: the November 19 isolation audit found evaluator exposure in earlier generation runs. These scores must not be treated as a blinded model comparison. See ISOLATION-AUDIT.md and the replacement ISOLATED.md report.**

November 16, 2026. 5 tasks, 4 models, 3 runs each (60 apps), 6 stresses,
default condition (the brief says nothing about robustness). All 60 apps
built and worked under normal conditions.

Share of apps that survived each stress:

| Model | Slow | Failed | Recover | Empty | Long | Narrow | Overall | Minutes per app |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Claude Opus 5.5 | 100% | 100% | 100% | 100% | 93% | 100% | 99% | 0.5 |
| Grok 4.7 | 93% | 93% | 60% | 100% | 33% | 93% | 79% | 2.6 |
| GPT-6.1 Sol | 93% | 100% | 100% | 100% | 13% | 40% | 74% | 4.8 |
| Kimi K3 | 100% | 93% | 7% | 87% | 7% | 67% | 60% | 0.5 |

## Go / no-go

Go, with changes.

- Models differ a lot overall (60% to 99%), so a leaderboard exists.
- **Slow, failed and empty do not separate models.** Every model shows loading,
  error and empty states unprompted almost every time. The original headline
  ("models skip loading states") is false for current models.
- **Recover, long and narrow do separate them.** Whether a failed screen offers
  a working retry ranges from 7% to 100%; surviving long content from 7% to 93%.
- The top model is at the ceiling. The full benchmark needs harder stresses
  (double submit, out-of-order replies, keyboard-only, reduced motion,
  accessibility audit) and tasks with real interaction (forms, search).

## What the pilot taught us about scoring

Four rule bugs were found by looking at screenshots, and each one changed the
ranking. Before the fixes Claude Opus scored 87% and GPT-6.1 Sol 68%.

1. Screen-reader-only labels (1px boxes) were counted as cut-off text.
2. Star ratings drawn with a deliberately clipped overlay were counted as cut-off text.
3. Tap-target size ignored the WCAG 2.5.8 spacing exception.
4. Retry was only attempted on the first of several identical retry buttons.

Known remaining weakness: the long-content rule accepts any table placed in an
inner sideways scroller, even when the result is hard to use. It needs a
usability condition, and the 70-character unbreakable word may be too hostile
to defend.

Consequence: verdicts cannot be trusted without the planned human check, and
that check should be done by someone other than the rule author.

## Method notes

- Harness: Codex CLI, headless, one fresh project per run, workspace-only
  sandbox with local network. No instruction files or user skills loaded.
- Agents could run a dev server but had no guaranteed browser.
- Grading data differs from the sample data the agent develops against.
- One model's runs were split across two access paths after a usage limit;
  path equivalence has not been tested yet.
