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
// S7 (167–180 s): longe dos inimigos, com pouca vida: bebe (cura), bebe de vida cheia (gasta mesmo assim), come pão,
// leva golpe no meio de um gole (perde), esvazia a cabaça e tenta beber vazia. O hash conta curas, perdas e vazios.
// S8 (180–203 s): vence um Romeiro (+30 de cera), descansa no cruceiro, morre longe (a cera vira vela), volta no cruceiro, pega a
// vela, morre de novo e morre outra vez antes de pegar (a cera se perde). Salva e carrega: tem de dar o mesmo.
// S9 (+42 s, outro mapa): monta o Val de Santa Baia no mesmo processo (limpa colisões e casas da arena). Lê a inscrição da ponte,
// tenta entrar no rio (a parte funda barra), atravessa a ponte e descansa no ✝ da Ponte, pega o pão da fonte, empurra o portão
// do mosteiro por fora (fechado), puxa a alavanca por dentro, desce o corredor até o prado do cruceiro, tenta passar a névoa.
// S10 (+50 s no vale): trasno rouba e foge, fondeiro (escudo, corpo, rolar), Lobishome (derruba, uiva, morre, não volta), atalhos 1 e 3, anaco.
// S11 (+63 s no vale): o chefe do castro. Atravessa a névoa; o robô rola no fim de cada aviso e pune; apara o bote até a postura
// quebrar e dá o crítico na cabeça; a serpe vira pedra e a moura sai; morre na fase 2 (o chefe volta a dormir, fase 1); entra
// de novo e vence; a névoa some; sai andando; salva e carrega.
// Cada PR que cria jogabilidade acrescenta a sua cena ao roteiro.
// Rode sempre em processo novo (node scripts/sim.mjs): o Three.js e o Vite guardam estado entre rodadas.
// SIM_TRACE=arquivo grava um rastro quadro a quadro (para achar onde dois replays se separam).
// (Mecanismo copiado do survivor e4314ee; o roteiro é deste jogo.)
import { createHash } from 'node:crypto'

export async function SimFingerprint(vite, frames = 6100) {
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
    const s7 = { healed: 0, lost: 0, empty: 0 }
    events.on('healed', () => s7.healed++)
    events.on('use-lost', () => s7.lost++)
    events.on('use-empty', () => s7.empty++)
    const s8 = { rest: 0, candle: 0, pick: 0, lost: 0, saves: 0, roundtrip: null }
    events.on('rest', () => s8.rest++)
    events.on('candle', () => s8.candle++)
    events.on('candle-pick', () => s8.pick++)
    events.on('candle-lost', () => s8.lost++)
    events.on('save', () => s8.saves++)
    // robô do S5: estado da luta
    const bot = { atk: null, rolled: false, punches: 0, parried: null }

    const scene = new THREE.Scene()
    SetGround(() => 0); SetDeepTest(TooDeep)
    BuildArena(scene, BALANCE.maps.arena.size)
    const game = CreateGame(scene, BALANCE.maps.arena)
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
      if (f >= 5400) {
        // S8: os inimigos das cenas antigas vão morar longe (senão impediriam o descanso)
        if (f === 5400) {
          game.enemies.forEach((e, i) => { e.home = { x: -18 + i * 1.5, z: -18, ry: 0 }; e.reset() })
          if (p.lock) game.act('local', 'lock')
          Object.assign(p, { x: 9, z: 5.2, facing: Math.PI })
          const r = game.spawn('romeiro', -18, 18, 0) // mora longe; aparece perto e quase morto
          Object.assign(r, { x: 9, z: 7.3, facing: Math.PI, hp: 5 })
        }
        const r = game.enemies[5]
        let pr = null
        ;[mx, mz] = [0, 0]
        if (f < 5460) { if (!r.dead && f % 8 === 0) pr = f === 5400 ? null : 'light'; [mx, mz] = f === 5408 ? [0, 1] : [0, 0] }
        else if (f < 5478) [mx, mz] = toward({ x: 9, z: 4.4 })
        else if (f === 5480) pr = 'use' // descansa
        else if (f >= 5490 && f < 5560) [mx, mz] = toward({ x: 17, z: 5 })
        else if (f >= 5700 && f < 5770) [mx, mz] = toward(game.progress.candle || { x: p.x, z: p.z })
        else if (f === 5772) pr = 'use' // pega a vela
        if (f === 5560 || f === 5780 || f === 5910) game.hurt(p, 999, 0) // morre (a 3ª antes de pegar a vela)
        if (f === 6050) { const d = game.save(); game.load(JSON.parse(JSON.stringify(d))); s8.roundtrip = JSON.stringify(game.save()) === JSON.stringify(d) }
        game.setInput('local', { mx, mz, ax: 0, az: 0, run: 0 })
        if (pr) game.act('local', pr)
      } else if (f >= 5020) {
        // S7: [quadro]: ação; o jogador num canto longe dos inimigos
        if (f === 5020) { if (p.lock) game.act('local', 'lock'); p.x = 18; p.z = 18; p.hp = 30 }
        if (f === 5130) p.hp = 50
        if (f === 5140) game.hurt(p, 10, 0)
        const PRESS = { 5030: 'heal', 5070: 'heal', 5110: 'eat', 5131: 'heal', 5200: 'heal', 5240: 'heal', 5280: 'eat', 5300: 'eat' }
        game.setInput('local', { mx: f >= 5320 && f < 5360 ? -1 : 0, mz: 0, ax: 0, az: 0, run: 0 })
        if (PRESS[f]) game.act('local', PRESS[f])
      } else if (f >= 4220) {
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
      if (trace) trace.push(`${f} r${calls} ${p.x.toFixed(4)},${p.z.toFixed(4)},${p.gy.toFixed(3)},${p.lv},${p.stamina.toFixed(2)} cam ${c.x.toFixed(4)},${c.z.toFixed(4)} roll ${p.rollT.toFixed(3)}${p.safe ? ' safe' : ''}${p.running ? ' run' : ''}${p.atk ? ` atk ${p.atk.kind}${p.atk.n} ${p.atk.t.toFixed(3)}` : ''} dmg ${game.targets.map((e) => e.dmg).join('/')}${p.lock ? ` lock ${p.lock.id} lost ${p.lockLost.toFixed(2)} face ${p.facing.toFixed(2)}` : ''} hp ${p.hp}${p.hurtT > 0 ? ' HURT' : ''}${p.dead ? ' DEAD' : ''}${p.guard ? ' GUARD' : ''}${p.parryT >= 0 ? ' PARRY' : ''}${p.stunT > 0 ? ' STUN' : ''}${p.use ? ` USE ${p.use} ${p.useT.toFixed(2)}` : ''} g${p.gourd} b${p.bread} cera ${p.cera}${game.progress.candle ? ` vela ${game.progress.candle.cera}` : ''}${game.enemies.map((e) => ` | ${e.kind} ${e.x.toFixed(2)},${e.z.toFixed(2)} ${e.state}${e.atk ? ':' + e.atk.name + ':' + e.atk.phase : ''} hp ${e.hp} pos ${e.posture.toFixed(1)}`).join('')}`)
    }
    // ---- S9: o vale da demo (mesmo processo): limpa colisões e casas da arena e monta o vale ----
    const s9 = { pickups: [], shortcut: 0, locked: 0, fog: 0, rest: 0, riverZ: null, laneEnd: null, fogZ: null, roundtrip: null }
    events.on('pickup', ({ it }) => s9.pickups.push(it.id))
    events.on('shortcut', () => s9.shortcut++)
    events.on('locked', () => s9.locked++)
    events.on('fog', () => s9.fog++)
    events.on('rest', ({ c }) => { if (c.id === 'ponte') s9.rest++ })
    const { ResetColliders } = await load('/src/engine/world/collision.js')
    const { BuildSantaBaia, SantaBaiaGround, WATER_Y } = await load('/src/game/world/santa-baia.js')
    ResetColliders(); reg.ResetBuildings()
    const scene2 = new THREE.Scene(), MAP = BALANCE.maps.demo
    SetGround(SantaBaiaGround, WATER_Y)
    const world = BuildSantaBaia(scene2, MAP)
    const g2 = CreateGame(scene2, MAP, world)
    g2.addPlayer('local', 'Peregrino')
    const q = g2.players.get('local')
    const go = (t) => { const dx = t.x - q.x, dz = t.z - q.z, l = Math.hypot(dx, dz); return l < 0.3 ? [0, 0] : [dx / l, dz / l] }
    const tp = (x, z) => Object.assign(q, { x, z, vx: 0, vz: 0, safeX: x, safeZ: z })
    for (let f = 0; f < 1250; f++) {
      now += dt * 1000
      let m = [0, 0], pr = null
      if (f < 40) m = go({ x: 17.5, z: 69.5 }) // até a pedra da ponte
      else if (f === 42) pr = 'use' // lê a inscrição
      else if (f < 130) m = go({ x: 7, z: 60 }) // tenta entrar no rio (a parte funda barra)
      else if (f === 130) s9.riverZ = Math.round(q.z * 100) / 100
      else if (f < 380) m = f < 180 ? go({ x: 14, z: 66 }) : f < 280 ? go({ x: 14, z: 48 }) : go({ x: 22, z: 48.4 }) // pela ponte até o cruceiro
      else if (f === 382) pr = 'use' // descansa no ✝ da Ponte
      else if (f === 400) tp(2, 33.6)
      else if (f === 402) pr = 'use' // pão da fonte
      else if (f === 440) tp(36, -4.4)
      else if (f === 442) pr = 'use' // portão por fora: fechado
      else if (f === 470) tp(32.4, -11.4)
      else if (f === 472) pr = 'use' // alavanca
      else if (f > 490 && f < 860) m = f < 510 ? go({ x: 36, z: -10 }) : go({ x: 36, z: 42 }) // atravessa o portão e desce o corredor
      else if (f === 860) s9.laneEnd = [Math.round(q.x * 100) / 100, Math.round(q.z * 100) / 100]
      else if (f === 890) tp(32, -53.6)
      else if (f === 892) pr = 'use' // névoa
      else if (f > 900 && f < 1000) m = go({ x: 32, z: -62 }) // tenta atravessar a névoa
      else if (f === 1000) s9.fogZ = Math.round(q.z * 100) / 100
      else if (f === 1040) { const d = g2.save(); g2.load(JSON.parse(JSON.stringify(d))); s9.roundtrip = JSON.stringify(g2.save()) === JSON.stringify(d) }
      g2.setInput('local', { mx: m[0], mz: m[1], ax: 0, az: 0, run: 0 })
      if (pr) g2.act('local', pr)
      g2.update(dt)
      if (trace) trace.push(`v${f} ${q.x.toFixed(3)},${q.z.toFixed(3)},${q.gy.toFixed(3)} b${q.bread} gate ${world.gates.portao.isOpen}`)
    }

    // ---- S10 (no vale): trasno, fondeiro, Lobishome, atalhos 1 e 3, anaco de cabaça ----
    const s10 = { stolen: 0, back: 0, stones: 0, stoneHits: 0, stoneBlocks: 0, knockdown: 0, summons: 0, lobisVencido: null, lobisVolta: null,
      tempSomem: null, ferreiro: null, horreo: null, anaco: null }
    events.on('cera-stolen', ({ n }) => { s10.stolen += n })
    events.on('cera-back', ({ n }) => { s10.back += n })
    events.on('stone', () => s10.stones++)
    events.on('hurt', ({ by }) => { if (by && by.kind === 'fondeiro') s10.stoneHits++ })
    events.on('block', ({ by }) => { if (by && by.kind === 'fondeiro') s10.stoneBlocks++ })
    events.on('knockdown', () => s10.knockdown++)
    events.on('summon', () => s10.summons++)
    let tr = null, fo = null, lo = null, bot2 = { warned: null }
    for (let f = 0; f < 1500; f++) {
      now += dt * 1000
      let m = [0, 0], pr = null, guard = 0
      // A: trasno rouba (o robô parado com 100 de cera), foge; o robô chega por trás e bate até matá-lo (a cera volta)
      if (f === 0) { tp(8, 46); q.cera = 100; q.facing = Math.PI / 2; tr = g2.spawn('trasno', 12, 46, -Math.PI / 2) }
      if (f > 150 && f < 330 && !tr.dead) {
        if (f % 20 === 0) { Object.assign(q, { x: tr.x - Math.sin(tr.facing) * 1.4, z: tr.z - Math.cos(tr.facing) * 1.4 }); q.facing = tr.facing }
        if (f % 6 === 0) pr = 'light'
      }
      // B: fondeiro a 10 m (o robô de frente): 1ª pedra no escudo, 2ª no corpo, 3ª rola para o lado no fim do aviso
      if (f === 340) { tp(16, 44); q.facing = Math.atan2(12, -3.5); q.hp = 100; fo = g2.spawn('fondeiro', 28, 40.5, Math.atan2(-12, 3.5)) }
      if (f > 340 && f < 600) {
        const A = fo.atk
        if (s10.stoneHits + s10.stoneBlocks === 0) guard = 1 // escudo até a 1ª pedra chegar
        if (s10.stones >= 2 && A && A.name === 'sling' && A.phase === 'warn' && A.t > A.def.warn - 0.15 && bot2.warned !== A) { bot2.warned = A; pr = 'roll'; m = [1, 0] }
      }
      if (f === 600) { fo.vanish(); q.hp = 100 }
      // C: Lobishome a 6 m: salta (golpe forte: derruba); com a vida baixa, uiva (2 trasnos); morre; descansar não o traz de volta
      if (f === 620) { tp(-14, -36); q.facing = Math.PI; q.hp = 100; lo = g2.spawn('lobishome', -14, -42, 0) }
      if (f === 700) lo.hp = 150
      if (f === 860) { lo.hp = 5; Object.assign(q, { x: lo.x + Math.sin(lo.facing) * 1.8, z: lo.z + Math.cos(lo.facing) * 1.8, facing: lo.facing + Math.PI, downT: 0, down: false, hurtT: 0 }) }
      if (f > 860 && f < 900 && !lo.dead && f % 5 === 0) pr = 'light'
      if (f === 920) {
        s10.lobisVencido = g2.save().vencidos.includes('lobishome')
        for (const e of g2.enemies) e.reset() // como um descanso
        s10.lobisVolta = !lo.dead
        s10.tempSomem = g2.enemies.filter((e) => e.temp).every((e) => e.dead)
        q.hp = 100
      }
      // D: atalhos 1 (quintal do ferreiro) e 3 (escada do hórreo): fechado por fora, abre do lado certo, dá para passar
      if (f === 940) tp(-24, 16.8)
      if (f === 942) pr = 'use'
      if (f === 960) tp(-22.4, 13.4)
      if (f === 962) pr = 'use'
      if (f > 970 && f < 1040) m = f < 990 ? go({ x: -24, z: 13 }) : go({ x: -24, z: 24 })
      if (f === 1040) s10.ferreiro = Math.round(q.z * 100) / 100
      if (f === 1060) tp(-44, -14.2)
      if (f === 1062) pr = 'use'
      if (f === 1080) tp(-45.6, -18.2)
      if (f === 1082) pr = 'use'
      if (f > 1090 && f < 1160) m = f < 1110 ? go({ x: -44, z: -18 }) : go({ x: -44, z: -12.5 })
      if (f === 1160) s10.horreo = Math.round(q.z * 100) / 100
      // E: anaco de cabaça no andar de cima da casa do ferreiro
      if (f === 1180) { const a = world.anchors.anaco; Object.assign(q, { x: a.x, z: a.z, gy: a.y, lv: 1, jy: 0, vy: 0 }) }
      if (f === 1190) pr = 'use'
      if (f === 1200) s10.anaco = [q.lv, q.gourdMax]
      g2.setInput('local', { mx: m[0], mz: m[1], ax: 0, az: 0, run: 0, guard })
      if (pr) g2.act('local', pr)
      g2.update(dt)
      if (trace) trace.push(`w${f} ${q.x.toFixed(3)},${q.z.toFixed(3)},${q.gy.toFixed(3)} lv${q.lv} hp ${q.hp} cera ${q.cera}${q.down ? ' DOWN' : ''}${q.safe ? ' safe' : ''} ${g2.enemies.filter((e) => !e.dead).map((e) => `${e.kind} ${e.x.toFixed(1)},${e.z.toFixed(1)} ${e.state}${e.atk ? ':' + e.atk.name + ':' + e.atk.phase : ''} hp ${e.hp}`).join(' | ')}`)
    }

    // ---- S11 (no vale): o chefe do castro. Atravessa a névoa, o robô desvia (rola no fim de cada aviso) e pune; apara o bote
    // (a postura enche: a cabeça cai) e dá o crítico; a serpe vira pedra e a moura sai; morre (o chefe volta a dormir);
    // entra de novo e vence: a névoa some, sai andando, salva e carrega ----
    const s11 = { enter: 0, warns: {}, hurt: 0, parry: 0, broken: 0, critical: 0, phase: 0, end: 0, lift: 0, reset: null, out: null, save: null }
    events.on('fog-enter', () => s11.enter++)
    events.on('boss-warn', ({ name }) => { s11.warns[name] = (s11.warns[name] || 0) + 1 })
    events.on('hurt', ({ by }) => { if (by && by.kind === 'castro') s11.hurt++ })
    events.on('parry', ({ by }) => { if (by && by.kind === 'castro') s11.parry++ })
    events.on('enemy-broken', (e) => { if (e.kind === 'castro') s11.broken++ })
    events.on('hit', ({ kind, target }) => { if (kind === 'critical' && target.kind === 'castro') s11.critical++ })
    events.on('boss-phase', () => s11.phase++)
    events.on('boss-end', () => s11.end++)
    events.on('fog-lift', () => s11.lift++)
    const bo = g2.spawn('castro', 32, -71, 0), bot3 = { warned: null, p2: 0, dead: 0, again: 0 }
    const atFog = () => { Object.assign(q, { x: 32, z: -53.6, vx: 0, vz: 0, lv: 0, gy: SantaBaiaGround(32, -53.6), jy: 0, vy: 0, facing: Math.PI, lock: null }); q.hp = q.max }
    // robô: rola no fim de cada aviso (bote: para o lado; rabada, aperto e encanto: para longe), apara o bote (parry = true);
    // na janela (cabeça no chão, recuperando, de joelhos) chega perto e bate
    function bossBot(f, parry) {
      const A = bo.atk
      if (A && bot3.warned !== A && parry && A.name === 'bite' && A.phase === 'strike') { bot3.warned = A; return [[0, 0], 'parry'] }
      if (A && A.phase === 'warn' && bot3.warned !== A && !(parry && A.name === 'bite')) {
        const d = A.def, left = (A.name === 'encanto' ? d.vanish + d.mark : d.warn) - A.t
        if (left >= 0.12) return [[0, 0], null]
        bot3.warned = A
        const a = Math.atan2(q.x - bo.x, q.z - bo.z), dir = A.name === 'bite' || A.name === 'fio' || A.name === 'fuso' ? a + Math.PI / 2 : a
        return [[Math.sin(dir), Math.cos(dir)], 'roll']
      }
      if (A && A.phase !== 'recover') return [[0, 0], null]
      const pt = bo.hitPoint(q.x, q.z), l = Math.hypot(pt.x - q.x, pt.z - q.z)
      if ((bo.grounded || bo.state === 'broken' || A) && l - pt.r > 1.2) return [[(pt.x - q.x) / l, (pt.z - q.z) / l], null]
      return [[0, 0], l - pt.r < 1.6 && f % 9 === 0 && q.stamina > 30 ? 'light' : null]
    }
    for (let f = 0; f < 2100; f++) {
      now += dt * 1000
      let m = [0, 0], pr = null
      if (f === 0) atFog()
      if (f === 2) pr = 'use' // atravessa a névoa
      if (f === 10) pr = 'lock'
      if (f === 150) bo.posture = 160 // falta pouco: o próximo bote aparado quebra a postura
      if (f > 10 && f < 1200 && !q.dead && f !== 150 && !bot3.dead) [m, pr] = bossBot(f, f > 150 && !bot3.p2)
      if (f === 600 && bo.phase === 1) bo.hp = 20 // encurta a fase 1
      if (bo.phase === 2 && !bot3.p2) bot3.p2 = f
      // morre na fase 2 (o robô para): volta no cruceiro e o chefe dorme de novo, fase 1, vida cheia
      if (bot3.p2 && f === bot3.p2 + 450) { bot3.dead = f; q.hp = 1 }
      if (bot3.dead && f === bot3.dead + 260) s11.reset = [q.dead, bo.state, bo.phase, bo.hp, bo.dead]
      // entra de novo e vence (vida do chefe encurtada: o que vale é a troca de fase e o fim)
      if (bot3.dead && f === bot3.dead + 270) { atFog(); pr = 'use'; bot3.again = f }
      if (bot3.again && f === bot3.again + 5) bo.hp = 1
      if (bot3.again && bo.phase === 2 && bo.state === 'fight' && bo.hp > 1 && !bo.dead) bo.hp = 1
      if (bot3.again && f > bot3.again && !bo.dead && !q.dead) [m, pr] = bossBot(f, false)
      if (bot3.again && bo.dead && !bot3.won) bot3.won = f
      if (bot3.won && f > bot3.won + 30 && f < bot3.won + 200) m = go({ x: 32, z: -50 }) // sai pela névoa desfeita
      if (bot3.won && f === bot3.won + 200) {
        s11.out = Math.round(q.z * 100) / 100
        const d = g2.save(); g2.load(JSON.parse(JSON.stringify(d)))
        s11.save = [d.vencidos.includes('castro'), world.fogs.find((w) => w.id === 'castro').col.off, bo.dead, JSON.stringify(g2.save()) === JSON.stringify(d)]
      }
      g2.setInput('local', { mx: m[0], mz: m[1], ax: 0, az: 0, run: 0 })
      if (pr) g2.act('local', pr)
      g2.update(dt)
      if (trace) trace.push(`b${f} ${q.x.toFixed(3)},${q.z.toFixed(3)} hp ${q.hp}${q.dead ? ' DEAD' : ''}${q.safe ? ' safe' : ''} | ${bo.name} ${bo.x.toFixed(2)},${bo.z.toFixed(2)} ${bo.state}${bo.atk ? ':' + bo.atk.name + ':' + bo.atk.phase : ''} hp ${bo.hp} pos ${bo.posture.toFixed(1)}`)
    }

    if (trace) (await import('node:fs')).writeFileSync(process.env.SIM_TRACE, trace.join('\n'))
    const r = (v) => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v)
    const state = {
      s9, s10, s11, vale: [r(q.x), r(q.z), r(q.gy), q.bread, q.home, q.cera, q.gourdMax],
      players: [...game.players.values()].map((q) => [q.id, r(q.x), r(q.z), r(q.gy), q.lv, r(q.stamina), r(q.facing), q.tired]),
      door: door ? [r(door.x), r(door.z)] : null,
      camera: [r(camera.cam.position.x), r(camera.cam.position.y), r(camera.cam.position.z)],
      rolls, safeFrames, locks, hurts, deaths, kills, s6, s7, s8, items: [p.hp, p.gourd, p.bread], cera: p.cera, home: p.home,
      targets: game.targets.map((e) => [e.id, e.hits, e.dmg, e.posture]),
      enemies: game.enemies.map((e) => [e.id, r(e.x), r(e.z), e.hp, e.state, e.dead]),
    }
    const [, x, z, , lv, st] = state.players[0]
    const t0 = game.targets[0]
    return { hash: createHash('sha256').update(JSON.stringify(state)).digest('hex'), summary: `jogador em (${x.toFixed(2)}, ${z.toFixed(2)}) · andar ${lv} · fôlego ${Math.round(st)} · ${rolls} rolamentos · boneco: ${t0.hits} golpes, ${t0.dmg} de dano · levou ${hurts} golpes, ${deaths} morte(s), ${kills} inimigo(s) vencido(s) · escudo ${s6.block}, aparos ${s6.parry}, guarda quebrada ${s6.guardBreak}, joelhos ${s6.broken}, críticos ${s6.critical} · curas ${s7.healed}, perdidas ${s7.lost}, vazio ${s7.empty}, vida ${p.hp}, goles ${p.gourd}, pães ${p.bread} · descansos ${s8.rest}, velas ${s8.candle}, pegas ${s8.pick}, perdidas ${s8.lost}, cera ${p.cera}, save ${s8.roundtrip ? 'ok' : 'DIFERENTE'} · vale: itens ${s9.pickups.length}, portão fechado ${s9.locked}, atalho ${s9.shortcut}, fim do corredor (${s9.laneEnd}), névoa ${s9.fog} (parou em z ${s9.fogZ}), rio (parou em z ${s9.riverZ}), save ${s9.roundtrip ? 'ok' : 'DIFERENTE'} · S10: roubada ${s10.stolen}/devolvida ${s10.back}, pedras ${s10.stones} (escudo ${s10.stoneBlocks}, acertou ${s10.stoneHits}), derrubado ${s10.knockdown}, trasnos chamados ${s10.summons}, Lobishome no save ${s10.lobisVencido}, volta ${s10.lobisVolta}, chamados somem ${s10.tempSomem}, ferreiro z ${s10.ferreiro}, hórreo z ${s10.horreo}, anaco [andar, goles] ${s10.anaco} · S11: névoa ${s11.enter}, avisos ${Object.entries(s11.warns).map(([k, v]) => k + ' ' + v).join(', ')}, levou ${s11.hurt}, aparos ${s11.parry}, joelhos ${s11.broken}, críticos ${s11.critical}, fases ${s11.phase}, morreu e voltou [morto, estado, fase, vida, vencido] ${s11.reset}, venceu ${s11.end}, névoa some ${s11.lift}, saiu em z ${s11.out}, save [vencido, névoa aberta, chefe morto, igual] ${s11.save}${door ? '' : ' · casa sem porta?'}` }
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
