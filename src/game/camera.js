import * as THREE from 'three'

// Câmera de cima em 3/4, fixa (não gira): segue o jogador com suavidade. Números em balance.js · camera.
// Próximo PR (S1): antecipação para onde o jogador anda, tremor no impacto e, no S4, enquadrar o alvo travado.
export function CreateCamera(aspect, tune) {
  const cam = new THREE.PerspectiveCamera(tune.fov, aspect, 0.4, 120)
  const focus = new THREE.Vector3()
  let first = true

  function update(dt, p) {
    if (!p) return
    const y = p.gy || 0
    if (first) { focus.set(p.x, y, p.z); first = false }
    const k = 1 - Math.exp(-tune.follow * dt)
    focus.x += (p.x - focus.x) * k
    focus.y += (y - focus.y) * k
    focus.z += (p.z - focus.z) * k
    cam.position.set(focus.x, focus.y + tune.height, focus.z + tune.back)
    cam.lookAt(focus.x, focus.y + tune.lookY, focus.z)
  }

  return {
    cam,
    update,
    // inclinação da linha de visada (sobe tanto por metro em direção à câmera): o recorte das casas usa
    slope: (tune.height - tune.lookY) / tune.back,
    resize(aspect) { cam.aspect = aspect; cam.updateProjectionMatrix() },
  }
}
