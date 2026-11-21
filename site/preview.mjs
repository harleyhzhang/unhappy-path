// Screenshots of the built site for review. Serves site/dist itself and closes everything afterwards.
// Usage: node site/preview.mjs [light|dark]
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { chromium } from 'playwright'
const root = path.join(import.meta.dirname, 'dist'), out = path.join(import.meta.dirname, 'shots-preview')
const theme = process.argv[2] || 'light'
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.csv': 'text/csv' }
const server = http.createServer((req, res) => {
  let p = path.normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (p.endsWith('/')) p += 'index.html'
  const file = path.join(root, p)
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const url = 'http://127.0.0.1:' + server.address().port + '/'
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
try {
  for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: name === 'mobile' ? 2 : 1, colorScheme: theme })
    const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.evaluate(async () => { for (const img of document.images) img.loading = 'eager'; await document.fonts.ready })
    await page.waitForTimeout(700)
    const ids = name === 'desktop' ? ['top', 'leaderboard', 'breakdown', 'examples', 'runs', 'stresses', 'tasks', 'method', 'limits', 'cite'] : ['top', 'leaderboard', 'runs']
    for (const id of ids) {
      await page.evaluate((i) => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.getElementById(i); scrollTo(0, i === 'top' ? 0 : e.getBoundingClientRect().top + scrollY - 76) }, id)
      await page.waitForTimeout(450)
      await page.screenshot({ path: path.join(out, theme + '-' + name + '-' + id + '.png') })
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    await page.addScriptTag({ path: path.join(import.meta.dirname, '..', 'node_modules', 'axe-core', 'axe.min.js') })
    const axe = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'] })).violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id + ' x' + v.nodes.length + ' ' + v.nodes[0].target.join(' ')))
    console.log(name, theme, 'axe serious/critical:', axe.length ? axe : 'none')
    const wide = overflow > 0 ? await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.heat-scroll,.thumbs')).slice(0, 6).map((e) => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right))) : []
    console.log(name, theme, 'errors:', errors.length ? errors : 'none', 'sideways overflow px:', overflow, wide)
    await page.close()
  }
} finally { await browser.close(); server.close() }
