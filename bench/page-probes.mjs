// Functions that run inside the page. Each must be self-contained.

// What the user can see right now.
export const SNAPSHOT = () => {
  const visible = (el) => {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el)
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05
  }
  const lines = (document.body.innerText || '').split('\n').map((l) => l.trim().replace(/\s+/g, ' ')).filter(Boolean)
  const animated = document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.target && visible(a.effect.target)).length
  const busy = [...document.querySelectorAll('[aria-busy="true"],[role="progressbar"]:not([aria-valuenow]),progress:not([value])')].filter(visible).length
  // Visible boxes that carry no text: skeleton placeholders, spinners, shimmer blocks.
  const boxes = [...document.body.querySelectorAll('*')].filter((el) => {
    if (!visible(el) || el.children.length || (el.textContent || '').trim()) return false
    if (['SCRIPT', 'STYLE', 'BR', 'HR', 'INPUT', 'IMG'].includes(el.tagName)) return false
    const s = getComputedStyle(el)
    return s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.backgroundImage !== 'none' || s.borderTopWidth !== '0px'
  }).length
  const buttons = [...document.querySelectorAll('button,[role="button"],a')].filter(visible).map((b) => (b.innerText || b.getAttribute('aria-label') || '').trim()).filter(Boolean)
  const rootEl = document.getElementById('root')
  return { lines, animated, busy, boxes, buttons, rootEmpty: !rootEl || rootEl.children.length === 0 }
}

export const CLS_INIT = () => {
  window.__cls = 0
  try {
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value })
      .observe({ type: 'layout-shift', buffered: true })
  } catch {}
}

// Does the content fit the screen it is on?
export const FIT = () => {
  const vw = window.innerWidth
  const visible = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const scrolls = (el) => { const o = getComputedStyle(el).overflowX; return o === 'auto' || o === 'scroll' }
  const inScroller = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) if (scrolls(p)) return true; return false }
  // Ignore screen-reader-only helpers (1px boxes): they are meant to be invisible.
  const tiny = (el) => { const r = el.getBoundingClientRect(); return r.width <= 2 || r.height <= 2 }
  const describe = (el) => { const r = el.getBoundingClientRect(); return `${el.tagName.toLowerCase()} "${(el.innerText || el.getAttribute('aria-label') || el.type || '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}` }
  const pageScroll = document.scrollingElement.scrollWidth - vw
  // Inner boxes that actually scroll sideways right now.
  const hScrollers = [...document.body.querySelectorAll('*')].filter((el) => visible(el) && scrolls(el) && el.scrollWidth > el.clientWidth + 1).length
  // Text fit, measured on the text itself so decorative clipping never counts:
  //   cut     = part of a line of text is hidden by a clipping box (and not shortened with an ellipsis)
  //   spilled = a line of text runs outside the box that is supposed to contain it
  const TOL = 3 // px; absorbs sub-pixel rounding and italic overhang
  const cutEls = new Set(), spillEls = new Set(), allRects = [], candidates = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  for (let node; (node = walker.nextNode());) {
    // Readable text only: symbol-only runs (star ratings, ornaments) are often clipped on purpose.
    if ((node.textContent.match(/[\p{L}\p{N}]/gu) || []).length < 2) continue
    const host = node.parentElement
    if (!host || !visible(host) || tiny(host) || inScroller(host)) continue
    if (['OPTION', 'SELECT', 'TEXTAREA', 'SCRIPT', 'STYLE', 'TITLE'].includes(host.tagName)) continue
    range.selectNodeContents(node)
    const rects = [...range.getClientRects()].filter((r) => r.width > 0)
    if (!rects.length) continue
    for (const r of rects) allRects.push({ node, r })
    const left = Math.min(...rects.map((r) => r.left)), right = Math.max(...rects.map((r) => r.right))
    const top = Math.min(...rects.map((r) => r.top)), bottom = Math.max(...rects.map((r) => r.bottom))
    // Vertical cut: a fixed-height box hides the lower lines (deliberate line clamping is allowed).
    for (let p = host; p && p !== document.documentElement; p = p.parentElement) {
      const cs = getComputedStyle(p)
      if (tiny(p) || (cs.webkitLineClamp && cs.webkitLineClamp !== 'none')) break
      if (cs.overflowY === 'hidden' || cs.overflowY === 'clip') {
        const r = p.getBoundingClientRect()
        if (bottom > r.bottom + 6 || top < r.top - 6) cutEls.add(host)
        break
      }
      if (cs.overflowY === 'auto' || cs.overflowY === 'scroll') break
    }
    let box = host
    while (box && getComputedStyle(box).display.startsWith('inline') && box !== document.body) box = box.parentElement
    let ellipsis = false, skip = false
    for (let p = host; p && p !== document.documentElement; p = p.parentElement) {
      const cs = getComputedStyle(p)
      if (tiny(p)) { skip = true; break }
      if (cs.textOverflow === 'ellipsis') ellipsis = true
      if (cs.overflowX === 'hidden' || cs.overflowX === 'clip') {
        const r = p.getBoundingClientRect()
        if (!ellipsis && (right > r.right + TOL || left < r.left - TOL)) cutEls.add(host)
        break
      }
    }
    if (skip) continue
    if (box) { const r = box.getBoundingClientRect(); if (!ellipsis && !cutEls.has(host) && right > r.right + TOL) candidates.push({ node, host, box, rects, right }) }
  }
  // Text that overruns its own box only counts as spilled if the damage is visible:
  // it leaves the card or panel it sits in, or it runs into other text.
  const painted = (el) => { const cs = getComputedStyle(el); return cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderRightWidth !== '0px' || cs.boxShadow !== 'none' }
  for (const c of candidates) {
    let frame = c.box
    while (frame && frame !== document.body && !painted(frame)) frame = frame.parentElement
    const leaves = frame && frame !== document.body && c.right > frame.getBoundingClientRect().right + TOL
    const collides = c.rects.some((a) => allRects.some(({ node, r: b }) => node !== c.node && Math.min(a.right, b.right) - Math.max(a.left, b.left) > TOL && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > TOL))
    if (leaves || collides) spillEls.add(c.host)
  }
  // Target size, WCAG 2.2 SC 2.5.8 (AA): a control under 24x24 CSS px fails only if a 24px box
  // centred on it would touch another control. A wrapping or associated label counts as the control's area.
  const area = (el) => {
    const label = el.closest('label') || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`))
    const rs = [el, label].filter(Boolean).map((x) => x.getBoundingClientRect())
    return rs.reduce((a, r) => (Math.min(r.width, r.height) > Math.min(a.width, a.height) ? r : a))
  }
  const targets = [...document.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,[role="button"]')]
    .filter((el) => visible(el) && !tiny(el)).map((el) => ({ el, r: area(el) }))
  const grow = (r) => { const cx = r.left + r.width / 2, cy = r.top + r.height / 2, w = Math.max(r.width, 24), h = Math.max(r.height, 24); return { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2 } }
  const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
  const smallEls = targets.filter((t) => Math.min(t.r.width, t.r.height) < 24 && !t.el.matches('a[href]'))
    .filter((t) => targets.some((o) => o !== t && !o.el.contains(t.el) && !t.el.contains(o.el) && hit(grow(t.r), o.r))).map((t) => t.el)
  return {
    pageScroll, hScrollers, cut: cutEls.size, spilled: spillEls.size, small: smallEls.length,
    cutExamples: [...cutEls].slice(0, 4).map(describe), spilledExamples: [...spillEls].slice(0, 4).map(describe), smallExamples: smallEls.slice(0, 5).map(describe),
  }
}

// Keyboard: list the first 30 controls, remember how each looks unfocused, and find mouse-only controls.
export const KEY_PREP = () => {
  const visible = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const NATIVE = 'a[href],button,input:not([type=hidden]),select,textarea,summary'
  const ANY = NATIVE + ',[tabindex],[role=button],[role=link],[role=tab],[role=checkbox],[role=switch],[role=menuitem],[contenteditable=true]'
  const controls = [...document.querySelectorAll(NATIVE + ',[tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled && el.getAttribute('tabindex') !== '-1' && (visible(el) || (el.labels && [...el.labels].some(visible)))).slice(0, 30)
  // The places a focus indicator can reasonably appear for a control.
  window.__uhpAround = (el) => [el, el.parentElement, el.parentElement?.parentElement, ...(el.labels ? [...el.labels] : []), el.nextElementSibling, el.previousElementSibling].filter(Boolean)
  window.__uhpSig = (el) => window.__uhpAround(el).map((x) => { const s = getComputedStyle(x); return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.outlineOffset, s.boxShadow, s.borderTopColor, s.borderBottomColor, s.borderBottomWidth, s.backgroundColor, s.color, s.textDecorationLine, s.filter, s.transform].join('|') }).join('||')
  const label = (el) => `${el.tagName.toLowerCase()} "${(el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.name || el.type || '').trim().replace(/\s+/g, ' ').slice(0, 30)}"`
  window.__uhpBase = controls.map((el, i) => { el.setAttribute('data-uhp', i); return window.__uhpSig(el) })
  const radioPeers = controls.map((el) => (el.type === 'radio' && el.name ? controls.map((o, j) => (o.type === 'radio' && o.name === el.name ? j : -1)).filter((j) => j >= 0) : null))
  // Mouse-only controls: things styled as clickable that a keyboard cannot reach.
  const mouseOnly = [...document.body.querySelectorAll('*')].filter((el) => {
    if (!visible(el) || getComputedStyle(el).cursor !== 'pointer') return false
    if (el.matches(ANY + ',label') || el.closest(ANY + ',label') || el.querySelector(ANY)) return false
    return !(el.parentElement && getComputedStyle(el.parentElement).cursor === 'pointer')
  }).map(label)
  return { count: controls.length, labels: controls.map(label), radioPeers, mouseOnly }
}
export const KEY_STEP = () => {
  const a = document.activeElement
  if (!a || !a.hasAttribute('data-uhp')) return null
  const i = Number(a.getAttribute('data-uhp'))
  return { i, changed: window.__uhpSig(a) !== window.__uhpBase[i] }
}

// Continuous movement still running: spinning, sliding, shimmering, resizing. Fades and colour changes are not movement.
export const MOTION = () => {
  const MOVES = /transform|translate|rotate|scale|offset|^left$|^top$|^right$|^bottom$|margin|width|height|backgroundPosition|strokeDashoffset/i
  const visible = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05 }
  return document.getAnimations().filter((a) => {
    if (a.playState !== 'running' || !a.effect?.target || !visible(a.effect.target)) return false
    const t = a.effect.getComputedTiming()
    if (!(t.iterations === Infinity || t.activeDuration > 3000)) return false
    return a.effect.getKeyframes().some((k) => Object.keys(k).some((p) => MOVES.test(p)))
  }).map((a) => `${a.effect.target.tagName.toLowerCase()}.${String(a.effect.target.className).slice(0, 30)} ${a.animationName || 'transition'}`).slice(0, 5)
}

// WCAG 1.4.12 text spacing: the user's own spacing settings.
export const TEXT_SPACING = `* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`

// WCAG 4.1.3 status messages: is a message that just appeared exposed to assistive technology?
// Yes if it sits in a live region (role alert/status/log or aria-live), or focus was moved to it,
// or a form field points at it as its error or description.
export const ANNOUNCED = (lines) => {
  const live = '[role=alert],[role=status],[role=log],[aria-live]:not([aria-live=off]),output'
  const pointed = new Set([...document.querySelectorAll('[aria-describedby],[aria-errormessage]')].flatMap((f) => `${f.getAttribute('aria-describedby') || ''} ${f.getAttribute('aria-errormessage') || ''}`.split(/\s+/)).filter(Boolean))
  const out = []
  for (const line of lines) {
    const els = [...document.body.querySelectorAll('*')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() && line.includes(n.textContent.trim().replace(/\s+/g, ' '))))
    if (!els.length) continue
    out.push({ line: line.slice(0, 60), announced: els.some((el) => { if (el.closest(live) || el.contains(document.activeElement) && document.activeElement !== document.body) return true; for (let p = el; p; p = p.parentElement) if (p.id && pointed.has(p.id)) return true; if (document.activeElement && document.activeElement !== document.body && document.activeElement.contains(el)) return true; return false }) })
  }
  return out
}
