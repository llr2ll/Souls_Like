import { ApplyInput } from '../engine/input/contract'
import { events } from '../engine/core/events'
import { HitWall } from '../engine/world/collision'
import { CreatePlayerModel } from '../shared/characters/player'
import { UpdatePlayerMovement } from '../shared/characters/player-movement'
import { CreateDummy } from './world/dummy'
import { CreateRomeiro } from './enemies/romeiro'
import { BALANCE } from './config/balance'

// Estado e regras do jogo (sem desenhar: o replay do npm run check roda isto sem navegador).
// S2: fôlego, correr e rolar. S3: golpe leve (combo de 3) e pesado contra bonecos de treino. S4: travar no alvo.
// S5: inimigos (Romeiro perdido), levar golpe, morrer e voltar ao começo.
// Avisos (engine/core/events.js) para o main.js tocar som e tremer: 'roll', 'roll-land', 'swing' (lâmina começou a cortar),
// 'hit' (golpe acertou: { by, target, kind }), 'lock' (travou, trocou ou soltou: { p, target }),
// 'hurt' (jogador levou golpe: { p, dmg, strong }), 'death' (jogador morreu), 'respawn'. Os inimigos avisam 'enemy-*' (enemies/enemy.js).
const DEG = Math.PI / 180
const wrap = (a) => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI }
const KINDS = { romeiro: CreateRomeiro }
const PLAYER_R = 0.45

export function CreateGame(scene) {
  const players = new Map()
  const PL = BALANCE.player, R = BALANCE.roll, AT = BALANCE.attack, LK = BALANCE.lock, HU = BALANCE.hurt
  const dummies = BALANCE.dummies.map((d) => CreateDummy(scene, d.x, d.z))
  const enemies = []
  const targets = [...dummies] // o que pode levar golpe: bonecos e inimigos
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
      hurtT: 0, kbx: 0, kbz: 0, deadT: 0, // tropeço (tempo e empurrão); morto há quanto tempo
    })
  }
  // inimigos: o jogo (main.js) põe os da arena; o replay põe na hora da cena dele
  const ctx = { players, sees: (a, b) => sees(a, b), hurt: (p, dmg, dir, by, strong) => hurtPlayer(p, dmg, dir, by, strong) }
  function spawn(kind, x, z, ry = 0) {
    const e = KINDS[kind](scene, x, z, ry, ctx)
    enemies.push(e); targets.push(e)
    return e
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
  // a vê b? (nenhuma parede alta no caminho; pedra baixa não tapa). Vale para jogador → alvo e inimigo → jogador
  function sees(a, b) {
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz)
    for (let s = 0.6; s < d - (b.r || PLAYER_R) - 0.2; s += 0.5) if (HitWall(a.x + (dx / d) * s, a.z + (dz / d) * s, a.lv || 0)) return false
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
  const free = (p) => !p.dead && p.hurtT <= 0 // tropeçando ou morto não age
  const canRoll = (p) => free(p) && !rolling(p) && p.stamina > 0 && (!p.atk || p.atk.t >= p.atk.def.hit[1])
  const canAttack = (p) => free(p) && !rolling(p) && !p.atk && p.stamina > 0

  // ---- levar golpe ----
  // devolve true se acertou (rolando invulnerável ou morto: não acerta)
  function hurtPlayer(p, dmg, dir, by, strong) {
    if (p.dead || p.safe) return false
    p.hp = Math.max(0, p.hp - dmg)
    // tropeço: perde o golpe/rolamento em andamento e é empurrado para trás
    p.atk = null; p.rollT = -1; p.safe = false; p.comboN = 0
    p.hurtT = HU.stagger; p.kbx = Math.sin(dir) * HU.push; p.kbz = Math.cos(dir) * HU.push
    p.model.play('stagger', 0.05) // corta a animação do golpe/rolamento que estava no meio
    p.model.hurt()
    events.emit('hurt', { p, dmg, by, strong })
    if (p.hp <= 0) {
      p.dead = true; p.deadT = 0; p.hurtT = 0; p.lock = null; p.queue = null; p.dashT = 0
      p.model.die()
      events.emit('death', p)
    }
    return true
  }
  // voltar ao começo (o cruceiro chega no S8): vida e fôlego cheios, inimigos de volta ao lugar
  function respawn(p) {
    Object.assign(p, { x: PL.start.x, z: PL.start.z, vx: 0, vz: 0, facing: Math.PI, hp: p.max, stamina: p.staminaMax, dead: false, deadT: 0, tired: false })
    for (const e of enemies) e.reset()
    events.emit('respawn', p)
  }

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
      if (A.hit.has(e) || e.dead) continue
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
    if (p.dead) {
      p.vx = p.vz = 0; p.speed = 0
      if ((p.deadT += dt) >= HU.respawn) respawn(p)
      p.model.animate(dt, p)
      return
    }
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
    const roll = rolling(p), A = p.atk, hurt = p.hurtT > 0
    if (hurt) {
      // tropeço: empurrado para trás, perdendo força até parar
      const k = p.hurtT / HU.stagger
      p.dashT = 1; p.dashA = Math.atan2(p.kbx, p.kbz); p.dashV = Math.hypot(p.kbx, p.kbz) * k
      p.hurtT -= dt
      if (p.hurtT <= 0) p.dashT = 0
    } else if (roll) {
      p.dashT = 1; p.dashA = p.rollA; p.dashV = rollPeak() * Math.cos((p.rollT / R.time) * Math.PI / 2)
      p.safe = p.rollT >= R.safe[0] && p.rollT < R.safe[1]
    } else if (A) {
      const step = A.def.hit[0] + 0.04 // o passo à frente acaba logo depois de a lâmina começar a cortar
      p.dashT = 1; p.dashA = A.a; p.dashV = A.t < step ? A.def.lunge / step : 0
    }
    if (roll || A) p.restT = 0 // rolando ou atacando o fôlego não volta: a espera de 0,5 s conta do fim da ação
    updateLock(p, dt)
    Object.assign(p.input, p.raw)
    p.input.run = !roll && !A && !hurt && p.dodgeT >= R.tap ? 1 : 0
    // travado e sem correr: anda de frente para o alvo (de lado, de costas). O movimento copiado chama isso de "mirar"
    // (rolando, atacando ou tropeçando, o corpo segue a ação)
    if (p.lock && !p.input.run && !roll && !A && !hurt) { const a = toward(p, p.lock); p.input.ax = Math.sin(a); p.input.az = Math.cos(a) }
    UpdatePlayerMovement(p, dt, null, BALANCE.move)

    if (hurt) {
      // nada: o tropeço já andou acima
    } else if (roll) {
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

  // corpos não se atravessam: jogador e inimigos vivos se empurram (metade para cada um)
  function separate() {
    const bodies = [...players.values(), ...enemies].filter((b) => !b.dead)
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j], dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), min = (a.r || PLAYER_R) + (b.r || PLAYER_R)
      if (d >= min || d < 1e-6) continue
      const push = (min - d) / 2
      a.x -= (dx / d) * push; a.z -= (dz / d) * push; b.x += (dx / d) * push; b.z += (dz / d) * push
    }
  }

  function update(dt) {
    if (stopT > 0) { stopT -= dt; return } // pausa no impacto: tudo parado (o desenho continua)
    for (const p of players.values()) updatePlayer(p, dt)
    for (const e of targets) e.update(dt)
    separate()
  }
  function clear() { for (const id of [...players.keys()]) removePlayer(id) }

  return { players, targets, enemies, addPlayer, removePlayer, spawn, setInput, act, update, clear }
}
