import test from 'node:test'
import assert from 'node:assert/strict'
import {verdicts} from './verdicts.mjs'
const happy = () => ({final:{lines:['Form'],rootEmpty:false,busy:0},works:true,errors:[],axe:[]})
const save = (announced=[]) => ({found:true,announced,newText:[],kept:true,resent:true,stuck:false})
const failed = (announced=[]) => ({final:{lines:['Could not load'],rootEmpty:false,busy:0},errors:[],retry:{candidates:['Retry'],worked:true},announced})
test('missing save feedback fails announcement rather than omitting the category',()=>{
 const g=verdicts({kind:'form-create'},{happy:happy(),failsave:save()})
 assert.equal(g.pass.announce,false)
 assert.equal(g.checks.announce.save_error,false)
})
test('an error in a live region passes announcement',()=>{
 const g=verdicts({kind:'form-create'},{happy:happy(),failsave:save([{announced:true}])})
 assert.equal(g.pass.announce,true)
})
test('missing load feedback fails announcement',()=>{
 const g=verdicts({kind:'list'},{happy:happy(),failed:failed()})
 assert.equal(g.pass.announce,false)
})
test('edit forms must announce both load and save errors',()=>{
 const g=verdicts({kind:'form-edit'},{happy:happy(),failed:failed([{announced:true}]),failsave:save()})
 assert.equal(g.pass.announce,false)
 assert.equal(g.checks.announce.load_error,true)
 assert.equal(g.checks.announce.save_error,false)
})

test('compile failures can zero every applicable category, including derived checks',async()=>{
 const {applicableCategories}=await import('./verdicts.mjs')
 const list=applicableCategories({kind:'list',partial:[{},{}]})
 for(const s of ['recover','announce','a11y','partial0','partial1'])assert(list.includes(s))
 const form=applicableCategories({kind:'form-create'})
 assert(form.includes('announce'));assert(form.includes('keyboard'));assert(!form.includes('enter'));assert(!form.includes('recover'))
})
