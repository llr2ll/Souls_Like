import * as THREE from 'three'
import { MAT, P, merge, cyl, sph } from '../../engine/render/style'
import { CreateZombieModel, VARIANTS } from '../../shared/creatures/zombie-model'
import { CreateEnemy } from './enemy'
import { BALANCE } from '../config/balance'

// Romeiro perdido (DESIGN 5): peregrino morto que segue andando. Bordão na mão direita, foice na esquerda.
// Pancada: ergue o bordão acima da cabeça (aviso + gemido) e desce. Dois cortes: recolhe a foice para trás e corta duas vezes
// (ida e volta). Corpo: o humanoide do survivor (12 variações) com poses de golpe exageradas.
const WOOD = 0x6b4a2b, IRON = 0x9aa0a8, GOURD = 0xc9a14a
let STAFF = null, SICKLE = null
// eixo do braço = -Y; a mão fica na origem
const staff = () => (STAFF ||= merge([
  P(cyl(0.024, 0.028, 1.55, 6), WOOD, { p: [0, -0.4, 0], lit: 0.15, grad: [0.85, 1.05] }),
  P(sph(0.07, 7, 5), GOURD, { p: [0.05, 0.22, 0], s: [1, 1.3, 1], lit: 0.1 }), // cabaça amarrada
]))
const sickle = () => (SICKLE ||= merge([
  P(cyl(0.02, 0.022, 0.34, 6), WOOD, { p: [0, -0.1, 0] }),
  P(new THREE.TorusGeometry(0.17, 0.016, 4, 12, Math.PI * 1.15).rotateY(Math.PI / 2), IRON, { p: [0, -0.27, 0.17], lit: 0.3 }),
]))

const lerpPose = (a, b, t) => {
  const o = {}
  for (const k of ['armL', 'armR']) { const x = a[k] || b[k], y = b[k] || a[k]; if (x) o[k] = [x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t] }
  for (const k of ['spineX', 'spineY']) o[k] = (a[k] ?? 0) + ((b[k] ?? 0) - (a[k] ?? 0)) * t
  return o
}
const ease = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t) }
// poses (ângulos do ombro em radianos: x negativo = braço para a frente/para cima; z = para fora)
const REST = { armR: [0.05, -0.08], armL: [0.05, 0.08], spineX: 0.2, spineY: 0 }
const POSES = {
  smash: {
    warn: { armR: [-3.1, -0.12], armL: [-3.0, 0.12], spineX: -0.2, spineY: 0 }, // bordão acima da cabeça, corpo para trás
    strike: { armR: [-1.0, -0.05], armL: [-1.05, 0.05], spineX: 0.6, spineY: 0 }, // desce com tudo
    recover: { armR: [-0.8, -0.05], armL: [-0.85, 0.05], spineX: 0.65, spineY: 0 }, // bordão no chão: a janela
  },
  cuts: {
    warn: { armL: [0.75, 0.6], armR: [0.1, -0.2], spineX: 0.1, spineY: 0.7 }, // foice para trás, tronco torcido
    strike: [{ armL: [-1.45, -0.7], spineX: 0.25, spineY: -0.6 }, { armL: [-1.3, 0.8], spineX: 0.25, spineY: 0.55 }], // ida e volta
    recover: { armL: [-1.1, 0.7], armR: [0.1, -0.2], spineX: 0.3, spineY: 0.5 },
  },
}

const SPEC = {
  kind: 'romeiro',
  tune: BALANCE.romeiro,
  build() {
    const m = CreateZombieModel(Math.floor(Math.random() * VARIANTS))
    const s = new THREE.Mesh(staff(), MAT.solid); s.rotation.x = -0.35; m.hands.R.add(s)
    const k = new THREE.Mesh(sickle(), MAT.solid); m.hands.L.add(k)
    return m
  },
  // longe (fora do alcance dos cortes), a pancada; perto, sorteia
  choose(e, d) {
    if (d > BALANCE.romeiro.attacks.cuts.range + 0.1) return 'smash'
    return Math.random() < 0.5 ? 'smash' : 'cuts'
  },
  pose(e, A) {
    const P = POSES[A.name], d = A.def
    if (A.phase === 'warn') return lerpPose(REST, P.warn, ease(A.t / Math.min(d.warn, 0.25)))
    if (A.phase === 'strike') {
      const to = Array.isArray(P.strike) ? P.strike[A.i] : P.strike
      const from = A.i === 0 ? P.warn : Array.isArray(P.strike) ? P.strike[A.i - 1] : P.strike
      return lerpPose(from, to, ease(A.t / (d.hits[A.i] * 0.7)))
    }
    if (A.phase === 'gap') return Array.isArray(P.strike) ? P.strike[A.i - 1] : P.strike
    const last = Array.isArray(P.strike) ? P.strike[P.strike.length - 1] : P.strike
    return lerpPose(last, P.recover, ease(A.t / 0.2))
  },
}

export const CreateRomeiro = (scene, x, z, ry, ctx) => CreateEnemy(scene, SPEC, x, z, ry, ctx)
