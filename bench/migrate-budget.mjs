// Reconcile preserved artifacts without copying the source corpus.
import fs from 'node:fs'
import path from 'node:path'
const root=path.resolve(import.meta.dirname,'..'),from=path.join(root,'runs-isolated'),to=path.join(root,'runs-budget')
fs.mkdirSync(to,{recursive:true})
let completed=0,deadline=0,replacement=0
for(const id of fs.readdirSync(from)){
 const parts=id.split('__');if(parts.length!==4)continue
 const [task,model,condition,n]=parts,base=path.join(from,id),target=path.join(to,id)
 const specFile=path.join(root,'tasks',task,'task.json');if(!fs.existsSync(specFile)||JSON.parse(fs.readFileSync(specFile)).set!=='heldout')continue
 if(fs.existsSync(path.join(target,'meta.json')))continue
 const metaFile=path.join(base,'meta.json'),m=fs.existsSync(metaFile)?JSON.parse(fs.readFileSync(metaFile)):null
 const log=path.join(base,'attempts.private.jsonl')
 const attempts=fs.existsSync(log)?fs.readFileSync(log,'utf8').trim().split('\n').flatMap(l=>{try{return[JSON.parse(l)]}catch{return[]}}):[]
 const firstDeadline=attempts.find(a=>a.failed==='timeout')
 fs.mkdirSync(target,{recursive:true})
 let selected,route
 if(firstDeadline){
  const snapshotRoot=path.join(base,'attempt-snapshots')
  const candidates=fs.existsSync(snapshotRoot)?fs.readdirSync(snapshotRoot).filter(x=>x.startsWith('timeout-')||x===firstDeadline.log?.replace(/^attempt-/,'').replace(/\.jsonl$/,'')).sort():[]
  if(!candidates.length){
   fs.writeFileSync(path.join(target,'case-note.json'),JSON.stringify({replacement_reason:'The original completion-only runner discarded the first cutoff source before artifact capture was repaired. A fresh non-selected replacement is required.',prior_attempt_log: path.relative(root,log)},null,2));replacement++;continue
  }
  selected={id,task,model,condition,run:Number(n),date:firstDeadline.at,seconds:firstDeadline.seconds,usage:firstDeadline.usage,ok:false,captured:true,isolated:true,generation_finished:false,generation_status:'deadline',artifact_source:path.relative(root,path.join(snapshotRoot,candidates[0],'app')),selected_attempt:firstDeadline.log,selection:'first preserved deadline artifact'}
  route=firstDeadline.route;deadline++
 }else if(m?.ok){
  selected={...m,captured:true,generation_finished:true,generation_status:'completed',artifact_source:path.relative(root,path.join(base,'app')),selection:'existing completed artifact; prior access/operator interruptions excluded'}
  const r=path.join(base,'route.private.json');route=fs.existsSync(r)?JSON.parse(fs.readFileSync(r)).route:undefined;completed++
 }else continue
 if(!fs.lstatSync(path.join(root,selected.artifact_source)).isDirectory())throw new Error('Missing source '+id)
 selected.cohort='budget-artifacts-v1-repair'
 fs.writeFileSync(path.join(target,'meta.json'),JSON.stringify(selected,null,2)+'\n')
 if(route)fs.writeFileSync(path.join(target,'route.private.json'),JSON.stringify({route}))
}
console.log(JSON.stringify({completed,deadline,replacement,captured:completed+deadline}))
