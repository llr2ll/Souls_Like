import * as THREE from 'three'

// Câmera de cima em 3/4, fixa (não gira): segue o jogador com suavidade. Números em balance.js · camera.
// Antecipação: olha um pouco à frente de para onde o jogador anda (mais tela do lado para onde ele vai).
// Tremor: shake(força, tempo) desliza a câmera por um instante, sem girar (receita do survivor, engine/render/splitscreen.js).
// Alvo travado: olha entre o jogador e o alvo e se afasta (até tune.lockMax) para caber os dois, com folga.
export function CreateCamera(aspect, tune) {
  const cam = new THREE.PerspectiveCamera(tune.fov, aspect, 0.4, 120)
  const focus = new THREE.Vector3()
  const lead = { x: 0, z: 0 }
  const shakes = [] // tremores ativos: { power, time, t }
  const base = Math.hypot(tune.height - tune.lookY, tune.back) // distância normal (~13 m)
  const sinPitch = (tune.height - tune.lookY) / base
  let first = true, zoom = 1, punch = 0, punchT = 0, punchTime = 1

  // quanto afastar para os pontos caberem na tela em volta do foco (fx, fz)
  function fit(fx, fz, pts) {
    const t = Math.tan(THREE.MathUtils.degToRad(tune.fov / 2))
    let need = 0
    for (const q of pts) {
      need = Math.max(need, (Math.abs(q.x - fx) + tune.lockMargin) / (t * cam.aspect)) // largura
      need = Math.max(need, ((Math.abs(q.z - fz) + tune.lockMargin) * sinPitch) / t) // profundidade (o chão está inclinado)
    }
    return Math.min(tune.lockMax, Math.max(base, need)) / base
  }

  function update(dt, p, target) {
    if (!p) return
    const y = p.gy || 0
    // antecipação proporcional à velocidade (parado = nenhuma), suavizada à parte: virar não dá tranco.
    // + v / follow: a suavidade deixa a câmera para trás (v / follow metros); sem compensar, comeria a antecipação
    // Travado: sem antecipação (quem enquadra é o alvo)
    const s = Math.hypot(p.vx, p.vz), want = !target && s > 0.05 ? (Math.min(1, s / tune.leadSpeed) * tune.lead) / s + 1 / tune.follow : 0
    const kl = 1 - Math.exp(-tune.leadFollow * dt)
    lead.x += (p.vx * want - lead.x) * kl
    lead.z += (p.vz * want - lead.z) * kl
    let tx = p.x + lead.x, tz = p.z + lead.z, wantZoom = 1
    if (target) {
      tx += (target.x - p.x) * tune.lockBias; tz += (target.z - p.z) * tune.lockBias
      wantZoom = fit(tx, tz, [p, target])
    }
    if (first) { focus.set(tx, y, tz); first = false }
    const k = 1 - Math.exp(-tune.follow * dt)
    focus.x += (tx - focus.x) * k
    focus.y += (y - focus.y) * k
    focus.z += (tz - focus.z) * k
    zoom += (wantZoom - zoom) * (1 - Math.exp(-tune.zoomFollow * dt))
    // aproximação rápida (golpe crítico): chega `punch` mais perto e volta em `punchTime`
    punchT = Math.max(0, punchT - dt)
    const z = zoom * (1 - punch * (punchT / punchTime) ** 2)
    cam.position.set(focus.x, focus.y + tune.lookY + (tune.height - tune.lookY) * z, focus.z + tune.back * z)
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
    // aproxima amount (0,05 = 5%) e volta em time s
    punch(amount, time) { punch = amount; punchT = punchTime = time },
    // inclinação da linha de visada (sobe tanto por metro em direção à câmera): o recorte das casas usa
    slope: (tune.height - tune.lookY) / tune.back,
    resize(aspect) { cam.aspect = aspect; cam.updateProjectionMatrix() },
  }
}
