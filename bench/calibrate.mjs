// Synthetic controls with known layout defects. These test the measuring code,
// not whether the benchmark's definition of quality is the right one.
import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {FIT, MOTION, SNAPSHOT} from './page-probes.mjs'
const browser = await chromium.launch({ args: ['--use-mock-keychain'] })
try {
const page = await browser.newPage({viewport:{width:320,height:640}})
const examples = [
 ['wrapped text', '<div style="width:200px;overflow-wrap:anywhere">'+ 'Word '.repeat(30)+'</div>', r=>r.pageScroll===0&&r.cut===0&&r.spilled===0],
 ['page overflow', '<div style="width:700px">Content</div>', r=>r.pageScroll>100],
 ['hidden text', '<div style="width:70px;white-space:nowrap;overflow:hidden">This is a much longer sentence</div>',r=>r.cut>0],
 ['ellipsis allowed', '<div style="width:70px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">This is a much longer sentence</div>',r=>r.cut===0],
 ['screen reader helper', '<span style="position:absolute;width:1px;height:1px;overflow:hidden">Search customers</span>',r=>r.cut===0],
 ['inner scroller measured', '<div style="width:200px;overflow:auto"><div style="width:600px">A wide table</div></div>',r=>r.hScrollers===1&&r.pageScroll===0],
 ['vertical clipping', '<div style="height:20px;width:200px;overflow:hidden">'+('A line<br>'.repeat(10))+'</div>',r=>r.cut>0],
 ['normal multiline', '<div style="width:100px">'+('A line<br>'.repeat(10))+'</div>',r=>r.cut===0],
]
for(const [name,html,check] of examples){await page.setContent('<style>body{margin:0;font:16px Arial}</style>'+html);const r=await page.evaluate(FIT);assert(check(r),name+': '+JSON.stringify(r));console.log('PASS',name)}
await page.emulateMedia({reducedMotion:'reduce'})
await page.setContent('<style>@keyframes spin{to{transform:rotate(360deg)}}div{width:30px;height:30px;background:red;animation:spin 1s linear infinite}</style><div></div>')
assert((await page.evaluate(MOTION)).length===1,'moving spinner detected')
await page.addStyleTag({content:'@media(prefers-reduced-motion:reduce){*{animation:none!important}}'})
assert((await page.evaluate(MOTION)).length===0,'motion opt-out detected')
console.log('PASS motion probes')
// Determinate business metrics do not mean an asynchronous operation is pending.
for (const [html, expected] of [
  ['<div role="progressbar" aria-valuenow="0" style="width:100px;height:12px">0% checked in</div>', 0],
  ['<progress value="0" max="100"></progress>', 0],
  ['<progress></progress>', 1],
  ['<div role="progressbar" style="width:100px;height:12px"></div>', 1],
  ['<div aria-busy="true">Loading</div>', 1],
]) {
  await page.setContent(html)
  assert.equal((await page.evaluate(SNAPSHOT)).busy, expected, html)
}
console.log('PASS determinate versus pending progress')
} finally {
  await browser.close()
}
