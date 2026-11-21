// Stress phase: build each generated app, serve it, then replay it under
// changed conditions while intercepting its API calls from outside.
// All verdicts come from browser measurements. No model judges anything.
// Usage: node bench/grade.mjs [--only <substring>] [--video] [--rebuild]
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { createRequire } from 'node:module'
import { chromium } from 'playwright'
import * as P from './page-probes.mjs'
import { verdicts, APPLIES, applicableCategories } from './verdicts.mjs'
import { buildApp } from './build-app.mjs'
import { serve } from './static-server.mjs'
import { visibleControl } from './controls.mjs'

const root = path.resolve(import.meta.dirname, '..')
const RUNS = process.argv.includes('--dir') ? process.argv[process.argv.indexOf('--dir') + 1] : 'runs-budget'
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? (process.argv[i + 1] ?? true) : d }
const only = arg('only', '')
const phase = arg('phase', 'final')
if (!['interim', 'final'].includes(phase)) throw new Error('phase must be interim or final')
const gradeName = phase === 'interim' ? 'grade-interim.json' : 'grade.json'
const measurementSources = Object.fromEntries(['grade.mjs', 'page-probes.mjs', 'verdicts.mjs', 'build-app.mjs', 'static-server.mjs', 'controls.mjs'].map((name) => [name, createHash('sha256').update(fs.readFileSync(path.join(root, 'bench', name))).digest('hex')]))
const video = process.argv.includes('--video')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const AXE = createRequire(import.meta.url).resolve('axe-core/axe.min.js')

// Same data shape, awkward content: 4x-long text, one unbreakable 45-character word
// (the length of a long email address or identifier), 40x the rows.
function hostile(data, task) {
  const stretch = (item, i) => Object.fromEntries(Object.entries(item).map(([k, v]) => {
    if (typeof v !== 'string' || /^\d{4}-\d{2}-\d{2}/.test(v) || (task.enumFields || []).includes(k)) return [k, v]
    if (v.includes('@')) return [k, 'x'.repeat(45) + i + v.slice(v.indexOf('@'))]
    return [k, Array(4).fill(v).join(' ') + ' ' + 'W'.repeat(45)]
  }))
  return Array.isArray(data) ? Array.from({ length: data.length * 40 }, (_, i) => ({ ...stretch(data[i % data.length], i), id: i + 1 })) : stretch(data, 0)
}

// One browser session against the app with a scripted backend.
async function open(browser, url, task, { mode = 'happy', viewport = { width: 1280, height: 800 }, reducedMotion, dir, name }) {
  const ctx = await browser.newContext({ viewport, reducedMotion, ...(video ? { recordVideo: { dir: path.join(dir, 'video', name), size: viewport } } : {}) })
  const page = await ctx.newPage()
  const s = { mode, healed: false, pending: 0, gets: 0, submits: [], lastDone: Date.now(), errors: [], submitDelay: 200, submitFail: false, qDelay: null, served: [] }
  page.on('pageerror', (e) => s.errors.push(String(e).slice(0, 200)))
  await page.addInitScript(P.CLS_INIT)
  await page.route((u) => new URL(u).pathname.startsWith('/api/'), async (route) => {
    const req = route.request(), u = new URL(req.url()), p = u.pathname, method = req.method()
    let status = 200, body, delay = 150, raw = null
    s.pending++
    if (method !== 'GET') {
      const sub = task.submit
      let sent = null
      try { sent = JSON.parse(req.postData() || 'null') } catch {}
      if (!sub || p !== sub.path || method !== sub.method) { status = 404; body = { error: 'not found' } }
      else {
        s.submits.push(sent)
        delay = s.submitDelay
        if (s.submitFail) { status = 500; body = { error: 'Internal Server Error' } }
        else { status = sub.status || 200; body = sub.echo ? sent : sub.response }
      }
    } else {
      s.gets++
      const spec = task.fixture[p]
      const q = (u.searchParams.get('q') || '').toLowerCase()
      if (spec === undefined) { status = 404; body = { error: 'not found' } }
      else {
        body = spec.search ? (q ? spec.search.all.filter((x) => spec.search.fields.some((f) => String(x[f]).toLowerCase().includes(q))).slice(0, 20) : spec.search.all.slice(0, spec.search.initial)) : spec
        if (s.mode === 'empty' && task.emptyEndpoints.includes(p) && !q) body = []
        if (s.mode === 'long') body = hostile(body, task)
        if (s.mode === 'slow') delay = 3000
        if (s.mode === 'failed' && !s.healed) { status = 500; body = { error: 'Internal Server Error' } }
        if (s.mode.startsWith('partial') && p === task.partial[Number(s.mode.slice(7))].fail) { status = 500; body = { error: 'Internal Server Error' } }
        if (s.mode === 'garbage') raw = '<html><body><h1>502 Bad Gateway</h1></body></html>'
        if (s.qDelay && q) delay = s.qDelay(q)
        s.served.push(q)
      }
    }
    await sleep(delay)
    await route.fulfill(raw ? { status: 200, contentType: 'text/html', body: raw } : { status, contentType: 'application/json', body: JSON.stringify(body) }).catch(() => {})
    s.pending--; s.lastDone = Date.now()
  })
  const hasLoad = Object.keys(task.fixture).length > 0
  const settle = async (maxMs = 15_000, quiet = 1000) => {
    if (!hasLoad && !s.gets && !s.submits.length) return sleep(800)
    const end = Date.now() + maxMs
    while (Date.now() < end) { if (s.pending === 0 && (s.gets || s.submits.length) && Date.now() - s.lastDone > quiet) return; await sleep(100) }
  }
  const snap = () => page.evaluate(P.SNAPSHOT)
  const shot = async (label) => { fs.mkdirSync(path.join(dir, 'shots'), { recursive: true }); await page.screenshot({ path: path.join(dir, 'shots', (label || name) + '.png') }).catch(() => {}) }
  await page.goto(url, { waitUntil: 'commit' })
  return { page, ctx, s, settle, snap, shot, close: () => ctx.close() }
}

// --- finding things the way a user would: by visible label, then placeholder, then field name ---
async function findField(page, f) {
  const esc = f.key.replace(/"/g, '')
  for (const loc of [page.getByLabel(f.label, { exact: false }), page.getByPlaceholder(new RegExp(f.label, 'i')), page.locator(`[name*="${esc}" i],[id*="${esc}" i]`)]) {
    for (const l of await loc.all().catch(() => [])) if (await l.isVisible().catch(() => false) && await l.isEditable().catch(() => false)) return l
  }
  return null
}
async function findSubmit(page, sub) {
  for (const loc of [page.getByRole('button', { name: new RegExp(sub.button, 'i') }), page.locator('button[type=submit],input[type=submit]'), page.locator('form button')]) {
    const l = loc.last(); if (await l.isVisible().catch(() => false)) return l
  }
  return null
}
async function findSearch(page, search) {
  for (const loc of [page.getByLabel(search.label, { exact: false }), page.getByRole('searchbox'), page.getByPlaceholder(/search/i), page.locator('input[type=search],input[type=text],input:not([type])')]) {
    for (const l of await loc.all().catch(() => [])) if (await l.isVisible().catch(() => false) && await l.isEditable().catch(() => false)) return l
  }
  return null
}
async function fillForm(page, sub) {
  for (const f of sub.fields) { const l = await findField(page, f); if (!l) return false; await l.fill(f.value) }
  return true
}
// Has the page's real content loaded? Lists: known rows visible. Edit forms: the saved value is in its field.
async function loaded(page, task, lines) {
  if (task.loaded) { const l = await findField(page, task.loaded); return !!l && (await l.inputValue().catch(() => '')) === task.loaded.value }
  const text = (lines || (await page.evaluate(P.SNAPSHOT)).lines).join('\n')
  return task.probes.every((p) => text.includes(p))
}
const names = (task, lines) => { const sp = task.fixture[task.search.path].search; const t = lines.join('\n'); return sp.all.map((x) => x[task.search.nameField]).filter((n) => t.includes(n)).sort() }
const matching = (task, q) => { const sp = task.fixture[task.search.path].search; return sp.all.filter((x) => sp.fields.some((f) => String(x[f]).toLowerCase().includes(q))).map((x) => x[task.search.nameField]).sort() }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

const SC = {
  async happy(o, task) {
    await o.settle()
    const out = { final: await o.snap(), fit: await o.page.evaluate(P.FIT), cls: await o.page.evaluate(() => window.__cls) }
    out.loaded = await loaded(o.page, task, out.final.lines)
    await o.shot()
    await o.page.addScriptTag({ path: AXE })
    out.axe = await o.page.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'] })).violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })))
    // Does the main interaction work at all? (The gate.)
    out.works = out.loaded
    if (task.kind === 'search') {
      const box = await findSearch(o.page, task.search), q = task.search.first + task.search.rest
      if (!box) out.works = false
      else { await box.pressSequentially(q, { delay: 80 }); await sleep(600); await o.settle(8000); out.searchShown = names(task, (await o.snap()).lines); out.works &&= same(out.searchShown, matching(task, q)) }
    }
    if (task.submit) {
      const ok = await fillForm(o.page, task.submit), btn = await findSubmit(o.page, task.submit)
      if (!ok || !btn) out.works = false
      else {
        await btn.click(); await sleep(400); await o.settle(8000)
        const sent = o.s.submits[0] || {}
        out.sent = sent
        out.works &&= o.s.submits.length >= 1 && task.submit.fields.every((f) => sent[f.key] === f.value)
        if (task.submit.successProbe) out.works &&= (await o.snap()).lines.join('\n').includes(task.submit.successProbe)
      }
    }
    return out
  },
  async slow(o) { await sleep(1500); const loading = await o.snap(); await o.shot('slow-loading'); await o.settle(); return { loading, final: await o.snap(), cls: await o.page.evaluate(() => window.__cls) } },
  async empty(o) { await o.settle(); await o.shot(); return { final: await o.snap() } },
  async long(o) { await o.settle(); await o.shot(); return { final: await o.snap(), fit: await o.page.evaluate(P.FIT) } },
  async narrow(o, task) { await o.settle(); await o.shot(); const final = await o.snap(); return { final, fit: await o.page.evaluate(P.FIT), loaded: await loaded(o.page, task, final.lines) } },
  async failed(o, task, known) {
    await sleep(10_000)
    const out = { final: await o.snap() }
    await o.shot()
    out.announced = await o.page.evaluate(P.ANNOUNCED, out.final.lines.filter((l) => !known.lines.includes(l)))
    // Recovery: the backend comes back. Is there a control, shown only in the failed state, that reloads the data?
    o.s.healed = true
    const candidates = [...new Set(out.final.buttons.filter((b) => !known.buttons.includes(b)))].slice(0, 4)
    out.retry = { candidates, worked: false }
    for (const name of candidates) {
      // A page with several failed sections may show the same control more than once: use each.
      for (let i = 0; i < 4; i++) {
        const control = await visibleControl(o.page, name)
        if (!control || !(await control.isVisible().catch(() => false))) break
        const g0 = o.s.gets
        await control.click({ timeout: 3000 }).catch(() => {})
        await sleep(300)
        if (o.s.gets > g0) await o.settle(8000); else break
      }
      await sleep(500)
      if (await loaded(o.page, task)) { out.retry.worked = true; out.retry.control = name; break }
    }
    return out
  },
  // Keyboard only: Tab through the page and watch where focus goes and whether it can be seen.
  async keyboard(o) {
    await o.settle()
    // Start from an unfocused page, so a field that focuses itself on load is measured like any other.
    await o.page.evaluate(() => document.activeElement && document.activeElement.blur()); await sleep(350)
    const prep = await o.page.evaluate(P.KEY_PREP)
    const seen = {}
    for (let i = 0; i < Math.min(prep.count * 2 + 10, 70); i++) {
      await o.page.keyboard.press('Tab'); await sleep(220)
      const r = await o.page.evaluate(P.KEY_STEP)
      if (r && !(r.i in seen)) seen[r.i] = r
    }
    return { ...prep, reached: Object.keys(seen).length, unreached: prep.labels.filter((_, i) => !(i in seen) && !prep.radioPeers[i]?.some((j) => j in seen)), invisibleFocus: Object.values(seen).filter((r) => !r.changed).map((r) => prep.labels[r.i]) }
  },
  // Reduce-motion setting on: is anything still moving continuously, while loading or after?
  async motion(o) { await sleep(1500); const during = await o.page.evaluate(P.MOTION); await o.settle(); await sleep(1500); return { during, after: await o.page.evaluate(P.MOTION) } },
  // Out-of-order replies: the reply to an older, shorter query arrives after the reply to the final query.
  async stale(o, task) {
    await o.settle()
    const box = await findSearch(o.page, task.search), q = task.search.first + task.search.rest
    if (!box) return { shown: null }
    o.s.qDelay = (x) => (x === q ? 150 : 2500)
    await box.pressSequentially(task.search.first, { delay: 60 }); await sleep(700)
    await box.pressSequentially(task.search.rest, { delay: 60 })
    await sleep(4500); await o.settle(6000)
    await o.shot()
    return { shown: names(task, (await o.snap()).lines), expected: matching(task, q), queries: [...new Set(o.s.served)] }
  },
  // Double submit: the save is slow and the user clicks the button twice.
  async double(o, task) {
    await o.settle()
    const ok = await fillForm(o.page, task.submit), btn = await findSubmit(o.page, task.submit)
    if (!ok || !btn) return { requests: null }
    o.s.submitDelay = 2000
    await btn.scrollIntoViewIfNeeded()
    const b = await btn.boundingBox()
    await o.page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await sleep(150)
    await o.page.mouse.click(b.x + b.width / 2, b.y + b.height / 2)
    await sleep(3500)
    return { requests: o.s.submits.length }
  },
  // Failed save: the server rejects the save. Is the user told, is their input kept, and does trying again work?
  async failsave(o, task) {
    await o.settle()
    const ok = await fillForm(o.page, task.submit), btn = await findSubmit(o.page, task.submit)
    if (!ok || !btn) return { found: false }
    const before = await o.snap()
    o.s.submitFail = true
    await btn.click(); await sleep(400); await o.settle(6000); await sleep(500)
    const after = await o.snap()
    await o.shot()
    const announced = await o.page.evaluate(P.ANNOUNCED, after.lines.filter((l) => !before.lines.includes(l)))
    const kept = []
    for (const f of task.submit.fields) { const l = await findField(o.page, f); kept.push(!!l && (await l.inputValue().catch(() => '')) === f.value) }
    o.s.submitFail = false
    const n = o.s.submits.length, again = await findSubmit(o.page, task.submit)
    if (again) { await again.click({ timeout: 3000 }).catch(() => {}); await sleep(400); await o.settle(6000) }
    const last = o.s.submits[o.s.submits.length - 1] || {}
    return { found: true, announced, newText: after.lines.filter((l) => !before.lines.includes(l)), kept: kept.every(Boolean), resent: o.s.submits.length > n && task.submit.fields.every((f) => last[f.key] === f.value), stuck: after.busy > 0 }
  },
  // The backend answers 200 with an HTML error page instead of data (a proxy or CDN error).
  async garbage(o) { await sleep(5000); await o.shot(); return { final: await o.snap() } },
  // One of the page's two requests fails; the other succeeds.
  async partial0(o) { await sleep(5000); await o.shot(); return { final: await o.snap() } },
  async partial1(o) { await sleep(5000); await o.shot(); return { final: await o.snap() } },
  // 200% zoom (WCAG 1.4.4): the same page in half the width.
  async zoom(o, task) { await o.settle(); await o.shot(); const final = await o.snap(); return { final, fit: await o.page.evaluate(P.FIT), loaded: await loaded(o.page, task, final.lines) } },
  // User text-spacing settings (WCAG 1.4.12).
  async spacing(o) { await o.settle(); await o.page.addStyleTag({ content: P.TEXT_SPACING }); await sleep(400); await o.shot(); return { fit: await o.page.evaluate(P.FIT) } },
  // Keyboard: pressing Enter in a single-line field submits the form.
  async enter(o, task) {
    await o.settle()
    if (!(await fillForm(o.page, task.submit))) return { requests: null }
    const first = await findField(o.page, task.submit.fields[0])
    await first.focus(); await o.page.keyboard.press('Enter'); await sleep(1500)
    return { requests: o.s.submits.length }
  },
  // Invalid save: a required field is empty. Nothing should be sent.
  async invalid(o, task) {
    await o.settle()
    const btn = await findSubmit(o.page, task.submit)
    if (!btn) return { requests: null }
    for (const f of task.submit.fields) { const l = await findField(o.page, f); if (l) await l.fill(f.key === task.submit.requiredKey ? '' : f.value) }
    if (!task.submit.fields.some((f) => f.key === task.submit.requiredKey)) { const l = await findField(o.page, { label: task.submit.requiredKey, key: task.submit.requiredKey }); if (l) await l.fill('') }
    await btn.click({ timeout: 3000 }).catch(() => {}); await sleep(1200)
    return { requests: o.s.submits.length }
  },
}

const MODE = { slow: 'slow', failed: 'failed', empty: 'empty', long: 'long', motion: 'slow', garbage: 'garbage', partial: 'partial' }
const VIEW = { narrow: { width: 320, height: 640 }, zoom: { width: 640, height: 400 } }

const browser = await chromium.launch({ args: ['--use-mock-keychain'] })
try {
async function gradeOne(id) {
  const base = path.join(root, RUNS, id)
  if (!fs.existsSync(path.join(base, 'meta.json'))) return
  if (process.argv.includes('--new') && fs.existsSync(path.join(base, gradeName))) return
  const meta = JSON.parse(fs.readFileSync(path.join(base, 'meta.json')))
  const task = JSON.parse(fs.readFileSync(path.join(root, 'tasks', meta.task, 'task.json')))
  const app = meta.artifact_source ? path.resolve(root, meta.artifact_source) : path.join(base, 'app')
  let result, server, buildReady=false
  try {
    const relativeSource = path.relative(root, fs.realpathSync(app))
    if (!/^runs(?:-[a-z0-9-]+)?\//.test(relativeSource) || relativeSource.split(path.sep).includes('..')) throw new Error('Artifact source must remain inside a run directory')
    const isolation = JSON.parse(fs.readFileSync(path.join(root, 'isolation.local.json')))
    await buildApp(app, path.dirname(isolation.workspace), root)
    buildReady=true
    server = await serve(path.join(app, 'dist'))
    const url = `http://127.0.0.1:${server.address().port}/`
    const go = async (name, ...extra) => {
      const o = await open(browser, url, task, { mode: MODE[name] || (name.startsWith('partial') ? name : 'happy'), dir: phase === 'interim' ? path.join(base, 'interim') : base, name, viewport: VIEW[name], reducedMotion: name === 'motion' ? 'reduce' : undefined })
      try { return { ...(await SC[name](o, task, ...extra)), errors: o.s.errors } } catch (e) { return { crashed: String(e).slice(0, 300), errors: o.s.errors } } finally { await o.close() }
    }
    // A scenario that could not find the form or search box it was meant to operate says nothing about the
    // app: on a busy machine the page may not have rendered yet. Try again, alone, before accepting it.
    const inoperable = (x) => x.requests === null || x.found === false || x.shown === null
    const retryInoperable = async (r, names) => {
      for (const n of names) for (let i = 0; i < 3 && r[n] && inoperable(r[n]); i++) { await sleep(1500); r[n] = { ...(await go(n)), harnessRetries: i + 1 } }
    }
    const want = [...APPLIES[task.kind], ...(task.partial ? task.partial.map((_, i) => 'partial' + i) : [])], r = {}
    const first = ['happy', ...want.filter((n) => n !== 'failed')]
    const got = await Promise.all(first.map((n) => go(n)))
    first.forEach((n, i) => (r[n] = got[i]))
    await retryInoperable(r, first.filter((n) => n !== 'happy'))
    const broken = first.filter((n) => r[n].crashed)
    if (broken.length) throw new Error('scenario error: ' + broken.map((n) => `${n}: ${r[n].crashed}`).join(' | '))
    // 'failed' runs last so its retry test knows which controls exist in every other state.
    if (want.includes('failed')) { const st = [r.happy.final, r.slow?.loading, r.slow?.final, r.empty?.final].filter(Boolean); r.failed = await go('failed', { buttons: st.flatMap((x) => x.buttons), lines: st.flatMap((x) => x.lines) }) }
    result = { built: true, ...verdicts(task, r), raw: r }
  } catch (e) {
    result = { built: false, gate: false, pass: Object.fromEntries(applicableCategories(task).map(s=>[s,false])), error_kind: buildReady ? 'measurement' : 'compile', error: String(e.stderr || e.stack || e).slice(0, 900) }
  } finally {
    server?.close()
  }
  const gradeFile = path.join(base, gradeName)
  if (fs.existsSync(gradeFile)) {
    const history = path.join(base, 'grade-history')
    fs.mkdirSync(history, { recursive: true })
    fs.renameSync(gradeFile, path.join(history, `${phase}-${Date.now()}.json`))
  }
  result.measurement = {
    at: new Date().toISOString(),
    phase,
    sources: measurementSources
  }
  fs.writeFileSync(gradeFile, JSON.stringify(result, null, 1))
  console.log(id, result.built ? (result.gate ? JSON.stringify(result.pass) : 'GATE FAILED') : 'ERROR ' + result.error.slice(0, 200))
}
const taskSet = arg('task-set', '')
const ids = fs.readdirSync(path.join(root, RUNS)).sort().filter((id) => {
  if (only && !id.includes(only)) return false
  if (!taskSet) return true
  const file = path.join(root, RUNS, id, 'meta.json')
  if (!fs.existsSync(file)) return false
  const meta = JSON.parse(fs.readFileSync(file))
  const task = JSON.parse(fs.readFileSync(path.join(root, 'tasks', meta.task, 'task.json')))
  return (task.set || 'dev') === taskSet
})
await Promise.all(Array.from({ length: Number(arg('jobs', 4)) }, async () => { while (ids.length) await gradeOne(ids.shift()) }))
} finally {
  await browser.close()
}
