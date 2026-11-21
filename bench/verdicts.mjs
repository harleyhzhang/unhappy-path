export const APPLIES = {
  list: ['slow', 'failed', 'garbage', 'empty', 'long', 'narrow', 'zoom', 'spacing', 'keyboard', 'motion'],
  search: ['slow', 'failed', 'garbage', 'empty', 'long', 'narrow', 'zoom', 'spacing', 'keyboard', 'motion', 'stale'],
  'form-edit': ['slow', 'failed', 'garbage', 'narrow', 'zoom', 'spacing', 'keyboard', 'motion', 'double', 'failsave', 'invalid', 'enter'],
  'form-create': ['narrow', 'zoom', 'spacing', 'keyboard', 'motion', 'double', 'failsave', 'invalid', 'enter'],
}
export function applicableCategories(task) {
  const wanted=APPLIES[task.kind]
  if(!wanted)throw new Error('Unknown task kind')
  return [...new Set([...wanted.filter(x=>x!=='enter'), 'a11y', ...(wanted.includes('failed')?['recover']:[]), ...(wanted.includes('failed')||wanted.includes('failsave')?['announce']:[]), ...(task.partial||[]).map((_,i)=>'partial'+i)])]
}
// Pure verdict calculation, separated from browser orchestration for contract tests.
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const JUNK = /\b(undefined|NaN|null)\b|\[object Object\]|Unexpected token|is not valid JSON|SyntaxError|TypeError|Cannot read propert/
const clean = (snapshot) => !snapshot.lines.some((l) => JUNK.test(l))
const minus = (a, ...bs) => a.filter((l) => !bs.some((b) => b.includes(l)))

export function verdicts(task, r) {
  const H = r.happy.final, L = r.slow?.loading || { lines: [], buttons: [] }, F = r.slow?.final || H
  const emptyUnique = r.empty ? minus(r.empty.final.lines, L.lines, H.lines) : []   // said only when there is no data
  const transient = minus(L.lines, F.lines)                                          // said only while loading
  const stuck = (snapshot) => (transient.length > 0 && transient.every((l) => snapshot.lines.includes(l))) || snapshot.busy > 0
  const v = {}, ev = { transient, emptyUnique }
  if (r.slow) v.slow = {
    loading_signal: transient.length > 0 || L.animated > 0 || L.busy > 0 || L.boxes > F.boxes,
    no_false_empty: !L.lines.some((l) => emptyUnique.includes(l)),
    stable_layout: r.slow.cls < 0.1,
  }
  if (r.failed) {
    const X = r.failed.final, errUnique = minus(X.lines, L.lines, H.lines)             // said only when the request failed
    ev.errUnique = errUnique; ev.retry = r.failed.retry
    v.failed = {
      no_crash: !X.rootEmpty && r.failed.errors.length === 0,
      error_shown: errUnique.length > 0,
      not_shown_as_empty: errUnique.length === 0 || minus(errUnique, emptyUnique).length > 0,
      not_stuck_loading: !stuck(X),
      no_raw_error_text: clean(X),
    }
    v.recover = { retry_control: r.failed.retry.candidates.length > 0, retry_works: r.failed.retry.worked }
  }
  if (r.empty) v.empty = { no_junk_values: clean(r.empty.final), empty_message: emptyUnique.length > 0, not_stuck_loading: !stuck(r.empty.final), no_crash: !r.empty.final.rootEmpty && r.empty.errors.length === 0 }
  if (r.long) {
    const g = r.long.fit; ev.long = g
    v.long = {
      no_crash: !r.long.final.rootEmpty && r.long.errors.length === 0,
      no_sideways_scroll: g.pageScroll <= 1,
      // Long values must wrap or shorten in place, not push the rest of the row out of view.
      no_new_inner_scroll: g.hScrollers <= r.happy.fit.hScrollers,
      no_text_cut_or_spilled: g.cut === 0 && g.spilled === 0,
    }
  }
  if (r.narrow) {
    const n = r.narrow.fit; ev.narrow = n
    v.narrow = { no_sideways_scroll: n.pageScroll <= 1, no_text_cut_or_spilled: n.cut === 0 && n.spilled === 0, controls_big_enough: n.small === 0, content_present: r.narrow.loaded || task.kind === 'form-create' }
  }
  if (r.garbage) {
    const G = r.garbage.final, gUnique = minus(G.lines, L.lines, H.lines); ev.garbage = gUnique.slice(0, 4)
    v.garbage = { no_raw_error_text: clean(G), no_crash: !G.rootEmpty && r.garbage.errors.length === 0, error_shown: gUnique.length > 0 && minus(gUnique, emptyUnique).length > 0, not_stuck_loading: !stuck(G) }
  }
  // Partial failure, both ways round: the list fails while the summary loads, and the reverse.
  ;(task.partial || []).forEach((pt, i) => {
    const T = r['partial' + i].final, tUnique = minus(T.lines, L.lines, H.lines); ev['partial' + i] = tUnique.slice(0, 4)
    v['partial' + i] = { no_raw_error_text: clean(T), working_part_shown: T.lines.join('\n').includes(pt.probe), error_shown: tUnique.length > 0, no_crash: !T.rootEmpty && r['partial' + i].errors.length === 0 }
  })
  for (const k of ['zoom', 'spacing']) if (r[k]) {
    const f = r[k].fit; ev[k] = f
    v[k] = { no_sideways_scroll: f.pageScroll <= 1, no_text_cut_or_spilled: f.cut === 0 && f.spilled === 0, ...(k === 'zoom' ? { content_present: r.zoom.loaded || task.kind === 'form-create' } : {}) }
  }
  const ann = {}
  if (r.failed) ann.load_error = !!r.failed.announced?.some((a) => a.announced)
  if (r.failsave) ann.save_error = !!r.failsave.found && !!r.failsave.announced?.some((a) => a.announced)
  if (Object.keys(ann).length) { v.announce = ann; ev.announce = { load: r.failed?.announced, save: r.failsave?.announced } }
  if (r.keyboard) {
    const k = r.keyboard; ev.keyboard = { controls: k.count, unreached: k.unreached.slice(0, 5), invisibleFocus: k.invisibleFocus.slice(0, 5), mouseOnly: k.mouseOnly.slice(0, 5) }
    v.keyboard = { all_reachable: k.unreached.length === 0, focus_visible: k.invisibleFocus.length === 0, no_mouse_only_controls: k.mouseOnly.length === 0, ...(r.enter ? { enter_submits: r.enter.requests === 1 } : {}) }
  }
  if (r.motion) { ev.motion = r.motion; v.motion = { still_while_loading: r.motion.during.length === 0, still_after: r.motion.after.length === 0 } }
  ev.axe = r.happy.axe
  v.a11y = { no_serious_violations: r.happy.axe.length === 0 }
  if (r.stale) { ev.stale = r.stale; v.stale = { latest_query_shown: !!r.stale.shown && same(r.stale.shown, r.stale.expected) } }
  if (r.double) { ev.double = r.double; v.double = { one_request: r.double.requests === 1 }
    if (r.double.requests === 0) throw new Error('double-submit test sent no request: harness could not press the button') }
  if (r.failsave) { ev.failsave = r.failsave; v.failsave = { error_shown: !!r.failsave.found && r.failsave.newText.length > 0, input_kept: !!r.failsave.kept, retry_works: !!r.failsave.resent, not_stuck: !r.failsave.stuck } }
  if (r.invalid) { ev.invalid = r.invalid; v.invalid = { nothing_sent: r.invalid.requests === 0 } }
  const pass = Object.fromEntries(Object.entries(v).map(([k, c]) => [k, Object.values(c).every(Boolean)]))
  return { gate: !!r.happy.works && r.happy.errors.length === 0, pass, checks: v, evidence: ev }
}

