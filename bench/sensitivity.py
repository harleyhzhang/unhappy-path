"""Does the model order depend on any one rule? Drop each harder stress in turn and re-rank.
Usage: python3 bench/sensitivity.py
"""
import collections, json, pathlib, statistics
ROOT = pathlib.Path(__file__).resolve().parents[1]
HEAD = ['recover', 'garbage', 'partial', 'long', 'narrow', 'motion', 'a11y', 'announce']
dev = {p.name for p in (ROOT / 'tasks').iterdir() if p.is_dir() and json.loads((p / 'task.json').read_text()).get('set', 'dev') == 'heldout'}
rows = collections.defaultdict(list)
for p in (ROOT / 'runs-budget').glob('*/grade.json'):
    m = json.loads((p.parent / 'meta.json').read_text()); g = json.loads(p.read_text())
    if m['task'] not in dev: continue
    b = collections.defaultdict(list)
    for s, v in g['pass'].items(): b['partial' if s.startswith('partial') else s].append(float(v and g['gate']))
    rows[m['model'], m['condition']].append({s: statistics.mean(v) for s, v in b.items()})
def score(model, cond, drop=()):
    return statistics.mean(statistics.mean([v for s, v in app.items() if s in HEAD and s not in drop] or [0]) for app in rows[model, cond])
L = ['# Sensitivity: does the order depend on one rule?', '',
     'Budgeted extension artifacts. Each column removes one harder stress from the score and shows each model\'s rank (1 is best) and score. Motion and garbage are the two rules a reasonable person could set differently; the last column drops both.', '']
for cond, label, need in (('default', 'Default', 18), ('told', 'Instructed', 18)):
    models = [m for (m, c), v in rows.items() if c == cond and len(v) == need]
    cols = [('all eight', ())] + [(f'no {s}', (s,)) for s in HEAD] + [('no motion or garbage', ('motion', 'garbage'))]
    table = {name: {m: score(m, cond, drop) for m in models} for name, drop in cols}
    order = sorted(models, key=lambda m: -table['all eight'][m])
    L += [f'## {label} ({len(models)} models with all {need} apps)', '', '| Model | ' + ' | '.join(n for n, _ in cols) + ' |', '|---|' + '---:|' * len(cols)]
    for m in order:
        cells = []
        for name, _ in cols:
            rank = 1 + sum(table[name][o] > table[name][m] + 1e-9 for o in models)
            cells.append(f'{rank} ({100 * table[name][m]:.0f}%)')
        L.append(f'| {m} | ' + ' | '.join(cells) + ' |')
    L.append('')
(ROOT / 'BUDGET-SENSITIVITY.md').write_text('\n'.join(L)); print('\n'.join(L))
