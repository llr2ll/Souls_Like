import { resolve } from '../../engine/world/collision'
import { GroundAt } from '../../engine/world/ground'
import { events } from '../../engine/core/events'
import { BALANCE } from '../config/balance'

// Inimigo genérico (DESIGN 3.5 e 5): parado → vê o jogador → geme → aproxima → AVISA → golpeia → recua (janela para punir)
// → espera → ... Levou golpe fora do ataque: tropeça. Longe demais de casa ou o jogador sumiu: volta para casa.
// Regras de justiça: aviso de no mínimo 0,4 s; no aviso gira no máximo `warnTurn` graus/s; no golpe não gira;
// golpe não atravessa parede (ctx.sees).
// Postura (DESIGN 3.4): cada golpe enche; esvazia sozinha depois de um tempo sem levar golpe; cheia (ou aparo certo) = de joelhos
// por `tune.broken` s, arma brilhando, aceitando o golpe crítico.
// Cada golpe (tune.attacks[nome]) pode ter, além de warn/hits/gap/recover/range/arc/dmg:
//   lunge (passo à frente, m) · leap (salto, m; leapH = altura) · projectile (atira: { speed, dmg }) · steal (fração da cera
//   roubada ao acertar; depois foge) · flee (s fugindo depois do golpe) · summon ({ kind, n }: chama ajuda, uma vez por luta) · strong
// tune.unique: vencido, não volta mais (Lobishome). tune.needSight: só ataca vendo o jogador (fondeiro).
// spec = { kind, tune, build() → modelo, choose(e, dist) → nome do ataque, pose(e, A) → pose do corpo, glow(model, ligado),
//          tick(e, dt) (extra por quadro, opcional) }
// ctx = { players, sees(a, b), hurt(p, dmg, dir, by, strong) → false | 'hit' | 'block' | 'parry', shoot(e, a, def), steal(e, p, f),
//         summon(e, kind, n) }
// Avisos: 'enemy-alert', 'enemy-warn' ({ e, name }), 'enemy-swing', 'enemy-stagger', 'enemy-broken', 'enemy-death', 'enemy-land'.
const DEG = Math.PI / 180
const wrap = (a) => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI }
const turnTo = (a, b, rate, dt) => { const d = wrap(b - a); return a + Math.sign(d) * Math.min(Math.abs(d), rate * dt) }
const PLAYER_R = 0.45
// de joelhos: braços caídos, tronco curvado (o modelo ajoelha com o estado 'feed' do zumbi)
const BROKEN_POSE = { armR: [0.35, -0.25], armL: [0.35, 0.25], spineX: 0.75, spineY: 0 }

// opts.sit: sentado (ajoelhado ao lume) até ver o jogador
export function CreateEnemy(scene, spec, x, z, ry, ctx, opts = {}) {
  const T = spec.tune
  const model = spec.build()
  scene.add(model.root)
  const e = {
    sit: !!opts.sit, unique: !!T.unique, tune: T,
    id: `${spec.kind}-${x},${z}`, kind: spec.kind, x, z, y: 0, r: T.r, facing: ry, home: { x, z, ry },
    hp: T.hp, maxHp: T.hp, posture: 0, maxPosture: T.posture, dead: false, model, cera: T.cera || 0,
    state: 'idle', stT: 0, vel: 0, hitT: 0, fallDir: -1, pose: null, poseW: 0, waitT: 0, target: null,
    postureT: 0, brokenT: 0, // tempo sem levar golpe (a postura só esvazia depois de um tempo); quanto tempo fica de joelhos
    jump: 0, fleeT: 0, stolen: 0, summoned: false, // altura do salto; tempo fugindo; cera roubada (trasno); já chamou ajuda
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
  // pode atacar daqui? (perto o bastante e, para quem atira, vendo o jogador)
  const inReach = (extra = 0) => dist(e.target) <= T.reach + extra && (!T.needSight || ctx.sees(e, e.target))

  function startAttack() {
    const name = spec.choose(e, dist(e.target))
    e.atk = { name, def: T.attacks[name], phase: 'warn', i: 0, t: 0, a: e.facing, hit: false }
    set('attack')
    events.emit('enemy-warn', { e, name })
  }
  function endAttack(d) {
    e.atk = null
    if (d.flee) { e.fleeT = d.flee; set('flee'); return }
    e.waitT = T.wait[0] + Math.random() * (T.wait[1] - T.wait[0])
    set('wait')
  }
  function runAttack(dt) {
    const A = e.atk, d = A.def, p = e.target
    A.t += dt
    if (A.phase === 'warn') {
      if (p) e.facing = turnTo(e.facing, angTo(p), d.warnTurn * DEG, dt) // no aviso ainda acompanha, devagar
      if (A.t >= d.warn) {
        A.phase = 'strike'; A.t = 0; A.a = e.facing; A.hit = false
        events.emit('enemy-swing', { e, name: A.name })
        if (d.projectile) ctx.shoot(e, A.a, d) // atira na direção travada
        if (d.summon && !e.summoned) { e.summoned = true; ctx.summon(e, d.summon.kind, d.summon.n) }
      }
    } else if (A.phase === 'strike') {
      // no golpe não gira; passo à frente (lunge) ou salto (leap, com altura em parábola)
      const step = d.leap || d.lunge, dur = d.hits[A.i]
      if (step) { e.x += Math.sin(A.a) * (step / dur) * dt; e.z += Math.cos(A.a) * (step / dur) * dt; resolve(e, e.r, null, 0) }
      if (d.leap) { const k = Math.min(1, A.t / dur); e.jump = 4 * (d.leapH || 1) * k * (1 - k) }
      if (!A.hit && !d.projectile && d.dmg) for (const q of ctx.players.values()) {
        if (q.dead || dist(q) - PLAYER_R > d.range || Math.abs(wrap(angTo(q) - A.a)) > d.arc * DEG || !ctx.sees(e, q)) continue
        const r = ctx.hurt(q, d.dmg, angTo(q), e, !!d.strong)
        if (r) A.hit = true
        if (r === 'parry') { e.jump = 0; parried(); return }
        if (r === 'hit' && d.steal) { ctx.steal(e, q, d.steal); e.jump = 0; e.atk = null; e.fleeT = T.fleeTime || 5; set('flee'); return }
      }
      if (A.t >= dur) {
        if (d.leap) { e.jump = 0; events.emit('enemy-land', { e, name: A.name }) }
        A.i++; A.t = 0; A.hit = false
        A.phase = A.i < d.hits.length ? 'gap' : 'recover'
      }
    } else if (A.phase === 'gap') {
      if (A.t >= d.gap) { A.phase = 'strike'; A.t = 0; events.emit('enemy-swing', { e, name: A.name }) }
    } else if (A.t >= d.recover) endAttack(d)
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
        if (inReach()) startAttack()
        else walk(e.target.x, e.target.z, dt, T.walk)
        break
      case 'wait':
        if (lost()) { set('return'); break }
        e.facing = turnTo(e.facing, angTo(e.target), T.turn * 0.6, dt)
        if (e.stT >= e.waitT) inReach(0.4) ? startAttack() : set('approach')
        break
      case 'attack': runAttack(dt); break
      case 'flee': {
        // foge para longe do jogador (correndo); depois volta para casa (o trasno leva a cera junto)
        const p = e.target
        if (p) { const a = angTo(p) + Math.PI; walk(e.x + Math.sin(a) * 5, e.z + Math.cos(a) * 5, dt, T.fleeSpeed || T.walk * 1.5) }
        if (e.stT >= e.fleeT) set('return')
        break
      }
      case 'stagger':
        if (e.stT >= T.stagger) set(lost() ? 'return' : 'approach')
        break
      case 'broken':
        // de joelhos: quando o tempo acaba, levanta com a postura zerada
        if (e.stT >= e.brokenT) { e.posture = 0; e.riposting = false; spec.glow(model, false); set(lost() ? 'return' : 'approach') }
        break
      case 'return':
        if (Math.hypot(e.x - e.home.x, e.z - e.home.z) < 0.4) { e.facing = e.home.ry; e.target = null; set('idle'); break }
        walk(e.home.x, e.home.z, dt, T.walk)
        if (e.stT > 1 && !e.stolen) { const p = look(); if (p && Math.hypot(e.x - e.home.x, e.z - e.home.z) < T.leash * 0.6) { e.target = p; set('approach') } }
        break
      case 'dead':
        // fica caído; depois de um tempo afunda no chão e some
        model.root.visible = e.stT < T.sink + 2.5
        break
    }
    // pés no chão (subidas) mais o salto; morto, afunda devagar
    e.y = GroundAt(e.x, e.z) + e.jump - (e.state === 'dead' && e.stT > T.sink ? Math.min(1.5, (e.stT - T.sink) * 0.6) : 0)
    // postura esvazia sozinha depois de um tempo sem levar golpe (de joelhos, não)
    if (e.state !== 'broken' && (e.postureT += dt) > BALANCE.posture.delay) e.posture = Math.max(0, e.posture - BALANCE.posture.regen * dt)
    // pose do corpo: entra rápido no ataque, sai devagar
    const posed = e.atk || e.state === 'broken'
    if (e.atk) e.pose = spec.pose(e, e.atk)
    else if (e.state === 'broken') e.pose = BROKEN_POSE
    e.poseW += ((posed ? 1 : 0) - e.poseW) * (1 - Math.exp(-(posed ? 18 : 6) * dt))
    model.root.position.set(e.x, e.y, e.z)
    model.root.rotation.y = e.facing
    // 'feed' = o zumbi ajoelhado: de joelhos (postura quebrada) ou sentado ao lume esperando
    const anim = { dead: 'dead', stagger: 'stagger', broken: 'feed' }[e.state] || (e.sit && e.state === 'idle' ? 'feed' : 'idle')
    model.animate(dt, { state: anim, vel: e.vel, hitT: e.hitT, stT: e.stT, fallDir: e.fallDir, pose: e.pose, poseW: e.poseW })
    if (spec.tick) spec.tick(e, dt)
  }

  // postura cheia: de joelhos, arma brilhando, aberto ao golpe crítico
  function breakPosture() {
    e.atk = null; e.jump = 0; e.posture = e.maxPosture; e.brokenT = T.broken
    set('broken')
    spec.glow(model, true)
    events.emit('enemy-broken', e)
  }
  // o jogador aparou o golpe: a postura enche (comum: quebra na hora; elite 50%; chefe 25%)
  function parried() {
    e.atk = null
    e.posture += e.maxPosture * T.parryBreak; e.postureT = 0
    if (e.posture >= e.maxPosture) breakPosture()
    else { set('stagger'); events.emit('enemy-stagger', e) }
  }
  // golpe crítico começou: fica de joelhos até a animação dele acabar e então levanta (um crítico por joelho)
  e.riposted = (t) => { e.brokenT = e.stT + t; e.riposting = true }

  // levou golpe do jogador
  e.hit = ({ dmg, posture = 0, dir }) => {
    if (e.dead) return
    e.hp -= dmg
    e.hitT = 0.3
    model.flash(0.08)
    if (e.hp <= 0) {
      e.hp = 0; e.dead = true; e.atk = null; e.dying = 1; e.jump = 0
      e.fallDir = Math.abs(wrap(dir - e.facing)) > Math.PI / 2 ? -1 : 1 // golpe de frente: cai de costas
      spec.glow(model, false)
      set('dead')
      events.emit('enemy-death', e)
      return
    }
    if (!e.target) for (const p of ctx.players.values()) { e.target = p; break }
    if (e.state === 'broken') return // de joelhos: só toma o dano
    e.posture += posture; e.postureT = 0
    if (e.posture >= e.maxPosture) { breakPosture(); return }
    // no aviso e no golpe ele não para (não dá para trocar golpe com ele); fora disso, tropeça (o que foge também)
    if (!e.atk || e.atk.phase === 'recover') { e.atk = null; set('stagger'); events.emit('enemy-stagger', e) }
  }
  e.update = update
  // some sem cair (único já vencido, ao carregar o save)
  e.vanish = () => { Object.assign(e, { dead: true, dying: 1, atk: null }); set('dead'); e.stT = 99; model.root.visible = false }
  // volta ao começo (o jogador descansou ou morreu: os inimigos renascem). Único e vencido: continua morto.
  // A cera que o trasno roubou some junto (DESIGN 7)
  e.reset = () => {
    if (e.unique && e.dead) return
    Object.assign(e, { x: e.home.x, z: e.home.z, y: 0, facing: e.home.ry, hp: T.hp, posture: 0, dead: false, dying: 0, atk: null, target: null,
      poseW: 0, hitT: 0, riposting: false, jump: 0, stolen: 0, summoned: false })
    spec.glow(model, false)
    set('idle')
    model.root.visible = true
  }
  return e
}
