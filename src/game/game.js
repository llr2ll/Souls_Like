import { ApplyInput } from '../engine/input/contract'
import { events } from '../engine/core/events'
import { CreatePlayerModel } from '../shared/characters/player'
import { UpdatePlayerMovement } from '../shared/characters/player-movement'
import { BALANCE } from './config/balance'

// Estado e regras do jogo (sem desenhar: o replay do npm run check roda isto sem navegador).
// S2: fôlego, correr e rolar. Atacar e o resto chegam um PR por vez (docs/DESIGN.md, seção 9).
// Avisos (engine/core/events.js) para o main.js tocar som: 'roll' (começou a rolar), 'roll-land' (encostou no chão).
export function CreateGame(scene) {
  const players = new Map()
  const PL = BALANCE.player, R = BALANCE.roll
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
      rollT: -1, rollA: 0, rollBuf: 0, rollLand: false, safe: false, // safe = invulnerável agora
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
  // ações: 'roll' rola na hora (o teclado e o controle rolam soltando o botão de correr cedo; ver update)
  function act(id, a) {
    const p = players.get(id)
    if (p && a === 'roll') p.rollBuf = R.buffer
  }

  const rolling = (p) => p.rollT >= 0
  function startRoll(p) {
    const { mx, mz } = p.raw
    p.rollA = Math.hypot(mx, mz) > 0.2 ? Math.atan2(mx, mz) : p.facing // sem direção: rola para a frente
    p.rollT = 0; p.rollBuf = 0; p.rollLand = false
    p.stamina = Math.max(0, p.stamina - R.stamina) // qualquer fôlego acima de 0 basta; ele zera
    p.restT = 0 // a recuperação espera (BALANCE.move.staminaDelay)
    p.model.play('roll', R.time)
    events.emit('roll', p)
  }

  function update(dt) {
    for (const p of players.values()) {
      // botão de rolar/correr: soltar antes de R.tap = rolar (guardado por R.buffer); segurar mais = correr
      if (p.raw.run) p.dodgeT += dt
      else { if (p.dodgeT > 0 && p.dodgeT < R.tap) p.rollBuf = R.buffer; p.dodgeT = 0 }
      if (p.rollBuf > 0) {
        if (!rolling(p) && p.stamina > 0) startRoll(p)
        else p.rollBuf -= dt
      }
      const roll = rolling(p)
      if (roll) {
        // o movimento copiado já sabe fazer "investida" (dashT/dashA/dashV): o rolamento usa
        p.dashT = 1; p.dashA = p.rollA; p.dashV = rollPeak() * Math.cos((p.rollT / R.time) * Math.PI / 2)
        p.safe = p.rollT >= R.safe[0] && p.rollT < R.safe[1]
      }
      Object.assign(p.input, p.raw)
      p.input.run = !roll && p.dodgeT >= R.tap ? 1 : 0
      UpdatePlayerMovement(p, dt, null, BALANCE.move)
      if (roll) {
        p.rollT += dt
        if (!p.rollLand && p.rollT >= R.time * 0.75) { p.rollLand = true; events.emit('roll-land', p) }
        if (p.rollT >= R.time) { p.rollT = -1; p.dashT = 0; p.safe = false }
      }
      p.model.animate(dt, p)
    }
  }
  function clear() { for (const id of [...players.keys()]) removePlayer(id) }

  return { players, addPlayer, removePlayer, setInput, act, update, clear }
}
