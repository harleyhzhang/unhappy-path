"""Round 3 (development tasks) and held-out reports.
Compares only matched task sets; a failed ordinary-function gate earns zero.
Usage: python3 bench/analysis.py
"""
import argparse, collections, json, pathlib, random, statistics
parser = argparse.ArgumentParser()
parser.add_argument("--dir", default="runs-budget", choices=["runs-isolated", "runs-budget"])
parser.add_argument("--phase", choices=["final", "interim"], default="final")
args = parser.parse_args()
prefix = "BUDGET" if args.dir == "runs-budget" else "ISOLATED"
report_name = prefix + ("-INTERIM.md" if args.phase == "interim" else ".md")
ROOT = pathlib.Path(__file__).resolve().parents[1]
MODELS = ['claude-fable-5.2', 'claude-opus-5.5', 'grok-4.7', 'muse-wonder', 'gpt-6.1-sol', 'gpt-6-astra', 'kimi-k3']
from metrics import HEAD, bins, score, mean, interval, task_mean
SETS = collections.defaultdict(list)
for p in sorted((ROOT / 'tasks').iterdir()):
    if p.is_dir(): SETS[json.loads((p / 'task.json').read_text()).get('set', 'dev')].append(p.name)
data = {}
metadata = {}
for p in (ROOT / args.dir).glob('*/grade-interim.json' if args.phase == 'interim' else '*/grade.json'):
    m = json.loads((p.parent / 'meta.json').read_text())
    data[m['model'], m['condition'], m['task'], m['run']] = json.loads(p.read_text())
    metadata[m['model'], m['condition'], m['task'], m['run']] = m
group = lambda s: 'partial' if s.startswith('partial') else s

def spearman(a, b):
    def rank(v):
        order = sorted(range(len(v)), key=lambda i: v[i]); r = [0.0] * len(v); i = 0
        while i < len(order):
            j = i
            while j + 1 < len(order) and v[order[j + 1]] == v[order[i]]: j += 1
            for k in range(i, j + 1): r[order[k]] = (i + j) / 2
            i = j + 1
        return r
    ra, rb = rank(a), rank(b); ma, mb = mean(ra), mean(rb)
    den = (sum((x - ma) ** 2 for x in ra) * sum((y - mb) ** 2 for y in rb)) ** 0.5
    return sum((x - ma) * (y - mb) for x, y in zip(ra, rb)) / den if den else float('nan')
pc = lambda x: '—' if x != x else f'{100 * x:.0f}%'
ci = lambda iv, pp=False: '' if not iv else (f' ({100 * iv[0]:+.0f} to {100 * iv[1]:+.0f})' if pp else f' ({100 * iv[0]:.0f}–{100 * iv[1]:.0f})')

def report(name, title, intro):
    tasks = SETS[name]; n_full = len(tasks) * 3
    L = [f'# {title}', '', *intro, '',
         'Scores give equal weight to each task and each applicable stress category. Both partial-failure directions share one category. An app that fails the ordinary-function gate earns zero. Brackets are 95% intervals from resampling whole tasks.', '',
         '## Overall', '',
         '| Model | Default artifacts | Default gate failures | Harder stresses | Table stakes | Matched pairs | Instructed harder stresses | Instructed minus default |', '|---|---:|---:|---:|---:|---:|---:|---:|']
    summary = {}
    for model in MODELS:
        keys = [(t, n) for t in tasks for n in (1, 2, 3)]
        base = {t: [score(data[model, 'default', t, n]) for n in (1, 2, 3) if (model, 'default', t, n) in data] for t in tasks}
        flat = [x for v in base.values() for x in v]
        if not flat: continue
        stakes = [score(data[model, 'default', t, n], False) for t, n in keys if (model, 'default', t, n) in data]
        gates = sum(1 for t, n in keys if (model, 'default', t, n) in data and not data[model, 'default', t, n].get('gate'))
        pairs = {t: [(score(data[model, 'default', t, n]), score(data[model, 'told', t, n])) for n in (1, 2, 3) if (model, 'default', t, n) in data and (model, 'told', t, n) in data] for t in tasks}
        pf = [p for v in pairs.values() for p in v]
        delta = {t: [b - a for a, b in v] for t, v in pairs.items()}
        summary[model] = dict(default=task_mean(base), told=task_mean({t: [b for a, b in v] for t, v in pairs.items()}) if pf else None, apps=len(flat), pairs=len(pf))
        L.append(f'| {model} | {len(flat)}/{n_full} | {gates} | {pc(task_mean(base))}{ci(interval(base))} | {pc(mean(stakes))} | {len(pf)}/{n_full} | ' +
                 (f'{pc(task_mean({t: [b for a, b in v] for t, v in pairs.items()}))} | {100 * task_mean(delta):+.0f} pp{ci(interval(delta), True)} |' if pf else '— | — |'))
    if name == 'heldout':
        L += ['', '## Agent completion at artifact capture', '', 'Agent completion is separate from whether the captured application passes its browser gate. Deadline artifacts are included, with zero for a compile or ordinary-function failure.', '', '| Model | Default finished / captured | Instructed finished / captured | Instructed deadline artifacts |', '|---|---:|---:|---:|']
        for model in MODELS:
            if model not in summary: continue
            groups = [[m for (mo,c,t,n),m in metadata.items() if mo==model and c==cond and t in tasks] for cond in ['default','told']]
            cells = [f'{sum(bool(m.get("generation_finished",m.get("ok"))) for m in ms)}/{len(ms)}' for ms in groups]
            L.append(f'| {model} | ' + ' | '.join(cells) + f' | {sum(m.get("generation_status")=="deadline" for m in groups[1])} |')
    for cond, label in (('default', 'Default'), ('told', 'Instructed')):
        L += ['', f'## {label}: pass rates by harder stress', '',
              'Partial averages the two failure directions per app; other entries are the share passing the category.', '', '| Model | ' + ' | '.join(HEAD) + ' |', '|---|' + '---:|' * len(HEAD)]
        for model in MODELS:
            if model not in summary: continue
            cell = collections.defaultdict(list)
            for t in tasks:
                for n in (1, 2, 3):
                    g = data.get((model, cond, t, n))
                    if g:
                        for s, v in bins(g).items(): cell[s].append(v)
            if cell: L.append(f'| {model} | ' + ' | '.join(pc(mean(cell[s])) if cell[s] else '—' for s in HEAD) + ' |')
    return L, summary

note = ['', '## Limits', '',
        '- Instruction condition: “Make it production quality: it should hold up under slow or failing requests, missing or very long data, small screens, and keyboard and screen-reader use.”',
        '- Differences use only the same task and repetition in both conditions. Rows with fewer matched pairs than apps are provisional.',
        '- Disposable-browser instructions changed during generation, and earlier completed apps were retained. Differences are descriptive; this prevents clean causal attribution to the production-quality instruction. See ISOLATION-AUDIT.md.',
        '- All runs use one agent harness. A model\'s access path and reasoning settings can still affect results, so no difference here is a claim about the model alone.',
        '- The ordinary-function gate checks scripted content and flows, not every field, date format or business rule. Announcement checks inspect structural exposure rather than listening to a screen reader.',
        '- No human agreement rate has been measured. The checks are proxies: the keyboard check detects a style change rather than proving focus is visible, zoom uses a smaller viewport rather than browser text scaling, and layout checks do not establish usability.']
L, dev = report('dev', 'Round 3: seven models and the instruction comparison',
                ['The harder-stress categories were chosen after seeing the first four models on these tasks, so this is not a confirmatory leaderboard; the held-out round (HELDOUT.md) is the check.'])
L += note + ['- Attempts interrupted by access limits were retried. Earlier attempts in this round were not all retained, so it cannot give an unbiased fixed-budget success rate.']
if dev: (ROOT / 'ISOLATED-DEV.md').write_text('\n'.join(L) + '\n')
if SETS['heldout']:
    L, held = report('heldout', 'Budgeted artifact replay: six tasks and seven models' if args.dir == 'runs-budget' else 'Isolated replay: six tasks and six models',
                     (['Repaired cohort. See BUDGET-PROTOCOL.md. Applications are captured at agent completion or the nominal 20-minute deadline; agent completion is reported separately. Existing preserved sources and one annotated replacement are used, so this is not an unbiased first-attempt success or confirmatory study. Fable 5.2 was generated on November 21, after the other six models had been scored, through a direct account route at standard speed and medium effort; the task set, capture rule and grading code were unchanged. Two starting conditions differed for Fable: its template had no installed dependencies, so each agent installed the locked versions itself (which also lengthens its elapsed times), and all 36 of its runs carried the host disposable-browser note that most other default runs predate. See BUDGET-PROTOCOL.md.'] if args.dir == 'runs-budget' else ['Filesystem-isolated replay of the six extension tasks. See ISOLATION-AUDIT.md and HELDOUT-PROTOCOL.md. Earlier exposed runs are excluded. Scoring retains the documented progress-bar and inoperable-control corrections.']))
    if held:
        both = [m for m in MODELS if m in held and m in dev and held[m]['apps'] == len(SETS['heldout']) * 3]
        complete = all(m in held and held[m]['apps'] == len(SETS['heldout']) * 3 and held[m]['pairs'] == len(SETS['heldout']) * 3 for m in MODELS if m != 'claude-fable-5.2' or args.dir == 'runs-budget')
        if args.phase == 'interim': L.insert(2, '**DIAGNOSTIC ONLY — collected alongside generation; final scores require the quiet replay.**\n')
        if not complete: L.insert(2, '**INCOMPLETE — counts below show the graded apps currently available.**\n')
        if dev:
            L += ['', '## Do the round 3 findings hold?', '',
                  f'- Model order on harder stresses, default condition, round 3 against held-out: Spearman {spearman([dev[m]["default"] for m in both], [held[m]["default"] for m in both]):.2f} across {len(both)} models.']
            t = [m for m in both if held[m]['pairs'] == len(SETS['heldout']) * 3 and dev[m]['pairs'] == len(SETS['dev']) * 3]
            if t: L += [f'- Same for the instructed condition: Spearman {spearman([dev[m]["told"] for m in t], [held[m]["told"] for m in t]):.2f} across {len(t)} models.',
                        f'- Models whose harder-stress score rose with the instruction: {sum(held[m]["told"] > held[m]["default"] for m in t)} of {len(t)}.']
            L += ['', '| Model | Round 3 default | Held-out default | Round 3 instructed | Held-out instructed |', '|---|---:|---:|---:|---:|']
            for m in both: L.append(f'| {m} | {pc(dev[m]["default"])} | {pc(held[m]["default"])} | {pc(dev[m]["told"]) if dev[m]["told"] is not None else "—"} | {pc(held[m]["told"]) if held[m]["told"] is not None else "—"} |')
        L += ['', '## Captured-attempt elapsed time', '',
              'Median minutes for the selected captured attempt. Deadline captures include the full nominal 20 minutes; discarded attempts and retry backoff are excluded. Access paths, load and browser setup vary, so this is descriptive elapsed time rather than a model-only speed or cost comparison.', '',
              '| Model | Default | Instructed |', '|---|---:|---:|']
        for model in MODELS:
            if model not in held: continue
            cells = []
            for cond in ['default', 'told']:
                values = [m['seconds'] / 60 for (mo, c, t, n), m in metadata.items() if mo == model and c == cond and t in SETS['heldout']]
                cells.append(f'{statistics.median(values):.1f}' if values else '—')
            L.append(f'| {model} | ' + ' | '.join(cells) + ' |')
        (ROOT / report_name).write_text('\n'.join(L + note) + '\n'); print('\n'.join(L))
