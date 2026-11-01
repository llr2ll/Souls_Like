// Controle de videogame (API Gamepad do navegador, mapeamento "standard": Xbox e PlayStation têm os mesmos números).
// O navegador só mostra o controle depois que alguém aperta um botão nele.
// Não há aviso por quadro: o jogo chama poll() uma vez por quadro, ANTES de atualizar o jogo.
// Manda o mesmo contrato do teclado (engine/input/contract.js): setInput(id, { mx, mz, ax, az, run }) e act(id, ação).
// map = { dead, hold: { botão: campo do setInput }, press: { botão: ação } } — quem escolhe os botões é o jogo.
// Em press, 'R-left' / 'R-right' = puxar o stick direito para o lado (vale como um aperto).

// nome do botão → posição no controle (mapeamento standard)
export const PAD = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, MENU: 9, L3: 10, R3: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 }
const FLICK = { 'R-left': -1, 'R-right': 1 }

// stick com zona morta redonda; o resto é reescalado (inclinar pouco = andar devagar, sem salto na borda da zona)
export function Stick(x, y, dead) {
  const m = Math.hypot(x, y)
  if (m <= dead) return [0, 0]
  const k = Math.min(1, (m - dead) / (1 - dead)) / m
  return [x * k, y * k]
}

// gatilhos são analógicos: meio curso = apertado. Stick puxado: 70% liga, só desliga abaixo de 35% (não repete tremendo)
const down = (pad, name, prev) => FLICK[name]
  ? (pad.axes[2] || 0) * FLICK[name] > (prev && prev.has(name) ? 0.35 : 0.7)
  : (pad.buttons[PAD[name]]?.value || 0) > 0.5

// leitura pura (o replay usa sem navegador): mensagem do setInput, botões apertados e se o controle está em uso.
// prev = botões apertados no quadro anterior (para o stick puxado)
export function ReadPad(pad, map, prev) {
  const [mx, mz] = Stick(pad.axes[0] || 0, pad.axes[1] || 0, map.dead)
  const msg = { mx, mz, ax: 0, az: 0, run: 0 }
  let busy = mx !== 0 || mz !== 0
  for (const name in map.hold) if (down(pad, name)) { msg[map.hold[name]] = 1; busy = true }
  const pressed = Object.keys(map.press).filter((name) => down(pad, name, prev))
  return { msg, pressed, busy }
}

// liga o controle a um jogador. onPad(nome | null): conectou / desconectou (para avisar na tela)
export function BindGamepad(game, map, onPad = () => {}, id = 'local') {
  let pad = null, held = new Set(), idle = true

  function find() {
    const list = [...(navigator.getGamepads?.() || [])].filter((p) => p && p.connected)
    return list.find((p) => p.mapping === 'standard') || list[0] || null
  }
  function poll() {
    const now = find()
    if ((now && now.id) !== (pad && pad.id)) onPad(now ? now.id.replace(/\s*\(.*$/, '') || 'controle' : null)
    pad = now
    if (!game.players.has(id)) return
    if (!pad) { if (!idle) game.setInput(id, { mx: 0, mz: 0, ax: 0, az: 0, run: 0 }); idle = true; held.clear(); return }
    const r = ReadPad(pad, map, held)
    // parado não manda nada (o teclado continua valendo); ao soltar, manda um "parado" só uma vez
    if (r.busy || !idle) game.setInput(id, r.msg)
    idle = !r.busy
    for (const name of r.pressed) if (!held.has(name)) game.act(id, map.press[name])
    held = new Set(r.pressed)
  }
  // vibração (0 a 1 em cada motor; ms = duração). Navegador sem vibração: não faz nada
  function rumble(strong, weak, ms) {
    const v = pad && pad.vibrationActuator
    if (v && v.playEffect) v.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak }).catch(() => {})
  }
  return { poll, rumble }
}
