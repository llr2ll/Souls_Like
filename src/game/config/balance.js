// TODOS os números de jogabilidade deste jogo ficam aqui. Mude um número, salve, e o jogo recarrega sozinho (npm run dev).
// Os números de partida vêm do docs/DESIGN.md. Cada PR acrescenta os seus.
export const BALANCE = {
  player: {
    hp: 100, // vida (DESIGN 3.1; +6 por ponto de Vigor quando existir progressão)
    stamina: 100, // fôlego (DESIGN 3.1; +4 por ponto de Alento)
    look: 'samurai', // visual provisório (o do survivor que luta de perto); o peregrino chega com as armas do souls
    start: { x: 0, z: 6 }, // onde o jogador nasce na arena
  },

  // Movimento: mesmos campos do survivor (shared/characters/player-movement.js · DEFAULT_MOVE)
  move: {
    walk: 4.4, // velocidade andando (m/s), igual ao survivor
    run: 6.6, // velocidade correndo (segurar Espaço ou B)
    aim: 3.1, // velocidade mirando (herança do survivor; este jogo não mira, campo exigido pelo movimento copiado)
    swim: 3.1, // nadando (a arena não tem água)
    staminaRun: 15, // fôlego gasto por segundo correndo
    staminaSwim: 9, // fôlego gasto por segundo nadando
    staminaRegen: 35, // fôlego recuperado por segundo
    staminaDelay: 0.5, // a recuperação só começa depois de tanto tempo (s) sem gastar fôlego
    tiredUntil: 30, // fôlego zerado: só volta a correr depois de recuperar até aqui
    heldSlow: [0.35, 0.12], // agarrado (não existe neste jogo; campo exigido pelo movimento copiado)
    buffSpeed: 1, // bônus de velocidade (não existe neste jogo)
  },

  // Rolamento (DESIGN 3.3). Espaço ou B: tocar rola, segurar corre
  roll: {
    stamina: 16, // fôlego gasto (dá para rolar com qualquer fôlego acima de 0: ele zera)
    time: 0.55, // duração (s)
    safe: [0.08, 0.38], // invulnerável deste instante até este (s, contando do começo do rolamento)
    distance: 3.5, // quanto anda (m)
    tap: 0.25, // soltar o botão antes disso (s) = rolar; segurar mais = correr
    buffer: 0.25, // apertou rolar até tanto tempo (s) antes de poder: fica guardado e sai na hora certa
  },

  // Barras na tela
  hud: {
    px: 2, // pixels por ponto de fôlego (fôlego maior = barra mais comprida, como nos souls)
    pant: 25, // fôlego abaixo disso: respiração ofegante (DESIGN 8, item 9)
  },

  // Câmera de cima em 3/4, fixa (não gira). DESIGN 3.6
  camera: {
    height: 10, // altura acima do jogador (m)
    back: 8.4, // recuo para trás (m): com a altura 10, inclinação de ~50° e distância de ~13 m
    lookY: 0.5, // altura do ponto que a câmera olha (m)
    fov: 45, // campo de visão (graus)
    follow: 6, // quanto mais alto, mais grudada no jogador (suavidade)
    lead: 1.5, // antecipação: a câmera olha até 1,5 m à frente de para onde o jogador anda (0 desliga)
    leadSpeed: 4.4, // a partir desta velocidade (m/s) a antecipação fica inteira (andando já é tudo)
    leadFollow: 2.5, // suavidade da antecipação: mais baixo = demora mais para mudar quando ele vira
    shakeMax: 0.4, // tremor máximo, somando vários ao mesmo tempo (m)
  },

  // Sensação de impacto (DESIGN 8). Por enquanto só a tecla T / botão Y testam (no npm run dev); os golpes chegam no S3
  juice: {
    // tremor de tela: quanto a câmera balança (m) em cada caso, e por quanto tempo (s). scale 0 desliga todos
    shake: { scale: 1, time: 0.25, heavy: 0.1, critical: 0.18, hitTaken: 0.15 },
    // vibração do controle: [motor forte, motor fraco (0 a 1), duração (ms)]. scale 0 desliga
    rumble: { scale: 1, heavy: [0.35, 0.5, 110], critical: [0.7, 0.8, 200], hitTaken: [0.6, 0.6, 160] },
  },

  // Controle de videogame (DESIGN 3.7). Nomes no padrão Xbox: A B X Y · LB RB (ombros) · LT RT (gatilhos) · L3 R3 (apertar o stick)
  // No PlayStation: A = ✕, B = ◯, X = ▢, Y = △, LB/RB = L1/R1, LT/RT = L2/R2
  pad: {
    dead: 0.2, // zona morta do stick (0 a 1): abaixo disso conta como solto (evita andar sozinho com o stick gasto)
    hold: { B: 'run' }, // B: tocar rola, segurar corre
    // apertar: cada ação só faz efeito quando o PR dela chegar (bater S3, travar S4, aparar S6, cabaça S7)
    press: { A: 'use', X: 'heal', RB: 'light', RT: 'heavy', LT: 'parry', R3: 'lock', RIGHT: 'swap' },
  },

  // Teclado e mouse (DESIGN 3.7). WASD anda. Nomes: letras, 'space', 'mouse-left', 'mouse-right', 'mouse-middle', 'wheel-up', 'wheel-down'
  keys: {
    hold: { space: 'run' }, // Espaço: tocar rola, segurar corre
    // apertar ('shift+…' = com Shift segurado). Cada ação só faz efeito quando o PR dela chegar
    press: { e: 'use', r: 'heal', q: 'lock', 'mouse-middle': 'lock', 'mouse-left': 'light', 'shift+mouse-left': 'heavy', 'shift+mouse-right': 'parry' },
  },

  arena: {
    size: 40, // lado da arena de teste (m)
  },
}
