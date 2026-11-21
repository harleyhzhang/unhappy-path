import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {buildApp} from './build-app.mjs'

test('compiler rebuilds source while evaluator files and coordinator secrets remain inaccessible',{skip:process.platform!=='darwin'},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'isolated-build-contract-')),app=path.join(dir,'source'),runtime=path.join(dir,'runtime')
 fs.mkdirSync(path.join(app,'dist'),{recursive:true});fs.mkdirSync(runtime)
 fs.writeFileSync(path.join(dir,'fixture.txt'),'EVALUATOR-CANARY')
 fs.writeFileSync(path.join(app,'dist/index.html'),'STALE')
 fs.writeFileSync(path.join(app,'package.json'),JSON.stringify({scripts:{build:'node build.cjs'}}))
 fs.writeFileSync(path.join(app,'build.cjs'),`const fs=require('node:fs');fs.readFileSync('package.json');if(process.env.BENCH_PRIVATE_CANARY)throw Error('environment leaked');let blocked=false;try{fs.readFileSync(${JSON.stringify(path.join(dir,'fixture.txt'))})}catch(e){blocked=['EPERM','EACCES'].includes(e.code)}if(!blocked)throw Error('evaluator read was not denied');let linked=false;try{fs.linkSync(${JSON.stringify(path.join(dir,'fixture.txt'))},'linked-fixture');linked=fs.readFileSync('linked-fixture','utf8')==='EVALUATOR-CANARY'}catch{}if(linked)throw Error('hard-link read bypass');fs.mkdirSync('dist');fs.writeFileSync('dist/index.html','FRESH')`)
 process.env.BENCH_PRIVATE_CANARY='not-a-real-secret'
 try{
  const result=await buildApp(app,runtime,dir)
  assert.equal(result.isolated,true)
  assert.equal(fs.readFileSync(path.join(app,'dist/index.html'),'utf8'),'FRESH')
  assert.equal(fs.readFileSync(path.join(dir,'generation-dist/index.html'),'utf8'),'STALE')
 } finally {delete process.env.BENCH_PRIVATE_CANARY;fs.rmSync(dir,{recursive:true,force:true})}
})

test('a real Vite/CSS app builds without reading ancestor PostCSS configuration',{skip:process.platform!=='darwin'},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'isolated-vite-contract-')),app=path.join(dir,'app'),runtime=path.join(dir,'runtime')
 fs.mkdirSync(runtime)
 fs.cpSync(new URL('../template/',import.meta.url),app,{recursive:true,dereference:false,verbatimSymlinks:true,mode:fs.constants.COPYFILE_FICLONE})
 fs.writeFileSync(path.join(dir,'postcss.config.cjs'),"throw new Error('ancestor configuration must not be loaded')")
 fs.writeFileSync(path.join(app,'src/App.jsx'),'import "./probe.css";export default function App(){return <main>Probe</main>}')
 fs.writeFileSync(path.join(app,'src/probe.css'),'main { color: rgb(12, 34, 56); }')
 try{await buildApp(app,runtime,dir);assert.match(fs.readFileSync(path.join(app,'dist/index.html'),'utf8'),/<html/);assert(fs.readdirSync(path.join(app,'dist/assets')).some(n=>n.endsWith('.css')))}
 finally{fs.rmSync(dir,{recursive:true,force:true})}
})
