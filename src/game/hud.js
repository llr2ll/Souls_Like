import * as THREE from 'three'

// Barras (página, não 3D). No canto de cima: vida (vermelha) e fôlego (verde). Barra maior = mais vida/fôlego, como nos souls.
// Vida: o pedaço perdido fica claro por um instante e some devagar (dá para ver quanto o golpe tirou).
// Fôlego cansado (zerou): a barra fica apagada até poder correr de novo.
// Cera no canto de baixo à direita; o que dá para fazer com E/A (descansar, pegar a cera) no meio de baixo.
// Sobre o alvo travado (DESIGN 8, item 11): barra de vida dele e, embaixo, a de postura (dourada, enche do meio para as pontas;
// cheia = de joelhos). "Postura enchendo = falta pouco".
// Chefe (DESIGN 8, item 12): barra grande embaixo, com o nome, a vida (com o pedaço perdido) e a postura. boss(e) mostra; boss(null) tira.
const _v = new THREE.Vector3()

export function CreateHud(tune) {
  const $ = (s) => document.querySelector(s)
  const hp = $('#bars .hp'), hpFill = hp.querySelector('.fill'), hpLag = hp.querySelector('.lag')
  const st = $('#bars .stamina'), stFill = st.firstElementChild
  const tb = $('#target-bar'), tbFill = tb.querySelector('.fill'), tbPost = tb.querySelector('.posture')
  const gourd = $('#items .gourd'), bread = $('#items .bread'), danger = $('#danger')
  const cera = $('#cera'), ceraN = cera.querySelector('b'), prompt = $('#prompt')
  const bb = $('#boss'), bbName = bb.querySelector('.name'), bbFill = bb.querySelector('.fill'), bbLag = bb.querySelector('.lag'), bbPost = bb.querySelector('.posture')
  let last = '', lag = 1, lagWait = 0, lastItems = '', shown = null, lastPrompt = ''
  let boss = null, bLag = 1, bWait = 0
  // barra do chefe: o pedaço perdido espera 0,6 s e desce (como a do jogador); trocou de fase: enche de novo
  function bossBar(dt) {
    if (!boss) return
    const h = Math.max(0, boss.hp) / boss.maxHp
    if (h < bLag) { if ((bWait -= dt) <= 0) bLag = Math.max(h, bLag - dt * 0.6) } else { bLag = h; bWait = 0.6 }
    if (bbName.textContent !== boss.name) bbName.textContent = boss.name
    bbFill.style.width = `${h * 100}%`
    bbLag.style.width = `${bLag * 100}%`
    bbPost.style.width = `${(100 * Math.min(boss.posture || 0, boss.maxPosture)) / boss.maxPosture}%`
    bbPost.classList.toggle('broken', boss.state === 'broken')
  }
  // cera: o número conta até o valor (ganhou: sobe rolando; perdeu: cai na hora)
  function counter(dt, p) {
    if (shown === null || p.cera < shown) shown = p.cera
    else if (shown < p.cera) shown = Math.min(p.cera, shown + Math.max(1, (p.cera - shown) * 6 * dt))
    const n = String(Math.floor(shown))
    if (ceraN.textContent !== n) { ceraN.textContent = n; if (shown === p.cera && n !== '0') { cera.classList.remove('up'); void cera.offsetWidth; cera.classList.add('up') } }
  }
  // placar dos itens (canto de baixo): cabaça com os goles, pão com a quantidade; pisca ao usar
  function items(p) {
    const key = `${p.gourd}/${p.bread}`
    if (key === lastItems) return
    const [g0, b0] = (lastItems || key).split('/').map(Number) // primeira vez: sem animação
    lastItems = key
    gourd.querySelector('b').textContent = p.gourd
    bread.querySelector('b').textContent = p.bread
    gourd.classList.toggle('empty', p.gourd <= 0)
    bread.classList.toggle('empty', p.bread <= 0)
    for (const [el, was, now] of [[gourd, g0, p.gourd], [bread, b0, p.bread]]) {
      if (now !== was) { el.classList.remove('used'); void el.offsetWidth; el.classList.add('used') } // reinicia a animação
    }
  }

  return {
    update(dt, p, cam) {
      if (!p) return
      const h = Math.max(0, p.hp) / p.max
      // o pedaço perdido espera 0,6 s e então desce até a vida atual
      if (h < lag) { if ((lagWait -= dt) <= 0) lag = Math.max(h, lag - dt * 0.8) } else { lag = h; lagWait = 0.6 }
      const key = `${Math.round(p.stamina)}/${p.staminaMax}/${p.tired}/${p.hp}/${p.max}/${lag.toFixed(3)}`
      if (key !== last) {
        last = key
        hp.style.width = `${p.max * tune.px}px`
        hpFill.style.width = `${h * 100}%`
        hpLag.style.width = `${lag * 100}%`
        st.style.width = `${p.staminaMax * tune.px}px`
        stFill.style.width = `${(100 * Math.max(0, p.stamina)) / p.staminaMax}%`
        st.classList.toggle('tired', p.tired)
        danger.classList.toggle('on', !p.dead && h < tune.danger) // pouca vida: borda vermelha pulsando
      }
      items(p)
      counter(dt, p)
      bossBar(dt)
      // barra sobre o alvo travado (só quem tem vida: o boneco não tem)
      const e = p.lock
      if (!e || !e.maxHp || e.dead || e.boss) { tb.style.display = 'none'; return } // o chefe tem a barra grande
      _v.set(e.x, (e.y || 0) + 2.15, e.z).project(cam)
      tb.style.display = 'block'
      tb.style.left = `${((_v.x + 1) / 2) * innerWidth}px`
      tb.style.top = `${((1 - _v.y) / 2) * innerHeight}px`
      tbFill.style.width = `${(100 * e.hp) / e.maxHp}%`
      tbPost.style.width = `${(100 * Math.min(e.posture || 0, e.maxPosture || 1)) / (e.maxPosture || 1)}%`
      tbPost.classList.toggle('broken', e.state === 'broken')
    },
    // o que dá para fazer aqui (E/A): it = progress.interactable(p); key = 'E' ou 'A'
    prompt(it, key) {
      const text = !it ? ''
        : it.kind === 'candle' ? `${key} · Pegar a cera (${it.cera})`
        : it.kind === 'lever' ? `${key} · ${it.s.label || 'Puxar a alavanca'}`
        : it.kind === 'locked' ? `${key} · Abrir`
        : it.kind === 'fog' ? `${key} · Atravessar a névoa`
        : it.kind === 'item' ? `${key} · ${it.it.kind === 'note' ? `Ler: ${it.it.title}` : `Pegar: ${it.it.kind === 'bread' ? 'pão de milho' : it.it.title}`}`
        : `${key} · Descansar no ${it.c.name}`
      if (text === lastPrompt) return
      lastPrompt = text
      prompt.textContent = text
      prompt.style.display = text ? 'block' : 'none'
    },
    // pedaço perdido volta a ficar cheio (renasceu)
    reset() { lag = 1 },
    boss(e) { boss = e; bLag = 1; bb.classList.toggle('on', !!e) },
  }
}
