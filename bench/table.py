# Summary tables from graded runs.
# Usage: python3 bench/table.py [--dir runs] [--md]
import json, glob, sys, collections
d = sys.argv[sys.argv.index('--dir') + 1] if '--dir' in sys.argv else 'runs'
# Headline = stresses that at least one model failed more than 10% of the time in round 2.
# Fixed on November 16, 2026, before the three later models were run.
HEAD = ['recover', 'garbage', 'partial', 'long', 'narrow', 'motion', 'a11y', 'announce']
BASE = ['slow', 'failed', 'empty', 'zoom', 'spacing', 'keyboard', 'stale', 'double', 'failsave', 'invalid']
group = lambda s: 'partial' if s.startswith('partial') else s
rows = [(json.load(open(f.replace('grade.json', 'meta.json'))), json.load(open(f))) for f in glob.glob(f'{d}/*/grade.json')]
def summarise(rs):
    t = collections.defaultdict(lambda: [0, 0]); byrun = collections.defaultdict(lambda: [0, 0])
    for m, g in rs:
        if not g['gate']: continue
        for s, v in g['pass'].items():
            k = group(s); t[k][0] += v; t[k][1] += 1
            blk = 'HEAD' if k in HEAD else 'BASE'; t[blk][0] += v; t[blk][1] += 1
            if k in HEAD: byrun[m['run']][0] += v; byrun[m['run']][1] += 1
    t['runs'] = [round(100 * a / b) for r, (a, b) in sorted(byrun.items())]
    t['apps'] = len(rs); t['gated'] = sum(1 for m, g in rs if g['gate'])
    t['mins'] = round(sum(m['seconds'] for m, g in rs) / max(1, len(rs)) / 60, 1)
    return t
pct = lambda x: '-' if not x[1] else '%d%%' % round(100 * x[0] / x[1])
frac = lambda x: '-' if not x[1] else '%d/%d' % tuple(x)
conds = sorted({m['condition'] for m, g in rows})
out = {}
for c in conds:
    models = sorted({m['model'] for m, g in rows if m['condition'] == c})
    tab = {mo: summarise([(m, g) for m, g in rows if m['model'] == mo and m['condition'] == c]) for mo in models}
    out[c] = {mo: {k: v for k, v in t.items()} for mo, t in tab.items()}
    order = sorted(models, key=lambda mo: -tab[mo]['HEAD'][0] / max(1, tab[mo]['HEAD'][1]))
    print(f'\n== condition: {c} ==')
    print('%-10s' % '' + ''.join('%-17s' % m for m in order))
    print('%-10s' % 'apps' + ''.join('%-17s' % ('%d (%d work)' % (tab[m]['apps'], tab[m]['gated'])) for m in order))
    print('%-10s' % 'HEADLINE' + ''.join('%-17s' % (pct(tab[m]['HEAD']) + ' ' + frac(tab[m]['HEAD'])) for m in order))
    print('%-10s' % ' by run' + ''.join('%-17s' % tab[m]['runs'] for m in order))
    for s in HEAD: print('%-10s' % (' ' + s) + ''.join('%-17s' % (frac(tab[m][s]) + ' ' + pct(tab[m][s])) for m in order))
    print('%-10s' % 'STAKES' + ''.join('%-17s' % (pct(tab[m]['BASE']) + ' ' + frac(tab[m]['BASE'])) for m in order))
    for s in BASE: print('%-10s' % (' ' + s) + ''.join('%-17s' % (frac(tab[m][s]) + ' ' + pct(tab[m][s])) for m in order))
    print('%-10s' % 'min/app' + ''.join('%-17s' % tab[m]['mins'] for m in order))
json.dump(out, open(f'{d}/summary.json', 'w'), indent=1)
