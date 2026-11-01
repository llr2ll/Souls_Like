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

  // Ataques (DESIGN 3.2): o que vale para todas as armas
  attack: {
    combo: 0.8, // depois de um golpe leve, tanto tempo (s) para o próximo leve continuar o combo (senão volta ao 1º)
    buffer: 0.25, // apertou até tanto tempo (s) antes do fim do golpe: fica guardado e sai na hora certa
  },
  // Armas (DESIGN 6). light = golpes leves (o combo, em ordem); heavy = pesado.
  // time = duração do golpe (s); hit = [começo, fim] do instante em que a lâmina machuca (s);
  // range = alcance (m, até a borda do alvo); arc = metade da abertura (graus: 60 = 60° para cada lado); lunge = passo à frente (m)
  weapons: {
    espada: {
      light: [ // combo de 3: o 3º é uma estocada (abertura estreita)
        { anim: 'slash1', time: 0.38, hit: [0.13, 0.22], dmg: 12, posture: 10, range: 2.4, arc: 60, stamina: 12, lunge: 0.35 },
        { anim: 'slash2', time: 0.38, hit: [0.13, 0.22], dmg: 12, posture: 10, range: 2.4, arc: 60, stamina: 12, lunge: 0.35 },
        { anim: 'thrust', time: 0.52, hit: [0.22, 0.31], dmg: 16, posture: 14, range: 2.4, arc: 35, stamina: 12, lunge: 0.55 },
      ],
      heavy: { anim: 'heavy', time: 0.9, hit: [0.45, 0.57], dmg: 22, posture: 20, range: 2.6, arc: 50, stamina: 24, lunge: 0.6 },
    },
  },

  // Cura (DESIGN 6). Cabaça: R ou X. Pão de milho: F ou Y. Bebendo/comendo anda devagar e não ataca nem rola
  gourd: {
    sips: 4, // goles na cabaça (o anaco de cabaça dá +1). Enche ao descansar no cruceiro (e ao voltar nele depois de morrer)
    time: 1.1, // duração do gole (s)
    healAt: 0.7, // a cura entra neste instante (s). Levou golpe antes: o gole se perde
    heal: 40, // vida que o gole cura
  },
  bread: {
    start: 0, // pães com que você começa (na área da demo eles ficam pelo caminho; a arena de teste dá 3)
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

  // Trasno (DESIGN 5): pequeno, rápido, em grupo. Salta em você; pegou: rouba cera e foge. Errou: fica preso no chão (a janela)
  trasno: {
    hp: 20, posture: 12, r: 0.3, cera: 15, scale: 0.55,
    walk: 2.6, turn: 6, sight: 9, forget: 16, leash: 20, alert: 0.4,
    reach: 5.2, // salta de até essa distância
    wait: [0.6, 1.4], stagger: 0.3, sink: 3, broken: 1.6, parryBreak: 1,
    fleeSpeed: 4.2, fleeTime: 6, // roubou: foge por tanto tempo, depois volta para casa com a cera (matar devolve; descansar perde)
    attacks: {
      // salto: agacha com risadinha (aviso), voa ~5 m; acertou = rouba 10% da cera; errou = 0,7 s preso no chão
      leap: { warn: 0.4, warnTurn: 220, hits: [0.45], leap: 5, leapH: 1.3, dmg: 8, range: 1.0, arc: 180, recover: 0.7, steal: 0.1 },
    },
  },
  // Fondeiro (DESIGN 5): atirador de funda. Uma pedra a cada ~2,5 s; dá para bloquear com o escudo ou rolar. Perto: chuta e foge
  fondeiro: {
    hp: 30, posture: 15, r: 0.42, cera: 25,
    walk: 1.7, turn: 4, sight: 18, forget: 22, leash: 10, alert: 0.5,
    reach: 15, // atira de até essa distância (vendo você)
    needSight: true, kickRange: 2.6, // abaixo dessa distância chuta em vez de atirar
    wait: [1.6, 1.8], stagger: 0.35, sink: 4, broken: 2, parryBreak: 1, fleeSpeed: 3.2,
    attacks: {
      sling: { warn: 0.7, warnTurn: 160, hits: [0.1], projectile: { speed: 18, dmg: 12, life: 1.2 }, recover: 0.1 }, // zunido que sobe e atira
      kick: { warn: 0.4, warnTurn: 180, hits: [0.15], dmg: 12, range: 1.7, arc: 60, recover: 1.2, flee: 2.5, lunge: 0.3 },
    },
  },
  // Lobishome (DESIGN 5, elite): não renasce. Meia distância força o salto; aparar o zarpaço quebra metade da postura
  lobishome: {
    hp: 220, posture: 90, r: 0.6, cera: 400, scale: 1.3, unique: true,
    walk: 2.3, turn: 4.5, sight: 12, forget: 24, leash: 24, alert: 1.0,
    reach: 7.5, clawRange: 2.8, // salta de até 7,5 m; abaixo de 2,8 m dá o zarpaço
    howlAt: 0.75, // uiva (chama 2 trasnos) quando a vida cai abaixo disso (fração); uma vez por luta
    wait: [0.5, 1.0], stagger: 0.25, sink: 5, broken: 2.5, parryBreak: 0.5,
    attacks: {
      claws: { warn: 0.45, warnTurn: 180, hits: [0.12, 0.12], gap: 0.18, dmg: 18, range: 2.4, arc: 70, recover: 0.9 }, // zarpaço duplo
      pounce: { warn: 0.6, warnTurn: 180, hits: [0.5], leap: 7, leapH: 1.6, dmg: 28, strong: true, range: 1.5, arc: 180, recover: 1.0 }, // salto
      howl: { warn: 1.0, warnTurn: 0, hits: [0.05], recover: 0.3, summon: { kind: 'trasno', n: 2 } }, // uivo
    },
  },

  // Chefe do castro (DESIGN 5): a Serpe (fase 1) e a Moura (fase 2). warn = aviso (s), strike = golpe (s), recover = janela (s)
  castro: {
    hp: 400, // vida por fase (800 no total)
    cera: 1500,
    transform: 2.5, // a serpe vira pedra e a moura sai dela (s)
    ending: { delay: 3.5, time: 9 }, // vencida: "Fim da demo" aparece depois de delay s e fica time s
    serpe: {
      name: 'A Serpe', posture: 200, broken: 3, parryBreak: 0.25, // quebrada: a cabeça fica no chão 3 s (crítico na cabeça)
      speed: 2.4, turn: 2.2, keep: 5, // velocidade, giro (rad/s), distância que ela tenta manter
      segs: 18, spacing: 0.75, // gomos do corpo e distância entre eles (m)
      wait: [1.0, 1.8], // pausa entre golpes (s)
      groundMult: 1.5, // depois do bote, a cabeça no chão leva ×1,5
      squeezeAfter: 2, // colado no corpo dela por tanto tempo (s): ela aperta
      attacks: {
        bite: { warn: 0.7, strike: 0.22, recover: 1.2, dmg: 30, strong: true, reach: 7.5, range: 1.3 }, // bote: ergue a cabeça e sibila
        tail: { warn: 0.8, strike: 0.35, recover: 0.8, dmg: 24, inner: 1.6, outer: 4.6 }, // rabada: o rabo chocalha; perto dela (dentro) não pega
        squeeze: { warn: 0.9, strike: 0.25, recover: 1.0, dmg: 35, strong: true, range: 2.4 }, // enroscar: o corpo aperta e levanta poeira
      },
    },
    moura: {
      name: 'A Moura', posture: 160, broken: 3, parryBreak: 0.25,
      speed: 2.6, turn: 5, reach: 2.4, wait: [0.8, 1.4], r: 0.45, scale: 1.1,
      attacks: {
        fuso: { warn: 0.5, warnTurn: 180, hits: [0.12, 0.12, 0.12], gap: 0.22, dmg: 12, range: 2.6, arc: 50, recover: 0.9 }, // 3 estocadas
        fio: { warn: 0.9, strike: 0.25, recover: 1.0, dmg: 26, strong: true, lines: 3, gap: 2.2, length: 16, width: 0.55 }, // fio de ouro
        encanto: { vanish: 0.4, mark: 0.6, strike: 0.15, recover: 1.2, dmg: 30, range: 2.6, arc: 100, behind: 1.8 }, // some e volta atrás
      },
    },
  },

  // Música do chefe (DESIGN 8): fase 1 gaita e bombo; fase 2 entram zanfona, alaúde e pandeireta. Fora do chefe: sem música
  music: {
    vol: 0.3, // volume (0–1)
    bpm: [76, 100], // andamento da fase 1 e da fase 2 (batidas por minuto)
    fade: 1.5, // sobe ao começar e desce ao morrer (s)
    end: 5, // vencida: desce devagar (s)
  },

  // Levar golpe (DESIGN 3.3)
  hurt: {
    stagger: 0.35, // tropeço: tanto tempo (s) sem poder agir
    push: 2.5, // empurrão para trás no tropeço (m/s no começo)
    respawn: 4, // morreu: tela escura e, depois de tanto tempo (s), volta no último cruceiro
    down: 0.9, // golpe forte (DESIGN 3.3): caído no chão por tanto tempo (s)
    getUp: 0.4, // ... e levantando, invulnerável, por tanto tempo (s)
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
    lockMaxBoss: 19.5, // travado num chefe, pode afastar mais (DESIGN 3.6: 18–20 m)
    zoomFollow: 3, // suavidade do afastar/aproximar
  },

  // Sensação de impacto (DESIGN 8): cada golpe que acerta. light = leve, heavy = pesado
  juice: {
    // pausa no impacto: o jogo congela por tanto tempo (s) quando o golpe acerta. 0 desliga
    hitStop: { light: 0.03, heavy: 0.07, critical: 0.12 },
    zoom: { critical: 0.05, time: 0.4 }, // golpe crítico: a câmera chega 5% mais perto e volta em 0,4 s (DESIGN 8, item 6)
    // tremor de tela: quanto a câmera balança (m) em cada caso, e por quanto tempo (s). scale 0 desliga todos. Leve não treme
    // hurt = levou golpe; hurtStrong = levou golpe forte; boss = a serpe vira pedra (S11)
    shake: { scale: 1, time: 0.25, heavy: 0.1, critical: 0.18, hurt: 0.08, hurtStrong: 0.15, guardBreak: 0.12, boss: 0.3 },
    // vibração do controle: [motor forte, motor fraco (0 a 1), duração (ms)]. scale 0 desliga
    rumble: { scale: 1, light: [0.05, 0.3, 50], heavy: [0.35, 0.5, 110], critical: [0.7, 0.8, 200], hurt: [0.45, 0.4, 130], hurtStrong: [0.7, 0.6, 200],
      block: [0.2, 0.35, 80], parry: [0.3, 0.9, 90], guardBreak: [0.8, 0.6, 250], boss: [0.6, 0.4, 600] },
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
      bread: 3, // pães na largada (aqui não há pão no chão)
      dummies: [{ x: 0, z: 2 }, { x: 4, z: 0 }],
      cruceiros: [{ id: 'arena', name: 'Cruceiro da arena', x: 9, z: 3 }],
      enemies: [{ kind: 'romeiro', x: -8, z: 13, ry: 0 }],
    },
    // Val de Santa Baia (DESIGN 4), em blocos simples (S9). O cenário (muros, casas, árvores) fica em world/santa-baia.js
    demo: {
      start: { x: 14, z: 72 }, // ao sul da Ponte Vella
      cruceiros: [
        { id: 'ponte', name: 'Cruceiro da Ponte', x: 22, z: 46 },
        { id: 'castro', name: 'Cruceiro do Castro', x: 36, z: -50 },
      ],
      // 16 romeiros (DESIGN 4): ponte 2, rua de baixo 3 (sentados ao lume), rua de cima 2, adro 3, mosteiro 4, subida 2.
      // ry: 0 = olhando para baixo na tela (sul); π = norte (de costas para quem vem da ponte). sit = sentado até te ver
      enemies: [
        { kind: 'romeiro', x: 14, z: 49, ry: Math.PI }, { kind: 'romeiro', x: 5, z: 44, ry: 0 },
        { kind: 'romeiro', x: -21.4, z: 29.3, ry: 1.1, sit: true }, { kind: 'romeiro', x: -18.6, z: 29.3, ry: -1.1, sit: true },
        { kind: 'romeiro', x: -20, z: 31.6, ry: Math.PI, sit: true },
        { kind: 'romeiro', x: -26, z: 0, ry: Math.PI / 2 }, { kind: 'romeiro', x: -10, z: -1, ry: -Math.PI / 2 },
        { kind: 'romeiro', x: 2.2, z: -8.5, ry: 0 }, { kind: 'romeiro', x: 4.8, z: -14.5, ry: 0.5 }, { kind: 'romeiro', x: 9, z: -6.5, ry: 0 },
        { kind: 'romeiro', x: 30, z: -14, ry: 0 }, { kind: 'romeiro', x: 42, z: -14.5, ry: 0 },
        { kind: 'romeiro', x: 30.5, z: -28, ry: Math.PI }, { kind: 'romeiro', x: 41.5, z: -27.5, ry: Math.PI },
        { kind: 'romeiro', x: 32, z: -42, ry: 0 }, { kind: 'romeiro', x: 42, z: -46, ry: 0 },
        // S10: trasnos (rua de cima 2, souto 3), fondeiros (rua de cima 1, escada da igreja 1, alto da subida 2) e o Lobishome
        { kind: 'trasno', x: -7, z: 11, ry: Math.PI }, { kind: 'trasno', x: -40, z: -4.5, ry: Math.PI / 2 },
        { kind: 'fondeiro', x: -47, z: 1, ry: Math.PI / 2 },
        { kind: 'fondeiro', x: 12, z: -8.6, ry: 0 },
        { kind: 'fondeiro', x: 30, z: -53, ry: 0 }, { kind: 'fondeiro', x: 44, z: -53.5, ry: 0 },
        { kind: 'trasno', x: -20, z: -30, ry: 0 }, { kind: 'trasno', x: -8, z: -33, ry: 0.5 }, { kind: 'trasno', x: -27, z: -40, ry: -0.5 },
        { kind: 'lobishome', x: -14, z: -44, ry: 0 },
        // S11: o chefe, enroscado no meio do castro (acorda quando você atravessa a névoa)
        { kind: 'castro', x: 32, z: -71, ry: 0 },
      ],
      // itens no chão (E/A para pegar): pão de milho (cura) e achados (texto curto). Pegou: não volta (fica no save)
      items: [
        { id: 'pao-fonte', kind: 'bread', x: 2, z: 32.5 },
        { id: 'pao-adro', kind: 'bread', x: 0.5, z: -24 },
        { id: 'pao-subida', kind: 'bread', x: 46, z: -40 },
        { id: 'achado-ponte', kind: 'note', x: 17.5, z: 68.5, title: 'Inscrição na pedra da ponte',
          text: 'Peregrino: trava o olhar no morto (Q ou R3). Espera o golpe, rola para o lado (Espaço ou B) e castiga enquanto ele se recompõe.' },
        { id: 'achado-lume', kind: 'note', x: -24, z: 32.5, title: 'Credencial manchada',
          text: 'Dois carimbos de Ourense, nenhum depois da ponte. No verso: "Esperei meu irmão três dias."' },
        // anaco de cabaça: no andar de cima da casa do ferreiro (o lugar exato vem do cenário: anchor)
        { id: 'anaco-ferreiro', kind: 'gourd', anchor: 'anaco', title: 'Anaco de cabaça' },
        { id: 'achado-ferreiro', kind: 'note', x: -27.5, z: 5.2, title: 'Bilhete na porta do ferreiro',
          text: 'Fechei por dentro. Quem passar, não bata. O caminho de cima eu abro quando a névoa baixar.' },
        { id: 'achado-adro', kind: 'note', x: 1.5, z: -21, title: 'Lápide',
          text: 'Aqui descansa quem chegou cedo demais. Rezai pelos que ainda andam.' },
        { id: 'achado-horas', kind: 'note', x: 33, z: -24, title: 'Folha de um livro de horas',
          text: 'A vela segura a névoa. Enquanto ela arder no cruceiro, descansai. Quando apagar, os mortos voltam ao caminho.' },
        { id: 'achado-porteiro', kind: 'note', x: 46, z: -10, title: 'Carta ao irmão porteiro',
          text: 'Irmão: a alavanca do portão sul fica junto ao muro, à direita de quem sai. Não abras para ninguém de fora.' },
      ],
      // atalhos (DESIGN 4): alavanca de um lado abre o portão; do outro lado ele não abre
      // lever = onde se abre (label: o que aparece na tela); outside = do lado que não abre (locked: o aviso)
      shortcuts: [
        { id: 'portao', name: 'portão do mosteiro', lever: { x: 32.4, z: -10.2 }, gate: { x: 36, z: -8, w: 4 }, outside: { x: 36, z: -5.6 } },
        // atalho 1: o quintal do ferreiro abre por dentro (rua de cima) e devolve você à rua de baixo
        { id: 'ferreiro', name: 'portão do quintal do ferreiro', label: 'Tirar a tranca do portão', lever: { x: -22.4, z: 13.6 },
          gate: { x: -24, z: 15, w: 2 }, outside: { x: -24, z: 16.8 } },
        // atalho 3: do souto, a escada do hórreo desce para a rua de cima (de baixo é alto demais)
        { id: 'horreo', name: 'escada do hórreo', label: 'Baixar a escada do hórreo', lever: { x: -45.6, z: -17.8 },
          gate: { x: -44, z: -16, w: 4 }, outside: { x: -44, z: -14.2 }, locked: 'Alto demais. Não dá para subir daqui.' },
      ],
      // névoa na entrada do castro: E/A atravessa (do lado de dentro, só sai vencendo o chefe). inside = onde você entra
      // behind = a névoa que fecha a abertura da muralha atrás de você enquanto o chefe está acordado
      fogs: [{ id: 'castro', x: 32, z: -56, w: 4, boss: 'castro', inside: { x: 32, z: -60.5 }, behind: { x: 32, z: -58, w: 3.4 } }],
    },
  },
}
