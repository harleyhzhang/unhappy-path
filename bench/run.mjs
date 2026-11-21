// Build phase: for each (task, model, run) give the model a fresh copy of the
// template plus the task brief, and let it build the app headlessly.
// Usage: node bench/run.mjs --models a,b --tasks x,y --runs 3 --concurrency 4 [--condition default|told]
import fs from 'node:fs'
import path from 'node:path'
import {captureStatus} from './run-policy.mjs'
import {captureProject} from './capture-project.mjs'
import { spawn, execFileSync } from 'node:child_process'

const root = path.resolve(import.meta.dirname, '..')
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d }
const tasks = arg('tasks', fs.readdirSync(path.join(root, 'tasks')).join(',')).split(',')
const models = arg('models', '').split(',').filter(Boolean)
const runs = Number(arg('runs', 3))
const concurrency = Number(arg('concurrency', 4))
const condition = arg('condition', 'default')
const timeoutMs = Number(arg('timeout-min', 20)) * 60_000
const maxCycles = Number(arg('attempt-cycles', 4))
const allowDeadline = process.argv.includes('--capture-on-timeout')
if (!Number.isInteger(maxCycles) || maxCycles < 1 || maxCycles > 4) throw new Error('attempt-cycles must be 1–4')
// routes.local.json maps a public model name to the local model slugs that can serve it, in order.
const routes = JSON.parse(fs.readFileSync(path.join(root, 'routes.local.json')))
const outputDir = arg('out', 'runs')
if (!/^runs(?:-[a-z0-9-]+)?$/.test(outputDir)) throw new Error('Invalid output directory')
// --isolation-config selects another private *.local.json, e.g. a model served by a separate local router.
const isolationFile = arg('isolation-config', 'isolation.local.json')
if (!/^isolation(?:\.[a-z0-9-]+)?\.local\.json$/.test(isolationFile)) throw new Error('Invalid isolation config name')
const isolation = process.argv.includes('--isolate') ? JSON.parse(fs.readFileSync(path.join(root, isolationFile))) : null
const codexHome = isolation?.home || path.join(root, 'codex-home')
if (!isolation && !process.argv.includes('--allow-exposed')) throw new Error('Builds require --isolate; evaluator files must be unreadable')
if (!isolation && outputDir === 'runs-isolated') throw new Error('Exposed runs cannot use the isolated output directory')

// Every run must start from the same installed template; a missing install silently changes the task.
if (!fs.existsSync(path.join(root, 'template', 'node_modules', '.package-lock.json'))) throw new Error('template/node_modules is missing; run npm ci in template/ first')

const PROMPT = {
  default: 'Read BRIEF.md in this directory and build the app it describes. Work only inside this directory.',
  told: 'Read BRIEF.md in this directory and build the app it describes. Work only inside this directory. Make it production quality: it should hold up under slow or failing requests, missing or very long data, small screens, and keyboard and screen-reader use.',
}[condition]

function prepare(dir, task, port) {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(dir), { recursive: true })
  execFileSync('cp', ['-Rc', path.join(root, 'template'), dir]) // APFS clone, node_modules included
  fs.copyFileSync(path.join(root, 'tasks', task, 'BRIEF.md'), path.join(dir, 'BRIEF.md'))
  fs.copyFileSync(path.join(root, 'tasks', task, 'mock.json'), path.join(dir, 'mock', 'api.json'))
  // Each run gets its own dev-server port so parallel runs can never see each other's app.
  const cfg = path.join(dir, 'vite.config.js')
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace('plugins: [react(), mockApi()]', `plugins: [react(), mockApi()], server: { host: '127.0.0.1', port: ${port}, strictPort: true }`))
}

function attempt(dir, slug, logFile) {
  return new Promise((resolve) => {
    const started = Date.now()
    const out = fs.createWriteStream(logFile)
    const cliArgs = [
      'exec', '--disable', 'apps', '--disable', 'plugins', '-m', slug, '--skip-git-repo-check', '--json', '-C', dir,
      // Isolated runs inherit the outer OS filesystem policy; nested Seatbelt is unavailable.
      '-s', isolation ? 'danger-full-access' : 'workspace-write', '-c', 'sandbox_workspace_write.network_access=true',
      PROMPT,
    ]
    let attemptHome = codexHome, attemptProfile = isolation?.profile
    if (isolation) {
      const bundle = path.dirname(dir)
      attemptHome = path.join(bundle, 'codex-home')
      fs.rmSync(attemptHome, { recursive: true, force: true })
      fs.mkdirSync(path.join(attemptHome, 'fakehome'), { recursive: true, mode: 0o700 })
      for (const name of ['auth.json', 'models.json']) fs.copyFileSync(path.join(codexHome, name), path.join(attemptHome, name))
      fs.chmodSync(path.join(attemptHome, 'auth.json'), 0o600)
      fs.writeFileSync(path.join(attemptHome, 'config.toml'), fs.readFileSync(path.join(codexHome, 'config.toml'), 'utf8').replaceAll(codexHome, attemptHome))
      fs.mkdirSync(path.join(attemptHome, 'tmp'), { recursive: true, mode: 0o700 })
      attemptProfile = path.join(bundle, 'isolation.sb')
      fs.writeFileSync(attemptProfile, fs.readFileSync(isolation.profile, 'utf8') +
        `\n(deny signal)\n(allow signal (target self) (target children))\n(deny file-write*)\n(allow file-write* (subpath "/private/tmp") (subpath "/private/var/folders") (subpath "/dev"))\n(deny file-read* file-write* (subpath "${path.dirname(isolation.workspace)}"))\n(allow file-read* file-write* (subpath "${bundle}"))\n(allow file-read-metadata (subpath "${path.dirname(isolation.workspace)}"))\n`)
    }
    const p = spawn(isolation ? '/usr/bin/sandbox-exec' : 'codex', isolation ? ['-f', attemptProfile, 'codex', ...cliArgs] : cliArgs, {
      env: { ...process.env, CODEX_HOME: attemptHome, HOME: path.join(attemptHome, 'fakehome'), TMPDIR: path.join(attemptHome, 'tmp') },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true, // own process group, so leftover dev servers can be cleaned up
    })
    let buf = '', usage = null, failed = null, steps = 0
    p.stdout.on('data', (d) => {
      out.write(d); buf += d
      let i
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1)
        try {
          const e = JSON.parse(line)
          if (e.type === 'turn.completed') usage = e.usage
          if (e.type === 'turn.failed' || e.type === 'error') failed = JSON.stringify(e).slice(0, 400)
          if (e.type === 'item.completed') steps++
        } catch {}
      }
    })
    p.stderr.on('data', () => {})
    const killGroup = () => { try { process.kill(-p.pid, 'SIGKILL') } catch {} }
    const timer = setTimeout(() => { failed = 'timeout'; killGroup() }, timeoutMs)
    p.on('close', (code, signal) => {
      clearTimeout(timer); out.end(); killGroup()
      if (signal && !failed) failed = `process terminated by ${signal}`
      resolve({ signal, ok: code === 0 && !!usage && !failed, code, usage, failed, steps, seconds: Math.round((Date.now() - started) / 1000) })
    })
  })
}

const LIMIT = /limit|quota|rate|capacity|overloaded|429|503|timeout|Reconnecting|process terminated/i
async function job({ task, model, n }) {
  const id = `${task}__${model}__${condition}__${n}`
  const base = path.join(root, outputDir, id)
  fs.mkdirSync(base, { recursive: true })
  const appDir = isolation ? path.join(isolation.workspace, outputDir, id, 'app') : path.join(base, 'app')
  if (fs.existsSync(path.join(base, 'meta.json'))) return
  let result = null, used = null
  for (let cycle = 0; cycle < maxCycles && !result?.accepted; cycle++) {
    if (cycle) { console.log('wait', id, 'cycle', cycle); await new Promise((r) => setTimeout(r, cycle * 4 * 60_000)) }
    for (const slug of routes[model]) {
      const modelOrder = ['claude-opus-5.5','gpt-6.1-sol','gpt-6-astra','grok-4.7','kimi-k3','muse-wonder','claude-fable-5.2']
      const allTasks = fs.readdirSync(path.join(root, 'tasks')).sort()
      const port = (outputDir === 'runs-budget' ? 30000 : 10000) + modelOrder.indexOf(model) * 1000 + (condition === 'told' ? 300 : 0) + (n - 1) * allTasks.length + allTasks.indexOf(task)
      prepare(appDir, task, port)
      const attemptId = `${Date.now()}-${slug}`
      const log = path.join(base, `attempt-${attemptId}.jsonl`)
      result = await attempt(appDir, slug, log)
      result.generation_status = captureStatus(result, allowDeadline)
      result.accepted = result.generation_status !== null
      if (!result.ok && fs.existsSync(appDir)) {
        const snapshot = path.join(base, 'attempt-snapshots', attemptId, 'app')
        fs.mkdirSync(path.dirname(snapshot), { recursive: true })
        captureProject(appDir, snapshot)
      }
      fs.appendFileSync(path.join(base, 'attempts.private.jsonl'), JSON.stringify({at: new Date().toISOString(), route: slug, log: path.basename(log), ...result}) + '\n')
      if (result.accepted) fs.copyFileSync(log, path.join(base, 'events.jsonl'))
      used = slug
      if (result.accepted) break
      console.log('retry', id, 'route failed:', (result.failed || 'exit ' + result.code).slice(0, 160))
    }
    if (!result.accepted && !LIMIT.test(result.failed || '')) break
  }
  const artifactPresent = isolation ? captureProject(appDir, path.join(base, 'app')) : fs.existsSync(appDir)
  if (isolation) fs.rmSync(path.join(path.dirname(appDir), 'codex-home'), { recursive: true, force: true })
  // A run that never completed leaves no meta.json, so the next invocation tries it again.
  if (!result.accepted) { fs.writeFileSync(path.join(base, 'failed.json'), JSON.stringify({ id, date: new Date().toISOString(), ...result }, null, 1)); return console.log('FAILED', id, (result.failed || '').slice(0, 200)) }
  fs.rmSync(path.join(base, 'failed.json'), { force: true })
  const noteFile = path.join(base, 'case-note.json')
  const selectionNote = fs.existsSync(noteFile) ? JSON.parse(fs.readFileSync(noteFile)) : undefined
  fs.writeFileSync(path.join(base, 'meta.json'), JSON.stringify({ id, task, model, condition, run: n, isolated: !!isolation, captured: true, artifact_present: artifactPresent, generation_finished: result.ok, generation_workers: perModel, selection_note: selectionNote, cohort: allowDeadline ? 'budget-artifacts-v1-repair' : undefined, date: new Date().toISOString(), ...result }, null, 1))
  fs.writeFileSync(path.join(base, 'route.private.json'), JSON.stringify({ route: used }))
  console.log(result.ok ? 'done' : 'deadline', id, result.seconds + 's', 'steps', result.steps)
}

// Each model has its own small pool, so a slow or rate-limited model never holds up the others.
const perModel = Number(arg('per-model', 3))
const indices = arg('indices', Array.from({length: runs}, (_, i) => i + 1).join(',')).split(',').map(Number)
await Promise.all(models.map(async (model) => {
  const queue = []
  for (const n of indices) for (const task of tasks) queue.push({ task, model, n })
  if (process.argv.includes('--fresh-first')) {
    const failures = ({ task, model, n }) => {
      const file = path.join(root, outputDir, `${task}__${model}__${condition}__${n}`, 'attempts.private.jsonl')
      if (!fs.existsSync(file)) return 0
      return fs.readFileSync(file, 'utf8').trim().split('\n').filter((l) => { try { return JSON.parse(l).ok === false } catch { return false } }).length
    }
    queue.sort((a, b) => failures(a) - failures(b))
  }
  await Promise.all(Array.from({ length: perModel }, async () => { while (queue.length) await job(queue.shift()) }))
}))
