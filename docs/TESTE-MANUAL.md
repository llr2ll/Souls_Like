# Teste manual (poucos minutos, depois de cada PR)

Marque cada item. Se algo der errado, anote o número do item e o que aconteceu, e mande para a IA.
Cada PR acrescenta os itens dele aqui.

## Preparar (1 min)
1. No Codespaces, pegue a branch do PR (ou a `main` depois do merge) e rode `npm install`.
2. Rode `npm run dev` e abra o jogo no navegador (porta 5173).

## Checklist
| # | Teste | O que você deve ver | ✓ |
|---|---|---|---|
| 1 | **Abrir** | O peregrino (por enquanto com a roupa do Samurai) no meio de uma arena de terra, com muro baixo de pedra em volta. FPS em verde no canto | ☐ |
| 2 | **Andar** com W A S D | Ele anda nas 8 direções, vira o corpo com peso (não estala) e a câmera vai junto, suave | ☐ |
| 3 | **Correr**: segure Shift andando | Mais rápido. Correndo muito tempo ele cansa e volta a andar | ☐ |
| 4 | **Bater nas coisas**: ande contra o muro, o cruceiro, o hórreo, as árvores e as pedras | Ele para; não atravessa nada | ☐ |
| 5 | **Casa**: vá até a casa de pedra (à esquerda, mais para cima) e entre pela porta | A porta abre sozinha. Ao entrar, o telhado some e você vê os móveis | ☐ |
| 6 | **Escada**: dentro da casa, ache a escada no fundo e suba | Ele sobe para o andar de cima e o recorte mostra o andar de cima | ☐ |
| 7 | **Atrás da casa**: dê a volta e fique atrás dela | A parte da casa que tapava você fica baixinha (você continua visível) | ☐ |
| 8 | **Som**: aperte M | Liga/desliga o som (a porta faz barulho ao abrir e fechar) | ☐ |
| 9 | **Câmera olha à frente** (S1): ande reto para um lado por uns segundos, depois pare | Andando, o peregrino fica um pouco atrás do meio da tela: aparece mais chão do lado para onde ele vai. Parado, a câmera volta devagar a centralizar, sem tranco | ☐ |
| 10 | **Tremor** (S1): aperte T | A tela dá um tranco curto e fraco e volta sozinha (é o tremor de um golpe pesado; os golpes chegam no S3) | ☐ |
| 11 | **Conectar o controle** (S1): plugue (USB ou Bluetooth) e aperte qualquer botão. Use o jogo numa aba normal do Chrome ou Edge (a prévia dentro do VS Code pode não enxergar o controle) | Aviso "Controle conectado: …" no alto da tela. A ajuda no canto de baixo muda para os botões do controle | ☐ |
| 12 | **Stick esquerdo**: incline pouco, depois tudo, depois solte | Pouco: anda devagar. Tudo: anda normal. Solto: para (não fica andando sozinho) | ☐ |
| 13 | **Segure B** andando | Corre, igual ao Shift (correndo muito tempo, cansa) | ☐ |
| 14 | **Aperte Y** | Mesmo tranco do item 10 e o controle vibra rapidinho (no Firefox não vibra) | ☐ |
| 15 | **Outros botões** (A, X, RB, RT, LT, R3, direcional) | Nada acontece ainda, e o jogo não trava | ☐ |
| 16 | **Desligar o controle** (ou tirar o cabo) | Aviso "Controle desconectado". O teclado continua funcionando | ☐ |

## Anotar o FPS
O FPS aparece em verde no canto de cima, à direita. Anote depois de 1 minuto andando pela arena.

| Data | PR | FPS | Observação |
|---|---|---|---|
| | | | |

Se o FPS cair mais de 10% em relação ao PR anterior, avise a IA antes de aprovar o PR.
