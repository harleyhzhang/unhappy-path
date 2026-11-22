"""Confirmatory round report (CONFIRM-PROTOCOL.md): scores and the five registered predictions.
Usage: python3 bench/confirm.py [--dir runs-confirm] [--main runs-budget]
Writes CONFIRM.md. Scoring is identical to the main run (bench/metrics.py).
"""
import argparse, collections, json, pathlib, statistics
from metrics import HEAD, bins, score, mean, interval, task_mean
p = argparse.ArgumentParser(); p.add_argument('--dir', default='runs-confirm'); p.add_argument('--main', default='runs-budget'); a = p.parse_args()
ROOT = pathlib.Path(__file__).resolve().parents[1]
MODELS = ['claude-fable-5.2', 'claude-opus-5.5', 'muse-wonder', 'grok-4.7', 'gpt-6-astra', 'gpt-6.1-sol', 'kimi-k3']
SETS = collections.defaultdict(list); KIND = {}
for t in sorted((ROOT / 'tasks').iterdir()):
    if t.is_dir():
        j = json.loads((t / 'task.json').read_text()); SETS[j.get('set', 'dev')].append(t.name); KIND[t.name] = j

def load(d):
    out, meta = {}, {}
    for g in (ROOT / d).glob('*/grade.json'):
        m = json.loads((g.parent / 'meta.json').read_text()); k = (m['model'], m['condition'], m['task'], m['run'])
        out[k] = json.loads(g.read_text()); meta[k] = m
    return out, meta

def summarise(data, tasks):
    s = {}
    for m in MODELS:
        base = {t: [score(data[m, 'default', t, n]) for n in (1, 2, 3) if (m, 'default', t, n) in data] for t in tasks}
        told = {t: [score(data[m, 'told', t, n]) for n in (1, 2, 3) if (m, 'told', t, n) in data] for t in tasks}
        pairs = {t: [score(data[m, 'told', t, n]) - score(data[m, 'default', t, n]) for n in (1, 2, 3) if (m, 'default', t, n) in data and (m, 'told', t, n) in data] for t in tasks}
        stakes = [score(data[m, 'default', t, n], False) for t in tasks for n in (1, 2, 3) if (m, 'default', t, n) in data]
        s[m] = dict(default=task_mean(base), default_ci=interval(base), told=task_mean(told), told_ci=interval(told), delta=task_mean(pairs), delta_ci=interval(pairs),
                    stakes=mean(stakes), apps_d=sum(map(len, base.values())), apps_t=sum(map(len, told.values())), pairs=sum(map(len, pairs.values())),
                    gates=sum(1 for t in tasks for n in (1, 2, 3) if (m, 'default', t, n) in data and not data[m, 'default', t, n].get('gate')))
    return s

def spearman(x, y):
    def rank(v):
        o = sorted(range(len(v)), key=lambda i: v[i]); r = [0.0] * len(v); i = 0
        while i < len(o):
            j = i
            while j + 1 < len(o) and v[o[j + 1]] == v[o[i]]: j += 1
            for k in range(i, j + 1): r[o[k]] = (i + j) / 2
            i = j + 1
        return r
    rx, ry = rank(x), rank(y); mx, my = mean(rx), mean(ry)
    den = (sum((u - mx) ** 2 for u in rx) * sum((v - my) ** 2 for v in ry)) ** 0.5
    return sum((u - mx) * (v - my) for u, v in zip(rx, ry)) / den

pc = lambda x: '—' if x != x else f'{100 * x:.0f}%'
ci = lambda iv, pp=False: '' if not iv else (f' ({100 * iv[0]:+.0f} to {100 * iv[1]:+.0f})' if pp else f' ({100 * iv[0]:.0f}–{100 * iv[1]:.0f})')
data, meta = load(a.dir); main, _ = load(a.main)
tasks = SETS['confirm']; full = len(tasks) * 3
C = summarise(data, tasks); M = summarise(main, SETS['heldout'])
complete = all(C[m]['apps_d'] == full and C[m]['apps_t'] == full for m in MODELS)
L = ['# Confirmatory round: results', '',
     f'Six new tasks, seven models, two conditions, three runs: {sum(C[m]["apps_d"] + C[m]["apps_t"] for m in MODELS)} of {len(MODELS) * full * 2} apps graded. Rules, predictions and deviations are in CONFIRM-PROTOCOL.md; scoring is unchanged from the main run. Brackets are 95% intervals from resampling whole tasks.', '']
if not complete: L += ['**INCOMPLETE — some apps are missing; counts are shown per model.**', '']
L += ['## Overall', '', '| Model | Default apps | Instructed apps | Gate failures | Harder stresses, default | Table stakes, default | Harder stresses, instructed | Instructed minus default | Main run, default |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|']
for m in MODELS:
    c = C[m]; L.append(f'| {m} | {c["apps_d"]}/{full} | {c["apps_t"]}/{full} | {c["gates"]} | {pc(c["default"])}{ci(c["default_ci"])} | {pc(c["stakes"])} | {pc(c["told"])}{ci(c["told_ci"])} | {100 * c["delta"]:+.0f} pp{ci(c["delta_ci"], True)} | {pc(M[m]["default"])} |')
for cond, label in (('default', 'Default'), ('told', 'Instructed')):
    L += ['', f'## {label}: pass rates by harder stress', '', '| Model | ' + ' | '.join(HEAD) + ' |', '|---|' + '---:|' * len(HEAD)]
    for m in MODELS:
        cell = collections.defaultdict(list)
        for t in tasks:
            for n in (1, 2, 3):
                g = data.get((m, cond, t, n))
                if g:
                    for s, v in bins(g).items(): cell[s].append(v)
        L.append(f'| {m} | ' + ' | '.join(pc(mean(cell[s])) if cell[s] else '—' for s in HEAD) + ' |')

# Predictions
rho = spearman([M[m]['default'] for m in MODELS], [C[m]['default'] for m in MODELS])
rho_t = spearman([M[m]['told'] for m in MODELS], [C[m]['told'] for m in MODELS])
raised = [m for m in MODELS if C[m]['told'] > C[m]['default']]
low_stakes = [m for m in MODELS if C[m]['stakes'] < 0.9]
two = [t for t in tasks if KIND[t].get('partial')]
def partial_fail(g): return any(not v for s, v in g['pass'].items() if s.startswith('partial')) or not g.get('gate')
pf = {m: [partial_fail(data[m, 'default', t, n]) for t in two for n in (1, 2, 3) if (m, 'default', t, n) in data] for m in MODELS}
P4 = ['muse-wonder', 'grok-4.7', 'gpt-6-astra', 'gpt-6.1-sol', 'kimi-k3']
ax = {m: [not data[m, 'default', t, n]['pass'].get('a11y', True) for t in tasks for n in (1, 2, 3) if (m, 'default', t, n) in data and data[m, 'default', t, n].get('built')] for m in MODELS}
held = lambda b: '**Held.**' if b else '**Not held.**'
L += ['', '## Registered predictions', '',
      f'1. Default model order agrees with the main run (Spearman ≥ 0.6). {held(rho >= 0.6)} Spearman {rho:.2f} across seven models. (Instructed condition, not a registered prediction: {rho_t:.2f}.)',
      f'2. The production sentence raises at least six of seven models. {held(len(raised) >= 6)} {len(raised)} of 7 rose' + (f'; not raised: {", ".join(m for m in MODELS if m not in raised)}.' if len(raised) < 7 else '.') + ' Rises of at least five points: ' + str(sum(C[m]['told'] - C[m]['default'] >= 0.05 for m in MODELS)) + ' of 7; ' + ', '.join(f'{m} {100 * (C[m]["told"] - C[m]["default"]):+.1f} pp' for m in MODELS if C[m]['told'] - C[m]['default'] < 0.05) + ' (at its ceiling).',
      f'3. Default table stakes ≥ 90% for every model. {held(not low_stakes)} Lowest: {min(MODELS, key=lambda m: C[m]["stakes"])} at {pc(min(C[m]["stakes"] for m in MODELS))}.',
      f'4. Muse Wonder, Grok 4.7, GPT-6 Astra, GPT-6.1 Sol and Kimi K3 each fail partial failure in a majority of default two-request apps. {held(all(sum(pf[m]) * 2 > len(pf[m]) for m in P4))} ' + '; '.join(f'{m} {sum(pf[m])}/{len(pf[m])}' for m in P4) + '. (Not predicted: ' + '; '.join(f'{m} {sum(pf[m])}/{len(pf[m])}' for m in MODELS if m not in P4) + '.)',
      f'5. GPT-6 Astra and GPT-6.1 Sol each have a serious or critical accessibility-audit violation in a majority of default apps. {held(all(sum(ax[m]) * 2 > len(ax[m]) for m in ("gpt-6-astra", "gpt-6.1-sol")))} ' + '; '.join(f'{m} {sum(ax[m])}/{len(ax[m])}' for m in ('gpt-6-astra', 'gpt-6.1-sol')) + '. (Others: ' + '; '.join(f'{m} {sum(ax[m])}/{len(ax[m])}' for m in MODELS if m not in ('gpt-6-astra', 'gpt-6.1-sol')) + '.)',
      '', 'Definitions used for 4 and 5: an app fails partial failure if either failure direction fails or its ordinary-function gate fails; an app has an audit violation if the axe check fails on a built app.']
L += ['', '## Agent completion and elapsed time', '', '| Model | Default finished / captured | Instructed finished / captured | Instructed deadline captures | Median minutes, default | Median minutes, instructed |', '|---|---:|---:|---:|---:|---:|']
for m in MODELS:
    g = {c: [v for (mo, cc, t, n), v in meta.items() if mo == m and cc == c] for c in ('default', 'told')}
    fin = lambda ms: f'{sum(bool(x.get("generation_finished", x.get("ok"))) for x in ms)}/{len(ms)}'
    med = lambda ms: f'{statistics.median(x["seconds"] / 60 for x in ms):.1f}' if ms else '—'
    L.append(f'| {m} | {fin(g["default"])} | {fin(g["told"])} | {sum(x.get("generation_status") == "deadline" for x in g["told"])} | {med(g["default"])} | {med(g["told"])} |')
miss = [f'{t} {m} {c} run {n}' for m in MODELS for c in ('default', 'told') for t in tasks for n in (1, 2, 3) if (m, c, t, n) not in data]
if miss: L += ['', '## Missing apps', '', ', '.join(miss) + '.']
out = dict(apps=sum(C[m]['apps_d'] + C[m]['apps_t'] for m in MODELS), expected=len(MODELS) * full * 2, spearman_default=rho, spearman_told=rho_t,
           models={m: dict(main_default=M[m]['default'], main_told=M[m]['told'], **{k: v for k, v in C[m].items()}) for m in MODELS},
           partial_fail={m: [sum(pf[m]), len(pf[m])] for m in MODELS}, audit_fail_default={m: [sum(ax[m]), len(ax[m])] for m in MODELS})
(ROOT / 'artifacts-confirm').mkdir(exist_ok=True); (ROOT / 'artifacts-confirm/summary.json').write_text(json.dumps(out, indent=1) + '\n')
(ROOT / 'CONFIRM.md').write_text('\n'.join(L) + '\n'); print('\n'.join(L))
