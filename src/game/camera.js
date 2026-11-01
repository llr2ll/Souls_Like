import * as THREE from 'three'

// Câmera de cima em 3/4, fixa (não gira): segue o jogador com suavidade. Números em balance.js · camera.
// Antecipação: olha um pouco à frente de para onde o jogador anda (mais tela do lado para onde ele vai).
// Tremor: shake(força, tempo) desliza a câmera por um instante, sem girar (receita do survivor, engine/render/splitscreen.js).
// No S4: enquadrar o alvo travado.
export function CreateCamera(aspect, tune) {
  const cam = new THREE.PerspectiveCamera(tune.fov, aspect, 0.4, 120)
  const focus = new THREE.Vector3()
  const lead = { x: 0, z: 0 }
  const shakes = [] // tremores ativos: { power, time, t }
  let first = true

  function update(dt, p) {
    if (!p) return
    const y = p.gy || 0
    // antecipação proporcional à velocidade (parado = nenhuma), suavizada à parte: virar não dá tranco.
    // + v / follow: a suavidade deixa a câmera para trás (v / follow metros); sem compensar, comeria a antecipação
    const s = Math.hypot(p.vx, p.vz), want = s > 0.05 ? (Math.min(1, s / tune.leadSpeed) * tune.lead) / s + 1 / tune.follow : 0
    const kl = 1 - Math.exp(-tune.leadFollow * dt)
    lead.x += (p.vx * want - lead.x) * kl
    lead.z += (p.vz * want - lead.z) * kl
    const tx = p.x + lead.x, tz = p.z + lead.z
    if (first) { focus.set(tx, y, tz); first = false }
    const k = 1 - Math.exp(-tune.follow * dt)
    focus.x += (tx - focus.x) * k
    focus.y += (y - focus.y) * k
    focus.z += (tz - focus.z) * k
    cam.position.set(focus.x, focus.y + tune.height, focus.z + tune.back)
    cam.lookAt(focus.x, focus.y + tune.lookY, focus.z)

    // tremor: soma dos tremores ativos, mais fraco no fim; a câmera só desliza (já olhou para o jogador)
    let sh = 0
    for (let i = shakes.length - 1; i >= 0; i--) {
      const q = shakes[i]
      if ((q.t += dt) >= q.time) { shakes.splice(i, 1); continue }
      sh += q.power * (1 - q.t / q.time) ** 2
    }
    if (sh > 0) {
      sh = Math.min(sh, tune.shakeMax)
      cam.position.x += (Math.random() - 0.5) * 2 * sh
      cam.position.z += (Math.random() - 0.5) * 2 * sh
      cam.position.y += (Math.random() - 0.5) * sh
    }
  }

  return {
    cam,
    update,
    // power = deslocamento máximo (m); time = duração (s)
    shake(power, time) { if (power > 0 && time > 0) shakes.push({ power, time, t: 0 }) },
    // inclinação da linha de visada (sobe tanto por metro em direção à câmera): o recorte das casas usa
    slope: (tune.height - tune.lookY) / tune.back,
    resize(aspect) { cam.aspect = aspect; cam.updateProjectionMatrix() },
  }
}
