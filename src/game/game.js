import { ApplyInput } from '../engine/input/contract'
import { CreatePlayerModel } from '../shared/characters/player'
import { UpdatePlayerMovement } from '../shared/characters/player-movement'
import { BALANCE } from './config/balance'

// Estado e regras do jogo (sem desenhar: o replay do npm run check roda isto sem navegador).
// S0: só o jogador andando. Fôlego, rolar, atacar e o resto chegam um PR por vez (docs/DESIGN.md, seção 9).
export function CreateGame(scene) {
  const players = new Map()
  const PL = BALANCE.player

  function addPlayer(id, name) {
    if (players.has(id)) return
    const model = CreatePlayerModel(PL.look)
    scene.add(model.root)
    players.set(id, {
      id, name, model, x: PL.start.x, z: PL.start.z, vx: 0, vz: 0, aimAngle: Math.PI, facing: Math.PI, turn: 0, speed: 0,
      aiming: false, firing: false, jy: 0, vy: 0, gy: 0, y: 0, lv: 0, stamina: PL.stamina, tired: false, running: false,
      hp: PL.hp, max: PL.hp, dead: false,
      input: { mx: 0, mz: 0, ax: 0, az: 0, run: 0 },
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
    if (p) ApplyInput(p.input, m)
  }
  // ações (rolar, atacar, bloquear…): ainda nenhuma no S0
  function act(id, a) {}

  function update(dt) {
    for (const p of players.values()) {
      UpdatePlayerMovement(p, dt, null, BALANCE.move)
      p.model.animate(dt, p)
    }
  }
  function clear() { for (const id of [...players.keys()]) removePlayer(id) }

  return { players, addPlayer, removePlayer, setInput, act, update, clear }
}
