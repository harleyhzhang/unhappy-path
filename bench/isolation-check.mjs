// Verify the actual per-run OS profile, including inheritance by grandchildren.
import fs from 'node:fs'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'
const root=path.resolve(import.meta.dirname,'..')
const c=JSON.parse(fs.readFileSync(path.join(root,'isolation.local.json')))
const bundle=path.join(c.workspace,'releases__kimi-k3__default__1'), app=path.join(bundle,'app')
const profile=path.join(bundle,'isolation.sb')
assert(fs.existsSync(profile),'Launch an isolated smoke run first')
const own=path.join(app,'.isolation-canary');fs.writeFileSync(own,'own-project-readable')
const sibling=path.join(c.workspace,'sibling-canary');fs.mkdirSync(sibling,{recursive:true});fs.writeFileSync(path.join(sibling,'secret'),'hidden sibling')
const tests=[
 ['own project', ['/bin/cat',own],true],
 ['evaluator', ['/bin/cat',path.join(root,'bench/grade.mjs')],false],
 ['fixture', ['/bin/cat',path.join(root,'tasks/releases/task.json')],false],
 ['sibling', ['/bin/cat',path.join(sibling,'secret')],false],
 ['inherited evaluator denial', [process.execPath,'-e',`require('node:fs').readFileSync(${JSON.stringify(path.join(root,'bench/grade.mjs'))})`],false],
 ['own build write', [process.execPath,'-e',`require('node:fs').writeFileSync(${JSON.stringify(own)},'ok')`],true],
 ['sibling write denial', [process.execPath,'-e',`require('node:fs').writeFileSync(${JSON.stringify(path.join(sibling,'secret'))},'bad')`],false],
]
for(const [name,args,ok] of tests){const r=spawnSync('/usr/bin/sandbox-exec',['-f',profile,...args],{cwd:app,encoding:'utf8'});assert.equal(r.status===0,ok,`${name}: ${r.stderr}`);console.log('PASS',name)}
fs.unlinkSync(own)
