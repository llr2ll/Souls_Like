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
import { CreateFX } from '../shared/fx/effects'
import { CreateGame } from './game'
import { CreateCamera } from './camera'
import { CreateHud } from './hud'
import { CreateTrail } from './fx/trail'
import { CreateLockMark } from './fx/lock-mark'
import { CreateMusic } from './audio/music'
import { BuildArena } from './world/arena'
import { BuildSantaBaia, SantaBaiaGround, WATER_Y } from './world/santa-baia'
import { BALANCE } from './config/balance'

// qual mapa: o vale da demo; com ?arena no endereço, a arena de teste (S0–S8)
const URL_ARGS = new URLSearchParams(location.search)
const MAP = URL_ARGS.has('arena') ? 'arena' : 'demo'
// ?castro: teste do chefe. Começa na frente da névoa do castro (morrendo, volta no ✝ do Castro), com um save só dele, sempre do zero
const BOSS_TEST = MAP === 'demo' && URL_ARGS.has('castro')
// monta o cenário do mapa (o chão vem antes: as casas e os inimigos perguntam a altura dele)
function BuildMap(scene, name) {
  const map = BALANCE.maps[name]
  if (name === 'arena') { SetGround(() => 0); BuildArena(scene, map.size); return { map, world: null } }
  SetGround(SantaBaiaGround, WATER_Y)
  return { map, world: BuildSantaBaia(scene, map) }
}

// O motor e as peças copiadas não conhecem este jogo: aqui o jogo liga as peças (chão, água, sons do mundo).
function Wire(camera) {
  SetDeepTest(TooDeep) // água funda bloqueia
  SetCameraSlope(camera.slope) // recorte das casas com a inclinação da câmera deste jogo
  events.on('door-open', (d) => sfx('dooropen', d))
  events.on('door-close', (d) => sfx('doorclose', d))
  events.on('roll', (p) => sfx('jump', { x: p.x, z: p.z })) // impulso com gemido curto
  events.on('roll-land', (p) => sfx('land', { x: p.x, z: p.z }))
  events.on('swing', ({ p, kind }) => sfx('swing', { x: p.x, z: p.z, heavy: kind === 'heavy' })) // assobio da lâmina
  events.on('hit', ({ x, z, kind }) => { sfx('slice', { x, z }); if (kind === 'heavy' || kind === 'critical') sfx('stomp', { x, z }) })
  events.on('lock', ({ target }) => sfx('ui', { f: target ? 1250 : 700 })) // travou / soltou: um "tic"
  // inimigos: cada golpe tem o seu som de aviso (DESIGN 8): pancada = gemido grave, dois cortes = rosnado curto,
  // salto do trasno = risadinha, funda = zunido que sobe, chute = grunhido, zarpaço = rosnado, salto do Lobishome = uivo curto, uivo
  const WARN = { smash: 'growl', cuts: 'snarl', leap: 'giggle', sling: 'whir', kick: 'grunt', claws: 'growl', pounce: 'snarl', howl: 'howl' }
  const ALERT = { trasno: 'giggle', lobishome: 'growl' }
  events.on('enemy-alert', (e) => sfx(ALERT[e.kind] || 'moan', { x: e.x, z: e.z }))
  events.on('enemy-warn', ({ e, name }) => sfx(WARN[name] || 'growl', { x: e.x, z: e.z }))
  events.on('enemy-swing', ({ e, name }) => { if (name !== 'howl' && name !== 'sling') sfx('swing', { x: e.x, z: e.z, heavy: name === 'smash' || name === 'pounce' }) })
  events.on('enemy-land', ({ e }) => sfx('land', { x: e.x, z: e.z }))
  events.on('stone', (s) => sfx('throw', s))
  events.on('stone-wall', (s) => sfx('stone', s))
  events.on('knockdown', (p) => sfx('bodyfall', { x: p.x, z: p.z }))
  events.on('enemy-stagger', (e) => sfx('zstagger', { x: e.x, z: e.z }))
  events.on('enemy-death', (e) => sfx('zdeath', { x: e.x, z: e.z }))
  events.on('hurt', ({ p }) => { sfx('hurt', { x: p.x, z: p.z }); sfx('impact', { x: p.x, z: p.z }) })
  events.on('death', (p) => sfx('death', { x: p.x, z: p.z })) // tela da morte e "A névoa te levou": WireProgress
  // escudo e aparo: madeira no bloqueio, "tlin" de metal no aparo (DESIGN 8, item 4)
  events.on('block', ({ p }) => sfx('doorclose', { x: p.x, z: p.z }))
  events.on('guard-break', ({ p }) => { sfx('doorclose', { x: p.x, z: p.z }); sfx('grunt', { x: p.x, z: p.z }) })
  events.on('parry-try', (p) => sfx('throw', { x: p.x, z: p.z }))
  events.on('parry', ({ p }) => { sfx('ricochet', { x: p.x, z: p.z }); sfx('pin', { x: p.x, z: p.z }) })
  events.on('enemy-broken', (e) => sfx('zstagger', { x: e.x, z: e.z }))
  // cabaça e pão: gole (borbulha) ou mastigar; a cura soa como sininhos; golpe no meio = som seco
  events.on('use', ({ p, what }) => what === 'drink'
    ? sfx('gurgle', { x: p.x, z: p.z, delay: 0.3 })
    : [0.1, 0.28].forEach((d) => sfx('chew', { x: p.x, z: p.z, delay: d })))
  events.on('healed', ({ p }) => sfx('heal', { x: p.x, z: p.z }))
  events.on('use-lost', ({ p }) => sfx('dryfire', { x: p.x, z: p.z }))
  events.on('use-empty', ({ p, what }) => { sfx('dryfire', { x: p.x, z: p.z }); Note(what === 'drink' ? 'A cabaça está vazia' : 'Sem pão de milho') })
}

// faíscas: na frente do escudo (bloqueio e aparo) e clarão na arma de quem ajoelhou
function WireFX(fx) {
  const shield = (p, k) => [p.x + Math.sin(p.facing) * 0.55 * k, 1.25, p.z + Math.cos(p.facing) * 0.55 * k]
  events.on('block', ({ p }) => fx.burst(...shield(p, 1), 0xffd38a, 5, 2.5, 0.3, 0.6))
  events.on('guard-break', ({ p }) => fx.burst(...shield(p, 1), 0xc8a070, 10, 3, 0.5, 0.9))
  events.on('parry', ({ p }) => { fx.burst(...shield(p, 1), 0xfff2c0, 14, 5, 0.45, 1); fx.flash(...shield(p, 1), 0.5, 0xfff2c0, 0.18) })
  events.on('enemy-broken', (e) => fx.flash(e.x, 1.0, e.z, 0.7, 0xffe9a8, 0.35))
  events.on('healed', ({ p }) => fx.ring(p.x, p.gy || 0, p.z, 0xffd98a, 0.3, 1.3, 0.6)) // cura: anel dourado no chão
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
// título grande no meio da tela por uns segundos (DESIGN 8, item 8: "Vela acesa")
let titleTimer
function Title(text) {
  const el = document.getElementById('title')
  el.textContent = text
  el.classList.add('on')
  clearTimeout(titleTimer)
  titleTimer = setTimeout(() => el.classList.remove('on'), 2600)
}

// achado: papel com título e texto curto no meio de baixo por uns segundos (DESIGN 6: história pelo mundo, sem cutscene)
let paperTimer
function Paper(title, text) {
  const el = document.getElementById('paper')
  el.querySelector('b').textContent = title
  el.querySelector('p').textContent = text
  el.classList.add('on')
  clearTimeout(paperTimer)
  paperTimer = setTimeout(() => el.classList.remove('on'), 4000 + text.length * 45)
}

// save no navegador (DESIGN 7), um por mapa. Abrir a página com ?novo apaga e começa do zero. Navegador sem permissão: joga sem salvar
const SAVE_KEY = BOSS_TEST ? 'camino-das-animas-save-castro' : MAP === 'demo' ? 'camino-das-animas-save' : `camino-das-animas-save-${MAP}`
function ReadSave() {
  try {
    if (URL_ARGS.has('novo') || BOSS_TEST) { localStorage.removeItem(SAVE_KEY); return null }
    return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')
  } catch { return null }
}
function WriteSave(data) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)) } catch {} }

// progresso: descanso, cera, vela da morte (sons, avisos, tela da morte)
function WireProgress(fx) {
  const at = (o) => ({ x: o.x, z: o.z })
  events.on('save', WriteSave)
  events.on('rest', ({ p, c, first }) => {
    sfx('revive', at(p))
    if (first) { Title('Vela acesa'); sfx('start') } else Note(`Descansou no ${c.name}`)
    fx.flash(c.x, 0.6, c.z + 1, 0.9, 0xffd27a, 0.6)
  })
  events.on('rest-denied', () => Note('Não dá para descansar com inimigos por perto'))
  events.on('cera', ({ e }) => { sfx('buff', at(e)); fx.burst(e.x, 1.0, e.z, 0xf5e6b8, 10, 2.2, 0.8, 0.8) }) // derrete como vela
  events.on('candle-pick', ({ p, cera }) => { sfx('supply'); Note(`Cera recuperada: ${cera}`); fx.flash(p.x, 0.5, p.z, 0.7, 0xffd27a, 0.5) })
  events.on('candle-lost', ({ cera }) => Note(`A vela apagou: ${cera} de cera perdida`))
  // itens, atalhos, portão fechado, névoa
  events.on('pickup', ({ p, it }) => {
    sfx('pin', at(p))
    if (it.kind === 'bread') Note('Pão de milho')
    else if (it.kind === 'gourd') { Title('Anaco de cabaça'); Note('A cabaça ganhou um gole a mais') }
    else Paper(it.title, it.text)
  })
  events.on('shortcut', ({ s }) => { sfx('bang', { x: s.gate.x, z: s.gate.z }); sfx('dooropen', { x: s.gate.x, z: s.gate.z }); Title('Atalho aberto') })
  events.on('locked', ({ s }) => { sfx('bang'); Note(s.locked || 'Fechado. Não abre deste lado.') })
  events.on('cera-stolen', ({ n }) => Note(`Um trasno roubou ${n} de cera! Pegue ele antes de descansar`))
  events.on('cera-back', ({ n }) => Note(`A cera roubada voltou: ${n}`))
  events.on('summon', ({ e }) => fx.puff(e.x, (e.y || 0) + 0.3, e.z, 0x8a8a90, 0.7, 0.8))
  events.on('fog', () => Note('A névoa fecha a entrada do castro… por enquanto.'))
  const death = document.getElementById('death')
  events.on('death', () => { sfx('gameover'); setTimeout(() => death.classList.add('on'), 500) })
  events.on('respawn', () => death.classList.remove('on'))
}
// chefe (S11): som de cada aviso e golpe (DESIGN 8: sibilo e chocalho da serpe, sinos da moura), poeira do enroscar,
// a serpe virando pedra, a música, a barra grande e o "Fim da demo". impact(kind) = tremor + vibração
function WireBoss(fx, hud, music, impact) {
  const at = (o) => ({ x: o.x, z: o.z })
  const WARN = { bite: 'sibilo', tail: 'rattle', squeeze: 'scrape', fuso: 'whir', fio: 'bells', encanto: 'throw', 'encanto-mark': 'bells' }
  const STRIKE = { bite: 'bite', tail: 'swing', squeeze: 'grab', fuso: 'swing', fio: 'zap', encanto: 'swing' }
  events.on('boss-warn', ({ e, name, x, z }) => {
    sfx(WARN[name] || 'growl', x !== undefined ? { x, z } : at(e)) // o brilho do encanto soa onde ela vai voltar
    if (name === 'encanto') fx.puff(e.x, (e.y || 0) + 1, e.z, 0xe8d39a, 0.9, 0.7) // some numa fumaça dourada
  })
  events.on('boss-strike', ({ e, name }) => {
    sfx(STRIKE[name] || 'swing', { ...at(e), heavy: name === 'tail' || name === 'encanto' })
    if (name === 'squeeze') sfx('stomp', at(e))
  })
  events.on('boss-dust', (d) => fx.puff(d.x, 0.2, d.z, 0xa89a80, 0.6, 0.6))
  events.on('fog-enter', ({ p }) => { sfx('whir', at(p)); fx.puff(p.x, 1, p.z + 1, 0xe8ecef, 1.2, 1) })
  events.on('fog-lift', () => Note('A névoa do castro se desfaz'))
  events.on('boss-start', (e) => { hud.boss(e); music.start() })
  events.on('boss-phase', (e) => {
    sfx('crack', at(e))
    impact('boss')
    music.phase(2)
    setTimeout(() => Title('A Moura'), 900) // quando ela sai da pedra
  })
  const ending = document.getElementById('ending'), E = BALANCE.castro.ending
  events.on('boss-end', () => {
    music.stop(BALANCE.music.end, true)
    setTimeout(() => hud.boss(null), 2500)
    setTimeout(() => { ending.classList.add('on'); sfx('revive') }, E.delay * 1000)
    setTimeout(() => ending.classList.remove('on'), (E.delay + E.time) * 1000)
  })
  events.on('death', () => { music.stop(); hud.boss(null) })
}

// zumbido baixo que guia até a vela da morte: mais frequente perto
let humT = 0
function CandleHum(dt, p, candle) {
  if (!p || !candle) return
  const d = Math.hypot(candle.x - p.x, candle.z - p.z)
  if (d > BALANCE.candle.hum || (humT -= dt) > 0) return
  humT = 1.2 + d * 0.06
  sfx('candle', { x: candle.x, z: candle.z })
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
  const { map, world } = BuildMap(scene, MAP)

  const game = CreateGame(scene, map, world)
  game.addPlayer('local', 'Peregrino') // sem menu: teclado e controle mexem o mesmo jogador
  for (const e of map.enemies) game.spawn(e.kind, e.x, e.z, e.ry, { sit: e.sit })
  if (game.load(ReadSave())) Note('Continuando de onde parou') // fechou a página e abriu: continua
  if (BOSS_TEST) {
    const p = game.players.get('local'), f = map.fogs.find((o) => o.boss)
    Object.assign(p, { home: 'castro', x: f.x, z: f.z + 2.2, facing: Math.PI, safeX: f.x, safeZ: f.z + 2.2 })
    Note('Teste do chefe: E/A atravessa a névoa')
  }
  const input = { players: game.players, setInput: game.setInput, act: game.act }
  BindKeyboard(input, BALANCE.keys)
  const help = document.getElementById('help')
  const HELP = { keys: help.textContent, pad: 'Controle: stick anda · B: tocar rola, segurar corre · RB leve · RT pesado · LB escudo · LT apara · R3 trava · X cabaça · Y pão' }
  for (const [sel, key] of [['.gourd small', 'X'], ['.bread small', 'Y']]) document.querySelector(`#items ${sel}`).dataset.pad = key
  let usingPad = false
  const pad = BindGamepad(input, BALANCE.pad, (name) => {
    usingPad = !!name
    help.textContent = name ? HELP.pad : HELP.keys
    // a letra no canto de cada item mostra o botão do aparelho em uso
    for (const el of document.querySelectorAll('#items small')) { el.dataset.key ||= el.textContent; el.textContent = name ? el.dataset.pad : el.dataset.key }
    Note(name ? `Controle conectado: ${name}` : 'Controle desconectado')
  })
  events.on('hit', (d) => Impact(d.kind, camera, pad)) // golpe acertou: tremor (só o pesado) e vibração
  events.on('hit', (d) => { if (d.kind === 'critical') camera.punch(BALANCE.juice.zoom.critical, BALANCE.juice.zoom.time) })
  for (const k of ['block', 'parry', 'guard-break']) events.on(k, () => Impact(k === 'guard-break' ? 'guardBreak' : k, camera, pad))
  const fx = CreateFX(scene)
  WireFX(fx)
  WireProgress(fx)
  events.on('hurt', (d) => Impact(d.strong ? 'hurtStrong' : 'hurt', camera, pad)) // levou golpe
  const hud = CreateHud(BALANCE.hud)
  events.on('respawn', () => hud.reset())
  WireBoss(fx, hud, CreateMusic(BALANCE.music), (k) => Impact(k, camera, pad))
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
    if (me) hud.prompt(game.progress.interactable(me), usingPad ? 'A' : 'E')
    CandleHum(dt, me, game.progress.candle)
    BodySounds(dt, list[0])
    SampleTrail(trail, list[0])
    trail.update(dt)
    fx.update(dt)
    if (world) world.update(dt) // portões, alavancas, névoa, fogueira
    UpdateBuildings(list) // dentro de casa (ou atrás dela): o telhado some
    renderer.render(scene, camera.cam)
    Fps()
  }
  return StartLoop(renderer, draw)
}
