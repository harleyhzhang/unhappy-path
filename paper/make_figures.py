"""Builds the write-up figures as SVG (light and dark) from paper/data.json and saved run screenshots.
Usage: python3 paper/make_figures.py   (run paper/build_data.py first)"""
import base64, json, pathlib, subprocess, tempfile
R = pathlib.Path(__file__).resolve().parents[1]
D = json.loads((R / 'paper/data.json').read_text())
MODELS = [m['id'] for m in D['models']]; NAME = {m['id']: m['name'] for m in D['models']}
HEAD = D['harder']; STAKES = D['stakes']
LABEL = {'recover': 'Recover', 'garbage': 'Garbage reply', 'partial': 'Partial failure', 'long': 'Long content', 'narrow': 'Narrow screen', 'motion': 'Reduced motion',
         'a11y': 'Accessibility audit', 'announce': 'Announced errors', 'slow': 'Slow', 'failed': 'Failed', 'empty': 'Empty', 'zoom': '200% zoom', 'spacing': 'Text spacing',
         'keyboard': 'Keyboard', 'stale': 'Out-of-order', 'double': 'Double submit', 'failsave': 'Failed save', 'invalid': 'Invalid save'}
LIGHT = dict(BG='#faf9f5', INK='#1f1e1d', MUTE='#87867f', LINE='#d6d4cb', CLAY='#d97757', BLUE='#5b8bbf', GREEN='#6f8a55', PALE='#f0eee6', RED='#b5503a', CARD='#ffffff',
             H0=(214, 120, 96), H1=(240, 238, 230), H2=(134, 168, 110))
DARK = dict(BG='#0a0a0a', INK='#f2f2f2', MUTE='#8f8f8a', LINE='#33332f', CLAY='#e0705a', BLUE='#7aa7d8', GREEN='#8fb06f', PALE='#1a1a18', RED='#e0705a', CARD='#141413',
            H0=(150, 62, 46), H1=(38, 38, 35), H2=(74, 110, 58))
P = dict(LIGHT)
F = "font-family='ui-sans-serif,-apple-system,Helvetica,Arial,sans-serif'"
M = "font-family='ui-monospace,SFMono-Regular,Menlo,monospace'"
esc = lambda s: str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
def svg(w, h, body):
    return (f"<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 {w} {h}' width='{w}' height='{h}'><rect width='{w}' height='{h}' fill='{P['BG']}'/>"
            f"<defs><marker id='a' viewBox='0 0 10 10' refX='9' refY='5' markerWidth='7' markerHeight='7' orient='auto'><path d='M0,0 L10,5 L0,10 z' fill='{P['INK']}'/></marker>"
            f"<marker id='am' viewBox='0 0 10 10' refX='9' refY='5' markerWidth='7' markerHeight='7' orient='auto'><path d='M0,0 L10,5 L0,10 z' fill='{P['MUTE']}'/></marker></defs>{body}</svg>")
def t(x, y, s, size=14, fill=None, anchor='start', weight=400, mono=False):
    return f"<text x='{x}' y='{y}' font-size='{size}' fill='{fill or P['INK']}' text-anchor='{anchor}' font-weight='{weight}' {M if mono else F}>{esc(s)}</text>"
def box(x, y, w, h, fill=None, stroke=None, r=8, sw=1.5, dash=''):
    return f"<rect x='{x}' y='{y}' width='{w}' height='{h}' rx='{r}' fill='{fill or P['CARD']}' stroke='{stroke or P['LINE']}' stroke-width='{sw}' {('stroke-dasharray=%r' % dash) if dash else ''}/>"
def ln(x1, y1, x2, y2, c=None, mk='a', sw=1.5, dash=''):
    return f"<line x1='{x1}' y1='{y1}' x2='{x2}' y2='{y2}' stroke='{c or P['INK']}' stroke-width='{sw}' {('marker-end=\"url(#%s)\"' % mk) if mk else ''} {('stroke-dasharray=%r' % dash) if dash else ''}/>"
def heat(v):
    a, b, c = P['H0'], P['H1'], P['H2']
    lo, hi, u = (a, b, v / 0.5) if v < 0.5 else (b, c, (v - 0.5) / 0.5)
    return '#%02x%02x%02x' % tuple(round(lo[i] + (hi[i] - lo[i]) * u) for i in range(3))
pct = lambda v: f'{100 * v:.0f}'
_img = {}
def shot(run, name, width=560, crop=None):
    """A saved grader screenshot, downscaled, as a data URI."""
    key = (run, name, width, crop)
    if key not in _img:
        src = R / 'runs-budget' / run / 'shots' / f'{name}.png'
        with tempfile.NamedTemporaryFile(suffix='.jpg') as f:
            args = ['magick', str(src)] + (['-crop', crop, '+repage'] if crop else []) + ['-resize', f'{width * 2}x', '-quality', '82', f.name]
            subprocess.run(args, check=True)
            _img[key] = 'data:image/jpeg;base64,' + base64.b64encode(pathlib.Path(f.name).read_bytes()).decode()
    return _img[key]
def frame(x, y, w, h, uri, label, verdict, ok):
    """Screenshot in a browser-like frame with a caption and a verdict chip."""
    c = P['GREEN'] if ok else P['RED']
    b = f"<clipPath id='c{x}{y}'><rect x='{x}' y='{y + 22}' width='{w}' height='{h}' rx='0'/></clipPath>"
    b += box(x - 1, y - 1, w + 2, h + 24, P['CARD'], P['LINE'], 8, 1.5)
    b += ''.join(f"<circle cx='{x + 14 + i * 13}' cy='{y + 10}' r='3.5' fill='{P['LINE']}'/>" for i in range(3))
    b += f"<image x='{x}' y='{y + 22}' width='{w}' height='{h}' preserveAspectRatio='xMidYMin slice' clip-path='url(#c{x}{y})' xlink:href='{uri}' href='{uri}'/>"
    b += t(x, y + h + 48, label, 13, weight=600)
    b += f"<rect x='{x}' y='{y + h + 60}' width='{len(verdict) * 6.6 + 30}' height='24' rx='12' fill='none' stroke='{c}' stroke-width='1.5'/><circle cx='{x + 14}' cy='{y + h + 72}' r='4' fill='{c}'/>" + t(x + 24, y + h + 76.5, verdict, 12, c, weight=600)
    return b
OUT = {}
def save(n, w, h, body): OUT[n] = (w, h, body)

def build():
    OUT.clear()
    # 1 pipeline
    b = t(40, 38, 'One run, from brief to verdicts', 18, weight=600)
    steps = [('Brief', 'product page + API', 'sample data only'), ('Build', 'agent, 20 min', 'fresh sandbox'), ('Gate', 'scripted normal flow', 'different data'),
             ('Stress', 'up to 14 conditions', 'injected from outside'), ('Verdicts', 'pass or fail', 'by fixed rule')]
    for i, (a, s1, s2) in enumerate(steps):
        x = 40 + i * 170
        b += box(x, 92, 140, 96, P['PALE'] if i < 2 else P['CARD'], P['LINE'] if i < 2 else P['INK']) + t(x + 70, 124, a, 15, anchor='middle', weight=600) + t(x + 70, 148, s1, 11.5, P['MUTE'], 'middle') + t(x + 70, 166, s2, 11.5, P['MUTE'], 'middle')
        if i < 4: b += ln(x + 142, 140, x + 168, 140)
    b += f"<path d='M40,74 H350' stroke='{P['MUTE']}' stroke-width='1.2' fill='none'/><path d='M380,74 H860' stroke='{P['CLAY']}' stroke-width='1.2' fill='none'/>"
    b += t(40, 66, 'what the model sees and does', 11, P['MUTE']) + t(380, 66, 'what the model never sees', 11, P['CLAY'])
    b += t(40, 224, 'The app is copied out of the sandbox, rebuilt from source in a second sandbox and served as static files.', 12, P['MUTE'])
    b += t(40, 243, 'Network faults are injected by intercepting its requests in the browser, so the app needs no cooperation.', 12, P['MUTE'])
    save('01-pipeline', 900, 264, b)

    # 2 stress catalogue
    b = t(40, 38, 'Eighteen stress categories in two groups', 18, weight=600)
    desc = {'slow': 'every reply delayed 3 s', 'failed': 'server error on load', 'empty': 'empty list returned', 'zoom': 'page at half width', 'spacing': 'user text-spacing styles',
            'keyboard': 'Tab only, no mouse', 'stale': 'old search reply lands last', 'double': 'two clicks on a slow save', 'failsave': 'server rejects the save', 'invalid': 'required field left empty',
            'recover': 'fail once, then succeed', 'garbage': 'HTML error page, status 200', 'partial': 'one of two requests fails', 'long': '4x strings, 40x rows', 'narrow': '320 px wide viewport',
            'motion': 'reduced-motion setting on', 'a11y': 'axe: serious or critical', 'announce': 'errors reach assistive tech'}
    for gi, (title, keys, c) in enumerate([('Table stakes: at or near ceiling for every model', STAKES, P['BLUE']), ('Harder stresses: the headline score', HEAD, P['CLAY'])]):
        y0 = 64 + gi * 176
        b += t(40, y0 + 12, title, 12.5, c, weight=600)
        for i, k in enumerate(keys):
            x = 40 + (i % 5) * 166; y = y0 + 24 + (i // 5) * 62
            b += box(x, y, 156, 52, P['CARD'], P['LINE'], 7) + f"<rect x='{x}' y='{y + 10}' width='3' height='32' fill='{c}'/>" + t(x + 14, y + 22, LABEL[k], 13, weight=600) + t(x + 14, y + 40, desc[k], 10.8, P['MUTE'])
    save('02-stresses', 900, 400, b)

    # 3 leaderboard dumbbell
    order = sorted(MODELS, key=lambda m: -D['overall'][m]['default']['harder'])
    X0, X1 = 250, 760; sx = lambda v: X0 + (X1 - X0) * v
    b = t(40, 38, 'Harder-stress score, default prompt and with one sentence asking for production quality', 16.5, weight=600)
    for g in range(0, 101, 20):
        b += f"<line x1='{sx(g / 100)}' y1='70' x2='{sx(g / 100)}' y2='{84 + len(order) * 46}' stroke='{P['LINE']}' stroke-width='1'/>" + t(sx(g / 100), 100 + len(order) * 46, f'{g}%', 11, P['MUTE'], 'middle')
    for i, m in enumerate(order):
        y = 100 + i * 46; o = D['overall'][m]; d0, d1 = o['default'], o['told']
        b += t(40, y + 5, NAME[m] + (' †' if m == 'claude-fable-5.2' else ''), 14, weight=600)
        b += f"<line x1='{sx(d0['lo'])}' y1='{y}' x2='{sx(d0['hi'])}' y2='{y}' stroke='{P['LINE']}' stroke-width='7' stroke-linecap='round'/>"
        b += f"<line x1='{sx(d0['harder'])}' y1='{y}' x2='{sx(d1['harder'])}' y2='{y}' stroke='{P['INK']}' stroke-width='1.6'/>"
        b += f"<circle cx='{sx(d0['harder'])}' cy='{y}' r='6' fill='{P['BG']}' stroke='{P['INK']}' stroke-width='2'/><circle cx='{sx(d1['harder'])}' cy='{y}' r='6.5' fill='{P['CLAY']}'/>"
        b += t(772, y + 5, f"{pct(d0['harder'])} → {pct(d1['harder'])}", 13.5, mono=True) + t(878, y + 5, f"+{100 * o['delta']['mean']:.0f}", 13, P['CLAY'], 'end', 600, True)
    y = 128 + len(order) * 46
    b += f"<circle cx='46' cy='{y}' r='6' fill='{P['BG']}' stroke='{P['INK']}' stroke-width='2'/>" + t(60, y + 4, 'default prompt', 12, P['MUTE']) + f"<circle cx='176' cy='{y}' r='6.5' fill='{P['CLAY']}'/>" + t(190, y + 4, 'production prompt', 12, P['MUTE'])
    b += f"<line x1='330' y1='{y}' x2='366' y2='{y}' stroke='{P['LINE']}' stroke-width='7' stroke-linecap='round'/>" + t(376, y + 4, '95% interval for default, resampling tasks', 12, P['MUTE'])
    b += t(40, y + 28, '† Generated later through a different access path, with two differing starting conditions. Not like-for-like; see Limitations.', 11.5, P['MUTE'])
    save('03-leaderboard', 900, y + 46, b)

    # 4 heatmap harder, both conditions
    b = t(40, 38, 'Share of apps passing each harder stress', 18, weight=600)
    cw, ch = 40, 34
    for pi, (c, title) in enumerate([('default', 'Default prompt'), ('told', 'Production prompt')]):
        x0 = 168 + pi * 348
        b += t(x0, 72, title, 13, weight=600)
        for j, k in enumerate(HEAD):
            cx = x0 + j * cw + cw / 2
            b += f"<text transform='translate({cx + 4},{176}) rotate(-50)' font-size='11.5' fill='{P['MUTE']}' {F}>{LABEL[k]}</text>"
        for i, m in enumerate(order):
            y = 190 + i * ch
            if pi == 0: b += t(40, y + 22, NAME[m], 13, weight=500)
            for j, k in enumerate(HEAD):
                v = D['categories'][f'{m}|{c}'][k]
                b += f"<rect x='{x0 + j * cw}' y='{y}' width='{cw - 3}' height='{ch - 3}' rx='4' fill='{heat(v)}'/>" + t(x0 + j * cw + (cw - 3) / 2, y + 20.5, pct(v), 12, anchor='middle', mono=True)
    b += t(40, 190 + len(order) * ch + 24, 'Each cell is out of 18 apps (six tasks, three runs) where the stress applies to every task; fewer where it applies to some.', 11.5, P['MUTE'])
    save('04-heatmap', 900, 190 + len(order) * ch + 42, b)

    # 5 partial failure, same model before and after
    b = t(40, 38, 'One of two requests fails: the transactions call errors, the account call succeeds', 16.5, weight=600)
    b += frame(40, 60, 400, 250, shot('account__gpt-6.1-sol__default__1', 'partial0'), 'GPT-6.1 Sol, default prompt', 'fail: the working half is gone', False)
    b += frame(460, 60, 400, 250, shot('account__gpt-6.1-sol__told__1', 'partial0'), 'GPT-6.1 Sol, production prompt', 'pass: account shown, list reports its error', True)
    save('05-partial', 900, 410, b)

    # 6 long content, same model before and after
    b = t(40, 38, 'Long content: every string four times longer, plus one unbreakable 45-character word', 16.5, weight=600)
    b += frame(40, 60, 400, 250, shot('products__grok-4.7__default__1', 'long'), 'Grok 4.7, default prompt', 'fail: text cut off at the card edge', False)
    b += frame(460, 60, 400, 250, shot('products__grok-4.7__told__1', 'long'), 'Grok 4.7, production prompt', 'pass: wraps inside its box', True)
    save('06-long', 900, 410, b)

    # 7 garbage reply in a polished app
    b = t(40, 38, 'The same app on a normal day and when a proxy answers with an HTML error page', 16.5, weight=600)
    b += frame(40, 60, 400, 250, shot('account__gpt-6.1-sol__default__1', 'happy'), 'Normal conditions', 'gate: pass', True)
    b += frame(460, 60, 400, 250, shot('account__gpt-6.1-sol__default__1', 'garbage'), 'HTML body with status 200', 'fail: parser error shown to the user', False)
    save('07-garbage', 900, 410, b)

    # 8 how a verdict is derived from text snapshots
    b = t(40, 38, 'How "an error is shown" is decided without a judge', 18, weight=600)
    cols = [('Normal', ['Operating Reserve', '$56,309.15', 'Recent transactions', 'Card payment', 'Posted'], []), ('While loading', ['Recent transactions', 'Loading transactions'], [1]),
            ('Request failed', ['Operating Reserve', '$56,309.15', 'Recent transactions', "We couldn't load your transactions.", 'Try again'], [3, 4])]
    for i, (title, lines, hot) in enumerate(cols):
        x = 40 + i * 200
        b += box(x, 62, 184, 190, P['CARD'], P['LINE']) + t(x + 14, 86, title, 13, weight=600)
        for j, l in enumerate(lines):
            y = 110 + j * 26; h = j in hot and i == 2
            if h: b += f"<rect x='{x + 8}' y='{y - 15}' width='168' height='22' rx='4' fill='{P['PALE']}' stroke='{P['CLAY']}' stroke-width='1.2'/>"
            b += t(x + 14, y, l if len(l) < 24 else l[:21] + '…', 11.5, P['INK'] if (h or i != 2) else P['MUTE'], mono=True)
    b += ln(626, 157, 660, 157)
    b += box(664, 62, 196, 190, P['PALE'], P['INK']) + t(678, 86, 'Said only when it failed', 13, weight=600)
    for j, l in enumerate(["We couldn't load your…", 'Try again']): b += t(678, 112 + j * 26, l, 11.5, mono=True)
    b += t(678, 180, 'non-empty text → error shown', 11.5, P['MUTE']) + t(678, 198, 'new button → retry candidate', 11.5, P['MUTE']) + t(678, 216, 'known row still present →', 11.5, P['MUTE']) + t(678, 234, 'working part kept', 11.5, P['MUTE'])
    b += t(40, 282, 'The grader records the visible lines and buttons in each state and compares sets. It never needs to know what the error says or looks like.', 12, P['MUTE'])
    save('08-snapshots', 900, 302, b)

    # 9 what the sentence fixes, by stress (mean over models)
    b = t(40, 38, 'What one sentence changes, by stress (mean over seven models)', 18, weight=600)
    rows = sorted(HEAD, key=lambda k: sum(D['categories'][f'{m}|default'][k] for m in MODELS))
    X0, X1 = 200, 800; sx = lambda v: X0 + (X1 - X0) * v
    for g in range(0, 101, 25): b += f"<line x1='{sx(g / 100)}' y1='62' x2='{sx(g / 100)}' y2='{70 + len(rows) * 38}' stroke='{P['LINE']}'/>" + t(sx(g / 100), 88 + len(rows) * 38, f'{g}%', 11, P['MUTE'], 'middle')
    for i, k in enumerate(rows):
        y = 84 + i * 38; a = sum(D['categories'][f'{m}|default'][k] for m in MODELS) / 7; c = sum(D['categories'][f'{m}|told'][k] for m in MODELS) / 7
        b += t(40, y + 4, LABEL[k], 13, weight=500)
        b += f"<rect x='{X0}' y='{y - 11}' width='{sx(a) - X0}' height='10' rx='2' fill='{P['MUTE']}' opacity='.55'/><rect x='{X0}' y='{y + 1}' width='{sx(c) - X0}' height='10' rx='2' fill='{P['CLAY']}'/>"
        b += t(812, y - 2, pct(a), 11.5, P['MUTE'], mono=True) + t(812, y + 11, pct(c), 11.5, P['CLAY'], mono=True, weight=600) + t(868, y + 5, (f'{100 * (c - a):+.0f}' if round(100 * (c - a)) else '0'), 13, anchor='end', weight=600, mono=True)
    y = 112 + len(rows) * 38
    b += f"<rect x='40' y='{y - 8}' width='22' height='9' rx='2' fill='{P['MUTE']}' opacity='.55'/>" + t(70, y, 'default prompt', 12, P['MUTE']) + f"<rect x='180' y='{y - 8}' width='22' height='9' rx='2' fill='{P['CLAY']}'/>" + t(210, y, 'production prompt', 12, P['MUTE'])
    save('09-by-stress', 900, y + 20, b)

    # 10 spread of individual apps
    b = t(40, 38, 'Every app: harder-stress score of each of the 36 apps per model', 18, weight=600)
    X0, X1 = 250, 860; sx = lambda v: X0 + (X1 - X0) * v
    for g in range(0, 101, 20): b += f"<line x1='{sx(g / 100)}' y1='60' x2='{sx(g / 100)}' y2='{70 + len(order) * 50}' stroke='{P['LINE']}'/>" + t(sx(g / 100), 88 + len(order) * 50, f'{g}%', 11, P['MUTE'], 'middle')
    for i, m in enumerate(order):
        y = 84 + i * 50
        b += t(40, y + 5, NAME[m], 14, weight=600)
        for ci, c in enumerate(['default', 'told']):
            seen = {}
            for v in sorted(D['apps'][f'{m}|{c}']):
                key = round(v * 60); n = seen.get(key, 0); seen[key] = n + 1
                yy = y - 9 + ci * 18 + ((n % 3) - 1) * 4.2; xx = sx(v) + (n // 3) * 4.5 * (-1 if v > 0.97 else 1)
                b += f"<circle cx='{xx:.1f}' cy='{yy:.1f}' r='3.6' fill='{P['CLAY'] if ci else 'none'}' stroke='{P['CLAY'] if ci else P['INK']}' stroke-width='1.3' opacity='.85'/>"
    y = 112 + len(order) * 50
    b += f"<circle cx='46' cy='{y - 4}' r='3.6' fill='none' stroke='{P['INK']}' stroke-width='1.3'/>" + t(58, y, 'default prompt', 12, P['MUTE']) + f"<circle cx='166' cy='{y - 4}' r='3.6' fill='{P['CLAY']}'/>" + t(178, y, 'production prompt', 12, P['MUTE'])
    b += t(310, y, 'One app that failed the normal-flow gate scores zero.', 12, P['MUTE'])
    save('10-spread', 900, y + 20, b)

    # 11 table stakes at ceiling
    b = t(40, 38, 'Table stakes, default prompt: the states everyone expects are already there', 16.5, weight=600)
    cw, ch = 66, 30
    for j, k in enumerate(STAKES):
        cx = 180 + j * cw + cw / 2
        b += f"<text transform='translate({cx + 2},{128}) rotate(-38)' font-size='11.5' fill='{P['MUTE']}' {F}>{LABEL[k]}</text>"
    for i, m in enumerate(order):
        y = 140 + i * ch
        b += t(40, y + 20, NAME[m], 13, weight=500)
        for j, k in enumerate(STAKES):
            v = D['categories'][f'{m}|default'].get(k)
            b += f"<rect x='{180 + j * cw}' y='{y}' width='{cw - 3}' height='{ch - 3}' rx='4' fill='{heat(v)}'/>" + t(180 + j * cw + (cw - 3) / 2, y + 18.5, pct(v), 12, anchor='middle', mono=True)
    save('11-table-stakes', 900, 140 + len(order) * ch + 16, b)

    # 12 accessibility audit
    b = t(40, 38, 'Apps with a serious or critical accessibility-audit violation, out of 18', 17, weight=600)
    X0 = 250; sx = lambda n: X0 + n * 30
    for g in range(0, 19, 6): b += f"<line x1='{sx(g)}' y1='60' x2='{sx(g)}' y2='{66 + len(order) * 44}' stroke='{P['LINE']}'/>" + t(sx(g), 84 + len(order) * 44, str(g), 11, P['MUTE'], 'middle')
    for i, m in enumerate(order):
        y = 80 + i * 44; a = D['axe'][f'{m}|default']; c = D['axe'][f'{m}|told']
        b += t(40, y + 5, NAME[m], 14, weight=600)
        for ci, (n, col) in enumerate([(a['apps_with_violations'], P['MUTE']), (c['apps_with_violations'], P['CLAY'])]):
            yy = y - 11 + ci * 13
            b += f"<rect x='{X0}' y='{yy}' width='{max(n * 30, 1.5)}' height='10' rx='2' fill='{col}' opacity='{1 if ci else .55}'/>" + t(sx(n) + 8, yy + 9.5, str(n), 11.5, col, mono=True, weight=600 if ci else 400)
    y = 108 + len(order) * 44
    b += f"<rect x='40' y='{y - 8}' width='22' height='9' rx='2' fill='{P['MUTE']}' opacity='.55'/>" + t(70, y, 'default prompt', 12, P['MUTE']) + f"<rect x='180' y='{y - 8}' width='22' height='9' rx='2' fill='{P['CLAY']}'/>" + t(210, y, 'production prompt', 12, P['MUTE'])
    cc = sum(D['axe'][f'{m}|{c}']['rules'].get('color-contrast', 0) for m in MODELS for c in ('default', 'told')); tot = sum(D['axe'][f'{m}|{c}']['apps_with_violations'] for m in MODELS for c in ('default', 'told'))
    b += t(350, y, f'Colour contrast is the violation in {cc} of the {tot} affected apps.', 12, P['MUTE'])
    save('12-audit', 900, y + 20, b)

    # 13 isolation before and after
    b = t(40, 38, 'What the builder could read, before and after the repair', 18, weight=600)
    for pi, (title, ok) in enumerate([('Before: the sandbox confines writes only', False), ('After: operating-system read policy', True)]):
        x = 40 + pi * 430
        b += box(x, 60, 400, 250, P['CARD'], P['LINE']) + t(x + 16, 86, title, 13.5, weight=600)
        b += box(x + 16, 104, 150, 86, P['PALE'], P['INK'], 6) + t(x + 91, 130, 'Builder agent', 12.5, anchor='middle', weight=600) + t(x + 91, 150, 'its own app', 11, P['MUTE'], 'middle') + t(x + 91, 166, 'read + write', 11, P['MUTE'], 'middle')
        items = ['grader source', 'grading fixtures', 'other runs and scores']
        for j, it in enumerate(items):
            y = 104 + j * 32; c = P['GREEN'] if ok else P['RED']
            b += box(x + 232, y, 152, 24, P['CARD'], c, 5, 1.4) + t(x + 308, y + 16.5, it, 11.5, anchor='middle')
            b += f"<line x1='{x + 168}' y1='{147}' x2='{x + 230}' y2='{y + 12}' stroke='{c}' stroke-width='1.4' {'stroke-dasharray=\"4 4\"' if ok else ''}/>"
            if ok: b += f"<circle cx='{x + 199}' cy='{(147 + y + 12) / 2}' r='8' fill='{P['CARD']}'/>" + t(x + 199, (147 + y + 12) / 2 + 4.5, '✕', 12, c, 'middle', 700)
        note = ['Writes were confined to the app directory.', 'Reads were not. A log audit flagged 20 runs,', 'all by one model, that read these files.'] if not ok else ['Builds run outside the evaluation tree under a', 'read deny, each with its own runtime home.', 'Seven filesystem controls must pass first.']
        for j, s in enumerate(note): b += t(x + 16, 232 + j * 20, s, 12, P['MUTE'])
    save('13-isolation', 900, 330, b)

    # 14 rank stability
    b = t(40, 38, 'Model rank on the default prompt when one harder stress is removed from the score', 16.5, weight=600)
    cols = ['all'] + [f'no {h}' for h in HEAD] + ['no motion+garbage']; S = D['sensitivity']['default']
    X0, X1 = 230, 780; sx = lambda i: X0 + (X1 - X0) * i / (len(cols) - 1); sy = lambda r: 96 + (r - 1) * 34
    for i, c in enumerate(cols):
        lab = 'all eight' if c == 'all' else ('no motion or garbage' if '+' in c else 'no ' + LABEL[c[3:]].lower())
        b += f"<line x1='{sx(i)}' y1='84' x2='{sx(i)}' y2='{sy(7) + 12}' stroke='{P['LINE']}'/><text transform='translate({sx(i) + 4},{sy(7) + 26}) rotate(40)' font-size='11' fill='{P['MUTE']}' {F}>{lab}</text>"
    cols_c = [P['CLAY'], P['BLUE'], P['GREEN'], P['INK'], P['MUTE'], P['RED'], P['BLUE']]
    for mi, m in enumerate(order):
        pts = ' '.join(f"{sx(i):.1f},{sy(S[c][m]['rank'])}" for i, c in enumerate(cols)); col = cols_c[mi]
        b += f"<polyline points='{pts}' fill='none' stroke='{col}' stroke-width='2' {'stroke-dasharray=\"5 4\"' if mi == 6 else ''} stroke-linejoin='round'/>"
        b += ''.join(f"<circle cx='{sx(i):.1f}' cy='{sy(S[c][m]['rank'])}' r='4' fill='{P['BG']}' stroke='{col}' stroke-width='2'/>" for i, c in enumerate(cols))
        b += t(40, sy(S['all'][m]['rank']) + 5, f"{S['all'][m]['rank']}  {NAME[m]}", 13, col, weight=600)
    save('14-ranks', 900, sy(7) + 130, b)

def write(folder):
    folder.mkdir(parents=True, exist_ok=True)
    for n, (w, h, body) in OUT.items(): (folder / f'{n}.svg').write_text(svg(w, h, body))

build(); write(R / 'paper/figures')
P.update(DARK); build(); write(R / 'paper/figures-dark')
print('wrote', len(OUT), 'figures, light and dark')

