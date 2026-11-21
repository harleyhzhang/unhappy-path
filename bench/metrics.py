"""Pure task-weighted benchmark metrics; no filesystem or report side effects."""
import collections, statistics, random
HEAD = ['recover', 'garbage', 'partial', 'long', 'narrow', 'motion', 'a11y', 'announce']
group = lambda s: 'partial' if s.startswith('partial') else s
def bins(g):
    b = collections.defaultdict(list)
    for s, v in g.get('pass', {}).items(): b[group(s)].append(float(v and g.get('gate', False)))
    return {s: statistics.mean(v) for s, v in b.items()}
def score(g, head=True):
    v = [x for s, x in bins(g).items() if (s in HEAD) == head]
    return statistics.mean(v) if v else 0.0
mean = lambda xs: statistics.mean(xs) if xs else float('nan')

def interval(by_task, seed=7):
    """95% interval for a mean of per-app values, resampling whole tasks (apps within a task are not independent)."""
    tasks = [t for t in by_task if by_task[t]]
    if len(tasks) < 2: return None
    rng = random.Random(seed); out = []
    for _ in range(4000):
        pick = [rng.choice(tasks) for _ in tasks]
        out.append(mean([mean(by_task[t]) for t in pick]))
    out.sort(); return out[100], out[3899]

def task_mean(values):
    return mean([mean(v) for v in values.values() if v])
