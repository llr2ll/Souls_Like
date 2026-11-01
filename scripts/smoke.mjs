// Teste de fumaÃ§a: compila o jogo, sobe a pÃ¡gina numa porta prÃ³pria (5199, nÃ£o briga com o npm run dev),
// abre num navegador sem tela, bate no boneco de treino (cliques, Shift + clique), trava e troca de alvo (Q, roda), anda com o teclado
// (WASD; EspaÃ§o segurado corre, tocado rola), entra na casa, joga com um
// controle de mentira (stick, segurar e tocar B, todos os botÃµes, desconectar) e FALHA se aparecer erro no console.
// Capturas e log ficam em smoke/ (versionados: o PR mostra as capturas).
// Sem placa de vÃ­deo o jogo roda a poucos FPS: serve para pegar erro de carregar/iniciar/teclas, nÃ£o bugs de longo prazo.
// SMOKE_CHROME=/caminho/do/chrome usa um Chrome jÃ¡ instalado (quando o download do Playwright nÃ£o Ã© possÃ­vel).
// (Copiado do survivor e4314ee sem o relay e o celular, que este jogo ainda nÃ£o tem. Ver docs/ORIGEM.md.)
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
const fail = (s) => { problems.push(s); note(`âœ— ${s}`) }
const children = []

// roda um processo e espera ele terminar (a compilaÃ§Ã£o)
function run(args) {
  return new Promise((ok, no) => {
    const c = spawn(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    c.stdout.on('data', (d) => (out += d))
    c.stderr.on('data', (d) => (out += d))
    c.on('exit', (code) => (code === 0 ? ok(out) : no(new Error(`saiu com cÃ³digo ${code}\n${out}`))))
  })
}
// sobe um processo que fica rodando (a pÃ¡gina) e espera a linha de "pronto"
function serve(args, ready) {
  return new Promise((ok, no) => {
    const c = spawn(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] })
    children.push(c)
    let out = ''
    const t = setTimeout(() => no(new Error(`nÃ£o ficou pronto em 30 s\n${out}`)), 30000)
    const read = (d) => { out += d; if (ready.test(out)) { clearTimeout(t); setTimeout(() => ok(c), 500) } }
    c.stdout.on('data', read)
    c.stderr.on('data', read)
    c.on('exit', (code) => { clearTimeout(t); no(new Error(`saiu com cÃ³digo ${code}\n${out}`)) })
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
  page.on('pageerror', (e) => fail(`erro na pÃ¡gina: ${e.message}`))
  page.on('response', (r) => { if (r.status() >= 400) log.push(`[rede] ${r.status()} ${r.url()}`) }) // qual arquivo faltou
}

async function play(page) {
  const k = page.keyboard
  const shot = async (name) => { await page.screenshot({ path: path.join(OUT, name), type: 'jpeg', quality: 70 }); note(`   captura ${name}`) }
  const hold = async (keys, ms) => { for (const x of keys) await k.down(x); await wait(ms); for (const x of keys) await k.up(x) }

  const t0 = Date.now()
  await shot('01-inicio.jpg')
  // atÃ© o boneco de treino (logo Ã  frente da largada) e bater: 3 cliques (combo leve) e Shift + clique (pesado)
  await hold(['w'], 1200)
  for (let i = 0; i < 3; i++) { await page.mouse.click(480, 270); await wait(300) }
  await k.down('Shift'); await page.mouse.click(480, 270); await k.up('Shift')
  await wait(450)
  await shot('02-golpe.jpg')
  await wait(800)
  // travar (Q), trocar de alvo (roda do mouse), soltar (Q)
  await k.press('q'); await wait(400)
  await page.mouse.wheel(0, 120); await wait(900)
  await shot('03-trava.jpg')
  await k.press('q'); await wait(300)
  // atÃ© o cruceiro (Ã  direita) e descansar (E): "Vela acesa"
  await hold(['d'], 2200)
  await k.press('e'); await wait(900)
  await shot('04-cruceiro.jpg')
  // andar, correr (segurar EspaÃ§o), rolar (tocar EspaÃ§o), ir atÃ© a porta da casa (fica a noroeste da largada) e entrar
  await hold(['Space', 'd'], 1500)
  await k.down('a')
  for (let i = 0; i < 3; i++) {
    await k.down('Space'); await wait(90); await k.up('Space')
    if (i === 0) { await wait(120); await shot('05-rolando.jpg') } else await wait(700)
  }
  await k.up('a')
  await hold(['a'], 1000)
  await hold(['w', 'a'], 2500)
  await hold(['w'], 2500)
  await shot('06-casa.jpg')
  // controle: conecta (aviso no alto da tela), anda com o stick, corre segurando B, aperta os botÃµes e desconecta
  const pad = (fn) => page.evaluate(fn)
  await pad(() => { window.__pad.on = true; window.__pad.pad.axes[0] = 1 })
  await wait(2000)
  await shot('07-controle.jpg')
  await pad(() => { const p = window.__pad.pad; p.axes[0] = 0; p.axes[1] = 1; p.buttons[1].value = 1 })
  await wait(2000)
  // toques curtos em B: rola
  for (let i = 0; i < 2; i++) { await pad(() => { window.__pad.pad.buttons[1].value = 0 }); await wait(400); await pad(() => { window.__pad.pad.buttons[1].value = 1 }); await wait(90) }
  await pad(() => { const p = window.__pad.pad; p.axes[1] = 0; p.buttons[1].value = 0 })
  await wait(700)
  await shot('08-folego.jpg')
  await pad(() => { for (const b of window.__pad.pad.buttons) b.value = 1 })
  await wait(600)
  await pad(() => { for (const b of window.__pad.pad.buttons) b.value = 0 })
  // stick direito puxado para os lados (troca de alvo, se houver um travado)
  await pad(() => { window.__pad.pad.axes[2] = 1 }); await wait(300)
  await pad(() => { window.__pad.pad.axes[2] = -1 }); await wait(300)
  await pad(() => { window.__pad.pad.axes[2] = 0 })
  await wait(600)
  await pad(() => { window.__pad.on = false })
  // sul: onde fica o Romeiro (ele vÃª, geme e vem); trava nele e espera o ataque
  await hold(['s'], 2600)
  await k.press('q')
  await wait(1800)
  await shot('09-romeiro.jpg')
  // escudo (segurar clique direito) e aparo (Shift + clique direito)
  await page.mouse.move(480, 270)
  await page.mouse.down({ button: 'right' }); await wait(1200)
  await shot('10-escudo.jpg')
  await page.mouse.up({ button: 'right' })
  await k.down('Shift'); await page.mouse.down({ button: 'right' }); await page.mouse.up({ button: 'right' }); await k.up('Shift')
  await wait(600)
  await k.press('Space'); await wait(1200)
  // cabaÃ§a (R) e pÃ£o (F): o placar no canto de baixo desce
  await k.press('r'); await wait(1300)
  await k.press('f'); await wait(800)
  await shot('11-cabaca.jpg')
  // resto do tempo: anda em volta (bate no muro e nas peÃ§as)
  const keys = ['s', 'd', 'w', 'a']
  for (let i = 0; Date.now() - t0 < PLAY_SECONDS * 1000; i++) await hold([keys[i % 4]], 900)
  await shot('12-fim.jpg')
}

// controle de mentira: o navegador sem tela nÃ£o tem controle, e o jogo sÃ³ lÃª navigator.getGamepads() a cada quadro
function FakeGamepad() {
  const pad = { id: 'Controle de teste (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0,
    axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) }
  window.__pad = { on: false, pad }
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [window.__pad.on ? pad : null] })
}

let browser
try {
  fs.rmSync(OUT, { recursive: true, force: true })
  fs.mkdirSync(OUT, { recursive: true })

  note('1/3 compilando o jogoâ€¦')
  await run([VITE, 'build', '--outDir', DIST, '--emptyOutDir', '--logLevel', 'warn'])
  note('2/3 subindo a pÃ¡ginaâ€¦')
  await serve([VITE, 'preview', '--outDir', DIST, '--port', WEB_PORT, '--strictPort'], /localhost/)

  note('3/3 abrindo o jogo no navegador sem telaâ€¦')
  browser = await chromium.launch({ args: GL_ARGS, executablePath: process.env.SMOKE_CHROME || undefined })
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } })
  page.setDefaultTimeout(120000) // sem placa de vÃ­deo um quadro pode levar segundos
  watch(page)
  let frames = 0
  await page.exposeFunction('__smokeFps', () => frames++)
  await page.addInitScript(() => addEventListener('fps', () => window.__smokeFps()))
  await page.addInitScript(FakeGamepad)
  await page.goto(WEB)
  await page.waitForFunction(() => /FPS/.test(document.querySelector('#fps-element')?.textContent || ''), null, { timeout: 60000 })
  note(`   jogo desenhando (${await page.textContent('#fps-element')})`)

  note(`   jogando ${PLAY_SECONDS} sâ€¦`)
  await play(page)
  if (frames < 3) fail(`o jogo quase nÃ£o desenhou quadros (${frames} mediÃ§Ãµes de FPS)`)
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
  console.log(`\nâœ— FALHOU: ${problems.length} problema(s). Detalhes em smoke/log.txt`)
  process.exitCode = 1
} else console.log('\nâœ“ PASSOU: nenhum erro no console. Capturas em smoke/')
