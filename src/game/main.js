import * as THREE from 'three'
import { events } from '../engine/core/events'
import { StartLoop } from '../engine/core/loop'
import { Light } from '../engine/render/light'
import { CreateEntityShadows } from '../engine/render/entity-shadows'
import { Fps } from '../engine/render/follow'
import { wind } from '../engine/render/style'
import { BindKeyboard } from '../engine/input/keyboard'
import { SetDeepTest } from '../engine/world/collision'
import { SetGround, TooDeep } from '../engine/world/ground'
import { SetEars } from '../engine/audio/engine'
import { UpdateBuildings, UpdateDoors, SetCameraSlope } from '../shared/worldgen/buildings-registry'
import { sfx } from '../shared/audio/sfx'
import { CreateGame } from './game'
import { CreateCamera } from './camera'
import { BuildArena } from './world/arena'
import { BALANCE } from './config/balance'

// O motor e as peças copiadas não conhecem este jogo: aqui o jogo liga as peças (chão, água, sons do mundo).
function Wire(camera) {
  SetGround(() => 0) // arena plana, sem água
  SetDeepTest(TooDeep) // água funda bloqueia (não há água ainda)
  SetCameraSlope(camera.slope) // recorte das casas com a inclinação da câmera deste jogo
  events.on('door-open', (d) => sfx('dooropen', d))
  events.on('door-close', (d) => sfx('doorclose', d))
}

export async function LoadGame() {
  const target = document.getElementById('render-target')
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.setSize(target.offsetWidth, target.offsetHeight)
  target.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = CreateCamera(target.offsetWidth / target.offsetHeight, BALANCE.camera)
  Wire(camera)
  Light(scene, renderer)
  const shadows = CreateEntityShadows(scene)
  BuildArena(scene, BALANCE.arena.size)

  const game = CreateGame(scene)
  game.addPlayer('local', 'Peregrino') // S0: sem menu, o jogador do teclado já entra
  BindKeyboard({ players: game.players, setInput: game.setInput, act: game.act })
  if (import.meta.env.DEV) window.__game = game // só no npm run dev: para testes automáticos e depuração

  addEventListener('resize', () => {
    camera.resize(target.offsetWidth / target.offsetHeight)
    renderer.setSize(target.offsetWidth, target.offsetHeight)
  })

  function draw(dt) {
    game.update(dt)
    wind.value += dt // vento: só um número; o balanço das folhas acontece na placa de vídeo
    const list = [...game.players.values()]
    SetEars(list) // som posicional: quem ouve é o jogador
    shadows.update(list, [])
    UpdateDoors(dt, list, []) // portas abrem quando alguém chega perto
    camera.update(dt, list[0])
    UpdateBuildings(list) // dentro de casa (ou atrás dela): o telhado some
    renderer.render(scene, camera.cam)
    Fps()
  }
  return StartLoop(renderer, draw)
}
