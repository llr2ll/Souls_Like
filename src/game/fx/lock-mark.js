import * as THREE from 'three'

// Marca do alvo travado: um círculo claro com ponto no meio, sobre o peito do alvo, sempre de frente para a câmera
// e visível através das coisas. Pulsa de leve. Só no navegador (desenha numa tela de página).
export function CreateLockMark(scene) {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  g.strokeStyle = '#fff6dc'; g.fillStyle = '#fff6dc'; g.lineWidth = 5
  g.shadowColor = '#000'; g.shadowBlur = 6
  g.beginPath(); g.arc(32, 32, 22, 0, Math.PI * 2); g.stroke()
  g.beginPath(); g.arc(32, 32, 6, 0, Math.PI * 2); g.fill()
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true }))
  sprite.renderOrder = 10
  sprite.visible = false
  scene.add(sprite)
  let t = 0
  return {
    update(dt, target) {
      sprite.visible = !!target
      if (!target) return
      t += dt
      sprite.position.set(target.x, (target.y || 0) + 1.2, target.z)
      sprite.scale.setScalar(0.42 + Math.sin(t * 5) * 0.03)
    },
  }
}
