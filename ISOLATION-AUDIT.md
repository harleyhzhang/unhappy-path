# Evaluation isolation incident — November 19, 2026

The existing comparisons are unsuitable as a blinded model ranking. A builder
successfully read `bench/grade.mjs`, `bench/page-probes.mjs` and hidden task
fixtures outside its assigned app. The instruction to work inside the app and
the CLI's workspace-write sandbox restricted writes, while permitting reads.

The audit found successful grading-code or fixture-related command candidates
in 20 distinct Grok runs across the existing logs. This count is a conservative
screen, not a complete forensic census; detailed read commands and returned
source establish actual exposure. A command that merely writes an app and
mentions a filename in a string is not evidence of exposure by another model.
Private command evidence is retained under `runs/contamination-audit.private.json`.
Absence from this screen does not prove another run was isolated.

Generation and the queued final evaluation were stopped. Existing logs and
apps are retained for diagnosis. Reported historical scores, correlations and
instruction effects must be treated as compromised for model comparison.

## Repair

Builds run outside the evaluation repository, with an operating-system read
deny on the tree containing grading code, fixtures, scores and previous apps.
Each run also receives its own runtime home; other run directories and session
histories are denied. The agent's tools inherit the operating-system policy.
The coordinator copies each generated app back for grading after generation.
Credentials and account routes remain local and excluded from exports.

Controls must prove that own-project reads and build commands work, evaluator
reads fail, and sibling-run reads fail. The frozen task briefs and scoring
rules are reused for the isolated replay; this is an isolation repair on the
same task families, rather than a claim that the tasks have never been used.

## Other corrections retained

- Determinate progress bars do not count as pending loading.
- Form scenarios that could not find a control are retried independently.
- Grade replays retain their previous raw measurements and code fingerprints.
- A same-agent screenshot second read remains separate from independent human
  validation, which is still outstanding.

The first infrastructure smoke test failed because macOS rejects nested
Seatbelt application. The repaired runner applies filesystem policy once to
Codex and all descendants, disables unrelated app/plugin connectors, and
allows filesystem metadata traversal needed to initialize the runtime while
continuing to deny sibling file contents. Those infrastructure failures are
retained separately from accepted evaluation apps.

## Process interference correction

During the first isolated generation pass, broad `pkill -f vite` cleanup
commands also matched other builders whose project paths contained `invite`.
The outer sandbox initially allowed signals, unlike the original nested CLI
sandbox. This terminated unfinished attempts and disrupted development
servers. The pass was stopped; completed apps are retained, interrupted
attempts remain logged, and the profile now denies signals to other runs
while allowing signals to self and children. A negative signal control is
required before resumption. This is an infrastructure correction rather than
a reason to count interrupted builds as model failures.

## Disposable browser policy update

During generation on November 19, the host's instructions were updated to
require mock keychains for fresh headless Chrome tests and managed browser
cleanup. Playwright already includes the mock-keychain default; the grader
and calibration now specify it explicitly and close browsers in `finally`.
The project template carries the same instructions for subsequent builders.
Active builds from models observed making direct Chrome launches without the
flag were interrupted and retried. Completed earlier builds are retained;
the host-instruction change is recorded as a limitation of the comparison.

## Remaining old-browser cleanup

Four detached headless Chrome groups were traced to this benchmark's command
logs and sent termination signals. Three exited. One older test process
remained in macOS `UNE` state even after a direct privileged SIGKILL; sampling
showed a keychain-related wait. A signal being accepted did not prove exit,
and the earlier claim that all four had closed was corrected. This process
uses a disposable test profile. No keychain reset or host-service restart was
attempted. Its exit remains unverified until a fresh process lookup confirms
it; this does not block the app generation or evaluation queues.

## Instructed Grok timeouts

The first two instructed Grok runs (releases and account, repetition 1)
reached the original 20-minute limit. Their logs and partial projects were
archived before retries. A timeout is recorded as an incomplete attempt,
not a browser-robustness verdict. The existing access/protocol retry policy
still applies, and these results cannot estimate fixed-budget model success.

## Compilation and static-serving boundaries

The primary replay now rebuilds every saved source tree inside a fresh compiler
capsule, rather than trusting a generation-time dist directory. The compiler
cannot read evaluator files, other runtime workspaces, user-home data outside
the Node toolchain, or coordinator environment secrets. An empty ancestor
PostCSS configuration prevents Vite from traversing into host configuration;
project-owned configuration takes precedence. Generation-time compiled output
is retained separately for diagnosis. Static serving refuses links outside
dist and malformed path escapes. Negative canary controls and a real Vite/CSS
build control pass before the primary replay. No extra model calls are used.

SDK run creation timestamps were briefly interpreted as proof of provider
queueing. Source inspection showed that idle prewarmed agents also create queued
placeholder runs, invalidating that inference. The diagnosis was corrected
before changing shared-service settings or cancelling SDK runs. Live stream
message types confirmed continuing generation; reasoning content was not
printed or used as a judge.
