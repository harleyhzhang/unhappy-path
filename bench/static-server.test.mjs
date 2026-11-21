import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {serve} from './static-server.mjs'

test('static server serves SPA routes and refuses evaluator symlinks and malformed paths',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'static-contract-')),dist=path.join(dir,'dist')
 fs.mkdirSync(dist);fs.writeFileSync(path.join(dist,'index.html'),'APP');fs.writeFileSync(path.join(dir,'fixture.txt'),'PRIVATE');fs.symlinkSync(path.join(dir,'fixture.txt'),path.join(dist,'leak'))
 const server=await serve(dist),base=`http://127.0.0.1:${server.address().port}`
 try{
  assert.equal(await(await fetch(base+'/')).text(),'APP')
  assert.equal(await(await fetch(base+'/settings')).text(),'APP')
  assert.equal((await fetch(base+'/leak')).status,403)
  assert.equal((await fetch(base+'/%E0%A4%A')).status,400)
  fs.symlinkSync(dist,path.join(dir,'linked-dist'))
  await assert.rejects(()=>serve(path.join(dir,'linked-dist')),/symlink/)
 }finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true})}
})
