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
import { CreateTrail } from './fx/trail'
import { CreateLockMark } from './fx/lock-mark'
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
  events.on('swing', ({ p, kind }) => sfx('swing', { x: p.x, z: p.z, heavy: kind === 'heavy' })) // assobio da lâmina
  events.on('hit', ({ x, z, kind }) => { sfx('slice', { x, z }); if (kind === 'heavy') sfx('stomp', { x, z }) })
  events.on('lock', ({ target }) => sfx('ui', { f: target ? 1250 : 700 })) // travou / soltou: um "tic"
  // inimigos: cada golpe tem o seu som de aviso (DESIGN 8): pancada = gemido grave, dois cortes = rosnado curto
  const WARN = { smash: 'growl', cuts: 'snarl' }
  events.on('enemy-alert', (e) => sfx('moan', { x: e.x, z: e.z }))
  events.on('enemy-warn', ({ e, name }) => sfx(WARN[name] || 'growl', { x: e.x, z: e.z }))
  events.on('enemy-swing', ({ e, name }) => sfx('swing', { x: e.x, z: e.z, heavy: name === 'smash' }))
  events.on('enemy-stagger', (e) => sfx('zstagger', { x: e.x, z: e.z }))
  events.on('enemy-death', (e) => sfx('zdeath', { x: e.x, z: e.z }))
  events.on('hurt', ({ p }) => { sfx('hurt', { x: p.x, z: p.z }); sfx('impact', { x: p.x, z: p.z }) })
  events.on('death', (p) => sfx('death', { x: p.x, z: p.z }))
}

// rastro da lâmina: uma amostra por quadro enquanto ela machuca (ponta da espada e o meio do caminho até o peito)
const _tip = new THREE.Vector3(), _inner = new THREE.Vector3()
function SampleTrail(trail, p) {
  const A = p && p.atk
  if (!A || A.t < A.def.hit[0] - 0.02 || A.t > A.def.hit[1] + 0.02) return
  p.model.muzzle(_tip)
  _inner.set(p.x, p.y + 1.25, p.z).lerp(_tip, 0.45)
  trail.add(_tip, _inner)
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
  for (const e of BALANCE.enemies) game.spawn(e.kind, e.x, e.z, e.ry)
  const input = { players: game.players, setInput: game.setInput, act: game.act }
  BindKeyboard(input, BALANCE.keys)
  const help = document.getElementById('help')
  const HELP = { keys: help.textContent, pad: 'Controle: stick anda · B: tocar rola, segurar corre · RB leve · RT pesado · R3 trava' }
  const pad = BindGamepad(input, BALANCE.pad, (name) => {
    help.textContent = name ? HELP.pad : HELP.keys
    Note(name ? `Controle conectado: ${name}` : 'Controle desconectado')
  })
  events.on('hit', (d) => Impact(d.kind, camera, pad)) // golpe acertou: tremor (só o pesado) e vibração
  events.on('hurt', (d) => Impact(d.strong ? 'hurtStrong' : 'hurt', camera, pad)) // levou golpe
  events.on('death', () => Note('A névoa te levou')) // a tela de morte de verdade chega no S8
  const hud = CreateHud(BALANCE.hud)
  events.on('respawn', () => hud.reset())
  const trail = CreateTrail(scene, BALANCE.juice.trail)
  const lockMark = CreateLockMark(scene)
  if (import.meta.env.DEV) window.__game = game // só no npm run dev: para testes automáticos e depuração

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
    shadows.update(list, game.enemies)
    UpdateDoors(dt, list, []) // portas abrem quando alguém chega perto
    const me = list[0], lock = me && me.lock
    camera.update(dt, me, lock)
    lockMark.update(dt, lock)
    hud.update(dt, me, camera.cam)
    BodySounds(dt, list[0])
    SampleTrail(trail, list[0])
    trail.update(dt)
    UpdateBuildings(list) // dentro de casa (ou atrás dela): o telhado some
    renderer.render(scene, camera.cam)
    Fps()
  }
  return StartLoop(renderer, draw)
}
