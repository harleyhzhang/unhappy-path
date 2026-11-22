"""Export measured outcomes without account routes, logs or filesystem paths."""
import argparse, csv, hashlib, json, pathlib
parser=argparse.ArgumentParser();parser.add_argument("--dir",choices=["runs-budget","runs-isolated","runs-confirm"],default="runs-budget");args=parser.parse_args()
ROOT = pathlib.Path(__file__).resolve().parents[1]
rows = []
for p in sorted((ROOT / args.dir).glob('*/grade.json')):
    m = json.loads((p.parent / 'meta.json').read_text())
    g = json.loads(p.read_text())
    t = json.loads((ROOT / 'tasks' / m['task'] / 'task.json').read_text())
    for stress, passed in g.get('pass', {}).items():
        rows.append(dict(task=m['task'], task_set=t.get('set', 'dev'), model=m['model'],
                         condition=m['condition'], repetition=m['run'], gate=bool(g.get('gate')),
                         stress=stress, category='partial' if stress.startswith('partial') else stress,
                         passed=bool(passed), scored_pass=bool(passed and g.get('gate'))))
out = ROOT / {'runs-budget': 'artifacts-budget', 'runs-isolated': 'artifacts-isolated', 'runs-confirm': 'artifacts-confirm'}[args.dir]; out.mkdir(exist_ok=True)
if not rows: raise SystemExit('No isolated outcomes available')
with (out / 'outcomes.csv').open('w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=list(rows[0])); writer.writeheader(); writer.writerows(rows)
files = ['bench/grade.mjs', 'bench/page-probes.mjs', 'bench/verdicts.mjs', 'bench/build-app.mjs', 'bench/static-server.mjs', 'bench/controls.mjs', 'bench/metrics.py', 'bench/analysis.py', 'HELDOUT-PROTOCOL.md', 'BUDGET-PROTOCOL.md', 'bench/run.mjs', 'bench/run-policy.mjs', 'bench/capture-project.mjs', 'bench/migrate-budget.mjs', 'template/AGENTS.md']
files += [str(p.relative_to(ROOT)) for p in sorted((ROOT / 'tasks').glob('*/*')) if p.is_file()]
manifest = {str(p): hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in files}
(out / 'evaluation-fingerprints.json').write_text(json.dumps(manifest, indent=2) + '\n')
builds=[]
for p in sorted((ROOT / args.dir).glob('*/meta.json')):
    m=json.loads(p.read_text())
    builds.append(dict(task=m['task'],model=m['model'],condition=m['condition'],repetition=m['run'],generation_finished=bool(m.get('generation_finished',m.get('ok'))),generation_status=m.get('generation_status','completed'),seconds=m.get('seconds'),replacement=bool(m.get('selection_note'))))
with (out / 'capture-status.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(builds[0]));w.writeheader();w.writerows(builds)
print(f'Exported {len(rows)} stress outcomes; no routes or local paths included.')
