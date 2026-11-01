import * as THREE from 'three'
import { MAT, P, merge, box } from '../../engine/render/style'
import { AddColliders } from '../../engine/world/collision'
import { vnoise } from '../../engine/world/noise'
import { CRUCEIRO, HORREO, OAK, ROCK } from '../../shared/worldgen/assets'
import { PlaceHouse } from './place-house'

// Arena de teste (S0): chão plano de terra e capim, muro baixo de pedra em volta e algumas peças do survivor
// para dar noção de tamanho e de velocidade (cruceiro, hórreo, carvalhos, pedras e uma casa com porta e andar de cima).
// A área da demo (Val de Santa Baia) chega no S9.
const STONE = 0xa9acb8, STONE2 = 0x9599a8

export function BuildArena(scene, size) {
  const h = size / 2, cols = []
  const add = (geo, mat, x, z, ry = 0, y = 0) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, z); m.rotation.y = ry
    m.matrixAutoUpdate = false; m.updateMatrix()
    scene.add(m)
    return m
  }

  // chão: terra batida no meio, capim nas bordas, manchas suaves
  const ext = size + 30
  const ground = P(new THREE.PlaneGeometry(ext, ext, 48, 48).rotateX(-Math.PI / 2), 0x8f9a5a, {
    fn: (c, nx, ny, nz, x, y, z) => {
      const n = vnoise(x * 0.18, z * 0.18, 7), d = Math.max(Math.abs(x), Math.abs(z)) / h
      c.lerp(new THREE.Color(0xa08a64), Math.max(0, 0.75 - d * 0.6) * (0.6 + 0.4 * n)) // terra no centro
      c.multiplyScalar(0.88 + 0.18 * vnoise(x * 0.6, z * 0.6, 3))
    },
  })
  add(ground, MAT.ground, 0, 0)

  // muro baixo de pedra em volta (bloqueia: não dá para pular, este jogo não tem pulo)
  const T = 0.7, H = 1.1
  const walls = [[0, -h, size + T, T], [0, h, size + T, T], [-h, 0, T, size], [h, 0, T, size]]
  add(merge(walls.flatMap(([x, z, w, d]) => [
    box(w, H, d, STONE, [x, H / 2, z], { grad: [0.72, 1.05] }),
    box(w + 0.12, 0.14, d + 0.12, STONE2, [x, H + 0.07, z], { grad: [0.9, 1.05] }),
  ])), MAT.solid, 0, 0)
  for (const [x, z, w, d] of walls) cols.push({ x, z, hw: w / 2, hd: d / 2 })

  // cruceiro (o ponto de descanso do jogo, ainda só enfeite), hórreo, carvalhos e pedras
  add(CRUCEIRO, MAT.solid, 9, 3)
  cols.push({ x: 9, z: 3, hw: 0.9, hd: 0.9 })
  add(HORREO, MAT.solid, 13, -11)
  cols.push({ x: 13, z: -11, hw: 0.8, hd: 2.3 })
  for (const [x, z, s] of [[-14, 12, 1.1], [15, 13, 0.9], [-3, -15, 1.2]]) {
    const t = add(OAK, MAT.foliage, x, z, x * 0.7)
    t.scale.setScalar(s); t.updateMatrix()
    cols.push({ x, z, hw: 0.35 * s, hd: 0.35 * s })
  }
  for (const [x, z, s] of [[4, -6, 1.3], [-12, 2, 0.9], [7, 14, 1.0], [-16, -12, 1.4]]) {
    const r = add(ROCK, MAT.solid, x, z, x, 0.2 * s)
    r.scale.set(s, s * 0.7, s); r.updateMatrix()
    cols.push({ x, z, hw: 0.5 * s, hd: 0.5 * s, h: 0.6 * s })
  }
  AddColliders(cols)

  // uma casa de pedra de 2 andares do survivor (porta, escada, recorte do telhado)
  PlaceHouse(scene, { id: 'stone2', v: 0, x: -8, z: -8, ry: 0 })
}
