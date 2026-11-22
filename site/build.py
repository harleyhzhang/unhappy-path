"""Builds the benchmark's site into site/dist from paper/data.json and the grader's saved screenshots.
Usage: python3 paper/build_data.py && python3 paper/build_article.py && python3 site/build.py
The output is static: open site/dist/index.html through any file server."""
import concurrent.futures, json, pathlib, shutil, subprocess
R = pathlib.Path(__file__).resolve().parents[1]
S = R / 'site'; OUT = S / 'dist'
D = json.loads((R / 'paper/data.json').read_text())

D['labels'] = {'recover': 'Recover', 'garbage': 'Garbage reply', 'partial': 'Partial failure', 'long': 'Long content', 'narrow': 'Narrow screen', 'motion': 'Reduced motion',
               'a11y': 'Accessibility audit', 'announce': 'Announced errors', 'slow': 'Slow', 'failed': 'Failed', 'empty': 'Empty', 'zoom': '200% zoom', 'spacing': 'Text spacing',
               'keyboard': 'Keyboard', 'stale': 'Out-of-order', 'double': 'Double submit', 'failsave': 'Failed save', 'invalid': 'Invalid save'}
D['rules'] = [dict(id=i, condition=c, rule=r) for i, c, r in [
    ('recover', 'The request fails, then the backend recovers', 'A control that appears only in the failed state fetches again and the content returns.'),
    ('garbage', 'The backend answers status 200 with an HTML page', 'An error is shown, with no parser text such as "Unexpected token" and no endless spinner.'),
    ('partial', 'One of two requests fails, tested both ways', 'The half that loaded is still on screen beside an error for the half that did not.'),
    ('long', 'Strings four times longer plus a 45-character word, forty times the rows', 'No sideways scroll, no new sideways scroller, no text cut off or spilling out of its box.'),
    ('narrow', 'A 320-pixel-wide screen', 'No sideways scroll, nothing cut off, tap targets at least 24 px or spaced, content still present.'),
    ('motion', 'The reduced-motion preference is on', 'Nothing keeps moving: no animation that repeats or runs past three seconds. Fades are allowed.'),
    ('a11y', 'The axe-core audit on the loaded page', 'No violation rated serious or critical.'),
    ('announce', 'A load fails and a save is rejected', 'The error reaches assistive technology through a live region, an alert role, a field association or focus.'),
    ('slow', 'Every reply is delayed three seconds', 'A loading signal shows, no "no results" text appears early, and layout shift stays under 0.1.'),
    ('failed', 'Load requests return a server error', 'Text unique to the failure appears; the page is not stuck loading and not presented as empty.'),
    ('empty', 'List endpoints return nothing', 'An explicit empty message, with no junk values and no leftover spinner.'),
    ('zoom', 'The page at half width, standing in for 200% zoom', 'No sideways scroll, nothing cut off, content still present.'),
    ('spacing', 'WCAG 1.4.12 text-spacing styles are applied', 'No sideways scroll and nothing cut off.'),
    ('keyboard', 'Tab key only', 'Every control is reached, focus changes its appearance, nothing is mouse-only, Enter submits.'),
    ('stale', 'An older search reply arrives after a newer one', 'Results match the latest query.'),
    ('double', 'Two clicks during a slow save', 'Exactly one request is sent.'),
    ('failsave', 'The server rejects a save', 'The user is told, their input is kept, and saving again resends it.'),
    ('invalid', 'A required field is empty', 'Nothing is sent.')]]
D['taskInfo'] = [dict(id=i, title=t, text=x, kind=k, n=n, run=r) for i, t, x, k, n, r in [
    ('releases', 'Release notes', 'A list of product releases with versions, dates and summaries.', 'List', 13, 'releases__claude-opus-5.5__told__1'),
    ('account', 'Account activity', 'A bank account header and its recent transactions, from two requests.', 'Two requests', 14, 'account__gpt-6.1-sol__told__1'),
    ('event', 'Event page', 'An event summary and its attendee list, from two requests.', 'Two requests', 14, 'event__muse-wonder__told__1'),
    ('products', 'Product search', 'An inventory list with search by name or SKU as you type.', 'Search', 14, 'products__grok-4.7__told__1'),
    ('invite', 'Invite a teammate', 'A four-field form that sends an invitation and shows its code.', 'Create form', 10, 'invite__gpt-6-astra__told__1'),
    ('workspace', 'Workspace settings', 'A form that loads saved settings, edits them and saves.', 'Edit form', 14, 'workspace__kimi-k3__told__1')]]
D['pairs'] = [
    dict(tab='Partial failure', note='One of the page\'s two requests fails. The default build fetches both with a single Promise.all, so the account data it did receive is discarded. With the production sentence the same model keeps the two regions independent.', shots=[
        dict(run='account__gpt-6.1-sol__default__1', shot='partial0', label='GPT-6.1 Sol · default prompt', verdict='Fail', ok=False, alt='Account page replaced entirely by an error message'),
        dict(run='account__gpt-6.1-sol__told__1', shot='partial0', label='GPT-6.1 Sol · production prompt', verdict='Pass', ok=True, alt='Account balance shown above an inline error for the transactions list')]),
    dict(tab='Long content', note='Every string is four times longer and gains one unbreakable 45-character word. On the left the titles run past the card edge and are clipped. On the right they wrap.', shots=[
        dict(run='products__grok-4.7__default__1', shot='long', label='Grok 4.7 · default prompt', verdict='Fail', ok=False, alt='Product list with titles clipped at the card edge'),
        dict(run='products__grok-4.7__told__1', shot='long', label='Grok 4.7 · production prompt', verdict='Pass', ok=True, alt='Product list with long titles wrapped inside their cards')]),
    dict(tab='Garbage reply', note='The same default build on a normal day and when a proxy answers with an HTML error page. A polished interface prints the JSON parser\'s exception to the customer.', shots=[
        dict(run='account__gpt-6.1-sol__default__1', shot='happy', label='Normal conditions', verdict='Gate pass', ok=True, alt='A polished banking dashboard showing a balance and transactions'),
        dict(run='account__gpt-6.1-sol__default__1', shot='garbage', label='HTML body, status 200', verdict='Fail', ok=False, alt='The same dashboard showing the text Unexpected token is not valid JSON')]),
    dict(tab='Narrow screen', phone=True, note='The page at 320 pixels wide. On the left the navigation and header run off the right edge, so the page scrolls sideways.', shots=[
        dict(run='account__gpt-6.1-sol__default__1', shot='narrow', label='GPT-6.1 Sol · default prompt', verdict='Fail', ok=False, alt='Phone-width page with a navigation row cut off at the right edge'),
        dict(run='account__gpt-6.1-sol__told__1', shot='narrow', label='GPT-6.1 Sol · production prompt', verdict='Pass', ok=True, alt='Phone-width page that fits the screen')]),
]

def convert(job):
    src, dst = job
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime: return
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['cwebp', '-quiet', '-q', '68', '-resize', '960' if src.stem != 'narrow' else '0', '0', str(src), '-o', str(dst)], check=True)

OUT.mkdir(parents=True, exist_ok=True)
jobs, shots = [], {}
for run in D['runs']:
    folder = R / 'runs-budget' / run['id'] / 'shots'
    names = sorted(p.stem for p in folder.glob('*.png')) if folder.is_dir() else []
    shots[run['id']] = names
    jobs += [(folder / f'{n}.png', OUT / 'shots' / run['id'] / f'{n}.webp') for n in names]
with concurrent.futures.ThreadPoolExecutor(8) as pool: list(pool.map(convert, jobs))
D['shots'] = shots

CF = D['confirm']['models']; NM = {m['id']: m['name'] for m in D['models']}
rows = ''.join(f"<tr><td class='n'>{i + 1}</td><td class='m'>{NM[m]}</td><td class='r'>{100 * CF[m]['main_default']:.0f}%</td><td class='r'><b>{100 * CF[m]['default']:.0f}%</b></td><td class='r'>{100 * CF[m]['told']:.0f}%</td></tr>"
               for i, m in enumerate(sorted(CF, key=lambda m: -CF[m]['default'])))
html = (S / 'template.html').read_text().replace('__CONFIRM__', rows).replace('__RHO__', f"{D['confirm']['spearman_default']:.2f}").replace('__DATA__', json.dumps(D, separators=(',', ':')).replace('</', '<\\/'))
(OUT / 'index.html').write_text(html)
for name in ['site.css', 'site.js']: shutil.copyfile(S / name, OUT / name)
shutil.copytree(S / 'fonts', OUT / 'fonts', dirs_exist_ok=True)
(OUT / 'data').mkdir(exist_ok=True)
for name in ['outcomes.csv', 'capture-status.csv']: shutil.copyfile(R / 'artifacts-budget' / name, OUT / 'data' / name)
w = OUT / 'writeup'; w.mkdir(exist_ok=True)
shutil.copyfile(R / 'paper/index.html', w / 'index.html')
(w / 'figures').mkdir(exist_ok=True)
for f in (R / 'paper/figures').glob('*.svg'): shutil.copyfile(f, w / 'figures' / f.name)
size = sum(p.stat().st_size for p in OUT.rglob('*') if p.is_file())
print(f'built site/dist: {len(jobs)} screenshots, {size / 1e6:.0f} MB')
