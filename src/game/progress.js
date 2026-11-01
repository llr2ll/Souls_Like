import { events } from '../engine/core/events'
import { GroundAt } from '../engine/world/ground'
import { CreateCruceiroCandles, CreateDeathCandle, CreateItemGlint } from './world/candle'
import { BALANCE } from './config/balance'

// Progresso (DESIGN 7): cruceiros, cera, a vela da morte, itens, atalhos e o save. O game.js chama; aqui ninguém luta.
// - Descansar (E/A perto do cruceiro): vida, fôlego e cabaça cheios, os inimigos comuns voltam, salva. O 1º descanso acende as velas.
// - Morrer: a cera vira uma vela acesa no último chão firme; a vela antiga que não foi pega apaga (cera perdida). Salva.
// - Pegar a vela (E/A perto dela): a cera volta. Salva.
// - Itens no chão (pão, achado): E/A pega; não voltam. Atalhos: a alavanca abre o portão; do outro lado ele não abre. Salva.
// - Névoa: não deixa passar (o chefe chega no S11).
// Avisos: 'rest' ({ p, c, first }), 'rest-denied', 'cera' ({ p, n, e }), 'candle' (vela posta), 'candle-pick', 'candle-lost',
// 'pickup' ({ p, it }), 'shortcut' ({ p, s }), 'locked' ({ p, s }), 'fog', 'save' (os dados do save: o main.js grava no navegador).
// map = o mapa em jogo (BALANCE.maps.*). world = o que o cenário mexe (portões e alavancas; pode faltar, ex.: na arena)
export function CreateProgress(scene, enemies, map, world = {}) {
  const cruceiros = map.cruceiros.map((c) => ({ ...c, lit: false, candles: CreateCruceiroCandles(scene, c.x, c.z, GroundAt(c.x, c.z)) }))
  const items = (map.items || []).map((it) => ({ ...it, taken: false, view: CreateItemGlint(scene, it.x, it.z, GroundAt(it.x, it.z)) }))
  const shortcuts = (map.shortcuts || []).map((s) => ({ ...s, open: false }))
  const fogs = map.fogs || []
  let candle = null // { x, y, z, cera, view }
  const byId = (id) => cruceiros.find((c) => c.id === id)
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)

  // o que dá para fazer com E/A aqui (a vela vem antes de tudo; o cruceiro por último)
  function interactable(p) {
    if (p.dead) return null
    if (candle && dist(candle, p) < BALANCE.candle.range) return { kind: 'candle', cera: candle.cera }
    for (const s of shortcuts) {
      if (s.open) continue
      if (dist(s.lever, p) < 1.7) return { kind: 'lever', s }
      if (dist(s.outside, p) < 2.2) return { kind: 'locked', s }
    }
    for (const f of fogs) if (dist(f, p) < 2.6) return { kind: 'fog', f }
    for (const it of items) if (!it.taken && dist(it, p) < 1.4) return { kind: 'item', it }
    for (const c of cruceiros) if (dist(c, p) < BALANCE.rest.range) return { kind: 'rest', c }
    return null
  }
  function use(p) {
    const it = interactable(p)
    if (!it) return false
    if (it.kind === 'candle') {
      p.cera += candle.cera
      events.emit('candle-pick', { p, cera: candle.cera })
      dropCandle()
      save(p)
    } else if (it.kind === 'lever') {
      openShortcut(it.s, false)
      events.emit('shortcut', { p, s: it.s })
      save(p)
    } else if (it.kind === 'locked') events.emit('locked', { p, s: it.s })
    else if (it.kind === 'fog') events.emit('fog', { p, f: it.f })
    else if (it.kind === 'item') {
      take(it.it)
      if (it.it.kind === 'bread') p.bread++
      events.emit('pickup', { p, it: it.it })
      save(p)
    } else rest(p, it.c)
    return true
  }
  function openShortcut(s, instant) {
    s.open = true
    world.levers?.[s.id]?.pull(instant)
    world.gates?.[s.id]?.open(instant)
  }
  function take(it) { it.taken = true; it.view.remove() }
  // inimigo atrás de você e perto: não dá para descansar
  const threatened = (p) => enemies.some((e) => !e.dead && e.target === p && e.state !== 'idle' && e.state !== 'return' && dist(e, p) < BALANCE.rest.enemyNear)
  function refill(p) { p.hp = p.max; p.stamina = p.staminaMax; p.tired = false; p.gourd = p.gourdMax }
  function rest(p, c) {
    if (threatened(p)) { events.emit('rest-denied', p); return }
    const first = !c.lit
    c.lit = true; c.candles.set(true); p.home = c.id
    refill(p)
    for (const e of enemies) e.reset()
    events.emit('rest', { p, c, first })
    save(p)
  }
  function dropCandle() { if (candle) candle.view.remove(); candle = null }
  function died(p) {
    if (candle) { events.emit('candle-lost', { cera: candle.cera }); dropCandle() }
    if (p.cera > 0) {
      candle = { x: p.safeX, y: p.safeY, z: p.safeZ, cera: p.cera, view: CreateDeathCandle(scene, p.safeX, p.safeZ, p.safeY) }
      events.emit('candle', { x: candle.x, z: candle.z, cera: candle.cera })
      p.cera = 0
    }
    save(p)
  }
  // onde volta: na frente do último cruceiro em que descansou (antes disso, na largada do mapa)
  function spawnPoint(p) {
    const c = byId(p.home)
    return c ? { x: c.x, z: c.z + 1.9, facing: Math.PI } : { x: map.start.x, z: map.start.z, facing: Math.PI }
  }
  function killed(p, e) {
    if (e.cera) { p.cera += e.cera; events.emit('cera', { p, n: e.cera, e }) }
  }
  function update(dt) {
    for (const c of cruceiros) c.candles.update(dt)
    if (candle) candle.view.update(dt)
    for (const it of items) if (!it.taken) it.view.update(dt)
  }

  // save (DESIGN 7): o que precisa para continuar de onde parou
  function snapshot(p) {
    return {
      versao: 1, cruceiro: p.home || null, acesos: cruceiros.filter((c) => c.lit).map((c) => c.id),
      nivel: 1, atributos: { vigor: 0, alento: 0, forza: 0, destreza: 0 }, // sobe de nível no S12
      cera: p.cera, vela: candle ? { x: candle.x, y: candle.y, z: candle.z, cera: candle.cera } : null,
      cabaca: p.gourdMax, pao: p.bread, armas: ['espada'],
      atalhos: shortcuts.filter((s) => s.open).map((s) => s.id), vencidos: [], pegos: items.filter((it) => it.taken).map((it) => it.id),
    }
  }
  function save(p) { events.emit('save', snapshot(p)) }
  function load(p, d) {
    if (!d || d.versao !== 1) return false
    p.home = d.cruceiro || null
    for (const c of cruceiros) { c.lit = (d.acesos || []).includes(c.id); c.candles.set(c.lit) }
    p.cera = d.cera || 0
    p.gourdMax = d.cabaca ?? p.gourdMax
    p.bread = d.pao ?? p.bread
    for (const s of shortcuts) if ((d.atalhos || []).includes(s.id) && !s.open) openShortcut(s, true)
    for (const it of items) if ((d.pegos || []).includes(it.id) && !it.taken) take(it)
    dropCandle()
    if (d.vela) candle = { ...d.vela, y: d.vela.y || 0, view: CreateDeathCandle(scene, d.vela.x, d.vela.z, d.vela.y || 0) }
    refill(p)
    const s = spawnPoint(p)
    Object.assign(p, { x: s.x, z: s.z, facing: s.facing, safeX: s.x, safeZ: s.z, safeY: 0 })
    return true
  }

  return { cruceiros, items, shortcuts, get candle() { return candle }, interactable, use, died, spawnPoint, killed, refill, update, snapshot, save, load }
}
