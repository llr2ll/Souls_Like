# De onde veio cada peça

As peças genéricas foram **copiadas** do survivor, sem reescrever. Assim, uma correção pode ir de um jogo para o outro à mão.

- **Repositório de origem:** `llr2ll/Zombie_Survivor` (antes chamado `llr2ll/Game`). Só leitura: nunca criar branch, commit ou PR nele.
- **Commit de origem:** `e4314ee` (31/10/2026, ponta da branch `j7b-classes`, a última das branches empilhadas da fundação + J1–J7b).
  Na época, a `main` do survivor (`ad90e45`) ainda não tinha a fundação. Nesse commit, o `npm run check` do survivor passava.

**Regra:** arquivo copiado e depois alterado entra na tabela "Copiados com mudança", com o que mudou.
Arquivo novo que nasceu de um trecho do survivor entra em "Trechos copiados".
Para conferir se um arquivo continua igual: `git diff --no-index <survivor>/src/<arquivo> src/<arquivo>`.

## Copiados sem mudança (S0)
| Arquivo | O que é |
|---|---|
| `src/engine/core/loop.js` | Laço de desenho (`THREE.Timer`, dt ≤ 0,05) |
| `src/engine/core/events.js` | Avisos entre partes (`door-open`, `door-close`…) |
| `src/engine/core/memo.js` | Cache com limite |
| `src/engine/render/style.js` | Visual diorama: cores por vértice, malhas fundidas, vento na placa de vídeo |
| `src/engine/render/light.js` | Céu, névoa, luz |
| `src/engine/render/follow.js` | Contador de FPS (e a câmera do survivor, `SmoothFollow`, que este jogo não usa) |
| `src/engine/render/entity-shadows.js` | Sombras falsas sob os personagens |
| `src/engine/world/collision.js` | Colisão em grade |
| `src/engine/world/pathing.js` | Desvio de obstáculos, A*, rota dentro de casas |
| `src/engine/world/noise.js` | Ruído e sorteio fixo por posição |
| `src/engine/input/contract.js` | Contrato de input (só ganha coisas, nunca muda) |
| `src/engine/audio/engine.js` | Motor de som procedural |
| `src/shared/characters/player.js` | Esqueleto e animação do personagem |
| `src/shared/characters/looks.js` | Visual das 4 classes do survivor (o peregrino vem depois) |
| `src/shared/characters/kits.js` | Armas e poses por quadros-chave, IK das mãos |
| `src/shared/creatures/zombie-model.js` | Humanoide articulado (12 variações): base dos inimigos (S5) |
| `src/shared/fx/effects.js` | Anéis, arcos, faíscas |
| `src/shared/audio/sfx.js` | Efeitos sonoros |
| `src/shared/worldgen/buildings.js` | Casas, andares, escadas, móveis |
| `src/shared/worldgen/assets.js` | Árvores, pedras, cruceiro, hórreo, poço |
| `src/shared/worldgen/climate.js` | Clima e hora do dia (ainda não ligado; volta no S13 com hora e névoa fixas por área) |

## Copiados com mudança (S0)
| Arquivo | O que mudou | Por quê |
|---|---|---|
| `src/shared/characters/player-movement.js` | Altura do chão e da água vêm de `engine/world/ground.js` em vez de `worldgen/sidewalk.js` e `worldgen/water.js`. `WATER_Y` virou `WaterY()` (2 lugares) | O chão do survivor vinha do gerador infinito (estradas, terreno, água: 5 arquivos). Aqui o mapa é feito à mão |
| `src/shared/fx/gore.js` | `GroundAt` e `WaterDepth` vêm de `engine/world/ground.js` | Mesmo motivo |
| `src/shared/worldgen/buildings-registry.js` | `CAM_SLOPE` virou ajustável: `SetCameraSlope(s)` (padrão igual ao survivor, 1,45) | A câmera deste jogo é mais baixa (~50° em vez de ~56°); o recorte do telhado precisa saber |
| `src/shared/worldgen/names.js` | Saíram `RoadCode` e `Destination` e o import de `worldgen/layout.js` | Dependiam do mapa de estradas. Ficaram as listas de nomes, `NodeName` e `StreetName` |
| `src/engine/input/keyboard.js` | Tecla H: `getElementById('room')?.` (com `?`) | Este jogo não tem a caixa da sala; sem o `?`, apertar H dava erro |

## Arquivos novos
| Arquivo | O que é |
|---|---|
| `src/engine/world/ground.js` | Altura do chão e da água que o jogo informa (`SetGround`). Padrão: chão plano, sem água |

## Trechos copiados
| Arquivo novo | De onde | O que mudou |
|---|---|---|
| `src/game/world/place-house.js` | `src/shared/worldgen/generator.js` do survivor, trecho "casas" (malha + recortes + porta + colisores + registro) | Vira uma função para uma casa só. A altura vem de `GroundAt` (em vez de `Height` do terreno). Sem as sombras falsas do chunk |
| `scripts/check.mjs` | `scripts/check.mjs` do survivor | Camadas `game → shared → engine` (em vez de `games/<jogo>`); sem a verificação do mundo infinito |
| `scripts/sim.mjs` | `scripts/sim.mjs` do survivor | Mesmo mecanismo (sorteio e relógio fixos); roteiro deste jogo |
| `scripts/smoke.mjs` | `scripts/smoke.mjs` do survivor | Sem relay, celular e menu; `SMOKE_CHROME` para usar um Chrome já instalado |

## Ainda no survivor, para quando precisar
Tela dividida (`engine/render/splitscreen.js`), menu de vagas (`engine/ui/lobby.js`), relay (`server/`), celular (`engine/input/phone.js`):
voltam com o co-op, depois da demo. Som ambiente (`shared/audio/soundscape.js`): depende do mundo infinito, fica para o S13.
