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
    run: 6.6, // velocidade correndo (Shift ou segurar B no controle; no S2 o Espaço também vira "segurar rolar")
    aim: 3.1, // velocidade com o mouse apertado (mira do survivor; sai quando o ataque do souls chegar)
    swim: 3.1, // nadando (a arena não tem água)
    staminaRun: 15, // fôlego gasto por segundo correndo
    staminaSwim: 9, // fôlego gasto por segundo nadando
    staminaRegen: 35, // fôlego recuperado por segundo (o atraso de 0,5 s chega no S2)
    tiredUntil: 30, // fôlego zerado: só volta a correr depois de recuperar até aqui
    heldSlow: [0.35, 0.12], // agarrado (não existe neste jogo; campo exigido pelo movimento copiado)
    buffSpeed: 1, // bônus de velocidade (não existe neste jogo)
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
    hold: { B: 'run' }, // segurar: B corre (no S2, tocar B rola)
    // apertar: cada ação só faz efeito quando o PR dela chegar (bater S3, travar S4, aparar S6, cabaça S7)
    press: { A: 'use', X: 'heal', RB: 'light', RT: 'heavy', LT: 'parry', R3: 'lock', RIGHT: 'swap' },
  },

  arena: {
    size: 40, // lado da arena de teste (m)
  },
}
