// Rasterises the SVG figures to 2x PNG (for venues that do not accept SVG).
// Usage: node paper/render_png.mjs
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
const root = path.resolve(import.meta.dirname)
const browser = await chromium.launch()
try {
  for (const dir of ['figures', 'figures-dark']) {
    const out = path.join(root, dir, 'png'); fs.mkdirSync(out, { recursive: true })
    for (const f of fs.readdirSync(path.join(root, dir)).filter((x) => x.endsWith('.svg'))) {
      const svg = fs.readFileSync(path.join(root, dir, f), 'utf8')
      const [, w, h] = svg.match(/width='(\d+)' height='(\d+)'/)
      const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 2 })
      await page.setContent('<body style="margin:0">' + svg + '</body>')
      await page.screenshot({ path: path.join(out, f.replace('.svg', '.png')) })
      await page.close()
    }
  }
} finally { await browser.close() }
console.log('rendered')

