import * as THREE from 'three'
import { events } from '../engine/core/events'
import { StartLoop } from '../engine/core/loop'
import { Light } from '../engine/render/light'
import { CreateEntityShadows } from '../engine/render/entity-shadows'
import { Fps } from '../engine/render/follow'
import { wind } from '../engine/render/style'
import { BindKeyboard } from '../engine/input/keyboard'
import { BindGamepad } from '../engine/input/gamepad'
import { SetDeepTest } from '../engine/world/collision'
import { SetGround, TooDeep } from '../engine/world/ground'
import { SetEars } from '../engine/audio/engine'
import { UpdateBuildings, UpdateDoors, SetCameraSlope } from '../shared/worldgen/buildings-registry'
import { sfx } from '../shared/audio/sfx'
import { CreateGame } from './game'
import { CreateCamera } from './camera'
import { CreateHud } from './hud'
import { BuildArena } from './world/arena'
import { BALANCE } from './config/balance'

// O motor e as peças copiadas não conhecem este jogo: aqui o jogo liga as peças (chão, água, sons do mundo).
function Wire(camera) {
  SetGround(() => 0) // arena plana, sem água
  SetDeepTest(TooDeep) // água funda bloqueia (não há água ainda)
  SetCameraSlope(camera.slope) // recorte das casas com a inclinação da câmera deste jogo
  events.on('door-open', (d) => sfx('dooropen', d))
  events.on('door-close', (d) => sfx('doorclose', d))
  events.on('roll', (p) => sfx('jump', { x: p.x, z: p.z })) // impulso com gemido curto
  events.on('roll-land', (p) => sfx('land', { x: p.x, z: p.z }))
}

// passos (um a cada passada do boneco: andando ~0,9 m, correndo ~1,5 m) e respiração ofegante com pouco fôlego
let stepD = 0, breathT = 0, breathIn = false
function BodySounds(dt, p) {
  if (!p) return
  if (p.rollT < 0 && p.speed > 0.5) {
    stepD += p.speed * dt
    if (stepD >= (p.running ? 1.47 : 0.92)) { stepD = 0; sfx('step', { x: p.x, z: p.z, run: p.running, surf: p.lv > 0 ? 'wood' : 'dirt' }) }
  }
  if (p.stamina < BALANCE.hud.pant && (breathT -= dt) <= 0) {
    breathIn = !breathIn
    breathT = breathIn ? 0.34 : 0.42
    sfx('breath', { x: p.x, z: p.z, in: breathIn })
  }
}

// impacto (golpe, aparo, golpe recebido): tremor de tela e vibração do controle. Números em balance.js · juice
function Impact(kind, camera, pad) {
  const S = BALANCE.juice.shake, R = BALANCE.juice.rumble, r = R[kind]
  camera.shake((S[kind] || 0) * S.scale, S.time)
  if (r && R.scale > 0) pad.rumble(Math.min(1, r[0] * R.scale), Math.min(1, r[1] * R.scale), r[2])
}

// aviso curto no alto da tela (ex.: "Controle conectado")
let noteTimer
function Note(text) {
  const el = document.getElementById('note')
  el.textContent = text
  el.classList.add('on')
  clearTimeout(noteTimer)
  noteTimer = setTimeout(() => el.classList.remove('on'), 3500)
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
  game.addPlayer('local', 'Peregrino') // sem menu: teclado e controle mexem o mesmo jogador
  const DEV = import.meta.env.DEV
  // só no npm run dev: T (teclado) e Y (controle) testam o tremor de um golpe pesado, até os golpes chegarem (S3)
  const act = (id, a) => (DEV && a === 'tremor' ? events.emit('impact', { kind: 'heavy' }) : game.act(id, a))
  const input = { players: game.players, setInput: game.setInput, act }
  BindKeyboard(input, { ...BALANCE.keys, press: { ...BALANCE.keys.press, ...(DEV && { t: 'tremor' }) } })
  const help = document.getElementById('help')
  const HELP = {
    keys: help.textContent + (DEV ? ' · T testa o tremor' : ''),
    pad: 'Controle: stick esquerdo anda · B: tocar rola, segurar corre' + (DEV ? ' · Y testa o tremor' : ''),
  }
  help.textContent = HELP.keys
  const pad = BindGamepad(input, { ...BALANCE.pad, press: { ...BALANCE.pad.press, ...(DEV && { Y: 'tremor' }) } }, (name) => {
    help.textContent = name ? HELP.pad : HELP.keys
    Note(name ? `Controle conectado: ${name}` : 'Controle desconectado')
  })
  events.on('impact', (d) => Impact(d.kind, camera, pad))
  const hud = CreateHud(BALANCE.hud)
  if (DEV) window.__game = game // só no npm run dev: para testes automáticos e depuração

  addEventListener('resize', () => {
    camera.resize(target.offsetWidth / target.offsetHeight)
    renderer.setSize(target.offsetWidth, target.offsetHeight)
  })

  function draw(dt) {
    pad.poll() // o controle não avisa sozinho: lê a cada quadro, antes do jogo andar
    game.update(dt)
    wind.value += dt // vento: só um número; o balanço das folhas acontece na placa de vídeo
    const list = [...game.players.values()]
    SetEars(list) // som posicional: quem ouve é o jogador
    shadows.update(list, [])
    UpdateDoors(dt, list, []) // portas abrem quando alguém chega perto
    camera.update(dt, list[0])
    hud.update(list[0])
    BodySounds(dt, list[0])
    UpdateBuildings(list) // dentro de casa (ou atrás dela): o telhado some
    renderer.render(scene, camera.cam)
    Fps()
  }
  return StartLoop(renderer, draw)
}
