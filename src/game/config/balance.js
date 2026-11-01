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
    aim: 3.4, // velocidade andando travado no alvo (de frente para ele, de lado ou de costas)
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

  // Ataques com a espada (DESIGN 3.2). time = duração do golpe (s); hit = [começo, fim] do instante em que a lâmina machuca (s);
  // range = alcance (m, até a borda do alvo); arc = metade da abertura (graus: 60 = 60° para cada lado); lunge = passo à frente (m)
  attack: {
    light: [ // combo de 3: o 3º é uma estocada (abertura estreita)
      { anim: 'slash1', time: 0.38, hit: [0.13, 0.22], dmg: 12, posture: 10, range: 2.4, arc: 60, stamina: 12, lunge: 0.35 },
      { anim: 'slash2', time: 0.38, hit: [0.13, 0.22], dmg: 12, posture: 10, range: 2.4, arc: 60, stamina: 12, lunge: 0.35 },
      { anim: 'thrust', time: 0.52, hit: [0.22, 0.31], dmg: 16, posture: 14, range: 2.4, arc: 35, stamina: 12, lunge: 0.55 },
    ],
    heavy: { anim: 'heavy', time: 0.9, hit: [0.45, 0.57], dmg: 22, posture: 20, range: 2.6, arc: 50, stamina: 24, lunge: 0.6 },
    combo: 0.8, // depois de um golpe leve, tanto tempo (s) para o próximo leve continuar o combo (senão volta ao 1º)
    buffer: 0.25, // apertou até tanto tempo (s) antes do fim do golpe: fica guardado e sai na hora certa
  },

  // Bonecos de treino (S3, S4): onde ficam na arena. Não morrem
  dummies: [{ x: 0, z: 2 }, { x: 4, z: 0 }],

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
    // travado no alvo: a câmera olha entre os dois e se afasta para caber os dois na tela
    lockBias: 0.4, // onde olha: 0 = no jogador, 1 = no alvo
    lockMargin: 2.5, // folga em volta dos dois (m)
    lockMax: 17, // distância máxima da câmera (m; a normal é ~13)
    zoomFollow: 3, // suavidade do afastar/aproximar
  },

  // Sensação de impacto (DESIGN 8): cada golpe que acerta. light = leve, heavy = pesado
  juice: {
    // pausa no impacto: o jogo congela por tanto tempo (s) quando o golpe acerta. 0 desliga
    hitStop: { light: 0.03, heavy: 0.07, critical: 0.12, parry: 0.12 },
    // tremor de tela: quanto a câmera balança (m) em cada caso, e por quanto tempo (s). scale 0 desliga todos. Leve não treme
    shake: { scale: 1, time: 0.25, heavy: 0.1, critical: 0.18, hitTaken: 0.15 },
    // vibração do controle: [motor forte, motor fraco (0 a 1), duração (ms)]. scale 0 desliga
    rumble: { scale: 1, light: [0.05, 0.3, 50], heavy: [0.35, 0.5, 110], critical: [0.7, 0.8, 200], hitTaken: [0.6, 0.6, 160] },
    trail: 0.12, // rastro da lâmina: some em tanto tempo (s). Só aparece no instante em que a lâmina machuca
  },

  // Controle de videogame (DESIGN 3.7). Nomes no padrão Xbox: A B X Y · LB RB (ombros) · LT RT (gatilhos) · L3 R3 (apertar o stick)
  // No PlayStation: A = ✕, B = ◯, X = ▢, Y = △, LB/RB = L1/R1, LT/RT = L2/R2
  pad: {
    dead: 0.2, // zona morta do stick (0 a 1): abaixo disso conta como solto (evita andar sozinho com o stick gasto)
    hold: { B: 'run' }, // B: tocar rola, segurar corre
    // apertar: cada ação só faz efeito quando o PR dela chegar (bater S3, travar S4, aparar S6, cabaça S7)
    // R-left / R-right = puxar o stick direito para o lado (troca de alvo)
    press: { A: 'use', X: 'heal', RB: 'light', RT: 'heavy', LT: 'parry', R3: 'lock', 'R-left': 'lock-prev', 'R-right': 'lock-next', RIGHT: 'swap' },
  },

  // Teclado e mouse (DESIGN 3.7). WASD anda. Nomes: letras, 'space', 'mouse-left', 'mouse-right', 'mouse-middle', 'wheel-up', 'wheel-down'
  keys: {
    hold: { space: 'run' }, // Espaço: tocar rola, segurar corre
    // apertar ('shift+…' = com Shift segurado). Cada ação só faz efeito quando o PR dela chegar
    press: { e: 'use', r: 'heal', q: 'lock', 'mouse-middle': 'lock', 'wheel-up': 'lock-prev', 'wheel-down': 'lock-next',
      'mouse-left': 'light', 'shift+mouse-left': 'heavy', 'shift+mouse-right': 'parry' },
  },

  // Travar no alvo (DESIGN 3.6). Q, botão do meio ou R3 trava/solta; roda do mouse ou stick direito para o lado troca
  lock: {
    range: 14, // alcance para travar (m)
    release: 18, // solta sozinho se o alvo ficar mais longe que isso (m)
    lostTime: 2, // solta sozinho depois de tanto tempo (s) sem ver o alvo (parede no meio)
    anglePenalty: 4, // ao travar, prefere o alvo para onde ele olha: cada radiano de desvio conta como tantos metros a mais
  },

  arena: {
    size: 40, // lado da arena de teste (m)
  },
}
