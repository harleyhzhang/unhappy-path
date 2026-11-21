import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {captureProject} from './capture-project.mjs'
test('capture rejects root links and preserves interior links without reading their targets',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'capture-contract-'))
 try{
  fs.mkdirSync(path.join(d,'source'));fs.writeFileSync(path.join(d,'private'),'PRIVATE');fs.symlinkSync(path.join(d,'private'),path.join(d,'source','link'))
  assert.equal(captureProject(path.join(d,'source'),path.join(d,'copy')),true)
  assert(fs.lstatSync(path.join(d,'copy','link')).isSymbolicLink())
  fs.symlinkSync(path.join(d,'source'),path.join(d,'root-link'))
  assert.equal(captureProject(path.join(d,'root-link'),path.join(d,'blocked')),false)
  assert(!fs.existsSync(path.join(d,'blocked')))
 }finally{fs.rmSync(d,{recursive:true,force:true})}
})
