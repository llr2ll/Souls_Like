import * as THREE from 'three'
import { MAT, P, merge, box, sph, cyl } from '../../engine/render/style'
import { AddColliders } from '../../engine/world/collision'

// Boneco de treino (S3): poste de carvalho com um saco de palha, braços de pau e cabeça de saco. Não morre.
// Levou golpe: pisca branco (DESIGN 8, item 2) e balança para longe do golpe, como uma mola.
// Guarda quanto dano e postura recebeu (o replay confere).
const WOOD = 0x7a5534, STRAW = 0xc9a85c, SACK = 0xb59a6e, ROPE = 0x8a7350
const FLASH_MAT = new THREE.MeshBasicMaterial({ color: 0xffffff })
let GEO = null
const geo = () => (GEO ||= merge([
  P(cyl(0.06, 0.07, 1.55, 7), WOOD, { p: [0, 0.78, 0], lit: 0.15, grad: [0.8, 1.05] }), // poste
  P(cyl(0.035, 0.035, 1.1, 6).rotateZ(Math.PI / 2), WOOD, { p: [0, 1.32, 0], lit: 0.15 }), // braços
  P(sph(0.24, 9, 7), STRAW, { p: [0, 1.08, 0], s: [1, 1.35, 0.85], lit: 0.12, tri: (c, x, y, z) => { if (Math.sin(x * 91 + y * 37 + z * 53) > 0.6) c.multiplyScalar(0.85) } }), // saco de palha
  P(cyl(0.25, 0.25, 0.04, 9), ROPE, { p: [0, 1.02, 0], s: [1, 1, 0.85] }), // amarração
  P(sph(0.15, 8, 6), SACK, { p: [0, 1.6, 0], s: [1, 1.1, 0.95], lit: 0.12 }), // cabeça
  box(0.1, 0.02, 0.02, 0x3a2a1a, [0, 1.62, 0.14]), // risco do "rosto"
  ...[-0.55, 0.55].map((x) => P(sph(0.06, 6, 4), STRAW, { p: [x, 1.32, 0] })), // palha na ponta dos braços
]))
const BASE = () => merge([box(0.5, 0.08, 0.5, WOOD, [0, 0.04, 0], { lit: 0.1 }), box(0.14, 0.18, 0.14, WOOD, [0, 0.12, 0])])

export function CreateDummy(scene, x, z, ry = 0) {
  const root = new THREE.Group()
  root.position.set(x, 0, z); root.rotation.y = ry
  const base = new THREE.Mesh(BASE(), MAT.solid)
  const tilt = new THREE.Group() // balanço: gira em volta do pé do poste
  const body = new THREE.Mesh(geo(), MAT.solid)
  tilt.add(body); root.add(base, tilt); scene.add(root)
  AddColliders([{ x, z, hw: 0.3, hd: 0.3 }])

  let wx = 0, wz = 0, vx = 0, vz = 0, flashT = 0
  const d = {
    id: `boneco-${x},${z}`, x, z, r: 0.35, root, dummy: true, hits: 0, dmg: 0, posture: 0,
    // golpe vindo da direção `dir` (ângulo de quem bate até o boneco): empurra o topo para longe
    hit({ dmg, posture, dir }) {
      d.hits++; d.dmg += dmg; d.posture += posture
      const k = 0.9 + dmg * 0.06
      vx += Math.cos(dir) * k; vz -= Math.sin(dir) * k
      if (flashT <= 0) body.material = FLASH_MAT
      flashT = 0.08
    },
    update(dt) {
      // mola amortecida: volta a ficar em pé
      vx += (-wx * 120 - vx * 7) * dt; vz += (-wz * 120 - vz * 7) * dt
      wx += vx * dt; wz += vz * dt
      tilt.rotation.set(wx, 0, wz)
      if (flashT > 0 && (flashT -= dt) <= 0) body.material = MAT.solid
    },
  }
  return d
}
