// Barras no canto de cima (página, não 3D): fôlego em verde. A vida chega no S7.
// Fôlego maior (Alento, S12) = barra mais comprida, como nos souls. Cansado (zerou): a barra fica apagada até poder correr de novo.
export function CreateHud(tune) {
  const stamina = document.querySelector('#bars .stamina')
  const fill = stamina.firstElementChild
  let last = ''
  return {
    update(p) {
      if (!p) return
      const key = `${Math.round(p.stamina)}/${p.staminaMax}/${p.tired}`
      if (key === last) return // só mexe na página quando muda
      last = key
      stamina.style.width = `${p.staminaMax * tune.px}px`
      fill.style.width = `${(100 * Math.max(0, p.stamina)) / p.staminaMax}%`
      stamina.classList.toggle('tired', p.tired)
    },
  }
}
