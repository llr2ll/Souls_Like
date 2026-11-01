// TODOS os números de jogabilidade deste jogo ficam aqui. Mude um número, salve, e o jogo recarrega sozinho (npm run dev).
// Os números de partida vêm do docs/DESIGN.md. Cada PR acrescenta os seus.
export const BALANCE = {
  player: {
    hp: 100, // vida (DESIGN 3.1; +6 por ponto de Vigor quando existir progressão)
    stamina: 100, // fôlego (DESIGN 3.1; +4 por ponto de Alento)
    look: 'samurai', // visual provisório (o do survivor que luta de perto); o peregrino chega com as armas do souls
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

  // Cura (DESIGN 6). Cabaça: R ou X. Pão de milho: F ou Y. Bebendo/comendo anda devagar e não ataca nem rola
  gourd: {
    sips: 4, // goles na cabaça (o anaco de cabaça dá +1). Enche ao descansar no cruceiro (e ao voltar nele depois de morrer)
    time: 1.1, // duração do gole (s)
    healAt: 0.7, // a cura entra neste instante (s). Levou golpe antes: o gole se perde
    heal: 40, // vida que o gole cura
  },
  bread: {
    start: 3, // pães com que você começa (provisório: na área da demo eles ficam pelo caminho)
    time: 0.5, // duração (s); a cura entra no fim
    heal: 15,
  },
  usingSpeed: 1.8, // velocidade andando enquanto bebe ou come (m/s)

  // Escudo (DESIGN 3.3): segurar clique direito ou LB. Rodela de madeira, desde o começo
  guard: {
    speed: 2.4, // andando com o escudo erguido (m/s)
    cost: 1.5, // fôlego gasto por ponto de dano segurado (golpe de 15 = 22,5 de fôlego)
    regen: 0.4, // com o escudo erguido o fôlego volta a 40% da velocidade
    arc: 90, // o escudo protege até tantos graus para cada lado da frente (de costas, não segura)
    broken: 1.0, // fôlego zerou segurando um golpe: guarda quebrada, atordoado por tanto tempo (s), aberto a tudo
    push: 0.9, // empurrão ao segurar um golpe (m/s)
  },
  // Aparar (DESIGN 3.3): Shift + clique direito ou LT. Acertou o instante: a postura do inimigo quebra
  parry: {
    stamina: 8, // fôlego gasto
    window: 0.18, // instante que apara (s, do aperto em diante)
    miss: 0.5, // errou: fica aberto por tanto tempo depois da janela (s)
    slow: 0.12, // aparo certo: tudo fica lento por tanto tempo (s)
    slowScale: 0.25, // ... a essa velocidade (0,25 = um quarto)
  },
  // Postura (DESIGN 3.4): cada golpe enche a barra do inimigo; cheia, ele cai de joelhos e aceita o golpe crítico
  posture: {
    delay: 1.5, // a barra só começa a esvaziar depois de tanto tempo (s) sem levar golpe
    regen: 10, // ... e esvazia tanto por segundo
  },
  // Golpe crítico: golpe leve a até `range` m de quem está de joelhos. Invulnerável durante a animação
  critical: { anim: 'riposte', time: 1.2, hit: [0.42, 0.5], mult: 3, range: 2.0, arc: 70, lunge: 0.3 },

  // Cruceiros (DESIGN 1 e 7): E ou A perto dele = descansar (cura, enche a cabaça, salva e os inimigos voltam).
  // Morrendo, você volta no último em que descansou (antes do primeiro descanso: no começo). Onde ficam: em cada mapa (maps)
  rest: {
    range: 2.8, // distância para descansar (m, do centro do cruceiro; o pé de pedra tem ~2 m de largura)
    enemyNear: 15, // não dá para descansar com inimigo atrás de você a menos disso (m)
  },
  // Cera e a vela da morte (DESIGN 7): morreu, a cera fica acesa no chão. Uma chance de voltar e pegar (E ou A)
  candle: {
    range: 1.6, // distância para pegar (m)
    hum: 30, // o zumbido baixo que guia até a vela se ouve até essa distância (m)
  },

  // Levar golpe (DESIGN 3.3)
  hurt: {
    stagger: 0.35, // tropeço: tanto tempo (s) sem poder agir
    push: 2.5, // empurrão para trás no tropeço (m/s no começo)
    respawn: 4, // morreu: tela escura e, depois de tanto tempo (s), volta no último cruceiro
  },

  // Romeiro perdido (DESIGN 5). Golpes: warn = aviso (s), hits = duração de cada golpe (s), gap = pausa entre golpes,
  // recover = janela para punir (s), range = alcance (m), arc = metade da abertura (graus), warnTurn = giro máximo no aviso (graus/s)
  romeiro: {
    hp: 55, posture: 30, r: 0.42,
    cera: 30, // cera que ele deixa ao cair (DESIGN 7)
    walk: 1.6, // velocidade andando (m/s): mais lento que o jogador
    turn: 4, // giro andando (radianos/s)
    sight: 9, // enxerga o jogador a até tantos metros (e sem parede no meio)
    forget: 16, // desiste se o jogador passar disso
    leash: 18, // não se afasta mais que isso de onde nasceu
    alert: 0.6, // ao ver o jogador: para e geme por tanto tempo (s)
    reach: 1.9, // chega até essa distância antes de golpear
    wait: [0.5, 1.1], // pausa entre ataques (s, sorteada)
    stagger: 0.35, // tropeço ao levar golpe fora do ataque (s). No aviso e no golpe ele não para
    sink: 4, // morto: afunda no chão depois de tanto tempo (s)
    broken: 2.0, // postura quebrada: de joelhos por tanto tempo (s)
    parryBreak: 1, // aparo certo enche tanto da barra de postura (1 = quebra na hora; elite 0,5; chefe 0,25)
    attacks: {
      smash: { warn: 0.5, warnTurn: 180, hits: [0.15], dmg: 15, range: 2.3, arc: 35, recover: 0.8, lunge: 0.3 }, // pancada
      cuts: { warn: 0.45, warnTurn: 180, hits: [0.12, 0.12], gap: 0.22, dmg: 10, range: 2.0, arc: 70, recover: 1.0 }, // dois cortes
    },
  },

  // Barras na tela
  hud: {
    px: 2, // pixels por ponto de fôlego (fôlego maior = barra mais comprida, como nos souls)
    pant: 25, // fôlego abaixo disso: respiração ofegante (DESIGN 8, item 9)
    danger: 0.25, // vida abaixo disso (fração): borda vermelha na tela (DESIGN 8, item 10)
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
    hitStop: { light: 0.03, heavy: 0.07, critical: 0.12 },
    zoom: { critical: 0.05, time: 0.4 }, // golpe crítico: a câmera chega 5% mais perto e volta em 0,4 s (DESIGN 8, item 6)
    // tremor de tela: quanto a câmera balança (m) em cada caso, e por quanto tempo (s). scale 0 desliga todos. Leve não treme
    // hurt = levou golpe; hurtStrong = levou golpe forte
    shake: { scale: 1, time: 0.25, heavy: 0.1, critical: 0.18, hurt: 0.08, hurtStrong: 0.15, guardBreak: 0.12 },
    // vibração do controle: [motor forte, motor fraco (0 a 1), duração (ms)]. scale 0 desliga
    rumble: { scale: 1, light: [0.05, 0.3, 50], heavy: [0.35, 0.5, 110], critical: [0.7, 0.8, 200], hurt: [0.45, 0.4, 130], hurtStrong: [0.7, 0.6, 200],
      block: [0.2, 0.35, 80], parry: [0.3, 0.9, 90], guardBreak: [0.8, 0.6, 250] },
    trail: 0.12, // rastro da lâmina: some em tanto tempo (s). Só aparece no instante em que a lâmina machuca
  },

  // Controle de videogame (DESIGN 3.7). Nomes no padrão Xbox: A B X Y · LB RB (ombros) · LT RT (gatilhos) · L3 R3 (apertar o stick)
  // No PlayStation: A = ✕, B = ◯, X = ▢, Y = △, LB/RB = L1/R1, LT/RT = L2/R2
  pad: {
    dead: 0.2, // zona morta do stick (0 a 1): abaixo disso conta como solto (evita andar sozinho com o stick gasto)
    hold: { B: 'run', LB: 'guard' }, // B: tocar rola, segurar corre · LB: segurar ergue o escudo
    // apertar: cada ação só faz efeito quando o PR dela chegar (bater S3, travar S4, aparar S6, cabaça S7)
    // R-left / R-right = puxar o stick direito para o lado (troca de alvo)
    press: { A: 'use', X: 'heal', Y: 'eat', RB: 'light', RT: 'heavy', LT: 'parry', R3: 'lock', 'R-left': 'lock-prev', 'R-right': 'lock-next', RIGHT: 'swap' },
  },

  // Teclado e mouse (DESIGN 3.7). WASD anda. Nomes: letras, 'space', 'mouse-left', 'mouse-right', 'mouse-middle', 'wheel-up', 'wheel-down'
  keys: {
    hold: { space: 'run', 'mouse-right': 'guard' }, // Espaço: tocar rola, segurar corre · clique direito: escudo
    // apertar ('shift+…' = com Shift segurado). Cada ação só faz efeito quando o PR dela chegar
    press: { e: 'use', r: 'heal', f: 'eat', q: 'lock', 'mouse-middle': 'lock', 'wheel-up': 'lock-prev', 'wheel-down': 'lock-next',
      'mouse-left': 'light', 'shift+mouse-left': 'heavy', 'shift+mouse-right': 'parry' },
  },

  // Travar no alvo (DESIGN 3.6). Q, botão do meio ou R3 trava/solta; roda do mouse ou stick direito para o lado troca
  lock: {
    range: 14, // alcance para travar (m)
    release: 18, // solta sozinho se o alvo ficar mais longe que isso (m)
    lostTime: 2, // solta sozinho depois de tanto tempo (s) sem ver o alvo (parede no meio)
    anglePenalty: 4, // ao travar, prefere o alvo para onde ele olha: cada radiano de desvio conta como tantos metros a mais
  },

  // Mapas: o que fica em cada um. start = onde o jogador nasce (antes do primeiro descanso); dummies = bonecos de treino
  // (não morrem); cruceiros; enemies = inimigos (tipo, posição, para onde olham em radianos: 0 = para baixo na tela)
  maps: {
    arena: { // arena de teste (S0–S8)
      size: 40, // lado (m)
      start: { x: 0, z: 6 },
      dummies: [{ x: 0, z: 2 }, { x: 4, z: 0 }],
      cruceiros: [{ id: 'arena', name: 'Cruceiro da arena', x: 9, z: 3 }],
      enemies: [{ kind: 'romeiro', x: -8, z: 13, ry: 0 }],
    },
  },
}
