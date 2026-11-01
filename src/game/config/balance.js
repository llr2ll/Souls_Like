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
    run: 6.6, // velocidade correndo (Shift por enquanto; no S2 vira "segurar rolar")
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
  },

  arena: {
    size: 40, // lado da arena de teste (m)
  },
}
