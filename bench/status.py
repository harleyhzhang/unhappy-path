"""Track captured artifacts separately from agent completion and browser verdicts."""
import argparse,json,pathlib
p=argparse.ArgumentParser();p.add_argument('--dir',default='runs-budget');a=p.parse_args()
r=pathlib.Path(__file__).resolve().parents[1];tasks=['releases','account','event','products','invite','workspace'];models=['claude-opus-5.5','gpt-6.1-sol','gpt-6-astra','grok-4.7','kimi-k3','muse-wonder','claude-fable-5.2']
missing=[];total=grades=finished=capped=0
for model in models:
 out=[]
 for cond in ['default','told']:
  cap=graded=done=deadline=0
  for task in tasks:
   for n in [1,2,3]:
    d=r/a.dir/f'{task}__{model}__{cond}__{n}'
    if (d/'meta.json').exists():
     m=json.loads((d/'meta.json').read_text());cap+=1;done+=bool(m.get('generation_finished',m.get('ok')));deadline+=m.get('generation_status')=='deadline';graded+=(d/'grade.json').exists()
    else:missing.append(d.name)
  total+=cap;grades+=graded;finished+=done;capped+=deadline;out.append(f'{cond}: {cap}/18 captured ({done} agent-finished, {deadline} deadline), {graded}/18 graded')
 print(model,'; '.join(out))
print(f'Total: {total}/{len(models)*36} captured; {finished} agent-finished, {capped} deadline; {grades}/{len(models)*36} graded')
(r/'runs'/'budget-status.json').write_text(json.dumps(dict(captured=total,agent_finished=finished,deadline=capped,graded=grades,expected=len(models)*36,missing=missing),indent=2))
