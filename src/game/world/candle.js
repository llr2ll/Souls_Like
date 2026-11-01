import * as THREE from 'three'
import { MAT, P, merge, cyl, sph } from '../../engine/render/style'

// Velas (só malhas: o replay também cria; nada de textura desenhada na página).
// Chama: um cone amarelo que tremula + um brilho somado à cena (aditivo) que pulsa.
const WAX = 0xefe6cf
const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd36b })
const glowMat = new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
const beamMat = new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
const flameGeo = new THREE.ConeGeometry(0.035, 0.12, 6).translate(0, 0.06, 0)
const glowGeo = new THREE.IcosahedronGeometry(0.35, 1)
// facho de luz fraco subindo da vela da morte: dá para achar de longe (some para o alto)
const beamGeo = new THREE.CylinderGeometry(0.12, 0.3, 7, 10, 1, true).translate(0, 3.5, 0)

// chama acesa em (x, y, z) dentro de `parent`; devolve { group, update(t) }
function Flame(parent, x, y, z, size = 1) {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  const f = new THREE.Mesh(flameGeo, flameMat), glow = new THREE.Mesh(glowGeo, glowMat)
  glow.position.y = 0.06
  glow.scale.setScalar(size)
  g.add(f, glow)
  parent.add(g)
  const ph = x * 3.1 + z * 1.7
  return {
    group: g,
    update(t) {
      f.scale.set(1, 0.85 + 0.25 * Math.sin(t * 13 + ph) * Math.sin(t * 7.3 + ph), 1)
      glow.scale.setScalar(size * (0.9 + 0.12 * Math.sin(t * 5 + ph)))
    },
  }
}

let VOTIVE = null
// três velinhas no pé do cruceiro: apagadas até o primeiro descanso
export function CreateCruceiroCandles(scene, x, z) {
  const root = new THREE.Group()
  root.position.set(x, 0, z + 1.0)
  root.add(new THREE.Mesh(VOTIVE ||= merge([
    ...[[-0.18, 0.12], [0.02, 0.18], [0.2, 0.1]].map(([cx, h]) => P(cyl(0.04, 0.045, h, 7), WAX, { p: [cx, h / 2 + 0.25, 0], lit: 0.2 })),
  ]), MAT.solid))
  scene.add(root)
  const flames = [[-0.18, 0.12], [0.02, 0.18], [0.2, 0.1]].map(([cx, h]) => Flame(root, cx, h + 0.25, 0, 0.7))
  let t = 0
  const set = (on) => { for (const f of flames) f.group.visible = on }
  set(false)
  return { set, update(dt) { t += dt; for (const f of flames) f.update(t) } }
}

let DEATH = null
// a vela da morte: cera que ficou no chão, acesa, com facho de luz
export function CreateDeathCandle(scene, x, z, y = 0) {
  const root = new THREE.Group()
  root.position.set(x, y, z)
  root.add(new THREE.Mesh(DEATH ||= merge([
    P(cyl(0.22, 0.26, 0.03, 12), WAX, { p: [0, 0.015, 0], lit: 0.15 }), // poça de cera
    P(cyl(0.07, 0.08, 0.32, 9), WAX, { p: [0, 0.17, 0], lit: 0.2 }),
    P(sph(0.05, 6, 4), WAX, { p: [0.06, 0.05, 0.05], s: [1, 0.6, 1] }), // pingo
  ]), MAT.solid))
  const flame = Flame(root, 0, 0.33, 0, 1.4)
  const beam = new THREE.Mesh(beamGeo, beamMat)
  beam.renderOrder = 3
  root.add(beam)
  scene.add(root)
  let t = 0
  return {
    update(dt) { t += dt; flame.update(t); beamMat.opacity = 0.08 + 0.035 * Math.sin(t * 2) },
    remove() { scene.remove(root) },
  }
}
