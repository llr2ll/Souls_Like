// Teste de fumaça: compila o jogo, sobe a página numa porta própria (5199, não briga com o npm run dev),
// abre num navegador sem tela, anda com o teclado (WASD, Shift), entra na casa e FALHA se aparecer erro no console.
// Capturas e log ficam em smoke/ (versionados: o PR mostra as capturas).
// Sem placa de vídeo o jogo roda a poucos FPS: serve para pegar erro de carregar/iniciar/teclas, não bugs de longo prazo.
// SMOKE_CHROME=/caminho/do/chrome usa um Chrome já instalado (quando o download do Playwright não é possível).
// (Copiado do survivor e4314ee sem o relay e o celular, que este jogo ainda não tem. Ver docs/ORIGEM.md.)
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'smoke')
const DIST = fs.mkdtempSync(path.join(os.tmpdir(), 'souls-smoke-'))
const VITE = path.join(ROOT, 'node_modules/vite/bin/vite.js')
const WEB_PORT = 5199
const WEB = `http://localhost:${WEB_PORT}/`
const PLAY_SECONDS = 40
const GL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const log = []
const problems = []
const T0 = Date.now()
const note = (s) => { s = `[${Math.round((Date.now() - T0) / 1000)}s] ${s}`; log.push(s); console.log(s) }
const fail = (s) => { problems.push(s); note(`✗ ${s}`) }
const children = []

// roda um processo e espera ele terminar (a compilação)
function run(args) {
  return new Promise((ok, no) => {
    const c = spawn(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    c.stdout.on('data', (d) => (out += d))
    c.stderr.on('data', (d) => (out += d))
    c.on('exit', (code) => (code === 0 ? ok(out) : no(new Error(`saiu com código ${code}\n${out}`))))
  })
}
// sobe um processo que fica rodando (a página) e espera a linha de "pronto"
function serve(args, ready) {
  return new Promise((ok, no) => {
    const c = spawn(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] })
    children.push(c)
    let out = ''
    const t = setTimeout(() => no(new Error(`não ficou pronto em 30 s\n${out}`)), 30000)
    const read = (d) => { out += d; if (ready.test(out)) { clearTimeout(t); setTimeout(() => ok(c), 500) } }
    c.stdout.on('data', read)
    c.stderr.on('data', read)
    c.on('exit', (code) => { clearTimeout(t); no(new Error(`saiu com código ${code}\n${out}`)) })
  })
}
function stopAll() {
  for (const c of children) if (c.exitCode === null) c.kill()
  fs.rmSync(DIST, { recursive: true, force: true })
}
process.on('SIGINT', () => { stopAll(); process.exit(130) })

// registra tudo o que aparece no console; erro = teste falha
function watch(page) {
  page.on('console', (m) => {
    log.push(`[${m.type()}] ${m.text()}`)
    if (m.type() === 'error') fail(`erro no console: ${m.text()}`)
  })
  page.on('pageerror', (e) => fail(`erro na página: ${e.message}`))
  page.on('response', (r) => { if (r.status() >= 400) log.push(`[rede] ${r.status()} ${r.url()}`) }) // qual arquivo faltou
}

async function play(page) {
  const k = page.keyboard
  const shot = async (name) => { await page.screenshot({ path: path.join(OUT, name), type: 'jpeg', quality: 70 }); note(`   captura ${name}`) }
  const hold = async (keys, ms) => { for (const x of keys) await k.down(x); await wait(ms); for (const x of keys) await k.up(x) }

  const t0 = Date.now()
  await shot('01-inicio.jpg')
  // andar, correr, ir até a porta da casa (fica a noroeste da largada) e entrar
  await hold(['w'], 1500)
  await hold(['Shift', 'd'], 1500)
  await hold(['a'], 3000)
  await shot('02-andando.jpg')
  await hold(['w', 'a'], 2500)
  await hold(['w'], 2500)
  await shot('03-casa.jpg')
  // resto do tempo: anda em volta (bate no muro e nas peças)
  const keys = ['s', 'd', 'w', 'a']
  for (let i = 0; Date.now() - t0 < PLAY_SECONDS * 1000; i++) await hold([keys[i % 4]], 900)
  await shot('04-fim.jpg')
}

let browser
try {
  fs.rmSync(OUT, { recursive: true, force: true })
  fs.mkdirSync(OUT, { recursive: true })

  note('1/3 compilando o jogo…')
  await run([VITE, 'build', '--outDir', DIST, '--emptyOutDir', '--logLevel', 'warn'])
  note('2/3 subindo a página…')
  await serve([VITE, 'preview', '--outDir', DIST, '--port', WEB_PORT, '--strictPort'], /localhost/)

  note('3/3 abrindo o jogo no navegador sem tela…')
  browser = await chromium.launch({ args: GL_ARGS, executablePath: process.env.SMOKE_CHROME || undefined })
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } })
  page.setDefaultTimeout(120000) // sem placa de vídeo um quadro pode levar segundos
  watch(page)
  let frames = 0
  await page.exposeFunction('__smokeFps', () => frames++)
  await page.addInitScript(() => addEventListener('fps', () => window.__smokeFps()))
  await page.goto(WEB)
  await page.waitForFunction(() => /FPS/.test(document.querySelector('#fps-element')?.textContent || ''), null, { timeout: 60000 })
  note(`   jogo desenhando (${await page.textContent('#fps-element')})`)

  note(`   jogando ${PLAY_SECONDS} s…`)
  await play(page)
  if (frames < 3) fail(`o jogo quase não desenhou quadros (${frames} medições de FPS)`)
} catch (e) {
  fail(`o teste parou: ${e.message.split('\n')[0]}`)
  log.push(e.stack || String(e))
} finally {
  if (browser) await browser.close()
  stopAll()
}

log.push('', problems.length ? `FALHOU (${problems.length} problema(s))` : 'PASSOU')
fs.writeFileSync(path.join(OUT, 'log.txt'), log.join('\n') + '\n')
if (problems.length) {
  console.log(`\n✗ FALHOU: ${problems.length} problema(s). Detalhes em smoke/log.txt`)
  process.exitCode = 1
} else console.log('\n✓ PASSOU: nenhum erro no console. Capturas em smoke/')
