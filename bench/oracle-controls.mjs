// Known-behavior integration controls, never model competitors or primary data.
// Prepare files during generation; serve/grade them only after subjects stop.
import fs from 'node:fs'
import path from 'node:path'
import {execFileSync} from 'node:child_process'
import assert from 'node:assert/strict'
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'runs-oracle-controls')
const style=`*{box-sizing:border-box}body{margin:0;background:#fff;color:#111;font:16px/1.5 Arial;overflow-wrap:anywhere}main{max-width:1000px;margin:auto;padding:20px;min-width:0}h1{font-size:28px;overflow-wrap:anywhere}h2{font-size:20px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}.card{min-width:0;min-height:600px;border:1px solid #777;padding:16px}.row{border-top:1px solid #777;padding:8px 0}dl{display:grid;grid-template-columns:6rem minmax(0,1fr);gap:4px 8px}dt{font-weight:bold}dd{margin:0;min-width:0;overflow-wrap:anywhere}.error{color:#800}button,input,select,textarea{font:inherit;min-height:44px;max-width:100%;border:1px solid #555;background:#fff;color:#111;padding:10px}button{cursor:pointer;min-width:100px}label{display:block;margin-top:12px}input,select,textarea{display:block;width:100%;min-width:0}textarea{min-height:90px}form{max-width:550px}.feedback{min-height:48px;margin-top:16px}button:disabled{opacity:.6}:focus-visible{outline:3px solid #0047aa;outline-offset:2px}@media(max-width:700px){.grid{grid-template-columns:minmax(0,1fr)}}.clip dd{white-space:nowrap;overflow:hidden}.contrast{color:#bbb}.spinner{position:fixed;right:10px;top:10px;background:#111;width:20px;height:20px;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`
function h(tag,text='',attrs={}){const e=document.createElement(tag);e.textContent=text;for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e}
function dataApp(C){
 const main=h('main');document.querySelector('#root').append(main);main.append(h('h1','Reference application'))
 if(C.defect==='contrast')main.classList.add('contrast')
 if(C.defect==='clip')main.classList.add('clip')
 if(C.defect==='motion')main.append(h('div','',{'class':'spinner','aria-hidden':'true'}))
 const grid=h('div','',{'class':'grid'});main.append(grid)
 for(const endpoint of C.paths){
  const pane=h('section','',{'class':'card','aria-label':endpoint}),heading=h('h2',endpoint),content=h('div');pane.append(heading,content);grid.append(pane)
  let version=0,controller,q='',timer
  const record=(data)=>{const dl=h('dl');for(const[k,v]of Object.entries(data)){if(k==='id')continue;dl.append(h('dt',k),h('dd',k.endsWith('Cents')?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v)/100):typeof v==='boolean'?(v?'Yes':'No'):String(v??'')))}return dl}
  const load=async()=>{
   const n=++version;if(C.defect!=='stale')controller?.abort();controller=new AbortController()
   pane.setAttribute('aria-busy','true');content.replaceChildren(h('p','Loading…'))
   try{
    const url=new URL(endpoint,location.href);if(C.search&&q)url.searchParams.set('q',q)
    const r=await fetch(url,{signal:controller.signal});if(!r.ok)throw Error('request failed');const data=await r.json()
    if(C.defect!=='stale'&&n!==version)return
    content.replaceChildren()
    if(Array.isArray(data)){
     content.append(h('p',`${data.length} records`))
     if(endpoint==='/api/attendees')content.append(h('p',`${data.filter(x=>x.checkedIn).length} checked in out of ${data.length}`))
     if(!data.length)content.append(h('p','No records found'))
     for(const x of data){const row=h('article','',{'class':'row'});row.append(record(x));content.append(row)}
    }else if(data&&typeof data==='object')content.append(record(data));else throw Error('invalid shape')
   }catch(e){
    if(e.name==='AbortError'||C.defect!=='stale'&&n!==version)return
    const error=h('div','',{'class':'error'});if(C.defect!=='announce')error.setAttribute('role','alert')
    const retry=h('button','Retry',{type:'button'});retry.onclick=load;error.append(h('p','Unable to load this section.'),retry);content.replaceChildren(error)
   }finally{if(C.defect==='stale'||n===version)pane.setAttribute('aria-busy','false')}
  }
  if(C.search){const label=h('label',C.search.label,{for:'q'}),input=h('input','',{id:'q',type:'search'});main.insertBefore(label,grid);main.insertBefore(input,grid);input.oninput=()=>{q=input.value;clearTimeout(timer);timer=setTimeout(load,100)}}
  load()
 }
}
function formApp(C){
 const main=h('main'),form=h('form'),status=h('div','',{'class':'feedback'});document.querySelector('#root').append(main);main.append(h('h1','Invite a teammate'),form)
 if(C.defect==='focus'){const s=h('style','*:focus,*:focus-visible{outline:none!important;box-shadow:none!important;outline-offset:0!important}');document.head.append(s)}
 for(const f of [{key:'name',label:'Full name',type:'text'},{key:'email',label:'Work email',type:'email'},{key:'role',label:'Role',type:'select'},{key:'note',label:'Welcome note',type:'textarea'}]){
  const field=h(f.type==='select'?'select':f.type==='textarea'?'textarea':'input','',{id:f.key,name:f.key});if(f.type!=='select'&&f.type!=='textarea')field.type=f.type
  if(f.type==='select')for(const role of ['viewer','editor','admin']){const o=h('option',role,{value:role});field.append(o)}
  if(f.key==='role')field.value='editor';else field.required=C.defect!=='invalid'
  form.append(h('label',f.label,{for:f.key}),field)
 }
 const button=h('button','Send invitation',{type:'submit'});form.append(button,status)
 let pending=false
 const feedback=(text,error=false)=>{status.textContent=text;status.setAttribute('role',error?'alert':'status')}
 form.onsubmit=async e=>{
  e.preventDefault();if(pending&&C.defect!=='double')return;pending=true;if(C.defect!=='double')button.disabled=true;feedback('Sending…')
  try{const body=Object.fromEntries(new FormData(form));const r=await fetch('/api/invitations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw Error('save failed');const data=await r.json();feedback('Invitation sent: '+data.code)}
  catch{feedback('Unable to send the invitation. Please try again.',true)}finally{pending=false;button.disabled=false}
 }
}
const cases=[['event','positive',null],['products','positive',null],['invite','positive',null],['event','clip','long'],['event','motion','motion'],['event','contrast','a11y'],['event','announce','announce'],['products','stale','stale'],['invite','double','double'],['invite','invalid','invalid'],['invite','focus','keyboard']]
fs.mkdirSync(dir,{recursive:true})
for(const[task,defect,expectedFailure]of cases){
 const id=`${task}__reference-${defect}__control__1`,base=path.join(dir,id),app=path.join(base,'app');fs.mkdirSync(app,{recursive:true})
 const t=JSON.parse(fs.readFileSync(path.join(root,'tasks',task,'task.json')))
 const config={defect,paths:Object.keys(t.fixture),search:t.search?{label:t.search.label,path:t.search.path}:null}
 const logic=task==='invite'?formApp:dataApp
 const html=`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reference control</title><style>${style}</style></head><body><div id="root"></div><script>${h.toString()};(${logic.toString()})(${JSON.stringify(config)})</script></body></html>`
 fs.writeFileSync(path.join(app,'package.json'),JSON.stringify({scripts:{build:'node build.cjs'}}))
 fs.writeFileSync(path.join(app,'build.cjs'),`const fs=require('node:fs');fs.mkdirSync('dist',{recursive:true});fs.writeFileSync('dist/index.html',${JSON.stringify(html)})`)
 fs.writeFileSync(path.join(base,'meta.json'),JSON.stringify({id,task,model:'reference-control',condition:defect,run:1,control:true,expectedFailure}))
}
if(process.argv.includes('--grade')){
 const procs=execFileSync('ps',['-axo','command'],{encoding:'utf8'}).split('\n')
 if(procs.some(c=>/^(?:\S*\/)?node\s+.*bench\/run\.mjs(?:\s|$)/.test(c.trim())))throw Error('Do not serve reference code while generation is active')
 execFileSync(process.execPath,[path.join(root,'bench/grade.mjs'),'--dir','runs-oracle-controls','--phase','interim','--jobs','1'],{stdio:'inherit'})
 for(const[task,defect,expectedFailure]of cases){const id=`${task}__reference-${defect}__control__1`,g=JSON.parse(fs.readFileSync(path.join(dir,id,'grade-interim.json')));assert(g.built&&g.gate,id+' must work normally');if(expectedFailure)assert.equal(g.pass[expectedFailure],false,id+' failed to detect the defect');else assert(Object.values(g.pass).every(Boolean),id+' rejected correct control: '+JSON.stringify(g.checks))}
 console.log('PASS all reference positives and targeted negative controls')
}else console.log('Prepared reference controls without serving them; use --grade only after generation ends')
