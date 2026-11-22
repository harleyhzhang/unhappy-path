"""Assembles the write-up: a standalone preview (paper/index.html) and the site fragment
(paper/site_fragment.html, figures referenced under /writing/<slug>/ with dark variants).
Usage: python3 paper/build_article.py"""
import html, pathlib, re
R = pathlib.Path(__file__).resolve().parent
SLUG = 'unhappy-path'
TITLE = 'Unhappy Path: stress-testing the web apps AI models build'
DEK = 'A benchmark that breaks the network, the data and the screen on purpose, run on 252 apps built by seven AI models.'
FIGS = {
 'LEADERBOARD': ('03-leaderboard', 'Leaderboard on harder stresses', 'Harder-stress score for each model on the default prompt (open circle) and with one added sentence (filled circle). Bars are 95% intervals for the default score.'),
 'PIPELINE': ('01-pipeline', 'Pipeline of one run', 'One run. The model sees a brief and sample data; the gate, the stresses and the rules stay outside its sandbox.'),
 'STRESSES': ('02-stresses', 'The eighteen stress categories', 'The stress categories. Each task takes the ones that apply to it, up to fourteen.'),
 'SNAPSHOTS': ('08-snapshots', 'Deriving a verdict from text snapshots', 'A verdict from set differences. The lines are from a real app in this run.'),
 'STAKES': ('11-table-stakes', 'Table-stakes pass rates', 'Pass rates on the ten table-stakes categories, default prompt. Blank states, false empty messages and endless spinners are rare.'),
 'HEATMAP': ('04-heatmap', 'Pass rates on harder stresses', 'Pass rates on the eight harder stresses, by model and prompt.'),
 'PARTIAL': ('05-partial', 'Partial failure before and after', 'The same model on the same task. Left, the default build discards the account data it received. Right, the instructed build keeps it.'),
 'LONG': ('06-long', 'Long content before and after', 'Long content in a product search. Left, titles run past the card edge and are clipped. Right, they wrap.'),
 'GARBAGE': ('07-garbage', 'A polished app showing a parser error', 'A default build under normal conditions and when the backend returns HTML. The message reads: Unexpected token, is not valid JSON.'),
 'AUDIT': ('12-audit', 'Accessibility audit failures', 'Apps with at least one serious or critical axe-core violation.'),
 'BYSTRESS': ('09-by-stress', 'Effect of the production sentence by stress', 'Pass rate by harder stress, averaged over the seven models, without and with the sentence.'),
 'SPREAD': ('10-spread', 'Scores of individual apps', 'Each dot is one app. The default prompt produces a wide spread within every model except one; the sentence compresses it.'),
 'RANKS': ('14-ranks', 'Rank stability', 'Rank on the default prompt when a harder stress is left out of the score.'),
 'CONFIRM': ('15-confirm', 'Second round against the main run', 'Second round on six new tasks. Grey diamonds are each model\'s default score in the main run. Open and filled circles are the second round without and with the production sentence.'),
 'ISOLATION': ('13-isolation', 'Isolation before and after', 'The first version let builders read the evaluation tree. The repaired runner denies it at the operating-system level.'),
}
body = (R / 'article_body.html').read_text()
def fill(render):
    out = body
    for key, (name, alt, cap) in FIGS.items():
        assert '{{' + key + '}}' in out, key
        out = out.replace('{{' + key + '}}', render(name, alt, cap))
    assert '{{' not in out
    return out
preview = fill(lambda n, a, c: f'<figure><img src="figures/{n}.svg" alt="{a}"><figcaption>{c}</figcaption></figure>')
site = fill(lambda n, a, c: f'<figure><picture><source srcset="/writing/{SLUG}/{n}-dark.svg" media="(prefers-color-scheme: dark)" /><img src="/writing/{SLUG}/{n}.svg" alt="{a}" loading="lazy" /></picture><figcaption>{c}</figcaption></figure>')
HEAD = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>%s</title>
<style>
body{margin:0;background:#faf9f5;color:#1f1e1d;font:18px/1.65 Georgia,'Iowan Old Style',serif}
main{max-width:720px;margin:0 auto;padding:72px 24px 120px}
h1{font:600 44px/1.12 ui-sans-serif,-apple-system,Helvetica,Arial,sans-serif;letter-spacing:-.02em;margin:0 0 12px}
.sub{font:400 21px/1.4 ui-sans-serif,-apple-system,Helvetica,Arial,sans-serif;color:#5e5d59;margin:0 0 20px}
.by{font:14px ui-sans-serif,-apple-system,Helvetica,Arial,sans-serif;color:#87867f;margin-bottom:48px}
h2{font:600 26px/1.25 ui-sans-serif,-apple-system,Helvetica,Arial,sans-serif;margin:56px 0 12px;letter-spacing:-.01em}
h3{font:600 19px/1.3 ui-sans-serif,-apple-system,Helvetica,Arial,sans-serif;margin:32px 0 6px}
figure{margin:36px -90px}figure img{width:100%%;border:1px solid #e8e6dc;border-radius:10px;display:block}
figcaption{font:14px/1.5 ui-sans-serif,-apple-system,Helvetica,Arial,sans-serif;color:#87867f;margin:10px 90px 0}
ul{padding-left:22px}li{margin:8px 0}a{color:inherit}
pre{background:#f0eee6;border-radius:8px;padding:16px 18px;overflow:auto;font:13.5px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace}
code{font:.86em ui-monospace,SFMono-Regular,Menlo,monospace;background:#f0eee6;padding:1px 5px;border-radius:4px}pre code{background:none;padding:0;font-size:inherit}
@media(max-width:920px){figure{margin:32px 0}figcaption{margin:10px 0 0}}
</style></head><body><main>
<h1>%s</h1><p class="sub">%s</p><p class="by">Harley Zhang · November 2026</p>
""" % (TITLE, TITLE, DEK)
(R / 'index.html').write_text(HEAD + preview + '\n</main></body></html>\n')
(R / 'site_fragment.html').write_text(site)
cap = ' '.join(c for _, _, c in FIGS.values()); code = ' '.join(re.findall(r'<pre>(.*?)</pre>', body, re.S))
bd = re.sub(r'<pre>.*?</pre>', ' ', body, flags=re.S)
w = lambda x: len(html.unescape(re.sub(r'<[^>]+>', ' ', x)).split())
print('body', w(bd), 'captions', w(cap), 'code', w(code), 'figures', len(FIGS))

