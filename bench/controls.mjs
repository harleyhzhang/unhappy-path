// Match the visible control text that SNAPSHOT observed, including decorative text
// excluded from its accessible name. Recovery is then verified by real GETs/data.
export async function visibleControl(page,name) {
  const controls=page.locator('button,[role="button"],a')
  const index=await controls.evaluateAll((els,label)=>els.findIndex(el=>{
    const r=el.getBoundingClientRect(),s=getComputedStyle(el)
    return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&Number(s.opacity)>.05&&
      (el.innerText||el.getAttribute('aria-label')||'').trim()===label
  }),name)
  return index<0?null:controls.nth(index)
}
