import * as THREE from 'three'
import { MAT, P, merge, box, cone, cyl, sph } from '../../engine/render/style'
import { GroundAt } from '../../engine/world/ground'
import { resolve } from '../../engine/world/collision'
import { events } from '../../engine/core/events'
import { CreateZombieModel } from '../../shared/creatures/zombie-model'
import { BALANCE } from '../config/balance'

// Chefe do castro (DESIGN 5): a Serpe e a Moura. Dorme enroscada até você atravessar a névoa (awaken).
// Fase 1, a Serpe: bote (ergue a cabeça e sibila; depois a cabeça fica no chão e leva ×1,5), rabada (o rabo chocalha; perto
// dela não pega), enroscar (colado no corpo por 2 s, ela aperta). Fase 2: a serpe vira pedra e a Moura sai dela: fuso (3 estocadas),
// fio de ouro (linhas no chão que sobem: fique entre elas), encanto (some; um brilho com sinos marca onde volta, atrás de você).
// Chefe não tropeça com golpe: só a postura cheia o derruba (Serpe: cabeça no chão 3 s; Moura: de joelhos). Vencido: não volta.
// Avisos: 'boss-start', 'boss-warn' ({ e, name }), 'boss-strike' ({ e, name }), 'boss-dust' ({ x, z }), 'boss-phase', 'boss-end',
// 'enemy-broken', 'enemy-death'. Tudo o que o jogo espera de um alvo: x, z, r, hp, hit(), update(), reset(), vanish()…
const wrap = (a) => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI }
const turnTo = (a, b, rate, dt) => { const d = wrap(b - a); return a + Math.sign(d) * Math.min(Math.abs(d), rate * dt) }
const ease = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t) }
const DEG = Math.PI / 180, PLAYER_R = 0.45
const GREEN = 0x55703a, BELLY = 0xc9b06a
const STONE = new THREE.MeshLambertMaterial({ color: 0x9a968a, flatShading: true })
const WHITE = new THREE.MeshBasicMaterial({ color: 0xffffff }) // piscar ao levar golpe
const EYE = new THREE.MeshBasicMaterial({ color: 0xffb02e })
const GOLD = new THREE.MeshLambertMaterial({ color: 0xe8d39a, flatShading: true })
const GOLD_GLOW = new THREE.MeshBasicMaterial({ color: 0xffe08a })
const LINE_MAT = new THREE.MeshBasicMaterial({ color: 0xffd25a, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })
const MARK_MAT = new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })

let SEG = null, HEAD = null, RATTLE = null
const segGeo = () => (SEG ||= P(new THREE.IcosahedronGeometry(1, 1), GREEN, { lit: 0.15, fn: (c, nx, ny) => { if (ny < -0.25) c.set(BELLY) }, tri: (c, x, y, z) => { if (Math.sin(x * 23 + z * 17) > 0.55) c.multiplyScalar(0.8) } }))
const headGeo = () => (HEAD ||= merge([
  P(sph(0.5, 10, 8), GREEN, { s: [0.8, 0.55, 1.05], lit: 0.15 }),
  P(sph(0.36, 8, 6), BELLY, { p: [0, -0.16, 0.18], s: [0.8, 0.4, 1.15] }), // queixo
  ...[-0.22, 0.22].map((x) => P(cone(0.08, 0.32, 5), 0x3f552a, { p: [x, 0.25, -0.2], r: [-0.9, 0, x * -1.5] })), // chifrinhos
]))
const rattleGeo = () => (RATTLE ||= merge([0, 1, 2].map((i) => P(cyl(0.16 - i * 0.03, 0.18 - i * 0.03, 0.14, 7).rotateX(Math.PI / 2), 0xb9a77a, { p: [0, 0, -0.1 - i * 0.14] }))))

export function CreateCastroBoss(scene, x, z, ry, ctx) {
  const C = BALANCE.castro, S = C.serpe, M = C.moura

  // ---- a Serpe: cabeça + gomos que seguem o rastro da cabeça ----
  const head = new THREE.Group()
  head.add(new THREE.Mesh(headGeo(), MAT.solid))
  const eyes = new THREE.Mesh(merge([P(sph(0.06, 6, 4), 0xffb02e, { p: [0.2, 0.08, 0.32] }), P(sph(0.06, 6, 4), 0xffb02e, { p: [-0.2, 0.08, 0.32] })]), EYE)
  head.add(eyes)
  head.scale.setScalar(1.45) // cabeça maior que o pescoço
  scene.add(head)
  const radius = (i) => 0.62 - (i / S.segs) * 0.4
  const segs = Array.from({ length: S.segs }, (_, i) => { const m = new THREE.Mesh(segGeo(), MAT.solid); m.scale.setScalar(radius(i)); scene.add(m); return m })
  const rattle = new THREE.Mesh(rattleGeo(), MAT.solid)
  scene.add(rattle)
  const serpeMeshes = [head.children[0], ...segs, rattle]
  const petrify = (on) => { for (const m of serpeMeshes) m.material = on ? STONE : MAT.solid; eyes.visible = !on }

  // ---- a Moura: o humanoide, dourado, cabelo longo e o fuso de ouro ----
  const moura = CreateZombieModel(5)
  moura.root.scale.setScalar(M.scale)
  moura.skin(GOLD)
  moura.head.add(new THREE.Mesh(merge([P(cone(0.2, 1.0, 8), 0xb8892e, { p: [0, -0.15, -0.16], r: [0.25, 0, 0] }), P(sph(0.2, 8, 6), 0xb8892e, { p: [0, 0.22, -0.02], s: [1.05, 0.8, 1.1] })]), MAT.solid))
  const fuso = new THREE.Group()
  fuso.add(new THREE.Mesh(merge([P(cyl(0.02, 0.02, 0.55, 6), 0xf0d27a, { p: [0, -0.2, 0.05] }), P(cyl(0.09, 0.09, 0.04, 10), 0xf0d27a, { p: [0, -0.3, 0.05] })]), GOLD_GLOW))
  moura.hands.R.add(fuso)
  moura.root.visible = false
  scene.add(moura.root)

  // ---- fio de ouro (linhas no chão que sobem como lâminas) e o brilho do encanto ----
  const F = M.attacks.fio
  const lines = Array.from({ length: F.lines }, () => {
    const g = new THREE.Group()
    const flat = new THREE.Mesh(new THREE.BoxGeometry(F.width * 0.6, 0.04, F.length), LINE_MAT)
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, F.length), LINE_MAT)
    blade.position.y = 0.7; blade.scale.y = 0.01
    g.add(flat, blade); g.visible = false; scene.add(g)
    return { g, blade, cx: 0, cz: 0, dx: 0, dz: 1 }
  })
  const mark = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), MARK_MAT)
  mark.visible = false
  scene.add(mark)

  const e = {
    id: 'castro', kind: 'castro', boss: true, unique: true, name: S.name, phase: 1, tune: C,
    x, z, y: 0, r: 0.8, hp: C.hp, maxHp: C.hp, posture: 0, maxPosture: S.posture, dead: false, cera: C.cera,
    state: 'dormant', stT: 0, atk: null, target: null, postureT: 0, brokenT: 0, riposting: false, grounded: false,
    group: head, radius: 0.9, dying: 0, bodies: [], // bodies: círculos do corpo (o jogador não atravessa)
  }
  const set = (s) => { e.state = s; e.stT = 0 }
  let heading = ry, hy = 0.6, trail = [], waitT = 0, nearBody = 0, sweep = 0, flashT = 0, mouraT = 0

  // corpo enroscado (espiral) em volta de onde ela dorme
  function coil() {
    trail = []
    for (let k = 0; k < 260; k++) { const a = ry + Math.PI + k * 0.06, r = 0.5 + k * 0.01; trail.push({ x: x + Math.sin(a) * r, z: z + Math.cos(a) * r }) }
    e.x = trail[0].x; e.z = trail[0].z; heading = ry; hy = 0.6
  }
  coil()
  // gomo i: no rastro da cabeça, a (i+1) × spacing metros dela
  function placeBody() {
    let i = 0, need = S.spacing, acc = 0
    const pts = [{ x: e.x, z: e.z }, ...trail]
    e.bodies.length = 0
    for (let k = 1; k < pts.length && i < S.segs; k++) {
      const a = pts[k - 1], b = pts[k], d = Math.hypot(b.x - a.x, b.z - a.z)
      while (d > 0 && acc + d >= need && i < S.segs) {
        const t = (need - acc) / d
        e.bodies.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, r: radius(i) })
        i++; need += S.spacing
      }
      acc += d
    }
    while (e.bodies.length < S.segs) e.bodies.push({ ...(e.bodies[e.bodies.length - 1] || { x: e.x, z: e.z }), r: radius(e.bodies.length) })
    if (trail.length > 400) trail.length = 400
  }
  const pushTrail = () => { const t = trail[0]; if (!t || Math.hypot(t.x - e.x, t.z - e.z) > 0.12) trail.unshift({ x: e.x, z: e.z }) }
  const dist = (p, o = e) => Math.hypot(p.x - o.x, p.z - o.z)
  const angTo = (p, o = e) => Math.atan2(p.x - o.x, p.z - o.z)
  // golpes de área (rabada, aperto, fio de ouro): não se aparam (aparando de frente, conta como bloqueio)
  const hurt = (p, d, strong, dir = angTo(p)) => ctx.hurt(p, d, dir, e, strong, true)
  // não sai de dentro da muralha do castro e contorna as pallozas (a cabeça; o corpo vem atrás)
  const ARENA = 10.6 // a cabeça chega até a abertura da muralha (nos lados, as pedras da muralha a empurram para dentro)
  const clamp = () => { const dx = e.x - x, dz = e.z - z, d = Math.hypot(dx, dz); if (d > ARENA) { e.x = x + (dx / d) * ARENA; e.z = z + (dz / d) * ARENA }; resolve(e, e.r) }

  // ---------------- fase 1: a Serpe ----------------
  function serpeMove(dt, p) {
    // rodeia o jogador a uns `keep` metros (o ponto alvo gira em volta dele)
    const a = angTo(e, p) + 0.6, tx = p.x + Math.sin(a) * S.keep, tz = p.z + Math.cos(a) * S.keep
    heading = turnTo(heading, Math.atan2(tx - e.x, tz - e.z), S.turn, dt)
    e.x += Math.sin(heading) * S.speed * dt; e.z += Math.cos(heading) * S.speed * dt
    clamp()
    hy += (0.9 - hy) * Math.min(1, dt * 3)
  }
  function serpeChoose(p) {
    if (nearBody >= S.squeezeAfter) return 'squeeze'
    const d = dist(p)
    if (d < 4.2) return Math.random() < 0.45 ? 'tail' : 'bite'
    return 'bite'
  }
  function serpeAttack(dt, p) {
    const A = e.atk, d = A.def
    A.t += dt
    if (A.phase === 'warn') {
      if (A.name === 'bite') { heading = turnTo(heading, angTo(p), Math.PI, dt); hy += (3.2 - hy) * Math.min(1, dt * 5) }
      else if (A.name === 'tail') hy += (0.7 - hy) * Math.min(1, dt * 5)
      else if (A.name === 'squeeze' && Math.floor(A.t / 0.3) !== Math.floor((A.t - dt) / 0.3)) {
        const b = e.bodies[Math.floor(Math.random() * e.bodies.length)]; events.emit('boss-dust', { x: b.x, z: b.z })
      }
      if (A.t >= d.warn) {
        A.phase = 'strike'; A.t = 0; A.hit = false; A.a = heading
        A.len = Math.min(d.reach || 0, dist(p) + 1.0)
        events.emit('boss-strike', { e, name: A.name })
      }
    } else if (A.phase === 'strike') {
      const k = Math.min(1, A.t / d.strike)
      if (A.name === 'bite') {
        e.x += Math.sin(A.a) * (A.len / d.strike) * dt; e.z += Math.cos(A.a) * (A.len / d.strike) * dt
        hy += (0.35 - hy) * Math.min(1, dt * 14)
        clamp()
        if (!A.hit && !p.dead && dist(p) < d.range + PLAYER_R) {
          const r = ctx.hurt(p, d.dmg, A.a, e, d.strong)
          if (r) A.hit = true
          if (r === 'parry') { hy = 0.35; parried(); return } // aparou o bote: postura sobe (chefe: +25%)
        }
      } else if (A.name === 'tail') {
        sweep = Math.PI * 2 * ease(k)
        const dd = dist(p)
        if (!A.hit && !p.dead && dd > d.inner && dd < d.outer && hurt(p, d.dmg, false)) A.hit = true
      } else if (!A.hit && !p.dead && e.bodies.some((b) => dist(p, b) < d.range) && hurt(p, d.dmg, d.strong)) A.hit = true
      if (A.t >= d.strike) { A.phase = 'recover'; A.t = 0; sweep = 0; e.grounded = A.name === 'bite'; if (A.name === 'squeeze') nearBody = 0 }
    } else if (A.t >= d.recover) {
      e.atk = null; e.grounded = false
      waitT = S.wait[0] + Math.random() * (S.wait[1] - S.wait[0])
      set('fight')
    }
  }

  // ---------------- fase 2: a Moura ----------------
  function mouraAttack(dt, p) {
    const A = e.atk, d = A.def
    A.t += dt
    if (A.name === 'fuso') {
      if (A.phase === 'warn') { e.facing = turnTo(e.facing, angTo(p), d.warnTurn * DEG, dt); if (A.t >= d.warn) { A.phase = 'strike'; A.t = 0; A.a = e.facing; A.hit = false; events.emit('boss-strike', { e, name: 'fuso' }) } }
      else if (A.phase === 'strike') {
        if (!A.hit && !p.dead && dist(p) - PLAYER_R < d.range && Math.abs(wrap(angTo(p) - A.a)) < d.arc * DEG) {
          const r = ctx.hurt(p, d.dmg, angTo(p), e, false)
          if (r) A.hit = true
          if (r === 'parry') { if (A.i === d.hits.length - 1) parried(); else A.hit = true }
        }
        if (A.t >= d.hits[A.i]) { A.i++; A.t = 0; A.hit = false; A.phase = A.i < d.hits.length ? 'gap' : 'recover' }
      } else if (A.phase === 'gap') { if (A.t >= d.gap) { A.phase = 'strike'; A.t = 0; events.emit('boss-strike', { e, name: 'fuso' }) } }
      else if (A.t >= d.recover) endMoura()
    } else if (A.name === 'fio') {
      if (A.phase === 'warn') {
        for (const l of lines) LINE_MAT.opacity = 0.35 + 0.35 * Math.abs(Math.sin(A.t * 14))
        if (A.t >= d.warn) { A.phase = 'strike'; A.t = 0; A.hit = false; events.emit('boss-strike', { e, name: 'fio' }) }
      } else if (A.phase === 'strike') {
        for (const l of lines) l.blade.scale.y = Math.max(0.01, ease(A.t / d.strike))
        if (!A.hit && !p.dead) for (const l of lines) {
          const rx = p.x - l.cx, rz = p.z - l.cz, along = rx * l.dx + rz * l.dz, across = Math.abs(rx * l.dz - rz * l.dx)
          if (Math.abs(along) < d.length / 2 && across < d.width / 2 + PLAYER_R * 0.5 && hurt(p, d.dmg, d.strong, Math.atan2(l.dz, -l.dx))) { A.hit = true; break }
        }
        if (A.t >= d.strike) { A.phase = 'recover'; A.t = 0 }
      } else {
        if (A.t > 0.35) for (const l of lines) l.g.visible = false
        if (A.t >= d.recover) endMoura()
      }
    } else { // encanto: some, um brilho com sinos marca onde ela volta (atrás de você), volta cortando
      if (A.phase === 'warn') {
        if (A.t >= d.vanish && !A.marked) {
          A.marked = true
          A.mx = p.x - Math.sin(p.facing) * d.behind; A.mz = p.z - Math.cos(p.facing) * d.behind
          const mx = A.mx - x, mz = A.mz - z, md = Math.hypot(mx, mz)
          if (md > ARENA) { A.mx = x + (mx / md) * ARENA; A.mz = z + (mz / md) * ARENA } // dentro da muralha
          const q = { x: A.mx, z: A.mz }; resolve(q, M.r); A.mx = q.x; A.mz = q.z // fora das pallozas
          mark.position.set(A.mx, GroundAt(A.mx, A.mz) + 0.8, A.mz); mark.visible = true
          events.emit('boss-warn', { e, name: 'encanto-mark', x: A.mx, z: A.mz })
        }
        moura.root.visible = A.t < d.vanish * 0.6
        if (A.t >= d.vanish + d.mark) {
          mark.visible = false; moura.root.visible = true
          e.x = A.mx; e.z = A.mz; e.facing = angTo(p); A.a = e.facing
          A.phase = 'strike'; A.t = 0; A.hit = false
          events.emit('boss-strike', { e, name: 'encanto' })
        }
      } else if (A.phase === 'strike') {
        if (!A.hit && !p.dead && dist(p) - PLAYER_R < d.range && Math.abs(wrap(angTo(p) - A.a)) < d.arc * DEG) {
          const r = ctx.hurt(p, d.dmg, angTo(p), e, false)
          if (r) A.hit = true
          if (r === 'parry') parried()
        }
        if (A.t >= d.strike) { A.phase = 'recover'; A.t = 0 }
      } else if (A.t >= d.recover) endMoura()
    }
  }
  function endMoura() { e.atk = null; waitT = M.wait[0] + Math.random() * (M.wait[1] - M.wait[0]); set('fight') }
  function mouraStart(p) {
    const dd = dist(p), roll = Math.random()
    const name = dd > 6 ? (roll < 0.5 ? 'fio' : 'encanto') : dd <= M.reach + 0.3 ? (roll < 0.6 ? 'fuso' : roll < 0.8 ? 'fio' : 'encanto') : (roll < 0.5 ? 'fio' : 'encanto')
    const d = M.attacks[name]
    e.atk = { name, def: d, phase: 'warn', t: 0, i: 0, a: e.facing, hit: false }
    if (name === 'fio') {
      // linhas paralelas na direção dela → você, centradas onde você está: saia para o lado (fica entre duas)
      const a = angTo(p), dx = Math.sin(a), dz = Math.cos(a)
      lines.forEach((l, i) => {
        const off = (i - (lines.length - 1) / 2) * d.gap
        Object.assign(l, { cx: p.x + dz * off, cz: p.z - dx * off, dx, dz })
        l.g.position.set(l.cx, GroundAt(l.cx, l.cz) + 0.03, l.cz); l.g.rotation.y = a; l.g.visible = true; l.blade.scale.y = 0.01
      })
    }
    set('attack')
    events.emit('boss-warn', { e, name })
  }

  // ---------------- comuns ----------------
  function breakPosture() {
    e.atk = null; e.posture = e.maxPosture; e.brokenT = (e.phase === 1 ? S : M).broken; e.grounded = e.phase === 1
    for (const l of lines) l.g.visible = false
    mark.visible = false; if (e.phase === 2) moura.root.visible = true
    set('broken')
    if (e.phase === 2) for (const m of [fuso.children[0]]) m.material = GOLD_GLOW
    events.emit('enemy-broken', e)
  }
  function parried() {
    e.atk = null
    e.posture += e.maxPosture * (e.phase === 1 ? S : M).parryBreak; e.postureT = 0
    if (e.posture >= e.maxPosture) breakPosture()
    else { waitT = 0.6; set('fight') }
  }
  e.riposted = (t) => { e.brokenT = e.stT + t; e.riposting = true }
  e.awaken = (p) => { if (e.state !== 'dormant' || e.dead) return; e.target = p; waitT = 1.2; set('fight'); events.emit('boss-start', e) }
  // golpe do jogador: no corpo da serpe vale o gomo mais perto (hitPoint)
  e.hitPoint = (px, pz) => {
    if (e.phase !== 1) return e
    let best = { x: e.x, z: e.z, r: 0.8 }, bd = Math.hypot(px - e.x, pz - e.z) - 0.8
    for (const b of e.bodies) { const d = Math.hypot(px - b.x, pz - b.z) - b.r; if (d < bd) { bd = d; best = b } }
    return best
  }
  e.hit = ({ dmg, posture = 0 }) => {
    if (e.dead || e.state === 'dormant' || e.state === 'transform') return
    if (e.phase === 1 && (e.grounded || e.state === 'broken')) dmg *= S.groundMult
    e.hp -= dmg
    flashT = 0.08
    if (e.hp <= 0) { e.phase === 1 ? transform() : die(); return }
    if (e.state === 'broken') return
    e.posture += posture; e.postureT = 0
    if (e.posture >= e.maxPosture) breakPosture()
  }
  function transform() {
    e.hp = 0; e.atk = null; e.grounded = false; sweep = 0
    petrify(true)
    set('transform')
    events.emit('boss-phase', e)
  }
  function die() {
    e.hp = 0; e.dead = true; e.dying = 1; e.atk = null
    for (const l of lines) l.g.visible = false
    mark.visible = false; moura.root.visible = true
    set('dead')
    events.emit('enemy-death', e)
    events.emit('boss-end', e)
  }

  function update(dt) {
    e.stT += dt
    const p = e.target
    if (e.state !== 'broken' && e.state !== 'dormant' && (e.postureT += dt) > BALANCE.posture.delay) e.posture = Math.max(0, e.posture - BALANCE.posture.regen * dt)
    if (e.phase === 1) {
      if (e.state === 'fight' && p && !p.dead) {
        // colado no corpo dela? (para o enroscar)
        nearBody = e.bodies.slice(2).some((b) => dist(p, b) < 2.0) ? nearBody + dt : Math.max(0, nearBody - dt)
        if ((waitT -= dt) <= 0) {
          const name = serpeChoose(p), d = S.attacks[name]
          if (name !== 'bite' || dist(p) < d.reach + 1) { e.atk = { name, def: d, phase: 'warn', t: 0 }; set('attack'); events.emit('boss-warn', { e, name }) }
          else serpeMove(dt, p)
        } else serpeMove(dt, p)
      } else if (e.state === 'attack' && p) serpeAttack(dt, p)
      else if (e.state === 'broken') { hy += (0.35 - hy) * Math.min(1, dt * 8); if (e.stT >= e.brokenT) { e.posture = 0; e.riposting = false; e.grounded = false; waitT = 0.8; set('fight') } }
      else if (e.state === 'transform') {
        // a serpe vira pedra; a moura sai da cabeça dela, crescendo
        if (e.stT > 0.8 && !moura.root.visible) { moura.root.visible = true; mouraT = 0; e.facing = heading }
        if (moura.root.visible) mouraT += dt
        moura.root.scale.setScalar(M.scale * ease(mouraT / 1.2))
        if (e.stT >= C.transform) {
          Object.assign(e, { phase: 2, name: M.name, hp: C.hp, maxHp: C.hp, posture: 0, maxPosture: M.posture, r: M.r, radius: M.r, group: moura.root })
          e.x += Math.sin(heading) * 1.5; e.z += Math.cos(heading) * 1.5
          waitT = 0.8; set('fight')
        }
      }
      if (e.phase === 1) {
        if (e.state !== 'transform') { pushTrail(); placeBody() }
        drawSerpe(dt)
      }
    } else {
      if (e.state === 'fight' && p && !p.dead) {
        const d = dist(p)
        e.facing = turnTo(e.facing, angTo(p), M.turn, dt)
        if ((waitT -= dt) <= 0) mouraStart(p)
        else if (d > M.reach) { e.x += Math.sin(e.facing) * M.speed * dt; e.z += Math.cos(e.facing) * M.speed * dt; e.vel = M.speed; clamp() }
      } else if (e.state === 'attack' && p) mouraAttack(dt, p)
      else if (e.state === 'broken' && e.stT >= e.brokenT) { e.posture = 0; e.riposting = false; fuso.children[0].material = GOLD_GLOW; waitT = 0.8; set('fight') }
      drawSerpe(0)
    }
    if (e.phase === 2 || e.state === 'transform') drawMoura(dt)
    e.y = GroundAt(e.x, e.z)
  }

  function drawSerpe(dt) {
    head.position.set(e.x, GroundAt(e.x, e.z) + hy, e.z)
    head.rotation.set(-Math.min(0.9, (hy - 0.6) * 0.35), heading, 0)
    const A = e.atk
    const rattling = A && A.name === 'tail' && A.phase === 'warn'
    segs.forEach((m, i) => {
      const b = e.bodies[i]
      let bx = b.x, bz = b.z
      if (sweep) { const ox = bx - e.x, oz = bz - e.z, c = Math.cos(sweep), s = Math.sin(sweep); bx = e.x + ox * c + oz * s; bz = e.z - ox * s + oz * c }
      const lift = Math.max(0, hy - 0.6) * Math.max(0, 1 - i / 4) // o pescoço sobe junto com a cabeça
      m.position.set(bx, GroundAt(bx, bz) + b.r * 0.85 + lift, bz)
    })
    const last = segs[segs.length - 1].position, prev = segs[segs.length - 2].position
    rattle.position.copy(last)
    rattle.rotation.y = Math.atan2(prev.x - last.x, prev.z - last.z) + Math.PI
    if (rattling) { rattle.position.y += 0.4 + Math.sin(e.stT * 60) * 0.06; rattle.position.x += Math.sin(e.stT * 47) * 0.05 }
    // piscar branco ao levar golpe (só na fase da serpe)
    if (e.phase === 1 && flashT > 0) {
      flashT -= dt
      const mat = flashT > 0 ? WHITE : e.state === 'transform' ? STONE : MAT.solid
      for (const m of serpeMeshes) m.material = mat
    }
  }
  // poses da Moura (ângulos dos ombros e do tronco do humanoide)
  function drawMoura(dt) {
    const A = e.atk
    let pose = null
    if (A && A.name === 'fuso') pose = A.phase === 'warn' ? { armR: [-1.2, -0.3], armL: [0.2, 0.3], spineX: 0.1, spineY: -0.35 } : { armR: [-1.65, 0.05], armL: [0.3, 0.2], spineX: 0.25, spineY: (A.i % 2 ? -0.25 : 0.25) }
    else if (A && A.name === 'fio') pose = A.phase === 'warn' ? { armR: [-2.7, -0.6], armL: [-2.7, 0.6], spineX: -0.25, spineY: 0 } : { armR: [-0.6, -0.9], armL: [-0.6, 0.9], spineX: 0.35, spineY: 0 }
    else if (A && A.name === 'encanto') pose = { armR: [-1.4, 0.7], armL: [0.3, 0.3], spineX: 0.3, spineY: -0.5 }
    else if (e.state === 'broken') pose = { armR: [0.35, -0.25], armL: [0.35, 0.25], spineX: 0.75, spineY: 0 }
    fuso.rotation.y += dt * (A && A.name === 'fuso' && A.phase === 'warn' ? 30 : 2)
    moura.root.position.set(e.x, GroundAt(e.x, e.z), e.z)
    moura.root.rotation.y = e.facing || 0
    e.poseW = (e.poseW || 0) + ((pose ? 1 : 0) - (e.poseW || 0)) * Math.min(1, dt * 14)
    if (pose) e.pose = pose
    const anim = e.state === 'dead' ? 'dead' : e.state === 'broken' ? 'feed' : 'idle'
    if (flashT > 0 && e.phase === 2) { moura.flash(0.08); flashT = 0 } // na transformação o piscar é da serpe
    moura.animate(dt, { state: anim, vel: e.vel || 0, hitT: 0, stT: e.stT, fallDir: -1, pose: e.pose, poseW: e.poseW })
    e.vel = 0
  }

  e.update = update
  // volta ao começo (você morreu): dorme de novo enroscada, fase 1. Vencida, continua vencida
  e.reset = () => {
    if (e.dead) return
    Object.assign(e, { phase: 1, name: S.name, hp: C.hp, maxHp: C.hp, posture: 0, maxPosture: S.posture, atk: null, target: null, grounded: false,
      riposting: false, r: 0.8, radius: 0.9, group: head })
    petrify(false); moura.root.visible = false; moura.root.scale.setScalar(M.scale); mark.visible = false
    for (const l of lines) l.g.visible = false
    sweep = 0; nearBody = 0; coil(); placeBody(); drawSerpe(0)
    set('dormant')
  }
  // vencida antes (save): não aparece mais
  e.vanish = () => {
    Object.assign(e, { dead: true, dying: 1, atk: null, hp: 0 })
    head.visible = false; rattle.visible = false; for (const m of segs) m.visible = false
    moura.root.visible = false; e.bodies.length = 0
    set('dead')
  }
  placeBody(); drawSerpe(0)
  return e
}
