# CLAUDE.md — memória do projeto

Leia este arquivo inteiro antes de mexer em qualquer coisa. **Atualize-o em todo PR** (mapa de pastas, fatos, histórico).

## O jogo
Souls-like solo, visto de cima em 3/4, no navegador: **"O Camiño das Ánimas"** (nome provisório).
Um peregrino vivo no Caminho de Santiago tomado pela névoa. Cruceiros são os pontos de descanso, a cabaça é o frasco de cura, a moeda é cera.
Tudo em `docs/DESIGN.md` (conceito, números, área da demo, inimigos, plano de PRs S0–S15).
JavaScript (ES Modules) + Three.js 0.184 + Vite. Tudo procedural: nenhum arquivo de modelo 3D nem de som.
As peças genéricas foram **copiadas** do survivor do mesmo dono, "A paróquia sitiada" (`llr2ll/Zombie_Survivor`, antes `llr2ll/Game`).
Origem de cada arquivo: `docs/ORIGEM.md`. Para o dono, a explicação leiga está em `docs/COMO-FUNCIONA.md`.

## Quem é o dono e como falar com ele
- Não lê código. Todo o código foi escrito por IA. Ele testa jogando.
- Português do Brasil, frases curtas, sem jargão. Termo técnico → explique em uma frase.
- Testa no GitHub Codespaces, como no survivor: `npm run dev` (porta 5173).
- **Não precisa pedir "ok" antes de cada etapa** (pedido do dono em 01/11/2026: "apenas comece e depois eu ajusto").
  Siga o plano do `docs/DESIGN.md` e diga o que fez. Pergunte só quando a decisão não tiver volta.
- Toda mudança chega como pull request em `llr2ll/Souls_Like`. **Nunca** faça push direto na `main`.
  (Única exceção, já feita: o README inicial, porque o repositório nasceu vazio, sem `main`.)
- PRs empilhados: cada um sai da branch do anterior enquanto o anterior não entrou na `main`.
- O `llr2ll/Zombie_Survivor` é **só leitura**: nunca criar branch, commit ou PR nele.

## Como rodar
```bash
npm install
npm run dev      # jogo (porta 5173)
npm run build    # gera dist/ (para hospedar)
```

## Como testar
- `npm run check` — poucos segundos, sem navegador. Rodar SEMPRE antes de abrir PR. Duas verificações:
  1. **Camadas:** imports só descem (`src/game` → `src/shared` → `src/engine`); import para arquivo ou pacote inexistente falha;
     a página tem de apontar para scripts que existem.
  2. **Jogo (replay):** `scripts/sim.mjs` joga 70 s com sorteio e relógio fixos e compara o hash (jogador + câmera) com `scripts/sim-fingerprint.txt`.
     Roteiro: S0 (0–60 s) anda em 8 direções (bate no muro, no cruceiro, nas pedras), corre às vezes, vai até a porta da casa, entra e sai.
     S1 (60–70 s) controle de mentira: stick pela metade (anda devagar), diagonal segurando B (corre), stick quase solto (parado).
     S2 (70–82 s) toques no botão de rolar (rola), 2º toque guardado, rolar até zerar o fôlego, segurar (corre), `act('roll')`.
     O hash conta também quantos rolamentos houve e quantos quadros invulneráveis.
     S3 (82–98 s) vai até o boneco; combo de 3 (um aperto cedo demais é descartado), pesado, leve cancelado por rolamento
     depois do impacto, golpes até zerar o fôlego. O hash conta golpes, dano e postura em cada alvo.
     S4 (98–118 s) trava, troca de alvo, anda de frente para ele, golpe com o stick para o outro lado (vai no alvo), corre para longe
     (solta), tenta travar longe (nada), trava e se esconde atrás da casa (solta em 2 s). O hash guarda a sequência de travadas.
     S5 (118–140 s) "jogador robô" contra um Romeiro: rola na diagonal no fim de cada aviso e pune na janela, até matá-lo
     (sem levar golpe: prova que rolar sempre funciona). Depois outro Romeiro, o robô parado com pouca vida morre e volta ao começo.
     **PR de organização tem de dar igual.** PR que muda a jogabilidade de propósito: `npm run check -- --update-sim` e dizer isso na descrição.
     Cada PR de jogabilidade acrescenta a sua cena ao roteiro. `SIM_TRACE=arquivo node scripts/sim.mjs` grava o rastro quadro a quadro.
- `npm run smoke` — teste automático (~1 min). Compila, sobe a página na porta **5199**, abre no Chromium sem tela, anda com o teclado,
  joga com um controle de mentira (`navigator.getGamepads` trocado) e **falha se aparecer qualquer `console.error`** ou erro de página.
  Capturas e log em `smoke/` (versionados: o PR mostra as capturas). O smoke usa a versão compilada: o que é só do `npm run dev` (tecla T) fica de fora.
  Sem acesso ao download do Playwright: `SMOKE_CHROME=/usr/bin/google-chrome node scripts/smoke.mjs` usa um Chrome já instalado
  (no Windows: `$env:SMOKE_CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"; node scripts/smoke.mjs`).
  Sem placa de vídeo o jogo roda a 3–10 FPS: pega erro de carregar/iniciar/teclas, não bugs de longo prazo.
- `docs/TESTE-MANUAL.md` — checklist de poucos minutos que o dono roda depois de cada PR (inclui anotar o FPS).
- FPS real só vale na máquina do dono. Nunca tire conclusão de desempenho pelo smoke.

## Mapa de pastas (hoje)
Regra: **imports só descem** — `src/game` → `src/shared` → `src/engine` (verificado por `npm run check`).
`engine` não sabe que existem inimigos nem armas. `shared` = peças prontas copiadas do survivor. `game` = regras deste jogo.
```
index.html, main.css      página do jogo → carrega src/game/main.js
scripts/                  check.mjs (camadas + replay), sim.mjs (replay), smoke.mjs (navegador sem tela), sim-fingerprint.txt
smoke/                    capturas + log do último npm run smoke
docs/                     DESIGN (direção do jogo), ORIGEM (de onde veio cada arquivo), COMO-FUNCIONA (leigo), TESTE-MANUAL (checklist)
src/engine/               genérico (copiado do survivor; novos: world/ground.js, input/gamepad.js)
  core/                   loop.js (laço, dt ≤ 0,05), events.js (avisos), memo.js (cache com limite)
  render/                 style.js (paleta, materiais, vento), light.js, entity-shadows.js (sombras falsas), follow.js (FPS)
  input/                  contract.js (contrato de input), keyboard.js (teclado+mouse pelo mapa do jogo), gamepad.js (controle, vibração)
  audio/engine.js         Web Audio: barramentos, primitivas, som posicional
  world/                  collision.js (grade de colisão), pathing.js (desvio, A*), noise.js, ground.js (chão/água que o jogo informa)
src/shared/               peças prontas (copiadas do survivor)
  characters/             player.js (esqueleto/animação), looks.js (visual), kits.js (armas + IK), player-movement.js
  creatures/zombie-model.js  humanoide articulado (12 variações): base dos inimigos
  worldgen/               buildings.js (casas), buildings-registry.js (portas, andares, recorte do telhado), assets.js (árvore, pedra,
                          cruceiro, hórreo, poço), climate.js (ainda não ligado), names.js (nomes galegos)
  fx/                     effects.js, gore.js
  audio/                  sfx.js (efeitos soltos)
src/game/                 este jogo
  main.js                 liga tudo: renderer, luz, arena, câmera, teclado, controle, laço; Wire() conecta motor ↔ peças ↔ sons;
                          Impact() = tremor + vibração; Note() = aviso curto no alto da tela
  game.js                 estado e regras (sem desenhar: o replay roda isto sem navegador): botão de rolar/correr, rolamento
  hud.js                  barras na tela (página, não 3D): vida, fôlego, vida do alvo travado
  enemies/enemy.js        inimigo genérico: vê, geme, aproxima, avisa, golpeia, recua, espera, tropeça, morre, volta para casa
  enemies/romeiro.js      Romeiro perdido: humanoide do survivor + bordão e foice, poses da pancada e dos dois cortes
  fx/trail.js             rastro da lâmina (só no instante de dano)
  fx/lock-mark.js         marca do alvo travado (círculo que pulsa, visível através das coisas)
  world/dummy.js          boneco de treino (pisca branco e balança ao levar golpe; não morre)
  camera.js               câmera de cima em 3/4, fixa: segue o jogador olhando ~1,5 m à frente (antecipação); tremor (shake);
                          travado: olha entre os dois e se afasta (até 17 m) para caber os dois
  config/balance.js       TODOS os números ajustáveis, comentados em português
  world/arena.js          arena de teste (S0): chão, muro, cruceiro, hórreo, carvalhos, pedras e uma casa
  world/place-house.js    põe uma casa do survivor no mapa (trecho do gerador do survivor)
```

**Como as camadas conversam sem import subindo** (ligado em `src/game/main.js`, função `Wire()`):
- `SetGround(fn, água)` (`engine/world/ground.js`): o jogo diz a altura do chão e da água. Movimento e sangue perguntam ali.
- `SetDeepTest(TooDeep)`: água funda bloqueia. `SetCameraSlope(s)`: inclinação da câmera para o recorte do telhado.
- Avisos (`engine/core/events.js`): as casas emitem `door-open`, `door-close`; o jogo toca o som.
  `hit` ({ by, target, kind: `light` | `heavy` }) → som + `Impact(kind)` em `main.js`: tremor de tela (só pesado) + vibração (`BALANCE.juice`).
  `swing` (a lâmina começou a cortar) → assobio. A pausa no impacto é do `game.js` (`stopT`: o `update` não roda; o desenho continua).
  `hurt` ({ p, dmg, strong }) → som + `Impact('hurt' | 'hurtStrong')`; `death` → som + aviso "A névoa te levou"; `respawn`.
  Inimigos: `enemy-alert` (gemido), `enemy-warn` ({ e, name }: som próprio de cada golpe), `enemy-swing`, `enemy-stagger`, `enemy-death`.
  `roll` e `roll-land` (o jogo avisa; `main.js` toca o impulso e o baque). Passos e respiração ofegante: `BodySounds()` em `main.js`.
- Peças de `shared` recebem os números como parâmetro: `UpdatePlayerMovement(p, dt, colliders, BALANCE.move)`.

## Contrato de input (proteger)
Copiado do survivor. **Só ganha coisas, nunca muda** (para o co-op pelo celular funcionar depois).
- `game.setInput(id, { mx, mz, ax, az, run, fire })` — mover (-1..1), mirar (-1..1), correr 0/1, `fire` só no mouse.
- `game.act(id, ação)` — fazem efeito: `roll` (S2), `light`, `heavy` (S3), `lock`, `lock-next`, `lock-prev` (S4).
  Planejadas (DESIGN 3.7): `parry`, `heal`
  (`use` e `swap` já existem). Bloquear (`guard`) é de segurar: entra como campo novo no `setInput`.
- `run` = **botão de rolar/correr segurado**. O jogo decide (`game.js`): soltar antes de `BALANCE.roll.tap` (0,25 s) rola; segurar mais corre.
  O jogo guarda o que chegou em `p.raw` e monta `p.input` (o que o movimento copiado recebe).
- Teclado e controle mexem o mesmo jogador, id `'local'`, e mandam o mesmo contrato (`engine/input/keyboard.js` e `gamepad.js`).
  Os botões ficam em `BALANCE.keys` e `BALANCE.pad` (`hold` = segurar → campo do `setInput`; `press` = apertar → `game.act`).
  Já mapeados com as ações do DESIGN 3.7.

## Decisões tomadas (não reabra sem perguntar ao dono)
- Repositório próprio; peças copiadas do survivor (origem `e4314ee`). Conceito A (O Camiño das Ánimas), moeda cera.
- Câmera de cima em 3/4, fixa, mais perto que a do survivor (~50°, ~13 m, campo de visão 45°). O stick direito não gira a câmera.
- Solo primeiro. Co-op local só depois da demo. Controle de videogame + teclado e mouse; celular só no co-op.
- Mapa feito à mão, interligado, com atalhos. Nada de mundo infinito.
- JavaScript + Three.js + Vite. Sem TypeScript, sem ECS, sem engine nova, sem React.
- Jogo pago na Steam, com demo. Sem microtransações.
- Sensação antes de conteúdo: movimento, rolamento e 1 ataque gostosos no controle antes de inimigos e áreas.

## Regras de trabalho
- PRs pequenos. Nunca misture reorganização com mudança de jogabilidade no mesmo PR.
- Todo número de jogabilidade em `src/game/config/balance.js`, com comentário.
- Arquivo copiado do survivor e alterado: anote em `docs/ORIGEM.md` (o que mudou e por quê). Copie sem reescrever.
- Copie só o que o jogo usa. Nada de carros, chunks, estradas, placas, relay (volta com o co-op).
- Nenhuma dependência nova sem perguntar (hoje: `three`; `vite` e `playwright` só para desenvolver).
- Comentários no código em português, curtos.

## Formato de cada PR
Título claro + descrição com:
- O que mudou (para leigo, até 5 linhas) · Por que · Como testar (passos numerados, dizendo o que ele deve ver)
- **Sensação:** o que o dono deve sentir jogando (uma frase) · **Como testar no controle:** botões e o que acontece
- Capturas do `npm run smoke` (links para `smoke/*.jpg` no commit do PR) · Origem (o que foi copiado/alterado, `docs/ORIGEM.md`)
- Risco e como desfazer

## Proibido (até o dono liberar)
Branch, commit ou PR no `llr2ll/Zombie_Survivor`. Mudar o contrato de input (só acrescentar). Online com uma tela por jogador; netcode.
Arquivos de modelo 3D ou de som; dependência nova. Conteúdo além da demo antes de a demo estar divertida.
TypeScript, ECS, engine nova, React. Publicar qualquer coisa.

## Fatos que não são óbvios no código
- O visual do jogador é o do **Samurai** do survivor (`BALANCE.player.look`), provisório até o peregrino.
- **Espaço** (teclado) e **B** (controle): tocar rola, segurar corre. Shift não corre mais: é o modificador do pesado e do aparo (DESIGN 3.7).
  O mouse não mira mais (o teclado do survivor mirava; o deste jogo não manda `ax/az`).
- Rolamento: usa a "investida" que o movimento copiado já sabia fazer (`dashT/dashA/dashV`); a velocidade cai em cosseno até parar.
  Invulnerável = `p.safe`. A animação é a ação `roll` do `player.js` (cambalhota em volta do centro do corpo encolhido).
- Fôlego: a recuperação espera `BALANCE.move.staminaDelay` sem gastar (`p.restT`); quem gasta fora do movimento zera `p.restT`.
  Máximo = `p.staminaMax` (a barra cresce junto). Zerou: barra apagada, só corre de novo com 30.
- O navegador só mostra o controle depois que alguém **aperta um botão** nele (não basta plugar). Aí aparece "Controle conectado".
  E só em página segura (https ou localhost: o Codespaces já é https); a prévia embutida do VS Code pode bloquear. Usar uma aba normal.
- O controle é lido a cada quadro (`pad.poll()`, antes de `game.update`). Parado (stick na zona morta, nenhum botão de segurar)
  ele não manda nada, para não apagar o teclado; ao soltar, manda "parado" uma vez.
- Vibração: Chrome e Edge vibram; Firefox não (o jogo segue sem erro).
- Ações (`roll`, `light`, `heavy`) passam por **uma fila só** (`p.queue`): a última apertada vale, guarda a direção do stick no aperto
  e sai assim que der (rolar: `BALANCE.roll.buffer`; golpe: `BALANCE.attack.buffer`). Golpe começado não se cancela; o rolamento
  cancela só depois do fim do instante de dano (`hit[1]`). Rolando ou atacando, o fôlego não recupera.
- Golpe acerta cada alvo **uma vez**, só no instante de dano (`hit`), no alcance (até a borda do alvo, `e.r`) e dentro da abertura (`arc`).
  Alvos = `game.targets` (hoje os bonecos; os inimigos entram no S5). Cada alvo tem `x, z, r, hit({ dmg, posture, dir, kind }), update(dt)`.
- Travar (`p.lock`): escolhe o alvo mais perto na direção do stick/frente (desvio pesa `BALANCE.lock.anglePenalty` m por radiano),
  até 14 m e à vista. Trocar = o mais próximo do lado pedido **na tela** (a câmera é fixa: direita = x maior). Solta sozinho a 18 m
  ou depois de 2 s sem ver (parede alta no meio; o boneco tem `h` baixo e não tapa). Travado e sem correr, o jogo manda `ax/az`
  na direção do alvo: o movimento copiado "mira" (anda de frente para o alvo, a `move.aim` m/s). Correr, rolar e golpear não miram.
  Golpe travado vai no alvo; rolamento vai para o stick.
- Inimigos: o `main.js` põe os de `BALANCE.enemies` com `game.spawn(tipo, x, z, ry)`; o replay põe os dele na hora da cena (senão
  eles atrapalhariam as cenas antigas). Golpe inimigo = aviso (`warn`) → golpes (`hits`, com `gap` entre eles) → `recover` (a janela).
  No aviso gira até `warnTurn` graus/s; no golpe não gira; o alvo do golpe é travado no fim do aviso. Acerta se o jogador estiver no
  alcance, na abertura, à vista e **não invulnerável** (`p.safe`). Levou golpe no aviso ou no golpe: não para (sem troca de golpes);
  fora disso tropeça. As poses do golpe vão pelo `e.pose`/`e.poseW` do humanoide (mudança no `zombie-model.js`).
- Jogador levou golpe: perde o golpe/rolamento em andamento, tropeça 0,35 s empurrado para trás (não age; ações apertadas ficam na
  fila). Morreu: cai, e em 3,5 s volta ao começo com vida cheia; os inimigos renascem (provisório: o cruceiro e a cera chegam no S8).
- Corpos não se atravessam (`separate()` em `game.js`: jogador e inimigos vivos se empurram).
- O 3º leve é uma estocada nova no kit do Samurai (`thrust`); o pesado também é novo (`heavy`). O rastro (`fx/trail.js`) usa a ponta
  da espada (`model.muzzle`) e o meio do caminho até o peito.
- `npm run check` roda no Windows também (o `sim.mjs` usa `pathToFileURL`).
- Casas: a porta fica na frente (+z, virada para a câmera) quando `ry = 0`. Na arena, a casa `stone2` está em (-8, -8) e a porta em (-8, -4,6).
- O replay só fixa o sorteio feito por código de `src/` (o Vite e o Three.js também sorteiam).
- `window.__game` existe só no `npm run dev` (testes e depuração).
- Teclas do motor copiado que continuam valendo: **M** liga/desliga o som.

## Histórico de PRs
- **s0-base (S0)** — cópia das peças do survivor (`e4314ee`), `package.json`, este CLAUDE.md, `docs/ORIGEM.md`, `docs/COMO-FUNCIONA.md`,
  `docs/TESTE-MANUAL.md`, `npm run check` (camadas + replay) e `npm run smoke`. Arena plana de 40 × 40 m com muro, cruceiro, hórreo, carvalhos,
  pedras e uma casa de 2 andares (antecipada do S1, para provar que a cópia das casas funciona). Jogador anda no teclado; câmera nova básica.
- **fase1-design** — `docs/DESIGN.md`: conceito A (O Camiño das Ánimas), números, área da demo, inimigos, plano de PRs. Só documento.
- **s1-camera-controle (S1)** — controle de videogame (`engine/input/gamepad.js`: stick com zona morta, segurar B corre, botões do DESIGN 3.7
  já mapeados, vibração, aviso de conectado). Câmera olha ~1,5 m à frente (compensando o atraso da suavidade) e ganha tremor.
  `BALANCE.camera` (lead…), `BALANCE.juice`, `BALANCE.pad`. Replay: +10 s com controle de mentira e a câmera no hash. Smoke: controle de mentira.
  `sim.mjs` passou a rodar no Windows.
- **s2-folego-rolamento (S2)** — Espaço/B: tocar rola, segurar corre. Rolamento (16 de fôlego, 0,55 s, invulnerável 0,08–0,38 s, 3,5 m,
  guarda de 0,25 s) com cambalhota nova no `player.js`. Fôlego espera 0,5 s para recuperar. Barra de fôlego (`hud.js`), passos,
  respiração ofegante abaixo de 25. Teclado novo guiado por `BALANCE.keys` (o do survivor mirava com o mouse). Replay +12 s.
- **s3-ataques (S3)** — leve (combo de 3: dois cortes e uma estocada) e pesado (`BALANCE.attack`), fila única com guarda de 0,25 s,
  compromisso, rolamento cancela depois do impacto, passo à frente, pausa no impacto, tremor no pesado, vibração, rastro da lâmina,
  assobio e som do golpe. Boneco de treino em (0, 2). Animações novas `thrust` e `heavy` no `kits.js`. Saiu o teste de tremor (T/Y).
- **s4-travar-alvo (S4)** — Q / botão do meio / R3 travam; roda do mouse e stick direito puxado para o lado trocam. Marca no alvo,
  câmera enquadrando os dois (afasta até 17 m), andar de frente para o alvo, golpe no alvo, solta a 18 m ou sem ver por 2 s.
  Segundo boneco em (4, 0). `BALANCE.lock`, `camera.lock*`, `move.aim` (3,4 m/s).
- **s5-romeiro (S5)** — Romeiro perdido (`enemies/enemy.js` genérico + `enemies/romeiro.js`): pancada (aviso 0,5 s, gemido) e dois
  cortes (aviso 0,45 s, rosnado), janela de punir, tropeço, morte (afunda no chão), volta para casa. Jogador leva golpe (tropeço,
  empurrão, som, tremor, vibração), morre e volta ao começo. Barra de vida (com o pedaço perdido) e barra de vida sobre o alvo travado.
  `zombie-model.js` ganhou pose vinda do jogo e mãos para armas. Um Romeiro na arena em (-8, 13).
