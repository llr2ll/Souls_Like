// Replay determinístico: 70 s de jogo com o jogador fazendo sempre os mesmos movimentos,
// com o sorteio (Math.random) e o relógio fixos. Roda sem navegador e sem desenhar (via Vite).
// Devolve um resumo (hash) do estado final (jogador e câmera). Mesmo código de jogo = mesmo hash. Usado pelo npm run check (scripts/sim-fingerprint.txt).
// Roteiro: S0 (0–60 s) anda em várias direções (batendo no muro, no cruceiro e nas pedras), corre às vezes,
// vai até a porta da casa, entra e sai. S1 (60–70 s) joga com um controle de mentira: stick inclinado pela metade (anda devagar),
// stick todo na diagonal segurando B (corre), stick quase solto (fica parado). A câmera acompanha o tempo todo (antecipação).
// Cada PR que cria jogabilidade acrescenta a sua cena ao roteiro.
// Rode sempre em processo novo (node scripts/sim.mjs): o Three.js e o Vite guardam estado entre rodadas.
// SIM_TRACE=arquivo grava um rastro quadro a quadro (para achar onde dois replays se separam).
// (Mecanismo copiado do survivor e4314ee; o roteiro é deste jogo.)
import { createHash } from 'node:crypto'

export async function SimFingerprint(vite, frames = 2100) {
  // o motor de áudio registra teclas ao carregar; fora do navegador isso não existe
  globalThis.addEventListener ??= () => {}
  // sorteio e relógio fixos
  let seed = 20261101, calls = 0
  const trace = process.env.SIM_TRACE ? [] : null
  const realRandom = Math.random, realPerf = globalThis.performance, realLimit = Error.stackTraceLimit
  Error.stackTraceLimit = 3 // só precisamos de quem chamou o sorteio (mais rápido)
  // só o código do jogo (src/) usa a sequência fixa. O Vite (um id por arquivo carregado) e o Three.js (um id por objeto)
  // também sorteiam; se entrassem na sequência, acrescentar um arquivo ou um objeto mudaria o replay inteiro.
  Math.random = () => {
    if (!(new Error().stack.split('\n')[2] || '').includes('/src/')) return 0.5
    calls++
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296
  }
  let now = 0
  Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true, writable: true })
  try {
    const THREE = await vite.ssrLoadModule('three')
    const load = (p) => vite.ssrLoadModule(p)
    const { SetDeepTest } = await load('/src/engine/world/collision.js')
    const { SetGround, TooDeep } = await load('/src/engine/world/ground.js')
    const reg = await load('/src/shared/worldgen/buildings-registry.js')
    const { BuildArena } = await load('/src/game/world/arena.js')
    const { CreateGame } = await load('/src/game/game.js')
    const { CreateCamera } = await load('/src/game/camera.js')
    const { ReadPad, PAD } = await load('/src/engine/input/gamepad.js')
    const { BALANCE } = await load('/src/game/config/balance.js')

    const scene = new THREE.Scene()
    SetGround(() => 0); SetDeepTest(TooDeep)
    BuildArena(scene, BALANCE.arena.size)
    const game = CreateGame(scene)
    const camera = CreateCamera(16 / 9, BALANCE.camera)
    game.addPlayer('local', 'Peregrino')
    const p = game.players.get('local')
    // controle de mentira: sticks e botões no formato do navegador
    const fakePad = (x, y, buttons = []) => ({ axes: [x, y, 0, 0], buttons: Object.values(PAD).map((i) => ({ value: buttons.some((b) => PAD[b] === i) ? 1 : 0 })) })
    const door = reg.DoorsNear(-8, -8, 12)[0]
    const outside = door && { x: door.x + door.ox * 1.6, z: door.z + door.oz * 1.6 }
    const inside = door && { x: door.x - door.ox * 2.5, z: door.z - door.oz * 2.5 }
    // vai até o ponto (anda reto; o desvio é do próprio movimento: colisão)
    const toward = (t) => { const dx = t.x - p.x, dz = t.z - p.z, l = Math.hypot(dx, dz); return l < 0.3 ? [0, 0] : [dx / l, dz / l] }

    const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7], [-0.7, -0.7]]
    const dt = 1 / 30
    for (let f = 0; f < frames; f++) {
      now += dt * 1000
      let mx, mz, run = 0
      if (f >= 1800) {
        // S1: controle (o mesmo caminho do jogo: ReadPad → setInput)
        const pad = f < 1890 ? fakePad(0.6, 0) : f < 1980 ? fakePad(0.7, 0.7, ['B']) : f < 2070 ? fakePad(0.15, -0.1) : fakePad(0, 0)
        game.setInput('local', ReadPad(pad, BALANCE.pad).msg)
      } else {
        if (f < 800) { [mx, mz] = DIRS[Math.floor(f / 70) % DIRS.length]; run = f % 280 < 110 ? 1 : 0 }
        else if (f < 1150 && door) [mx, mz] = toward(outside)
        else if (f < 1450 && door) [mx, mz] = toward(inside)
        else if (door) [mx, mz] = toward(outside)
        else { mx = 0; mz = 0 }
        game.setInput('local', { mx, mz, ax: 0, az: 0, run, fire: 0 })
      }
      game.update(dt)
      reg.UpdateDoors(dt, [...game.players.values()], [])
      camera.update(dt, p)
      const c = camera.cam.position
      if (trace) trace.push(`${f} r${calls} ${p.x.toFixed(4)},${p.z.toFixed(4)},${p.gy.toFixed(3)},${p.lv},${p.stamina.toFixed(2)} cam ${c.x.toFixed(4)},${c.z.toFixed(4)}`)
    }
    if (trace) (await import('node:fs')).writeFileSync(process.env.SIM_TRACE, trace.join('\n'))
    const r = (v) => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v)
    const state = {
      players: [...game.players.values()].map((q) => [q.id, r(q.x), r(q.z), r(q.gy), q.lv, r(q.stamina), r(q.facing), q.tired]),
      door: door ? [r(door.x), r(door.z)] : null,
      camera: [r(camera.cam.position.x), r(camera.cam.position.y), r(camera.cam.position.z)],
    }
    const [, x, z, , lv, st] = state.players[0]
    return { hash: createHash('sha256').update(JSON.stringify(state)).digest('hex'), summary: `jogador em (${x.toFixed(2)}, ${z.toFixed(2)}) · andar ${lv} · fôlego ${Math.round(st)}${door ? '' : ' · casa sem porta?'}` }
  } finally {
    Math.random = realRandom
    Error.stackTraceLimit = realLimit
    Object.defineProperty(globalThis, 'performance', { value: realPerf, configurable: true, writable: true })
  }
}

// rodar: node scripts/sim.mjs (--json = só o resultado, para o check)
if (import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) { // pathToFileURL: funciona no Windows também
  const { createServer } = await import('vite')
  const path = await import('node:path')
  const vite = await createServer({ root: path.resolve(import.meta.dirname, '..'), logLevel: 'error', server: { middlewareMode: true, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true } })
  try {
    const t = Date.now(), s = await SimFingerprint(vite)
    console.log(process.argv.includes('--json') ? JSON.stringify(s) : `${s.summary} · ${s.hash} · ${((Date.now() - t) / 1000).toFixed(1)} s`)
  } finally { await vite.close() }
}
