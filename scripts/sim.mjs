// Replay determinístico: 70 s de jogo com o jogador fazendo sempre os mesmos movimentos,
// com o sorteio (Math.random) e o relógio fixos. Roda sem navegador e sem desenhar (via Vite).
// Devolve um resumo (hash) do estado final (jogador e câmera). Mesmo código de jogo = mesmo hash. Usado pelo npm run check (scripts/sim-fingerprint.txt).
// Roteiro: S0 (0–60 s) anda em várias direções (batendo no muro, no cruceiro e nas pedras), corre às vezes,
// vai até a porta da casa, entra e sai. S1 (60–70 s) joga com um controle de mentira: stick inclinado pela metade (anda devagar),
// stick todo na diagonal segurando B (corre), stick quase solto (fica parado). A câmera acompanha o tempo todo (antecipação).
// S2 (70–82 s): toca o botão de rolar (rola), rola duas vezes seguidas (a 2ª fica guardada), rola até o fôlego acabar,
// segura o botão (corre), rola pela ação 'roll' sem direção (para a frente) e espera o fôlego voltar.
// S3 (82–98 s): vai até o boneco de treino; combo de 3 leves (um aperto cedo demais é descartado), pesado, leve cancelado
// por um rolamento depois do impacto, volta e bate até o fôlego acabar. O hash conta golpes e dano no boneco.
// S4 (98–118 s): trava (o boneco à frente), troca para o da direita, anda de frente para ele, bate com o stick apontando
// para o outro lado (o golpe vai no alvo), troca de volta, corre para longe (solta sozinho), tenta travar longe (nada),
// volta, trava e se esconde atrás da casa (solta depois de 2 s sem ver). O hash conta as travadas.
// S5 (118–140 s): um Romeiro aparece; um "jogador robô" trava nele, rola para o lado no fim de cada aviso e bate 2 vezes
// na janela de punir, até matá-lo. Depois outro Romeiro aparece, o robô fica parado com pouca vida, apanha, morre e volta
// ao começo (os inimigos renascem). O hash conta golpes levados, mortes e o estado de cada inimigo.
// S6 (140–167 s): outro Romeiro perto do começo. O robô segura golpes no escudo; apara no fim do aviso (ele ajoelha) e dá o
// crítico; pune com o combo de 3 até a postura quebrar e dá outro crítico; com pouco fôlego segura uma pancada (guarda quebrada).
// O hash conta bloqueios, aparos, guardas quebradas, joelhos e críticos.
// Cada PR que cria jogabilidade acrescenta a sua cena ao roteiro.
// Rode sempre em processo novo (node scripts/sim.mjs): o Three.js e o Vite guardam estado entre rodadas.
// SIM_TRACE=arquivo grava um rastro quadro a quadro (para achar onde dois replays se separam).
// (Mecanismo copiado do survivor e4314ee; o roteiro é deste jogo.)
import { createHash } from 'node:crypto'

export async function SimFingerprint(vite, frames = 5020) {
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
    const { events } = await load('/src/engine/core/events.js')
    let rolls = 0, safeFrames = 0
    const locks = []
    let hurts = 0, deaths = 0, kills = 0
    events.on('roll', () => rolls++)
    events.on('lock', ({ target }) => locks.push(target ? target.id : '-'))
    events.on('hurt', () => hurts++)
    events.on('death', () => deaths++)
    events.on('enemy-death', () => kills++)
    const s6 = { block: 0, parry: 0, guardBreak: 0, broken: 0, critical: 0 }
    events.on('block', () => s6.block++)
    events.on('parry', () => s6.parry++)
    events.on('guard-break', () => s6.guardBreak++)
    events.on('enemy-broken', () => s6.broken++)
    events.on('hit', ({ kind }) => { if (kind === 'critical') s6.critical++ })
    // robô do S5: estado da luta
    const bot = { atk: null, rolled: false, punches: 0, parried: null }

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
      if (f >= 4220) {
        // S6: A (escudo) até 4420 · B (aparo + crítico) até 4620 · C (combo quebra a postura + crítico) até 4800 · D (guarda quebrada)
        if (f === 4220) game.spawn('romeiro', -2, 9.5, Math.PI / 2)
        if (f === 4620) game.spawn('romeiro', p.x + 3, p.z + 3, Math.PI) // C: um novo (o anterior morreu)
        if (f === 4800) game.spawn('romeiro', p.x - 3, p.z + 2, Math.PI) // D: outro
        const e = game.enemies[f < 4620 ? 2 : f < 4800 ? 3 : 4], A = e.atk
        const ax = e.x - p.x, az = e.z - p.z, l = Math.hypot(ax, az) || 1
        // D: fôlego baixo bem no aviso, para o golpe quebrar a guarda
        if (f >= 4800 && A && A.phase === 'warn' && bot.low !== A) { bot.low = A; p.stamina = 10 }
        let pr = null, guard = 0
        ;[mx, mz] = [0, 0]
        // trava no Romeiro (o stick aponta para ele no aperto); se estiver travado em outra coisa, solta antes
        if (p.lock && p.lock !== e) pr = 'lock'
        else if (!p.lock && !e.dead && l < 12) { pr = 'lock'; [mx, mz] = [ax / l, az / l] }
        if (f < 4420 || f >= 4800) guard = 1
        else if (f < 4620) {
          if (A && A.phase === 'warn' && A.t > A.def.warn - 0.06 && bot.parried !== A) { bot.parried = A; pr = 'parry' }
          else if (e.state === 'broken' && !p.atk) pr = 'light'
          else if (!A && l > 2.2 && e.state !== 'broken') [mx, mz] = [ax / l, az / l]
        } else {
          if (e.state === 'broken' && !p.atk) pr = 'light'
          else if ((!A || A.phase === 'recover') && l < 2.6 && f % 6 === 0) pr = 'light'
          else if (A && A.phase === 'warn' && A.t > A.def.warn - 0.2 && !p.atk && bot.atk !== A) { bot.atk = A; pr = 'roll'; [mx, mz] = [(-az + ax * 0.8) / l, (ax + az * 0.8) / l] }
          else if (!A && l > 2.4) [mx, mz] = [ax / l, az / l]
        }
        game.setInput('local', { mx, mz, ax: 0, az: 0, run: 0, guard })
        if (pr) game.act('local', pr)
      } else if (f >= 3560) {
        // S5: o robô
        if (f === 3560) game.spawn('romeiro', 2.5, -12, -Math.PI / 2)
        if (f === 3900) { game.spawn('romeiro', p.x + 5, p.z + 1, -Math.PI / 2); p.hp = 25; if (p.lock) game.act('local', 'lock') }
        const e = game.enemies[f < 3900 ? 0 : 1]
        let pr = null
        ;[mx, mz] = [0, 0]
        if (f < 3900 && !e.dead && !p.dead) {
          if (!p.lock && Math.hypot(e.x - p.x, e.z - p.z) < 12) pr = 'lock'
          const A = e.atk
          if (A !== bot.atk) { bot.atk = A; bot.rolled = false; bot.punches = 0 }
          const ax = e.x - p.x, az = e.z - p.z, l = Math.hypot(ax, az) || 1
          // rola na diagonal para o flanco dele (para o lado e um pouco para a frente)
          if (A && A.phase === 'warn' && A.t > A.def.warn - 0.2 && !bot.rolled) { bot.rolled = true; pr = 'roll'; [mx, mz] = [(-az + ax * 0.8) / l, (ax + az * 0.8) / l] }
          else if (A && A.phase === 'recover' && bot.punches < 2 && !p.atk && p.rollT < 0) { if (l < 2.7) { bot.punches++; pr = 'light' } else [mx, mz] = [ax / l, az / l] }
          else if (!A && l > 2.6) [mx, mz] = [ax / l, az / l]
        }
        game.setInput('local', { mx, mz, ax: 0, az: 0, run: 0 })
        if (pr) game.act('local', pr)
      } else if (f >= 2940) {
        // S4: [quadro]: [ação, mx, mz]; entre os apertos, o stick de cada trecho
        const PRESS = { 2940: ['lock', 0, 0], 2945: ['lock-next', 0, 0], 2995: ['light', -1, 0], 3010: ['lock-prev', 0, 0], 3150: ['lock', 0, 0], 3400: ['lock', 0, 0] }
        const pr = PRESS[f]
        ;[mx, mz] = f < 2950 ? [0, 0] : f < 2990 ? [0.86, -0.51] : f < 3020 ? [0, 0] : f < 3140 ? [-0.7, 0.7] : f < 3160 ? [0, 0]
          : f < 3400 ? toward({ x: -3, z: -10 }) : f < 3470 ? toward({ x: -9, z: -13 }) : [0, 0]
        run = f >= 3020 && f < 3140 ? 1 : 0
        game.setInput('local', { mx: pr ? pr[1] : mx, mz: pr ? pr[2] : mz, ax: 0, az: 0, run })
        if (pr) game.act('local', pr[0])
      } else if (f >= 2460) {
        // S3: [quadro]: [ação, mx, mz] — o stick no aperto decide a direção do golpe
        const spot = { x: 0, z: 3.7 }
        const PRESS = { 2645: ['light', 0, -1], 2647: ['light', 0, -1], 2654: ['light', 0, -1], 2664: ['light', 0, -1], 2700: ['heavy', 0, -1],
          2745: ['light', 0, -1], 2748: ['roll', 0, 1] }
        for (let g = 2800; g < 2900; g += 5) PRESS[g] = ['light', 0, -1]
        ;[mx, mz] = (f < 2645 || (f >= 2770 && f < 2800)) ? toward(spot) : [0, 0]
        const pr = PRESS[f]
        game.setInput('local', { mx: pr ? pr[1] : mx, mz: pr ? pr[2] : mz, ax: 0, az: 0, run: 0 })
        if (pr) game.act('local', pr[0])
      } else if (f >= 2100) {
        // S2: [quadro de início, mx, mz, botão de rolar/correr]. Tocar = 3 quadros (0,1 s) segurando
        const S2 = [[2100, 0, 0, 0], [2130, -1, 0, 1], [2133, -1, 0, 0], [2170, 0, 1, 1], [2173, 0, 1, 0], [2183, 0, 1, 1], [2185, 0, 1, 0],
          ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap((i) => [[2220 + i * 18, i % 2 ? 1 : -1, -0.3, 1], [2223 + i * 18, i % 2 ? 1 : -1, -0.3, 0]]),
          [2370, 1, 0, 0], [2380, 1, 0, 1], [2440, 0, 0, 0]]
        const seg = S2.filter((s) => s[0] <= f).pop()
        game.setInput('local', { mx: seg[1], mz: seg[2], ax: 0, az: 0, run: seg[3] })
        if (f === 2445) game.act('local', 'roll')
      } else if (f >= 1800) {
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
      camera.update(dt, p, p.lock)
      if (p.safe) safeFrames++
      const c = camera.cam.position
      if (trace) trace.push(`${f} r${calls} ${p.x.toFixed(4)},${p.z.toFixed(4)},${p.gy.toFixed(3)},${p.lv},${p.stamina.toFixed(2)} cam ${c.x.toFixed(4)},${c.z.toFixed(4)} roll ${p.rollT.toFixed(3)}${p.safe ? ' safe' : ''}${p.running ? ' run' : ''}${p.atk ? ` atk ${p.atk.kind}${p.atk.n} ${p.atk.t.toFixed(3)}` : ''} dmg ${game.targets.map((e) => e.dmg).join('/')}${p.lock ? ` lock ${p.lock.id} lost ${p.lockLost.toFixed(2)} face ${p.facing.toFixed(2)}` : ''} hp ${p.hp}${p.hurtT > 0 ? ' HURT' : ''}${p.dead ? ' DEAD' : ''}${p.guard ? ' GUARD' : ''}${p.parryT >= 0 ? ' PARRY' : ''}${p.stunT > 0 ? ' STUN' : ''}${game.enemies.map((e) => ` | ${e.kind} ${e.x.toFixed(2)},${e.z.toFixed(2)} ${e.state}${e.atk ? ':' + e.atk.name + ':' + e.atk.phase : ''} hp ${e.hp} pos ${e.posture.toFixed(1)}`).join('')}`)
    }
    if (trace) (await import('node:fs')).writeFileSync(process.env.SIM_TRACE, trace.join('\n'))
    const r = (v) => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v)
    const state = {
      players: [...game.players.values()].map((q) => [q.id, r(q.x), r(q.z), r(q.gy), q.lv, r(q.stamina), r(q.facing), q.tired]),
      door: door ? [r(door.x), r(door.z)] : null,
      camera: [r(camera.cam.position.x), r(camera.cam.position.y), r(camera.cam.position.z)],
      rolls, safeFrames, locks, hurts, deaths, kills, s6,
      targets: game.targets.map((e) => [e.id, e.hits, e.dmg, e.posture]),
      enemies: game.enemies.map((e) => [e.id, r(e.x), r(e.z), e.hp, e.state, e.dead]),
    }
    const [, x, z, , lv, st] = state.players[0]
    const t0 = game.targets[0]
    return { hash: createHash('sha256').update(JSON.stringify(state)).digest('hex'), summary: `jogador em (${x.toFixed(2)}, ${z.toFixed(2)}) · andar ${lv} · fôlego ${Math.round(st)} · ${rolls} rolamentos · boneco: ${t0.hits} golpes, ${t0.dmg} de dano · levou ${hurts} golpes, ${deaths} morte(s), ${kills} inimigo(s) vencido(s) · escudo ${s6.block}, aparos ${s6.parry}, guarda quebrada ${s6.guardBreak}, joelhos ${s6.broken}, críticos ${s6.critical}${door ? '' : ' · casa sem porta?'}` }
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
