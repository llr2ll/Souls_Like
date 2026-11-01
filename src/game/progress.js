import { events } from '../engine/core/events'
import { CreateCruceiroCandles, CreateDeathCandle } from './world/candle'
import { BALANCE } from './config/balance'

// Progresso (DESIGN 7): cruceiros, cera, a vela da morte e o save. O game.js chama; aqui ninguém luta.
// - Descansar (E/A perto do cruceiro): vida, fôlego e cabaça cheios, os inimigos comuns voltam, salva. O 1º descanso acende as velas.
// - Morrer: a cera vira uma vela acesa no último chão firme; a vela antiga que não foi pega apaga (cera perdida). Salva.
// - Pegar a vela (E/A perto dela): a cera volta. Salva.
// Avisos: 'rest' ({ p, c, first }), 'rest-denied', 'cera' ({ p, n, e }), 'candle' (vela posta), 'candle-pick', 'candle-lost',
// 'save' (os dados do save: o main.js grava no navegador).
// map = o mapa em jogo (BALANCE.maps.*): de lá vêm os cruceiros e o ponto de largada
export function CreateProgress(scene, enemies, map) {
  const cruceiros = map.cruceiros.map((c) => ({ ...c, lit: false, candles: CreateCruceiroCandles(scene, c.x, c.z) }))
  let candle = null // { x, y, z, cera, view }
  const byId = (id) => cruceiros.find((c) => c.id === id)
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)

  // o que dá para fazer com E/A aqui (a vela vem antes do cruceiro)
  function interactable(p) {
    if (p.dead) return null
    if (candle && dist(candle, p) < BALANCE.candle.range) return { kind: 'candle', cera: candle.cera }
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
    } else rest(p, it.c)
    return true
  }
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
  // onde volta: na frente do último cruceiro em que descansou (antes disso, no começo)
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
  }

  // save (DESIGN 7): o que precisa para continuar de onde parou
  function snapshot(p) {
    return {
      versao: 1, cruceiro: p.home || null, acesos: cruceiros.filter((c) => c.lit).map((c) => c.id),
      nivel: 1, atributos: { vigor: 0, alento: 0, forza: 0, destreza: 0 }, // sobe de nível no S12
      cera: p.cera, vela: candle ? { x: candle.x, y: candle.y, z: candle.z, cera: candle.cera } : null,
      cabaca: p.gourdMax, pao: p.bread, armas: ['espada'], atalhos: [], vencidos: [], pegos: [],
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
    dropCandle()
    if (d.vela) candle = { ...d.vela, y: d.vela.y || 0, view: CreateDeathCandle(scene, d.vela.x, d.vela.z, d.vela.y || 0) }
    refill(p)
    const s = spawnPoint(p)
    Object.assign(p, { x: s.x, z: s.z, facing: s.facing, safeX: s.x, safeZ: s.z, safeY: 0 })
    return true
  }

  return { cruceiros, get candle() { return candle }, interactable, use, died, spawnPoint, killed, refill, update, snapshot, save, load }
}
