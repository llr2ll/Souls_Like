import * as THREE from 'three'
import { MAT, P, merge, cone, cyl } from '../../engine/render/style'
import { CreateZombieModel, VARIANTS } from '../../shared/creatures/zombie-model'
import { CreateEnemy } from './enemy'
import { BALANCE } from '../config/balance'

// Trasno (DESIGN 5): diabinho do folclore, de gorro vermelho. Anda em grupo. Agacha dando uma risadinha (aviso) e salta ~5 m.
// Pegou você: rouba 10% da cera e foge. Errou: fica preso no chão um instante (a janela). Matar o ladrão devolve a cera.
// Corpo: o humanoide do survivor em escala 0,55, com gorro.
let CAP = null
const cap = () => (CAP ||= merge([
  P(cone(0.16, 0.42, 8), 0xc0302a, { p: [0, 0.48, -0.03], r: [-0.35, 0, 0], lit: 0.15 }),
  P(cyl(0.2, 0.2, 0.05, 10), 0x9a2420, { p: [0, 0.3, 0] }),
  P(new THREE.SphereGeometry(0.05, 6, 4), 0xf2efe6, { p: [0, 0.62, -0.18] }), // pompom
]))
const ease = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t) }
const mix = (a, b, t) => ({ armL: [a.armL[0] + (b.armL[0] - a.armL[0]) * t, a.armL[1] + (b.armL[1] - a.armL[1]) * t], armR: [a.armR[0] + (b.armR[0] - a.armR[0]) * t, a.armR[1] + (b.armR[1] - a.armR[1]) * t], spineX: a.spineX + (b.spineX - a.spineX) * t, spineY: 0 })
const REST = { armL: [0.05, 0.1], armR: [0.05, -0.1], spineX: 0.25 }
const CROUCH = { armL: [0.9, 0.4], armR: [0.9, -0.4], spineX: 0.75 } // agachado, braços para trás
const LEAP = { armL: [-1.7, 0.3], armR: [-1.7, -0.3], spineX: 0.2 } // voando, braços à frente
const STUCK = { armL: [-0.4, 0.5], armR: [-0.4, -0.5], spineX: 0.9 } // caído de cara no chão

const SPEC = {
  kind: 'trasno',
  tune: BALANCE.trasno,
  build() {
    const m = CreateZombieModel(Math.floor(Math.random() * VARIANTS))
    m.root.scale.setScalar(BALANCE.trasno.scale)
    m.head.add(new THREE.Mesh(cap(), MAT.solid))
    return m
  },
  choose: () => 'leap',
  glow() {},
  pose(e, A) {
    if (A.phase === 'warn') return mix(REST, CROUCH, ease(A.t / 0.2))
    if (A.phase === 'strike') return mix(CROUCH, LEAP, ease(A.t / 0.12))
    return mix(LEAP, STUCK, ease(A.t / 0.15))
  },
}

export const CreateTrasno = (scene, x, z, ry, ctx, opts) => CreateEnemy(scene, SPEC, x, z, ry, ctx, opts)
