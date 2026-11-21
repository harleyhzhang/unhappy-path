import test from 'node:test'
import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {visibleControl} from './controls.mjs'
import {SNAPSHOT} from './page-probes.mjs'
test('retry lookup handles aria-hidden decorations and explicit accessible labels',async()=>{
 const browser=await chromium.launch({args:['--use-mock-keychain']})
 try{
  const page=await browser.newPage()
  await page.setContent('<div id="root"><button onclick="window.hit=1">Try again <span aria-hidden="true">↗</span></button></div>')
  const name=(await page.evaluate(SNAPSHOT)).buttons[0]
  assert.equal(await page.getByRole('button',{name,exact:true}).count(),0)
  await(await visibleControl(page,name)).click();assert.equal(await page.evaluate(()=>window.hit),1)
  await page.setContent('<div id="root"><button aria-label="Reload event details" onclick="window.hit=2">Try again</button></div>')
  await(await visibleControl(page,'Try again')).click();assert.equal(await page.evaluate(()=>window.hit),2)
 }finally{await browser.close()}
})
