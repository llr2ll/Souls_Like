// Teclado e mouse de um jogador. WASD move; o resto vem do mapa do jogo (igual ao controle, engine/input/gamepad.js):
//   map = { hold: { tecla: campo do setInput }, press: { tecla: ação } }
// Nomes: letras e números ('e', '1'), 'space', 'shift', 'mouse-left', 'mouse-right', 'mouse-middle', 'wheel-up', 'wheel-down'.
// 'shift+tecla' em press: com Shift segurado, vale essa combinação (e ela "gasta" o botão: não conta como segurar).
// Manda o mesmo contrato do controle (engine/input/contract.js): setInput(id, { mx, mz, ax, az, run }) e act(id, ação).
const MOUSE = ['mouse-left', 'mouse-middle', 'mouse-right']
const keyName = (e) => (e.code === 'Space' ? 'space' : e.key.toLowerCase())

export function BindKeyboard(game, map, id = 'local') {
  const down = new Set() // teclas e botões do mouse segurados (sem os que viraram combinação com Shift)
  const active = () => game.players.has(id)
  const typing = (e) => e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')

  function push() {
    if (!active()) return
    const x = (down.has('d') ? 1 : 0) - (down.has('a') ? 1 : 0), z = (down.has('s') ? 1 : 0) - (down.has('w') ? 1 : 0)
    const l = Math.hypot(x, z) || 1
    const msg = { mx: x / l, mz: z / l, ax: 0, az: 0, run: 0 }
    for (const k in map.hold) if (down.has(k)) msg[map.hold[k]] = 1
    game.setInput(id, msg)
  }
  // apertou: combinação com Shift (se existir) ou a tecla sozinha
  function press(k, repeat) {
    const combo = down.has('shift') && map.press['shift+' + k]
    if (combo) { if (!repeat) game.act(id, combo); return }
    down.add(k)
    if (map.press[k] && !repeat) game.act(id, map.press[k])
    push()
  }
  function release(k) { down.delete(k); push() }

  addEventListener('keydown', (e) => {
    if (typing(e) || !active()) return
    const k = keyName(e)
    if (k === 'space') e.preventDefault() // não rola a página
    press(k, e.repeat)
  })
  addEventListener('keyup', (e) => release(keyName(e)))
  addEventListener('mousedown', (e) => { if (active() && MOUSE[e.button]) press(MOUSE[e.button], false) })
  addEventListener('mouseup', (e) => { if (MOUSE[e.button]) release(MOUSE[e.button]) })
  addEventListener('wheel', (e) => { if (active() && e.deltaY) { const a = map.press[e.deltaY < 0 ? 'wheel-up' : 'wheel-down']; if (a) game.act(id, a) } }, { passive: true })
  addEventListener('contextmenu', (e) => { if (active()) e.preventDefault() })
  addEventListener('blur', () => { down.clear(); push() })
}
