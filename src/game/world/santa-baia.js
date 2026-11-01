import * as THREE from 'three'
import { MAT, P, merge, box, cyl } from '../../engine/render/style'
import { AddColliders } from '../../engine/world/collision'
import { vnoise } from '../../engine/world/noise'
import { CRUCEIRO, HORREO, OAK, PINE, ROCK, WELL, BUSH, STUMP } from '../../shared/worldgen/assets'
import { PlaceHouse } from './place-house'

// Val de Santa Baia (DESIGN 4) em blocos simples (S9). Norte = -z (para cima na tela). ~100 × 160 m.
// Do sul para o norte: largada → Ponte Vella (rio) → prado do ✝ da Ponte → rua de baixo → rua de cima → adro e cemitério →
// mosteiro de San Fiz (claustro) → subida → ✝ do Castro → castro (fechado pela névoa até o chefe, S11).
// Atalho 2: corredor do mosteiro até o prado do ✝ da Ponte; o portão só abre pela alavanca de dentro do mosteiro.
// Souto (opcional, a oeste da subida): castanheiros; o Lobishome e os trasnos chegam no S10.
// O que é de jogo (largada, cruceiros, inimigos, itens, atalho, névoa) fica em balance.js · maps.demo; aqui só o cenário.

export const WATER_Y = -0.25 // superfície do rio
const RIVER = [52, 62] // faixa do rio (z)
const BRIDGE = [12, 16] // ponte (x)
// altura do chão: rio (leito fundo, margens em rampa) e a subida para o castro (+3 m ao norte).
// Em cima da ponte o chão é o tabuleiro (0); visual = true dá o leito do rio por baixo dela (para o desenho do terreno)
export function SantaBaiaGround(x, z, visual = false) {
  let h = 0
  const [r0, r1] = RIVER
  if (z > r0 - 2 && z < r1 + 2 && (visual || !(x > BRIDGE[0] && x < BRIDGE[1]))) {
    const edge = Math.min(z - (r0 - 2), r1 + 2 - z) // 0 na margem, cresce para o meio
    h = -Math.min(1.4, edge * 0.7)
  }
  if (z < -36) h += Math.min(3, (-36 - z) * 0.2)
  return h
}

// ruas e caminhos de terra (só a cor do chão)
const PATHS = [
  [10, 64, 18, 80], [12, 38, 18, 52], [-4, 34, 40, 42], // largada, ponte, prado
  [-48, 26, 6, 34], [-50, -4, -42, 34], [-48, -4, 6, 4], // rua de baixo, ligação oeste, rua de cima
  [-2, -28, 22, -4], [22, -22, 24, -16], [24, -34, 48, -8], [34, -8, 38, 38], // adro, passagem, mosteiro, corredor
  [26, -56, 46, -34], // subida
]
const onPath = (x, z) => PATHS.some(([a, b, c, d]) => x > a && x < c && z > b && z < d)

// muros [x1, z1, x2, z2, altura] (só retos em x ou em z). Altos o bastante para barrar, baixos para não esconder o peregrino
const H = 1.8, LOW = 1.0, MON = 2.2
const WALLS = [
  // borda do mapa
  [-50, -84, -50, 80, H], [52, -84, 52, 80, H], [-50, 80, 52, 80, H], [-50, -84, 52, -84, H],
  // largada (o rio fecha o norte, só a ponte passa). Os muros entram no rio até a parte funda (a margem rasa dá pé)
  [0, 58, 0, 80, H], [30, 58, 30, 80, H],
  // ponte: parapeitos baixos
  [BRIDGE[0], 50, BRIDGE[0], 64, LOW], [BRIDGE[1], 50, BRIDGE[1], 64, LOW],
  // prado do ✝ da Ponte: oeste, leste e a frente da carballeira
  [-4, 38, -4, 56, H], [40, 38, 40, 56, H], [6, 38, 33.2, 38, H], [38.8, 38, 40, 38, H],
  // carballeira (bloco de mata entre a vila e o corredor)
  [6, -4, 6, 38, H], [6, -4, 33.2, -4, H],
  // quintais entre a rua de baixo e a de cima (a ligação oeste passa; o portão do quintal do ferreiro (atalho 1) fica em x -25..-23)
  [-42, 15, -25, 15, H], [-23, 15, 6, 15, H],
  // adro e cemitério (muro baixo): oeste, norte, leste (com a passagem para o mosteiro)
  [-2, -28, -2, -4, LOW], [-2, -28, 22, -28, LOW], [22, -28, 22, -22, LOW], [22, -16, 22, -4, LOW], [22, -16, 24, -16, LOW], [22, -22, 24, -22, LOW],
  // souto ↔ rua de cima (a escada do hórreo, atalho 3, fica em x -46..-42)
  [-50, -16, -46, -16, H], [-42, -16, -2, -16, H],
  // mosteiro (portões: oeste aberto, sul fechado (atalho), norte aberto para a subida)
  [24, -34, 24, -22, MON], [24, -16, 24, -8, MON], [24, -8, 34, -8, MON], [38, -8, 48, -8, MON], [48, -34, 48, -8, MON],
  [24, -34, 34, -34, MON], [38, -34, 48, -34, MON],
  // corredor do atalho
  [33.2, -8, 33.2, 38, H], [38.8, -8, 38.8, 38, H], [48, -8, 52, -8, H],
  // souto ↔ subida (passagem em z -46..-40) e o alto
  [24, -58, 24, -46, H], [24, -40, 24, -34, H], [-50, -58, 24, -58, H],
  [24, -56, 30, -56, H], [34, -56, 52, -56, H], // subida ↔ castro (só a entrada, onde fica a névoa)
]

// casas do survivor: frente (+z) para a rua com ry = 0; ry = π vira para -z
const HOUSES = [
  { id: 'stone1', v: 0, x: -36, z: 20, ry: 0 }, { id: 'stone_s', v: 1, x: -18, z: 20, ry: 0 }, { id: 'house1', v: 0, x: -8, z: 20.5, ry: 0 },
  { id: 'house3', v: 1, x: -30, z: 40, ry: Math.PI }, { id: 'stone1', v: 2, x: -16, z: 40, ry: Math.PI },
  { id: 'house2', v: 1, x: -36, z: -10, ry: 0 },
  { id: 'stone1', v: 1, x: -22, z: -10, ry: 0 },
  { id: 'stone2', v: 2, x: -30, z: 9.5, ry: Math.PI, ferreiro: true }, // casa do ferreiro: 2 andares; o anaco de cabaça fica em cima
  { id: 'stone_s', v: 0, x: -14, z: 9.5, ry: Math.PI },
]

// semente fixa por posição (o mesmo cenário sempre; não gasta o sorteio do replay)
const hash = (x, z) => { const v = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return v - Math.floor(v) }

export function BuildSantaBaia(scene, map) {
  const cols = []
  const parts = { solid: [], foliage: [] }
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3()
  // peça parada: copiada para o lugar e juntada às outras do mesmo material (uma malha só por material)
  const put = (geo, mat, x, z, ry = 0, sc = 1, y = SantaBaiaGround(x, z)) => {
    const g = geo.clone()
    g.applyMatrix4(_m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(sc, sc, sc)))
    parts[mat].push(g)
  }

  // ---- chão: terra nas ruas, capim de outono no resto, lama no leito do rio ----
  const W = 112, D = 172
  const geo = new THREE.PlaneGeometry(W, D, 56, 86).rotateX(-Math.PI / 2).translate(1, 0, -2)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) pos.setY(i, SantaBaiaGround(pos.getX(i), pos.getZ(i), true))
  geo.computeVertexNormals()
  const ground = new THREE.Mesh(P(geo, 0x9a9858, {
    fn: (c, nx, ny, nz, x, y, z) => {
      const n = vnoise(x * 0.15, z * 0.15, 7)
      if (y < -0.3) c.lerp(new THREE.Color(0x6e684a), 0.8) // leito
      else if (onPath(x, z)) c.lerp(new THREE.Color(0xa58c62), 0.75 + 0.2 * n)
      else c.lerp(new THREE.Color(0xb39a52), 0.25 * n) // capim seco
      c.multiplyScalar(0.88 + 0.16 * vnoise(x * 0.5, z * 0.5, 3))
    },
  }), MAT.ground)
  ground.matrixAutoUpdate = false
  scene.add(ground)

  // ---- rio ----
  const water = new THREE.Mesh(new THREE.PlaneGeometry(104, RIVER[1] - RIVER[0] + 4).rotateX(-Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0x5b8ca6, transparent: true, opacity: 0.85 }))
  water.position.set(1, WATER_Y, (RIVER[0] + RIVER[1]) / 2)
  scene.add(water)
  // ponte velha: tabuleiro de pedra e dois arcos
  parts.solid.push(box(BRIDGE[1] - BRIDGE[0], 0.4, 14, 0xa7a9b2, [(BRIDGE[0] + BRIDGE[1]) / 2, -0.2, 57], { grad: [0.8, 1.05] }))
  for (const z of [55, 59]) parts.solid.push(box(BRIDGE[1] - BRIDGE[0] - 0.4, 1.2, 1.2, 0x8f929e, [(BRIDGE[0] + BRIDGE[1]) / 2, -1.2, z]))
  // a parte funda do rio barra (o movimento copiado sabe nadar; aqui não se nada): margem rasa dá pé, o meio não
  const deep = [RIVER[0] - 0.6, RIVER[1] + 0.6]
  cols.push({ x: (-50 + BRIDGE[0] - 0.4) / 2, z: (deep[0] + deep[1]) / 2, hw: (BRIDGE[0] - 0.4 + 50) / 2, hd: (deep[1] - deep[0]) / 2 })
  cols.push({ x: (BRIDGE[1] + 0.4 + 52) / 2, z: (deep[0] + deep[1]) / 2, hw: (52 - BRIDGE[1] - 0.4) / 2, hd: (deep[1] - deep[0]) / 2 })

  // ---- muros ----
  for (const [x1, z1, x2, z2, h] of WALLS) {
    const t = h > 2 ? 0.9 : 0.7, cx = (x1 + x2) / 2, cz = (z1 + z2) / 2
    const w = Math.abs(x2 - x1) + t, d = Math.abs(z2 - z1) + t
    const y0 = Math.min(SantaBaiaGround(x1, z1), SantaBaiaGround(x2, z2), SantaBaiaGround(cx, cz))
    const tall = h + Math.max(0, Math.max(SantaBaiaGround(x1, z1), SantaBaiaGround(x2, z2)) - y0) // na rampa, o muro desce até o chão mais baixo
    parts.solid.push(box(w, tall, d, 0xa9acb8, [cx, y0 + tall / 2, cz], { grad: [0.72, 1.05] }))
    parts.solid.push(box(w + 0.1, 0.12, d + 0.1, 0x9599a8, [cx, y0 + tall + 0.06, cz]))
    const c = { x: cx, z: cz, hw: w / 2, hd: d / 2 }
    if (h < 1.2) c.h = h // muro baixo: barra o passo mas não tapa a visão (travar no alvo)
    cols.push(c)
  }

  // ---- casas ----
  // anchors: pontos que o jogo usa (o anaco de cabaça num móvel do andar de cima da casa do ferreiro)
  const anchors = {}
  for (const h of HOUSES) {
    const house = PlaceHouse(scene, h)
    if (h.ferreiro) {
      const spot = house.spots.filter((s) => s.lv === 1).sort((a, b) => a.id.localeCompare(b.id))[0]
      if (spot) anchors.anaco = { x: spot.x, z: spot.z, y: spot.y, lv: 1 }
    }
  }

  // ---- cruceiros (o jogo acende as velinhas) ----
  for (const c of map.cruceiros) { put(CRUCEIRO, 'solid', c.x, c.z); cols.push({ x: c.x, z: c.z, hw: 0.9, hd: 0.9 }) }

  // ---- vila: lume (fogueira dos romeiros), fonte, hórreos ----
  put(WELL, 'solid', 0, 30); cols.push({ x: 0, z: 30, hw: 0.9, hd: 0.9 })
  for (const [x, z, ry] of [[-44, -9, 0], [-4, 8, Math.PI / 2]]) {
    put(HORREO, 'solid', x, z, ry)
    cols.push(ry ? { x, z, hw: 2.3, hd: 0.8 } : { x, z, hw: 0.8, hd: 2.3 })
  }
  // fogueira: pedras em roda e lenha (a chama é do jogo: world/candle.js)
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; parts.solid.push(P(new THREE.DodecahedronGeometry(0.18, 0), 0x8d8f99, { p: [-20 + Math.cos(a) * 0.55, 0.1, 30 + Math.sin(a) * 0.55], lit: 0.2 })) }
  for (const a of [0.3, 1.9, 3.4]) parts.solid.push(P(cyl(0.07, 0.08, 0.9, 6).rotateZ(Math.PI / 2), 0x6b4a2b, { p: [-20, 0.12, 30], r: [0, a, 0.25] }))
  cols.push({ x: -20, z: 30, hw: 0.6, hd: 0.6, h: 0.4 })

  // ---- igreja de Santa Baia (bloco) e cemitério ----
  parts.solid.push(box(9, 6, 14, 0xc9c3ad, [12, 3, -17], { grad: [0.78, 1.05] }))
  parts.solid.push(P(new THREE.CylinderGeometry(0.01, 6.4, 3, 4, 1).rotateY(Math.PI / 4), 0x8f5a3c, { p: [12, 7.5, -17], s: [1, 1, 1.55], lit: 0.1 })) // telhado
  parts.solid.push(box(4, 12, 4, 0xbfb9a2, [12, 6, -26.2], { grad: [0.75, 1.05] })) // torre do sino
  parts.solid.push(box(2, 2.8, 0.3, 0x5a3a24, [12, 1.4, -9.9])) // porta
  cols.push({ x: 12, z: -17, hw: 4.5, hd: 7 }, { x: 12, z: -26.2, hw: 2, hd: 1.8 })
  for (const x of [1, 3.5, 6]) for (const z of [-7, -10, -13, -16, -19]) {
    if (hash(x, z) < 0.25) continue
    parts.solid.push(box(0.7, 0.9 + hash(z, x) * 0.4, 0.16, 0x9fa2ad, [x, 0.45, z], { grad: [0.7, 1.05], r: [0, (hash(x * 2, z) - 0.5) * 0.3, 0] }))
    parts.solid.push(box(0.8, 0.18, 1.6, 0x7b6a48, [x, 0.09, z + 0.95])) // cova
    cols.push({ x, z, hw: 0.4, hd: 0.15, h: 1.0 })
  }

  // ---- mosteiro: claustro (arcada em volta do pátio) e a fonte no meio ----
  const arc = []
  for (const x of [28, 32, 36, 40, 44]) arc.push([x, -12], [x, -30])
  for (const z of [-16, -20, -24, -26]) arc.push([28, z], [44, z])
  for (const [x, z] of arc) { parts.solid.push(P(cyl(0.3, 0.36, 3, 8), 0xc8c2ac, { p: [x, 1.5, z], grad: [0.72, 1.05] })); cols.push({ x, z, hw: 0.32, hd: 0.32 }) }
  for (const z of [-12, -30]) parts.solid.push(box(16.6, 0.4, 0.8, 0xbdb6a0, [36, 3.1, z])) // vigas da arcada
  for (const x of [28, 44]) parts.solid.push(box(0.8, 0.4, 18.6, 0xbdb6a0, [x, 3.1, -21]))
  put(WELL, 'solid', 36, -21); cols.push({ x: 36, z: -21, hw: 0.9, hd: 0.9 })

  // ---- castro: muralha redonda, duas pallozas em ruína ----
  const CX = 32, CZ = -70, R = 12
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2
    if (Math.abs(Math.sin(a) - 1) < 0.03) continue // entrada ao sul (a névoa)
    const x = CX + Math.cos(a) * R, z = CZ + Math.sin(a) * R
    parts.solid.push(box(2.9, 1.6, 1.0, 0x9a9686, [x, 3 + 0.8, z], { r: [0, -a + Math.PI / 2, 0], grad: [0.7, 1.05] }))
    cols.push({ x, z, hw: 1.1, hd: 1.1 })
  }
  for (const [x, z] of [[25, -66], [39, -74]]) {
    parts.solid.push(P(cyl(3, 3.1, 1.6, 14, true), 0x9e9480, { p: [x, 3.8, z], grad: [0.7, 1.05] }))
    cols.push({ x, z, hw: 3, hd: 3, h: 1.0 })
  }

  // ---- árvores: carballeira (carvalhos), souto (castanheiros; clareira do Lobishome), pinheiros no alto, beira dos muros ----
  const tree = (geo, x, z, s) => { put(geo, 'foliage', x, z, hash(x, z) * 6, s); cols.push({ x, z, hw: 0.35 * s, hd: 0.35 * s }) }
  for (let x = 9; x < 31; x += 5) for (let z = 0; z < 36; z += 5) { const j = hash(x, z); tree(OAK, x + (j - 0.5) * 2.5, z + (hash(z, x) - 0.5) * 2.5, 0.9 + j * 0.5) }
  for (let x = -46; x < 22; x += 6) for (let z = -54; z < -20; z += 6) {
    if (z > -28 && x > -4) continue // atrás do adro
    if (Math.hypot(x + 14, z + 42) < 8) continue // clareira
    const j = hash(x, z)
    tree(OAK, x + (j - 0.5) * 3, z + (hash(z, x) - 0.5) * 3, 1.1 + j * 0.6)
  }
  for (const [x, z] of [[-44, 70], [-38, 66], [-30, 72], [-20, 68], [36, 70], [44, 66], [46, 74], [26, 46], [-2, 48], [46, -64], [16, -64], [18, -76], [48, -78]]) tree(PINE, x, z, 1 + hash(x, z) * 0.4)
  for (const [x, z] of [[4, 72], [26, 70], [3, 46], [34, 50], [-8, 30], [-40, 4], [16, -6], [46, -40], [28, -48]]) put(BUSH, 'foliage', x, z, hash(x, z) * 6, 1.2)
  for (const [x, z, s] of [[24, 68, 1.3], [8, 66, 1], [-10, 44, 1.2], [30, 44, 1.4], [-46, -2, 1.2], [44, -50, 1.5], [28, -52, 1.2], [20, -60, 1.6]]) {
    put(ROCK, 'solid', x, z, x, s); cols.push({ x, z, hw: 0.5 * s, hd: 0.5 * s, h: 0.6 * s })
  }
  for (const [x, z] of [[-12, -40], [-17, -45], [-9, -46]]) put(STUMP, 'solid', x, z) // tocos na clareira

  // ---- junta as peças paradas: uma malha por material ----
  for (const k in parts) {
    if (!parts[k].length) continue
    const m = new THREE.Mesh(merge(parts[k]), MAT[k])
    m.matrixAutoUpdate = false
    scene.add(m)
  }
  AddColliders(cols)

  // ---- coisas que mexem: portões dos atalhos, alavancas e a névoa ----
  const gates = {}, levers = {}
  for (const s of map.shortcuts || []) {
    gates[s.id] = Gate(scene, s.gate)
    levers[s.id] = Lever(scene, s.lever)
  }
  const fogs = (map.fogs || []).map((f) => Fog(scene, f))
  // a chama da fogueira dos romeiros
  const fire = Fire(scene, -20, 30)
  return {
    gates, levers, fogs, anchors,
    update(dt) { for (const k in gates) gates[k].update(dt); for (const k in levers) levers[k].update(dt); for (const f of fogs) f.update(dt); fire.update(dt) },
  }
}

// portão de grade de madeira: dobradiça na ponta oeste; abre girando para dentro do mosteiro (norte). g = { x, z, w }
function Gate(scene, g) {
  const pivot = new THREE.Group()
  pivot.position.set(g.x - g.w / 2, SantaBaiaGround(g.x, g.z), g.z)
  const bars = []
  for (let x = 0.15; x < g.w; x += 0.42) bars.push(box(0.12, 2.3, 0.12, 0x6b4a2b, [x, 1.15, 0]))
  bars.push(box(g.w, 0.14, 0.14, 0x5a3c22, [g.w / 2, 0.5, 0]), box(g.w, 0.14, 0.14, 0x5a3c22, [g.w / 2, 1.9, 0]))
  pivot.add(new THREE.Mesh(merge(bars), MAT.solid))
  scene.add(pivot)
  const col = { x: g.x, z: g.z, hw: g.w / 2, hd: 0.3 }
  AddColliders([col])
  let ang = 0, target = 0
  return {
    col,
    open(instant) { target = -Math.PI / 2; col.off = true; if (instant) ang = target },
    get isOpen() { return !!col.off },
    update(dt) { ang += (target - ang) * Math.min(1, dt * 2.2); pivot.rotation.y = ang },
  }
}
// alavanca: poste com braço que desce ao puxar
function Lever(scene, l) {
  const root = new THREE.Group()
  root.position.set(l.x, SantaBaiaGround(l.x, l.z), l.z)
  root.add(new THREE.Mesh(merge([box(0.5, 0.25, 0.5, 0x8d8f99, [0, 0.12, 0]), box(0.22, 1.0, 0.22, 0x6b4a2b, [0, 0.6, 0])]), MAT.solid))
  const arm = new THREE.Group()
  arm.position.y = 1.0
  arm.add(new THREE.Mesh(merge([box(0.08, 0.9, 0.08, 0x4a4d57, [0, 0.45, 0]), box(0.18, 0.18, 0.18, 0x2f3038, [0, 0.9, 0])]), MAT.solid))
  arm.rotation.x = -0.6
  root.add(arm)
  scene.add(root)
  AddColliders([{ x: l.x, z: l.z, hw: 0.3, hd: 0.3 }])
  let target = -0.6
  return {
    pull(instant) { target = 0.9; if (instant) arm.rotation.x = target },
    update(dt) { arm.rotation.x += (target - arm.rotation.x) * Math.min(1, dt * 6) },
  }
}
// névoa: parede de fumaça clara que ondula (E/A atravessa para a arena do chefe; vencido, ela se desfaz). f = { x, z, w, behind? }
// behind = a névoa que fecha a entrada da arena atrás de você enquanto o chefe está acordado (close(true/false))
const fogMat = new THREE.MeshBasicMaterial({ color: 0xe8ecef, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide })
function FogWall(scene, x, z, w) {
  const g = new THREE.Group()
  g.position.set(x, SantaBaiaGround(x, z), z)
  const sheets = [0, 1, 2, 3].map((i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w + 1.5 - i * 0.4, 4.5 - i * 0.6), fogMat)
    m.position.set(0, 2.2 - i * 0.3, (i - 1.5) * 0.3)
    g.add(m)
    return m
  })
  scene.add(g)
  const col = { x, z, hw: w / 2 + 0.3, hd: 0.5 }
  AddColliders([col])
  return { g, sheets, col }
}
function Fog(scene, f) {
  const main = FogWall(scene, f.x, f.z, f.w)
  const back = f.behind && FogWall(scene, f.behind.x, f.behind.z, f.behind.w)
  if (back) { back.col.off = true; back.g.visible = false; back.g.scale.y = 0.55 } // mais baixa: não tapa quem luta perto dela
  let t = 0, gone = false
  return {
    ...f, col: main.col,
    // vencido o chefe: a névoa se desfaz e deixa passar
    lift(instant) { main.col.off = true; gone = true; if (instant) main.g.visible = false },
    close(on) { if (!back || back.g.visible === on) return; back.col.off = !on; back.g.visible = on },
    update(dt) {
      if (gone) { main.g.scale.y = Math.max(0, main.g.scale.y - dt * 0.6); if (main.g.scale.y <= 0) main.g.visible = false }
      t += dt
      for (const w of [main, back]) if (w && w.g.visible) w.sheets.forEach((s, i) => { s.position.x = Math.sin(t * 0.7 + i * 2) * 0.4; s.scale.y = 1 + Math.sin(t * 0.9 + i) * 0.08 })
      fogMat.opacity = 0.28 + 0.06 * Math.sin(t * 1.3)
    },
  }
}
// fogueira: chama que tremula (sem luz de verdade: barato)
const fireMat = new THREE.MeshBasicMaterial({ color: 0xffa53a })
const fireGlow = new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })
function Fire(scene, x, z) {
  const g = new THREE.Group()
  g.position.set(x, 0.15, z)
  const cones = [0, 1, 2].map((i) => { const m = new THREE.Mesh(new THREE.ConeGeometry(0.16 - i * 0.03, 0.6 - i * 0.12, 6), fireMat); m.position.set((i - 1) * 0.12, 0.3, (i % 2) * 0.1); g.add(m); return m })
  const glow = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), fireGlow)
  glow.position.y = 0.4
  g.add(glow)
  scene.add(g)
  let t = 0
  return { update(dt) { t += dt; cones.forEach((c, i) => { c.scale.y = 0.8 + 0.35 * Math.abs(Math.sin(t * (9 + i * 3) + i)) }); glow.scale.setScalar(0.9 + 0.1 * Math.sin(t * 7)) } }
}
