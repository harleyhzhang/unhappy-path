"""Independently verify the final export/report math without importing scoring helpers."""
import collections,csv,fractions,itertools,json,pathlib,re
R=pathlib.Path(__file__).resolve().parents[1];D=R/'runs-budget';A=R/'artifacts-budget'
MODELS=['claude-fable-5.2','claude-opus-5.5','grok-4.7','muse-wonder','gpt-6.1-sol','gpt-6-astra','kimi-k3']
TASKS=['releases','account','event','products','invite','workspace'];HEAD={'recover','garbage','partial','long','narrow','motion','a11y','announce'}
F=fractions.Fraction
mean=lambda xs:sum(xs,F(0))/len(xs)
boolval=lambda s:{'True':True,'False':False}[s]
rows=list(csv.DictReader((A/'outcomes.csv').open()))
by=collections.defaultdict(lambda:collections.defaultdict(list));raw={}
for row in rows:
 key=(row['model'],row['condition'],row['task'],int(row['repetition']))
 if key not in raw:raw[key]=json.loads((D/f'{key[2]}__{key[0]}__{key[1]}__{key[3]}'/'grade.json').read_text())
 g=raw[key];category='partial' if row['stress'].startswith('partial') else row['stress']
 assert row['category']==category
 assert boolval(row['gate'])==bool(g['gate'])
 assert boolval(row['passed'])==bool(g['pass'][row['stress']])
 assert boolval(row['scored_pass'])==bool(g['gate'] and g['pass'][row['stress']])
 by[key][category].append(F(int(boolval(row['scored_pass']))))
expected=set(itertools.product(MODELS,['default','told'],TASKS,[1,2,3]));assert set(by)==expected,(len(by),'incomplete/extra cases')
summary={};report=(R/'BUDGET.md').read_text().splitlines()
for model in MODELS:
 out={}
 for condition in ['default','told']:
  tasks=[];stakes=[];gatepasses=0
  for task in TASKS:
   apps=[];bs=[]
   for n in [1,2,3]:
    key=(model,condition,task,n);categories={c:mean(v) for c,v in by[key].items()}
    apps.append(mean([v for c,v in categories.items() if c in HEAD]));bs.append(mean([v for c,v in categories.items() if c not in HEAD]));gatepasses+=bool(raw[key]['gate'])
   tasks.append(mean(apps));stakes.append(mean(bs))
  out[condition]={'harder':float(mean(tasks)),'table_stakes':float(mean(stakes)),'gate_passes':gatepasses}
 line=next(l for l in report if l.startswith('| '+model+' |'));cells=[x.strip() for x in line.strip('|').split('|')]
 pct=lambda s:float(re.search(r'([-+]?\d+(?:\.\d+)?)%',s).group(1))
 for actual,computed in [(pct(cells[3]),out['default']['harder']*100),(pct(cells[4]),out['default']['table_stakes']*100),(pct(cells[6]),out['told']['harder']*100)]:assert abs(actual-computed)<=.501,(model,actual,computed)
 assert int(cells[2])==18-out['default']['gate_passes']
 delta=float(re.search(r'([-+]?\d+(?:\.\d+)?)\s+pp',cells[7]).group(1));assert abs(delta-100*(out['told']['harder']-out['default']['harder']))<=.501
 summary[model]=out
# Normal-flow payload checks beyond the basic edited-field assertions.
for key,g in raw.items():
 if not g['gate'] or key[2] not in ['invite','workspace']:continue
 sent=g['raw']['happy']['sent'];t=json.loads((R/'tasks'/key[2]/'task.json').read_text())
 expected_body={'role':'editor'} if key[2]=='invite' else {k:v for k,v in t['fixture']['/api/workspace'].items() if k!='name'}
 assert all(sent.get(k)==v for k,v in expected_body.items()),('payload contract mismatch',key)
captures=list(csv.DictReader((A/'capture-status.csv').open()));assert len(captures)==len(MODELS)*36
for m in captures:assert boolval(m['generation_finished'])==(m['generation_status']=='completed')
(A/'independent-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(f'PASS: {len(MODELS)*36} cases, raw/export fidelity, independent task/category weighting, rounded report values, capture flags and form payloads')
print(json.dumps(summary,indent=2))
