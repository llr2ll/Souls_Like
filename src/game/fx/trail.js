import * as THREE from 'three'

// Rastro da lâmina (DESIGN 8, item 3): uma fita clara entre a ponta da espada e o meio do caminho até o peito,
// só enquanto a lâmina machuca. Mostra o arco exato do dano (justiça) e some em `fade` segundos.
const MAX = 32 // amostras guardadas (uma por quadro)

export function CreateTrail(scene, fade) {
  const pos = new Float32Array(MAX * 2 * 3), col = new Float32Array(MAX * 2 * 4)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 4))
  const idx = []
  for (let i = 0; i < MAX - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
  geo.setIndex(idx)
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.frustumCulled = false
  mesh.renderOrder = 2
  scene.add(mesh)
  const samples = [] // { tip, inner, age }

  return {
    // uma amostra por quadro enquanto a lâmina corta
    add(tip, inner) {
      samples.unshift({ tip: tip.clone(), inner: inner.clone(), age: 0 })
      if (samples.length > MAX) samples.pop()
    },
    update(dt) {
      for (const s of samples) s.age += dt
      while (samples.length && samples[samples.length - 1].age > fade) samples.pop()
      const n = samples.length
      mesh.visible = n > 1
      if (!mesh.visible) return
      for (let i = 0; i < MAX; i++) {
        const s = samples[Math.min(i, n - 1)]
        const a = i < n ? Math.max(0, 1 - s.age / fade) * (1 - i / MAX) : 0
        s.tip.toArray(pos, i * 6); s.inner.toArray(pos, i * 6 + 3)
        col.set([1, 0.97, 0.88, a * 0.85, 1, 0.97, 0.88, 0], i * 8) // ponta forte, perto do corpo transparente
      }
      geo.attributes.position.needsUpdate = true
      geo.attributes.color.needsUpdate = true
    },
  }
}
