import * as THREE from 'three'
import { MAT, P, merge, box, cone, sph } from '../../engine/render/style'
import { CreateZombieModel } from '../../shared/creatures/zombie-model'
import { CreateEnemy } from './enemy'
import { BALANCE } from '../config/balance'

// Lobishome (DESIGN 5, elite do souto): homem-lobo. Não renasce. Vencido: 400 de cera (e a maça de canteiro no S12).
// Zarpaço duplo: puxa os braços para trás (rosnado) e dá 2 garradas. Salto: agacha (uivo curto) e salta ~7 m (forte: derruba).
// Uivo: para e uiva 1 s, chama 2 trasnos (uma vez por luta) — a melhor hora para bater. Aparar o zarpaço quebra metade da postura.
// Corpo: o humanoide do survivor maior, pelagem escura de uma cor só e cabeça de lobo.
const FUR = new THREE.MeshLambertMaterial({ color: 0x4d3d30, flatShading: true })
const GLOW = new THREE.MeshBasicMaterial({ color: 0xffd36b }) // de joelhos: os olhos/garras brilham
let HEAD = null, CLAW = null
const head = () => (HEAD ||= merge([
  P(sph(0.2, 8, 6), 0x4d3d30, { p: [0, 0.18, 0], s: [1, 0.95, 1.1] }),
  box(0.16, 0.13, 0.28, 0x3e3127, [0, 0.12, 0.24]), // focinho
  box(0.07, 0.05, 0.05, 0x15110e, [0, 0.16, 0.39]), // nariz
  P(cone(0.07, 0.2, 4), 0x3e3127, { p: [0.11, 0.38, -0.02] }), P(cone(0.07, 0.2, 4), 0x3e3127, { p: [-0.11, 0.38, -0.02] }), // orelhas
]))
const claw = () => (CLAW ||= merge([-0.04, 0, 0.04].map((x) => P(cone(0.018, 0.12, 4), 0xe8e0c8, { p: [x, -0.08, 0.04], r: [Math.PI * 0.85, 0, 0] }))))
const ease = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t) }
const lerp = (a, b, t) => {
  const o = {}
  for (const k of ['armL', 'armR']) o[k] = [a[k][0] + (b[k][0] - a[k][0]) * t, a[k][1] + (b[k][1] - a[k][1]) * t]
  o.spineX = a.spineX + (b.spineX - a.spineX) * t; o.spineY = a.spineY + (b.spineY - a.spineY) * t
  return o
}
const REST = { armL: [-0.3, 0.3], armR: [-0.3, -0.3], spineX: 0.45, spineY: 0 } // curvado, garras à frente
const P_BACK = { armL: [1.0, 0.7], armR: [1.0, -0.7], spineX: 0.2, spineY: 0 } // braços para trás (aviso do zarpaço)
const P_RIGHT = { armL: [0.6, 0.6], armR: [-1.5, 0.5], spineX: 0.55, spineY: 0.5 } // garrada da direita, cruzando
const P_LEFT = { armL: [-1.5, -0.5], armR: [0.6, -0.6], spineX: 0.55, spineY: -0.5 } // garrada da esquerda
const CROUCH = { armL: [0.7, 0.3], armR: [0.7, -0.3], spineX: 0.9, spineY: 0 } // agachado para o salto
const LEAP = { armL: [-2.0, 0.4], armR: [-2.0, -0.4], spineX: 0.3, spineY: 0 }
const HOWL = { armL: [0.4, 0.9], armR: [0.4, -0.9], spineX: -0.45, spineY: 0 } // cabeça para cima, braços abertos

const SPEC = {
  kind: 'lobishome',
  tune: BALANCE.lobishome,
  build() {
    const m = CreateZombieModel(3)
    m.root.scale.setScalar(BALANCE.lobishome.scale)
    m.skin(FUR)
    m.head.children[0].visible = false // a cabeça de gente some; entra a de lobo
    const h = new THREE.Mesh(head(), FUR)
    m.head.add(h)
    const eyes = new THREE.Mesh(merge([P(sph(0.025, 5, 4), 0xff5a2a, { p: [0.07, 0.24, 0.17] }), P(sph(0.025, 5, 4), 0xff5a2a, { p: [-0.07, 0.24, 0.17] })]), MAT.glow)
    m.head.add(eyes)
    const claws = [m.hands.L, m.hands.R].map((hand) => { const c = new THREE.Mesh(claw(), MAT.solid); hand.add(c); return c })
    m.claws = claws
    return m
  },
  // uiva uma vez quando já perdeu um quarto da vida; meia distância: salta; perto: zarpaço
  choose(e, d) {
    const T = BALANCE.lobishome
    if (!e.summoned && e.hp < e.maxHp * T.howlAt) return 'howl'
    return d > T.clawRange ? 'pounce' : 'claws'
  },
  glow(m, on) { for (const c of m.claws) c.material = on ? GLOW : MAT.solid },
  pose(e, A) {
    if (A.name === 'howl') return lerp(REST, HOWL, ease(A.t / 0.3))
    if (A.name === 'pounce') {
      if (A.phase === 'warn') return lerp(REST, CROUCH, ease(A.t / 0.25))
      if (A.phase === 'strike') return lerp(CROUCH, LEAP, ease(A.t / 0.15))
      return lerp(LEAP, CROUCH, ease(A.t / 0.2))
    }
    if (A.phase === 'warn') return lerp(REST, P_BACK, ease(A.t / 0.2))
    if (A.phase === 'strike') return lerp(A.i === 0 ? P_BACK : P_RIGHT, A.i === 0 ? P_RIGHT : P_LEFT, ease(A.t / 0.09))
    if (A.phase === 'gap') return P_RIGHT
    return lerp(P_LEFT, REST, ease(A.t / 0.5))
  },
}

export const CreateLobishome = (scene, x, z, ry, ctx, opts) => CreateEnemy(scene, SPEC, x, z, ry, ctx, opts)
