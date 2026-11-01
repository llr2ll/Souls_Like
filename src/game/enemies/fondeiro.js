import * as THREE from 'three'
import { MAT, P, merge, cyl, sph } from '../../engine/render/style'
import { CreateZombieModel, VARIANTS } from '../../shared/creatures/zombie-model'
import { CreateEnemy } from './enemy'
import { BALANCE } from '../config/balance'

// Fondeiro (DESIGN 5): atirador de funda. Gira a funda com um zunido que sobe (aviso de 0,7 s) e atira uma pedra
// (dá para bloquear com o escudo ou rolar). De perto: chute e foge (janela de 1,2 s depois do chute).
// Corpo: o humanoide do survivor; a funda gira na mão direita.
const ROPE = 0x8a7350, STONE = 0x9a9ca6
let SLING = null
const sling = () => (SLING ||= merge([
  P(cyl(0.012, 0.012, 0.55, 4), ROPE, { p: [0, -0.28, 0] }),
  P(sph(0.06, 6, 4), STONE, { p: [0, -0.57, 0], lit: 0.2 }),
]))
const ease = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t) }
const lerp = (a, b, t) => {
  const o = {}
  for (const k of ['armL', 'armR']) o[k] = [a[k][0] + (b[k][0] - a[k][0]) * t, a[k][1] + (b[k][1] - a[k][1]) * t]
  o.spineX = a.spineX + (b.spineX - a.spineX) * t; o.spineY = a.spineY + (b.spineY - a.spineY) * t
  return o
}
const REST = { armL: [0.05, 0.1], armR: [0.05, -0.1], spineX: 0.2, spineY: 0 }
const SPIN = { armL: [-0.6, 0.3], armR: [-2.7, -0.5], spineX: 0.05, spineY: -0.35 } // braço erguido girando a funda
const THROW = { armL: [0.3, 0.2], armR: [-1.3, 0.1], spineX: 0.3, spineY: 0.35 } // atira
const KICK_W = { armL: [-0.8, 0.5], armR: [-0.8, -0.5], spineX: -0.35, spineY: 0 } // recua para chutar
const KICK = { armL: [0.4, 0.6], armR: [0.4, -0.6], spineX: 0.25, spineY: 0 }

const SPEC = {
  kind: 'fondeiro',
  tune: BALANCE.fondeiro,
  build() {
    const m = CreateZombieModel(Math.floor(Math.random() * VARIANTS))
    const s = new THREE.Group()
    s.add(new THREE.Mesh(sling(), MAT.solid))
    m.hands.R.add(s)
    m.sling = s
    return m
  },
  // de perto chuta; de longe, a funda
  choose: (e, d) => (d < BALANCE.fondeiro.kickRange ? 'kick' : 'sling'),
  glow() {},
  pose(e, A) {
    if (A.name === 'kick') return A.phase === 'warn' ? lerp(REST, KICK_W, ease(A.t / 0.2)) : lerp(KICK_W, KICK, ease(A.t / 0.1))
    if (A.phase === 'warn') return lerp(REST, SPIN, ease(A.t / 0.2))
    return lerp(SPIN, THROW, ease(A.t / 0.08))
  },
  // a funda gira cada vez mais rápido no aviso (o zunido sobe junto)
  tick(e, dt) {
    const A = e.atk
    const spinning = A && A.name === 'sling' && A.phase === 'warn'
    e.spin = spinning ? (e.spin || 0) + dt * (8 + 30 * Math.min(1, A.t / A.def.warn)) : 0
    e.model.sling.rotation.x = spinning ? e.spin : 0
    e.model.sling.children[0].visible = !(A && A.name === 'sling' && A.phase !== 'warn') // a pedra saiu
  },
}

export const CreateFondeiro = (scene, x, z, ry, ctx, opts) => CreateEnemy(scene, SPEC, x, z, ry, ctx, opts)
