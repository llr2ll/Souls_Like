import { ApplyInput } from '../engine/input/contract'
import { events } from '../engine/core/events'
import { HitWall } from '../engine/world/collision'
import { CreatePlayerModel } from '../shared/characters/player'
import { UpdatePlayerMovement } from '../shared/characters/player-movement'
import { CreateDummy } from './world/dummy'
import { BALANCE } from './config/balance'

// Estado e regras do jogo (sem desenhar: o replay do npm run check roda isto sem navegador).
// S2: fôlego, correr e rolar. S3: golpe leve (combo de 3) e pesado contra bonecos de treino. S4: travar no alvo.
// Avisos (engine/core/events.js) para o main.js tocar som e tremer: 'roll', 'roll-land', 'swing' (lâmina começou a cortar),
// 'hit' (golpe acertou: { by, target, kind }), 'lock' (travou, trocou ou soltou: { p, target }).
const DEG = Math.PI / 180
const wrap = (a) => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI }

export function CreateGame(scene) {
  const players = new Map()
  const PL = BALANCE.player, R = BALANCE.roll, AT = BALANCE.attack, LK = BALANCE.lock
  const targets = BALANCE.dummies.map((d) => CreateDummy(scene, d.x, d.z)) // o que pode levar golpe (inimigos entram no S5)
  let stopT = 0 // pausa no impacto: o jogo fica parado enquanto > 0
  // velocidade no começo do rolamento: ela cai em curva (cosseno) até parar no fim, andando R.distance
  const rollPeak = () => (Math.PI * R.distance) / (2 * R.time)

  function addPlayer(id, name) {
    if (players.has(id)) return
    const model = CreatePlayerModel(PL.look)
    scene.add(model.root)
    players.set(id, {
      id, name, model, x: PL.start.x, z: PL.start.z, vx: 0, vz: 0, aimAngle: Math.PI, facing: Math.PI, turn: 0, speed: 0,
      aiming: false, firing: false, jy: 0, vy: 0, gy: 0, y: 0, lv: 0, stamina: PL.stamina, staminaMax: PL.stamina, restT: 0,
      tired: false, running: false, hp: PL.hp, max: PL.hp, dead: false,
      raw: { mx: 0, mz: 0, ax: 0, az: 0, run: 0 }, // o que o teclado/controle mandou
      input: { mx: 0, mz: 0, ax: 0, az: 0, run: 0 }, // o que o movimento recebe (o jogo decide: tocar não corre, rolando não anda)
      dodgeT: 0, // há quanto tempo o botão de rolar/correr está segurado
      queue: null, // ação guardada: { what: 'roll' | 'light' | 'heavy', t: tempo que ainda vale, a: direção no aperto }
      rollT: -1, rollA: 0, rollLand: false, safe: false, // safe = invulnerável agora
      atk: null, comboN: 0, comboT: 0, // golpe em andamento; próximo leve do combo e quanto tempo ele ainda emenda
      lock: null, lockLost: 0, // alvo travado; há quanto tempo não o vê
    })
  }
  function removePlayer(id) {
    const p = players.get(id)
    if (!p) return
    scene.remove(p.model.root)
    players.delete(id)
  }
  // contrato de input copiado do survivor (engine/input/contract.js): só ganha coisas, nunca muda
  function setInput(id, m) {
    const p = players.get(id)
    if (p) ApplyInput(p.raw, m)
  }
  // para onde: o stick no instante do aperto; solto = para a frente. Golpe com alvo travado: no alvo
  const stick = (p) => (Math.hypot(p.raw.mx, p.raw.mz) > 0.2 ? Math.atan2(p.raw.mx, p.raw.mz) : p.facing)
  const toward = (p, e) => Math.atan2(e.x - p.x, e.z - p.z)
  // a última ação apertada fica guardada por um instante e sai assim que der (o rolamento usa R.buffer; golpes, AT.buffer)
  const queue = (p, what) => {
    const roll = what === 'roll'
    p.queue = { what, t: roll ? R.buffer : AT.buffer, a: !roll && p.lock ? toward(p, p.lock) : stick(p) }
  }
  // ações: 'roll' rola, 'light' e 'heavy' atacam (o teclado e o controle rolam soltando o botão de correr cedo; ver update),
  // 'lock' trava/solta, 'lock-next' / 'lock-prev' trocam para o alvo à direita / à esquerda na tela
  function act(id, a) {
    const p = players.get(id)
    if (!p) return
    if (a === 'roll' || a === 'light' || a === 'heavy') queue(p, a)
    else if (a === 'lock') p.lock ? setLock(p, null) : setLock(p, pickLock(p))
    else if ((a === 'lock-next' || a === 'lock-prev') && p.lock) setLock(p, nextLock(p, a === 'lock-next' ? 1 : -1) || p.lock)
  }

  // ---- travar no alvo ----
  const alive = (e) => !e.dead
  function setLock(p, e) {
    if (e === p.lock) return
    p.lock = e; p.lockLost = 0
    events.emit('lock', { p, target: e })
  }
  // o mais perto na direção para onde ele olha (ou o stick aponta): cada radiano de desvio conta como LK.anglePenalty metros
  function pickLock(p) {
    const a = stick(p)
    let best = null, score = Infinity
    for (const e of targets) {
      const d = Math.hypot(e.x - p.x, e.z - p.z)
      if (!alive(e) || d > LK.range || !sees(p, e)) continue
      const s = d + Math.abs(wrap(toward(p, e) - a)) * LK.anglePenalty
      if (s < score) { score = s; best = e }
    }
    return best
  }
  // trocar: o alvo mais próximo do atual, do lado pedido na tela (dir 1 = direita, -1 = esquerda; a câmera é fixa)
  function nextLock(p, dir) {
    const cur = p.lock
    let best = null, score = Infinity
    for (const e of targets) {
      if (e === cur || !alive(e) || Math.hypot(e.x - p.x, e.z - p.z) > LK.range || !sees(p, e)) continue
      const side = (e.x - cur.x) * dir
      if (side <= 0) continue
      const s = side + Math.abs(e.z - cur.z) * 0.5
      if (s < score) { score = s; best = e }
    }
    return best
  }
  // vê o alvo? (nenhuma parede alta no caminho; pedra baixa não tapa)
  function sees(p, e) {
    const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz)
    for (let s = 0.6; s < d - e.r - 0.2; s += 0.5) if (HitWall(p.x + (dx / d) * s, p.z + (dz / d) * s, p.lv)) return false
    return true
  }
  function updateLock(p, dt) {
    const e = p.lock
    if (!e) return
    p.lockLost = sees(p, e) ? 0 : p.lockLost + dt
    if (!alive(e) || Math.hypot(e.x - p.x, e.z - p.z) > LK.release || p.lockLost > LK.lostTime) setLock(p, null)
  }

  const rolling = (p) => p.rollT >= 0
  const spend = (p, n) => { p.stamina = Math.max(0, p.stamina - n); p.restT = 0 } // qualquer fôlego acima de 0 basta; ele zera
  // rolar: não rolando e, se atacando, só depois do impacto (o rolamento é o único que cancela um golpe)
  const canRoll = (p) => !rolling(p) && p.stamina > 0 && (!p.atk || p.atk.t >= p.atk.def.hit[1])
  const canAttack = (p) => !rolling(p) && !p.atk && p.stamina > 0

  function startRoll(p, a) {
    p.rollA = a
    p.rollT = 0; p.rollLand = false
    p.atk = null; p.comboN = 0
    spend(p, R.stamina)
    p.model.play('roll', R.time)
    events.emit('roll', p)
  }
  function startAttack(p, kind, a) {
    const n = kind === 'light' ? (p.comboT > 0 ? p.comboN : 0) : 0
    const def = kind === 'light' ? AT.light[n] : AT.heavy
    p.atk = { kind, n, def, t: 0, a, hit: new Set(), swung: false }
    spend(p, def.stamina)
    p.model.play(def.anim, def.time)
  }
  // lâmina cortando: acerta cada alvo uma vez por golpe, se estiver no alcance e dentro da abertura
  function strike(p, A) {
    const d = A.def
    for (const e of targets) {
      if (A.hit.has(e)) continue
      const dx = e.x - p.x, dz = e.z - p.z
      if (Math.hypot(dx, dz) - e.r > d.range) continue
      const dir = Math.atan2(dx, dz)
      if (Math.abs(wrap(dir - A.a)) > d.arc * DEG) continue
      A.hit.add(e)
      e.hit({ dmg: d.dmg, posture: d.posture, dir, kind: A.kind })
      stopT = Math.max(stopT, BALANCE.juice.hitStop[A.kind] || 0)
      events.emit('hit', { by: p, target: e, kind: A.kind, x: e.x, z: e.z })
    }
  }

  function updatePlayer(p, dt) {
    // botão de rolar/correr: soltar antes de R.tap = rolar; segurar mais = correr
    if (p.raw.run) p.dodgeT += dt
    else { if (p.dodgeT > 0 && p.dodgeT < R.tap) queue(p, 'roll'); p.dodgeT = 0 }
    // ação guardada: sai assim que der; senão perde a validade
    const q = p.queue
    if (q) {
      if (q.what === 'roll' ? canRoll(p) : canAttack(p)) { p.queue = null; q.what === 'roll' ? startRoll(p, q.a) : startAttack(p, q.what, q.a) }
      else if ((q.t -= dt) <= 0) p.queue = null
    }
    // rolando ou atacando, o corpo segue o roteiro (a "investida" do movimento copiado: dashT/dashA/dashV)
    const roll = rolling(p), A = p.atk
    if (roll) {
      p.dashT = 1; p.dashA = p.rollA; p.dashV = rollPeak() * Math.cos((p.rollT / R.time) * Math.PI / 2)
      p.safe = p.rollT >= R.safe[0] && p.rollT < R.safe[1]
    } else if (A) {
      const step = A.def.hit[0] + 0.04 // o passo à frente acaba logo depois de a lâmina começar a cortar
      p.dashT = 1; p.dashA = A.a; p.dashV = A.t < step ? A.def.lunge / step : 0
    }
    if (roll || A) p.restT = 0 // rolando ou atacando o fôlego não volta: a espera de 0,5 s conta do fim da ação
    updateLock(p, dt)
    Object.assign(p.input, p.raw)
    p.input.run = !roll && !A && p.dodgeT >= R.tap ? 1 : 0
    // travado e sem correr: anda de frente para o alvo (de lado, de costas). O movimento copiado chama isso de "mirar"
    // (rolando ou atacando, o corpo segue a direção da ação)
    if (p.lock && !p.input.run && !roll && !A) { const a = toward(p, p.lock); p.input.ax = Math.sin(a); p.input.az = Math.cos(a) }
    UpdatePlayerMovement(p, dt, null, BALANCE.move)

    if (roll) {
      p.rollT += dt
      if (!p.rollLand && p.rollT >= R.time * 0.75) { p.rollLand = true; events.emit('roll-land', p) }
      if (p.rollT >= R.time) { p.rollT = -1; p.dashT = 0; p.safe = false }
    } else if (A) {
      const d = A.def, t1 = A.t + dt
      if (!A.swung && t1 >= d.hit[0]) { A.swung = true; events.emit('swing', { p, kind: A.kind }) }
      if (t1 >= d.hit[0] && A.t <= d.hit[1]) strike(p, A)
      A.t = t1
      if (A.t >= d.time) {
        p.atk = null; p.dashT = 0
        p.comboN = A.kind === 'light' ? (A.n + 1) % AT.light.length : 0
        p.comboT = A.kind === 'light' ? AT.combo : 0
      }
    }
    if (!p.atk && (p.comboT -= dt) <= 0) p.comboN = 0
    p.model.animate(dt, p)
  }

  function update(dt) {
    if (stopT > 0) { stopT -= dt; return } // pausa no impacto: tudo parado (o desenho continua)
    for (const p of players.values()) updatePlayer(p, dt)
    for (const e of targets) e.update(dt)
  }
  function clear() { for (const id of [...players.keys()]) removePlayer(id) }

  return { players, targets, addPlayer, removePlayer, setInput, act, update, clear }
}
