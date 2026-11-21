import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'

// Dev-only mock API driven by mock/api.json.
//   "/api/things": <json>                         GET returns the JSON
//   "/api/things": { "__search": { all, initial, fields } }
//                                                 GET returns the first `initial` items, or with ?q=
//                                                 the items whose `fields` contain the text
//   "POST /api/things": { status, body }          returns `body`; with "echo": true returns the request body
function mockApi() {
  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost')
        if (!url.pathname.startsWith('/api/')) return next()
        const table = JSON.parse(fs.readFileSync(new URL('./mock/api.json', import.meta.url)))
        const send = (status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)) }
        if (req.method === 'GET') {
          const entry = table[url.pathname]
          if (entry === undefined) return send(404, { error: 'not found' })
          if (entry && entry.__search) {
            const { all, initial, fields } = entry.__search
            const q = (url.searchParams.get('q') || '').toLowerCase()
            return send(200, q ? all.filter((x) => fields.some((f) => String(x[f]).toLowerCase().includes(q))).slice(0, 20) : all.slice(0, initial))
          }
          return send(200, entry)
        }
        const entry = table[`${req.method} ${url.pathname}`]
        if (!entry) return send(404, { error: 'not found' })
        let raw = ''
        req.on('data', (c) => (raw += c))
        req.on('end', () => send(entry.status || 200, entry.echo ? JSON.parse(raw || '{}') : entry.body))
      })
    },
  }
}

export default defineConfig({ plugins: [react(), mockApi()] })
