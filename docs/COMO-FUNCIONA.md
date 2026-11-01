# Como o jogo funciona (sem código)

## A ideia em uma frase
O jogo roda inteiro no navegador do PC. Você joga com teclado e mouse ou com controle de videogame (Xbox ou PlayStation, USB ou Bluetooth).
Não tem servidor nem celular: isso só volta no co-op, depois da demo.

## De onde vieram as peças
Muita coisa já existia no seu outro jogo, o survivor ("A paróquia sitiada"). Em vez de refazer, a IA **copiou** as peças prontas:
o corpo e as animações do personagem, as casas com porta e escada, a colisão, o som, os efeitos, o visual de diorama.
O arquivo `docs/ORIGEM.md` lista cada peça copiada e o que mudou nela. Assim, se um defeito for corrigido num jogo, dá para levar a correção para o outro.

## O que cada pasta faz
O código está dividido em **3 andares**, como um prédio. Quem está em cima pode usar o que está embaixo, nunca o contrário.
O comando `npm run check` confere essa regra sozinho.

| Andar | Pasta | O que tem | Por que separar |
|---|---|---|---|
| 🏗️ Térreo: o motor | `src/engine/` | Desenhar, luz, ler o teclado, som, colisão, altura do chão | Não sabe que existe peregrino nem inimigo |
| 🧱 1º andar: peças prontas | `src/shared/` | Personagem e animações, o boneco dos inimigos, casas, cruceiro, hórreo, árvores, efeitos, sons | Copiadas do survivor |
| 🎮 2º andar: este jogo | `src/game/` | As regras do souls-like: o jogador, a câmera, a arena (depois: combate, inimigos, cruceiros, a área da demo) | As regras ficam todas num lugar só |

| Pasta / arquivo | O que faz | Exemplo do que você vê |
|---|---|---|
| `index.html`, `main.css` | A página do jogo | O FPS em verde no canto |
| `src/game/main.js` | Liga todas as peças | — |
| `src/game/config/balance.js` | **Todos os números para ajustar o jogo** | Velocidade de andar, altura da câmera |
| `src/game/camera.js` | A câmera vista de cima | A câmera seguindo o peregrino |
| `src/game/world/` | O mapa (hoje, a arena de teste) | O muro de pedra, a casa, o cruceiro |
| `scripts/` | Testes automáticos: `check` (andares + replay) e `smoke` (abre o jogo e procura erros) | — |
| `smoke/` | Fotos e anotações do último teste automático | As capturas no PR |
| `docs/` | Documentos para você | Este arquivo |

## Controle de videogame
- Plugue o controle e **aperte qualquer botão**: o navegador só "enxerga" o controle depois disso. Aparece "Controle conectado" no alto da tela.
- O controle e o teclado mexem o mesmo peregrino. Dá para trocar de um para o outro a qualquer hora.
- Os botões já seguem o plano (DESIGN 3.7), mas cada um só ganha efeito no PR dele (atacar no S3, travar no S4…).
- Vibração: funciona no Chrome e no Edge. No Firefox o controle funciona, mas não vibra.

## Os mapas
- O jogo abre no **Val de Santa Baia**, a área da demo (S9, ainda em blocos simples: a arte vem no S13).
- Com `?arena` no fim do endereço, abre a **arena de teste** (onde nasceram o rolamento, os golpes e o Romeiro).
- Cada mapa tem o seu save.

## Progresso salvo
- O jogo salva sozinho no navegador ao descansar no cruceiro, ao morrer e ao pegar a cera. Fechou a página e abriu: continua.
- Para começar do zero, abra o jogo com `?novo` no fim do endereço (ex.: `https://…-5173.app.github.dev/?novo`).
- O save fica no navegador em que você jogou (outro navegador ou outro computador começa do zero).

## Como ajustar o jogo
Todos os números ficam num arquivo só: **`src/game/config/balance.js`**.
Cada linha tem um comentário dizendo o que muda. Mude um número, salve, e o jogo recarrega sozinho (com `npm run dev` rodando).
Exemplos:
- Quer a câmera mais longe? Aumente `height` e `back` em `camera`.
- A câmera olhando à frente incomoda? Diminua `lead` em `camera` (0 desliga).
- Tremor forte demais? Diminua `scale` em `juice.shake` (0 desliga). Vibração: `scale` em `juice.rumble`.
- O boneco anda sozinho com o controle parado (stick gasto)? Aumente `dead` em `pad`.
- Trocar um botão do controle: em `pad`, troque o nome do botão (A, B, X, Y, LB, RB, LT, RT, L3, R3, UP, DOWN, LEFT, RIGHT).
  Teclas do teclado: em `keys`, do mesmo jeito.
- Rolamento longo ou curto demais? `distance` em `roll`. Mais rápido? Diminua `time`. Mais "perdão"? Aumente o fim de `safe`.
- Fôlego acaba rápido? Diminua `stamina` em `roll` (gasto por rolamento) ou `staminaRun` em `move` (gasto correndo).
- Golpes: em `attack`, cada golpe tem duração (`time`), o instante em que machuca (`hit`), dano, alcance, abertura e gasto de fôlego.
  A "travadinha" no acerto é `juice.hitStop` (0 desliga); o rastro da lâmina é `juice.trail`.
- Travar no alvo: alcance e distância de soltar em `lock`. Quanto a câmera se afasta travada: `lockMax` em `camera`.
  Andar travado mais rápido: `aim` em `move`.
- Romeiro: tudo em `romeiro` (vida, velocidade, quanto enxerga). Cada golpe dele em `attacks`: `warn` é o aviso (mais alto = mais
  fácil), `recover` é a janela para punir, `dmg` o dano. Onde ele fica: `maps` → o mapa → `enemies`.
- Escudo: `guard` (velocidade, quanto fôlego cada golpe segurado gasta). Aparo: `parry.window` (maior = mais fácil).
- Postura: `posture` (quanto tempo até esvaziar) e, no inimigo, `posture` e `broken` (quanto tempo fica de joelhos).
  Golpe crítico: `critical`.
- Cura: `gourd` (goles, quanto cura, em que instante a cura entra) e `bread`. Andar bebendo: `usingSpeed`.
  A borda vermelha de pouca vida: `hud.danger`.
- Cruceiro: `maps` → o mapa → `cruceiros` (onde ficam) e `rest` (distância para descansar). Cera de cada inimigo: `cera` dentro dele (ex.: `romeiro.cera`).
  Tempo da tela escura ao morrer: `hurt.respawn`.
- O vale: em `maps` → `demo` ficam a largada, os cruceiros, onde cada romeiro fica, os pães e os textos dos achados
  (dá para reescrever os textos ali). O desenho do lugar (muros, casas, árvores) fica em `src/game/world/santa-baia.js`.

## Como testar
- Depois de cada PR: siga `docs/TESTE-MANUAL.md` (poucos minutos).
- A IA roda `npm run check` e `npm run smoke` antes de cada PR e põe as capturas na descrição.
- O `npm run check` também roda um **replay**: o jogador faz sempre os mesmos movimentos e o resultado tem de dar igual.
  Se uma mudança que não devia mexer no jogo mudar o resultado, ele avisa.
