// `src/c.js` imports `./a`. `src/a.js` is removed, `c.js` is requested while it is gone,
// then `a.js` is written back. Within chokidar's `atomic` window (100 ms) that arrives as
// one `change`; with `--control` the file comes back after 300 ms (`unlink` + `add`).
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createServer, version, rolldownVersion } from 'vite'

const control = process.argv.includes('--control')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-atomic-'))
fs.mkdirSync(path.join(root, 'src'))
const a = path.join(root, 'src/a.js')
fs.writeFileSync(a, 'export const a = 1\n')
fs.writeFileSync(path.join(root, 'src/c.js'), "import { a } from './a'\nexport const c = a\n")

const server = await createServer({ root, configFile: false, logLevel: 'silent', server: { port: 0 } })
await sleep(500)
const events = []
server.watcher.on('all', (event, file) => events.push(`${event} ${path.relative(root, file)}`))

const env = server.environments.client
const request = () =>
  env.transformRequest('/src/c.js').then(
    () => 'ok',
    (e) => e.message.split(' from ')[0],
  )

fs.rmSync(a)
console.log('a.js gone,   /src/c.js:', await request())
if (control) await sleep(300)
fs.writeFileSync(a, 'export const a = 1\n')
await sleep(700)
const back = await request()
console.log('a.js back,   /src/c.js:', back)
console.log('watcher events:', events.join(', '))

fs.writeFileSync(path.join(root, 'src/unrelated.js'), 'export {}\n')
await sleep(500)
console.log('after creating an unrelated file, /src/c.js:', await request())

console.log(`vite ${version}, rolldown ${rolldownVersion}, node ${process.version}`)
await server.close()
fs.rmSync(root, { recursive: true, force: true })
if (back !== 'ok') {
  console.log('FAIL: c.js still cannot resolve ./a after a.js is back')
  process.exit(1)
}
console.log('OK')
