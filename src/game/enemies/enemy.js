import { resolve } from '../../engine/world/collision'
import { events } from '../../engine/core/events'

// Inimigo genérico (DESIGN 3.5 e 5): parado → vê o jogador → geme → aproxima → AVISA → golpeia → recua (janela para punir)
// → espera → ... Levou golpe fora do ataque: tropeça. Longe demais de casa ou o jogador sumiu: volta para casa.
// Regras de justiça: aviso de no mínimo 0,4 s; no aviso gira no máximo `warnTurn` graus/s; no golpe não gira;
// golpe não atravessa parede (ctx.sees).
// spec = { kind, tune (números do balance), build() → modelo, choose(e, dist) → nome do ataque, pose(e, A) → pose do corpo }
// ctx = { players, sees(a, b), hurt(p, dmg, dir, by, strong) → acertou? }
// Avisos: 'enemy-alert', 'enemy-warn' ({ e, name }), 'enemy-swing', 'enemy-stagger', 'enemy-death'.
const DEG = Math.PI / 180
const wrap = (a) => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI }
const turnTo = (a, b, rate, dt) => { const d = wrap(b - a); return a + Math.sign(d) * Math.min(Math.abs(d), rate * dt) }
const PLAYER_R = 0.45

export function CreateEnemy(scene, spec, x, z, ry, ctx) {
  const T = spec.tune
  const model = spec.build()
  scene.add(model.root)
  const e = {
    id: `${spec.kind}-${x},${z}`, kind: spec.kind, x, z, y: 0, r: T.r, facing: ry, home: { x, z, ry },
    hp: T.hp, maxHp: T.hp, posture: 0, maxPosture: T.posture, dead: false, model,
    state: 'idle', stT: 0, vel: 0, hitT: 0, fallDir: -1, pose: null, poseW: 0, waitT: 0, target: null,
    atk: null, // { name, def, phase: 'warn' | 'strike' | 'gap' | 'recover', i: golpe atual, t, a: direção travada, hit }
    group: model.root, radius: T.r, dying: 0, // nomes que a sombra falsa do motor espera (engine/render/entity-shadows.js)
  }
  const set = (s) => { e.state = s; e.stT = 0 }
  const dist = (p) => Math.hypot(p.x - e.x, p.z - e.z)
  const angTo = (p) => Math.atan2(p.x - e.x, p.z - e.z)

  // o jogador mais perto que ele enxerga
  function look() {
    let best = null, bd = T.sight
    for (const p of ctx.players.values()) {
      const d = dist(p)
      if (!p.dead && d < bd && ctx.sees(e, p)) { bd = d; best = p }
    }
    return best
  }
  const lost = () => !e.target || e.target.dead || dist(e.target) > T.forget || Math.hypot(e.x - e.home.x, e.z - e.home.z) > T.leash

  // anda para (tx, tz): primeiro vira, depois anda para onde está virado (rolar por fora dele funciona)
  function walk(tx, tz, dt, speed) {
    const a = Math.atan2(tx - e.x, tz - e.z)
    e.facing = turnTo(e.facing, a, T.turn, dt)
    const go = Math.abs(wrap(a - e.facing)) < 1 ? speed : 0
    e.x += Math.sin(e.facing) * go * dt; e.z += Math.cos(e.facing) * go * dt
    e.vel = go
    resolve(e, e.r, null, 0)
  }

  function startAttack() {
    const name = spec.choose(e, dist(e.target))
    e.atk = { name, def: T.attacks[name], phase: 'warn', i: 0, t: 0, a: e.facing, hit: false }
    set('attack')
    events.emit('enemy-warn', { e, name })
  }
  function runAttack(dt) {
    const A = e.atk, d = A.def, p = e.target
    A.t += dt
    if (A.phase === 'warn') {
      if (p) e.facing = turnTo(e.facing, angTo(p), d.warnTurn * DEG, dt) // no aviso ainda acompanha, devagar
      if (A.t >= d.warn) { A.phase = 'strike'; A.t = 0; A.a = e.facing; A.hit = false; events.emit('enemy-swing', { e, name: A.name }) }
    } else if (A.phase === 'strike') {
      // no golpe não gira; um passo à frente se o ataque tiver (lunge)
      if (d.lunge) { e.x += Math.sin(A.a) * (d.lunge / d.hits[A.i]) * dt; e.z += Math.cos(A.a) * (d.lunge / d.hits[A.i]) * dt; resolve(e, e.r, null, 0) }
      if (!A.hit) for (const q of ctx.players.values()) {
        if (q.dead || dist(q) - PLAYER_R > d.range || Math.abs(wrap(angTo(q) - A.a)) > d.arc * DEG || !ctx.sees(e, q)) continue
        if (ctx.hurt(q, d.dmg, A.a, e, !!d.strong)) A.hit = true
      }
      if (A.t >= d.hits[A.i]) {
        A.i++; A.t = 0; A.hit = false
        A.phase = A.i < d.hits.length ? 'gap' : 'recover'
      }
    } else if (A.phase === 'gap') {
      if (A.t >= d.gap) { A.phase = 'strike'; A.t = 0; events.emit('enemy-swing', { e, name: A.name }) }
    } else if (A.t >= d.recover) {
      e.atk = null
      e.waitT = T.wait[0] + Math.random() * (T.wait[1] - T.wait[0])
      set('wait')
    }
  }

  function update(dt) {
    e.stT += dt
    e.hitT = Math.max(0, e.hitT - dt)
    e.vel = 0
    switch (e.state) {
      case 'idle': {
        const p = look()
        if (p) { e.target = p; set('alert'); events.emit('enemy-alert', e) }
        break
      }
      case 'alert':
        e.facing = turnTo(e.facing, angTo(e.target), T.turn, dt)
        if (e.stT >= T.alert) set('approach')
        break
      case 'approach':
        if (lost()) { set('return'); break }
        if (dist(e.target) <= T.reach) startAttack()
        else walk(e.target.x, e.target.z, dt, T.walk)
        break
      case 'wait':
        if (lost()) { set('return'); break }
        e.facing = turnTo(e.facing, angTo(e.target), T.turn * 0.6, dt)
        if (e.stT >= e.waitT) dist(e.target) <= T.reach + 0.4 ? startAttack() : set('approach')
        break
      case 'attack': runAttack(dt); break
      case 'stagger':
        if (e.stT >= T.stagger) set(lost() ? 'return' : 'approach')
        break
      case 'return':
        if (Math.hypot(e.x - e.home.x, e.z - e.home.z) < 0.4) { e.facing = e.home.ry; e.target = null; set('idle'); break }
        walk(e.home.x, e.home.z, dt, T.walk)
        if (e.stT > 1) { const p = look(); if (p && Math.hypot(e.x - e.home.x, e.z - e.home.z) < T.leash * 0.6) { e.target = p; set('approach') } }
        break
      case 'dead':
        // fica caído; depois de um tempo afunda no chão e some
        if (e.stT > T.sink) e.y = -Math.min(1.5, (e.stT - T.sink) * 0.6)
        model.root.visible = e.stT < T.sink + 2.5
        break
    }
    // pose do corpo: entra rápido no ataque, sai devagar
    if (e.atk) e.pose = spec.pose(e, e.atk)
    e.poseW += ((e.atk ? 1 : 0) - e.poseW) * (1 - Math.exp(-(e.atk ? 18 : 6) * dt))
    model.root.position.set(e.x, e.y, e.z)
    model.root.rotation.y = e.facing
    model.animate(dt, { state: e.state === 'dead' ? 'dead' : e.state === 'stagger' ? 'stagger' : 'idle', vel: e.vel, hitT: e.hitT, stT: e.stT, fallDir: e.fallDir, pose: e.pose, poseW: e.poseW })
  }

  // levou golpe do jogador
  e.hit = ({ dmg, dir }) => {
    if (e.dead) return
    e.hp -= dmg
    e.hitT = 0.3
    model.flash(0.08)
    if (e.hp <= 0) {
      e.hp = 0; e.dead = true; e.atk = null; e.dying = 1
      e.fallDir = Math.abs(wrap(dir - e.facing)) > Math.PI / 2 ? -1 : 1 // golpe de frente: cai de costas
      set('dead')
      events.emit('enemy-death', e)
      return
    }
    if (!e.target) for (const p of ctx.players.values()) { e.target = p; break }
    // no aviso e no golpe ele não para (não dá para trocar golpe com ele); fora disso, tropeça
    if (!e.atk || e.atk.phase === 'recover') { e.atk = null; set('stagger'); events.emit('enemy-stagger', e) }
  }
  e.update = update
  // volta ao começo (o jogador morreu e voltou: os inimigos renascem)
  e.reset = () => {
    Object.assign(e, { x: e.home.x, z: e.home.z, y: 0, facing: e.home.ry, hp: T.hp, posture: 0, dead: false, dying: 0, atk: null, target: null, poseW: 0, hitT: 0 })
    set('idle')
    model.root.visible = true
  }
  return e
}
