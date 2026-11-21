const D = JSON.parse(document.getElementById('data').textContent)
const $ = (id) => document.getElementById(id)
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e }
const pct = (v) => Math.round(v * 100)
const NAME = Object.fromEntries(D.models.map((m) => [m.id, m.name]))
const LABEL = D.labels
const SHORT = { recover: 'Recover', garbage: 'Garbage', partial: 'Partial', long: 'Long', narrow: 'Narrow', motion: 'Motion', a11y: 'Audit', announce: 'Announce', slow: 'Slow', failed: 'Failed', empty: 'Empty', zoom: 'Zoom', spacing: 'Spacing', keyboard: 'Keyboard', stale: 'Stale', double: 'Double', failsave: 'Save fail', invalid: 'Invalid' }
const CATS = [...D.stakes, ...D.harder]
const cat = (s) => (s.startsWith('partial') ? 'partial' : s)
const state = { cond: 'default', model: 'gpt-6.1-sol', task: 'account', econd: 'default', rep: 1, shot: 'partial0', pair: 0 }
const runOf = (m, t, c, n) => D.runs.find((r) => r.model === m && r.task === t && r.cond === c && r.rep === n)

// theme and nav
$('theme').onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; localStorage.setItem('uhp-theme', t); drawWall() }
addEventListener('scroll', () => $('nav').classList.toggle('stuck', scrollY > 8), { passive: true })

// shared prompt toggle
function syncSeg() {
  document.querySelectorAll('[data-seg="cond"] button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === state.cond)))
}
document.querySelectorAll('[data-seg="cond"] button').forEach((b) => (b.onclick = () => { state.cond = b.dataset.v; syncSeg(); leaderboard(); heat() }))

// leaderboard
function leaderboard() {
  const c = state.cond
  const rows = [...D.models].sort((a, b) => D.overall[b.id][c].harder - D.overall[a.id][c].harder)
  const body = $('lb'); const fresh = !body.children.length
  if (fresh) for (const m of D.models) {
    const tr = el('tr'); tr.dataset.m = m.id
    tr.innerHTML = '<td class="n mono"></td><td class="m"></td><td class="s"><b></b><small></small></td><td class="t"><div class="track"><div class="bar"></div><div class="whisk"></div></div></td><td class="r"></td><td class="r"></td>'
    body.append(tr)
  }
  rows.forEach((m, i) => {
    const tr = body.querySelector('[data-m="' + m.id + '"]'), o = D.overall[m.id][c]
    body.append(tr)
    tr.classList.toggle('top', i === 0)
    tr.children[0].textContent = i + 1
    tr.children[1].innerHTML = m.name + (m.id === 'claude-fable-5.2' ? '<sup>†</sup>' : '')
    tr.querySelector('.s b').textContent = (o.harder * 100).toFixed(1) + '%'
    tr.querySelector('.s small').textContent = pct(o.lo) + '–' + pct(o.hi)
    tr.querySelector('.bar').style.width = o.harder * 100 + '%'
    const w = tr.querySelector('.whisk'); w.style.left = o.lo * 100 + '%'; w.style.width = Math.max((o.hi - o.lo) * 100, 0.4) + '%'
    tr.children[4].textContent = pct(o.stakes) + '%'
    tr.children[5].textContent = o.median_min.toFixed(1) + ' min' + (o.deadline ? ' *' : '')
    tr.children[5].title = o.deadline ? o.deadline + ' of 18 runs were captured at the 20-minute limit' : ''
  })
}

// breakdown heat table
function shade(v) {
  if (v < 0.5) return 'color-mix(in srgb, var(--fail) ' + Math.round((1 - v * 2) * 78 + 6) + '%, transparent)'
  return 'color-mix(in srgb, var(--pass) ' + Math.round((v * 2 - 1) * 46 + 6) + '%, transparent)'
}
function heat() {
  const t = $('heat'); t.innerHTML = ''
  const order = [...D.models].sort((a, b) => D.overall[b.id].default.harder - D.overall[a.id].default.harder)
  const cols = [...D.harder, null, ...D.stakes]
  const g = el('tr'); g.append(el('th'), Object.assign(el('th', 'grp', 'Harder stresses'), { colSpan: D.harder.length }), el('th', 'gap'), Object.assign(el('th', 'grp', 'Table stakes'), { colSpan: D.stakes.length })); t.append(g)
  const h = el('tr'); h.append(el('th'))
  for (const k of cols) { const th = k ? el('th', '', '<abbr>' + SHORT[k] + '</abbr>') : el('th', 'gap'); if (k) { th.scope = 'col'; th.firstChild.title = LABEL[k] } h.append(th) }
  t.append(h)
  for (const m of order) {
    const tr = el('tr'); tr.append(el('th', 'row', m.name))
    for (const k of cols) {
      if (!k) { tr.append(el('td', 'gap')); continue }
      const v = D.categories[m.id + '|' + state.cond][k]
      const td = el('td', v == null ? 'na' : '', v == null ? '·' : pct(v))
      if (v != null) { td.style.background = shade(v); td.title = m.name + ', ' + LABEL[k] + ': ' + pct(v) + '% of apps pass' }
      tr.append(td)
    }
    t.append(tr)
  }
}

// verdict wall
const wall = { cells: [], cw: 0, ch: 0 }
function drawWall() {
  const cv = $('wall'), box = cv.parentElement.getBoundingClientRect(), dpr = devicePixelRatio || 1
  const order = [...D.models].sort((a, b) => D.overall[b.id].default.harder - D.overall[a.id].default.harder)
  const groupGap = 14, condGap = 5, perModel = 36
  const cw = (box.width - groupGap * 6 - condGap * 7) / (perModel * 7), rows = 15
  const ch = Math.max(5, Math.min(9, cw * 1.55)), H = rows * ch
  cv.width = box.width * dpr; cv.height = H * dpr; cv.style.height = H + 'px'
  const g = cv.getContext('2d'); g.scale(dpr, dpr); g.clearRect(0, 0, box.width, H)
  const css = getComputedStyle(document.documentElement), FAIL = css.getPropertyValue('--fail').trim(), QUIET = css.getPropertyValue('--quiet').trim()
  wall.cells = []; wall.cw = cw; wall.ch = ch
  order.forEach((m, mi) => {
    ['default', 'told'].forEach((c, ci) => {
      const runs = D.runs.filter((r) => r.model === m.id && r.cond === c).sort((a, b) => a.harder - b.harder || a.task.localeCompare(b.task))
      runs.forEach((r, ri) => {
        const x = mi * (perModel * cw + groupGap + condGap) + ci * (18 * cw + condGap) + ri * cw
        const keys = Object.keys(r.pass).sort((a, b) => Number(r.pass[a]) - Number(r.pass[b]))
        keys.forEach((k, ki) => {
          const y = H - (ki + 1) * ch
          g.fillStyle = r.pass[k] ? QUIET : FAIL
          g.fillRect(x + 0.5, y + 0.5, Math.max(cw - 1, 1.2), ch - 1)
          wall.cells.push({ x, y, r, k })
        })
      })
    })
  })
  const lab = $('wall-labels'); lab.innerHTML = ''
  lab.style.gridTemplateColumns = 'repeat(7, ' + (perModel * cw + condGap) + 'px)'; lab.style.columnGap = groupGap + 'px'
  for (const m of order) lab.append(el('div', '', m.name + '<small>default · production</small>'))
  $('wall-count').textContent = D.counts.verdicts.toLocaleString('en-US')
}
const tip = $('tip')
function hit(e) {
  const b = $('wall').getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top
  return wall.cells.find((c) => x >= c.x && x < c.x + wall.cw && y >= c.y && y < c.y + wall.ch)
}
$('wall').addEventListener('mousemove', (e) => {
  const c = hit(e)
  if (!c) return tip.classList.remove('on')
  tip.innerHTML = '<b>' + NAME[c.r.model] + '</b> · ' + c.r.task + ' · ' + (c.r.cond === 'told' ? 'production' : 'default') + ' · run ' + c.r.rep + '<br>' + LABEL[cat(c.k)] + ': ' + (c.r.pass[c.k] ? 'pass' : 'fail')
  tip.style.left = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 12) + 'px'; tip.style.top = e.clientY - 52 + 'px'; tip.classList.add('on')
})
$('wall').addEventListener('mouseleave', () => tip.classList.remove('on'))
$('wall').addEventListener('click', (e) => {
  const c = hit(e); if (!c) return
  Object.assign(state, { model: c.r.model, task: c.r.task, econd: c.r.cond, rep: c.r.rep, shot: shotFor(c.k, c.r) })
  explorer(); $('runs').scrollIntoView()
})
addEventListener('resize', drawWall)

// examples
function pairs() {
  const tabs = $('pair-tabs'); tabs.innerHTML = ''
  D.pairs.forEach((p, i) => { const b = el('button', 'chip', p.tab); b.setAttribute('aria-pressed', String(i === state.pair)); b.onclick = () => { state.pair = i; pairs() }; tabs.append(b) })
  const p = D.pairs[state.pair], box = $('pair'); box.innerHTML = ''
  const grid = el('div', 'pair')
  for (const s of p.shots) {
    const f = el('figure', 'shot')
    f.innerHTML = '<div class="frame"><div class="bar3"><i></i><i></i><i></i></div><img loading="lazy" src="shots/' + s.run + '/' + s.shot + '.webp" alt="' + s.alt + '"' + (p.phone ? ' style="object-fit:contain;aspect-ratio:16/10;background:var(--bg)"' : '') + '></div><figcaption><span>' + s.label + '</span><span class="verdict ' + (s.ok ? 'ok' : 'no') + '">' + s.verdict + '</span></figcaption>'
    grid.append(f)
  }
  box.append(grid, el('p', 'pair-note', p.note))
}

// run explorer
const SHOT_LABEL = { happy: 'Normal', 'slow-loading': 'Slow', failed: 'Failed', empty: 'Empty', garbage: 'Garbage', partial0: 'Partial A', partial1: 'Partial B', long: 'Long', narrow: 'Narrow', zoom: 'Zoom', spacing: 'Spacing' }
const SHOT_ORDER = Object.keys(SHOT_LABEL)
const shotKey = (s) => (s === 'slow-loading' ? 'slow' : s)
function shotFor(k, r) { const want = k === 'slow' ? 'slow-loading' : k === 'recover' || k === 'announce' ? 'failed' : k; return (D.shots[r.id] || []).includes(want) ? want : 'happy' }
function options(id, items, key, label) {
  const box = $(id); box.innerHTML = ''
  for (const it of items) { const b = el('button', 'opt', label(it)); b.setAttribute('aria-pressed', String(state[key] === it)); b.onclick = () => { state[key] = it; explorer() }; box.append(b) }
}
function explorer() {
  options('ex-model', D.models.map((m) => m.id), 'model', (m) => NAME[m])
  options('ex-task', D.tasks, 'task', (t) => t)
  options('ex-cond', ['default', 'told'], 'econd', (c) => (c === 'told' ? 'production' : 'default'))
  options('ex-rep', [1, 2, 3], 'rep', (n) => 'run ' + n)
  const r = runOf(state.model, state.task, state.econd, state.rep), shots = SHOT_ORDER.filter((s) => (D.shots[r.id] || []).includes(s))
  if (!shots.includes(state.shot)) state.shot = shots.includes('happy') ? 'happy' : shots[0]
  $('ex-title').textContent = NAME[r.model] + ' · ' + r.task
  const mins = Math.floor(r.seconds / 60), secs = String(r.seconds % 60).padStart(2, '0')
  $('ex-meta').textContent = 'harder ' + pct(r.harder) + '% · built in ' + mins + ':' + secs + (r.status === 'deadline' ? ' · captured at the limit' : '') + (r.gate ? '' : ' · failed the gate')
  const img = $('ex-img')
  if (state.shot) { img.src = 'shots/' + r.id + '/' + state.shot + '.webp'; img.alt = NAME[r.model] + ' ' + r.task + ' app, ' + SHOT_LABEL[state.shot] + ' condition'; img.style.objectFit = state.shot === 'narrow' ? 'contain' : 'cover' }
  const th = $('ex-thumbs'); th.innerHTML = ''
  for (const s of shots) {
    const k = shotKey(s), ok = s === 'happy' ? r.gate : r.pass[k]
    const b = el('button', 'thumb ' + (ok === undefined ? '' : ok ? 'ok' : 'no'), '<i></i>' + SHOT_LABEL[s]); b.setAttribute('aria-pressed', String(s === state.shot)); b.onclick = () => { state.shot = s; explorer() }; th.append(b)
  }
  const ch = $('ex-checks'); ch.innerHTML = ''
  const keys = Object.keys(r.pass).sort((a, b) => CATS.indexOf(cat(b)) - CATS.indexOf(cat(a)))
  for (const k of keys.reverse().sort((a, b) => Number(r.pass[a]) - Number(r.pass[b]))) {
    const failed = (r.failed_checks[k] || []).map((x) => x.replace(/_/g, ' '))
    const name = LABEL[cat(k)] + (k === 'partial0' ? ' A' : k === 'partial1' ? ' B' : '')
    const why = failed.length ? '<small>' + failed.join(' · ') + '</small>' : !r.pass[k] && !r.gate ? '<small>gate failed</small>' : ''
    ch.append(el('div', 'check' + (r.pass[k] ? '' : ' no'), '<b>' + name + '</b>' + why))
  }
}

// stresses and tasks
function rules() {
  for (const r of D.rules) $(D.harder.includes(r.id) ? 'rules-hard' : 'rules-stakes').append(el('div', 'rule', '<b>' + LABEL[r.id] + '</b><span><em>' + r.condition + '.</em> ' + r.rule + '</span>'))
  const grid = $('tasks-grid')
  for (const t of D.taskInfo) {
    const d = el('div', 'task')
    d.innerHTML = '<div class="frame"><div class="bar3"><i></i><i></i><i></i></div><img loading="lazy" src="shots/' + t.run + '/happy.webp" alt="An app built for the ' + t.id + ' task"></div><h3>' + t.title + '</h3><p>' + t.text + '</p><span class="label">' + t.kind + ' · ' + t.n + ' stresses · shown: ' + NAME[t.run.split('__')[1]] + '</span>'
    d.querySelector('.frame').style.cursor = 'pointer'
    d.querySelector('.frame').onclick = () => { const [task, model, cond, rep] = t.run.split('__'); Object.assign(state, { task, model, econd: cond, rep: Number(rep), shot: 'happy' }); explorer(); $('runs').scrollIntoView() }
    grid.append(d)
  }
}

syncSeg(); leaderboard(); heat(); pairs(); explorer(); rules()
document.fonts.ready.then(drawWall); drawWall()
