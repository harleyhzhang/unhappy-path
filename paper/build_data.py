"""Collects every number used by the write-up, figures and site into paper/data.json.
Reads only the exported CSVs and the per-run grade/meta files; computes with bench/metrics.py."""
import collections, csv, json, pathlib, statistics, sys
R = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(R / 'bench'))
from metrics import HEAD, bins, score, mean, interval, task_mean

MODELS = ['claude-fable-5.2', 'claude-opus-5.5', 'muse-wonder', 'grok-4.7', 'gpt-6-astra', 'gpt-6.1-sol', 'kimi-k3']
NAMES = {'claude-fable-5.2': 'Claude Fable 5.2', 'claude-opus-5.5': 'Claude Opus 5.5', 'muse-wonder': 'Muse Wonder', 'grok-4.7': 'Grok 4.7',
         'gpt-6-astra': 'GPT-6 Astra', 'gpt-6.1-sol': 'GPT-6.1 Sol', 'kimi-k3': 'Kimi K3'}
TASKS = ['releases', 'account', 'event', 'products', 'invite', 'workspace']
CONDS = ['default', 'told']
STAKES = ['slow', 'failed', 'empty', 'zoom', 'spacing', 'keyboard', 'stale', 'double', 'failsave', 'invalid']
D = R / 'runs-budget'
grade, meta = {}, {}
for m in MODELS:
    for c in CONDS:
        for t in TASKS:
            for n in (1, 2, 3):
                p = D / f'{t}__{m}__{c}__{n}'
                grade[m, c, t, n] = json.loads((p / 'grade.json').read_text())
                meta[m, c, t, n] = json.loads((p / 'meta.json').read_text())
r2 = lambda x: None if x is None else round(x, 6)
out = {'models': [{'id': m, 'name': NAMES[m]} for m in MODELS], 'tasks': TASKS, 'harder': HEAD, 'stakes': STAKES,
       'counts': {'apps': len(grade), 'gate_pass': sum(bool(g['gate']) for g in grade.values()),
                  'finished': sum(bool(x.get('generation_finished', x.get('ok'))) for x in meta.values()),
                  'deadline': sum(x.get('generation_status') == 'deadline' for x in meta.values()),
                  'verdicts': sum(1 for _ in csv.DictReader((R / 'artifacts-budget/outcomes.csv').open()))}}
overall, cats, per_task, apps, axe, runs = {}, {}, {}, {}, {}, []
for m in MODELS:
    o = {}
    for c in CONDS:
        by = {t: [score(grade[m, c, t, n]) for n in (1, 2, 3)] for t in TASKS}
        st = {t: [score(grade[m, c, t, n], False) for n in (1, 2, 3)] for t in TASKS}
        iv = interval(by)
        secs = [meta[m, c, t, n]['seconds'] for t in TASKS for n in (1, 2, 3)]
        o[c] = {'harder': r2(task_mean(by)), 'lo': r2(iv[0]), 'hi': r2(iv[1]), 'stakes': r2(task_mean(st)),
                'gate_fail': sum(not grade[m, c, t, n]['gate'] for t in TASKS for n in (1, 2, 3)),
                'median_min': round(statistics.median(secs) / 60, 1),
                'deadline': sum(meta[m, c, t, n].get('generation_status') == 'deadline' for t in TASKS for n in (1, 2, 3))}
        per_task[f'{m}|{c}'] = {t: r2(mean(by[t])) for t in TASKS}
        apps[f'{m}|{c}'] = [r2(x) for t in TASKS for x in by[t]]
        b = collections.defaultdict(list)
        for t in TASKS:
            for n in (1, 2, 3):
                for k, v in bins(grade[m, c, t, n]).items(): b[k].append(v)
        cats[f'{m}|{c}'] = {k: r2(mean(v)) for k, v in sorted(b.items())}
        a = collections.Counter(); bad = 0
        for t in TASKS:
            for n in (1, 2, 3):
                ids = {v['id'] for v in grade[m, c, t, n].get('evidence', {}).get('axe') or []}
                bad += bool(ids)
                for i in ids: a[i] += 1
        axe[f'{m}|{c}'] = {'apps_with_violations': bad, 'rules': dict(a)}
    delta = {t: [score(grade[m, 'told', t, n]) - score(grade[m, 'default', t, n]) for n in (1, 2, 3)] for t in TASKS}
    iv = interval(delta)
    o['delta'] = {'mean': r2(task_mean(delta)), 'lo': r2(iv[0]), 'hi': r2(iv[1])}
    overall[m] = o
for (m, c, t, n), g in grade.items():
    x = meta[m, c, t, n]
    failed = {k: [name for name, ok in v.items() if not ok] for k, v in (g.get('checks') or {}).items() if not all(v.values())}
    runs.append({'id': f'{t}__{m}__{c}__{n}', 'model': m, 'cond': c, 'task': t, 'rep': n, 'gate': bool(g['gate']),
                 'harder': r2(score(g)), 'stakes': r2(score(g, False)), 'pass': {k: bool(v and g['gate']) for k, v in g['pass'].items()},
                 'failed_checks': failed, 'seconds': x['seconds'], 'status': x.get('generation_status')})
# rank stability: drop one harder category at a time
def without(drop, c):
    res = {}
    for m in MODELS:
        by = {}
        for t in TASKS:
            by[t] = []
            for n in (1, 2, 3):
                v = [x for k, x in bins(grade[m, c, t, n]).items() if k in HEAD and k not in drop]
                by[t].append(mean(v))
        res[m] = task_mean(by)
    order = sorted(MODELS, key=lambda m: -res[m])
    return {m: {'rank': order.index(m) + 1, 'score': r2(res[m])} for m in MODELS}
out['sensitivity'] = {c: {('all' if not d else 'no ' + '+'.join(d)): without(d, c) for d in [(), *[(h,) for h in HEAD], ('motion', 'garbage')]} for c in CONDS}
out.update(overall=overall, categories=cats, per_task=per_task, apps=apps, axe=axe, runs=runs)
(R / 'paper').mkdir(exist_ok=True)
cs = json.loads((R / 'artifacts-confirm/summary.json').read_text())
cs['verdicts'] = sum(1 for _ in csv.DictReader((R / 'artifacts-confirm/outcomes.csv').open()))
out['confirm'] = cs
(R / 'paper/data.json').write_text(json.dumps(out, indent=1) + '\n')
# cross-check against the published report table
rep = (R / 'BUDGET.md').read_text()
for m in MODELS:
    line = next(l for l in rep.splitlines() if l.startswith('| ' + m + ' |'))
    assert f"{100 * overall[m]['default']['harder']:.0f}%" in line and f"{100 * overall[m]['told']['harder']:.0f}%" in line, m
print('wrote paper/data.json;', out['counts'])

