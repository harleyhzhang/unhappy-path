# Reproducing the results

## Recompute every reported number (no model access needed)

```sh
python3 bench/verify-results.py      # recomputes scores from the per-verdict export
python3 paper/build_data.py          # numbers used by the write-up and site
python3 paper/make_figures.py        # figures, light and dark
node paper/render_png.mjs            # PNG copies of the figures
python3 paper/build_article.py       # paper/index.html preview
python3 site/build.py                # site/dist
```

Inputs: `artifacts-budget/outcomes.csv` (one row per stress verdict),
`artifacts-budget/capture-status.csv` (one row per app) and the per-run
grade files. SHA-256 hashes of the exports are in VALIDATION.md.

## Replay the grading (needs the captured apps)

```sh
npm ci && (cd template && npm ci) && npx playwright install chromium
node bench/grade.mjs --dir runs-budget
python3 bench/analysis.py && python3 bench/sensitivity.py
python3 bench/export-results.py && python3 bench/verify-results.py
```

Captured apps are stored without `node_modules`. Run `npm ci` inside an
app's directory before regrading it; each app carries its lockfile.

## Generate new apps (needs model access and macOS)

```sh
node bench/isolation-check.mjs       # the isolation controls must pass first
node bench/run.mjs --isolate --out runs-new --models <model> \
  --tasks releases,account,event,products,invite,workspace \
  --runs 3 --condition default --capture-on-timeout
node bench/run.mjs --isolate --out runs-new --models <model> \
  --tasks releases,account,event,products,invite,workspace \
  --runs 3 --condition told --capture-on-timeout
```

`routes.local.json` maps each model name to the model identifiers your
agent CLI accepts. `isolation.local.json` names three private paths outside
the checkout; README.md describes them. The runner refuses to start if the
template has no installed dependencies.

## What will not reproduce exactly

Model outputs are not deterministic, so new apps will differ. The grading of
a fixed app is deterministic apart from timing; the final pass regraded a
sample with identical verdicts.

